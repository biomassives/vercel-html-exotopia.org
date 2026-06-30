# Legal Research Brief — Exotopia / SCD Hub Compliance

**For:** Legal researcher / counsel  
**Prepared by:** SCD Hub technical team  
**Date:** June 2026  
**Priority jurisdictions:** US, EU, Kenya, Indonesia, Brazil, India, UAE  
**Secondary jurisdictions:** UK, Singapore, South Korea, Japan, Thailand, Colombia, Argentina, Ethiopia, Tanzania

---

## Who we are and what we do

**Exotopia.org** is a web-based visualization of real astronomical data (NASA, ESA, publicly licensed catalogs). Users navigate from the cosmic web down to the surface of confirmed exoplanets. The platform is free to use and requires no account or registration to browse.

**On-chain settlement addresses:** At any point in the navigation, a user can "claim" a permanent address at a specific exoplanet location. This is recorded as an NFT (non-fungible token) on a public blockchain (Algorand or Solana, chain specified per mint). The NFT:
- Is unique to that specific coordinate (`exo-surface-v1:kepler-452b:2.31,-15.44`)
- Has no promised financial return
- Has no equity interest in SCD Hub or Exotopia.org
- Has no utility beyond access to a personalised view of that location on the platform
- Can be transferred or sold by the holder via standard blockchain mechanisms (we do not operate any secondary market)
- Costs a one-time network fee (blockchain gas) plus an optional platform fee

**Earn pathway:** Users who participate in verified real-world community activities (eco-ops field work, vocational education, cultural events) earn allocation credits toward addresses without direct purchase. Credits are verified by partner organisations.

**Payment processors:** Fiat-to-crypto on-ramps are handled by pon.ink (a separate but related platform) which uses Stripe and M-Pesa integrations. Exotopia.org itself does not process fiat payments directly.

**Open source:** All platform code is GPL v3. Contracts are publicly auditable on-chain. The address coordinate specification is an open standard.

---

## What we need

For each jurisdiction listed below, please research and produce:

### 1. Classification analysis
**Question:** How would our on-chain settlement address NFTs be classified under applicable law in this jurisdiction? Specifically:

- Are they a **security** under the applicable test (e.g., Howey in the US, financial instrument under MiFID II in the EU, collective investment scheme in Kenya, etc.)?
- Are they a **payment instrument** or **virtual currency** that requires money service business registration?
- Are they **digital goods / virtual property** subject primarily to consumer protection law?
- Are they a **utility token** — and if so, what disclosure or registration obligations does that classification carry?
- Is there any **explicit exemption** for unique, non-fungible digital collectibles with no financial return promise?

For each classification conclusion, please cite the specific statute, regulation, guidance document, or decided case that supports it. Where the law is ambiguous or the regulator has not addressed NFTs specifically, please note this and indicate the most analogous precedent.

**Sources to check for each jurisdiction (minimum):**
- The primary financial services regulator's published guidance on crypto-assets and/or NFTs
- Any fintech sandbox or innovation office publications
- Any enforcement actions or no-action letters involving comparable NFT products
- FindLaw (for US state law), EUR-Lex (for EU), national parliament / gazette records for others

---

### 2. Consumer protection obligations

**Question:** What must we disclose, offer, or refrain from doing in order to sell digital goods to consumers in this jurisdiction?

Specifically:
- Are there mandatory cooling-off / withdrawal rights for digital content purchases? (EU Consumer Rights Directive Article 16 provides an exception for digital content already delivered — does our NFT qualify?)
- Are there mandatory fee disclosure requirements before purchase?
- Are there prohibited practices (e.g., false scarcity claims, misleading investment language)?
- Is there a consumer dispute resolution mechanism we must offer or register with?
- Do "distance selling" regulations apply?

---

### 3. Data privacy requirements

**Question:** Does operating this service (collecting minimal user data — wallet address, usage patterns, eco-ops location data via pon.ink) trigger registration, consent, or localisation obligations?

- Is there a data protection authority registration required?
- Does storing a pseudonymous blockchain address (wallet address) constitute "personal data" processing in this jurisdiction? (This is contested in some EU member states and is a live regulatory question.)
- Are there data localisation requirements (data must be stored on servers within the country)?
- Are there cross-border data transfer restrictions relevant to our architecture (user in Kenya, servers in US/EU)?

---

### 4. Payment and money transmission

**Question:** Does collecting network fees (crypto) or facilitating any fiat conversion constitute a money service business, payment institution, or virtual asset service provider activity requiring registration or licensing?

