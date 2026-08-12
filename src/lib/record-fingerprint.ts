/**
 * src/lib/record-fingerprint.ts
 *
 * A "record fingerprint": a small set of numbers, computed deterministically
 * from a record's content, that changes if and only if the content changes.
 * Two separable claims stacked together — see SPEC_E8_RECORD_FINGERPRINT.md
 * for the full design and the two different strength levels this is used at
 * (a local-only settlement "identity" vs. a server-anchored citizen-science
 * chain-of-custody claim).
 *
 * 1. The real cryptographic work is SHA-256 (`crypto.subtle.digest`) — that's
 *    what gives the avalanche property that makes a fingerprint meaningful.
 * 2. The E8 theta commitment (`src/lib/e8-theta.ts`, real WASM math, verified
 *    against the original C reference) is a deterministic *rendering* of
 *    that hash into the platform's existing E8-flavored numeric language —
 *    not an independent source of security. Splitting the hash into 8
 *    normalized values and running them through `e8Commit` doesn't add or
 *    remove any tamper-evidence; it's presentation on top of the hash.
 *
 * Forkability: this module takes a plain string in and plain numbers out,
 * with no dependency on any Exotopia-specific table or record shape. A fork
 * wiring this into a different workflow only needs to decide their own
 * canonical-JSON shape for the record they want fingerprinted.
 */

import { ensureE8ThetaReady, e8Commit, type E8Commit } from './e8-theta'

export interface RecordFingerprint {
  /** Hex-encoded SHA-256 digest — the actual integrity primitive. */
  sha256Hex: string
  /** The E8 theta rendering of that digest — presentation only. */
  e8: E8Commit
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** Splits a 32-byte SHA-256 digest into 8 normalized [0,1) values for e8Commit(). */
function digestToChernRoots(digest: Uint8Array): number[] {
  if (digest.length !== 32) {
    throw new Error(`digestToChernRoots expects a 32-byte SHA-256 digest, got ${digest.length} bytes`)
  }
  const view = new DataView(digest.buffer, digest.byteOffset, digest.byteLength)
  const roots: number[] = []
  for (let i = 0; i < 8; i++) {
    const word = view.getUint32(i * 4, false) // big-endian, arbitrary but fixed convention
    roots.push(word / 0x1_0000_0000)
  }
  return roots
}

/**
 * Computes a fingerprint from a canonical string. The caller is responsible
 * for building that string the same way every time for the same logical
 * content (stable key ordering) — this function does not attempt to
 * "guess" a canonical form for arbitrary objects.
 */
export async function recordFingerprint(canonical: string): Promise<RecordFingerprint> {
  const bytes = new TextEncoder().encode(canonical)
  const digestBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const digest = new Uint8Array(digestBuffer)

  await ensureE8ThetaReady()
  const e8 = e8Commit(digestToChernRoots(digest))

  return { sha256Hex: bytesToHex(digest), e8 }
}

/**
 * Renders an already-computed SHA-256 digest (e.g. one fetched from a
 * server column, as bytea/hex) as the E8 theta commitment — for the
 * server-anchored case where the hash was computed server-side and only the
 * presentation layer runs client-side. See SPEC_E8_RECORD_FINGERPRINT.md
 * decision 4.
 */
export async function renderFingerprintFromHex(sha256Hex: string): Promise<E8Commit> {
  const bytes = new Uint8Array(sha256Hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(sha256Hex.slice(i * 2, i * 2 + 2), 16)
  }
  await ensureE8ThetaReady()
  return e8Commit(digestToChernRoots(bytes))
}

/** Short, human-glanceable display string for a fingerprint. */
export function formatFingerprint(e8: E8Commit): string {
  return `E8:${e8.c.toFixed(6)}`
}
