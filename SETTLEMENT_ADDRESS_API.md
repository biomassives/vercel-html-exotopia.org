# Settlement Address API — Dependencies & Implementation Status

**SCD Hub · Exotopia.org · Reference doc · GPL v3**

This is a practical companion to [SPEC_EXOLOC_ADDRESS.md](SPEC_EXOLOC_ADDRESS.md), which defines the address
*grammar* (the `exotopia:{scope}:{path}` format, the eight registered scopes, versioning). This
doc instead answers a different question: **if you want to place a settlement — attach an
address to a real location in our data — what actually has to happen, what depends on what, and
which of it exists today versus is still just specified?**

Short version: the address itself is a pure, offline string computation. What it *means* — a
durable, shared, collision-free claim on a location — is guaranteed entirely by the blockchain
layer once minted, not by anything Exotopia.org runs as a service. There is currently no server
API and no shared database behind a settlement address.

---

## 1. The pipeline

```
Reference data  →  Address construction  →  Local settlement record  →  Chain metadata  →  Mint (pon.ink)
  (static JSON)        (pure functions)          (client-only)          (per-chain writer)     (durable record)
```

| # | Stage | Code | Depends on | Status |
|---|---|---|---|---|
| 1 | Reference-body data | `src/stores/galaxy.ts` fetching `/exoplanets-viz.json`, `/frontier-exoplanets.json`, `/candidate-exoplanets.json` | Static JSON built offline by `scripts/fetch-exoplanet-archive.mjs` from the NASA Exoplanet Archive | **Implemented** |
| 2 | Address construction | `src/lib/settlements.ts` (`surfaceKey`, `clusterKey`, `moonKey`, `orbitalKey`), `src/lib/moon-settlement.ts` (moon address builders) | Nothing external — pure string formatting from reference-body fields. Guarded against a moon being built with another settlement as its parent (`:`-rejection on `planetName`/`parentPlanet`). | **Implemented** |
| 3 | Local settlement record | `src/lib/settlements.ts` (`useSettlements`/`addSettlement`), persisted via `src/lib/storage-cipher.ts` | Browser `localStorage` only, E8-lattice-obfuscated. Uniqueness (`hasSettlement`) is checked against **this browser's own list**, not any shared registry. | **Implemented, but client-local only** |
| 4 | Chain metadata embedding | `src/lib/evm/erc721-metadata.ts`, `src/lib/solana/station-metadata.ts`, `src/lib/algorand/exolocation-metadata.js` | The address string from stage 2, `src/lib/resonance-split.ts` (fee split for the EVM writer), a per-chain metadata schema with required reference/boundary fields (`exolocation-metadata.js`'s `required_ref`/`required_boundary` validators) | **Implemented** (three chain-specific writers, no shared abstraction across them) |
| 5 | Mint transaction | pon.ink (wallet connect, Stripe/M-Pesa on-ramp, transaction submission) | Everything above, plus pon.ink's own account/payment layer — see `SPEC_PON_INK.md` | **Owned by pon.ink, not this repo** |
| 6 | Public read API | `GET /api/v1/exoloc?address={address}` — named in `SPEC_EXOLOC_ADDRESS.md`'s header as "Public API" | Would need to read whatever stage 5 actually wrote on-chain | **Not implemented.** `./api/` in this repo contains only a static `gallery1.json`; there is no `exoloc` handler anywhere in the codebase. This line in the spec is aspirational. |

## 2. What "the address is the API" actually means today

There is no Exotopia-operated service you can call to reserve, validate globally, or look up a
settlement address. Concretely:

- **No collision authority.** `moonKey`/`surfaceKey`/etc. are deterministic — the same inputs
  always produce the same string — but nothing server-side stops two different users from
  independently constructing and minting the same address on two different chains. Whatever
  uniqueness exists today comes from (a) the low practical odds of two users picking the same
  named region on the same body, and (b) whatever a given chain's mint contract itself enforces,
  which this repo doesn't control.
- **No shared persistence.** Confirmed against `supabase/migrations/` — there is a `rewards`,
  `pfas_citizen_science`, `knowledge_keepers`, `blog_comments` table, etc., but no `settlements`
  table. A settlement "exists" in two places only: the owning browser's `localStorage`, and — once
  minted — the NFT metadata on whichever public chain it was minted on. The chain is the actual
  source of truth; the local record is a convenience cache the current browser session uses to
  avoid re-fetching/re-deriving it.
- **This is architecture, not an oversight.** It matches the stated operating strategy in
  `compliance/INDEX.md` §"Our operating strategy": *"Be a tool, not a custodian... we do not hold
  user funds... users interact directly with public blockchains via their own keys."* A
  server-side settlements database would be a custodial record Exotopia would then be responsible
  for — the current design deliberately avoids that liability by keeping the public chain as the
  only durable record.

## 3. If `/api/v1/exoloc` were actually built

For a future implementer: a read-only lookup endpoint doesn't need new state — it needs a chain
indexer per network (EVM, Solana, Algorand) that watches for mints carrying the exolocation
metadata schema (§1 stage 4) and serves them back by address string. That's a read-side aggregator
over three existing, independent metadata formats, not a new source of truth. Writing (reserving an
address before mint) would be a materially bigger step — it would require either a
lightweight non-custodial reservation ledger (a `settlements` table with a short TTL, so a
reservation expires if the mint never completes) or accepting that collisions are resolved
entirely on-chain, first-mint-wins.

## 4. Related documents

- [SPEC_EXOLOC_ADDRESS.md](SPEC_EXOLOC_ADDRESS.md) — canonical address grammar, all eight scopes, versioning
- [SPEC_PON_INK.md](SPEC_PON_INK.md) — the payment/mint layer this pipeline hands off to at stage 5
- [SPEC_WORLDBRIDGER_ONE.md](SPEC_WORLDBRIDGER_ONE.md) — multi-author attribution for `collab`-scope addresses
- [compliance/INDEX.md](compliance/INDEX.md) — the "tool, not custodian" stance stages 3 and 6 are built around