Note: We do not operate a crypto exchange. We do not hold user funds. We do not convert fiat to crypto. Our platform fee is collected in crypto directly on-chain. Fiat on-ramps are handled by licensed third parties (pon.ink / Stripe / M-Pesa). Please assess whether our specific model — collect crypto fee on-chain, no fiat handling — constitutes a regulated activity.

---

### 5. Intellectual property and virtual goods

**Question:** What is the legal status of ownership of a virtual good or digital location in this jurisdiction?

- Has any court or regulator addressed whether an NFT constitutes "property" for legal purposes (can be inherited, seized by court order, used as collateral)?
- Are there precedents from virtual goods in gaming or social media contexts that apply?
- What happens to a user's NFT in the event of our platform shutdown? (We argue: nothing — the on-chain record persists regardless. Does the law agree?)

---

### 6. Specific access concerns

**Question:** Are there any laws or regulations in this jurisdiction that might require us to block access for users in that country, restrict the types of addresses that can be issued, or impose additional obligations on foreign platforms serving users there?

Examples: China's NFT restrictions; Indonesia's OJK restrictions on crypto-asset trading; India's proposed data localisation law.

---

## Jurisdiction list and priority

### Priority 1 — Research immediately (highest user volume + highest regulatory risk)

**United States**  
Regulators: SEC (securities), CFTC (commodities/derivatives), FinCEN (money transmission), State AGs  
Key sources: SEC.gov staff statements on NFTs; FinCEN guidance on virtual currency; Wyoming HB0070 (digital asset property law); Colorado SB21-269  
Additional: FindLaw.com state-by-state MSB licensing overview; Crypto Council for Innovation policy tracker  

**European Union**  
Regulators: ESMA (MiCA implementation), national FCA equivalents (BaFin DE, AMF FR, AFM NL)  
Key sources: Regulation (EU) 2023/1114 (MiCA) — specifically Article 2 (scope), Article 4(2) (NFT exemption), Recital 11; EDPB Opinion 5/2019 on blockchain and personal data  
Additional: ESMA MiCA Q&A documents; EUR-Lex for full text  

**Kenya**  
Regulators: Capital Markets Authority (CMA), Communications Authority, Central Bank of Kenya (CBK)  
Key sources: CMA Policy Guidance Note on Virtual Asset Service Providers (2023); CBK circular on digital financial products; Data Protection Act 2019 (Kenya)  
Additional: Strathmore University Africa Centre for Technology Studies blockchain policy tracker; Bowmans LLP Africa fintech report 2024  

**Indonesia**  
Regulators: OJK (Otoritas Jasa Keuangan), Bappebti (commodity futures regulator — covers crypto), Kominfo (data)  
Key sources: OJK Regulation 4/POJK.05/2023 on digital financial innovation; Bappebti Regulation 8/2021 on crypto-asset physical market; Government Regulation 71/2019 on electronic systems  
Additional: OJK fintech innovation sandbox publications  

**Brazil**  
Regulators: Banco Central do Brasil (BACEN), CVM (securities), COAF (AML)  
Key sources: Law 14,478/2022 (Virtual Asset Services Provider law); BACEN VASP regulation implementing decree (2023); CVM Resolution 175/2022 on investment funds (NFT exclusion?)  

**India**  
Regulators: RBI (banking), SECP (securities), Ministry of Finance  
Key sources: Finance Act 2022 inserting Sections 115BBH and 194S into Income Tax Act (VDA taxation); RBI circular DNBR.PD.008/03.10.119/2017-18 (withdrawn); Proposed "Digital India Act" (monitor); IAMAI and BACC industry submissions  

**United Arab Emirates**  
Regulators: VARA (Virtual Assets Regulatory Authority), ADGM Financial Services Regulatory Authority, DFSA (Dubai)  
Key sources: VARA Virtual Assets and Related Activities Regulations 2023; ADGM Digital Assets Framework (2023); UAE Federal Decree-Law 45 of 2021 on protection of personal data (PDPL)  

---

### Priority 2 — Research within 60 days

UK (FCA, Consumer Rights Act 2015, UK GDPR); Singapore (MAS Payment Services Act); South Korea (FSC VASP framework); Japan (FSA Payment Services Act, JFSA NFT guidance); Thailand (SEC digital asset regulations)

