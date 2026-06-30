# Trust Hierarchy — Distributed Credential Issuance

**Document type:** Governance specification  
**Last updated:** June 2026  
**Return to:** [digital-credentials-law/INDEX.md](INDEX.md)

---

## Principles

1. **Credentials are only as credible as the issuer's accountability.** A certificate that anyone can issue for anything is worthless. The trust hierarchy ensures that every credential traces back to an accountable party.

2. **Authority flows down, responsibility flows up.** Level 2 sponsors are responsible for the credentials issued by their Level 3 groups. SCD Hub is responsible for the credentials issued by Level 2 partners. This is not waivable — sponsoring a group means owning their issuance.

3. **Scope is explicit and narrow.** Each issuer has a defined set of categories they can issue and a defined population they can issue to. Issuing outside scope is a revocable offence.

4. **Revocation is on-chain and immediate.** A fraudulent or erroneous credential can be revoked by the issuer or by any level above them. Revocation is on-chain; the certificate status is publicly visible without requiring the issuer to maintain infrastructure.

5. **Local groups retain their identity.** A Level 3 group's credentials carry the group's own name prominently. SCD Hub and the Level 2 sponsor appear as counter-signers. The credential belongs to the community that issued it, not to SCD Hub.

---

## Level 1 — SCD Hub Root Authority

**DID:** `did:algo:SCDHUB_ROOT` (Algorand-anchored DID, multi-sig controlled)  
**Key holders:** SCD Hub foundation / cooperative governance committee (minimum 3-of-5 multi-sig for root key operations)  
**Scope:** All certificate categories across all regions  
**What SCD Hub issues directly:**
- Certificates for direct contributors to the platform codebase
- Platform milestone certificates (`news:milestone`, `news:record`)
- Root-level learning pathway completions where no regional partner covers the domain
- Certificates for governance proposals adopted through the SCD Hub DAO

**What SCD Hub does NOT issue directly:**
- Eco-ops field certificates where a regional partner has domain authority (the partner issues; SCD Hub counter-signs)
- Indigenous ecological knowledge certificates (these are jointly issued with the community governance body — SCD Hub is never sole issuer)
- Regional education credentials (issued by educational institution partners — SCD Hub counter-signs)

**Governance of root key:**
- Root key rotation: annual, or on compromise
- Root key holder change: requires cooperative governance vote (simple majority of member class representatives)
- Emergency revocation: any 3 of 5 key holders can revoke a partner's issuing authority immediately; full committee review within 14 days

---

## Level 2 — Partner Organisations

Partner organisations are the backbone of the network. They bring domain expertise, local accountability, and existing relationships with credential recipients. SCD Hub does not have the reach or the domain knowledge to verify a soil health assessment in the Sahel or a traditional ecological knowledge protocol in the Amazon — partner organisations do.

### Eligibility criteria for Level 2 partnership

An organisation may apply for Level 2 partner status if it meets ALL of the following:

**Organisational standing:**
- Registered legal entity in at least one jurisdiction (any form: NGO, cooperative, educational institution, artist collective with formal structure, community development organisation)
- Minimum 2 years of active operation
- Publicly stated mission that aligns with at least one SCD Hub certificate category
- Identifiable governance — a named committee, board, or leadership structure that can be held accountable

**Domain competency:**
- Demonstrated capacity to verify the type of achievement being certified (an ecology NGO must show it conducts or oversees field assessments; an education provider must show it delivers curriculum)
- At minimum one named individual with recognised expertise in the credential domain

**Data and privacy:**
- Commits to operating under a data processing agreement (DPA) with SCD Hub
- Agrees not to store credential recipient personal data beyond what is necessary for issuance
- In EU/EEA: registered with relevant data protection authority or covered by SCD Hub's registration

**Agreement:**
- Signs the SCD Hub Partner Credentialing Agreement (to be drafted — covers: scope, revocation obligations, annual reporting, liability for fraudulent issuance)
- Annual review — partnership renewed or lapsed each year

### Partner categories and default scope

| Partner type | Default certificate scope | Extended scope (on application) |
|---|---|---|
| Ecological field organisation (NGO, research body, cooperative) | `eco:*` (all eco-modality domains), `learn:practitioner` | `idea:discovery` for documented field insights |
| Formal educational institution (school, vocational college, university) | `learn:*` (all learning levels) | `contrib:docs`, `contrib:translation` |
| Artist collective / cultural organisation | `art:*` (all art/creative types) | `news:milestone` for cultural events |
| Community development / facilitation organisation | `contrib:community`, `learn:foundation` | `eco:*` if they have field programme |
| Indigenous community governance body | `eco:indigenous` (solely), `news:record` | Extended scope requires separate agreement |
| Technology / open-source organisation | `contrib:code`, `contrib:design`, `contrib:ux` | `learn:advanced` for technical pathways |
| Vocational training provider | `learn:practitioner`, `learn:advanced` | `eco:*` for applied environmental programs |

### What partners do NOT get

- They cannot issue `learn:facilitator` without SCD Hub co-signature (facilitator status requires root-level endorsement because facilitators train others who then issue credentials)
- They cannot issue credentials in categories outside their scope without amendment to their partner agreement
- They cannot authorise Level 3 groups outside their own network and geographic/domain scope
- They cannot transfer their issuing authority to another organisation — authority is non-transferable

---

## Level 3 — Local User Groups

