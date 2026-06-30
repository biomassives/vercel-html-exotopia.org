# Open Contribution, Bounty Payments, and Polynomics — Legal Framework

**Document type:** Internal compliance guide  
**Scope:** SCD Hub / Exotopia.org contributor economy — code, design, UX, community  
**Last updated:** June 2026  
**Return to:** [compliance/INDEX.md](INDEX.md)

---

## What this document covers

Exotopia and SCD Hub run on contributions — code, design, UX research, translation, eco-ops facilitation, event coordination. We recognise contributors through bounties (crypto, settlement credits, NFT recognition, or fiat equivalent). We also operate within, and are designing for, emerging multi-stakeholder economic models — "polynomics" — that do not map cleanly onto traditional employment, contracting, or volunteer frameworks.

This document:
1. Names the primary legal exposure points for the way we currently reward contributors
2. Describes the structures that reduce friction while keeping recognition real
3. Maps the emerging polynomics frameworks that we are building toward, and how they interact with existing law
4. Gives a practical operational playbook — what to do, what to avoid, and where formal counsel is needed before we act

---

## Part 1 — The core tension

### Why this is hard

The law in almost every jurisdiction draws a sharp binary between two categories of person:

- **Employee / dependent worker** — protected, taxed at source, entitled to benefits and minimum wage; the party paying them has extensive obligations
- **Independent contractor** — unprotected, self-taxed, no benefits; the party engaging them has minimal obligations

Open-source and platform communities naturally fall between these categories. A contributor who spends 40 hours fixing a critical bug and receives a bounty worth $2,000 in crypto is not really either — but most legal systems will try to force them into one box or the other, and the consequences of being forced into the wrong box fall on us, not them.

The second tension is between **payment and recognition**. A payment triggers employment law, tax withholding, and potentially securities law (if paid in tokens). Recognition — a badge, an NFT, a public credit — generally does not. The line between them is blurry and depends heavily on regulators' appetite for the territory at a given moment.

### The three failure modes

**Failure mode 1: Reclassification as employment.** If a regulator (US DOL, UK HMRC, EU member state labour inspector) determines that bounty contributors are de facto employees, SCD Hub becomes liable for:
- Unpaid social security contributions (both employer and employee portions, retroactively)
- Unpaid minimum wage top-ups
- Unpaid holiday pay, sick pay, workers' compensation
- Penalties for failing to issue payslips, operate PAYE, or register as an employer
- In some jurisdictions: reinstatement rights for "dismissed" contributors

This is the most likely catastrophic failure mode. It has happened to Uber, Deliveroo, and multiple gig economy platforms. It can happen to open-source projects too — there are pending cases in Germany and France involving community-funded Linux contributors.

**Failure mode 2: Unregistered money transmission.** If we collect platform fees, hold them, and distribute them to contributors, we may be operating as a money transmitter or payment service provider in jurisdictions where that requires a licence. Even crypto-denominated flow-through can trigger this in the US (FinCEN MSB registration), EU (PSD2 payment institution), and Brazil (BACEN VASP regulation).

**Failure mode 3: Unregistered securities issuance.** If bounty tokens are framed as shares in the platform's future value, or if "settlement credits" earn contributors a share of platform revenue, these may be classified as securities in the US (Howey), EU (MiCA financial instrument), or elsewhere. This is the highest-severity failure mode — criminal, not just civil, in most jurisdictions.

---

## Part 2 — Legal exposure by contribution type

### 2A — Code contributions

**Exposure:** Employment reclassification; IP ownership ambiguity

**Employment risk factors that increase reclassification risk:**
- Regular cadence of contributions (weekly, treated like a shift)
- Contributor depends primarily on SCD Hub bounties for income
- We direct the work (specify the feature, review and reject output, set deadlines)
- Contributor uses our tools and infrastructure exclusively
- No other clients / only works for us

**Employment risk factors that reduce reclassification risk:**
- Contributor self-selects tasks from a public bounty board
- No obligation to complete any task or work any hours
- Contributor has other clients or income sources
- Payment is per-deliverable (per PR merged, per feature shipped), not per-hour
- Contributor provides their own tools and environment
- We have no right to direct how they work, only to accept or reject the output

