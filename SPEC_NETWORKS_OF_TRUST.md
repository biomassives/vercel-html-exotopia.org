# SPEC: Networks of Trust — Graded, Relationship-Based Consent

**Status:** Descriptive (names an existing pattern) + Implemented (Knowledge Keeper tiers, 2026-07-22)
**Date:** 2026-07-22
**Scope:** Every place in the app where one person's proximity/relationship to another person substitutes for formal identity verification, and how much weight that substitution is allowed to carry
**Relates to:** `RISK_REDUCTION_RECOMMENDATIONS.md` §3/§4, `docs/eco-ops-workflow-guide.md` Part 6 & Part 7, `legal-community-guidelines.md`, `blog-networks-of-trust.md`

---

## 1. Why this needs naming

Four unrelated-looking features in this codebase are actually the same design decision, made independently, in different places, by different reasoning:

| Feature | The relationship that substitutes for verification |
|---|---|
| Private comments (`useComments.ts`) | Mutual "green-light" — both members opted into the channel existing |
| Onboarding age bracket (`OnboardPage.vue`) | Self-attested age, no ID, no birthdate collected |
| Mentor sessions (`002_rewards.sql`) | Requires an existing green-light connection before pairing |
| Knowledge Keeper records (`005_knowledge_keepers.sql`) | Submitter's self-declared relationship to the elder/Knowledge Keeper |

None of these verify anything in the legal-identity sense — a green-light connection doesn't confirm two people are who they say they are, an age bracket doesn't confirm a birthdate, a "I'm family of this Knowledge Keeper" checkbox doesn't confirm kinship. What they do instead is **calibrate how much the product trusts a self-report, based on the reported relationship, and scale friction accordingly.** A stranger claiming something gets more friction than someone claiming a close relationship. That's a real design pattern with real legal texture across jurisdictions, and it deserves to be named once instead of re-derived per feature.

## 2. The general shape

```
                    LOW STAKES / CLOSE RELATIONSHIP
                              │
                    trust the self-report,
                    act immediately
                              │
                    ──────────┼──────────
                              │
                    trust the self-report,
                    but add a visible reminder/
                    soft confirmation step
                              │
                    ──────────┼──────────
                              │
                    hold the action, require
                    an explicit artifact
                    (a written note, a second
                    party's confirmation) before
                    it takes effect
                              │
                    ──────────┼──────────
                              │
                    don't offer a lightweight
                    path at all — route to a
                    formal, higher-friction
                    process with real
                    institutional weight
                              │
                    HIGH STAKES / NO ESTABLISHED RELATIONSHIP
```

Four rungs, not two. The mistake this pattern is designed to avoid is collapsing everything into "verified" vs. "not verified" — which either (a) makes every interaction as slow as the highest-stakes one, killing the low-friction cases that don't need it, or (b) makes every interaction as fast as the lowest-stakes one, which is how a Knowledge Keeper's oral history ends up published without anyone actually asking them.

### Where each existing feature sits on the ladder

- **Private comments**: rung 1. Both parties already consented to the channel (green-light), so a message inside it acts immediately — no per-message gate.
- **Age bracket**: a variant of rung 1/4 combined — self-attestation is trusted for 13+ (rung 1), but under-13 isn't offered a lightweight path at all (rung 4) — it routes to a real human, because COPPA-grade parental consent genuinely can't be satisfied by a checkbox, and pretending otherwise is worse than an honest "we can't do this yet, here's a human to talk to."
- **Knowledge Keeper — self/family**: rung 1.
- **Knowledge Keeper — friend**: rung 2 (soft nudge, still publishes).
- **Knowledge Keeper — student/researcher**: rung 3 (held, requires a written consent_note, a coordinator reviews it).
- **Endangered Language Documentation (Part 6)**: rung 4, by design — FPIC from a governance body, not a graded self-attestation, ever. This is the one place in the app where the ladder doesn't apply; it's flat at the top rung regardless of who's submitting. See §4 for why this boundary matters more than any of the others.

## 3. How this maps onto real legal frameworks in 2026