Local user groups are the edge of the network — the community ecology circle in Nairobi, the school art programme in Medellín, the farmers' water monitoring cooperative in the Mekong delta, the Indigenous mapping project in the Amazon. They are often informal, small, and without the capacity for a direct relationship with an international platform.

Level 3 groups are onboarded through their Level 2 sponsor. SCD Hub's relationship is with the Level 2 partner, not directly with every Level 3 group.

### Eligibility criteria for Level 3 groups

Requirements are deliberately lighter than Level 2 — local groups should not face a compliance burden that excludes them:

- At least 3 named members (does not need to be a registered legal entity)
- A named facilitator who holds an SCD Hub `learn:facilitator` certificate (this is the accountability link — the facilitator is the person responsible for the group's issuance)
- Sponsored and vouched for by a Level 2 partner
- Completed the SCD Hub local group onboarding (a short self-paced module, ~2 hours)
- Agreement to the SCD Hub Community Credentialing Code of Conduct (plain-language, one page)

### What Level 3 groups can issue

A Level 3 group can issue a subset of the scope held by their Level 2 sponsor, as defined in their group charter. Examples:

**Example A — Community ecology monitoring group, Kenya**
Sponsored by: Kenya Wildlife Service (Level 2 partner, scope: `eco:*`, `learn:practitioner`)  
Level 3 group scope: `eco:biodiversity`, `eco:water`, `learn:foundation`  
Can issue to: members of their local community who participate in monitored field activities  
Cannot issue: `eco:soil` (not in their local programme), `learn:practitioner` (not enough verification capacity at group level)

**Example B — School visual arts programme, Colombia**
Sponsored by: Fundación Arte y Comunidad (Level 2 partner, scope: `art:*`)  
Level 3 group scope: `art:visual`, `art:writing`  
Can issue to: enrolled students who complete defined project criteria  
Cannot issue: `art:music`, `art:spatial` (not taught in this programme)

**Example C — Farmers' water monitoring cooperative, Indonesia**
Sponsored by: WALHI (Indonesian Environment Forum, Level 2 partner, scope: `eco:*`, `contrib:community`)  
Level 3 group scope: `eco:water`, `eco:soil`, `contrib:community`  
Can issue to: cooperative members who complete monitoring training and submit verified data  
Cannot issue: `learn:*` (education not in WALHI's scope for this group)

**Example D — Indigenous mapping project, Brazilian Amazon**
Sponsored by: Instituto Socioambiental (ISA, Level 2 partner with `eco:indigenous` scope)  
Level 3 group scope: `eco:indigenous`, `news:record`  
Jointly issued with: community governance council (named in the certificate)  
Can issue to: community members participating in territorial mapping activities  
Special condition: ISA and the community council must both countersign every `eco:indigenous` certificate — neither can issue alone

### What Level 3 groups cannot do

- Cannot authorise further groups (the hierarchy stops at Level 3)
- Cannot revoke a certificate issued by another group, even within the same Level 2 network
- Cannot issue outside their defined scope without amendment by their Level 2 sponsor
- If the facilitator holding the `learn:facilitator` certificate leaves the group, issuance is paused until a new facilitator is appointed and certified

---

## Issuance process

The same workflow applies at all three levels:

1. **Verify the achievement** — the issuer confirms that the recipient has done the thing the certificate describes. The verification method is appropriate to the category: field observation for `eco:*`; reviewed and accepted PR for `contrib:code`; curriculum completion record for `learn:*`.

2. **Generate the certificate** — via the SCD Hub certificate API (`POST /api/v1/cert/issue`). The API takes: recipient wallet address or email (wallet preferred; email triggers a wallet creation flow), category slug, achievement description, evidence hash (IPFS CID of supporting document, photo, or record), issuer DID, co-signers (if any).

3. **Counter-sign** — Level 3 certificates are automatically routed to the Level 2 sponsor for counter-signature via the API. Level 2 certificates are routed to SCD Hub root for counter-signature. Counter-signature is a cryptographic operation, not a manual review — it confirms that the issuer is within scope. SCD Hub spot-checks 5% of all issued certificates.

4. **Mint** — once all required signatures are collected, the certificate hash is minted on-chain. The recipient receives a notification (email or wallet notification) with their certificate URL.

5. **Deliver** — the certificate is accessible at `exotopia.org/cert/:id` without any wallet. The SVG file is pinned on IPFS/Arweave. The recipient can download the SVG, share the URL, or import it into any Open Badges 3.0 compatible wallet.

---

## Revocation

Any level may revoke a certificate issued by a level below them. The issuer may revoke their own certificates. Revocation reasons are public and on-chain.

Valid revocation reasons:
- `FRAUDULENT` — the achievement was not verified; the certificate was issued in error or with intent to deceive
- `WITHDRAWN` — the recipient has asked for the certificate to be removed (GDPR right of erasure requests are handled by status change to `WITHDRAWN`, not by deletion — the on-chain record persists but the certificate status is marked withdrawn)
- `SUPERSEDED` — the certificate has been replaced by an updated version (e.g., an upgrade from `learn:practitioner` to `learn:advanced`)
- `PARTNER_SUSPENDED` — the issuing Level 2 partner has had their authority suspended pending review; all their Level 3 group certificates are also suspended

Revocation does NOT delete the certificate — the on-chain record is permanent. Revocation changes the status field returned by the verification API. Third-party platforms that check status before accepting a credential (LinkedIn, Accredible) will see the revoked status and decline to display it.

---

*SCD Hub · Exotopia.org · GPL v3 · June 2026*  
*Return to [INDEX.md](INDEX.md)*