**Costa Rica**  
Regulators: SUGEF (banking / fintech), SUGEVAL (securities), SUGESE (insurance), PRODHAB (data protection)  
Key sources: Law 9859 "Ley Para Regular las Actividades de las Sociedades Financieras de Objeto Múltiple" (fintech); Law 8968 (Personal Data Protection Act); Costa Rican Constitutional Chamber rulings on internet access as a fundamental right  
Additional: BCCR (Banco Central) guidance on virtual assets (2020 circular); CINDE digital economy reports; OECD Costa Rica accession review (fintech chapter)  
Why priority: Active SCD Hub eco-ops region; PROCOMER free-trade zone structure may affect platform fee treatment; strong green governance identity aligns with exotopia mission; well-developed digital economy law but no NFT-specific regulation yet  
Key questions:
- SUGEVAL: do settlement address NFTs constitute "valores" under Ley 7732 (Mercado de Valores)? If no promised return, likely not — confirm with SUGEVAL sandbox consultation.
- BCCR circular on crypto: positions crypto as a commodity not legal tender. Does this affect our fiat on-ramp partnership with pon.ink's Stripe integration for Costa Rican users?
- PRODHAB registration: does operating a service that logs Costa Rican user sessions (wallet addresses, location data from eco-ops) require PRODHAB registration under Law 8968?
- Free Zone Regime: if SCD Hub or pon.ink establishes a Costa Rica entity, do PROCOMER free-zone tax incentives apply to digital services?

---

### Priority 3 — Research within 120 days

Colombia, Argentina, Ethiopia, Tanzania, Uganda, Morocco, Egypt, Philippines, Vietnam, Sri Lanka, Bangladesh

---

### Priority 4 — Climate, Conflict, and Displacement Context Regions

These are not standard jurisdiction analyses. The research question here is different: **what are the access, resilience, and ethical obligations of a platform like ours when operating in regions under climate stress, active conflict, or mass human displacement?** Legal research should be combined with policy and humanitarian framework research.

---

#### 4A — Active Conflict Zones

**Regions:** Ukraine, Sudan, Gaza / West Bank, Myanmar, Yemen, DRC (Democratic Republic of Congo), Haiti, Syria, Sahel (Mali, Burkina Faso, Niger), Somalia

**Research questions:**

- **Which law applies?** In contested territory, de jure law (the internationally recognised government) and de facto law (controlling authority) may differ. Which framework governs a platform user's rights when their location is under effective control of a non-state actor or occupation authority?

- **Sanctions exposure:** OFAC (US Treasury), EU, UK, and UN sanction regimes overlap significantly with active conflict zones. Research which specific sanctions designations affect our ability to provide *any* service (even the free browsing tier) to users in: Syria, certain regions of Ukraine, Sudan, Gaza under blockade. Note: general licences for NGO/humanitarian services sometimes exist — are we eligible?

- **User identity and wallet exposure:** Users in conflict zones may use wallets for financial survival, not just collectibles. If a user's NFT is their only verifiable digital property record — because land registries have been destroyed — what legal protection does the on-chain record offer? Has any court or UN body addressed this?

- **Humanitarian access principle:** The ICRC (International Committee of the Red Cross) has published guidance on digital services in conflict zones. Does our open-access, no-account-required browsing tier qualify as humanitarian-neutral infrastructure? Source: ICRC "Digital Risks in Armed Conflict" (2023).

- **Infrastructure resilience:** If a conflict zone experiences internet shutdowns (documented in Ukraine 2022, Myanmar 2021, Sudan 2023), does our IPFS/Arweave settlement metadata remain accessible via mesh or satellite networks? Research: Tor Project and Cloudflare's Bypass Censorship guidance for applicable patterns.

- **Key sources:** OFAC SDN list + country-specific general licences; EU Council Regulation listings; UN Security Council Resolutions; ICRC Digital Risks in Armed Conflict 2023; NetBlocks.org shutdown documentation; EFF's surveillance self-defence guides for conflict contexts

---

#### 4B — Climate-Displaced and Climate-Stressed Regions

**Regions:**

*Existential/sovereignty-threatened small island developing states (SIDS):*  
Tuvalu, Kiribati, Marshall Islands, Maldives, Vanuatu, Fiji, Palau, Federated States of Micronesia

*Sea-level and flood risk coastlines:*  
Bangladesh (Ganges-Brahmaputra delta); Vietnam (Mekong delta); Nigeria (Niger delta); Indonesia (North Jakarta); Pakistan (Indus basin)