This is descriptive, not a substitute for counsel — see the same caveat every `legal-*.md` file in this repo carries. But the pattern isn't invented from nothing; each rung has a real-world analog, and knowing which one you're approximating helps catch when a feature has drifted onto the wrong rung.

- **Rung 1 (trust the self-report)** — closest to how most consumer platforms treat account-holder self-attestation generally: age-gate checkboxes, "I agree" clickwraps, self-reported relationship fields. Legally thin everywhere, but accepted as adequate for low-stakes, reversible actions across most jurisdictions on this project's list (US, EU/UK, Kenya, etc.) — it's the same legal weight as a supermarket self-checkout age-verification button.

- **Rung 2 (soft nudge)** — doesn't have a clean single legal analog; it's closer to the "nudge" literature in behavioral policy than to a specific statute. It matters here because South Korea's PIPA and the EU's GDPR both reward (in spirit, if not letter) designs that make consent an active, visible moment rather than a buried default — the friend-tier reminder is that spirit applied to a peer relationship instead of a platform-to-user one.

- **Rung 3 (held pending an explicit artifact)** — this is where COPPA's parental-consent mechanisms and GDPR Art. 8's "reasonable efforts to verify" standard actually live: not full identity verification, but a documented, reviewable step beyond a checkbox. The Knowledge Keeper student/researcher tier's required `consent_note` + coordinator review is deliberately shaped like this — a human has to read something and make a call, which is closer to what "reasonable efforts" means in both regimes than an unreviewed self-attestation would be.

- **Rung 4 (route to a formal process, no shortcut)** — this is where Free, Prior and Informed Consent (ILO C169 Art. 6, UNDRIP Art. 31, and the Nagoya Protocol's Access and Benefit-Sharing framework for traditional knowledge) and COPPA's actual verifiable-parental-consent requirement live. Both share a feature the lower rungs don't: **the party being protected isn't the one using the product.** An elder speaker of a threatened language and a child under 13 are both people a *third party* (a student researcher, a sibling with an account) might submit something on behalf of — and both frameworks respond to that gap the same way, by refusing to let proximity alone stand in for consent once the person affected is genuinely not the one clicking the button. This is also, not coincidentally, the CARE Principles for Indigenous Data Governance's core objection to conventional data-openness defaults: openness by default is itself a harm when the data encodes a community's knowledge commons rather than an individual's own disclosure.

## 4. The one hard rule

**Never let a lower rung's design leak into a rung-4 situation because it would reduce friction.** This is the mistake this document exists to prevent. The Knowledge Keeper feature's own README-level comment (`005_knowledge_keepers.sql`) says it directly: if a submission touches a threatened language, it doesn't get graded — it goes to Part 6's FPIC process, full stop, regardless of how close the submitter's relationship to the speaker is. A family member's self-attestation is real trust information for "should this personal memory about a fishing spot publish immediately" and it is not adequate consent for "should this community's threatened-language corpus become part of a permanent archive." Those are different questions wearing similar UI.

The practical test for a new feature: **is the party whose consent matters most the same party who's using the product right now?** If yes, grading by relationship (rungs 1–3) is a legitimate, honest design space. If no — if consent has to come from someone who isn't in the room, whether that's a parent, a community governance body, or an absent knowledge-holder — the feature needs rung 4, and no amount of "but they said the elder was fine with it" changes that.

## 5. Non-goals

- This is not a replacement for real identity verification anywhere it's actually required (payment processing, age-verification law with a hard legal threshold, etc.) — those still need their own dedicated, properly-verified flow, not a graded self-attestation.
- This does not make any of the four existing features *legally sufficient* on their own — `legal-privacy.md`, `legal-community-guidelines.md`, and `LEGAL_REQUEST_POLICY.md` still carry the actual compliance commitments; this document explains the design reasoning behind them, it isn't itself a legal instrument.
- This isn't a call to build a fifth or sixth rung "just in case." Four is enough for what this product actually does today; adding more granularity than the underlying legal frameworks distinguish between would just be complexity without a corresponding real-world referent.
