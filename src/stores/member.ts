import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Member, type Connection } from 'src/lib/supabase'
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

  return {
    session, profile, connections, loading, error, blockedIds,
    isSignedIn, userId, connectedIds,
    init, sendMagicLink, signOut, createProfile,
    sendGreenLight, acceptGreenLight, blockMember, unblockMember,
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
