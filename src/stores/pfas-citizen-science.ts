import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'
import { useRewardsStore } from './rewards'
import {
  buildCurrentState, buildAspirationalState, buildRelationalState, buildLeechVector,
  type AspirationalInput, type ProjectLogSummary,
} from 'src/lib/leech-vector'
import { LOGGING_STREAK_THRESHOLD_WEEKS } from 'src/data/rewards-catalog'
import { computeStreakWeeks } from 'src/composables/useLoggingStreak'

export interface FocusArea {
  id: string; created_by: string; name: string; description: string | null
  contamination_type: string; base_address: string | null; is_simulated: boolean
  created_at: string
}

export interface DeconProject {
  id: string; focus_area_id: string; owner_id: string; title: string
  method_proposal_id: string | null
  status: 'planning' | 'active' | 'monitoring' | 'complete'
  branch_settlement_id: string | null
  created_at: string
}

export interface ProjectLogEntry {
  id: string; project_id: string; author_id: string
  notes: string; metrics: Record<string, unknown>; logged_at: string
}

export interface Citation { title: string; url: string; note?: string }

export interface MethodProposal {
  id: string; author_id: string; title: string; summary: string
  method_key: string | null; precedent_citations: Citation[]
  economic_argument: string | null; environmental_argument: string | null
  status: 'proposed' | 'endorsed' | 'adopted'; created_at: string
}

export interface ProposalEndorsement { id: string; proposal_id: string; member_id: string; created_at: string }

export interface BranchSettlement {
  id: string; branch_id: string
  branch_type: 'public' | 'private' | 'branded' | 'research' | 'educational'
  owner_id: string; base_address: string; divergence_note: string | null
  access: string; leech_vector: number[]; leech_axis: string; created_at: string
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
}