**IP ownership:**  
Our GPL v3 licence means all accepted code contributions are automatically licensed GPL. However, we need contributors to confirm they have the right to make the contribution (no employer IP claims, no prior NDA). This is handled by a DCO (Developer Certificate of Origin) — a one-line sign-off in every commit:

```
Signed-off-by: Contributor Name <email> — I certify this contribution is my own work and I grant it under the project's GPL v3 licence.
```

This is lighter than a full CLA (Contributor License Agreement) and is standard practice in Linux, GNOME, and thousands of other GPL projects. We should implement this for all code bounties.

**What to implement:**
- Public bounty board with task descriptions, acceptance criteria, and bounty amounts
- Explicit "no exclusivity, no minimum hours, no employment relationship" statement in contributor onboarding
- DCO sign-off in git commit process (`git commit -s`)
- Payment via per-deliverable milestone (not per-hour or recurring salary)
- Issue a `contrib:code` certificate (SVG on-chain credential — see §3F) for every merged PR, regardless of whether a cash/crypto bounty is also paid. The certificate is the permanent public record of the contribution.

---

### 2B — Design and UX contributions

**Exposure:** Employment reclassification; portfolio and attribution rights; moral rights (strong in EU, Germany especially)

**IP note:** Unlike code (where GPL is clear), design assets — illustrations, icons, UI mockups, motion graphics — often carry **moral rights** in EU jurisdictions that cannot be waived by contract. A German or French designer retains the right to be credited and to object to derogatory treatment of their work even after transferring copyright. This is not hypothetical — it has resulted in disputes in gaming and film.

**What to implement:**
- Design bounties should specify: attribution requirements (how the contributor is credited), scope of license granted (we need at minimum: reproduce, modify, distribute in the platform and its forks, sublicense under GPL v3)
- For major design work: a short written agreement (one page) covering these points, signed digitally via DocuSign or equivalent. This does not create employment; it creates a clear IP license.
- Portfolio rights: contributors retain the right to show the work in their portfolio. We should confirm this in the agreement — it protects contributors and avoids disputes.
- UX research: session recordings, usability test transcripts, and user interview data are covered by GDPR and equivalents. The UX contributor who collects this data on our behalf is a data processor. We need a data processing agreement (DPA) with any UX researcher who handles user data on our behalf.
- Issue a `contrib:design` or `contrib:ux` certificate (see §3F) for every accepted deliverable. The thumbnail of the accepted design work is embedded in the SVG — the certificate is itself a portfolio item. EU moral rights declaration is included by default in the certificate metadata.

---

### 2C — Community and facilitation contributions

**Exposure:** Employment reclassification; minimum wage risk; social security; language around "volunteer"

This is the highest-risk category for reclassification because community facilitation roles (running events, onboarding users, moderating, translating) often look like regular part-time employment from the outside.

**Specific risks:**
- **Minimum wage:** If a community facilitator in Kenya receives bounties equivalent to below-minimum-wage compensation for hours worked, and is reclassified as an employee, we owe the difference. Kenya Employment Act 2007 minimum wage applies.
- **"Volunteer" is not a magic word:** The UK Employment Rights Act, EU Employment Directive, and Kenyan Employment Act all look past labels to the economic reality of the relationship. Calling someone a volunteer while directing their work, paying them regularly, and preventing them from working for others will be treated as employment.
- **Eco-ops facilitators:** If a pon.ink eco-ops field facilitator earns settlement credits for coordinating community activities, and those credits have clear monetary value, tax authorities may treat the credits as income at the moment they are received (not when spent or sold).

**What to implement:**
- Eco-ops facilitation should be framed clearly as a community contribution with a fixed credit allocation that is recognised on-chain, not as a wage-for-hours arrangement
- No exclusivity requirements for facilitators
- Credits should have a clear on-platform use (settlement claim) rather than a direct cash-out pathway — this reduces their classification as income in many jurisdictions
- Where facilitators need to be compensated materially (e.g., transport costs for field work), this should be expense reimbursement at cost, not a wage. Keep receipts.
- Issue an `eco:*` certificate (see §3F — category determined by field activity type) for each verified facilitation event. For Indigenous ecological knowledge documentation, the certificate is jointly issued with the community governance body and includes the `eco:indigenous` category tag with explicit FPIC record embedded in the metadata. Community facilitation roles additionally receive a `contrib:community` certificate.
- `news:milestone` and `news:record` certificates are issued to all participants in notable community events — these are the primary recognition for facilitators and participants who receive no cash bounty.

