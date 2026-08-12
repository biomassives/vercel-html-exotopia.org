# Privacy Policy — Exotopia

**⚠️ DRAFT — NOT LEGAL ADVICE.** See the same caveat at the top of
`legal-terms.md`. Privacy law is the area of highest actual enforcement
risk across the countries you listed — several of them (EU/UK/Netherlands,
Kenya, Mexico, Canada-Quebec) have active regulators that issue real fines.
Don't publish this without a lawyer's pass, and don't collect any data
category this document doesn't disclose.

*Last updated: [DATE]*

---

## 1. Who this policy covers

This Privacy Policy explains how **Sustainable Community Development Hub**
("SCD Hub," "we," "us") — a Colorado nonprofit corporation, tax-exempt under
IRC § 501(c)(3), and the entity that operates **Exotopia** as a project —
collects, uses, and shares personal data when you use Exotopia (the
"Service"), including where a payment step routes you through our sibling
platform **pon.ink**. It applies to visitors, registered users,
citizen-science/eco-ops participants, donors, and blog/community
contributors.

## 2. What we collect

| Category | Examples | Source |
|---|---|---|
| Account data | Email, username, hashed password (if applicable) | You, directly |
| Settlement/pinning data | Settlement address, title/description you choose to pin, IPFS content identifier (CID) of pinned content | You, directly; the pinning service you use |
| Payment data | Last 4 digits/card type (Stripe), M-Pesa phone number and transaction reference (M-Pesa) — full card and PIN details are never received by us | You, directly, via our payment processors |
| Usage data | Pages visited, session duration, device/browser type, IP address | Automatically, via [analytics tool] |
| Cookies | Session/functional cookies, analytics cookies (see § 6) | Automatically |
| Citizen-science / eco-ops data | Field observations, geolocation of submitted sites, photos, project status notes | You, directly, when you choose to submit |
| Recorded/staged entries | Audio or written entries you stage locally before submitting (e.g. via the Record widget) | You, directly — stored locally on your device until you choose to submit |
| Community content | Blog comments, community posts, profile info you choose to add. Comments are visible only to mutual, green-lit connections (max. seven per thread) — not to the general public or, outside a valid legal request or a recipient-initiated report (see § 4), to us | You, directly |
| Third-party details you submit | A Knowledge Keeper's name and any consent/context notes when you submit their wisdom to the Knowledge Keepers library; a landowner's, site contact's, or co-owner's name/details you optionally add to a community node listing or an ecology field site's access notes | You, directly — about someone else, not the third party themselves; see note below |
| Communications | Support requests, emails to us | You, directly |

### A note on location and presence

The "geolocation of submitted sites" row above is data **you** choose to submit about a
place (e.g. a PFAS/citizen-science field site) — it is never your own live device
location, and we do not use it, or any other signal, to show your position or movement to
other members. Presence indicators elsewhere in the product (e.g. a gallery headcount) are
aggregate counts only — never a per-user location or identity. See
`SPEC_DEFENDERNAV.md` § 1.6 and `legal-community-guidelines.md` § 3.

### Pinned vs. account data — important distinction
If you choose to pin a settlement's content to IPFS (see § 4 of the Terms of
Service), that content is held by whichever pinning service you use — us, a
third-party service, or your own node — for as long as it stays pinned. It
is content-addressed (identified by a hash of its content, the CID) rather
than tied to your account, and unpinning it removes it from that service.
**We do not write personal information (name, email, precise home address)
into pinned settlement content** beyond what you choose to enter into the
title/description fields yourself; anything else you add to your profile is
stored in our database, where it can be corrected or deleted per § 8.

### A note on data about someone other than you

A few features let you submit information that names or describes a **third
party** — someone who isn't the one using our Service and hasn't consented to
us directly:

