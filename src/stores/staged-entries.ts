/**
 * src/stores/staged-entries.ts
 *
 * Local-first staging area for quick field entries captured from the
 * top-right RecordWidget — eco-ops self-reports, mentoring session
 * requests, and personal learning-goal milestones. Entries are saved
 * locally first (so a field capture is never lost to a dropped
 * connection or a not-yet-signed-in session) and only pushed into the
 * real system — the rewards ledger for the first two categories —
 * when explicitly submitted. Mirrors the offline-draft pattern already
 * used by eco-offline.ts, at localStorage scale rather than IndexedDB
 * since entries here are small text fields, not photo payloads.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { safeRead, safeWrite } from 'src/lib/storage-cipher'
import { useRewardsStore } from './rewards'
import { useMemberStore } from './member'

export type StagedCategory = 'eco_ops' | 'mentoring' | 'learning_milestone'

export interface StagedEntry {
  id:               string
  category:         StagedCategory
  title:            string
  notes:            string
  audioRecordingId: string | null
  createdAt:        string
  submittedAt:      string | null
  // eco_ops
  ecoActionKey?:      string
  ecoQuantity?:       number | null
  // mentoring
  mentorTargetId?:    string
  mentorTargetName?:  string
  mentorTopic?:       string
  // learning_milestone
  learningTargetDate?: string
}

const STORAGE_KEY = 'e8.3'   // opaque — follows settlements.ts (e8.1) / settlement-items.ts (e8.2)

// Unsubmitted entries sitting indefinitely on-device are exactly the kind of
// thing that turns into a forgotten liability if a device is lost, shared,
// or subpoenaed — see RISK_REDUCTION_RECOMMENDATIONS.md §6. Submitted
// entries are left alone; they're a completed-action record, not a lingering
// draft, and the same 90-day window would just delete someone's own history.
const STALE_UNSUBMITTED_DAYS = 90

function load(): StagedEntry[] {
  return safeRead<StagedEntry[]>(STORAGE_KEY, [])
}

function persist(entries: StagedEntry[]) {
  safeWrite(STORAGE_KEY, entries)
}

function pruneStale(list: StagedEntry[]): StagedEntry[] {
  const cutoff = Date.now() - STALE_UNSUBMITTED_DAYS * 24 * 60 * 60 * 1000
  return list.filter(e => e.submittedAt || new Date(e.createdAt).getTime() >= cutoff)
}

export const useStagedEntriesStore = defineStore('staged-entries', () => {
  const raw    = load()
  const loaded = pruneStale(raw)
  const entries = ref<StagedEntry[]>(loaded)
  if (loaded.length !== raw.length) persist(loaded)

  const unsubmitted      = computed(() => entries.value.filter(e => !e.submittedAt))
  const unsubmittedCount = computed(() => unsubmitted.value.length)

  function stage(input: Omit<StagedEntry, 'id' | 'createdAt' | 'submittedAt'>): StagedEntry {
    const entry: StagedEntry = {
      ...input,
      id:          crypto.randomUUID(),
      createdAt:   new Date().toISOString(),
      submittedAt: null,
    }
    entries.value = [entry, ...entries.value]
    persist(entries.value)
    return entry
  }

  function updateEntry(id: string, patch: Partial<StagedEntry>) {
    entries.value = entries.value.map(e => e.id === id ? { ...e, ...patch } : e)
    persist(entries.value)
  }

  function removeEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id)
    persist(entries.value)
  }

  /**
   * Pushes a staged entry into the real system for its category.
   * eco_ops -> rewards.logVolunteerAction (self-report path, same as RewardsPage.vue).
   * mentoring -> rewards.requestMentorSession (needs a chosen connection + topic).
   * learning_milestone has no backing system yet — it's a personal, local-only
   * log, so submitting just marks it reviewed/archived out of the staged list.
   * Bails without marking submitted if signed out — logVolunteerAction/
   * requestMentorSession silently no-op in that case, and marking the entry
   * submitted anyway would tell the user it landed when it didn't.
   */
  async function submitEntry(id: string) {
    const entry = entries.value.find(e => e.id === id)
    if (!entry) return
    if (entry.category !== 'learning_milestone' && !useMemberStore().isSignedIn) return
    const rewards = useRewardsStore()

    if (entry.category === 'eco_ops') {
      await rewards.logVolunteerAction(entry.ecoActionKey ?? 'other_volunteer_action', {
        quantity:    entry.ecoQuantity ?? null,
        description: entry.notes || entry.title,
      })
    } else if (entry.category === 'mentoring') {
      if (!entry.mentorTargetId || !entry.mentorTopic) return
      await rewards.requestMentorSession(entry.mentorTargetId, entry.mentorTopic)
    }

    updateEntry(id, { submittedAt: new Date().toISOString() })
  }

  return {
    entries, unsubmitted, unsubmittedCount,
    stage, updateEntry, removeEntry, submitEntry,
  }
})
