/**
 * src/composables/useLoggingStreak.ts
 * Consecutive-weeks logging streak for a decontamination project — the
 * "sticky" motivation mechanic for citizen-science progress logging.
 * Counts backward from the current week; a gap breaks the streak.
 */
import { computed, type Ref } from 'vue'

export interface StreakEntry { logged_at: string }

function weekIndex(dateIso: string, nowMs: number): number {
  const diffMs = nowMs - new Date(dateIso).getTime()
  return Math.floor(diffMs / (7 * 86_400_000))
}

/** Pure version — usable outside a component (e.g. a Pinia store checking a threshold right after an insert), not just as a reactive composable. */
export function computeStreakWeeks(entries: StreakEntry[], nowMs = Date.now()): number {
  if (!entries.length) return 0
  const weeksWithLogs = new Set(entries.map(e => weekIndex(e.logged_at, nowMs)))
  let streak = 0
  while (weeksWithLogs.has(streak)) streak++
  return streak
}

export function useLoggingStreak(entries: Ref<StreakEntry[]>) {
  const currentStreakWeeks = computed(() => computeStreakWeeks(entries.value))
  return { currentStreakWeeks }
}
