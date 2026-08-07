# SPEC: E8 Record Fingerprint

**Status:** Resolved via direct Q&A — see "Decisions" below. Implementing.

## Motivation

We now have real, verified math running as WebAssembly: `zk-e8` (a faithful
Rust port of the FoodBank project's `e8_theta.c`, bit-for-bit checked against
the original C binary — see `zk-e8/README.md`), exposed to the app via
`src/lib/e8-theta.ts`. Separately, this session built real client-side
encryption (`src/lib/encrypted-backup.ts`, AES-256-GCM + PBKDF2, verified
end-to-end) as a genuine upgrade over the existing `storage-cipher.ts`
obfuscation (which is honestly documented as *not* a security primitive).

The ask: surface the E8 math against how data is actually saved, in service
of the platform's growing set of real user workflows — mentoring, learning
goals, citizen science, volunteer incentivization, library maintenance — and
do it in a way a fork of this platform could tune for its own equivalent
workflows, not something bespoke to Exotopia's specific tables.

## What this is

A **record fingerprint**: a small set of numbers, computed deterministically
from a record's actual content, that changes if and only if the content
changes. Two honest, separable claims stacked together:

1. **The real cryptographic work is a hash, not the E8 math.** SHA-256 (via
   `crypto.subtle.digest`, already the browser-native primitive) is what
   actually gives the avalanche property — one bit different anywhere in the
   input produces an unrelated-looking output. That's what makes a
   fingerprint meaningful as tamper-evidence.
2. **The E8 theta commitment is a real, deterministic, thematically-consistent
   *rendering* of that hash** — not an independent source of security. The
   32-byte SHA-256 digest is split into 8 four-byte groups, each normalized
   to `[0,1)`, fed to `e8Commit()` as the 8 Chern roots, producing
   `{pi1, pi2, pi3, C}`. `C` (and optionally the three pi values) is the
   displayed fingerprint. This is the "art-hash" idea from the
   `e8-art-hash-zkp` blog post, but built honestly: the crypto does the
   crypto, the E8 math does the presentation, and neither claims to be doing
   the other's job.

## What this is not

- **Not a substitute for server-side integrity where a server already exists.**
  See "Two different strengths of claim" below.
- **Not hiding anything.** This is a fingerprint, not a zero-knowledge proof —
  it doesn't hide the underlying data, and was never claimed to.
- **Not protection against a same-device attacker for pure-localStorage data.**
  If both a record and its fingerprint live only in `localStorage`, anyone
  with devtools access to that browser can edit both together. See "Two
  different strengths of claim."

## Two different strengths of claim

The two chosen use cases sit at genuinely different strength levels, and the
spec should say so plainly rather than presenting one mechanism as uniformly
strong:

### A. Settlements & items — self-check strength

`SettlementRecord`/`SettlementItem` live in `localStorage` only (or synced to
`settlements`/`settlement_items` for signed-in members — see this session's
earlier persistence work). A fingerprint here is useful for:
- Detecting **accidental** corruption (a sync bug, a botched migration, a
  bad manual edit) — the fingerprint won't match if the reloaded data isn't
  bit-identical to what was fingerprinted.
- A distinctive, shareable "identity" for a settlement snapshot — visually
  consistent with the game's existing E8-flavored aesthetic (soul orbs,
  wormhole conduit lore, etc.) — without requiring anyone to fetch anything
  server-side.

It is explicitly **not** tamper-evidence against the settlement's own owner,
who can trivially edit both the record and recompute a matching fingerprint
in their own browser. That's fine and should just be said, not obscured.

### B. Citizen-science submissions — real chain-of-custody strength

`project_log_entries` (migration `003_pfas_citizen_science.sql`) is already:
- **Server-synced**, not client-only.
- **Append-only** — no `UPDATE` RLS policy exists on this table at all, only
  `INSERT`/`SELECT`. Once a log entry lands, nobody (not even its author) can
  silently edit it through the normal app.
- **Server-timestamped** (`logged_at timestamptz DEFAULT now()`), which is a
  materially stronger claim than a client-supplied timestamp, since the
  submitter doesn't control the database clock.

This means a fingerprint computed over a `project_log_entries` row's content
(`notes`, `metrics`, `logged_at`) and stored as a column on that same
append-only row is a **real, defensible claim**: "this exact content existed,
attributed to this author, no later than this server-verified time" — the
append-only policy is what makes this meaningful in a way pure localStorage
can never be, without needing blockchain, NFTs, or anything else that was
already deliberately removed from this platform.

