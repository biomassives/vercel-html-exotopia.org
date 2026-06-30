# Digital Credentials Law — Index

**Scope:** Legal and governance framework for SCD Hub's certificate system — who can issue, who can receive, what weight credentials carry, how local groups become authorized issuers  
**Last updated:** June 2026  
**Return to:** [compliance/INDEX.md](../INDEX.md)

---

## What this folder covers

The SCD Hub certificate system (documented in [compliance/POLYNOMICS-CONTRIBUTION.md](../POLYNOMICS-CONTRIBUTION.md) §3F) uses SVG on-chain credentials anchored to W3C Verifiable Credentials 2.0 and Open Badges 3.0. The system is designed for **distributed issuance** — SCD Hub is the root authority, but local user groups, ecological field partners, educational organisations, and artist collectives can become credentialing nodes within the trust hierarchy.

This folder maps:
1. The global legal framework that governs digital credentials in our target regions
2. The trust hierarchy — how issuance authority flows from root to local groups
3. A regional plan for which group types can issue which credential categories, and what each region requires for that to be legally sound

---

## Global technical and standards layer

These are the technical frameworks our certificates are built on. They are not regulations — they are interoperability standards that determine whether our credentials are accepted by third-party platforms (LinkedIn, Accredible, government employment systems, university admission portals).

| Standard | Governing body | What it enables |
|---|---|---|
| W3C Verifiable Credentials 2.0 | W3C | Machine-verifiable credential schema; DID-based issuer identity |
| Open Badges 3.0 | IMS Global (1EdTech) | HR and education platform interoperability; LinkedIn, Badgr, Accredible import |
| DIF Decentralized Identity Foundation — DIDComm | DIF | Wallet-to-wallet credential presentation without central server |
| ISO/IEC 18013-5 | ISO/IEC JTC 1/SC 17 | Mobile credential presentation standard; aligns with eIDAS 2.0 |
| UNCITRAL Model Law on Electronic Signatures | UN | Legal validity of electronic signatures across 70+ adopting states |
| UNESCO Convention on Recognition of Qualifications (Lisbon) | UNESCO | Mutual recognition of higher education qualifications in 55+ countries |
| ILO ISCO-08 | ILO | Standard occupational classification — used to map credential competencies to job roles |

Our certificates should be issued in a format that satisfies Open Badges 3.0 at minimum, with W3C VC 2.0 metadata embedded. This makes them importable into any compliant credential wallet without SCD Hub acting as a permanent middleman.

---

## Trust hierarchy

The issuer network has three levels. Each level can issue credentials within the scope granted by the level above. No level can issue credentials outside its authorised scope or grant more authority than it has itself.

```
LEVEL 1 — ROOT AUTHORITY
SCD Hub (DID: did:algo:SCDHUB_ROOT)
Issues: all certificate categories
Authorises: Partner organisations (Level 2)
Governed by: SCD Hub foundation / cooperative governance

        │
        ├─ LEVEL 2 — PARTNER ORGANISATIONS
        │   Vetted NGOs, educational institutions, artist collectives,
        │   ecological research bodies, cooperative federations
        │   Issue: categories within their domain (e.g., an ecology NGO
        │           issues eco:* and learn:practitioner but not contrib:code)
        │   Authorise: Local user groups (Level 3) within their network
        │   Governed by: Partner agreement + annual review
        │
        └─ LEVEL 3 — LOCAL USER GROUPS
            Community facilitator networks, informal learning circles,
            field survey teams, neighbourhood arts collectives
            Issue: a narrow set of categories as defined by their
                   Level 2 sponsor and approved by SCD Hub
            Governed by: Local group charter + Level 2 oversight
```

The key principle: **a certificate is only as credible as the issuer's accountability**. Level 3 groups issue credentials that carry their own name and their Level 2 sponsor's name. If a Level 3 group issues a fraudulent or unverified credential, the Level 2 sponsor is responsible for revoking it and the group's issuing authority.

Revocation is on-chain — a revoked credential's status is visible at `exotopia.org/cert/:id` without requiring the issuer to maintain a server.

---

## Document map

| Document | Contents | Status |
|---|---|---|
| [INDEX.md](INDEX.md) | This file — overview and navigation | Complete |
| [../../SPEC_DOMAIN_COMPETENCY.md](../../SPEC_DOMAIN_COMPETENCY.md) | Domain competency framework — 12 domains, four levels, evidence requirements, ApproVideo alignment | Complete |
| [TRUST-HIERARCHY.md](TRUST-HIERARCHY.md) | Detailed governance rules for the three-level issuer network | Complete |
| [REGIONAL-PLAN.md](REGIONAL-PLAN.md) | Regional legal framework and local group authorisation plan | Complete |
| africa/east-africa.md | Kenya, Tanzania, Uganda, Ethiopia — detailed jurisdiction analysis | Pending |
| europe/eu.md | EU eIDAS 2.0, ESDE, Europass — credential recognition framework | Pending |
| americas/central-america.md | Costa Rica, Guatemala, Honduras, El Salvador, Nicaragua | Pending |
| americas/south-america.md | Brazil, Colombia, Argentina, Peru | Pending |
| americas/north-america.md | USA, Canada | Pending |
| asia-pacific/southeast-asia.md | Singapore SkillsFuture, AQRF, Indonesia BNSP, Philippines TESDA | Pending |
| asia-pacific/pacific-sids.md | Pacific Qualifications Framework, USP, SIDS digital credential context | Pending |
| mena/overview.md | UAE QA, Saudi NQF, Jordan NQF | Pending |

---

*SCD Hub · Exotopia.org · GPL v3 · June 2026*  
*Return to [compliance/INDEX.md](../INDEX.md)*
