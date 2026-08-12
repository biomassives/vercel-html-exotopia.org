# Zimbabwe — Compliance Overview

**Jurisdiction:** Zimbabwe
**Last reviewed:** 2026-08-07
**Reviewed by:** SCD Hub technical/policy team — **internal draft, synthesized
from existing repo analysis; not yet reviewed by Zimbabwean counsel.** Nothing
in this document is legal advice. See the caveat at the top of
`legal-terms.md` and `legal-privacy.md`.
**Sources cited:** Cyber and Data Protection Act [Chapter 12:07] (the "CDPA");
its implementing licensing regulation, referred to elsewhere in this repo as
"SI 155"; POTRAZ (Postal and Telecommunications Regulatory Authority of
Zimbabwe) as the currently-designated supervisory authority. **We have not
independently re-verified the SI number or POTRAZ's current designation
against the Zimbabwean government gazette for this memo** — that citation was
already in use in `legal-terms.md`, `legal-privacy.md`, and
`compliance/INDEX.md` before this document existed, and this memo carries it
forward rather than re-deriving it. Confirming the exact statutory instrument
number and current authority designation with Zimbabwean counsel is listed as
an open question below.

---

## Note on scope — this is not an NFT/securities analysis

`RESEARCH_PROMPT.md`'s deliverable template was written when the product
issued on-chain settlement addresses as NFTs, and its "Classification"
question is a securities/virtual-currency test for that model. **Blockchain
minting was removed from the product on 2026-08-01** (see the `legal-terms.md`
changelog) and replaced with optional IPFS pinning that confers no real-world
property right (`legal-terms.md` § 4). Zimbabwe was never assessed under the
old NFT framing in `compliance/INDEX.md`, so there is no prior analysis to
reconcile — this memo classifies the current product only: an account-based
service (Supabase-backed) plus optional content-addressed pinning, not a
digital-asset issuer.

## Classification

The relevant question for Zimbabwe is not securities classification but
**data-controller status**: does operating Exotopia for Zimbabwean users make
SCD Hub a "data controller" under the CDPA, triggering SI 155's licensing
requirement?

- **Main platform (accounts, settlement/pinning records, citizen-science
  submissions):** Yes, on the same basis as any other jurisdiction with a
  comprehensive data protection law — the service collects email addresses
  and, for participating users, citizen-science field data (`legal-privacy.md`
  § 2). Nothing about Zimbabwe changes that analysis; it is an ordinary
  data-controller relationship, not a special case created by blockchain
  involvement (there is none post-2026-08-01).
- **Settlement/pinning records:** Per `legal-terms.md` § 4, these are
  locally-computed address records, optionally pinned to IPFS. They confer no
  real-world property right and are explicitly not represented as an
  investment. No Zimbabwe-specific property or securities question arises
  from this feature.
- **Static, no-account eco-library node:** `compliance/INDEX.md` § Zimbabwe
  already identifies this as the strongest candidate for falling outside SI
  155's licensing trigger entirely, since it has no backend and collects no
  personal data. That conclusion is carried forward here, not re-derived —
  see the open question below on whether it survives contact with device-level
  analytics.

## Consumer protection

No Zimbabwe-specific consumer protection statute has been researched for this
product. The general commitments in `compliance/INDEX.md`'s "Consumer
protection across all jurisdictions" section apply equally here: clear fee
disclosure before purchase, accurate description of what is and isn't
permanent, no misleading investment-value language, an accessible
refund/dispute policy, and plain-language terms where feasible. Whether
Zimbabwe has a dedicated consumer-protection regulator with jurisdiction over
digital services (distinct from POTRAZ's data-protection role) has not been
confirmed — flagged below.

## Data privacy

This is the core Zimbabwe-specific analysis, and it already exists in more
detail in `compliance/INDEX.md` § Zimbabwe; this section restates it in the
template's structure rather than introducing new claims.

- **Licensing trigger.** The main Supabase-backed platform is treated as an
  ordinary data controller under SI 155 if Zimbabwean residents create
  accounts or submit citizen-science/eco-ops data. Registration/licensing with
  POTRAZ is likely required before actively onboarding users from Zimbabwe.
  **Registration status/number: not yet confirmed** — this is the same
  placeholder left open in `legal-terms.md` § 14 and `legal-privacy.md` § 10;
  this memo does not resolve it.
- **Two-deployment split.** The main platform (in scope for licensing) is
  distinguished from a proposed static, offline eco-library node — served from
  a local device or Wi-Fi mesh box with no backend, no accounts, no data
  collection — which is the strongest candidate for sitting outside SI 155's
  trigger entirely. This split exists because an earlier "zero-storage"
  argument for bypassing licensing across the *whole* platform doesn't hold:
  it assumed an on-chain-only, no-database architecture that no longer matches
  the product (the account system independently makes us a controller
  regardless of blockchain framing).
- **Cross-border transfer.** Zimbabwean user data flowing to our US-hosted
  Supabase project requires notice to POTRAZ and confirmation that the
  receiving jurisdiction meets Zimbabwe's data-privacy adequacy standard under
  CDPA § 25. **Not yet assessed** — carried forward from `legal-privacy.md`
  § 10 as an open item, not resolved here.
- **Breach notification.** Any data compromise affecting Zimbabwean residents'
  data is reportable to POTRAZ within 24 hours of discovery, once we are a
  registered controller.
- **Minors.** Processing data from a participant under 18 (relevant to school-
  or youth-group-based eco-ops drives specifically) requires verifiable,
  explicit consent from a parent or legal guardian.

## Payment / money transmission

pon.ink's current payment integrations are Stripe (card) and M-Pesa (mobile
money, primarily Kenya and other M-Pesa-supported markets per
`legal-terms.md` § 1). **Neither integration is confirmed to cover Zimbabwe.**
Zimbabwe's dominant mobile-money platform is EcoCash, not M-Pesa — if
Zimbabwean users are expected to pay for anything (minting fees no longer
exist post-2026-08-01, but event tickets or other purchases still might route
through pon.ink), a Zimbabwe-specific payment partner needs to be identified
and confirmed before advertising payment flows there. This has not been
researched; flagged as an open question below rather than assumed.