## Proposed technical design

```
recordFingerprint(canonicalJson: string) -> Promise<{
  sha256Hex: string        // the real integrity primitive, hex-encoded
  e8: { pi1, pi2, pi3, C }  // the E8 theta rendering of that hash
}>
```

- `canonicalJson` must be built the same way every time for the same logical
  content (stable key ordering) — the caller is responsible for this; the
  function itself does not attempt to "guess" a canonical form.
- Implementation lives in a new `src/lib/record-fingerprint.ts`, calling both
  `crypto.subtle.digest('SHA-256', ...)` and `ensureE8ThetaReady()` /
  `e8Commit()` from `src/lib/e8-theta.ts`.
- Forkability: the function takes a plain string in, plain numbers out — no
  dependency on Exotopia's specific tables. A fork wiring this into their own
  workflow (a different mentoring system, a different incentive ledger) only
  needs to decide their own canonical-JSON shape, not touch this module.

## Decisions

1. **Settlements: meaningful fields only.** `type`, `planetName`, `hostname`,
   `exolocation`, `displayName`, `focus`, `objects`, `lat`/`lon`. Excludes
   `createdAt` and any future pure-bookkeeping field — the fingerprint
   changes only when something a person would recognize as "the settlement
   changed" actually changes.

2. **Settlements: computed once at creation, stored, immutable.** Computed
   inside `addSettlement()` (`src/lib/settlements.ts`) and stored as a new
   `fingerprint` field on `SettlementRecord`. Reads as "this settlement's
   identity as first established," not a live integrity check. Synced to
   the `settlements` table like every other field (no schema change needed
   there beyond the existing `objects`-style JSON columns — stored as a
   plain `jsonb` value alongside the record).

3. **Citizen science: `notes` + `metrics` only.** `project_id`/`author_id`
   stay out of the fingerprinted content — they're already immutably bound
   to the row by foreign keys and RLS, no need to duplicate that binding
   inside the hash too. Keeps the fingerprint answering "what was claimed,"
   which is the part that actually needs tamper-evidence.

4. **Citizen science: new columns, computed server-side at insert.**
   Refined during design: only the **SHA-256 hash** needs to be computed
   server-side (via `pgcrypto`'s `digest()`, already enabled since migration
   001) — that's the real cryptographic primitive, and it must be
   server-computed to be trustworthy (a client-supplied hash would be
   exactly as spoofable as a client-supplied cost was before
   `debit_construction` closed that gap). The **E8 theta rendering** of that
   hash is a pure deterministic function with no secret involved, so it runs
   **client-side** at display time from the stored hash, reusing the
   already-verified WASM module — no need to reimplement theta functions in
   PL/pgSQL. Migration adds one column: `fingerprint_sha256 bytea`,
   populated by a `BEFORE INSERT` trigger from `notes`/`metrics`.

5. **Display: plain monospace text for v1.** A fingerprint string (e.g. the
   E8 `C` value formatted to a few significant digits, or the hex hash
   truncated) shown near the record. No generated glyph/graphic in this
   pass — that's a reasonable future addition, not required to prove the
   pattern out.

6. **Forkability: the utility module itself is the extension point.**
   `record-fingerprint.ts` takes a canonical string in, plain numbers out,
   with zero Exotopia-specific dependencies. A fork wiring this into a
   different mentoring/incentive table needs only their own canonical-JSON
   shape and (if they want the stronger server-anchored variant) their own
   equivalent of the `BEFORE INSERT` trigger pattern shown here — this spec
   documents that pattern once, in "Proposed technical design" and the
   migration below, rather than adding a separate abstraction layer for it.

## Migration: `project_log_entries` fingerprint column

```sql
ALTER TABLE public.project_log_entries
  ADD COLUMN fingerprint_sha256 bytea;

CREATE OR REPLACE FUNCTION public.set_log_entry_fingerprint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.fingerprint_sha256 := digest(NEW.notes || '::' || NEW.metrics::text, 'sha256');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_log_entry_fingerprint
  BEFORE INSERT ON public.project_log_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_log_entry_fingerprint();
```

No `UPDATE` case needed — the table already has no `UPDATE` policy at all,
so this column is set once, at insert, and never revisited, consistent with
the table's existing append-only design.
