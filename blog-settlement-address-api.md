# The Settlement URL Is an Address, Not Yet an API

**SCD Hub · Exotopia.org · Working draft · GPL v3**
*Internal document — intended for release; review before publishing*

---

## What "placing a site" actually means right now

Every settlement in Exotopia has a URL-shaped address — something like
`exotopia:surface:kepler-442/kepler-442b/aurora-basin`, which also works as a browser path,
`exotopia.org/surface/kepler-442/kepler-442b/aurora-basin`. `SPEC_EXOLOC_ADDRESS.md` defines the
full grammar: eight scopes (surface, orbital, lunar-orbital, stellar-orbital in production;
bh-orbital, trajectory, branch, and collab newly specified), each mapping to a real astronomical
reference body pulled from the NASA Exoplanet Archive.

The header of that spec names a "Public API": `GET /api/v1/exoloc?address={address}`. We went
looking for it while writing this post. It doesn't exist. The `/api` folder in this repo has one
static gallery JSON file and nothing else. That line in the spec describes an aspiration, not a
shipped endpoint — and it's worth being honest about that gap in public, rather than letting the
spec imply more than the code delivers.

## So what's actually holding an address together?

Tracing it end to end: the address string itself is a pure, offline computation — a handful of
functions in `src/lib/settlements.ts` and `src/lib/moon-settlement.ts` that format a reference
body's name, coordinates, and a region label into the canonical string. No network call, no
database write. Just deterministic string-building, the same inputs always producing the same
output.

What happens next is where it gets interesting. There is no settlement table anywhere in our
Supabase schema — we checked every migration. A settlement address exists in exactly two places:
whatever the current browser's `localStorage` remembers (encrypted with our E8-lattice cipher, but
still just a local cache, not a shared registry), and — once someone actually mints it — the NFT
metadata written to a public blockchain by one of three independent, chain-specific writers (EVM,
Solana, Algorand). The chain is the real source of truth. Our own client-side record is a
convenience, not an authority.

That's not an oversight we're patching. It's the architecture we already committed to elsewhere:
our compliance notes describe Exotopia as "a tool, not a custodian" — we don't hold user funds, we
don't run a wallet, and we don't take custody of NFTs. A server-side settlements database with the
authority to say "this address is taken" would quietly turn us into exactly the kind of custodian
we've deliberately avoided becoming. So today, if two people independently construct and mint the
same address on two different chains, nothing in our stack stops them — whatever collision
resolution exists is whatever the destination chain's own mint logic enforces, which is outside
this repo entirely.

## What it would take to close the gap

A **read-only** version of `/api/v1/exoloc` is the easy half: an indexer per chain that watches for
mints carrying our exolocation metadata schema and serves them back by address string. That's an
aggregator over three formats that already exist — no new state, no new authority claimed.

A **write-side** reservation — actually being able to ask "is this address free?" before minting —
is the harder half, and the one that would force a real decision. Either we accept collisions are
resolved entirely on-chain, first-mint-wins, and document that plainly as the honest current
behavior. Or we stand up a lightweight, non-custodial reservation ledger — short-TTL, so a
reservation expires automatically if the mint never completes, and holds no funds and no identity,
just "this string is provisionally claimed for the next N minutes." We haven't made that call yet.
It's a real product decision, not a technical one, and it should happen with eyes open about what
each option costs.

## Where this leaves us

The settlement address system works exactly as advertised for what it's used for today: a
human-readable, deterministic, chain-embeddable identifier. What it isn't, yet, is a service — the
"API" in the spec's header is a plan, not a deployed thing. We think that's worth saying out loud,
both because it's more honest than letting the spec's phrasing stand unchallenged, and because it's
a genuinely open design question — not a bug tracker item — for whoever picks up the read/write API
work next.

*See `SETTLEMENT_ADDRESS_API.md` for the full dependency breakdown this post is based on.*
