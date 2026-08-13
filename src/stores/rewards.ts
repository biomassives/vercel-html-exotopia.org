import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'
import {
  POINTS,
  SETTLEMENT_OBJECTS,
  QUIZ_REWARD_MAP,
  VOLUNTEER_CERTIFICATE_THRESHOLD,
  MENTOR_CYCLE_THRESHOLD,
  PFAS_RESEARCHER_LOG_THRESHOLD,
} from 'src/data/rewards-catalog'

export type RewardTrack = 'volunteering' | 'finance_literacy' | 'educating_others'

export interface RewardEvent {
  id:         string
  member_id:  string
  track:      RewardTrack
  action_key: string
  points:     number
  metadata:   Record<string, unknown>
  created_at: string
}

export interface Certificate {
  id:                     string
  member_id:              string
  certificate_type:       string
  settlement_object_key:  string | null
  source_event_id:        string | null
  issued_at:              string
}

export interface MentorSession {
  id:               string
  mentor_id:        string
  mentee_id:        string
  topic:            string
  confirmed_mentor: boolean
  confirmed_mentee: boolean
  created_at:       string
  confirmed_at:     string | null
}

export const useRewardsStore = defineStore('rewards', () => {
  const rewardEvents   = ref<RewardEvent[]>([])
  const certificates   = ref<Certificate[]>([])
  const mentorSessions = ref<MentorSession[]>([])
  const loading        = ref(false)
  const error          = ref<string | null>(null)
  const isAdmin        = ref(false)

  const totalPoints = computed(() =>
    rewardEvents.value.reduce((sum, e) => sum + e.points, 0)
  )

  const pointsByTrack = computed<Record<RewardTrack, number>>(() => {
    const out: Record<RewardTrack, number> = { volunteering: 0, finance_literacy: 0, educating_others: 0 }
    for (const e of rewardEvents.value) out[e.track] += e.points
    return out
  })

  const certificateTypes = computed(() => new Set(certificates.value.map(c => c.certificate_type)))

  const unlockedObjects = computed(() =>
    certificates.value
      .map(c => c.settlement_object_key)
      .filter((k): k is string => !!k)
      .map(k => SETTLEMENT_OBJECTS[k])
      .filter((o): o is NonNullable<typeof o> => !!o)
  )

  interface ThresholdProgress { current: number; target: number; done: boolean }

  const volunteerProgress = computed<ThresholdProgress>(() => ({
    current: pointsByTrack.value.volunteering,
    target:  VOLUNTEER_CERTIFICATE_THRESHOLD,
    done:    certificateTypes.value.has('field_volunteer'),
  }))

  const mentorProgress = computed<ThresholdProgress>(() => {
    const myId = useMemberStore().userId
    const confirmed = myId
      ? mentorSessions.value.filter(s => s.mentor_id === myId && s.confirmed_at).length
      : 0
    return {
      current: confirmed,
      target:  MENTOR_CYCLE_THRESHOLD,
      done:    certificateTypes.value.has('mentorship'),
    }
  })

  const pendingMentorConfirmations = computed(() => {
    const myId = useMemberStore().userId
    if (!myId) return []
    return mentorSessions.value.filter(s => {
      if (s.confirmed_at) return false
      if (s.mentor_id === myId) return !s.confirmed_mentor
      if (s.mentee_id === myId) return !s.confirmed_mentee
      return false
    })
  })

  async function loadMyRewards() {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    loading.value = true
    const [events, certs, sessions] = await Promise.all([
      supabase.from('reward_events').select('*').eq('member_id', member.userId).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('member_id', member.userId),
      supabase.from('mentor_sessions').select('*').or(`mentor_id.eq.${member.userId},mentee_id.eq.${member.userId}`),
    ])
    rewardEvents.value   = (events.data as RewardEvent[]) ?? []
    certificates.value   = (certs.data as Certificate[]) ?? []
    mentorSessions.value = (sessions.data as MentorSession[]) ?? []
    error.value = events.error?.message ?? certs.error?.message ?? sessions.error?.message ?? null
    loading.value = false
    void checkIsAdmin()
  }

  /** admin_members is public-read (small allow-list, not sensitive) — safe to check client-side for UI gating. Real enforcement is the is_admin() RLS check on the server. */
  async function checkIsAdmin() {
    const member = useMemberStore()
    if (!supabase || !member.userId) { isAdmin.value = false; return }
    const { data } = await supabase.from('admin_members').select('member_id').eq('member_id', member.userId).maybeSingle()
    isAdmin.value = !!data
  }

  /** Search members by handle/display name — used by the admin grant-reward form. */
  async function searchMembers(query: string): Promise<{ id: string; handle: string; display_name: string }[]> {
    if (!supabase || query.trim().length < 2) return []
    const { data } = await supabase
      .from('members')
      .select('id, handle, display_name')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)
    return data ?? []
  }

  /**
   * Certificates are no longer issued by the client. Migration 007 revoked
   * INSERT on `certificates` — a self-issuable credential is not a credential,
   * and 'mentorship' in particular is framed in compliance/digital-credentials-law
   * as carrying real-world standing.
   *
   * Issuance is derived server-side from ledger state by refresh_certificates(),
   * which every award RPC calls. Callers that previously asked for a certificate
   * now just re-read: if the threshold was crossed, the row is already there.
   */
  async function issueCertificate(_certificateType: string, _settlementObjectKey: string) {
    await loadMyRewards()
  }

  /** Called after a quiz completes in LearnPage.vue — awards points + certificate if the area maps to a reward and the score clears the threshold. */
  async function awardQuizCompletion(areaId: string, score: number, _total: number) {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    // Threshold, prerequisite chain, point value and the one-shot rule are all
    // enforced in award_quiz_completion(). The client no longer decides any of
    // them; QUIZ_REWARD_MAP is now display metadata only.
    const { error: e } = await supabase.rpc('award_quiz_completion', {
      p_area_id: areaId,
      p_score:   score,
    })
    if (e) { error.value = e.message; return }
    await loadMyRewards()
  }

  /**
   * Log a volunteering action — either auto-fired on a real eco-ops sync
   * (actionKey: 'eco_submission') or from the self-report fallback in
   * RewardsPage.vue (e.g. actionKey: 'plastic_collection_kg'). Both paths
   * go through the same ledger; eco_ops-backed tables don't exist yet
   * (see plan non-goals), so self-report is the only reliable path today.
   */
  async function logVolunteerAction(actionKey: string, metadata: Record<string, unknown> = {}) {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    // Points come from points_catalog server-side; the daily cap and the
    // self_reported flag are enforced there too. Passing a point value from
    // here is no longer possible.
    const { error: e } = await supabase.rpc('award_self_reported', {
      p_action_key: actionKey,
      p_metadata:   metadata,
    })
    if (e) { error.value = e.message; return }
    await loadMyRewards()
  }

  /** Self-serve credit for the educating_others track outside mentor sessions — e.g. publishing a public method proposal. Same client-trust model as logVolunteerAction. */
  async function logEducatingAction(actionKey: string, metadata: Record<string, unknown> = {}) {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const { error: e } = await supabase.rpc('award_self_reported', {
      p_action_key: actionKey,
      p_metadata:   metadata,
    })
    if (e) { error.value = e.message; return }
    await loadMyRewards()
  }

  /**
   * Charge a settlement-item construction cost against the finance_literacy
   * track. Deliberately debt-permissive — see migration 014_construction_
   * ledger.sql: points carry no real-world value, so a negative balance here
   * is a safe first encounter with "you spent more than you have," meant to
   * point toward the PFIN-8/PFIN-28 quizzes (LearnPage.vue) that pay real
   * points back in. The cost itself is never sent from the client — the RPC
   * looks it up server-side from construction_catalog, keyed by item_key.
   */
  async function debitConstruction(itemKey: string, metadata: Record<string, unknown> = {}): Promise<boolean> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return false
    const { error: e } = await supabase.rpc('debit_construction', {
      p_item_key: itemKey,
      p_metadata: metadata,
    })
    if (e) { error.value = e.message; return false }
    await loadMyRewards()
    return true
  }

  async function requestMentorSession(menteeId: string, topic: string) {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const { data, error: e } = await supabase.from('mentor_sessions').insert({
      mentor_id: member.userId,
      mentee_id: menteeId,
      topic,
    }).select().single()
    if (!e && data) mentorSessions.value = [...mentorSessions.value, data as MentorSession]
  }

  /**
   * Minimal-disclosure youth check (018_member_participation_mode.sql) —
   * before requesting to mentor someone, the prospective mentor can see
   * *whether* the mentee is a youth participant (not their full record).
   * Used by RewardsPage.vue to gate the request behind an explicit
   * acknowledgment rather than letting it happen invisibly either way.
   */
  async function checkMenteeIsYouth(menteeId: string): Promise<boolean> {
    if (!supabase) return false
    const { data } = await supabase.rpc('is_youth_participant', { p_member_id: menteeId })
    return data === true
  }

  /** Confirms the current member's side of a mentor session. Reward emission happens server-side (see 002_rewards.sql triggers). */
  async function confirmMentorSession(sessionId: string) {
    const member = useMemberStore()
    const session = mentorSessions.value.find(s => s.id === sessionId)
    if (!supabase || !member.userId || !session) return
    const patch = session.mentor_id === member.userId
      ? { confirmed_mentor: true }
      : { confirmed_mentee: true }
    const { data, error: e } = await supabase
      .from('mentor_sessions').update(patch).eq('id', sessionId).select().single()
    if (!e && data) {
      mentorSessions.value = mentorSessions.value.map(s => s.id === sessionId ? (data as MentorSession) : s)
      await loadMyRewards()   // pick up the server-emitted reward_events/certificates if this closed the loop
    }
  }

  /** Admin-only (enforced by RLS is_admin()). Migration 007 additionally caps
   *  `points` at the points_catalog value for the action_key, so a compromised
   *  admin session can't mint an unbounded balance. */
  async function adminGrantReward(memberId: string, track: RewardTrack, actionKey: string, points: number, metadata: Record<string, unknown> = {}) {
    if (!supabase) return
    await supabase.from('reward_events').insert({ member_id: memberId, track, action_key: actionKey, points, metadata })
  }

  return {
    rewardEvents, certificates, mentorSessions, loading, error, isAdmin,
    totalPoints, pointsByTrack, certificateTypes, unlockedObjects, pendingMentorConfirmations,
    volunteerProgress, mentorProgress,
    loadMyRewards, awardQuizCompletion, logVolunteerAction, logEducatingAction,
    debitConstruction,
    requestMentorSession, confirmMentorSession, checkMenteeIsYouth, adminGrantReward,
    checkIsAdmin, searchMembers, issueCertificate,
  }
})
