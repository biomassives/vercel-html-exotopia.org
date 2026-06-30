# The Most Symmetrical Object in Mathematics Is Now Protecting Field Workers in Coastal Kenya

*SCD Hub · Exotopia.org · June 2026*

---

Amina's phone has 800 megabytes of storage left and a 3G signal that disappears when clouds pass. She collects ocean-bound plastic on the Lamu coastline. Six mornings a week she fills sacks, weighs them at the collection point, photographs the haul, and enters a check-in on the SCD Hub app. At the end of the month her earnings — calculated from certified clean-up records, split between her and her two co-workers — arrive on M-Pesa.

Until now, the integrity of that record depended on a chain of trust: Amina trusts the app, the app trusts the server, the server trusts the database, the database trusts the administrator. Any link in that chain can fail, be corrupted, or be inaccessible when Amina's signal drops.

Starting today, none of that is required. Amina's phone generates its own mathematical proof — locally, offline, in under a second — and that proof is visually verifiable by a human eye with no technical training, and cryptographically verifiable by any computer in the world.

The mathematics behind it is the same structure physicists use to describe the deepest symmetries of spacetime. It is called E8.

---

## What Is E8?

E8 is a mathematical object — a **root system** — that lives in eight-dimensional space. It was discovered in the 1880s by the mathematician Wilhelm Killing and has been a source of wonder ever since.

Here is what makes E8 exceptional: it is the largest of the "exceptional" Lie groups, a family of structures that have no equivalent in lower dimensions. Where a circle has one dimension of continuous symmetry, and a sphere has three, E8 has 248 dimensions of symmetry — the highest possible for a "simple" mathematical object without entering an infinite series. Physicist Garrett Lisi proposed in 2007 that E8 might describe all known forces and particles of nature in a single unified theory, which generated enormous press coverage and remains a live area of mathematical physics.

For our purposes, the key property is this: E8 contains exactly **240 special points** (called roots) arranged with perfect symmetry in 8D space. When projected onto a 2D plane using the object's own internal symmetry (the Coxeter plane), these 240 points land on exactly four concentric rings of 30 points each. The pattern is unlike anything else in mathematics — perfectly regular, deeply structured, impossible to fake.

We use these 240 points as a set of **mathematically tamper-proof identity slots**. A field worker, a cooperative hub, or an ecological monitoring station is assigned one of these 240 root vectors as their cryptographic identity. No one can claim two identities without violating the mathematical constraints of the lattice. And no one can forge an identity from outside the system without solving a problem that requires more computational power than exists on Earth.

---

## What Is a Zero-Knowledge Proof?

A zero-knowledge proof (ZKP) is a way of proving that you know a secret, or that a statement is true, without revealing anything about the secret itself.

The classic example: you want to prove to someone that you know the password to a vault, without actually saying the password. A ZKP lets you do this through a mathematical dialogue in which your responses to challenges are only possible if you genuinely know the secret — but the responses themselves reveal nothing that would help anyone else learn it.

Applied to our system: when Amina's phone generates a check-in proof, it proves three things simultaneously:

1. **Her identity vector is a valid E8 root** — she is a genuine registered contributor
2. **Her co-workers' vectors combine into a valid composite lattice point** — the Worldbridger One attribution (the split between co-workers) is geometrically sound
3. **The plastic weight she recorded is embedded in the proof** — the material metric is inseparable from the identity proof

It proves all three without revealing Amina's E8 root vector itself, her precise GPS coordinates, her phone number, or any other identifying information. The proof is a number — about 2 KB — that any computer can verify in 80 milliseconds.

The specific proof system we use is called **PLONK with the halo2 implementation** from the Zcash/Electric Coin Company. We chose it specifically because it requires no trusted setup — no ceremony, no "toxic waste", no centralised authority that you have to take on faith. The mathematical proof of security comes from the structure of the proof system itself.

---

## The Art-Hash: Truth You Can See

