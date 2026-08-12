/**
 * src/lib/encrypted-backup.ts
 *
 * Real, standard, browser-native encryption for a data export file — AES-256-GCM
 * with a key derived from a user-chosen passphrase via PBKDF2 (both via WebCrypto,
 * `crypto.subtle`). No invented primitives, no novel scheme: this is the same
 * construction (PBKDF2 → AES-GCM) used by password managers and encrypted-archive
 * tools generally.
 *
 * This is deliberately NOT the same thing as storage-cipher.ts's localStorage
 * obfuscation. That cipher's key lives in the source code, co-located with the
 * data it "protects" — it defends against casual inspection, not a real attacker,
 * and says so in its own header comment. Here, the key is derived from a
 * passphrase that only the user knows and that is never stored anywhere — so an
 * exported file is genuinely unreadable to anyone who doesn't have that
 * passphrase, including us. That's a real difference in what can honestly be
 * claimed, and it's why this lives in a separate module rather than extending
 * the existing one.
 *
 * Threat model: protects a downloaded backup file at rest (e.g. sitting in a
 * Downloads folder, an email attachment, cloud storage) against anyone who
 * doesn't know the passphrase. It does not protect against someone who captures
 * the passphrase itself (e.g. malware/keylogger on the device at the moment of
 * use) — no client-side scheme can.
 */

const PBKDF2_ITERATIONS = 250_000   // OWASP-recommended floor (2023 guidance) for PBKDF2-SHA256
const ENVELOPE_VERSION  = 1

interface BackupEnvelope {
  v:          number     // envelope format version
  salt:       string      // base64, 16 bytes — PBKDF2 salt
  iv:         string      // base64, 12 bytes — AES-GCM nonce
  iterations: number
  ciphertext: string      // base64
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypts `data` with a key derived from `passphrase`. Returns a JSON string
 * (the "envelope") safe to write to a downloadable file — salt, iv, and
 * iteration count travel alongside the ciphertext since none of them are
 * secret on their own; only the passphrase is.
 */
export async function encryptBackup(passphrase: string, data: unknown): Promise<string> {
  if (!passphrase) throw new Error('A passphrase is required to encrypt a backup.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv   = crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS)

  const plaintext  = new TextEncoder().encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  const envelope: BackupEnvelope = {
    v: ENVELOPE_VERSION,
    salt: toBase64(salt),
    iv: toBase64(iv),
    iterations: PBKDF2_ITERATIONS,
    ciphertext: toBase64(ciphertext),
  }
  return JSON.stringify(envelope, null, 2)
}

/**
 * Decrypts an envelope produced by encryptBackup(). Throws a plain, user-facing
 * Error (not a raw DOMException) on the two ways this can fail: wrong
 * passphrase, or a file that isn't a valid envelope — AES-GCM's authentication
 * tag makes it impossible to "partially" decrypt with the wrong key, so those
 * are the only two failure modes.
 */
export async function decryptBackup(passphrase: string, envelopeJson: string): Promise<unknown> {
  let envelope: BackupEnvelope
  try {
    envelope = JSON.parse(envelopeJson)
    if (envelope.v !== ENVELOPE_VERSION || !envelope.salt || !envelope.iv || !envelope.ciphertext) {
      throw new Error('shape mismatch')
    }
  } catch {
    throw new Error('This doesn\'t look like an Exotopia encrypted backup file.')
  }

  const salt = fromBase64(envelope.salt)
  const iv   = fromBase64(envelope.iv)
  const key  = await deriveKey(passphrase, salt, envelope.iterations)

  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(envelope.ciphertext))
    return JSON.parse(new TextDecoder().decode(plaintext))
  } catch {
    throw new Error('Wrong passphrase, or the file is corrupted.')
  }
}
