import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'
import { logModAttempt, updateModOutcome } from 'src/lib/admin-mod-log'

const AUTOSYNC_KEY = 'exo.admin-settlement-autosync'

export type SettlementProfileStatus = 'published' | 'archived'

export interface SettlementProfile {
  id: string
  owner_id: string
  public_slug: string
  exolocation: string
  display_name: string
  focus: string
  description: string | null
  technology_keys: string[]
  status: SettlementProfileStatus
  created_at: string
  updated_at: string
}

/**
 * Public-facing counterpart to the local-only SettlementRecord
 * (src/lib/settlements.ts). See supabase/migrations/012_settlement_profiles.sql
 * for the schema and RLS — public read for published rows, owner-only write,
 * rate-limited creation.
 */
export const useSettlementProfilesStore = defineStore('settlement-profiles', () => {
  const myProfiles     = ref<SettlementProfile[]>([])
  const currentProfile = ref<SettlementProfile | null>(null)
  const loading        = ref(false)

  // ── Admin (AdminSettlementProfilesPage.vue) ──────────────────────────────
  const adminProfiles   = ref<SettlementProfile[]>([])
  let storedAutosync    = false
  try { storedAutosync = localStorage.getItem(AUTOSYNC_KEY) === '1' } catch { /* private mode etc. */ }
  const autosyncEnabled = ref(storedAutosync)

  function setAutosyncEnabled(v: boolean) {
    autosyncEnabled.value = v
    try { localStorage.setItem(AUTOSYNC_KEY, v ? '1' : '0') } catch { /* quota / private mode */ }
  }

  async function loadMyProfiles() {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const { data } = await supabase.from('settlement_profiles').select('*')
      .eq('owner_id', member.userId).order('created_at', { ascending: false })
    myProfiles.value = (data as SettlementProfile[]) ?? []
  }

  /** Public — no sign-in required. Used by SettlementProfilePage.vue. */
  async function getProfileBySlug(slug: string): Promise<SettlementProfile | null> {
    if (!supabase) return null
    loading.value = true
    const { data } = await supabase.from('settlement_profiles').select('*')
      .eq('public_slug', slug).maybeSingle()
    loading.value = false
    currentProfile.value = (data as SettlementProfile) ?? null
    return currentProfile.value
  }

  /**
   * Public — no sign-in required. Used by SettlementDirectoryPage.vue.
   * RLS (migration 012) already allows anyone to read status = 'published'
   * rows, so this is a plain filtered select — no new policy needed.
   */
  async function listPublishedProfiles(opts: {
    limit?:  number
    offset?: number
    focus?:  string | null
  } = {}): Promise<SettlementProfile[]> {
    if (!supabase) return []
    const { limit = 24, offset = 0, focus = null } = opts
    let q = supabase.from('settlement_profiles').select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (focus) q = q.eq('focus', focus)
    const { data } = await q
    return (data as SettlementProfile[]) ?? []
  }

  async function createProfile(input: {
    exolocation:     string
    displayName:     string
    focus:           string
    description?:    string
    technologyKeys?: string[]
  }): Promise<SettlementProfile | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('settlement_profiles').insert({
      owner_id:        member.userId,
      exolocation:     input.exolocation,
      display_name:    input.displayName,
      focus:           input.focus,
      description:     input.description ?? null,
      technology_keys: input.technologyKeys ?? [],
    }).select().single()
    if (error || !data) return null
    myProfiles.value = [data as SettlementProfile, ...myProfiles.value]
    return data as SettlementProfile
  }

  async function updateProfile(
    id: string,
    patch: Partial<Pick<SettlementProfile, 'display_name' | 'focus' | 'description' | 'technology_keys' | 'status'>>,
  ): Promise<boolean> {
    if (!supabase) return false
    const { data, error } = await supabase.from('settlement_profiles').update(patch)
      .eq('id', id).select().single()
    if (error || !data) return false
    myProfiles.value = myProfiles.value.map(p => p.id === id ? (data as SettlementProfile) : p)
    if (currentProfile.value?.id === id) currentProfile.value = data as SettlementProfile
    return true
  }

  /**
   * All profiles (any status), for admin moderation (AdminSettlementProfilesPage.vue).
   * RLS's settlement_profiles_read policy only returns every row to an
   * actual admin — same "UI gating is UX only" shape as community_nodes.
   */
  async function fetchAllProfilesForAdmin(): Promise<SettlementProfile[]> {
    if (!supabase) return []
    const { data, error } = await supabase.from('settlement_profiles').select('*')
      .order('created_at', { ascending: false })
    const rows = error || !data ? [] : (data as SettlementProfile[])
    adminProfiles.value = rows
    return rows
  }

  /**
   * Admin-only status set (archive/restore). Unlike community_nodes'
   * setNodeStatusAsAdmin, this one is reachable offline: a raw fetch (not
   * the shared supabase-js client, so a per-call header can be attached)
   * hits the REST endpoint directly. When autosyncEnabled is on, the
   * X-Exo-Admin-Autosync header is set, which matches the Background Sync
   * runtimeCaching route in quasar.config.js — a failed PATCH is queued by
   * the service worker and retried once connectivity returns. When off
   * (default), a failed PATCH is just a failed PATCH, same as community_nodes
   * today. Either way, every attempt is written to the local mod-log first
   * (src/lib/admin-mod-log.ts) so nothing an admin clicked disappears
   * silently — the log entry's outcome is the trustworthy signal, since
   * workbox's BackgroundSyncPlugin still rejects the in-page fetch promise
   * even when it successfully queues the request for retry.
   */
  async function setProfileStatusAsAdmin(
    id: string, status: SettlementProfileStatus, label: string,
  ): Promise<{ ok: boolean; queued: boolean }> {
    const actorId = useMemberStore().userId ?? null
    const logId = logModAttempt({
      actorId, targetTable: 'settlement_profiles', targetId: id, targetLabel: label,
      fromStatus: null, toStatus: status,
    })

    const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
    const anonKey = import.meta.env.VITE_SUPABASE_ANON as string | undefined
    if (!supabase || !baseUrl || !anonKey) { updateModOutcome(logId, 'failed'); return { ok: false, queued: false } }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token ?? anonKey

    try {
      const res = await fetch(`${baseUrl}/rest/v1/settlement_profiles?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=minimal',
          ...(autosyncEnabled.value ? { 'X-Exo-Admin-Autosync': '1' } : {}),
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) { updateModOutcome(logId, 'failed'); return { ok: false, queued: false } }
      adminProfiles.value = adminProfiles.value.map(p => p.id === id ? { ...p, status } : p)
      updateModOutcome(logId, 'applied')
      return { ok: true, queued: false }
    } catch {
      // fetch rejected — offline (or the SW's Background Sync route caught
      // and queued it, per the doc comment above; either way this rejects).
      const queued = autosyncEnabled.value
      updateModOutcome(logId, queued ? 'queued' : 'failed')
      return { ok: false, queued }
    }
  }

  return {
    myProfiles, currentProfile, loading,
    loadMyProfiles, getProfileBySlug, listPublishedProfiles, createProfile, updateProfile,
    // Admin
    adminProfiles, autosyncEnabled, setAutosyncEnabled,
    fetchAllProfilesForAdmin, setProfileStatusAsAdmin,
  }
})
