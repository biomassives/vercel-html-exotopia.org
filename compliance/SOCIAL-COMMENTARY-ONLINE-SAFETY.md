# SOCIAL-COMMENTARY-ONLINE-SAFETY.md

### Blog Commentary System — Online Safety Law Risk Assessment & Design Strategy

*SCD Hub · Exotopia.org · GPL v3 · Living Document — June 2026*  
*This document is analysis for internal planning. It is not legal advice. Consult qualified counsel in each jurisdiction before deploying the social commentary feature to users in that region.*

---

## §0. What This Document Covers

We have built a blog commentary system (`BlogComments.vue`, `useComments.ts`, `connections` table) that allows registered members to exchange comments on blog posts, visible only to members who have mutually green-lit each other. This document assesses how that system is classified under major online safety and platform regulation frameworks, what obligations it may create, and what design choices reduce exposure.

The system is also intended to be deployable by independent operators who fork the Exotopia codebase — they become platform operators in their own right, with their own compliance obligations. This is addressed in §7.

**Our fundamental position:** mutual-consent small-group private communications should be treated no differently in law than a group chat or a private forum. The risk is that several jurisdictions are moving toward regulatory frameworks that do not preserve this distinction.

---

## §1. What We Built — Legal Description

Before applying any law, we need to describe the system precisely as a regulator would see it.

**The system:**
- Users create accounts (email magic link, no password)
- Users create a profile with a public handle and display name
- Two users must mutually "green-light" each other before either can see the other's comments
- Comments are attached to specific blog posts
- Comments are visible only to the author and members who have an accepted mutual connection with the author
- There is no public feed, no algorithmic amplification, no recommendation engine
- There is no discovery mechanism (you cannot find other users by browsing)
- The current system has no age verification
- There is no moderation layer (no automated content scanning, no AI audit of message content)

**How regulators are likely to classify this:**
- In broad definitions: a "user-to-user service" or "social media service"
- In narrow definitions: closer to a private messaging tool or closed forum
- The distinction matters enormously — broad definitions trigger duty-of-care frameworks; narrow ones may not

---

## §2. Australia — Online Safety Act 2021

### Classification risk: HIGH if deployed to Australian users

Australia's Online Safety Act 2021 (the Act) is one of the most expansive online safety frameworks in the world. The eSafety Commissioner has broad powers and an expansive definition of regulated services.

**Key definitions that may apply:**

*Social media service* (s.13): a "social media service" is any internet service where:
(a) the end-user can post material on the service, AND
(b) the posting of that material may result in the material being accessible to, or delivered to, one or more other end-users of the service

Our system meets both criteria. A posted comment is potentially viewable by all green-lit members of the author.

*Basic Online Safety Expectations (BOSE):* The BOSE instrument (registered 23 January 2022) imposes expectations on providers of social media services, relevant electronic services, and designated internet services. The eSafety Commissioner can require compliance reporting and investigate non-compliant providers.

**Key BOSE expectations that conflict with our design choices:**

| Expectation | Our status | Risk |
|---|---|---|
| Take reasonable steps to prevent end-users from being exposed to Class 1 material (CSAM, terrorism content) | No content scanning | High — we cannot claim compliance |
| Take reasonable steps to minimise cyberbullying material | No moderation | High |
| Have a complaints mechanism | Not built | Medium |
| Report CSAM to eSafety Commissioner when detected | Cannot detect | High |
| Annual transparency reporting | Not planned | Medium |

**The no-scanning position:**
Australia's BOSE explicitly expects platforms to detect Class 1 material. Our design decision to prohibit AI audit of communications is directly at odds with this expectation. The eSafety Commissioner has issued enforcement notices to platforms that declined to implement content scanning.

**Exposure:** If Australian users use the system, we are almost certainly classified as a social media service under the Act. Non-compliance with BOSE is subject to civil penalties. The eSafety Commissioner cannot directly fine offshore operators but can issue formal notices, publish non-compliance findings, and require ISP-level blocking.

**Mitigation options (choose one):**
1. Geo-block Australian users from the commentary feature (technically simple, practically evasive)
2. Implement mandatory CSAM detection (PhotoDNA or equivalent) — this conflicts with our stated no-AI-audit principle for text but is legally distinct from scanning general message content; CSAM hashing is hash-matching, not AI reading
3. Seek formal guidance from eSafety Commissioner as a small operator with a privacy-by-design rationale

---

## §3. United Kingdom — Online Safety Act 2023

### Classification risk: HIGH if deployed to UK users

The UK Online Safety Act 2023 (UKOSA) received Royal Assent in October 2023. Ofcom is the regulator. Implementation is staged through 2025–2026.