- **Knowledge Keeper records**: if you submit an Elder's or Knowledge
  Keeper's wisdom to the library, the record includes their name and, where
  you provide it, a note about the consent/context under which they shared
  it. That consent is between you and them — we rely on your attestation
  that it was given; we do not independently verify it. These records are
  held back from public view until reviewed.
- **Community node contact details**: if you list a business or creative
  page, the optional contact field may include a third party's name or
  contact information (e.g. a co-owner or site manager) rather than only
  your own.
- **Ecology field site notes**: if you submit a field site, the optional
  access/contact note may name a landowner or site contact who isn't a
  Service user.

If you are the third party named in one of these records — not the person
who submitted it — and want it corrected or removed, contact us (§ 12); we
don't require you to have an account with us to make that request.

## 3. Why we process your data (legal bases, where applicable)

For users in the EU/EEA, UK, and other jurisdictions that require a stated
legal basis:

- **Contract** — to create your account and operate the Service you asked
  for.
- **Consent** — for optional citizen-science data submission, marketing
  communications, and non-essential cookies. You can withdraw consent at any
  time without affecting past processing.
- **Legitimate interests** — for security, fraud prevention, and basic
  product analytics, balanced against your rights (you can object — see § 8).
- **Legal obligation** — where we must retain or disclose data to comply with
  law (e.g. responding to a lawful regulator request).

## 4. Who we share data with

- **Infrastructure/processors**: **Supabase** (database, auth, and blog
  comment infrastructure) and **[CONFIRM: Supabase project region — check
  your Supabase project dashboard; this determines your actual answer to
  § 5 below]**, acting as data processors under contract, not independent
  users of your data.
- **Payment processors**: **Stripe** and **M-Pesa** (via **[name your licensed
  Kenyan payment aggregator/PSP partner, if any — CBK regulates Safaricom's
  M-Pesa directly (see `compliance/INDEX.md` § East Africa/Kenya); confirm
  whether pon.ink integrates through a licensed aggregator or needs one
  before this ships]**), each acting as an independent controller for the
  payment data they process under their own privacy policies.
- **IPFS pinning services**: if you choose to pin settlement content (e.g.
  via Pinata), the content you submit is sent to that service and becomes
  publicly retrievable by its CID on the IPFS network — this is inherent to
  how content-addressed storage works, not a choice we make on your behalf.
- **Research/regulatory partners**: aggregated or de-identified
  citizen-science data may be shared with environmental research
  institutions or regulators, as disclosed at the point of data submission.
- **Legal disclosure**: where required by valid legal process, subject to
  applicable law's requirement that we assess necessity/proportionality
  before disclosing (relevant in GDPR-covered jurisdictions in particular).
- **We do not sell personal data.**

### Private comments — what "private" actually means here
The Service's member-to-member comment feature is built around small,
mutual-consent groups rather than public or broadly-monitored comments — we
do not run automated content scanning or keyword monitoring on it. That
design choice means we need to be precise about what it does and doesn't
give you:

- Only accounts you've mutually connected with can see a comment you post
  (capped at seven connections per thread); it is not visible to the general
  public, to other members outside that connection, or to us as a matter of
  routine.
- **Report path**: if you receive a comment that concerns you, you can report
  it — this is recipient-initiated only; we do not passively scan messages
  looking for problems. A report gives our moderators access to the reported
  content for review.
- **Lawful requests**: we do not build or operate proactive surveillance
  tooling for this feature, but we do respond to valid legal process (e.g. a
  court order) to the extent required by law. Our internal policy for
  evaluating such requests — including what we push back on — is documented
  in `LEGAL_REQUEST_POLICY.md` (available on request from **[PRIVACY CONTACT
  EMAIL]** ahead of a public-facing summary being published here).
- Composing a comment (as opposed to reading ones shared with you) is limited
  to accounts that self-attest as 18 or older during onboarding — see § 9.

## 5. International data transfers

