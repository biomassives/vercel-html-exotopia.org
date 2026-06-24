/**
 * src/lib/portal-chime.ts
 *
 * Shimmering etheric bell / chime tone for the wormhole transit animation.
 * Synthesised in-browser via the Web Audio API — no audio file to load,
 * so it ships at zero additional bytes (the API is built into every browser).
 *
 * Sound design: resonant metallic bell with long decay, tuned to a pentatonic
 * cluster (A4 / E5 / C#5) for an open, peaceful, cosmic quality.
 * Three overtone partials with gentle detuning create a shimmering "etheric"
 * quality like Tibetan singing bowls or crystal glasses.
 *
 * Usage:
 *   import { playPortalChime, fadePortalChime } from 'src/lib/portal-chime'
 *
 *   // On portal open (WormholePortal.vue startAnimation):
 *   playPortalChime()
 *
 *   // On portal close:
 *   fadePortalChime()
 */

// ── Shared AudioContext (created lazily on first interaction) ─────────────────

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

// Currently playing chime nodes — so we can fade them out cleanly
const activeNodes: { osc: OscillatorNode; gain: GainNode }[] = []

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.0
    masterGain.connect(ctx.destination)
  }
  return ctx
}

// ── Bell partial definition ───────────────────────────────────────────────────

interface Partial {
  freq:     number    // Hz
  gainPeak: number    // peak amplitude (0–1)
  attack:   number    // seconds to peak
  decay:    number    // seconds of exponential decay
  detune:   number    // cents of subtle detuning (shimmer)
}

// Pentatonic cluster — A4, E5, C#5 with overtone shimmer
// Using just intonation ratios for bell-like harmonic series
const PARTIALS: Partial[] = [
  // Fundamental — A4 (440 Hz), warm and centred
  { freq: 440.0,  gainPeak: 0.55, attack: 0.004, decay: 6.5,  detune:   0 },
  // First overtone — E5 (659 Hz, pure fifth), clear ring
  { freq: 659.3,  gainPeak: 0.30, attack: 0.006, decay: 5.8,  detune:  +4 },
  // Second overtone — C#5 (554 Hz, major third), warmth
  { freq: 554.4,  gainPeak: 0.22, attack: 0.008, decay: 5.2,  detune:  -3 },
  // Upper shimmer — A5 (880 Hz, octave), sparkle
  { freq: 880.0,  gainPeak: 0.14, attack: 0.005, decay: 4.0,  detune:  +7 },
  // Beatless warmth — A4 slight detune creates chorus shimmer
  { freq: 440.0,  gainPeak: 0.12, attack: 0.010, decay: 7.0,  detune: -12 },
  // High crystal — E6 (1318 Hz), airiness
  { freq: 1318.5, gainPeak: 0.07, attack: 0.003, decay: 2.8,  detune:  +2 },
]

// ── Main chime trigger ────────────────────────────────────────────────────────

/**
 * Play the etheric bell chime.
 * Call once when the wormhole portal starts.
 * The chime sustains naturally for 6–7 seconds with a long exponential decay.
 */
export function playPortalChime(volume = 0.17): void {
  try {
    const audioCtx = getCtx()

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }

    // Ramp master gain up quickly then let the bell decay naturally
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime)
      masterGain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.02)
    }

    const now = audioCtx.currentTime

    for (const p of PARTIALS) {
      const osc  = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type      = 'sine'
      osc.frequency.value = p.freq
      osc.detune.value    = p.detune

      // Attack
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(p.gainPeak, now + p.attack)

      // Exponential decay — bell-like long ring
      gain.gain.setTargetAtTime(0.001, now + p.attack, p.decay * 0.4)
      gain.gain.setValueAtTime(0, now + p.attack + p.decay + 1.5)

      osc.connect(gain)
      gain.connect(masterGain!)

      osc.start(now)
      osc.stop(now + p.attack + p.decay + 2.0)

      activeNodes.push({ osc, gain })
    }

    // Clean up finished nodes after the longest decay
    setTimeout(() => { activeNodes.length = 0 }, (PARTIALS.reduce((m, p) => Math.max(m, p.decay), 0) + 3) * 1000)
  } catch (e) {
    console.warn('[portal-chime] Web Audio not available:', e)
  }
}

/**
 * Gently fade the chime out over `durationSec` seconds.
 * Call when the portal closes if it was dismissed early.
 */
export function fadePortalChime(durationSec = 1.2): void {
  if (!masterGain || !ctx) return
  try {
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(0, now + durationSec)
  } catch { /* noop */ }
}

/**
 * Play a single, softer arrival bell (3 partials, shorter decay).
 * Optional: call at the EMERGE phase of the portal.
 */
export function playArrivalTone(volume = 0.40): void {
  try {
    const audioCtx = getCtx()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime)
      masterGain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.03)
    }
    const now = audioCtx.currentTime
    // Single soft bell — E5 with gentle shimmer
    const arrivalPartials: Partial[] = [
      { freq: 659.3, gainPeak: 0.50, attack: 0.005, decay: 3.5, detune:   0 },
      { freq: 880.0, gainPeak: 0.22, attack: 0.007, decay: 2.8, detune:  +5 },
      { freq: 440.0, gainPeak: 0.18, attack: 0.010, decay: 3.8, detune:  -8 },
    ]
    for (const p of arrivalPartials) {
      const osc  = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.value = p.freq
      osc.detune.value    = p.detune
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(p.gainPeak, now + p.attack)
      gain.gain.setTargetAtTime(0.001, now + p.attack, p.decay * 0.38)
      gain.gain.setValueAtTime(0, now + p.attack + p.decay + 1.0)
      osc.connect(gain)
      gain.connect(masterGain!)
      osc.start(now)
      osc.stop(now + p.attack + p.decay + 1.5)
    }
  } catch { /* noop */ }
}
