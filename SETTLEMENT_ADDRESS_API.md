# Settlement Address API — Dependencies & Implementation Status

**SCD Hub · Exotopia.org · Reference doc · GPL v3**

This is a practical companion to [SPEC_EXOLOC_ADDRESS.md](SPEC_EXOLOC_ADDRESS.md), which defines the address
*grammar* (the `exotopia:{scope}:{path}` format, the eight registered scopes, versioning). This
doc instead answers a different question: **if you want to place a settlement — attach an
address to a real location in our data — what actually has to happen, what depends on what, and
which of it exists today versus is still just specified?**

Short version: the address itself is a pure, offline string computation. There is **no
collision-proof claim** on it — that's an intentional design choice, not a gap. Durability comes
from someone keeping a settlement's content pinned to IPFS, not from exclusive on-chain
ownership. There is no server API and no shared database behind a settlement address; this repo
previously used blockchain minting to make a settlement durable and (informally) contested, but
that's been removed in favour of IPFS pinning — see `src/lib/ipfs-pinning.ts`. The relocated
per-chain minting code that used to sit here lives on at `/lib/chains`, kept for reuse in other
projects rather than deleted.

---

## 1. The pipeline

```
Reference data  →  Address construction  →  Local settlement record  →  IPFS pin (optional)
  (static JSON)        (pure functions)          (client-only)           (durability, not exclusivity)
```

| # | Stage | Code | Depends on | Status |
|---|---|---|---|---|
| 1 | Reference-body data | `src/stores/galaxy.ts` fetching `/exoplanets-viz.json`, `/frontier-exoplanets.json`, `/candidate-exoplanets.json` | Static JSON built offline by `scripts/fetch-exoplanet-archive.mjs` from the NASA Exoplanet Archive | **Implemented** |
| 2 | Address construction | `src/lib/settlements.ts` (`surfaceKey`, `clusterKey`, `moonKey`, `orbitalKey`), `src/lib/moon-settlement.ts` (moon address builders) | Nothing external — pure string formatting from reference-body fields. Guarded against a moon (or any settlement) being built with another settlement's key as its parent — every builder rejects a `:` in a field meant to be a bare designation, since every key format uses `:` as its own field separator. | **Implemented** |
| 3 | Local settlement record | `src/lib/settlements.ts` (`useSettlements`/`addSettlement`), persisted via `src/lib/storage-cipher.ts` | Browser `localStorage` only, E8-lattice-obfuscated. Uniqueness (`hasSettlement`) is checked against **this browser's own list**, not any shared registry — and nothing anywhere makes it authoritative; see §2. | **Implemented, client-local only, by design** |
| 4 | IPFS pin (optional) | `src/lib/ipfs-pinning.ts` (`pinSettlement`, `PinningService` plugin interface — one working implementation, Pinata, shipped) | The address string from stage 2, plus a title/description the settlement owner supplies | **Implemented.** No wallet, no chain, no gas fee. Purely additive — settlement creation at stage 3 has never depended on it. |
| 5 | Public read API | A hypothetical `GET /api/v1/exoloc?address={address}` — named in `SPEC_EXOLOC_ADDRESS.md`'s header as "Public API" | Would need to read whatever stage 4 actually pinned | **Not implemented, and no longer the obvious next step** — see §3. `./api/` in this repo contains only a static `gallery1.json`; there is no `exoloc` handler anywhere in the codebase. |

## 2. What "the address is the API" actually means today

There is no Exotopia-operated service you can call to reserve, validate globally, or look up a
settlement address. Concretely:

- **No collision authority — permanently, not provisionally.** `moonKey`/`surfaceKey`/etc. are
  deterministic — the same inputs always produce the same string — but nothing stops two
  different users from independently constructing the same address and each pinning their own
  content under it. There is no contract, no chain, and no server-side reservation ledger to
  arbitrate that. Whatever practical uniqueness exists comes only from the low odds of two users
  picking the same named region on the same body. This used to be described as a gap a future
  chain-based collision authority would close (see §3 of the pre-IPFS version of this doc, in git
  history) — it isn't anymore. Removing blockchain minting means there is no mechanism left that
  *could* arbitrate collisions even in principle; that's accepted, not deferred.
- **No shared persistence.** Confirmed against `supabase/migrations/` — there is a `rewards`,
  `pfas_citizen_science`, `knowledge_keepers`, `blog_comments` table, etc., but no `settlements`
  table. A settlement "exists" in two places only: the owning browser's `localStorage`, and —
  if the owner chose to pin it — whichever IPFS pinning service holds that content. Neither is a
  shared source of truth; a settlement record is fundamentally local, and a pin is durability
  infrastructure, not a registry.
- **This is architecture, not an oversight.** It matches the stated operating strategy in
  `compliance/INDEX.md` §"Our operating strategy": *"Be a tool, not a custodian... we do not hold
  user funds... users interact directly with public blockchains via their own keys."* A
  server-side settlements database — or a chain-based collision authority — would be a custodial
  record Exotopia would then be responsible for. The current design avoids that liability twice
  over: once by never having run a settlements database, and now again by not depending on a
  blockchain either.

## 3. If a lookup API were actually built

The pre-IPFS version of this section described a chain indexer watching for mints. That's gone —
there's no chain to index anymore. What replaces it is simpler: IPFS is already content-addressed,
so any pinned settlement is directly retrievable by its CID from any public IPFS gateway
(`https://ipfs.io/ipfs/<cid>`) without Exotopia running anything at all. What Exotopia *doesn't*
provide, and would need new infrastructure to add, is a **directory** — a way to look up "what CID
is pinned for address X" without already knowing the CID. That would need one of:

- A lightweight, non-custodial index (`address → CID`) — genuinely new state, and the same
  custodial-liability tradeoff `compliance/INDEX.md` already argues against, just for a directory
  instead of a claim registry.
- Relying on the settlement owner to publish their own CID somewhere else discoverable (a
  community node, per `SPEC_COMMUNITY_NODES.md`, is the existing mechanism for exactly this).

## 4. Related documents

- [SPEC_EXOLOC_ADDRESS.md](SPEC_EXOLOC_ADDRESS.md) — canonical address grammar, all eight scopes, versioning
- `src/lib/ipfs-pinning.ts` — the pinning module this pipeline hands off to at stage 4
- `/lib/chains/README.md` — the relocated per-chain minting code this repo no longer uses, kept for reuse elsewhere
- [SPEC_WORLDBRIDGER_ONE.md](SPEC_WORLDBRIDGER_ONE.md) — if a future node type needs multi-author attribution/royalty-split
  (a `cooperative` or `dao`-ownership node with several contributors), defer to that mechanism
  rather than inventing a second one here