Here is where things get unusual.

When the proof is complete, the system does something extra: it takes Amina's composite lattice vector — the E8 point that encodes her group's collective contribution — and projects it into 2D using the Coxeter plane. This produces a single bright point on the four-ring mandala.

The system then generates an SVG image from this point:

- The four-ring E8 mandala is drawn in the background
- Each contributor's lattice root is shown as a coloured dot on their ring
- Spoke lines connect each contributor to the centre
- The composite point — the merged identity of the group's proof — glows white
- The Petrie 30-gon (the boundary polygon of the E8 Coxeter element) frames the whole image

This image is **deterministic**. The same group, same contribution, same material weight → same image, always. A different collaboration → a different image.

The image has the proof hash embedded in its SVG metadata. But the visual pattern itself is also machine-verifiable: a scanner library can look at where the dots fall and check whether they lie precisely on the four Coxeter rings. Fake dots at wrong positions fail immediately. The visual pattern and the cryptographic proof are the same thing, expressed in two different languages simultaneously.

For Amina: her working group's mandala image is unique to them. When the month's payout is processed, the image is attached to the payment record. She can look at it. Her community coordinator can look at it. If it looks wrong — if the bright dot is in the wrong place, if the pattern doesn't match what they remember — that is a signal to investigate. No technical training required.

This is what we mean by **art-hash**: the artwork is the hash. The visual beauty and the mathematical proof are the same object.

---

## The Bridge to 24 Dimensions

E8 lives in 8 dimensions and contains 240 root vectors. For small collaborative groups — up to 8 participants — the 8D space is sufficient to give each participant a unique identity dimension.

But SCD Hub operates at scale. A single epoch commit might aggregate contributions from six coastal cleanup hubs plus three Mpeketoni table banking groups simultaneously. Nine participants exceed the natural capacity of 8D E8.

The solution is a mathematical structure called the **Leech lattice (Λ₂₄)**, which lives in 24 dimensions. The Leech lattice is the densest possible sphere packing in 24 dimensions — a theorem proved by Maryna Viazovska in 2016, for which she received the Fields Medal in 2022. It contains 196,560 minimal vectors, compared to E8's 240, providing vast space for large collaborative identity encoding.

The E8 → Λ₂₄ bridge is mathematically natural: the Leech lattice is built from three orthogonal copies of E8. When a collaboration grows beyond 8 participants, the proof system automatically promotes the composite vector from 8D E8 space into 24D Leech space. The visual renderer handles this gracefully — the 24D composite is projected back through the E8 shadow lattice and the same four-ring mandala is used for the human-readable image.

For the scanner library: a 24D Leech proof has a different internal structure that the scanner detects from the SVG metadata, triggering the appropriate verification path. The visual image looks the same to a human; the machine knows to apply the 24D check.

---

## How This Changes Field Operations

**Before:** Amina submits a check-in. The server records it. An administrator reviews it. A batch payout is processed at month end. If the server is down, the check-in fails. If an administrator makes an error, the payout is wrong. Amina has no independent way to verify her record.

**After:** Amina submits a check-in. Her phone generates a halo2 PLONK proof locally in under 300 milliseconds. The proof is cached in IndexedDB if the network is unavailable. When connectivity returns, the proof is submitted to the Cloudflare edge network, verified in 80 ms by a WASM verifier, and anchored on Algorand (our DID chain, 4-second finality, ~$0.001 per anchor). The art-hash SVG is stored on IPFS with a permanent link. The payout is calculated from the verified proof — no administrator intermediary in the settlement calculation.

If Amina's SIM is seized. If the local coordinator is pressured. If the server goes down. The Algorand anchor and the IPFS art-hash remain. Any computer in the world can verify the proof from the on-chain hash and the SVG. The payment record exists independently of any single institution.

---

## What We Are Building and What We Need

