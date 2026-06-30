# Owning Your Place: Why We're Changing How We Talk About This

**Exotopia.org · SCD Hub · Focus document · June 2026**

---

## The shift we are making

We have been describing what we build using the vocabulary of the technology underneath it. We say "mint an NFT" when we mean "claim your address." We say "blockchain-anchored exolocation" when we mean "nobody can take this away from you." We say "settlement tier" when we mean "your presence here is real."

This is backwards. The technology is the infrastructure. The thing people care about — the thing worth caring about — is *ownership of a place they can keep*.

This document describes the shift we are committing to: a change in language, in onboarding design, and in how we position what Exotopia actually provides.

---

## What we are actually offering

You get a **permanent web address** anchored to a real astronomical location.

Not a profile. Not a username. Not a temporary account that the platform can revoke, the company can fold, or a moderator can suspend. A *location identifier* — a URL-like string that maps to a specific point in the universe, which you hold the key to, and which is registered on a public ledger that no single party controls.

It looks like this:

```
exo-surface-v1:kepler-452b:2.3178,-15.4420
```

This is your address. The platform renders it. The blockchain records who holds it. If the platform changes, your address doesn't. If the company changes, your address doesn't. Your address is your address.

This is the thing we need to communicate first, clearly, before anything else.

---

## The analogy people already understand

A **domain name** is a good comparison, but it has important weaknesses as a model:

| Domain names | Exotopia addresses |
|---|---|
| Rented annually from a registrar | Claimed once, owned on-chain |
| Can be seized by ICANN / national registrars | Anchored to decentralised ledger — no single authority |
| Can expire if payment lapses | Permanent once minted (no renewal) |
| Points to a server someone controls | Points to a coordinate that is physically defined |
| Centrally governed namespace | Namespace is the observable universe — effectively infinite |

A better comparison is a **land title** or a **deed** — a document that establishes your right to a place, that survives the collapse of the issuing institution, that can be transferred to another person, and that the community recognises as authoritative.

We are issuing cosmic land titles.

---

## What "nobody can take it from you" actually means

Saying "permanent" is easy. We need to mean it technically and be transparent about exactly what that guarantee covers.

**What the network protects:**
- The ownership record lives on a public blockchain. Changing who owns your address requires your private key. No platform admin, no government request to Exotopia as a company, no platform shutdown can rewrite the ownership record. The ledger is public, distributed, and does not require our servers to be running.
- Your address string (`exo-surface-v1:kepler-452b:...`) is derived deterministically from the astronomical catalog data. The catalog is NASA's. The mapping algorithm is open-source. If Exotopia.org disappears, any compliant implementation of the same coordinate system will resolve the same address to the same place.
- The settlement metadata (what you built there, your community objects, your eco-ops check-ins) is stored in the ownership record as on-chain metadata and in decentralised storage (IPFS/Arweave). It is not in a database we own exclusively.

**What the network does not protect (be honest):**
- If all blockchains in the world were shut down, the record would be lost. This is extremely unlikely but not impossible.
- The visual rendering of your settlement (the Three.js scene, the dome, the terrain) requires Exotopia.org or a compatible client to run. The address is permanent; the *presentation* of the address is not guaranteed to be perpetually maintained by us.
- Legal status in specific jurisdictions may impose restrictions on access or transfer. See [compliance/INDEX.md](compliance/INDEX.md).

---

## The language switch — what we say instead

| Old (technical) language | New (ownership) language |
|---|---|
| "Mint an NFT" | "Claim your address" / "Secure your place" |
| "Blockchain-anchored exolocation" | "A permanent record nobody can overwrite" |
| "Settlement tier" | "Your level of presence" |
| "On-chain metadata" | "What's stored in your address, publicly and permanently" |
| "Wallet connection required" | "You'll need a key to prove it's yours" |
| "Gas fees" | "A one-time network fee" |
| "Exolocation NFT" | "Your cosmic address deed" |
| "pon.ink integration" | "Earn your address through activities you already do" |
| "NFT recognition / badge" | "Certificate — a permanent record of what you contributed or achieved" |
| "Mint a recognition token" | "Receive your certificate" |
| "Soulbound token" | "A certificate that stays with you — not for sale" |

We do not hide the technology. When people ask what it runs on, we tell them — clearly, with links to block explorers, contract addresses, and source code. But we lead with what people care about, which is the ownership and the place, not the mechanism.

---

## Onboarding redesigned around this shift

The old onboarding funnel assumed crypto literacy. The new one assumes none.

### Stage 1 — Explore first, own later

