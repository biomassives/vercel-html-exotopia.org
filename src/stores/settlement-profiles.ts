import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'

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

  return {
    myProfiles, currentProfile, loading,
    loadMyProfiles, getProfileBySlug, createProfile, updateProfile,
  }
})
