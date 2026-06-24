/**
 * src/lib/audio-recorder.ts
 *
 * Browser-side audio recorder using MediaRecorder + Web Audio API.
 * Recordings are saved to IndexedDB — never sent to any server.
 * Intended for: field recordings, community voice logs, oral histories,
 *               $SUNLIGHT NFT source material, eco-ops voice notes.
 *
 * Storage: IndexedDB  'exo_audio' / store 'recordings'
 * Format:  WebM/Opus (Chrome/Firefox) or MP4/AAC (Safari) — whatever
 *          MediaRecorder.isTypeSupported reports as available.
 */

import { ref, type Ref } from 'vue'

// ── Public state ──────────────────────────────────────────────────────────────

export const recording:   Ref<boolean> = ref(false)
export const levelBars:   Ref<number[]> = ref([0, 0, 0, 0, 0])   // 0–100 each
export const recDuration: Ref<number>  = ref(0)   // seconds, updated while recording
export const recError:    Ref<string>  = ref('')

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AudioRecording {
  id:        string
  name:      string
  timestamp: number   // unix ms
  duration:  number   // seconds
  mimeType:  string
  size:      number   // bytes
  blob:      Blob
}

// ── IndexedDB ────────────────────────────────────────────────────────────────

const DB_NAME  = 'exo_audio'
const DB_VER   = 1
const STORE    = 'recordings'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

export async function saveRecording(rec: AudioRecording): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(rec)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export async function listRecordings(): Promise<Omit<AudioRecording, 'blob'>[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx     = db.transaction(STORE, 'readonly')
    const req    = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      // Return metadata only (not the blob) for listing
      resolve((req.result as AudioRecording[]).map(({ blob: _b, ...meta }) => meta))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getRecording(id: string): Promise<AudioRecording | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror   = () => reject(req.error)
  })
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ── MIME type detection ───────────────────────────────────────────────────────

function bestMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
}

// ── Recorder internals ────────────────────────────────────────────────────────

let _mediaRecorder:   MediaRecorder   | null = null
let _audioCtx:        AudioContext    | null = null
let _analyser:        AnalyserNode    | null = null
let _stream:          MediaStream     | null = null
let _rafId:           number                 = 0
let _startTime:       number                 = 0
let _durationTimer:   ReturnType<typeof setInterval> | null = null
let _chunks:          Blob[]                 = []

const FREQ_BINS = 64   // analyser resolution

function _stopLevelLoop() {
  cancelAnimationFrame(_rafId)
  levelBars.value = [0, 0, 0, 0, 0]
}

function _runLevelLoop() {
  if (!_analyser) return
  const data = new Uint8Array(_analyser.frequencyBinCount)
  const loop  = () => {
    if (!recording.value) return
    _analyser!.getByteFrequencyData(data)
    // Map 5 frequency bands (low → high) to bar heights 0–100
    const bins = _analyser!.frequencyBinCount
    levelBars.value = [0.05, 0.15, 0.30, 0.55, 0.80].map(frac => {
      const start = Math.floor(frac * bins)
      const end   = Math.min(bins, start + Math.floor(bins * 0.12))
      let sum = 0
      for (let i = start; i < end; i++) sum += data[i]!
      return Math.min(100, Math.round((sum / (end - start) / 255) * 100 * 1.8))
    })
    _rafId = requestAnimationFrame(loop)
  }
  loop()
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Start recording from the default microphone. */
export async function startRecording(): Promise<void> {
  recError.value = ''
  try {
    _stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  } catch (e: any) {
    recError.value = e.name === 'NotAllowedError'
      ? 'Microphone permission denied — please allow in browser settings'
      : `Microphone unavailable: ${e.message}`
    return
  }

  _audioCtx = new AudioContext()
  _analyser  = _audioCtx.createAnalyser()
  _analyser.fftSize = FREQ_BINS * 2
  _analyser.smoothingTimeConstant = 0.6

  const src = _audioCtx.createMediaStreamSource(_stream)
  src.connect(_analyser)

  const mime = bestMimeType()
  _chunks    = []
  _mediaRecorder = new MediaRecorder(_stream, mime ? { mimeType: mime } : undefined)
  _mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) _chunks.push(e.data) }

  _mediaRecorder.start(250)   // collect chunks every 250 ms
  recording.value  = true
  _startTime       = Date.now()
  recDuration.value = 0

  _durationTimer = setInterval(() => {
    recDuration.value = Math.round((Date.now() - _startTime) / 1000)
  }, 1000)

  _runLevelLoop()
}

/** Stop recording and persist to IndexedDB. Returns the saved recording id. */
export async function stopRecording(): Promise<string | null> {
  if (!_mediaRecorder || !recording.value) return null
  recording.value = false

  _stopLevelLoop()
  if (_durationTimer) { clearInterval(_durationTimer); _durationTimer = null }

  return new Promise((resolve) => {
    _mediaRecorder!.onstop = async () => {
      const blob     = new Blob(_chunks, { type: _mediaRecorder!.mimeType })
      const duration = Math.round((Date.now() - _startTime) / 1000)
      const id       = `rec-${Date.now()}`
      const mime     = _mediaRecorder!.mimeType
      const ext      = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'mp4' : 'webm'
      const name     = `Field recording ${new Date().toLocaleString()} .${ext}`

      const rec: AudioRecording = {
        id, name, blob,
        timestamp: Date.now(),
        duration,
        mimeType:  mime,
        size:      blob.size,
      }
      await saveRecording(rec)
      recDuration.value = duration

      // Clean up
      _stream?.getTracks().forEach(t => t.stop())
      _audioCtx?.close()
      _mediaRecorder = null; _audioCtx = null; _analyser = null; _stream = null; _chunks = []

      resolve(id)
    }
    _mediaRecorder!.stop()
  })
}

/** Download a saved recording as a file. */
export async function downloadRecording(id: string): Promise<void> {
  const rec = await getRecording(id)
  if (!rec) return
  const ext  = rec.mimeType.includes('ogg') ? 'ogg' : rec.mimeType.includes('mp4') ? 'mp4' : 'webm'
  const url  = URL.createObjectURL(rec.blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${rec.name}.${ext}`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** Format seconds as mm:ss */
export function formatDuration(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}
