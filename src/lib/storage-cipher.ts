/**
 * src/lib/storage-cipher.ts
 *
 * E8 lattice stream cipher for localStorage obfuscation.
 *
 * Key material: the 240 roots of the E8 root system (8 dimensions each).
 * Each root coordinate ∈ {−1, −½, 0, ½, 1} is scaled to a byte, then
 * mixed with a site seed and a positional index so no clear-text JSON
 * appears in browser storage.
 *
 * This is not a cryptographic primitive — the key is in the source.
 * Purpose: prevent casual reading of stored location / settlement data
 * by browser extensions, analytics scripts, or dev-tools inspection.
 */

import { e8Roots }    from './e8-lattice'
import type { Root8 } from './e8-lattice'

// ── Constants ─────────────────────────────────────────────────────────────────

const SITE_SEED    = 'xto:e8:ls:v1'
const E8_EXPONENTS = [1, 7, 11, 13, 17, 19, 23, 29] as const

// ── Lazy-initialised state ────────────────────────────────────────────────────

let _roots:   Root8[]    | null = null
let _seedVec: Uint8Array | null = null

function roots(): Root8[] {
  if (!_roots) _roots = e8Roots()
  return _roots
}

function seedVec(): Uint8Array {
  if (_seedVec) return _seedVec
  // FNV-1a each dimension, salted by position and the dimension's exponent
  const vec = new Uint8Array(8)
  for (let d = 0; d < 8; d++) {
    let h = 0x811c9dc5 >>> 0
    for (let c = 0; c < SITE_SEED.length; c++) {
      h ^= (SITE_SEED.charCodeAt(c) + d * 41 + E8_EXPONENTS[d]) & 0xFF
      h  = Math.imul(h, 0x01000193) >>> 0
    }
    vec[d] = h & 0xFF
  }
  return (_seedVec = vec)
}

// ── Key stream ────────────────────────────────────────────────────────────────
//
// Position i maps to:
//   root  = roots[(i >> 3) % 240]   — changes every 8 positions
//   dim   = i & 7                   — cycles through all 8 dimensions
//   scaled = (root[dim] + 1) * 127.5 — {0, 64, 128, 192, 255}
//   mixed  = scaled ^ seedVec[dim] ^ exponent ^ (i & 0xFF) ^ (i >> 8)
//
// The (i & 0xFF) ^ (i >> 8) term prevents simple key-period repetition.

function keyByte(i: number): number {
  const r      = roots()
  const sv     = seedVec()
  const ri     = (i >>> 3) % r.length
  const dim    = i & 7
  const scaled = Math.round((r[ri][dim] + 1) * 127.5)
  const sMix   = (i & 0xFF) ^ ((i >>> 8) & 0xFF)
  return (scaled ^ sv[dim] ^ E8_EXPONENTS[dim] ^ sMix) & 0xFF
}

// ── Codec ─────────────────────────────────────────────────────────────────────

const ENC = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null
const DEC = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null

export function encryptForStorage(plaintext: string): string {
  const bytes = ENC ? ENC.encode(plaintext)
    : Uint8Array.from(plaintext, c => c.charCodeAt(0))
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ^ keyByte(i))
  return btoa(bin)
}

export function decryptFromStorage(ciphertext: string): string {
  const bin   = atob(ciphertext)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ keyByte(i)
  return DEC ? DEC.decode(bytes) : String.fromCharCode(...bytes)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read + decrypt.  Falls back to plain JSON for unencrypted legacy entries
 * (transparent migration — next write will re-encrypt).
 */
export function safeRead<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(decryptFromStorage(raw)) as T
  } catch {
    try { return JSON.parse(raw) as T } catch { return fallback }
  }
}

/** Encrypt + write. */
export function safeWrite(key: string, value: unknown): void {
  try { localStorage.setItem(key, encryptForStorage(JSON.stringify(value))) } catch { /* quota */ }
}

/**
 * FNV-1a hash → base-36 string.
 * Used to turn human-readable settlement keys into opaque localStorage sub-keys.
 */
export function hashStorageKey(s: string): string {
  let h = 0x811c9dc5 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h  = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}