New users land on the cosmic visualization and can navigate the full hierarchy — cosmic → cluster → galaxy → system → planet — without creating any account, connecting any wallet, or understanding anything about blockchain. They are exploring a place.

At the planet level, a non-intrusive label appears: *"This address is unclaimed. You could hold it."*

### Stage 2 — Understand before committing

Clicking that label opens a plain-English panel:

> This world is at a real location in the universe.  
> Its address is `exo-surface-v1:...`  
>
> Claiming it means that address is permanently linked to you in a public record.  
> No annual fees. No platform account required to hold it.  
>
> To claim it, you need:  
> — 5 minutes  
> — A free key (we'll walk you through it)  
> — [one-time network fee] to register it publicly  
>
> What claiming gets you:  
> — Your own settlement view at this location  
> — A visible stake in this community  
> — Credit for eco-ops field work that earns you objects here  

No jargon. No assumed literacy. A clear exchange: here is what you put in, here is what you get.

### Stage 3 — Earn instead of pay

For users coming via pon.ink partner channels (eco-ops field workers, community facilitators, educators), there is a parallel path: **earn your address through activities you already do**.

Field check-ins, community sessions, skill verifications, and biodiversity assessments all accumulate toward an address allocation. The first address can be earned entirely without paying a network fee. The fee is covered by the SCD Hub treasury allocation on behalf of the earner.

This makes ownership accessible to people who do not have capital but do have time and community engagement.

### Stage 4 — Network support

Once someone holds an address, they are not alone in holding it. The SCD Hub community operates a network of supporting nodes:

- **Mirror indexers** — multiple community-operated services that can resolve any address even if Exotopia.org's primary infrastructure is offline
- **Metadata pinning** — community IPFS/Arweave nodes redundantly store settlement metadata
- **Legal observability** — see [compliance/INDEX.md](compliance/INDEX.md) for jurisdiction-specific access strategies that ensure addresses remain reachable across regulatory environments
- **Succession protocols** — wallet recovery pathways via trusted community witnesses (multi-sig) for users who lose their key

These are not features of the platform. They are features of the community that forms around permanent place-ownership.

---

## Why "the cosmos" and not just "a domain name"

A domain name is an arbitrary string in a human-governed namespace. `kepler452b-mysettlement.com` means nothing about where you are. It is a brand, not a place.

An exolocation address is a *coordinate*. It refers to something that existed before we built the software and will exist after we are gone. The star Kepler-452 is 1,402 light-years from Earth. Its planet b orbits in the habitable zone with a 385-day year. Your address on that planet's surface is physically meaningful. It connects human activity on Earth to a specific point in the universe.

This is why we chose this namespace and not another. A cosmic address is not arbitrary. It is anchored to reality.

The motivational case for community: permanent place-ownership, spread across ten thousand confirmed exoplanets, creates a distributed map of human aspirations. Every eco-ops check-in on the surface of Proxima Centauri b is a data point. Every settlement on a world in the Virgo cluster is a flag. Over time, this becomes a collective record — not of where we have been, but of where we are choosing to be.

---

## What this means for how we build

**Everything should be reachable without an account.** Browse, navigate, learn. Own only when you want to. The visualization is not gated.

**Every settled place should be findable.** A settled address has a persistent URL at `exotopia.org/surface/:hostname/:planet` that is shareable, indexable, and publicly viewable. Owning your place means it has a web address others can visit.

**The onboarding should never require explaining blockchain first.** If someone asks "what is a blockchain?", the answer is "it's the public record that proves you own your place — the same concept as a land title registry, but open to everyone and nobody controls it." That's it. We don't need them to understand merkle trees to claim an address.

**Earning should be the primary onboarding path in target communities.** The M-Pesa / Stripe payment options exist for direct purchase. But in East Africa, Southeast Asia, and LATAM — where much of SCD Hub's field work happens — earning through verified activities is the primary path. This is by design. Wealth in this system should flow toward people who do real things in real places, not toward those who can afford to buy in.

---

## Summary

We are not a crypto platform. We are not an NFT marketplace.

We are building a system where people can claim a permanent, web-accessible address in the universe — rooted in real astronomical science, protected by a network, earned through meaningful work — and where that address becomes part of an interconnected community of settlements.

The technology is blockchain. The product is a place you can keep.

---

*SCD Hub · Exotopia.org · GPL v3*  
*Related: [compliance/INDEX.md](compliance/INDEX.md) · [SPEC.md](SPEC.md) · [GLOSSARY.md](GLOSSARY.md)*
