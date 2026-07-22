# Privacy Policy — Exotopia

**⚠️ DRAFT — NOT LEGAL ADVICE.** See the same caveat at the top of
`TERMS_OF_SERVICE.md`. Privacy law is the area of highest actual enforcement
risk across the countries you listed — several of them (EU/UK/Netherlands,
Kenya, Mexico, Canada-Quebec) have active regulators that issue real fines.
Don't publish this without a lawyer's pass, and don't collect any data
category this document doesn't disclose.

*Last updated: [DATE]*

---

## 1. Who this policy covers

This Privacy Policy explains how **[LEGAL ENTITY NAME — same gap as in the
Terms of Service, § 1]** ("we," "us") collects, uses, and shares personal
data when you use **Exotopia** (the "Service"), including where a payment or
minting step routes you through our sibling platform **pon.ink**. It applies
to visitors, registered users, wallet-connected users, citizen-science/
eco-ops participants, and blog/community contributors.

## 2. What we collect

| Category | Examples | Source |
|---|---|---|
| Account data | Email, username, hashed password (if applicable) | You, directly |
| Wallet data | Public wallet address on Solana, Algorand, or an EVM network (Polygon/Celo), on-chain transaction history you initiate | Blockchain (public), your wallet provider |
| Payment data | Last 4 digits/card type (Stripe), M-Pesa phone number and transaction reference (M-Pesa) — full card and PIN details are never received by us | You, directly, via our payment processors |
| Usage data | Pages visited, session duration, device/browser type, IP address | Automatically, via [analytics tool] |
| Cookies | Session/functional cookies, analytics cookies (see § 6) | Automatically |
| Citizen-science / eco-ops data | Field observations, geolocation of submitted sites, photos, project status notes | You, directly, when you choose to submit |
| Recorded/staged entries | Audio or written entries you stage locally before submitting (e.g. via the Record widget) | You, directly — stored locally on your device until you choose to submit |
| Community content | Blog comments, community posts, profile info you choose to add | You, directly |
| Communications | Support requests, emails to us | You, directly |

**We do not collect wallet private keys or seed phrases, and never ask for
them.**

### On-chain vs. off-chain data — important distinction
Public wallet addresses and transaction data that you broadcast to a
blockchain are recorded permanently and cannot be deleted, corrected, or
made private by us — this is a property of the blockchain itself, not a
choice we make. **We do not write personal information (name, email,
precise home address) directly into on-chain metadata.** Where a "deed" or
settlement record references you, it references your public wallet address
only; any human-readable profile information you add is stored off-chain in
our database, where it can be corrected or deleted per § 8.

## 3. Why we process your data (legal bases, where applicable)

For users in the EU/EEA, UK, and other jurisdictions that require a stated
legal basis:

- **Contract** — to create your account, process a mint transaction, operate
  the Service you asked for.
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
- **Payment processors**: **Stripe** and **M-Pesa** (via [name your licensed
  Kenyan payment aggregator/PSP partner, if any — see planning notes on why
  M-Pesa integration may require a licensed partner rather than direct
  integration]), each acting as an independent controller for the payment
  data they process under their own privacy policies.
- **Blockchain networks**: transactions you sign are broadcast to a public,
  permissionless network (Solana, Algorand, or an EVM network) — this is
  inherently public and outside our control once broadcast.
- **Research/regulatory partners**: aggregated or de-identified
  citizen-science data may be shared with environmental research
  institutions or regulators, as disclosed at the point of data submission.
- **Legal disclosure**: where required by valid legal process, subject to
  applicable law's requirement that we assess necessity/proportionality
  before disclosing (relevant in GDPR-covered jurisdictions in particular).
- **We do not sell personal data.**

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
On-chain data is retained permanently by the nature of the blockchain (see
§ 2).

## 8. Your rights

Subject to the law that applies to you, you may have the right to:

- Access a copy of your personal data
- Correct inaccurate data
- Delete data we hold off-chain about you ("right to erasure" / "right to be
  forgotten" where applicable — **note this cannot extend to data already
  broadcast to a public blockchain**, which we do not control)
- Object to or restrict certain processing
- Withdraw consent (where processing is based on consent)
- Data portability (receive your data in a structured format)
- Lodge a complaint with your local data protection authority

To exercise these rights, contact **[PRIVACY CONTACT EMAIL]**. We will
respond within the time limit required by the law that applies to you (see
§ 10 for jurisdiction-specific timelines).

## 9. Children's privacy

The Service is not directed at children under **[13]**. Where minors
participate in citizen-science programs through a school or organized group,
we rely on that organization to obtain parental/guardian consent as required
by local law before any minor's data is submitted (see § 5 of the Terms of
Service). If we learn we hold data from a child without appropriate consent,
we will delete it.

## 10. Region-specific notices

### European Union / EEA (incl. Netherlands/Amsterdam) — GDPR
- **Controller**: [LEGAL ENTITY NAME], [ADDRESS].
- **EU representative** (if you are not established in the EU but process EU
  residents' data at scale): [NAME/ADDRESS, required under GDPR Art. 27 —
  see planning notes].
- **Supervisory authority**: you may lodge a complaint with your local
  authority, e.g. the Dutch Autoriteit Persoonsgegevens if you are in the
  Netherlands, or the authority in your EU country of residence.
- **DPIA/DPO**: [state whether you've conducted a Data Protection Impact
  Assessment for citizen-science/geolocation data, and whether a Data
  Protection Officer has been appointed — see planning notes on when this is
  mandatory].
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

### African Union member states generally
- Where your country of residence has a comprehensive data protection law
  (e.g. **Nigeria** — Data Protection Act 2023, enforced by the Nigeria Data
  Protection Commission; **South Africa** — POPIA, enforced by the
  Information Regulator; or similar frameworks in other countries), you have
  the rights that law grants, in addition to those listed in § 8.
- Because legal frameworks vary significantly across the continent and are
  evolving rapidly, contact **[PRIVACY CONTACT EMAIL]** for country-specific
  questions — we will confirm what applies to your country of residence.

## 11. Changes to this policy

We will notify you of material changes via [the Service / email] before they
take effect.

## 12. Contact

**[PRIVACY CONTACT EMAIL — same recommendation as Terms of Service § 14]**
— for all data protection questions and rights requests.