---

## Part 3 — Structures that reduce friction

These are the models used by successful open-source and platform cooperative projects to reward contributors without triggering employment, securities, or money transmission regulation. We should adopt a combination of these.

### 3A — Retroactive public goods funding (RPGF)

**Origin:** Optimism Protocol (blockchain), refined by Gitcoin and Protocol Guild  
**How it works:** Contributors contribute freely. Periodically (quarterly, annually), a committee or token-holder vote allocates a treasury grant to recognised past contributions. There is no contract or promise of payment before the contribution is made.  
**Why it works legally:** No prospective contract means no wage. The contributor is not owed anything for their contribution at the time they make it. The subsequent grant is a recognition of community value, not a wage for services performed under a contract. This is the same structure as academic prizes, journalism awards, and Open Source Initiative grants.  
**Key condition:** The grant decision must be genuinely discretionary. If contributors can reliably predict that X hours of work = Y crypto, a regulator may pierce the structure and find an implied contract.

**Recommended for:** Code bounties above a threshold; major design contributions; long-term community facilitators

---

### 3B — Hackathon and open competition prizes

**How it works:** We post a defined challenge with a defined prize. Anyone can attempt it. The best submission (by our criteria) wins.  
**Why it works legally:** Prize competition law is distinct from employment law in virtually every jurisdiction. A prize is not a wage. The winner has no employment relationship with the organiser. The IRS, HMRC, and EU tax authorities treat competition prizes differently from employment income (though they are still taxable — the contributor must declare them, but we have no withholding obligation in most cases).  
**Key conditions:** Must be a genuine competition with genuine evaluation criteria. Cannot be a "competition" where a pre-selected contributor is the only viable participant.

**Recommended for:** New feature sprints; UX redesign challenges; one-time substantial contributions

---

### 3C — Open-source foundation grant model

**How it works:** SCD Hub establishes (or affiliates with) a non-profit foundation that holds the treasury and issues grants to contributors. The foundation has a clear public benefit mandate. Contributors apply for grants; the foundation approves them.  
**Why it works legally:** Non-profit foundations can issue grants to individuals without those individuals being employees of the foundation. The Apache Software Foundation, Linux Foundation, and Open Source Initiative all operate this way. Grant income is still taxable for the recipient but does not trigger employer obligations.  
**Key conditions:** The foundation must have genuine independent governance (not controlled entirely by SCD Hub founders). Grant decisions must be made by a committee, not unilaterally.

**Recommended for:** Long-term contributors; infrastructure maintainers; documentation and translation; community facilitators in high-risk jurisdictions

---

### 3D — Settlement credit as recognition (not payment)

**How it works:** Contributors earn allocation credits toward exolocation addresses — a cosmic land deed, not a cash payment. Credits have defined on-platform utility (claim a settlement address). They can be transferred on-chain but have no guaranteed cash-out mechanism operated by us.  
**Why it works legally:** On-platform credits that have no direct cash-out pathway are treated more like loyalty points or in-game currency than income in most jurisdictions. The value is realised only when the contributor takes an action (claiming a settlement). This reduces the moment-of-receipt taxable income problem.  
**Key risk:** If settlement addresses trade on secondary markets for significant cash value, tax authorities may deem the credit to have market value at time of receipt, making it taxable income then. We need to monitor this as the secondary market develops.

**Recommended for:** Eco-ops facilitators; community event organisers; translators; UX testers; all contributions where the contributor is primarily community-motivated rather than financially motivated

---

### 3F — Recognition certificates (SVG on-chain credentials)

This is the primary recognition layer for the SCD Hub contributor economy. It replaces all "NFT" language in contributor-facing communications and onboarding. The underlying mechanism is on-chain (the certificate hash is minted and the ownership record is immutable), but the experience is a certificate — something a person can display, share, print, and present as evidence of achievement.