*Desertification and food supply disruption:*  
Sahel belt (Senegal, Gambia, Guinea-Bissau, Mali, Burkina Faso, Niger, Chad, Sudan); Horn of Africa (Ethiopia, Somalia, Eritrea, Djibouti); MENA arid zones

*Ecosystem disruption / Amazon basin:*  
Brazil (Amazon frontier states: Pará, Amazonas, Roraima); Peru; Colombia; Bolivia; Ecuador — regions with active Indigenous land rights conflicts and deforestation enforcement

*Central American Dry Corridor (migration driver):*  
Guatemala, Honduras, El Salvador, Nicaragua — primary origin of climate-driven northward migration

**Research questions:**

- **Digital sovereignty of climate-displaced populations:** When a Pacific Island nation cedes its physical territory to rising seas, does it retain jurisdiction over its digital population? Tuvalu has explicitly established "digital statehood" (Tuvalu Digital Nation project, 2023). What legal weight does this carry for platform compliance — if a Tuvalu national holds an exolocation address, under which law is it governed after the physical island is uninhabitable?

- **Pre-emptive address as climate resilience tool:** The Central American Dry Corridor produces approximately 700,000 climate migrants annually (IOM 2023 data). For displaced persons who lack stable housing or legal identity in destination countries, a permanent cosmic address may be the most stable "location" they can hold. Are there legal frameworks (UNHCR displaced persons protection, IOM migration data standards) that could formally recognise digital place records as part of a displacement response? Research: UNHCR Digital Identity Project; World Bank ID4D initiative.

- **Indigenous land rights and ecosystem disruption — Amazon:** In the Brazilian Amazon, indigenous communities face physical land dispossession concurrent with deforestation. If SCD Hub's eco-ops network records biodiversity field work in these communities, what data governance framework applies? Who owns the field data — the community, the NGO, SCD Hub? Research: FUNAI (Brazil's indigenous affairs body); ILO Convention 169 (Indigenous and Tribal Peoples); UNDRIP (UN Declaration on the Rights of Indigenous Peoples) Article 31 on cultural and intellectual property.

- **Climate litigation and platform obligations:** The Urgenda v Netherlands case (2019) and subsequent climate cases in various jurisdictions have established that states have enforceable climate duties. Is there an emerging doctrine that digital platforms serving communities in climate-stressed zones have any heightened duty of care, access continuity, or data preservation? Research: Sabin Center for Climate Change Law (Columbia Law School) litigation tracker; ClientEarth precedent database.

- **UNFCCC Loss and Damage framework:** The COP28 Loss and Damage Fund (2023) established that developed-world emitters owe reparative finance to climate-vulnerable nations. Does our earn-not-pay model — where eco-ops field work in climate-stressed regions earns settlement credits — qualify as a form of "in-kind" recognition of climate contribution? This is not a legal question per se, but a policy framing question for how we describe the earn pathway in vulnerable regions.

- **Food supply disruption zones — data use:** If eco-ops partners in Sahel or Horn of Africa regions collect biodiversity and soil data as part of settlement credit verification, what disclosure and data sovereignty obligations apply to that agricultural/ecological data? Research: CGIAR Open Data Policy; FAO ITPGRFA (Treaty on Plant Genetic Resources for Food and Agriculture); national seed sovereignty laws in Ethiopia and Mali.

- **Key sources:** SIDS AOSIS (Alliance of Small Island States) policy submissions to UNFCCC; Tuvalu Digital Nation Framework (2023); UNHCR Digital Identity Initiative; IOM World Migration Report 2024; Sabin Center Climate Litigation Database; UNDRIP (A/RES/61/295); ILO Convention 169; CGIAR Open Data Policy v2.0; World Bank ID4D; NetBlocks regional shutdown data

---

#### 4C — Climate Migration Destination Countries

When climate-displaced persons settle in new host countries, their digital property (including exolocation addresses) travels with them. Research for the following destination countries should specifically address:
- Whether a non-citizen's on-chain digital property has legal recognition
- Whether earn-pathway credits tied to eco-ops activities in origin countries are taxable in the destination country
- Whether a displaced person's exolocation address constitutes "virtual asset" under VASP frameworks in the host country, triggering KYC/AML requirements the person cannot satisfy without identity documents

**Key destination countries:** Germany (largest Syrian displacement host in EU); Turkey (largest total refugee host globally); Colombia (Venezuelan displacement); Uganda (largest Africa host — DRC, South Sudan, Somalia); USA (climate migration via Central American Dry Corridor); Canada; Mexico (transit and destination)

