/**
 * src/lib/admin-mod-log.ts
 *
 * Local, itemized paper trail for admin moderation actions. Community-nodes
 * moderation (community-nodes.ts's setNodeStatusAsAdmin) deliberately skips
 * any local record — "moderation happens online, at a desk" — but settlement
 * profile moderation adds an offline path (see setProfileStatusAsAdmin in
 * settlement-profiles.ts), and an action nobody can see happening/failing is
 * worse than one that's merely offline. So: every archive/restore attempt
 * gets an entry here first, before the network call — outcome is updated
 * once the result (or lack of one) is known, so nothing an admin clicked
 * silently disappears.
 *
 * Storage uses storage-cipher.ts's same E8-stream obfuscation as settlement
 * dome state, for consistency with how this app already treats local
 * device data — but per that file's own header, this is NOT a cryptographic
 * primitive. It stops casual localStorage inspection (browser extensions,
 * devtools skimming), not a determined attacker with source access. Treat
 * "secure" here as "obfuscated, same bar as the rest of this app," not as
 * an actual security boundary — the real one is server-side RLS.
 */
import { safeRead, safeWrite } from './storage-cipher'

const LOG_KEY   = 'exo.admin-mod-log'
const MAX_LINES = 500   // oldest entries drop off past this — a rolling paper trail, not permanent archive

export type AdminModOutcome = 'applied' | 'queued' | 'failed'

export interface AdminModEntry {
  id:          string          // local id, not a DB id — crypto.randomUUID()
  at:          string          // ISO timestamp of the attempt
  actorId:     string | null   // member id of the admin who clicked, if known
  targetTable: string          // e.g. 'settlement_profiles'
  targetId:    string
  targetLabel: string          // human-readable label (display_name etc.) for a readable trail
  fromStatus:  string | null
  toStatus:    string | null
  outcome:     AdminModOutcome
}

function readLog(): AdminModEntry[] {
  return safeRead<AdminModEntry[]>(LOG_KEY, [])
}

function writeLog(entries: AdminModEntry[]): void {
  safeWrite(LOG_KEY, entries.slice(-MAX_LINES))
}

/** Record an attempt (before the network call resolves) and return its id so the caller can update the outcome. */
export function logModAttempt(entry: Omit<AdminModEntry, 'id' | 'at' | 'outcome'> & { outcome?: AdminModOutcome }): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const full: AdminModEntry = { ...entry, id, at: new Date().toISOString(), outcome: entry.outcome ?? 'applied' }
  writeLog([...readLog(), full])
  return id
}

/** Update the outcome of a previously logged attempt (e.g. 'applied' -> 'failed' once the network call actually resolves). */
export function updateModOutcome(id: string, outcome: AdminModOutcome): void {
  writeLog(readLog().map(e => e.id === id ? { ...e, outcome } : e))
}

/** Most recent first — for the admin page's paper-trail panel. */
export function listModLog(): AdminModEntry[] {
  return [...readLog()].reverse()
}

export function clearModLogEntry(id: string): void {
  writeLog(readLog().filter(e => e.id !== id))
}
