# Regional Plan — Local User Group Credentialing by Region

**Document type:** Regional implementation guide  
**Last updated:** June 2026  
**Return to:** [digital-credentials-law/INDEX.md](INDEX.md)

---

## How to read this document

For each region this document gives:
- The **legal framework** that governs digital credentials locally (what law applies when our certificates are used for employment, education, or professional recognition)
- The **local group types** that are eligible for Level 2 or Level 3 partnership in this region
- The **interoperability path** — whether our certificates map to a regional qualification framework that gives them additional weight
- The **friction points** — where local law creates obstacles, and how we navigate them
- **Partner candidates** — the types of organisations to approach first in each region

This is a living plan. Specific named partner organisations will be added as relationships develop.

---

## Region 1 — East Africa (Kenya, Tanzania, Uganda, Ethiopia, Rwanda)

### Legal framework for digital credentials

**Kenya** has the most developed framework in the region. The Kenya National Qualifications Authority (KNQA) Act 2014 established a national qualifications framework with 10 levels covering formal and non-formal learning. KNQA explicitly recognises **Recognition of Prior Learning (RPL)** — the formal process by which informal and non-formal learning is assessed and credited. Our eco-ops field certificates and community facilitation certificates sit squarely in the RPL category.

The Kenya National Qualifications Framework (KNQF) aligns to the East African Community Qualifications Framework (EAQF), which means a certificate recognised by KNQA may carry weight across Kenya, Uganda, Tanzania, Burundi, and Rwanda — the largest common credential market in the region.

**Tanzania:** NACTE (National Council for Technical Education) and NCHE govern vocational and higher education credentials. Non-formal credentials are less formally regulated. Digital signatures on credentials are legally valid under the Electronic and Postal Communications Act 2010.

**Uganda:** UNEB (Uganda National Examinations Board) and NCHE govern formal credentials. The Uganda Qualifications Framework is at an early stage. Non-formal credentials from NGO partners have wide practical use even without formal recognition.

**Ethiopia:** TVET Agency governs vocational credentials. Ethiopia has an active interest in digital credentialing for the large workforce entering eco-agriculture and climate adaptation sectors.

**Rwanda:** Rwanda Qualifications Authority (RQF) is active and aligns to EAC frameworks. Rwanda's digital governance is advanced — electronic signatures and blockchain records have explicit legal recognition under the Law Governing Information and Communication Technologies (2016).

### Local group types — eligibility and scope

| Group type | Credential scope | Legal note |
|---|---|---|
| Community ecology monitoring groups | `eco:biodiversity`, `eco:water`, `eco:soil` | No registration required; facilitate through KNQA RPL partner |
| TVET colleges and vocational centres | `learn:practitioner`, `learn:advanced` | Must be registered with KNQA/NACTE/UNEB — many already are |
| Women's agricultural cooperatives | `eco:food`, `eco:soil`, `contrib:community` | No formal registration required for Level 3 |
| Indigenous/pastoralist community groups | `eco:indigenous`, `eco:biodiversity` | Joint issuance required; approach through RECONCILE (Kenya) or similar |
| Youth arts collectives | `art:visual`, `art:writing` | No registration required |
| Community health and watershed monitoring groups | `eco:water`, `eco:climate` | Often already have M&E infrastructure — partner with WRMA (Kenya Water Resources Authority) |
| Schools with eco-clubs | `eco:biodiversity`, `learn:foundation` | Strong pipeline; many eco-clubs already linked to NatureKenya, A Rocha |

### Interoperability path

Certificates in the `learn:*` category should be designed to align with **KNQF Level 2–4** (equivalent to basic vocational competency through mid-level technical skills). The KNQF alignment text should appear in the certificate metadata as a `credentialAlignment` field (Open Badges 3.0 spec):

```json
"credentialAlignment": [{
  "alignmentType": "educationalFramework",
  "targetName": "Kenya National Qualifications Framework",
  "targetUrl": "https://knqa.go.ke/knqf",
  "targetDescription": "KNQF Level 3 — Vocational Certificate"
}]
```

