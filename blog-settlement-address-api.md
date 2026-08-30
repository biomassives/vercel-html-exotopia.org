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

What happens next is simpler than it used to be. There is no settlement table anywhere in our
Supabase schema — we checked every migration. A settlement address exists in exactly two places:
whatever the current browser's `localStorage` remembers, and — if the owner chooses — an IPFS
pin. That's it; there is no third, chain-based step anymore. The localStorage record is run
through `storage-cipher.ts`, an E8-lattice-keyed stream cipher — worth being precise about what
that actually is: its own header comment says outright, "this is not a cryptographic primitive —
the key is in the source." It's obfuscation against casual reading (browser extensions, analytics
scripts, dev-tools inspection), not encryption, and it makes no security claim beyond that. The
IPFS pin, via `src/lib/ipfs-pinning.ts`, is durability infrastructure, not a claim registry — it
keeps a settlement's content retrievable as long as someone (the owner, or anyone else who cares
to) keeps it pinned. Neither localStorage nor an IPFS pin is a shared source of truth; both are
exactly what they look like, nothing more.

This repo used to route a settlement through blockchain minting instead — three independent,
chain-specific metadata writers (EVM, Solana, Algorand) — and that used to be the durable, shared
record once minted. That path has been removed. The per-chain minting code hasn't been deleted,
just relocated to `archive/chains/` in case another project wants it; nothing in the live
settlement flow calls it anymore.

That's not an oversight we're patching. It's the architecture we already committed to elsewhere:
our compliance notes describe Exotopia as "a tool, not a custodian" — we don't hold user funds, we
don't run a wallet, and we don't take custody of NFTs. A server-side settlements database with the
authority to say "this address is taken" would quietly turn us into exactly the kind of custodian
we've deliberately avoided becoming — and so would a blockchain-based collision authority, for the
same reason, just enforced by someone else's chain instead of our own server. Removing the
blockchain path means there is no longer any mechanism, anywhere, that *could* arbitrate address
collisions even in principle. We're stating that as an accepted design decision, not a gap we
still owe an answer to: if two people independently construct and pin the same address, nothing in
our stack stops them, and nothing is meant to.

## A note on E8, since it comes up twice in this codebase and means two very different things

The obfuscation cipher above is one of two unrelated things in this repo that both use "E8" in
their name, and it's worth being explicit about the difference so nobody reasonably conflates
them. The other one is a genuine zero-knowledge-proof design — E8/Λ₂₄ lattice points verified with
PLONK/halo2 proofs — written up in `SPEC_ECO_OPS_API.md` and referenced on the Platform page as a
planned item requiring a Rust circuit implementation and a Solana program deployment. **It is not
built.** No circuit exists, nothing is deployed, and — notably — even if it were built, it would
verify on-chain (Solana), which is a different tradeoff than the local-first, chain-free path this
post describes for settlement addresses. We're calling this out on purpose: a June 2026 press
release once described a "working" zero-knowledge payment system for our Kenya field partners that
didn't actually exist, and we published a correction admitting it. We'd rather over-explain the
difference between "a cipher named after E8" and "an unbuilt E8-based ZK proof spec" here than
risk that happening again.

## What it would take to close the remaining gap

The collision question above is closed, by decision. What's still genuinely open is discovery: IPFS
is content-addressed, so any pinned settlement is directly retrievable by its CID from any public
gateway (`https://ipfs.io/ipfs/<cid>`) — but only if you already know the CID. Exotopia doesn't
provide a directory mapping "address X" to "whatever CID is currently pinned for it," and building
one would mean standing up new state (an `address → CID` index) that carries the same
custodial-liability tradeoff `compliance/INDEX.md` already argues against — just for a directory
instead of a claim registry, so it's not a decision to make lightly. The lower-cost alternative
already exists: a settlement owner can publish their own CID somewhere discoverable, and
`SPEC_COMMUNITY_NODES.md` describes exactly this as a community node's role. We haven't built a
directory, and doing so would need to clear the same bar the collision-authority question already
didn't.

## Where this leaves us

The settlement address system works exactly as advertised for what it's used for today: a
human-readable, deterministic, locally-held identifier, durable for as long as someone keeps it
pinned to IPFS. What it isn't, yet, is a service — the "API" in the spec's header is a plan, not a
deployed thing, and a lookup directory is a real open design question rather than a bug-tracker
item. What it also no longer is: blockchain-backed. That question has been answered, on purpose,
and this post is the update to say so plainly rather than leaving the chain-based version of this
story standing unchallenged.

*See `SETTLEMENT_ADDRESS_API.md` for the full dependency breakdown this post is based on.*
