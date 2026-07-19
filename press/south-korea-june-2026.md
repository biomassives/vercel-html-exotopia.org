# PRESS RELEASE — SOUTH KOREA / 대한민국 EDITION

**FOR IMMEDIATE RELEASE**  
**Contact: Greg Willson, SCD Hub — acmeideal@gmail.com**

---

## Colorado Open-Source Platform Deploys E8 Lattice and Halo2 ZK Proofs to Create Visually Verifiable Environmental Credentials — A World First in Cryptographic Proof Design

**The E8 root system — the most symmetrical eight-dimensional mathematical object known — generates unique visual art that simultaneously functions as a zero-knowledge cryptographic proof, verifiable by human eyes and machine scanners without any personal data exposure**

---

**BOULDER, Colorado, USA / SEOUL — June 30, 2026** — SCD Hub, the open-source sustainable community development platform operating through Exotopia.org, has announced the deployment of a novel cryptographic proof architecture combining the E8 exceptional Lie group, the 24-dimensional Leech lattice (Λ₂₄), and the halo2 PLONK-based zero-knowledge proof system to generate tamper-proof environmental credentials for communities operating without reliable internet access.

The system is believed to be the first application of E8 lattice mathematics to a deployed zero-knowledge credential issuance system, and the first to generate a deterministic visual output — a geometric mandala derived from the Coxeter plane projection of the E8 composite vector — that functions simultaneously as human-recognisable artwork and a machine-scannable cryptographic fingerprint.

**Technical architecture:**

The E8 root system contains exactly 240 root vectors in eight-dimensional space. These are used as cryptographic identity slots — each contributor to a collaborative environmental action holds one root vector as their lattice identity. The composite identity of a multi-contributor event (e.g., six coastal cleanup workers jointly verifying a monthly haul) is computed as a weighted sum of the individual root vectors, modulo the E8 lattice. When the contributor group exceeds eight, the system automatically promotes the composite to the 24-dimensional Leech lattice (Λ₂₄ — the densest sphere packing in 24 dimensions, whose optimality was proved by Maryna Viazovska, Fields Medallist 2022).

The zero-knowledge proof — built on the halo2 PLONK implementation from the Zcash/Electric Coin Company — proves lattice membership without revealing the contributor's actual root vector. Unlike Groth16 (which requires a circuit-specific trusted setup ceremony), halo2's Inner Product Argument (IPA) requires no trusted setup at all. This is critical for communities in geopolitical contexts where a trusted setup ceremony would itself be a security risk.

The proof output includes a `CoxeterProof2D` structure: a set of 2D coordinates derived from the Coxeter plane projection of the E8 composite root. These coordinates are rendered as an SVG "art-hash" — a unique geometric ink-wash mandala that identifies the collaboration. The art-hash is embedded in the SVG certificate file alongside W3C Verifiable Credential 2.0 metadata. A companion scanner library verifies that the visual point positions fall precisely on the four Coxeter rings (radii proportional to sin(πe/30) for E8 exponents e = 1, 7, 11, 13) and confirms the proof hash against the Algorand blockchain anchor.

"We were looking for a mathematical structure that would let us create something unique about each collaboration — a fingerprint that is genuinely different for every combination of contributors and every event — but that requires no trusted third party to verify," said Greg Willson, founder of SCD Hub. "E8 is the only object we found where the mathematics, the visual beauty, and the cryptographic properties are all present at once. The four-ring mandala that comes out of the Coxeter projection looks extraordinary on a mobile screen. But it is also a hash."

**Applications for citizen science and environmental monitoring:**

The system is deployed in SCD Hub's Citizen Science curriculum track, which covers iNaturalist species recording, freshwater macroinvertebrate biological monitoring (BMWP scoring), transect surveys, and phenological data collection. Each completed track issues an Open Badges 3.0 certificate carrying an art-hash signature — verifiable without contacting SCD Hub's servers.

For collaborative multi-organisation surveys — equivalent to South Korea's national citizen science programmes under the National Institute of Ecology (NIE) or the Korea National Arboretum's flora monitoring network — the Leech lattice path allows up to 24 independent organisations to co-sign a joint survey record with a single on-chain proof anchor.

**Open source and academic collaboration:**

All code is GPL v3. The Rust crate structure (`zk-e8`), WASM build pipeline, C consolidation module, and TypeScript art-hash renderer are published and documented. The project welcomes collaboration from South Korean researchers with expertise in:

- Lattice-based cryptography (post-quantum applications of E8/Leech lattice structures)
- Citizen science platform design
- Environmental bioinformatics
- WASM performance optimisation for mobile networks

The full technical specification is available at `SPEC_ZK_E8_PLONK.md` in the public repository.

---

**Suggested Korean media targets:**

Korea JoongAng Daily (English) · The Korea Herald · The Korea Times · Chosun Ilbo (English edition) · Electronic Times (전자신문) · IT Chosun · ZDNet Korea · Bloter · Yonhap News Agency technology section

**Suggested Korean research contacts:**

- Korea Institute of Science and Technology Information (KISTI) — open science data systems
- National Institute of Ecology (NIE) — citizen science programmes
- KAIST Graduate School of Information Security — lattice cryptography research
- POSTECH Department of Mathematics — Lie groups and exceptional algebras

---

**About SCD Hub / Exotopia.org**  
SCD Hub is an open-source sustainable community development platform. Exotopia.org is a navigable virtual universe built on confirmed exoplanet and astronomical data (NASA Exoplanet Archive, HYG stellar catalog, XMM-Newton X-ray cluster catalog), providing community members with virtual settlement addresses tied to real environmental field work. The platform is free to use and all code is GPL v3.

**Website:** exotopia.org  
**Technical repository:** github.com/biomassives/vercel-html-exotopia.org  
**ZK proof specification:** SPEC_ZK_E8_PLONK.md (in repository)  
**Contact:** Greg Willson — acmeideal@gmail.com

###
