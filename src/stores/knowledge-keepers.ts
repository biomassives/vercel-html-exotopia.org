import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from './member'
import { useRewardsStore } from './rewards'

// Implements docs/eco-ops-workflow-guide.md Part 7 ("Wisdom from Elders").
// NOT the formal Endangered Language Documentation protocol (Part 6) — see
// supabase/migrations/005_knowledge_keepers.sql for the full reasoning on
// why the two must stay separate.

export type SubmitterRelationship = 'self' | 'family' | 'friend' | 'student_researcher'

export interface KnowledgeKeeperRecord {
  id:                     string
  submitter_id:           string
  keeper_name:            string | null
  site_ref:               string | null
  domain_tags:            string[]
  summary:                string
  technical_link_note:    string | null
  submitter_relationship: SubmitterRelationship
  consent_note:           string | null
  status:                 'published' | 'pending_review'
  created_at:             string
  reviewed_at:            string | null
  reviewed_by:            string | null
}

export const DOMAIN_TAGS = ['place', 'plant', 'animal', 'season', 'practice', 'memory', 'story'] as const

export const useKnowledgeKeepersStore = defineStore('knowledge-keepers', () => {
  const records = ref<KnowledgeKeeperRecord[]>([])
  const myPending = ref<KnowledgeKeeperRecord[]>([])
  const loading  = ref(false)

  /** Published records only — the public library view. */
  async function loadPublished() {
    if (!supabase) return
    loading.value = true
    const { data } = await supabase
      .from('knowledge_keeper_records')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    records.value = (data as KnowledgeKeeperRecord[]) ?? []
    loading.value = false
  }

  /** The signed-in submitter's own records, published or still pending review. */
  async function loadMine() {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const { data } = await supabase
      .from('knowledge_keeper_records')
      .select('*')
      .eq('submitter_id', member.userId)
      .order('created_at', { ascending: false })
    myPending.value = (data as KnowledgeKeeperRecord[]) ?? []
  }

  /**
   * Submits a Knowledge Keeper record. The server-side trigger (see the 005
   * migration) is the real gate — it forces status to 'pending_review' and
   * requires consentNote when relationship is 'student_researcher', and
   * forces 'published' otherwise. This function doesn't try to duplicate
   * that decision client-side; it just passes the submitter's answers
   * through and reports back what actually happened.
   */
  async function submitRecord(input: {
    keeperName?: string
    siteRef?: string
    domainTags: string[]
    summary: string
    technicalLinkNote?: string
    relationship: SubmitterRelationship
    consentNote?: string
  }): Promise<KnowledgeKeeperRecord | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('knowledge_keeper_records').insert({
      submitter_id:            member.userId,
      keeper_name:             input.keeperName || null,
      site_ref:                input.siteRef || null,
      domain_tags:             input.domainTags,
      summary:                 input.summary,
      technical_link_note:     input.technicalLinkNote || null,
      submitter_relationship:  input.relationship,
      consent_note:            input.consentNote || null,
    }).select().single()
    if (error || !data) return null

    const record = data as KnowledgeKeeperRecord
    if (record.status === 'published') {
      records.value = [record, ...records.value]
    }
    myPending.value = [record, ...myPending.value]

    // Credits the submitter's facilitation/documentation work — the elder
    // Knowledge Keeper themselves typically has no platform account to
    // credit directly; see the doc's "Rewarding elder contributors" section
    // for the fuller (currently unimplemented) elder-certificate vision.
    const rewards = useRewardsStore()
    await rewards.logEducatingAction('knowledge_keeper_record', { recordId: record.id, relationship: record.submitter_relationship })

    return record
  }

  return { records, myPending, loading, loadPublished, loadMine, submitRecord }
})
