import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Member, type Connection, type DeletionRequest } from 'src/lib/supabase'
import type { Session } from '@supabase/supabase-js'

const BLOCK_STORAGE_KEY = 'scd_blocked_members'

function loadBlockedIds (): Set<string> {
  try {
    const raw = localStorage.getItem(BLOCK_STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveBlockedIds (ids: Set<string>) {
  try { localStorage.setItem(BLOCK_STORAGE_KEY, JSON.stringify([...ids])) } catch { /* quota */ }
}

export const useMemberStore = defineStore('member', () => {
  const session     = ref<Session | null>(null)
  const profile     = ref<Member | null>(null)
  const connections = ref<Connection[]>([])
  const loading     = ref(false)
  const error       = ref<string | null>(null)
  const blockedIds  = ref<Set<string>>(loadBlockedIds())

  const isSignedIn  = computed(() => !!session.value)
  const userId      = computed(() => session.value?.user?.id ?? null)

  const connectedIds = computed<string[]>(() => {
    if (!userId.value) return []
    return connections.value
      .filter(c => c.status === 'accepted')
      .map(c => (c.from_id === userId.value ? c.to_id : c.from_id))
  })

  async function init () {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (session.value) await _loadProfile()

    supabase.auth.onAuthStateChange(async (_event, s) => {
      session.value = s
      if (s) {
        await _loadProfile()
      } else {
        profile.value     = null
        connections.value = []
      }
    })
  }

  async function _loadProfile () {
    if (!supabase || !userId.value) return
    const { data: prof } = await supabase
      .from('members')
      .select('*')
      .eq('id', userId.value)
      .single()
    profile.value = prof ?? null

    const { data: conns } = await supabase
      .from('connections')
      .select('*')
      .or(`from_id.eq.${userId.value},to_id.eq.${userId.value}`)
    connections.value = conns ?? []

    // Sync server-side block list on login (requires blocked_members table — see SPEC §14)
    const { data: blocks } = await supabase
      .from('blocked_members')
      .select('blocked_id')
      .eq('blocker_id', userId.value)
    if (blocks?.length) {
      const serverIds = new Set((blocks as { blocked_id: string }[]).map(b => b.blocked_id))
      blockedIds.value = new Set([...blockedIds.value, ...serverIds])
      saveBlockedIds(blockedIds.value)
    }
  }

  async function sendMagicLink (email: string) {
    if (!supabase) return false
    error.value   = null
    loading.value = true
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    error.value   = e?.message ?? null
    loading.value = false
    return !e
  }

  async function signOut () {
    await supabase?.auth.signOut()
  }

  async function createProfile (handle: string, displayName: string) {
    if (!supabase || !userId.value) return
    const { error: e } = await supabase.from('members').insert({
      id:           userId.value,
      handle:       handle.toLowerCase().trim(),
      display_name: displayName.trim(),
      avatar_color: HANDLE_COLORS[handle.toLowerCase()] ?? '#00e5ff',
    })
    if (!e) await _loadProfile()
    return !e
  }

  async function sendGreenLight (toId: string) {
    if (!supabase || !userId.value) return
    const from = userId.value < toId ? userId.value : toId
    const to   = userId.value < toId ? toId         : userId.value
    await supabase.from('connections').insert({ from_id: from, to_id: to, status: 'pending' })
    await _loadProfile()
  }

  async function acceptGreenLight (fromId: string) {
    if (!supabase || !userId.value) return
    await supabase
      .from('connections')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .or(`from_id.eq.${fromId},to_id.eq.${fromId}`)
      .or(`from_id.eq.${userId.value},to_id.eq.${userId.value}`)
    await _loadProfile()
  }

  async function blockMember (targetId: string) {
    blockedIds.value = new Set([...blockedIds.value, targetId])
    saveBlockedIds(blockedIds.value)
    if (supabase && userId.value) {
      void supabase.from('blocked_members').insert({
        blocker_id: userId.value,
        blocked_id: targetId,
      })
    }
  }

  async function unblockMember (targetId: string) {
    blockedIds.value.delete(targetId)
    blockedIds.value = new Set(blockedIds.value)
    saveBlockedIds(blockedIds.value)
    if (supabase && userId.value) {
      void supabase.from('blocked_members')
        .delete()
        .eq('blocker_id', userId.value)
        .eq('blocked_id', targetId)
    }
  }

  // ── Data rights (ARCO: Access / Cancellation) ────────────────────────────
  // See RISK_REDUCTION_RECOMMENDATIONS.md §6/§7 and legal-privacy.md §8 —
  // these were promised in the Privacy Policy without an in-product way to
  // exercise them. Deletion can't be performed client-side (needs the
  // Supabase Admin API / service-role key, which must never ship to the
  // browser) — see supabase/migrations/004_deletion_requests.sql for why a
  // queued request is the correct shape here, not a direct DELETE.

  /** Fetches every row this member owns/authored across the schema, for a
   * self-service "export my data" download. Best-effort per table — one
   * table failing (e.g. RLS misconfigured) doesn't block the others. */
  async function exportMyData(): Promise<Record<string, unknown>> {
    if (!supabase || !userId.value) return {}
    const uid = userId.value
    const tables: Array<[string, () => Promise<{ data: unknown }>]> = [
      ['profile',              () => supabase!.from('members').select('*').eq('id', uid).single()],
      ['connections',          () => supabase!.from('connections').select('*').or(`from_id.eq.${uid},to_id.eq.${uid}`)],
      ['comments',             () => supabase!.from('comments').select('*').eq('author_id', uid)],
      ['reactions',            () => supabase!.from('reactions').select('*').eq('member_id', uid)],
      ['reward_events',        () => supabase!.from('reward_events').select('*').eq('member_id', uid)],
      ['certificates',         () => supabase!.from('certificates').select('*').eq('member_id', uid)],
      ['mentor_sessions',      () => supabase!.from('mentor_sessions').select('*').or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`)],
      ['focus_areas_created',  () => supabase!.from('focus_areas').select('*').eq('created_by', uid)],
      ['decon_projects_owned', () => supabase!.from('decon_projects').select('*').eq('owner_id', uid)],
      ['project_log_entries',  () => supabase!.from('project_log_entries').select('*').eq('author_id', uid)],
      ['method_proposals',     () => supabase!.from('method_proposals').select('*').eq('author_id', uid)],
      ['proposal_endorsements',() => supabase!.from('proposal_endorsements').select('*').eq('member_id', uid)],
      ['branch_settlements',   () => supabase!.from('branch_settlements').select('*').eq('owner_id', uid)],
      ['community_nodes',      () => supabase!.from('community_nodes').select('*').eq('owner_id', uid)],
    ]
    const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), memberId: uid }
    for (const [key, run] of tables) {
      try { out[key] = (await run()).data } catch { out[key] = null }
    }
    return out
  }

  async function requestDeletion(note?: string) {
    if (!supabase || !userId.value) return false
    const { error: e } = await supabase.from('deletion_requests').insert({
      member_id: userId.value, note: note || null,
    })
    return !e
  }

  async function getMyDeletionRequests(): Promise<DeletionRequest[]> {
    if (!supabase || !userId.value) return []
    const { data } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('member_id', userId.value)
      .order('requested_at', { ascending: false })
    return (data as DeletionRequest[]) ?? []
  }

  async function cancelDeletionRequest(id: string) {
    if (!supabase || !userId.value) return false
    const { error: e } = await supabase
      .from('deletion_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('member_id', userId.value)
    return !e
  }

  return {
    session, profile, connections, loading, error, blockedIds,
    isSignedIn, userId, connectedIds,
    init, sendMagicLink, signOut, createProfile,
    sendGreenLight, acceptGreenLight, blockMember, unblockMember,
    exportMyData, requestDeletion, getMyDeletionRequests, cancelDeletionRequest,
  }
})

export const HANDLE_COLORS: Record<string, string> = {
  greg:   '#00e5ff',
  rank:   '#44ff88',
  curt:   '#ff6644',
  evans:  '#7c4dff',
  megan:  '#ff4db8',
  kelly:  '#ffcc44',
  ananda: '#4dd9ff',
}

export function initials (name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