#### What a certificate is

An SCD Hub recognition certificate is:
- A **signed SVG file** containing the visual certificate and embedded credential metadata
- **Anchored on-chain** — the SHA-256 hash of the SVG is minted as an on-chain record; the full SVG is stored on IPFS/Arweave
- **Verifiable** — anyone can check that the certificate hash matches the on-chain record and that the issuer signature is valid
- **Non-transferable by default** — certificates are soulbound (bound to the recipient's wallet address) unless the category explicitly allows transfer
- **Rendered natively in browsers** — no wallet, no marketplace, no special viewer required; a certificate URL resolves to a viewable SVG page at `exotopia.org/cert/:id`

The credential metadata embedded in the SVG follows the **W3C Verifiable Credentials (VC) 2.0** data model and is compatible with **Open Badges 3.0** (IMS Global), allowing certificates to be imported into LinkedIn, Accredible, Badgr, and other credential wallets without any crypto knowledge required.

---

#### Certificate categories

**1. Learning milestone certificates**

Issued for: completing structured learning pathways, skill verifications, knowledge assessments in the SCD Hub education network.

Sub-types:
- `learn:foundation` — introductory pathway completion (digital literacy, ecological basics, platform onboarding)
- `learn:practitioner` — mid-level verified skill (eco-ops field methods, data collection protocols, community facilitation)
- `learn:advanced` — advanced verified competency (biodiversity assessment, GIS/remote sensing, systems ecology)
- `learn:facilitator` — qualified to deliver SCD Hub learning content to others

Visual identity: deep blue → gold gradient; constellation pattern; learner name, pathway title, issuing partner organisation, date, verifying facilitator.

---

**2. Contribution certificates**

Issued for: code contributions (PRs merged), design work (accepted and shipped), UX research (completed and incorporated), translation, documentation.

Sub-types:
- `contrib:code` — software contribution; links to PR or commit hash
- `contrib:design` — visual or interaction design; thumbnail of the work embedded in SVG
- `contrib:ux` — usability research, testing, accessibility audit
- `contrib:translation` — language and localisation work; specifies language pair and volume
- `contrib:docs` — documentation, specification, technical writing
- `contrib:community` — event facilitation, moderation, onboarding support (time-bound, not recurring)

Visual identity: dark slate → electric teal gradient; circuit/mycelium pattern; contribution title, repository or project, merge/ship date, lines of code or asset count where applicable.

---

**3. Eco-modality certificates**

Issued for: field work, biodiversity monitoring, soil/water assessment, regenerative practice documentation, climate data collection, and applied work in any of the primary ecological technology domains.

Primary eco-modality domains (certificate specifies one or more):
- `eco:biodiversity` — flora/fauna survey, species identification, habitat mapping
- `eco:soil` — soil health assessment, carbon sequestration monitoring, erosion documentation
- `eco:water` — freshwater quality, watershed monitoring, ocean/coastal ecosystem
- `eco:energy` — renewable energy system documentation, off-grid community energy audit
- `eco:food` — community food system mapping, seed sovereignty, agroforestry documentation
- `eco:climate` — local climate data collection, extreme weather documentation, adaptation practice
- `eco:indigenous` — indigenous ecological knowledge documentation (requires FPIC from community; certificate jointly issued with community governance body)
- `eco:circular` — material flow audit, waste reduction, circular economy practice
- `eco:restoration` — active restoration site monitoring, reforestation, rewilding documentation

Visual identity: earth tones, living green, deep forest palette; botanical illustration border; location coordinates; field partner organisation; GPS-tagged evidence hash; eco-modality icon set.

---

**4. Art and creative contribution certificates**

Issued for: original visual art, music, spatial storytelling, writing, and cultural production contributed to the SCD Hub commons.

Sub-types:
- `art:visual` — illustration, painting, photography, generative art
- `art:spatial` — 3D models, settlement objects, terrain designs
- `art:music` — compositions, sound design, audio landscapes for platform use
- `art:writing` — essays, poetry, cultural narratives, community stories
- `art:motion` — animation, video, interactive media

Visual identity: iridescent, prismatic palette; the artwork itself is embedded as a thumbnail in the SVG background layer; artist attribution is prominent; licence type clearly stated (CC BY-SA 4.0 for commons works).

Note: art certificates carry the EU moral rights declaration by default — contributor is credited and retains the right to object to derogatory treatment of their work even after granting the use licence.

---

**5. Ideas and proposals — important news certificates**

Issued for: significant proposals adopted by the community governance process, breakthrough ideas documented through the SCD Hub public forum, community milestones (first settlement on a planet, first field cohort, first language localisation).

Sub-types:
- `idea:proposal` — a governance proposal approved and implemented; links to forum thread and on-chain vote
- `idea:discovery` — a documented insight that changed how the platform or community operates
- `news:milestone` — a community milestone (first settlement, first cohort graduation, first eco-modality dataset published)
- `news:record` — a historical record of an important community event, issued to all participants

Visual identity: gold and cosmic amber palette; timestamp prominent; community event name; participant count; archival tone — these are historical records, not personal achievements, and should read that way.

---

#### SVG technical specification

Each certificate SVG embeds:

```xml
<!-- W3C VC 2.0 JSON-LD in RDF metadata block -->
<metadata>
  <rdf:RDF>
    <rdf:Description rdf:about="">
      <vc:credential>{
        "@context": ["https://www.w3.org/ns/credentials/v2"],
        "type": ["VerifiableCredential", "SCDHubCertificate"],
        "issuer": "did:algo:SCDHUB_ISSUER_DID",
        "issuanceDate": "2026-06-30T00:00:00Z",
        "credentialSubject": {
          "id": "did:algo:RECIPIENT_WALLET",
          "category": "eco:biodiversity",
          "achievement": "Biodiversity survey — Kakamega Forest transect",
          "evidence": "ipfs://Qm...",
          "partnerOrg": "Kenya Wildlife Service"
        }
      }</vc:credential>
    </rdf:Description>
  </rdf:RDF>
</metadata>
```

On-chain record contains:
- `cert_hash` — SHA-256 of the canonical SVG bytes
- `recipient` — wallet address
- `category` — certificate type slug
- `ipfs_cid` — IPFS CID of the full SVG
- `issuer_sig` — SCD Hub issuer signature (ed25519)
- `issued_at` — Unix timestamp

The SVG is served at `exotopia.org/cert/:on_chain_id` and resolves without any wallet connection. Verification is a `GET /verify/:cert_hash` endpoint returning `{ valid: true, chain: "algo", token_id: "..." }`.

---

#### Legal profile of certificates vs. "NFTs"

| Property | "NFT" framing | Certificate framing |
|---|---|---|
| Primary association | Asset, investment, speculative | Achievement, credential, record |
| Regulatory category | Virtual asset (VASP risk) | Digital credential (education/HR law) |
| Howey test | Closer to security if traded | Clearly not — no financial return |
| MiCA classification | Requires analysis | Likely excluded (unique, non-financial) |
| Employment law | Payment trigger | Recognition trigger — lower risk |
| Tax treatment | Income at FMV receipt | Depends on jurisdiction; credential alone ≠ income |
| Transferability | Default transferable | Default soulbound — reduces market price signal |
| User mental model | "I own something worth money" | "I earned something that shows what I did" |

The shift from "NFT recognition" to "certificate" is not cosmetic — it changes the regulatory category in several jurisdictions, reduces the securities classification risk, and aligns with existing law around educational credentials and professional certifications (which are well-regulated but not in a burdensome way).

---

**Recommended for:** All contributor recognition. This should be the default reward for every category in Part 2 (code, design, community, eco-ops, art). Cash/crypto bounties remain available for significant deliverables, but the certificate is issued alongside every bounty and is the primary recognition for smaller or community contributions.

---

**How it works:** The SCD Hub treasury is held in a multi-sig wallet governed by a community committee. Bounty payments are proposed on a public governance forum, voted on by token holders or committee members, and executed on-chain after a waiting period.  
**Why it works legally:** Distributed governance of the payment decision means no single entity is acting as the employer. The contributor does not work for any one legal person — they contribute to a commons that is governed collectively.  
**Key risk:** If the DAO token (used to vote on treasury distributions) is itself classified as a security, the entire structure can unravel. This is why our settlement addresses (used for governance) must be clearly utility tokens / collectibles with no equity value, not governance tokens with revenue rights.

**Recommended for:** Treasury management once the platform is self-sustaining; long-term governance contributors

---

## Part 4 — Polynomics: emerging frameworks and their legal interface

"Polynomics" — multi-stakeholder, multi-modal economic coordination — is the direction we are building toward. These frameworks are not yet well-settled in law. Each carries specific legal interface risks that we should track.

### 4A — Commons-based peer production (CBPP)

**Theory:** Yochai Benkler's framework for understanding Wikipedia, Linux, and other commons. Contributors produce freely; the commons is governed by community norms, not contracts. No market price mediates contribution.  
**Legal interface:** Well-established protection under copyright (GPL and CC licences are the legal backbone). Weak employment law protection — courts have not yet clearly held that CBPP contributors cannot be employees if they receive compensation. The safest CBPP structure has no cash compensation whatsoever — recognition only.  
**Relevance to us:** Our eco-ops earn pathway is closest to CBPP. Field workers contribute environmental data to a commons; they receive recognition (settlement credit) not a wage. This framing should be made explicit in contributor onboarding.

---

### 4B — Quadratic funding

**Theory:** Gitcoin's matching model: a matching pool amplifies small contributions to public goods projects. 10 people each contributing $1 generate more matching funds than one person contributing $10. Reduces plutocratic capture of public goods funding.  
**Legal interface:** Matching pool grants to open-source projects are already well-established (Gitcoin has operated since 2019 with no major regulatory action). The primary risk is KYC/AML on matching pool contributors in jurisdictions with strict crypto transfer reporting. We can participate in quadratic funding rounds as a recipient project without any additional regulatory exposure.  
**Relevance to us:** We should apply for Gitcoin Grants rounds in the "Web3 and Open Source" category. Funds received are grants to the project, not wages to any individual.

---

### 4C — Retroactive public goods funding (detailed)

**See 3A above.** The key legal principle here is *gratuitous recognition of past contribution* rather than prospective contract. Under most legal systems, a gratuitous transfer (gift, prize, recognition grant) does not create an employment relationship. The recipient has no right to demand more.  
**Tax note:** Gratuitous transfers are still income in most jurisdictions. US: ordinary income. UK: depends on source. EU: member-state specific. Our RPGF grants should include a note: "This is a recognition grant. You are responsible for reporting and paying any applicable taxes in your jurisdiction."

---

### 4D — Platform cooperativism

**Theory:** Trebor Scholz / Nathan Schneider framework: platforms owned and governed by their users and contributors, not external shareholders.  
**Legal interface:** Several legal structures exist:
- **Worker cooperative** (traditional): one member, one vote; surplus distributed as patronage. Well-established in most jurisdictions. Relevant entity types: UK Industrial and Provident Society (IPS); US state-chartered worker cooperative (most accommodating: Vermont, Colorado, California); Germany eG (eingetragene Genossenschaft); Kenya Co-operative Societies Act.
- **Multi-stakeholder cooperative** (emerging): different classes of members (workers, users, community). Less established. Colorado's Cooperative Association Act allows this. FNACA (France) allows multi-stakeholder SCIC (Société Coopérative d'Intérêt Collectif).
- **Exit-to-community (E2C)**: venture-funded startup that converts to cooperative ownership after reaching sustainability. Legal mechanism varies; no standard template yet.  
**Relevance to us:** A multi-stakeholder cooperative structure where contributors, eco-ops participants, and settlement holders are all member-classes would align with our polynomics direction. This requires formal legal work to implement. The most jurisdiction-flexible approach: establish a legal entity in a cooperative-friendly jurisdiction (Colorado, UK, or France) that holds the platform IP and treasury, with contributor member classes.