This does not guarantee formal KNQA recognition, but it creates the vocabulary for an RPL assessor to map our certificates to the national framework.

### Friction points

- **Internet access:** Certificate delivery via `exotopia.org/cert/:id` requires internet. For offline contexts, certificates should be exportable as printable PDFs at issuance. QR code on the printed cert links to the online verification endpoint.
- **Name and identity:** Many eco-ops participants in rural East Africa lack a national ID or consistent name spelling across documents. Certificate recipient identity should be anchored to wallet address (not name) as the primary identifier. A display name is a secondary, human-readable field.
- **Language:** Certificates should be available in Kiswahili (Kenya, Tanzania), Amharic (Ethiopia), and Luganda (Uganda) as primary language versions, with English as the metadata language. The SVG template system should support right-to-left and multi-script rendering.

### Priority partner types to approach

In order of priority: environmental NGOs with existing KNQA RPL partnerships; TVET institutions with eco-agriculture programmes; community-based organisations in the EAC EAQF working group; NatureKenya, A Rocha Kenya, WRMA, Kenya Forest Service community forest associations.

---

## Region 2 — Central America and Costa Rica

### Legal framework for digital credentials

**Costa Rica** is the regional leader in credential infrastructure. SINAES (Sistema Nacional de Acreditación de la Educación Superior) accredits higher education; INA (Instituto Nacional de Aprendizaje) governs vocational training and has issued digital certificates since 2019. Costa Rica's Constitutional Court (Sala IV) has issued rulings on electronic document equivalence with physical documents — our on-chain SVG certificates are legally equivalent to a physical certificate under Ley 8454 (Digital Documents and Signatures Act 2005).

