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

  /** Public wrapper — lets other domain stores (e.g. PFAS citizen science) issue a certificate for the current member once they've determined a threshold is crossed, without duplicating the idempotency check. */
  async function issueCertificate(certificateType: string, settlementObjectKey: string) {
    await issueCertificateIfMissing(certificateType, settlementObjectKey)
  }

  /** Issue a certificate for the current member if not already held (idempotent). */
  async function issueCertificateIfMissing(certificateType: string, settlementObjectKey: string, sourceEventId?: string) {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    if (certificateTypes.value.has(certificateType)) return
    const { data, error: e } = await supabase.from('certificates').insert({
      member_id:              member.userId,
      certificate_type:       certificateType,
      settlement_object_key:  settlementObjectKey,
      source_event_id:        sourceEventId ?? null,
    }).select().single()
    if (!e && data) certificates.value = [...certificates.value, data as Certificate]
  }

  /** Called after a quiz completes in LearnPage.vue — awards points + certificate if the area maps to a reward and the score clears the threshold. */
  async function awardQuizCompletion(areaId: string, score: number, _total: number) {
    const member = useMemberStore()
    const cfg = QUIZ_REWARD_MAP[areaId]
    if (!supabase || !member.userId || !cfg) return
    if (score < cfg.minScore) return
    if (cfg.prerequisite && !certificateTypes.value.has(QUIZ_REWARD_MAP[cfg.prerequisite]?.certificateType ?? '')) return
    if (certificateTypes.value.has(cfg.certificateType)) return   // already awarded

    const { data, error: e } = await supabase.from('reward_events').insert({
      member_id:  member.userId,
      track:      cfg.track,
      action_key: cfg.actionKey,
      points:     POINTS[cfg.actionKey] ?? 0,
      metadata:   { score, area_id: areaId },
    }).select().single()
    if (e || !data) return
    rewardEvents.value = [data as RewardEvent, ...rewardEvents.value]
    await issueCertificateIfMissing(cfg.certificateType, cfg.settlementObjectKey, (data as RewardEvent).id)
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
    const points = POINTS[actionKey] ?? POINTS.volunteer_self_report ?? 0
    const { data, error: e } = await supabase.from('reward_events').insert({
      member_id:  member.userId,
      track:      'volunteering',
      action_key: actionKey,
      points,
      metadata,
    }).select().single()
    if (e || !data) return
    rewardEvents.value = [data as RewardEvent, ...rewardEvents.value]

    if (pointsByTrack.value.volunteering >= VOLUNTEER_CERTIFICATE_THRESHOLD) {
      await issueCertificateIfMissing('field_volunteer', 'volunteer_dome_object', (data as RewardEvent).id)
    }
    if (actionKey === 'decon_progress_log') {
      const logCount = rewardEvents.value.filter(e => e.action_key === 'decon_progress_log').length
      if (logCount >= PFAS_RESEARCHER_LOG_THRESHOLD) {
        await issueCertificateIfMissing('pfas_field_researcher', 'pfas_researcher_marker', (data as RewardEvent).id)
      }
    }
  }

  /** Self-serve credit for the educating_others track outside mentor sessions — e.g. publishing a public method proposal. Same client-trust model as logVolunteerAction. */
  async function logEducatingAction(actionKey: string, metadata: Record<string, unknown> = {}) {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const points = POINTS[actionKey] ?? 0
    const { data, error: e } = await supabase.from('reward_events').insert({
      member_id:  member.userId,
      track:      'educating_others',
      action_key: actionKey,
      points,
      metadata,
    }).select().single()
    if (e || !data) return
    rewardEvents.value = [data as RewardEvent, ...rewardEvents.value]
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

  /** Admin-only (enforced by RLS is_admin()) — for bounty/doc-contribution credit that isn't self-serve. */
  async function adminGrantReward(memberId: string, track: RewardTrack, actionKey: string, points: number, metadata: Record<string, unknown> = {}) {
    if (!supabase) return
    await supabase.from('reward_events').insert({ member_id: memberId, track, action_key: actionKey, points, metadata })
  }

  return {
    rewardEvents, certificates, mentorSessions, loading, error, isAdmin,
    totalPoints, pointsByTrack, certificateTypes, unlockedObjects, pendingMentorConfirmations,
    volunteerProgress, mentorProgress,
    loadMyRewards, awardQuizCompletion, logVolunteerAction, logEducatingAction,
    requestMentorSession, confirmMentorSession, adminGrantReward,
    checkIsAdmin, searchMembers, issueCertificate,
  }
})