---

### 4E — Circular token economies

**Theory:** Tokens earned for contribution are redeemable for platform services, not for cash. The economy is circular — tokens do not leave the ecosystem. This mirrors loyalty programs, time banking, and mutual credit.  
**Legal interface:** Closed-loop tokens (redeemable only for platform services, not transferable for cash) have the strongest legal protection against securities classification (see SEC no-action letters on various loyalty programs; MiCA exemption for "limited network" tokens under Article 2(2)(b)). The risk increases as secondary market trading volume grows — at that point, the "limited network" exemption no longer holds.  
**Relevance to us:** Settlement credits should be designed as a circular token by default: earned by contribution, redeemable for address claims, non-cash-redeemable via platform. Secondary market trading is user-driven and we explicitly do not facilitate it. This is the correct design.

---

### 4F — Mutual credit and time banking

**Theory:** Participants record value exchanged in a shared ledger without any reference currency. A developer contributes 10 hours of code; they receive 10 time credits. They spend those credits on design work, community facilitation, or other services from other contributors.  
**Legal interface:** The IRS has occasionally pursued time bank participants for imputed income (2012 Rev. Rul. 79-24), but enforcement has been sporadic. Most time banks operate openly. The key legal protection is that time credits are not exchangeable for fiat — they stay within the system. LETS (Local Exchange Trading Systems) have operated for 30+ years in the UK, Canada, and Australia with minimal regulatory friction.  
**Relevance to us:** An internal SCD Hub time-credit layer — separate from the settlement credit system — could handle contributor-to-contributor skill exchange without any fiat or crypto. This layer would have essentially zero regulatory exposure and strong community-building value.