---

## Deliverable format

For each jurisdiction, please produce a document at:
`compliance/{jurisdiction-slug}/overview.md`

Each document should follow this structure:

```markdown
# [Country] — Compliance Overview

**Jurisdiction:** [Country]  
**Last reviewed:** [Date]  
**Reviewed by:** [Researcher name / firm]  
**Sources cited:** [List all sources with URLs or citations]

## Classification
[Analysis with citations]

## Consumer protection
[Analysis with citations]

## Data privacy
[Analysis with citations]

## Payment / money transmission
[Analysis with citations]

## Virtual property
[Analysis with citations]

## Access restrictions
[Analysis with citations]

## Summary risk rating
| Category | Risk level | Notes |
|---|---|---|
| Classification as security | Low / Medium / High | |
| Consumer protection exposure | Low / Medium / High | |
| Data privacy obligations | Low / Medium / High | |
| Payment licensing | Low / Medium / High | |
| Access restriction risk | Low / Medium / High | |

## Recommended actions
- [Specific steps we should take]

## Open questions requiring specialist counsel
- [Questions that need formal legal opinion, not just research]
```

---

## Things to watch that affect all jurisdictions

**FATF Travel Rule:** Financial Action Task Force recommendations on virtual asset transfers (Recommendation 16) are being implemented variably. Check whether our NFT issuance triggers VASPs' travel rule obligations. We believe it does not (we don't facilitate transfers, users transfer directly via wallets) but this needs confirmation.

**OECD CARF (Crypto-Asset Reporting Framework):** 48 countries have signed up to automatic information exchange on crypto transactions. Monitor for reporting obligations that may arise on our platform fees.

**BIS and Basel Committee on Banking Supervision:** Guidance on crypto-asset risk weights — not directly applicable to us but may affect banking partners and payment processors.

**IMF Digital Money Framework:** No binding impact, but useful for framing discussions with national regulators in developing countries where IMF influence is strong.

**Climate disclosure obligations (emerging):** The EU Corporate Sustainability Reporting Directive (CSRD) and SEC climate disclosure rules (US) are creating expectations that platforms explain their climate footprint and climate-related risk. Our blockchain infrastructure has an energy cost. Our eco-ops network operates in climate-stressed zones. Even if we are below the revenue thresholds for mandatory reporting, voluntary disclosure in this area strengthens our position with regulators in climate-sensitive jurisdictions (Costa Rica, Pacific SIDS, Kenya, Colombia).

**Conflict zone sanctions liability:** OFAC's guidance on virtual currency and sanctions (2021) places affirmative obligations on crypto-adjacent services not to facilitate transactions with sanctioned persons or territories, regardless of whether the service is "just" an NFT issuer. Our free-access tier must remain freely accessible. But the earn-credit and minting pathway should be reviewed against the OFAC SDN list and sectoral sanctions for conflict zones. This is a standing monitoring obligation, not a one-time research task.

**UNDRIP and Indigenous data sovereignty:** The UN Declaration on the Rights of Indigenous Peoples (A/RES/61/295) Article 31 establishes indigenous peoples' right to control data about their communities and cultural heritage. As eco-ops field work increasingly involves Indigenous land territories (Amazon, Sahel, Pacific), our data governance framework must address this proactively rather than reactively.

**IOM and UNHCR digital identity standards:** The International Organization for Migration and UNHCR are developing standards for digital identity for displaced persons. If exolocation addresses come to function as a stable digital home for displaced people, we should be aligned with these standards early rather than later. Monitor: IOM Digital Transformation Strategy 2024–2028; UNHCR Digital Identity Guidance Note.

---

## What to avoid in the research

- Do not produce generic "blockchain regulations" overviews that are not grounded in our specific product
- Do not cite secondary sources (blogs, articles) without also citing the primary regulation or case they describe
- Flag explicitly where the law is silent or ambiguous — silence is more useful to us than speculation
- Where you are uncertain, say so and indicate what type of specialist (crypto securities lawyer, data protection specialist, etc.) should be engaged for a formal opinion

---

## Budget note

For Priority 1 jurisdictions, we are prepared to commission formal legal opinions (not just research notes) from qualified local counsel for any jurisdiction where the classification analysis reveals ambiguity or meaningful risk. Please flag these in your research output.

---

*Prepared by SCD Hub technical and policy team · June 2026*  
*Return to: [compliance/INDEX.md](INDEX.md)*