export const usePfasCitizenScienceStore = defineStore('pfas-citizen-science', () => {
  const focusAreas       = ref<FocusArea[]>([])
  const projects         = ref<DeconProject[]>([])
  const logEntries       = ref<ProjectLogEntry[]>([])   // scoped to whichever project(s) have been loaded
  const methodProposals  = ref<MethodProposal[]>([])
  const endorsements     = ref<ProposalEndorsement[]>([])
  const branchSettlements = ref<BranchSettlement[]>([])
  const loading          = ref(false)

  // ── Loaders — all public, no sign-in required ──────────────────────────────

  async function loadFocusAreas() {
    if (!supabase) return
    const { data } = await supabase.from('focus_areas').select('*').order('created_at', { ascending: false })
    focusAreas.value = (data as FocusArea[]) ?? []
  }

  async function loadProjects(focusAreaId?: string) {
    if (!supabase) return
    let q = supabase.from('decon_projects').select('*').order('created_at', { ascending: false })
    if (focusAreaId) q = q.eq('focus_area_id', focusAreaId)
    const { data } = await q
    projects.value = (data as DeconProject[]) ?? []
  }

  async function loadProjectLogEntries(projectId: string) {
    if (!supabase) return
    const { data } = await supabase.from('project_log_entries').select('*')
      .eq('project_id', projectId).order('logged_at', { ascending: false })
    const fresh = (data as ProjectLogEntry[]) ?? []
    logEntries.value = [...logEntries.value.filter(e => e.project_id !== projectId), ...fresh]
  }

  async function loadMethodProposals() {
    if (!supabase) return
    const { data } = await supabase.from('method_proposals').select('*').order('created_at', { ascending: false })
    methodProposals.value = (data as MethodProposal[]) ?? []
  }

  async function loadEndorsements(proposalId: string) {
    if (!supabase) return
    const { data } = await supabase.from('proposal_endorsements').select('*').eq('proposal_id', proposalId)
    const fresh = (data as ProposalEndorsement[]) ?? []
    endorsements.value = [...endorsements.value.filter(e => e.proposal_id !== proposalId), ...fresh]
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  async function createFocusArea(input: {
    name: string; description?: string; contaminationType?: string
    baseAddress?: string; isSimulated: boolean
  }): Promise<FocusArea | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('focus_areas').insert({
      created_by:         member.userId,
      name:                input.name,
      description:         input.description ?? null,
      contamination_type:  input.contaminationType ?? 'PFAS',
      base_address:        input.baseAddress ?? null,
      is_simulated:        input.isSimulated,
    }).select().single()
    if (error || !data) return null
    focusAreas.value = [data as FocusArea, ...focusAreas.value]
    return data as FocusArea
  }

  /**
   * Creates a decontamination project. If `simulated`, also creates a
   * research-type branch settlement (exo-branch-v1) and links it — the
   * "parallel dimension for simulated cleanups" the project lives in.
   */
  async function createProject(input: {
    focusAreaId: string; title: string; simulated: boolean
    baseAddress?: string; aspirational?: AspirationalInput
  }): Promise<DeconProject | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId || !member.profile) return null

    let branchSettlementId: string | null = null

    if (input.simulated) {
      const base = input.baseAddress ?? 'exotopia:surface:unspecified'
      const siblingCount = branchSettlements.value.filter(b => b.base_address === base).length

      const current      = buildCurrentState(emptyLogSummary())
      const aspirational  = buildAspirationalState(input.aspirational ?? {})
      const relational    = buildRelationalState({
        citationCount: 0, endorsementCount: 0,
        siblingBranchCount: siblingCount, connectedContributors: 1,
      })
      const leechVector = buildLeechVector(current, aspirational, relational)

      const branchId = `${member.profile.handle}-${slugify(input.title)}-v1`
      const { data: branch, error: branchErr } = await supabase.from('branch_settlements').insert({
        branch_id:       branchId,
        branch_type:     'research',
        owner_id:        member.userId,
        base_address:    base,
        divergence_note: `Simulated decontamination project: ${input.title}`,
        access:          'open',
        leech_vector:    leechVector,
        leech_axis:      'current',
      }).select().single()
      if (branchErr || !branch) return null
      branchSettlements.value = [branch as BranchSettlement, ...branchSettlements.value]
      branchSettlementId = (branch as BranchSettlement).id
    }

    const { data, error } = await supabase.from('decon_projects').insert({
      focus_area_id:        input.focusAreaId,
      owner_id:             member.userId,
      title:                input.title,
      status:                'planning',
      branch_settlement_id: branchSettlementId,
    }).select().single()
    if (error || !data) return null
    projects.value = [data as DeconProject, ...projects.value]
    return data as DeconProject
  }

  function emptyLogSummary(): ProjectLogSummary {
    return {
      logCount: 0, firstLoggedAt: null, lastLoggedAt: null, avgNotesLength: 0,
      metricsFraction: 0, concentrationReductionFrac: null, streakWeeks: 0, status: 'planning',
    }
  }

  /** Logs a progress entry, credits volunteering-track points, and checks the field-researcher + streak certificates. */
  async function logProgress(projectId: string, notes: string, metrics: Record<string, unknown> = {}) {
    const member = useMemberStore()
    const rewards = useRewardsStore()
    if (!supabase || !member.userId) return
    const { data, error } = await supabase.from('project_log_entries').insert({
      project_id: projectId, author_id: member.userId, notes, metrics,
    }).select().single()
    if (error || !data) return
    logEntries.value = [data as ProjectLogEntry, ...logEntries.value]

    await rewards.logVolunteerAction('decon_progress_log', { projectId })

    // Query full history directly rather than trusting local `logEntries.value`,
    // which may only hold whatever project(s) the current page happened to load.
    const { data: history } = await supabase.from('project_log_entries').select('logged_at')
      .eq('project_id', projectId).eq('author_id', member.userId)
    const streak = computeStreakWeeks((history as { logged_at: string }[]) ?? [])
    if (streak >= LOGGING_STREAK_THRESHOLD_WEEKS) {
      await rewards.issueCertificate('logging_streak', 'logging_streak_flame')
    }
    // The pfas_field_researcher certificate (PFAS_RESEARCHER_LOG_THRESHOLD) is
    // checked inside rewards.logVolunteerAction() itself for this action key.
  }

  async function submitMethodProposal(input: {
    title: string; summary: string; methodKey?: string
    citations: Citation[]; economicArgument?: string; environmentalArgument?: string
  }): Promise<MethodProposal | null> {
    const member = useMemberStore()
    const rewards = useRewardsStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('method_proposals').insert({
      author_id:              member.userId,
      title:                   input.title,
      summary:                 input.summary,
      method_key:              input.methodKey ?? null,
      precedent_citations:     input.citations,
      economic_argument:       input.economicArgument ?? null,
      environmental_argument:  input.environmentalArgument ?? null,
    }).select().single()
    if (error || !data) return null
    methodProposals.value = [data as MethodProposal, ...methodProposals.value]
    await rewards.logEducatingAction('method_proposal_published', { proposalId: (data as MethodProposal).id })
    return data as MethodProposal
  }

  /** Endorsing credits the endorser and — on the proposal's first endorsement — the author's certificate, both server-side (see 003 migration trigger). */
  async function endorseProposal(proposalId: string) {
    const member = useMemberStore()
    const rewards = useRewardsStore()
    if (!supabase || !member.userId) return
    const { data, error } = await supabase.from('proposal_endorsements').insert({
      proposal_id: proposalId, member_id: member.userId,
    }).select().single()
    if (error || !data) return
    endorsements.value = [...endorsements.value, data as ProposalEndorsement]
    await rewards.loadMyRewards()   // pick up the server-emitted endorser credit
  }

  return {
    focusAreas, projects, logEntries, methodProposals, endorsements, branchSettlements, loading,
    loadFocusAreas, loadProjects, loadProjectLogEntries, loadMethodProposals, loadEndorsements,
    createFocusArea, createProject, logProgress, submitMethodProposal, endorseProposal,
  }
})