Our infrastructure may store or process data in **[COUNTRY/COUNTRIES, e.g.
"the United States and the European Union"]**. Where we transfer personal
data out of the EU/EEA, UK, or another jurisdiction with transfer
restrictions, we rely on **[Standard Contractual Clauses / an adequacy
decision / other named mechanism — fill in once your actual hosting
footprint is confirmed]**.

## 6. Cookies and tracking

We use [strictly necessary / analytics / preference] cookies. Where required
by law (notably the EU/UK ePrivacy rules and equivalent regimes), we request
consent before setting non-essential cookies via a consent banner, and you
can change your preference at any time at `[URL/settings link]`.

## 7. Data retention

We retain account data for as long as your account is active, plus
**[X months/years]** after closure for legal/accounting purposes. Citizen
science field submissions may be retained indefinitely in aggregated/
de-identified form for research continuity, as disclosed at submission.
Pinned settlement content persists for as long as it stays pinned by you,
by a pinning service, or by us — see § 2.

## 8. Your rights

Subject to the law that applies to you, you may have the right to:

- Access a copy of your personal data
- Correct inaccurate data
- Delete data we hold about you ("right to erasure" / "right to be
  forgotten" where applicable — this includes unpinning settlement content
  pinned through a service we operate; content pinned by you or a
  third-party service is outside our control to unpin, but is also outside
  our custody in the first place)
- Object to or restrict certain processing
- Withdraw consent (where processing is based on consent)
- Data portability (receive your data in a structured format)
- Lodge a complaint with your local data protection authority

You can exercise the access (export) and cancellation (account deletion)
rights yourself at `/account`, no email required — export downloads a JSON
file of everything tied to your account immediately; a deletion request is
logged with a timestamp and processed by a team member, since actually
deleting an account needs elevated access we don't expose to your browser.
For correction, objection, or anything `/account` doesn't yet cover, contact
**ecocommunity@protonmail.com**. We will respond within the time limit required
by the law that applies to you (see § 10 for jurisdiction-specific
timelines) — for a self-service deletion request, that's the same day it's
processed, not the statutory maximum.

## 9. Children's privacy

The Service is not directed at children under **[13]**. Where minors
participate in citizen-science programs through a school or organized group,
we rely on that organization to obtain parental/guardian consent as required
by local law before any minor's data is submitted (see § 5 of the Terms of
Service). If we learn we hold data from a child without appropriate consent,
we will delete it.

## 10. Region-specific notices

### United States
- SCD Hub is based in Colorado; Colorado residents have rights under the
  **Colorado Privacy Act (CPA)** — including access, correction, deletion,
  data portability, and the right to opt out of targeted advertising, the
  sale of personal data, and profiling — enforceable by the Colorado
  Attorney General. You can exercise these at `/account` (see § 8) or by
  contacting us (§ 12).
- **Children's privacy** is governed by COPPA — see § 9.
- We do not sell personal data (see § 4), which limits the practical scope
  of several state privacy laws' sale-specific provisions, but the access/
  deletion rights above still apply.

### European Union / EEA (incl. Netherlands/Amsterdam) — GDPR
- **Controller**: Sustainable Community Development Hub, **350 East St. #911, Nederland, CO 80466, USA**.
- **EU representative** (if you are not established in the EU but process EU
  residents' data at scale): **[NAME/ADDRESS — required under GDPR Art. 27;
  not yet appointed/researched]**.
- **Supervisory authority**: you may lodge a complaint with your local
  authority, e.g. the Dutch Autoriteit Persoonsgegevens if you are in the
  Netherlands, or the authority in your EU country of residence.
- **DPIA/DPO**: **[state whether you've conducted a Data Protection Impact
  Assessment for citizen-science/geolocation data, and whether a Data
  Protection Officer has been appointed — GDPR Art. 35/37 set the thresholds
  for when each is mandatory; not yet assessed against our actual processing
  volume]**.
- We aim to respond to rights requests within **one month** (extendable by
  two further months for complex requests), per GDPR Art. 12(3).