---

## Part 5 — Operational playbook

### What we do right now (minimum viable compliance)

1. **Post all bounties on a public board.** No closed or directed work. All bounties self-selected by contributors.

2. **State the relationship clearly in contributor onboarding:**
   > "Contributing to Exotopia.org does not create an employment relationship. There is no obligation to complete any task. Bounties are paid per accepted deliverable, not per hour. You are responsible for any tax obligations arising from bounty payments in your jurisdiction."

3. **Implement DCO sign-off** on all code contributions (git commit -s).

4. **Pay bounties per merged PR / accepted deliverable**, not on any schedule that resembles a salary.

5. **Denominate significant bounties in stable-equivalent or fiat**, so the value is clear at time of payment and there is no ambiguity about the taxable amount.

6. **Issue a payment summary** to any contributor receiving more than $600 equivalent in any calendar year (US requirement for 1099-NEC; approximation threshold for international equivalents). This is not withholding — it is information reporting. The contributor declares and pays their own tax.

7. **Design credits as circular tokens**: not cash-redeemable via our platform; redeemable for settlement claims only; secondary market trading is explicitly the contributor's own business, not ours.

8. **Do not hold contributor funds.** Pay bounties directly from treasury wallet to contributor wallet. No pooling, no custodial holding, no escrow operated by us. Each transaction is wallet-to-wallet.