**Classification:**

*User-to-user service* (s.3): any service by which:
(a) content is generated, uploaded, or shared by a user, and
(b) the content (or any part of it) is capable of being encountered by another user

Our system is a user-to-user service. There is no "private messaging" carve-out in the UKOSA broad definition — the distinction between private and public only affects the *category* of safety duty, not whether duties apply at all.

*Category 1 / Category 2A / Category 2B:* The highest duty services (Category 1) are designated by threshold. At our current scale we would not be Category 1. Smaller services have lighter duties but are not exempt.

**Illegal content duty (applies to all user-to-user services):**
- Providers must take proportionate steps to minimise the presence of *priority illegal content* (which includes CSAM, terrorism content, fraud, harassment)
- "Proportionate" allows small providers to argue lower capability → lighter implementation
- But the duty is not zero

**Children's safety duty:**
- Applies to services "likely to be accessed by children"
- Our system has no age gate; anyone with an email address can sign up
- A regulator would likely classify us as likely to be accessed by children
- The duty requires: risk assessment, age verification or robust age assurance, content restrictions for under-18 users, protection from harmful algorithmic recommendation (we have none — that's good)

**End-to-end encryption controversy:**
UKOSA's original s.122 (the "spy clause") would have required providers of end-to-end encrypted messaging to implement client-side scanning if directed by Ofcom. Under intense pressure from WhatsApp, Signal, Apple, and civil society, the government stated in September 2023 that this power would only be used when technically feasible and after independent review. The clause was not removed, only softened in application.

Our system does not use end-to-end encryption (comments are stored in plaintext in Supabase). This means we are not protected by any encryption carve-out, but also not subject to the client-side scanning debate — we could technically comply with a disclosure order if served one.

**Exposure:** UK users trigger user-to-user service duties. At small scale, Ofcom's enforcement approach is likely light-touch, but the legal obligations exist. The lack of age verification is the most acute risk — if a child encounters harmful content via our system, the "duty of care" framework creates liability.

**Mitigation options:**
1. Age self-declaration (low-assurance but shows good faith)
2. UKOSA-compliant risk assessment document (required regardless of scale — this document is a partial start)
3. Complaints and reporting mechanism
4. Clear terms of service prohibiting illegal content

---

## §4. United States — KOSA (Kids Online Safety Act)

### Classification risk: MEDIUM-HIGH (federal, pending; state-level laws are active now)

**Current status (as of June 2026):**
KOSA (Kids Online Safety Act, S.1409 in the 118th Congress) passed the Senate 91–3 in July 2024. The House version has not yet passed as of the date of this document. This section assesses exposure under the Senate-passed version and likely House versions. SCD Hub is actively opposing KOSA through lobbying efforts targeting our Colorado House delegation — see §9 for the policy context.

**What KOSA would require:**

*Covered platforms:* An online platform that is "designed and marketed for minors" or has "actual knowledge" that minors use the service, and provides features including "comments, reactions, and interactive functionality."

Our commentary system provides comments and reactions. Unless we explicitly age-restrict to 18+ and enforce it, a regulator could find that we have "actual knowledge" that minors use the service. The "designed and marketed for minors" language is narrower — we are not, but the "actual knowledge" track can be reached through general sign-up without age verification.

*Duty of care obligations (under Senate version):*
- Prevent and mitigate harm to minors from: cyberbullying, eating disorders content, self-harm content, substance abuse content, sexual exploitation
- Default-to-safe settings for minors
- Allow parental controls and oversight tools
- Annual independent audit of safety features
- Annual report to Congress (for large platforms; smaller platforms have lighter versions)

*The "design features" restrictions:*
KOSA's most contentious provision: prohibiting "addictive product features" for minors. This includes algorithmic recommendation systems, push notifications during certain hours, infinite scroll. We have none of these — this provision does not create new obligations for our system as designed.

*The FTC enforcement track:*
KOSA would be enforced by the FTC (and state AGs). The FTC's track record on small platform enforcement is lighter than for large companies, but state AGs (particularly those in states with parallel laws) are more active at smaller scale.

**State-level laws already active:**
- *Utah:* Social Media Regulation Act (SB152, 2023) — parental consent required for minors on social media; applies to services with > 5M US users (likely not us)
- *Arkansas:* SAFE Act (2023) — age verification for social media; > 500K monthly US users threshold
- *California:* AADC (Age-Appropriate Design Code, AB2273, 2022) — most aggressive; applies to online services "likely to be accessed by children," requires privacy impact assessment, prohibits profiling minors, requires default-off geolocation

California's AADC has no user-count threshold. If we have California users and the system is "likely to be accessed by children," the AADC applies. A federal court initially enjoined it (NetChoice v. Bonta) but litigation continues; the provision on profiling minors is likely to survive.

**The "no AI audit" question under US law:**
KOSA does not currently require AI scanning of private communications. What it requires is platform-level mitigation of *identified* harms. The tension: if KOSA requires "preventing" certain content, platforms may argue they can only do so through automated scanning. We would argue the mutual-consent small-group model structurally prevents the amplification that creates harm at scale. This argument has not been tested.

---

## §5. European Union — Digital Services Act

### Classification risk: LOW at current scale; medium if scale grows

**Current status:**
The DSA (Regulation (EU) 2022/2065) applies to all "online platforms" that allow users to share content. The definition is broad enough to cover our system.

**Threshold-based obligations:**

| Platform size | Category | Key obligations |
|---|---|---|
| < 45M EU monthly users | Smaller platform | Basic obligations only: T&C, content reporting, transparency |
| > 45M EU monthly users | Very Large Online Platform (VLOP) | Full DSA including algorithmic audits, researcher data access, crisis protocols |

We will not reach 45M EU users. Our obligations are the basic tier:
- Publish transparent terms of service
- Provide a means for users to flag illegal content
- Cooperate with law enforcement on serious criminal content (CSAM, terrorism)
- Annual transparency report (simplified for small platforms)

The DSA does not require AI scanning of private communications. It focuses on content that is publicly accessible or algorithmically amplified — neither of which applies to our mutual-consent model.

**The GDPR overlay:**
Our system processes personal data (email, handle, display name, comment content). GDPR requires:
- Lawful basis for processing (legitimate interest + consent for optional features)
- Right to erasure (users must be able to delete their account and comments)
- Data minimisation (we collect only what's needed — good)
- Privacy by design (our green-light architecture supports this claim)
- DPA agreements with Supabase (Supabase is GDPR-compliant; DPA is available in their dashboard)

---

## §6. The No-AI-Audit Position — Legal Risk Assessment

Our stated design principle: AI audit of member communications is not permitted. This is articulated as a privacy protection and a protection against surveillance of vulnerable communities (field workers, indigenous communities, dissidents in authoritarian contexts).

**This position creates legal risk in the following scenarios:**

1. **Detection of CSAM:** Every jurisdiction requires providers to detect and report CSAM. Our no-AI-audit principle cannot extend to CSAM hash-matching (PhotoDNA or equivalent) — this is not "reading" communications in any meaningful sense; it is comparing file hashes against a known illegal content database. We must implement NCMEC/IWF hash-matching for image uploads if we allow image uploads in comments.

2. **Law enforcement access:** If we receive a valid legal order (subpoena, production order, UK PN) for communications of a specific user, we are likely required to comply regardless of our privacy principles. Our architecture should be designed so that we can comply with targeted lawful orders while being unable to conduct mass surveillance.

3. **Australia and UK safety duties:** As noted in §2 and §3, these jurisdictions' safety duties may require automated detection of illegal content. Our "proportionate" response as a small operator is to implement the minimum technically feasible — CSAM hash-matching — and document our reasoning for not implementing broader content AI scanning.

**The distinction we are making:**
- **CSAM hash-matching:** Not AI reading of communications. Required. We will implement it if image uploads are supported.
- **AI analysis of text for "harmful" content:** Prohibited by our architecture. Legally risky in Australia/UK but defensible as proportionate for a small, mutual-consent system.
- **Bulk surveillance / mass data export to governments:** Prohibited. We store minimal data and cannot produce what we don't have.

---

## §7. Instance Operators — Open Source Deployment Liability

The Exotopia codebase is GPL v3 and is designed to be forkable and self-hostable. Any operator who deploys an instance of the social commentary system becomes a **platform operator** in their own right and inherits all the platform obligations described in this document for their jurisdiction.

**What SCD Hub does NOT do for instance operators:**
- We do not provide legal coverage, insurance, or indemnification for third-party deployments
- We do not operate CSAM detection infrastructure for third-party instances
- We do not operate a complaint handling system for third-party instances
- We do not maintain shared moderation resources

**What we do provide:**
- This compliance documentation (educational, not legal advice)
- The architecture's privacy-by-design features (green-light system, data minimisation)
- CSAM detection hooks in the codebase that operators can connect to PhotoDNA or NCMEC's API

**Recommendations for instance operators:**
Instance operators in any jurisdiction that has online safety obligations should:
1. Read this document and the regulations cited in it
2. Conduct a jurisdiction-specific legal assessment before deploying to users
3. Implement CSAM detection for any image upload functionality
4. Publish a privacy policy and terms of service appropriate for their jurisdiction
5. Register with relevant regulatory bodies if required (e.g., Ofcom notification in the UK)

**GPL liability note:** The GPL v3 license does not create liability for SCD Hub for harms arising from deployments of the code by third parties. The software is provided "as is" with no warranty. Instance operators are independently responsible for their legal compliance.

---

## §8. Our Design Choices as Compliance Strategy

Summarising how the green-light mutual consent architecture creates structural compliance advantages:

| Design choice | Compliance benefit |
|---|---|
| Mutual consent required before visibility | Reduces amplification risk; closer to private messaging than public social media |
| No discovery / no public user directory | Reduces minor exposure; no browsing of stranger profiles |
| No algorithmic feed or recommendation | Eliminates the most politically contested feature in all online safety frameworks |
| No push notifications | Eliminates KOSA's "addictive features" concern |
| Data minimisation (email, handle, comments only) | Limits what can be produced under lawful orders; limits GDPR risk |
| Comments only visible to green-lit members | Cannot create "viral" spread of harmful content |
| Handle-based pseudonymity | Does not require real-name registration; respects user privacy |
| No AI audit of content | Strongest privacy protection; creates compliance risk in AU/UK for illegal content |

**The honest tension:**
Our design protects user privacy. It also makes automated illegal content detection impossible. These two goals are in genuine tension. Our resolution: implement hash-based CSAM detection (not AI reading) for image content; accept the legal risk of not implementing broader text surveillance; document our reasoning clearly.

---

## §9. Policy Context — SCD Hub Lobbying Effort

SCD Hub is a Colorado-incorporated organisation. Our congressional delegation includes Rep. Joe Neguse (D-CO-02, Boulder/Fort Collins/Longmont area), who sits on the House Judiciary Committee. The House Judiciary Committee has jurisdiction over internet law through its subcommittee on Courts, Intellectual Property, and the Internet.

**Our lobbying position on KOSA:**
We oppose KOSA in its current form not because child safety online is not a legitimate goal — it is, and urgently so — but because KOSA's mechanism (duty of care + platform liability for harmful content + implicit pressure toward surveillance) creates incentives that harm the open web without solving the root problem.

**What we support instead:**
- *Privacy-first regulation:* laws that mandate data minimisation, prohibit commercial surveillance of minors, and require genuine privacy-by-design — these address the source of harm (commercial exploitation of behavioral data) rather than the symptom (harmful content reaching children)
- *The COPPA 2.0 approach:* strengthening and modernising existing FTC-enforced children's privacy law, with meaningful enforcement teeth, rather than creating a new duty-of-care framework with uncertain scope
- *Safe design standards:* prescriptive design prohibitions (no algorithmic amplification for minors, no surveillance-based advertising for minors, default-safe settings) rather than vague "duty of care" that creates liability pressure toward surveillance
- *Section 230 preservation for private platforms:* the current KOSA versions create Section 230 liability exceptions; this incentivises over-removal and scanning rather than thoughtful content moderation

**Actions taken / planned:**
- [ ] Formal letter to Rep. Neguse's office from SCD Hub executive team
- [ ] Coalition letter with other Colorado tech community organisations
- [ ] Public comment submission if KOSA proceeds to House markup
- [ ] Participation in EFF / CDT / ACLU coalition submissions

---

## §10. Open Questions and Action Items

| # | Item | Priority | Owner |
|---|---|---|---|
| 10.1 | Implement CSAM hash-matching (NCMEC PhotoDNA API or IWF hash list) for any image upload functionality | HIGH before image uploads are enabled | Engineering |
| 10.2 | Draft privacy policy and terms of service covering the commentary system | HIGH | Legal / Comms |
| 10.3 | Age self-declaration on sign-up (checkbox: "I confirm I am 18 or over") | MEDIUM | Engineering |
| 10.4 | Build content reporting mechanism (flag a comment → email to admin) | MEDIUM | Engineering |
| 10.5 | Geo-restrict commentary feature from AU if we cannot resource AU compliance | MEDIUM | Engineering |
| 10.6 | Register with Ofcom as a user-to-user service (UK) | LOW (currently) | Legal |
| 10.7 | Execute Supabase DPA (Data Processing Agreement) | HIGH | Legal |
| 10.8 | Draft instance operator compliance guide | MEDIUM | Comms/Legal |

---

*Related: [POLYNOMICS-CONTRIBUTION.md](POLYNOMICS-CONTRIBUTION.md) · [RESEARCH_PROMPT.md](RESEARCH_PROMPT.md) · [digital-credentials-law/REGIONAL-PLAN.md](digital-credentials-law/REGIONAL-PLAN.md)*  
*SCD Hub · Exotopia.org · GPL v3 · June 2026*