Law 8454 explicitly recognises digital signatures using certificates issued by a registered certification authority (CA). SCD Hub will need to register as a CA with MICITT (Ministry of Science, Technology and Telecommunications) to have our certificates carry full legal weight in Costa Rica, or partner with a registered CA (e.g., Banco Nacional de Costa Rica's CA) to countersign certificates for Costa Rican recipients.

**Guatemala, Honduras, El Salvador, Nicaragua:** All four countries have basic electronic signature laws but minimal digital credential infrastructure. SICA (Sistema de la Integración Centroamericana) has a regional qualifications framework initiative but implementation is uneven. Our certificates will be used practically (by employers and community organisations) but do not yet have formal regulatory standing.

**Panama:** More advanced — Autoridad Nacional para la Innovación Gubernamental (AIG) has a digital identity infrastructure and electronic signature law that is relatively mature.

### Local group types — eligibility and scope

| Group type | Credential scope | Notes |
|---|---|---|
| Ecological reserves and park rangers | `eco:biodiversity`, `eco:restoration` | SINAC (Costa Rica National Conservation Areas System) has 168 conservation areas — rich partner network |
| Organic farming and agroecology cooperatives | `eco:food`, `eco:soil` | CONARROZ, COOCAFE — existing cooperative infrastructure |
| Environmental education programmes (MEP-linked) | `learn:foundation`, `learn:practitioner` | MEP (Ministry of Public Education) has environmental education mandate |
| Indigenous territories (Bribri, Cabécar, Boruca, Ngäbe) | `eco:indigenous`, `eco:biodiversity` | Must engage through ADIs (Asociaciones de Desarrollo Indígena) — the official representative bodies |
| Community arts groups | `art:visual`, `art:writing`, `art:music` | Rich tradition; no formal structure required at Level 3 |
| Climate migration support networks (Dry Corridor) | `contrib:community`, `learn:foundation` | Guatemala, Honduras, El Salvador — priority for earn-not-pay onboarding |
| Waterway monitoring networks | `eco:water`, `eco:climate` | SINAC and SENARA (National Irrigation Service) have established monitoring networks |

### Interoperability path

INA (Costa Rica) has a **Qualifications Framework** aligned to CINTERFOR (ILO's regional vocational training centre for Latin America). Certificates in the `learn:practitioner` and `learn:advanced` categories should include a CINTERFOR alignment field. This is the regional equivalent of the EAQF alignment for East Africa.

Costa Rica specifically: aligning with INA's **competency standards (normas de competencia laboral)** in environmental management (NC-03-007, NC-03-008) would allow our `eco:*` certificates to be evaluated for credit toward INA vocational qualifications. This is a medium-term partnership goal.

### Friction points

- **CA registration:** To carry full legal weight under Ley 8454, certificates for Costa Rican recipients need a registered CA countersignature. Priority action: partnership with a registered CA or application for SCD Hub's own CA registration with MICITT.
- **Indigenous consultation:** Bribri, Cabécar, and other Costa Rican indigenous communities have legal protection under ILO Convention 169, which Costa Rica has ratified. FPIC processes for `eco:indigenous` certificates must engage the ADI of the specific territory.
- **Language diversity:** Bribri and Cabécar language certificates are a meaningful gesture even if technically complex — worth investigating with community partners.

---

## Region 3 — South America (Brazil, Colombia, Peru, Bolivia, Ecuador)

### Legal framework for digital credentials

**Brazil** has the most developed digital credential infrastructure in the region. The ICP-Brasil (Infraestrutura de Chaves Públicas Brasileira) is the national public key infrastructure. Electronic signatures under ICP-Brasil are legally equivalent to wet signatures. The MEC (Ministry of Education) operates the **e-MEC** platform for credential recognition. SENAI (National Industrial Apprenticeship Service) and SEBRAE have issued digital badges in Open Badges format since 2020.

Critically for us: Brazil's **LGPD** (Lei Geral de Proteção de Dados) applies to all credential recipients who are Brazilian residents. A DPA with any Brazilian Level 2 partner is mandatory, not optional. The DPA must specify: what personal data is processed (wallet address, name, achievement description), purpose (credential issuance), storage period, and data subject rights.

**Colombia:** Law 527 of 1999 (Electronic Commerce) and Decree 2364 of 2012 (Electronic Signatures) provide the legal basis. The **MEN** (Ministry of National Education) recognises non-formal credentials for continuing education purposes. SENA (National Learning Service) has a large open digital badge programme.

**Peru:** MINEDU (Ministry of Education) has a national qualifications framework (MTC Perú). Electronic documents are regulated under Law 27269. Digital credentials from international platforms are used practically but not yet formally regulated.

**Ecuador:** SENESCYT (Secretary of Higher Education) governs credential recognition. Indigenous nationality councils (CONAIE federations) are important partners for any `eco:indigenous` work in Ecuador's Amazon territories.

**Bolivia:** SPE (Plurinational State of Education) governs credentials. Indigenous community governance structures (TCO — Tierras Comunitarias de Origen) are the relevant partner bodies for Amazon territories.

### Local group types — eligibility and scope

| Group type | Credential scope | Notes |
|---|---|---|
| Community-based Amazon monitoring groups | `eco:biodiversity`, `eco:restoration`, `eco:indigenous` | ISA (Instituto Socioambiental), COIAB (Amazon indigenous coordination body) — key Level 2 partners |
| Agroecology and permaculture networks | `eco:food`, `eco:soil`, `eco:circular` | ANA (Agroecology National Articulation, Brazil) — large network |
| Afro-descendant community quilombo associations | `eco:biodiversity`, `art:*`, `contrib:community` | CONAQ (National Coordination of Quilombola Communities) — rich cultural and ecological credential territory |
| SENAI/SEBRAE digital economy training | `learn:practitioner`, `contrib:code`, `contrib:design` | Strong digital skills pipeline; existing Open Badges infrastructure |
| Climate justice youth movements (Fridays for Future, Engajamundo) | `learn:foundation`, `contrib:community` | High mobilisation; certificate as formal recognition of climate advocacy |
| Visual arts cooperatives and collectives | `art:visual`, `art:writing` | Particularly strong in Brazil (Acre, Pará) and Colombia |
| River basin monitoring cooperatives (Amazon, Orinoco) | `eco:water`, `eco:climate` | OTCA (Amazon Cooperation Treaty Organisation) has monitoring infrastructure |

### Interoperability path

**Brazil:** Align `learn:*` certificates with SENAI's **CBO (Classificação Brasileira de Ocupações)** competency standards. Align `eco:*` certificates with INPA (National Institute for Amazon Research) field researcher competency profiles. Both create a pathway for our certificates to be used as portfolio evidence in formal SENAI qualification assessments.

**Colombia:** SENA's Open Badge programme and national qualification framework (MNNC) provide the alignment vocabulary. Certificates should include `credentialAlignment` pointing to relevant SENA occupational standards.

### Friction points

- **LGPD mandatory DPA:** Every Brazilian Level 2 partner agreement must include a LGPD-compliant DPA. This is non-negotiable and should be drafted as a standard annex to the partner agreement.
- **FUNAI notification:** Any eco-ops activity on or near officially demarcated indigenous territories in Brazil must be notified to FUNAI (Fundação Nacional dos Povos Indígenas). This is an administrative step, not a prohibition, but it must be done.
- **ICP-Brasil alignment:** For certificates to be formally used in Brazilian HR and education systems, they should ideally carry an ICP-Brasil compliant signature. Partnership with a Brazilian CA is a medium-term goal.

---

## Region 4 — Southeast Asia (Indonesia, Philippines, Vietnam, Thailand, Malaysia)

### Legal framework for digital credentials

**Indonesia** has the most active digital credential development. BNSP (Badan Nasional Sertifikasi Profesi — National Professional Certification Authority) governs professional competency certificates. LSSP (professional certification bodies) issue BNSP-recognised certificates for hundreds of occupational sectors. Eco-sector certificates (agri, forestry, fisheries) from BNSP-recognised LSPs are used for employment and procurement decisions. KOMINFO governs electronic documents under Government Regulation 71/2019. Our certificates need to align with SKKNI (national occupational competency standards) to be practically useful in the Indonesian labour market.

**Philippines:** TESDA (Technical Education and Skills Development Authority) is the primary vocational credential authority. TESDA's online learning platform issues digital badges in Open Badges format. TESDA has an explicit framework for recognising non-formal learning from NGO and community organisations. This is one of the most accessible pathways for Level 2 partnership in the region.

**Vietnam:** No dedicated digital credential law. Ministry of Education and Training (MOET) governs all credentials formally. Digital documents are regulated under Decree 30/2020. NGO-issued credentials are used practically but have no formal standing. Strong informal credentialing culture in the tech sector.

**Thailand:** OVEC (Office of Vocational Education Commission) and ONEC (Office of the National Education Commission) govern credentials. Thailand's National Qualifications Framework (NQF) is well-developed. Electronic transactions are governed by Electronic Transactions Act 2001.

**Malaysia:** MQA (Malaysian Qualifications Agency) governs the Malaysian Qualifications Framework (MQF). JPK (Jabatan Pembangunan Kemahiran — Skills Development Department) issues NOSS (National Occupational Skills Standard) based credentials. Strong vocational credential infrastructure.

**Singapore:** SkillsFuture Singapore (SSG) is one of the world's most advanced national credentialing systems. SSG operates MySkillsFuture portal and issues Open Badges aligned credentials. International organisations can register with SSG as Training Partners. This is the highest-value partnership in Southeast Asia — SSG alignment gives credentials purchasing power in the Singaporean economy (direct subsidies for SkillsFuture-aligned training).

### Local group types — eligibility and scope

| Group type | Credential scope | Notes |
|---|---|---|
| Indonesian community forestry groups (HKm, HD, HTR licence holders) | `eco:biodiversity`, `eco:restoration` | APFI (Indonesian Community Forestry Alliance) — 3.5M ha under community management |
| Filipino TESDA-registered learning centres | `learn:practitioner`, `learn:advanced` | TESDA partnership is the fastest path to formal recognition in PH |
| Vietnam environmental monitoring NGOs | `eco:water`, `eco:climate`, `eco:biodiversity` | PanNature, IUCN Vietnam — active monitoring networks |
| Thai youth ecology networks | `eco:biodiversity`, `learn:foundation` | YEC (Youth Ecology Council), RECOFTC (regional forestry training centre) |
| Batik, weaving, and textile artist collectives (Indonesia, Malaysia) | `art:visual`, `art:writing` | UNESCO Intangible Cultural Heritage frameworks create additional recognition pathway |
| Digital arts collectives (Manila, Bangkok, Jakarta, HCMC) | `art:visual`, `art:spatial`, `art:motion` | Large, active communities; no formal structure required at Level 3 |
| Sea-level monitoring community networks (coastal Indonesia, Philippines) | `eco:water`, `eco:climate` | Climate-vulnerable communities; certificates as documentation of lived climate knowledge |
| Indigenous peoples' organisations (Dayak, Moro, Karen, Orang Asli) | `eco:indigenous`, `eco:biodiversity` | AIPP (Asia Indigenous Peoples Pact) is key regional Level 2 partner |

### Interoperability path

**Indonesia:** Align `eco:*` certificates with SKKNI sector 09 (Agriculture) and sector 02 (Forestry). Align `learn:*` with KKNI (Kerangka Kualifikasi Nasional Indonesia) levels 2–4.

**Philippines:** Align `learn:*` with TESDA's PTQF (Philippine TVET Qualifications Framework) levels NC I–III. This is the fastest path to certificates being usable in Philippine employment contexts.

**Singapore:** Register as a SkillsFuture Singapore Training Provider for relevant modules. This is a medium-term goal that requires significant programme documentation but unlocks the most credible interoperability in the region.

### Friction points

- **BNSP licensing (Indonesia):** To issue certificates with BNSP equivalence, we either need BNSP recognition or to partner with a BNSP-recognised LSP. Direct BNSP recognition requires application through KOMINFO and is a 12–18 month process. LSP partnership is faster.
- **Data localisation (Indonesia, Vietnam):** Both countries have data localisation provisions. Credential recipient data for Indonesian and Vietnamese users should be stored on servers with local presence or via a compliant cloud provider with local nodes.
- **Indigenous land conflicts (Borneo, Mindanao):** Any `eco:indigenous` certificate issuance in active land conflict zones requires additional care — certification of ecological knowledge should not inadvertently be used as evidence in land disputes without community consent.

---

## Region 5 — European Union and EEA

### Legal framework for digital credentials

The EU is the most regulated and the most interoperable region simultaneously. Two frameworks are directly relevant:

**eIDAS 2.0 (Regulation EU 2024/1183):** The European Digital Identity framework. Creates the **EUDIW** (EU Digital Identity Wallet) — a national wallet that every EU citizen will hold. Credentials that comply with the **Qualified Electronic Attestations of Attributes (QEAA)** standard under eIDAS 2.0 can be stored in the EUDIW and presented to any EU public or private service. We should target QEAA compliance for our `learn:*` certificates — this is a 2–3 year horizon as EUDIW rolls out.

**Europass Digital Credentials:** The EU's own credential infrastructure, already operational. Europass Digital Credentials Infrastructure (EDCI) issues W3C VC-compliant credentials that are natively compatible with LinkedIn and other platforms. We should **generate Europass-compatible exports** for `learn:*` certificates for EU recipients — this gives them an additional credential artefact recognised by EU member state systems.

**ESDE (European Skills, Competences, Qualifications and Occupations — ESCO):** The EU's multilingual classification of skills, competences, and qualifications. Our certificates should map to ESCO skills taxonomy for eco-modality and tech contribution certificates. ESCO alignment is what makes certificates searchable and matchable in European employment systems.

**EQF (European Qualifications Framework):** 8-level framework for comparing qualifications across EU member states. `learn:foundation` → EQF 2–3; `learn:practitioner` → EQF 4; `learn:advanced` → EQF 5–6; `learn:facilitator` → EQF 6.

**GDPR:** All credential issuance to EU/EEA residents is subject to GDPR. Key obligations:
- Legal basis for processing (legitimate interest for credential issuance; explicit consent for any additional data uses)
- Right to erasure: handled by credential `WITHDRAWN` status — the on-chain record persists (immutable) but the credential is marked withdrawn. Explain this clearly to recipients at issuance.
- Data minimisation: do not embed unnecessary personal data in the SVG or on-chain record
- Cross-border transfer: on-chain data on Algorand/Solana is not EU-resident data; IPFS data has no fixed location — both require analysis. SCD Hub should publish a GDPR data mapping for credential issuance.

### Local group types — eligibility and scope

| Group type | Credential scope | Notes |
|---|---|---|
| Environmental NGOs (IUCN, WWF national offices, local ENGOs) | `eco:*`, `learn:practitioner` | Well-organised; GDPR-capable; strong ESCO alignment vocabulary |
| Vocational training centres (CEDEFOP-registered) | `learn:*` | CEDEFOP (EU VET agency) has a digital credential pilot — partnership opportunity |
| Community arts centres and cooperatives | `art:*` | Creative Europe programme as potential funding context for certification |
| Citizens' science networks (iNaturalist, eBird EU groups) | `eco:biodiversity`, `eco:water` | GBIF (EU data), Copernicus citizen science nodes |
| Climate activism organisations | `contrib:community`, `idea:proposal` | Fridays for Future EU, Extinction Rebellion (structured groups with accountability) |
| Indigenous European communities (Sámi, Romani, Corsican, Welsh language) | `eco:indigenous`, `art:*` | Complex; engage through Northern Periphery and Arctic Programme partners |
| Open-source developer communities | `contrib:code`, `contrib:design` | FSFE, OSI, local LUGs — natural alignment with GPL v3 ethos |

### Interoperability path

Three-stage EU interoperability roadmap:

**Stage 1 (now):** Issue certificates as Open Badges 3.0 + W3C VC 2.0. Generate Europass Digital Credentials export for `learn:*` category certificates issued to EU recipients. Map certificate competencies to ESCO skills taxonomy.

**Stage 2 (12–24 months):** Seek recognition from one or more EU member state national qualifications authorities for `learn:practitioner` and `learn:advanced` certificates in the eco-modality domain. Germany (BMBF), Netherlands (NLQF), and Ireland (NFQ) are the most open to recognition of non-formal learning.

**Stage 3 (24–36 months):** Apply for QEAA compliance under eIDAS 2.0 once the EUDIW infrastructure is operational. This would allow our certificates to be stored in EU citizens' national digital identity wallets — the highest level of recognition achievable in the EU without being a formal educational institution.

### Friction points

- **GDPR right of erasure vs. immutable on-chain record:** This is the sharpest tension. Our answer (WITHDRAWN status, not deletion) must be clearly documented and disclosed at issuance. Pre-emptive EDPB guidance request on this specific question may be worth pursuing via a member state DPA.
- **Qualified trust service provider (QTSP) status:** For eIDAS 2.0 QEAA compliance, we must be a registered QTSP in at least one EU member state. This is a regulatory application process, minimum 12 months. Ireland and Netherlands are most accessible for non-EU-headquartered organisations.

---

## Region 6 — Pacific (SIDS, Australia, New Zealand, Papua New Guinea)

### Legal framework for digital credentials

The **Pacific Qualifications Framework (PQF)**, developed by the Pacific Community (SPC), is a 10-level regional framework covering formal and non-formal learning. SPC has active digital credentialing pilots in several Pacific Island countries.

**Australia and New Zealand** have the most developed credential infrastructure in the region. Australia's AQF (Australian Qualifications Framework) and NZ's NZQCF (New Zealand Qualifications and Credentials Framework) are both well-aligned to Open Badges 3.0. The Tertiary Education Commission (TEC) in NZ and ASQA in Australia recognise non-formal credentials from accredited organisations.

Critically for this region: **Tuvalu Digital Nation** (2023) has created a legal framework for the ongoing digital existence of Tuvalu as the physical nation faces existential sea-level risk. Tuvalu's government is actively seeking international recognition for digital credentials issued to Tuvalu nationals who may be displaced. Our certificate system aligns almost precisely with what the Tuvalu Digital Nation framework is designed to enable.

**PNG:** National Training Council (NTC) governs vocational credentials. Electronic document law is at an early stage. NGO-issued credentials are used practically.

### Local group types — eligibility and scope

| Group type | Credential scope | Notes |
|---|---|---|
| Traditional ecological knowledge holders (Melanesia, Polynesia) | `eco:indigenous`, `eco:biodiversity` | Requires deep engagement with local governance structures — no shortcut |
| Ocean and reef monitoring community networks | `eco:water`, `eco:biodiversity` | SPREP (Pacific Regional Environment Programme) — key Level 2 partner |
| Pacific climate resilience organisations | `eco:climate`, `contrib:community` | 350.org Pacific, Pacific Calling Partnership |
| Tuvalu, Kiribati, Marshall Islands displaced community groups | `news:record`, `eco:indigenous`, `learn:*` | Certificates as climate displacement documentation — highest priority |
| Pacific arts collectives (carving, weaving, tapa, navigation arts) | `art:visual`, `art:writing` | UNESCO ICH linkage; significant cultural preservation value |
| NZ and Australian open-source developer communities | `contrib:code`, `contrib:design` | Linux Australia, NZOSS — natural alignment |
| Community forestry and land restoration groups (PNG, Solomons, Vanuatu) | `eco:restoration`, `eco:biodiversity` | REDD+ community monitoring — potential carbon credit linkage |

### Interoperability path

**PQF alignment** for `learn:*` certificates is the primary goal. SPC has expressed interest in digital credential pilots — a formal pilot partnership with SPC would give our certificates recognition across all 22 Pacific Island countries that participate in the PQF.

**Tuvalu Digital Nation alignment** is a unique opportunity. We should formally engage with the Tuvalu government's digital statehood initiative to have our certificate system recognised as a component of Tuvalu's digital national identity infrastructure. This creates mutual benefit — they get a credentialing layer; we get formal recognition from a sovereign nation.

---

## Cross-regional implementation priorities

### Phase 1 — Establish root and first partners (0–6 months)
- Set up SCD Hub issuer DID (`did:algo:SCDHUB_ROOT`) on Algorand mainnet
- Launch certificate API (issue, verify, revoke endpoints)
- Draft standard Partner Agreement and Community Credentialing Code of Conduct
- Onboard 3–5 Level 2 partners as pilots: one ecological NGO in Kenya, one TVET provider in Costa Rica or Philippines, one open-source organisation in EU, one Pacific regional body
- Issue first real certificates to eco-ops field cohort

### Phase 2 — Regional expansion and interoperability (6–18 months)
- KNQA RPL alignment for East Africa (Kenya portal)
- TESDA partnership for Philippines
- Europass Digital Credentials export for EU recipients
- PQF alignment conversation with SPC
- Tuvalu Digital Nation formal engagement
- ESCO skills mapping for all `eco:*` and `learn:*` certificate categories
- Costa Rica: CA partnership or MICITT application

### Phase 3 — Formal recognition and QEAA (18–36 months)
- EU: QTSP application in one member state for eIDAS 2.0 pathway
- Brazil: ICP-Brasil CA partnership
- Indonesia: BNSP LSP partnership
- Singapore: SSG Training Provider registration
- Multi-language certificate templates: Kiswahili, Amharic, Spanish, Portuguese, Bahasa Indonesia, Bislama, French

---

*SCD Hub · Exotopia.org · GPL v3 · June 2026*  
*Return to [INDEX.md](INDEX.md) · [../INDEX.md](../INDEX.md)*