9. **Issue a certificate for every recognised contribution**, regardless of whether a cash/crypto bounty is also paid. The certificate is the canonical public record. Category table:

| Contribution type | Certificate category |
|---|---|
| Code PR merged | `contrib:code` |
| Design asset accepted | `contrib:design` |
| UX research incorporated | `contrib:ux` |
| Translation / localisation | `contrib:translation` |
| Documentation / spec | `contrib:docs` |
| Event facilitation | `contrib:community` |
| Eco-ops field work | `eco:[domain]` (one or more) |
| Learning pathway completed | `learn:[level]` |
| Art contributed to commons | `art:[medium]` |
| Governance proposal adopted | `idea:proposal` |
| Community milestone | `news:milestone` |

Certificates are issued via the SCD Hub certificate API. Recipients receive a link to their certificate at `exotopia.org/cert/:id` that they can share without any wallet connection.

---

### What we do before any significant treasury distribution

- Confirm the treasury wallet's jurisdiction of establishment and applicable VASP / money transmission rules
- Get a brief legal opinion from counsel in the platform's primary operating jurisdiction (recommended: Costa Rica or UK) on whether the proposed distribution mechanism triggers any licensing requirement
- If distributing to contributors in the US over $600 equivalent, consult on 1099-NEC reporting obligations before the distribution, not after

---

### What we never do

