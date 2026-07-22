/**
 * src/lib/local-report.ts
 *
 * Builds a self-contained, printable HTML report from whatever a member
 * has stored locally (eco-ops queue/drafts, staged eco-ops/mentoring/
 * learning-milestone entries, voice-recording metadata). Pure function —
 * takes already-loaded data, returns an HTML string. No network calls,
 * no store imports at runtime (only types), so nothing here can leak
 * data anywhere: the caller downloads the returned string as a local
 * file and that's the end of it.
 *
 * This exists because the app's local-first stores (eco-offline queue,
 * staged-entries, audio-recorder) are all things a member can choose
 * never to submit anywhere — this report is how they get a readable
 * record of that work without needing an account or a server round trip.
 */

import type { QueuedSubmission, MonitoringDraft } from 'src/stores/eco-offline'
import type { StagedEntry } from 'src/stores/staged-entries'
import type { AudioRecording } from 'src/lib/audio-recorder'

export interface LocalReportInput {
  queue:         QueuedSubmission[]
  drafts:        MonitoringDraft[]
  stagedEntries: StagedEntry[]
  recordings:    Omit<AudioRecording, 'blob'>[]
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

function fmtDuration(s: number): string {
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const CATEGORY_LABEL: Record<StagedEntry['category'], string> = {
  eco_ops:            'Eco Ops',
  mentoring:          'Mentoring',
  learning_milestone: 'Learning Milestone',
}

function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return '<p class="empty">None recorded.</p>'
  const head = headers.map(h => `<th>${esc(h)}</th>`).join('')
  const body = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export function buildLocalReportHtml(input: LocalReportInput): string {
  const generatedAt = new Date().toISOString()

  const queueRows = input.queue.map(q => [
    esc(q.siteName), esc(q.type.replace(/_/g, ' ')), esc(q.status),
    esc(fmtTime(q.enqueuedAt)), q.syncedAt ? esc(fmtTime(q.syncedAt)) : '—',
    q.error ? `<span class="warn">${esc(q.error)}</span>` : '',
  ])

  const draftRows = input.drafts.map(d => [
    esc(d.siteName), esc(d.recordType ?? 'not set'), `step ${d.step + 1}`,
    esc(fmtTime(d.savedAt)), esc(d.notes || '—'),
  ])

  const stagedRows = input.stagedEntries.map(e => [
    esc(CATEGORY_LABEL[e.category]), esc(e.title), esc(e.notes || '—'),
    e.submittedAt ? `<span class="ok">submitted ${esc(fmtTime(e.submittedAt))}</span>` : '<span class="pending">staged, not yet submitted</span>',
    e.audioRecordingId ? 'yes' : '—',
    esc(fmtTime(e.createdAt)),
  ])

  const recordingRows = input.recordings.map(r => [
    esc(r.name), fmtDuration(r.duration), fmtBytes(r.size), esc(fmtTime(new Date(r.timestamp).toISOString())),
  ])

  const totalStaged    = input.stagedEntries.filter(e => !e.submittedAt).length
  const totalPending   = input.queue.filter(q => q.status === 'pending' || q.status === 'failed').length
  const totalRecordings = input.recordings.length

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Local Data Report — Exotopia</title>
<style>
@page { size: A4 portrait; margin: 18mm 20mm 22mm 20mm; }
@media print { body { font-size: 9.5pt; } .no-print { display: none !important; } }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #111; line-height: 1.55; background: #fff;
  max-width: 820px; margin: 32px auto; padding: 0 24px 80px;
  font-size: 10.5pt;
}
h1 { font-size: 19pt; font-weight: 700; margin-bottom: 4px; }
h2 { font-size: 13pt; font-weight: 700; margin: 28px 0 8px; border-bottom: 1.5pt solid #222; padding-bottom: 4px; }
.subtitle { color: #555; font-size: 10pt; margin-bottom: 18px; }
.notice {
  background: #f0f9ff; border: 1px solid #bae0f7; border-radius: 6px;
  padding: 12px 16px; margin: 18px 0 24px; font-size: 9.5pt; color: #1a5276;
}
.stats { display: flex; gap: 24px; margin: 14px 0 6px; }
.stat { font-size: 9.5pt; color: #333; }
.stat b { font-size: 15pt; display: block; color: #111; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; font-size: 9pt; }
th { text-align: left; background: #f2f2f2; padding: 5px 7px; border-bottom: 1.5pt solid #333; font-size: 8.5pt; }
td { padding: 5px 7px; border-bottom: 0.5pt solid #ddd; vertical-align: top; }
.empty { color: #888; font-style: italic; font-size: 9.5pt; margin: 6px 0; }
.warn { color: #b03; }
.ok   { color: #1a7a3a; }
.pending { color: #b07600; }
footer { margin-top: 40px; padding-top: 14px; border-top: 1pt solid #ccc; font-size: 8pt; color: #888; }
</style>
</head>
<body>

<h1>My Local Data Report</h1>
<div class="subtitle">Exotopia — generated ${esc(fmtTime(generatedAt))}</div>

<div class="notice">
  This report was built entirely on this device from data stored in this browser
  (localStorage / IndexedDB) — building it required no network request. Nothing
  listed here has been sent to any server unless a row is explicitly marked
  <strong>synced</strong> or <strong>submitted</strong>. You decide what, if anything,
  gets shared beyond this device.
</div>

<div class="stats">
  <div class="stat"><b>${totalPending}</b>eco-ops items awaiting sync</div>
  <div class="stat"><b>${totalStaged}</b>staged entries not yet submitted</div>
  <div class="stat"><b>${totalRecordings}</b>voice recordings on this device</div>
</div>

<h2>Staged Entries — Eco Ops / Mentoring / Learning Milestones</h2>
${table(['Category', 'Title', 'Notes', 'Status', 'Voice note?', 'Created'], stagedRows)}

<h2>Eco-Ops Submission Queue</h2>
${table(['Site', 'Type', 'Status', 'Queued', 'Synced', 'Note'], queueRows)}

<h2>Eco-Ops In-Progress Drafts</h2>
${table(['Site', 'Record type', 'Progress', 'Last saved', 'Notes'], draftRows)}

<h2>Voice Recordings on This Device</h2>
${table(['Name', 'Duration', 'Size', 'Recorded'], recordingRows)}
${totalRecordings ? '<p class="empty">Audio files themselves stay in this browser\'s local storage — download each one individually from the Local Data panel if you want a copy.</p>' : ''}

<footer>
  Generated locally by Exotopia — no data left this device to produce this report.
</footer>

</body>
</html>`
}