## Virtual property

Not applicable in the form the template anticipates (on-chain NFT property
status, inheritance, seizure). Settlement/pinning records are, per
`legal-terms.md` § 4, locally-computed address records with no real-world
property right and no collision-proof claim registry — this is true uniformly
across jurisdictions and raises no Zimbabwe-specific question.

## Access restrictions

No Zimbabwe-specific law requiring us to block access or restrict features has
been identified. Worth noting for context, not as a compliance obligation:
Zimbabwe has a documented history of government-directed internet shutdowns
(notably January 2019). This is part of why `compliance/INDEX.md` § Zimbabwe
recommends building the static, offline eco-library node first for this
market — connectivity cost and reliability are practical barriers here
independent of the licensing question, and a node with no backend dependency
is resilient to both.

## Summary risk rating

| Category | Risk level | Notes |
|---|---|---|
| Data-controller licensing (main platform) | Medium | Likely triggers SI 155 registration once Zimbabwean accounts/citizen-science submissions exist; registration not yet initiated |
| Data-controller licensing (static eco-library node) | Low | No backend, no accounts, no data collection by design — strongest candidate to fall outside SI 155 entirely, pending confirmation on device analytics |
| Cross-border transfer (CDPA § 25) | Medium — unassessed | Adequacy of US-hosted Supabase transfer not yet evaluated |
| Consumer protection | Low — unresearched | No Zimbabwe-specific statute identified; general commitments apply |
| Payment/money transmission | Unassessed | No confirmed Zimbabwe-specific payment partner (M-Pesa does not cover Zimbabwe; EcoCash unconfirmed) |
| Virtual property | Low | No property-right claim made for settlement/pinning records in any jurisdiction |
| Access restriction | Low | No Zimbabwe-specific access-blocking law identified; shutdown history is a resilience consideration, not a legal risk to us |

## Recommended actions

- Confirm the CDPA's exact statutory citation, current SI number, and
  currently-designated data protection authority (POTRAZ vs. any successor
  body) with Zimbabwean counsel before relying on the citations in this
  document or the two regional notices.
- Register with POTRAZ under SI 155 before actively soliciting or onboarding
  Zimbabwean accounts, or confirm an applicable exemption.
- Complete the CDPA § 25 cross-border-transfer adequacy assessment for the
  US-hosted Supabase project before Zimbabwean users' data is transferred at
  scale.
- Prioritize building the static, offline eco-library node for Zimbabwe
  specifically — it is both the lower-licensing-risk deployment and addresses
  a real connectivity/cost barrier independent of compliance.
- Identify and confirm a Zimbabwe-specific mobile-money payment partner (e.g.
  EcoCash) before advertising any paid feature to Zimbabwean users; do not
  assume M-Pesa coverage extends there.

## Open questions requiring specialist counsel

- Does an offline, zero-account static node avoid SI 155's data-controller
  licensing trigger entirely, or does POTRAZ's definition reach any entity
  "determining the purpose of collecting personal data" even without a
  backend — e.g. via device/usage analytics we would need to explicitly not
  collect?
- If Zimbabwean users are directed from the static node to the main Exotopia
  platform (to claim a settlement, join eco-ops program tracking, etc.), does
  that hand-off itself trigger CDPA obligations at the point of referral, or
  only once an account is actually created?
- What does "community verification via on-device, workshop-lead-signed QR
  codes" (a pattern proposed for anonymous youth-safe action rewards) actually
  require technically, and does it avoid children's-data consent requirements
  only if no name/age/biometric data is captured anywhere in the flow,
  including analytics?
- What is POTRAZ's current licensing fee schedule and registration timeline
  under SI 155? Not yet researched.
- Is there a dedicated consumer-protection regulator in Zimbabwe with
  jurisdiction over digital services, distinct from POTRAZ's data-protection
  role? Not yet researched.
- Does EcoCash (or another Zimbabwe-licensed mobile money provider) require a
  local aggregator relationship analogous to the Kenya/M-Pesa question already
  open in `legal-privacy.md` § 4? Not yet researched.

---

*Return to: [compliance/INDEX.md](../INDEX.md)*