- Never promise a bounty in advance for work not yet done in a way that creates a binding contract (use conditional language: "we intend to recognise contributions of type X with allocation credits — this is not a contractual commitment")
- Never issue tokens that carry revenue-sharing rights, equity rights, or governance rights over treasury disbursements (this is the securities tripwire)
- Never operate as the market-maker or liquidity provider for settlement credits — if we buy credits back for cash, we have created a cash-equivalent currency and triggered money transmission
- Never direct contributor working hours, tools, or methods — specify outputs only
- Never have contributors sign documents that waive rights they are entitled to by law (minimum wage, health and safety) — such waivers are void in most jurisdictions and create evidence of employment intent

---

## Part 6 — Jurisdiction-specific friction points

| Jurisdiction | Primary risk | Recommended mitigation |
|---|---|---|
| **United States** | 1099-NEC reporting; IRS crypto income at FMV; California ABC test (contractor classification) | Per-deliverable payment; $600 reporting threshold tracking; avoid CA-resident contractors for regular recurring work without formal contractor agreement |
| **European Union** | Platform Work Directive (2024) presumption of employment for platform workers; German moral rights for designers | RPGF structure rather than per-deliverable contracts; DCO/CLA for IP; ensure contributors have other income sources (rebuttable presumption) |
| **United Kingdom** | Worker status (intermediate category between employee and contractor — entitled to minimum wage and holiday pay but not full employment rights); HMRC crypto income guidance | Genuinely self-selected tasks only; no worker-status indicators; payment in settlement credits (not fiat) for community roles |
| **Kenya** | Employment Act casual worker provisions (workers employed for < 3 months are casual; > 3 months is regular employment with full rights) | No contributor should receive continuous directed work for > 3 months; eco-ops facilitation framed as community participation with recognition, not directed employment |
| **Brazil** | CLT (Consolidation of Labour Laws) — presumption of employment if any of: regularity, subordination, exclusivity, personal character; crypto income taxable as capital gain | No exclusivity; RPGF structure; credits not cash |
| **India** | TDS (tax deducted at source) on professional fees above ₹30,000; crypto income at 30% flat rate | India-based contributors on formal engagement letters for significant bounties; TDS compliance if platform entity is Indian |
| **Costa Rica** | SUGEF/MTSS (Ministry of Labour): employment presumption exists but enforcement on international open-source platforms is low; PRODHAB for any contributor data processing | Clear contributor agreement; PRODHAB registration if contributor data is processed |
| **Central American Dry Corridor** | Thin enforcement but earned credits taxable if converted to cash locally via exchange | Credits designed as circular; no platform cash-out; contributor education on tax treatment |

---

## Part 7 — What formal counsel is needed before we act

These are not research questions — they require paid legal opinion from qualified practitioners:

1. **Entity structure for foundation/cooperative:** Before establishing any formal legal entity to hold treasury or IP, get a formation opinion from counsel in the target jurisdiction (Colorado, UK, or France recommended). Cost: ~$3,000–8,000.

2. **Treasury wallet jurisdiction and VASP analysis:** Before the treasury wallet holds more than ~$50,000 equivalent, get a VASP / money transmission opinion from US and EU counsel on whether our distribution mechanism is licensed. Cost: ~$5,000.

3. **Platform Work Directive compliance (EU):** Once we have regular EU-based contributors receiving material bounties, get a worker classification opinion from a German or French labour lawyer. Cost: ~$2,000–4,000.

4. **Cooperative conversion path:** When we are ready to move toward platform cooperativism, commission a formation and governance plan from a cooperative law specialist. Cost: ~$8,000–15,000.

5. **Token classification opinion:** Before issuing any new class of token or credit that differs from the current settlement address model, get a securities classification opinion (at minimum: US and EU). Cost: ~$5,000–10,000.

---

## Related documents

- [INDEX.md](INDEX.md) — jurisdiction summaries
- [RESEARCH_PROMPT.md](RESEARCH_PROMPT.md) — jurisdiction research brief
- [../FOCUS_LOCATION_OWNERSHIP.md](../FOCUS_LOCATION_OWNERSHIP.md) — ownership language and onboarding strategy
- [../SPEC_ZOOM_DESCENT.md](../SPEC_ZOOM_DESCENT.md) — platform technical architecture

---

*SCD Hub · Exotopia.org · GPL v3 · June 2026*