### United Kingdom — UK GDPR / Data Protection Act 2018
- Same rights as above, enforced by the **Information Commissioner's Office
  (ICO)**.
- **UK representative** (if applicable, separate from any EU representative):
  [NAME/ADDRESS].

### Kenya — Data Protection Act, 2019
- Supervisory authority: **Office of the Data Protection Commissioner
  (ODPC)**.
- If we meet the Act's registration threshold as a data controller/processor,
  our registration number is: **[NUMBER, once registered]**.
- Cross-border transfer of Kenyan residents' data requires either an
  adequacy finding, appropriate safeguards, or your explicit consent —
  see § 5.

### Mexico — LFPDPPP
- This policy serves as our *Aviso de Privacidad Integral*. A Spanish
  version is available at `[URL]`.
- You may exercise ARCO rights (Acceso, Rectificación, Cancelación,
  Oposición) via the contact in § 8.
- Supervisory authority: **[INAI's successor body / current designated
  authority — confirm current status, this changed in 2024–2025]**.

### Costa Rica — Law No. 8968
- Supervisory authority: **PRODHAB (Agencia de Protección de Datos de los
  Habitantes)**.
- If our processing meets the Law's database-registration threshold, our
  registration with PRODHAB is: **[REGISTRATION NUMBER, once registered]**.

### Ecuador — LOPDP (2021)
- Supervisory authority: **Superintendencia de Protección de Datos
  Personales**.
- You may exercise ARCO rights via the contact in § 8.

### Canada — PIPEDA and Quebec Law 25
- Supervisory authority: **Office of the Privacy Commissioner of Canada**
  (federal); **Commission d'accès à l'information** for Quebec residents.
- Quebec residents: we conduct a Privacy Impact Assessment before any
  project involving new personal-information processing, as required by
  Law 25, and disclose automated decision-making that produces legal or
  similarly significant effects, if any.

### Zimbabwe — Cyber and Data Protection Act [Chapter 12:07] (CDPA)
- Supervisory authority: **POTRAZ (Postal and Telecommunications Regulatory
  Authority of Zimbabwe)**.
- If our processing of Zimbabwean residents' data meets SI 155's
  data-controller licensing threshold, our registration with POTRAZ is:
  **[REGISTRATION NUMBER, once registered]** — see
  `compliance/INDEX.md` § Zimbabwe for the underlying analysis, which
  currently distinguishes the main account-based Service (in scope) from a
  static, no-account eco-library deployment (out of scope by design).
- Any data compromise affecting Zimbabwean residents' data is reportable to
  POTRAZ within **24 hours** of discovery.
- Cross-border transfer of Zimbabwean residents' data (e.g. to our
  US-hosted Supabase project) requires notice to POTRAZ and confirmation
  that the receiving country meets Zimbabwe's data-privacy adequacy
  standard under CDPA § 25 — **not yet assessed**.
- Processing data from a participant under 18 requires verifiable, explicit
  consent from a parent or legal guardian — relevant to school- or
  youth-group-based eco-ops participation specifically; see § 9.

### African Union member states generally
- Where your country of residence has a comprehensive data protection law
  (e.g. **Nigeria** — Data Protection Act 2023, enforced by the Nigeria Data
  Protection Commission; **South Africa** — POPIA, enforced by the
  Information Regulator; or similar frameworks in other countries), you have
  the rights that law grants, in addition to those listed in § 8.
- Because legal frameworks vary significantly across the continent and are
  evolving rapidly, contact **ecocommunity@protonmail.com** for country-specific
  questions — we will confirm what applies to your country of residence.

## 11. Changes to this policy

We will notify you of material changes via [the Service / email] before they
take effect.

## 12. Contact

**ecocommunity@protonmail.com**
— for all data protection questions and rights requests.

## 13. Changelog

Material changes to this policy are logged with a date on the
[Privacy changelog page](/privacy/changelog) — see § 11.