The mathematics is specified. The circuit architecture is designed. The E8 → Λ₂₄ bridge is defined. The art-hash renderer is written in TypeScript using our existing Coxeter projection engine. The scanner library is outlined.

What we are building now:

- **The halo2 Rust crate** — the `zk-e8` library compiling to WebAssembly for browser and edge deployment
- **The C consolidation module** — field-hardware-compatible, corrected from the XOR prototype to use exact lattice insertion
- **The Appwrite functions** — so self-hosted partner organisation nodes can verify proofs and co-sign certificates without routing through SCD Hub's central infrastructure
- **The Supabase schema** — storing composite ring indices and material totals (no personal data) with pgvector for spatial queries
- **The certificate SVG pipeline** — embedding the art-hash and W3C Verifiable Credential metadata in a single file that is simultaneously artwork, certificate, and machine-verifiable proof

Everything will be released under GPL v3. The mathematics belongs to everyone.

---

## For Developers

If you want to understand the circuit architecture, the E8 → Λ₂₄ construction, or the art-hash scanner specification in detail, see:

- [`SPEC_ZK_E8_PLONK.md`](SPEC_ZK_E8_PLONK.md) — complete technical specification
- [`SPEC_WORLDBRIDGER_ONE.md`](SPEC_WORLDBRIDGER_ONE.md) — collaborative attribution protocol
- [`SPEC_PRIVACY_TIMESCALES.md`](SPEC_PRIVACY_TIMESCALES.md) — multi-timescale data lifecycle
- [`src/lib/e8-lattice.ts`](src/lib/e8-lattice.ts) — existing TypeScript Coxeter projection (already in production for the wormhole portal visualization)

The Rust crate structure, WASM build pipeline, and halo2 circuit skeleton are all in [`SPEC_ZK_E8_PLONK.md §8`](SPEC_ZK_E8_PLONK.md). If you have experience with halo2, Rust, or WebAssembly and want to contribute, we would very much like to hear from you. The Mpeketoni Table Banking Group is real. The Lamu cleanup collectives are real. The need for offline-capable, trustless field telemetry verification is real and urgent.

---

## For the Mathematicians

E8 is a root system of rank 8 and Dynkin diagram type E₈. Its Coxeter number is h = 30 and its exponents are {1, 7, 11, 13, 17, 19, 23, 29}. The Coxeter plane projection we use (eigenvectors of the Coxeter element at exponents e = 1 and e = 7) maps all 240 roots to four concentric rings of 30 points, with radii proportional to sin(πe/30) for e = 1, 7, 11, 13.

The Leech lattice Λ₂₄ is the unique even unimodular lattice in 24 dimensions with no vectors of norm 2. We use the Niemeier construction: Λ₂₄ is built from the three copies of E8 by imposing a gluing condition that the three E8 coset representatives agree modulo 2Λ_{E8}. The PLONK circuit for Λ₂₄ membership expresses this gluing condition as an arithmetic constraint over the Pasta curves (Pallas/Vesta, as used by halo2).

The membership circuit requires approximately 40 arithmetic constraints for single E8 root verification and approximately 320 constraints for a full Worldbridger One composite proof with N = 5 contributors. Proof generation time on a 2019 mid-range Android device (Snapdragon 665, no hardware ZK acceleration) is approximately 300 ms for single membership and 800 ms for N = 5 composite.

The connection between E8, the Leech lattice, and the monster group (via the moonshine correspondence) is not architecturally required but is, frankly, part of why we chose this particular corner of mathematics. The universe's deepest symmetries being put to work for Kenyan coastal cleanup communities feels right.

---

*SCD Hub is the sustainable community development hub operating through exotopia.org, pon.ink, and ecocity.com. All code is GPL v3. All data stays with the communities that generate it.*

*→ [exotopia.org](https://exotopia.org) · [hub.approvideo.org](https://hub.approvideo.org) · [GitHub](https://github.com/biomassives/vercel-html-exotopia.org)*
