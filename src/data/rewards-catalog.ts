/**
 * src/data/rewards-catalog.ts
 * Shared catalog for the rewards/incentive foundation — points values,
 * settlement-object display metadata, and the finance-literacy quiz →
 * reward mapping. See src/stores/rewards.ts for the store that reads
 * this, and supabase/migrations/002_rewards.sql for the backing tables.
 */

// ── Points ────────────────────────────────────────────────────────────────
// Mirrors SPEC_ECOOPS_COMMUNITY_PLATFORM.md §3.1 where action types overlap.

export const POINTS: Record<string, number> = {
  pfin8_complete:          25,
  pfin28_complete:         60,
  eco_submission:          10,   // auto-logged from a real eco-offline sync
  volunteer_self_report:    8,   // per self-reported entry (e.g. a plastics-collection log)
  mentor_session:          40,   // awarded server-side by the mentor_sessions trigger
  bounty_verified:         30,   // admin-granted, e.g. a verified GitHub bounty
  contribution_verified:   20,   // admin-granted, e.g. docs/curriculum contribution
  decon_progress_log:       6,   // per progress-log entry on a decontamination project
  method_proposal_published: 25, // publishing a public PFAS cleanup method proposal
  method_proposal_endorsed:  4,  // credit to an endorser for engaging with a proposal
  knowledge_keeper_record:   15, // documenting a Wisdom-from-Elders / Knowledge Keeper contribution
}

// Consecutive weeks with ≥1 log entry on a decontamination project at which
// a logging-streak certificate is issued. See src/composables/useLoggingStreak.ts.
export const LOGGING_STREAK_THRESHOLD_WEEKS = 4

// project_log_entries count (across any projects) at which a field-researcher
// certificate is issued.
export const PFAS_RESEARCHER_LOG_THRESHOLD = 10

// Volunteering-track points at which a self-serve field certificate is issued.
export const VOLUNTEER_CERTIFICATE_THRESHOLD = 50

// Confirmed mentor sessions (as mentor) at which a mentorship certificate is
// issued. Must match the threshold hardcoded in mentor_session_reward() in
// supabase/migrations/002_rewards.sql — that trigger is the actual source of
// truth; this constant exists only so the UI can show progress toward it.
export const MENTOR_CYCLE_THRESHOLD = 4

// ── Settlement objects — display metadata only ──────────────────────────────
// The actual unlock record lives in `certificates.settlement_object_key`
// (see migration). This catalog just maps a key to how it's shown in the UI.
// Colors reuse the palette already used in OnboardPage.vue's settlementItems.

export interface SettlementObject {
  key:         string
  label:       string
  color:       string
  description: string
}

export const SETTLEMENT_OBJECTS: Record<string, SettlementObject> = {
  finance_seed: {
    key: 'finance_seed', label: 'Personal Link-Page Settlement Seed', color: '#44ff88',
    description: 'Unlocked by completing P-Fin 8. The starting seed for a settlement of your own.',
  },
  parallel_universe_beacon: {
    key: 'parallel_universe_beacon', label: 'Parallel-Universe Settlement Beacon', color: '#cc88ff',
    description: 'Unlocked by mastering the full P-Fin Index. Upgrades your seed into a full numbered parallel-universe settlement.',
  },
  mentorship_beacon: {
    key: 'mentorship_beacon', label: 'Mentorship Beacon', color: '#00e5ff',
    description: 'Unlocked after guiding four confirmed mentor sessions — recognizes educating others as its own settlement contribution.',
  },
  volunteer_dome_object: {
    key: 'volunteer_dome_object', label: 'Field Volunteer Dome Object', color: '#ffaa33',
    description: 'Unlocked after accumulating sustained volunteering points — real-world field effort, made visible in your settlement.',
  },
  pfas_researcher_marker: {
    key: 'pfas_researcher_marker', label: 'PFAS Field Researcher Marker', color: '#7fffd4',
    description: 'Unlocked after logging sustained progress on decontamination projects — a settlement object recognizing real citizen-science research.',
  },
  method_contributor_beacon: {
    key: 'method_contributor_beacon', label: 'Method Contributor Beacon', color: '#ff8844',
    description: 'Unlocked when a published cleanup method proposal receives its first community endorsement.',
  },
  logging_streak_flame: {
    key: 'logging_streak_flame', label: 'Logging Streak Marker', color: '#ffcc44',
    description: 'Unlocked after four consecutive weeks of logging progress on a decontamination project.',
  },
}

// Which mesh preset each unlocked object renders as inside a settlement.
// Keys match SETTLEMENT_OBJECTS above; values are ITEM_MESH_PRESETS keys from
// src/lib/settlement-items.ts, each of which lists 'reward' in its acquiredBy.
// Without this, attaching a certificate object only ever wrote a string to
// SettlementRecord.objects[] and nothing appeared in the dome.

export const SETTLEMENT_OBJECT_MESH: Record<string, string> = {
  finance_seed:              'seed-vault',
  parallel_universe_beacon:  'beacon',
  mentorship_beacon:         'comms-relay',
  volunteer_dome_object:     'monument',
  pfas_researcher_marker:    'decon-site-marker',
  method_contributor_beacon: 'archive-node',
  logging_streak_flame:      'crystal',
}

// ── Finance-literacy quiz → reward mapping ──────────────────────────────────
// Keyed by QuizArea.id from src/data/finance-literacy-quiz.ts.

export interface QuizRewardConfig {
  track:               'finance_literacy'
  actionKey:            string
  certificateType:      string
  settlementObjectKey:  string
  minScore:             number   // out of the area's questionCount
  prerequisite:         string | null   // another QUIZ_REWARD_MAP key that must be certified first
}

export const QUIZ_REWARD_MAP: Record<string, QuizRewardConfig> = {
  pfin8: {
    track: 'finance_literacy', actionKey: 'pfin8_complete',
    certificateType: 'pfin8', settlementObjectKey: 'finance_seed',
    minScore: 6, prerequisite: null,
  },
  pfin28: {
    track: 'finance_literacy', actionKey: 'pfin28_complete',
    certificateType: 'pfin28', settlementObjectKey: 'parallel_universe_beacon',
    minScore: 20, prerequisite: 'pfin8',
  },
}
