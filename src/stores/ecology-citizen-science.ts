import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'
import { useRewardsStore } from './rewards'
import {
  buildCurrentState, buildAspirationalState, buildRelationalState, buildLeechVector,
  type AspirationalInput, type ProjectLogSummary,
} from 'src/lib/leech-vector'

export type AccessStatus = 'unresearched' | 'map_research_done' | 'inquiry_sent' | 'access_confirmed' | 'not_required'
export type EcologyProjectType = 'biodiversity_survey' | 'forest_garden' | 'rain_garden' | 'bird_blind' | 'habitat_restoration' | 'other'
export type EcologyProjectStatus = 'planning' | 'active' | 'monitoring' | 'complete'

export interface EcologySite {
  id: string; created_by: string; name: string; description: string | null
  habitat_type: string | null; base_address: string | null; is_simulated: boolean
  access_status: AccessStatus; contact_note: string | null
  created_at: string
}

export interface EcologyProject {
  id: string; site_id: string; owner_id: string; title: string
  project_type: EcologyProjectType
  status: EcologyProjectStatus
  branch_settlement_id: string | null
  created_at: string
}

export interface EcologyLogEntry {
  id: string; project_id: string; author_id: string
  notes: string; metrics: Record<string, unknown>; logged_at: string
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
}

export const useEcologyCitizenScienceStore = defineStore('ecology-citizen-science', () => {
  const sites      = ref<EcologySite[]>([])
  const projects    = ref<EcologyProject[]>([])
  const logEntries  = ref<EcologyLogEntry[]>([])   // scoped to whichever project(s) have been loaded
  const loading     = ref(false)

  // ── Loaders — all public, no sign-in required ──────────────────────────────

  async function loadSites() {
    if (!supabase) return
    const { data } = await supabase.from('ecology_sites').select('*').order('created_at', { ascending: false })
    sites.value = (data as EcologySite[]) ?? []
  }

  async function loadProjects(siteId?: string) {
    if (!supabase) return
    let q = supabase.from('ecology_projects').select('*').order('created_at', { ascending: false })
    if (siteId) q = q.eq('site_id', siteId)
    const { data } = await q
    projects.value = (data as EcologyProject[]) ?? []
  }

  async function loadProjectLogEntries(projectId: string) {
    if (!supabase) return
    const { data } = await supabase.from('ecology_log_entries').select('*')
      .eq('project_id', projectId).order('logged_at', { ascending: false })
    const fresh = (data as EcologyLogEntry[]) ?? []
    logEntries.value = [...logEntries.value.filter(e => e.project_id !== projectId), ...fresh]
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  async function createSite(input: {
    name: string; description?: string; habitatType?: string
    baseAddress?: string; isSimulated: boolean
  }): Promise<EcologySite | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('ecology_sites').insert({
      created_by:     member.userId,
      name:            input.name,
      description:     input.description ?? null,
      habitat_type:    input.habitatType ?? null,
      base_address:    input.baseAddress ?? null,
      is_simulated:    input.isSimulated,
    }).select().single()
    if (error || !data) return null
    sites.value = [data as EcologySite, ...sites.value]
    return data as EcologySite
  }

  /**
   * Advances a site's map-research -> letter-of-inquiry -> agreement
   * pipeline. Self-service like the rest of this store's writes — there's
   * no server-side verification that a letter was actually sent, same
   * trust model as the rest of this app's self-reported actions.
   */
  async function updateSiteAccessStatus(
    siteId: string, status: AccessStatus, contactNote?: string,
  ): Promise<boolean> {
    if (!supabase) return false
    const patch: Record<string, unknown> = { access_status: status }
    if (contactNote !== undefined) patch.contact_note = contactNote
    const { data, error } = await supabase.from('ecology_sites').update(patch)
      .eq('id', siteId).select().single()
    if (error || !data) return false
    sites.value = sites.value.map(s => s.id === siteId ? (data as EcologySite) : s)
    return true
  }

  /**
   * Creates an ecology project. If `simulated`, also creates a research-type
   * branch settlement (exo-branch-v1) and links it — same "parallel
   * dimension for simulated projects" pattern as decon_projects.
   */
  async function createProject(input: {
    siteId: string; title: string; projectType: EcologyProjectType; simulated: boolean
    baseAddress?: string; aspirational?: AspirationalInput
  }): Promise<EcologyProject | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId || !member.profile) return null

    let branchSettlementId: string | null = null

    if (input.simulated) {
      const base = input.baseAddress ?? 'exotopia:surface:unspecified'

      const current      = buildCurrentState(emptyLogSummary())
      const aspirational  = buildAspirationalState(input.aspirational ?? {})
      const relational    = buildRelationalState({
        citationCount: 0, endorsementCount: 0,
        siblingBranchCount: 0, connectedContributors: 1,
      })
      const leechVector = buildLeechVector(current, aspirational, relational)

      const branchId = `${member.profile.handle}-${slugify(input.title)}-v1`
      const { data: branch, error: branchErr } = await supabase.from('branch_settlements').insert({
        branch_id:       branchId,
        branch_type:     'research',
        owner_id:        member.userId,
        base_address:    base,
        divergence_note: `Simulated ecology project: ${input.title}`,
        access:          'open',
        leech_vector:    leechVector,
        leech_axis:      'current',
      }).select().single()
      if (branchErr || !branch) return null
      branchSettlementId = (branch as { id: string }).id
    }

    const { data, error } = await supabase.from('ecology_projects').insert({
      site_id:               input.siteId,
      owner_id:              member.userId,
      title:                 input.title,
      project_type:          input.projectType,
      status:                'planning',
      branch_settlement_id:  branchSettlementId,
    }).select().single()
    if (error || !data) return null
    projects.value = [data as EcologyProject, ...projects.value]
    return data as EcologyProject
  }

  function emptyLogSummary(): ProjectLogSummary {
    return {
      logCount: 0, firstLoggedAt: null, lastLoggedAt: null, avgNotesLength: 0,
      metricsFraction: 0, concentrationReductionFrac: null, streakWeeks: 0, status: 'planning',
    }
  }

  /** Logs a progress entry and credits volunteering-track points via ecology_field_log. */
  async function logProgress(projectId: string, notes: string, metrics: Record<string, unknown> = {}) {
    const member  = useMemberStore()
    const rewards = useRewardsStore()
    if (!supabase || !member.userId) return
    const { data, error } = await supabase.from('ecology_log_entries').insert({
      project_id: projectId, author_id: member.userId, notes, metrics,
    }).select().single()
    if (error || !data) return
    logEntries.value = [data as EcologyLogEntry, ...logEntries.value]

    await rewards.logVolunteerAction('ecology_field_log', { projectId })
  }

  return {
    sites, projects, logEntries, loading,
    loadSites, loadProjects, loadProjectLogEntries,
    createSite, updateSiteAccessStatus, createProject, logProgress,
  }
})
