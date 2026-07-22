# Risk Reduction — Product & Policy Recommendations

Contract language (the Terms/Privacy drafts) only carries you so far. Courts
and regulators increasingly look at what the *product actually does*, not
just what the fine print says. This doc is organized around specific things
found in the Exotopia/SCD Hub codebase and docs, each paired with a concrete
change — not generic advice.

---

## 1. NFT/investment-framing risk — the single biggest lever you control

**What I found**: `StationPage.vue` displays a `RARITY_SUMMARY` breakdown
(Legendary / Rare / Uncommon / Common, with counts) before minting. Rarity
tiering is one of the clearest signals courts use when applying the Howey
test ("expectation of profit from the efforts of others") to NFTs — it's
functionally identical to how graded-collectible and gacha-style products
argue value, which is exactly the argument you don't want available against
you.

**Recommendations**:
- Reframe or remove the rarity-tier display on the pre-mint screen. If you
  keep a rarity concept for flavor, present it as **aesthetic/thematic
  variety**, not as a scarcity/value signal (drop the counts, drop "rare"
  language tied to numbers).
- **Do not build a secondary marketplace or resale-price display.** This is
  the single highest-leverage decision in this whole document — a visible
  resale market is the most common trigger for "this is a security" analysis
  across every jurisdiction on your list. If users want to trade, that's
  between them and their wallets; don't host or facilitate it in-product.
- Add an explicit click-through confirmation before every mint: *"This mints
  a collectible record. It has no cash value, no expectation of profit, and
  is not an investment."* Log the timestamp of acceptance — this converts a
  buried ToS clause into an affirmative, evidentiary user action, which
  matters a lot more in EU/UK/Mexico-style consumer-protection review than a
  clause nobody reads.
- Audit blog/marketing copy (not just the ToS) for words like "value,"
  "worth," "grow," "earn," "invest" near settlement/NFT features — regulators
  read substance over form, so the contract disclaimer doesn't help if the
  marketing says the opposite.

## 2. M-Pesa + Stripe — you're a fintech app in Kenya, not just a crypto app

**What I found**: `pon.ink` processes **real money** via Stripe and M-Pesa,
per the README. This is easy to under-weight because the rest of the stack
is crypto-native, but M-Pesa in particular puts you under different scrutiny
than a wallet-only app — Kenya's Central Bank regulates e-money and mobile
money flows directly, separately from the Data Protection Act.

**Recommendations**:
- Confirm (with Kenyan counsel) whether you're integrating M-Pesa through a
  **licensed PSP/aggregator** (e.g. a Safaricom-approved partner) rather than
  holding customer float directly — direct float-holding without a license
  is a materially different (and much riskier) posture.
- Never let the app itself display an implied exchange rate between M-Pesa
  KES and any in-app points/rewards — that's the fastest way to turn a
  loyalty program into an unlicensed money-service product.
- Keep payment-card and M-Pesa PIN data fully inside Stripe/M-Pesa's own
  hosted flows (don't proxy raw card/PIN data through your own backend even
  transiently) — this keeps you out of PCI-DSS scope as a merchant rather
  than a processor.

## 3. Minors + financial-education content — you already flagged this internally

**What I found**: the "Power-Up" blog post (`financial-literacy-parallel-
universe-powerup`) is explicitly held in draft with an editorial note:
*"aimed partly at minors and touches financial-education content — needs a
compliance review (COPPA and equivalent) for any under-13 reach, and
financial-content review to confirm nothing reads as advice or a promise of
monetary value."* That instinct is correct — turn it into a product gate,
not just a publishing hold.

**Recommendations**:
- Before this program ships, build an actual **age-screen + parental-consent
  flow**, not just a ToS clause. A neutral age gate (no incentive to lie
  about your age to proceed) plus a verifiable-parental-consent step for
  under-13 US users (COPPA) and under-16/13 EU users (GDPR Art. 8, threshold
  varies by member state) is the real compliance artifact regulators look
  for — the ToS checkbox alone won't satisfy either regime.
- Route the "financial-content review" the editorial note asks for through
  someone who can specifically confirm nothing in the UI reads as investment
  advice or a promise of return — this is a different review than a general
  legal read of the ToS, and the two shouldn't be conflated.
- Consider keeping this program's data flows *entirely separate* from the
  wallet/minting features while it's minors-facing — bundling "learn about
  money" content with an actual live-wallet interface for a child user is a
  much harder story to defend than keeping them as separate, sequenced
  experiences.

## 4. The private comment system — good privacy instinct, needs a companion safety layer

**What I found**: the blog post `online-safety-and-private-comms` describes
a "seven-person private comment system" with "green-light mutual
connections," built deliberately to avoid the surveillance infrastructure
that KOSA, the UK Online Safety Act, and Australia's framework increasingly
expect — and the team is actively engaged politically on this (lobbying
against KOSA). That's a defensible design philosophy, but it needs a
companion product decision, because "we refuse to build monitoring
infrastructure" and "we have no abuse-response mechanism at all" read very
differently to a regulator, even though the underlying privacy commitment is
the same.

**Recommendations**:
- Keep a **user-initiated report path** even in the small, mutual-consent
  group model — e.g. "forward this to moderators" as something only the
  *recipient* can trigger, never passive scanning. This preserves the
  privacy architecture while giving you a legitimate answer to "what happens
  if someone is harassed in here."
- Add an honest, narrow **age gate** for this feature specifically (even
  without content scanning, restricting the feature to accounts that
  self-attest as 16+ or 18+ measurably reduces exposure under "likely to be
  accessed by children" tests that several of these laws use as a trigger
  threshold).
- Document your **lawful-request response policy** internally (what you do
  and don't do when served with a valid legal order) even though you're
  declining to build proactive scanning — having a clear, written, principled
  policy is what turns "we refuse to cooperate" into "we cooperate with valid
  legal process but don't build surveillance infrastructure absent one,"
  which is a much stronger public and legal position.
- Make the comment feature's actual privacy model (what is and isn't
  visible to you, what you can and can't produce if legally compelled)
  explicit in the Privacy Policy — accurate expectation-setting is itself
  risk reduction, since most complaints in this space come from a mismatch
  between what users *assumed* was private and what actually was.

## 5. PFAS/citizen-science data — named-brand and health-claim exposure

**What I found**: a draft blog post's editorial note flags needing to
"confirm third-party test documentation availability for named brands
before publishing," and the codebase has a `decon-site-marker` item type and
`LocalDataPanel.vue`/eco-ops data flows tied to real-world contamination
site reporting.

**Recommendations**:
- Put a standing disclaimer on every screen that displays PFAS/decon data:
  *"Community-submitted, not certified laboratory results — not a substitute
  for professional environmental testing or medical advice."* This is cheap
  and meaningfully reduces both defamation exposure (against named sites/
  brands) and negligent-misrepresentation exposure (if someone relies on the
  data for a health decision).
- Never let the app's own copy make a health-risk interpretation ("this
  level is dangerous") — report the submitted values as data, and link out
  to an authoritative source (EPA, WHO, or the relevant local environmental
  authority) for interpretation. Keep the app's institutional voice in the
  "reporting" register, not the "advising" register.
- Add a **correction-request path** for named sites/brands that dispute a
  report — even a simple "flag for review" button is a meaningful due-process
  step that reduces defamation risk if it's ever tested.
- Fuzz precise geolocation on any *public-facing* map of contamination sites
  (keep exact coordinates available to the submitter and to legitimate
  research/regulatory partners per the Privacy Policy, but round public
  display coordinates) — this reduces both a safety concern (unverified
  sites shouldn't broadcast an exact address publicly) and a liability
  concern (precision implies a certainty the data doesn't actually have).

## 6. Data minimization — you're already doing some of this right, worth extending

**What I found**: `src/lib/storage-cipher.ts`'s `hashStorageKey` is already
used to avoid storing raw settlement-location strings as plaintext
localStorage keys — a genuinely good existing practice.

**Recommendations**:
- Apply the same hash-before-store pattern to citizen-science submitter
  identifiers wherever the raw identity isn't functionally required (e.g.
  aggregated public displays of "who reported this site" could use a
  pseudonymous, hashed handle rather than a wallet address or username).
- Add a scheduled cleanup for `staged-entries` (the Record widget's
  locally-staged, unsubmitted entries) — data sitting indefinitely on-device
  in an unsubmitted state is exactly the kind of thing that turns into a
  forgotten liability if a device is lost, shared, or subpoenaed.
- Write down (even briefly, doesn't need to be public) an actual data
  retention schedule — "how long do we keep X after account closure" is one
  of the most commonly requested items in a regulator inquiry, and it's much
  cheaper to define once than to reconstruct under pressure.

## 7. Global UX hygiene that pays off in every jurisdiction on your list

- **Explicit ToS/Privacy acceptance with a timestamp**, not "by using this
  site you agree" in a footer — checkbox + logged acceptance is a much
  stronger evidentiary posture, and several regimes in your list (Mexico,
  Costa Rica, Ecuador) expect something closer to affirmative consent than
  US-style browsewrap.
- **A visible, working contact/report link in the site footer** — not just
  inside the legal pages — several frameworks (EU DSA-adjacent expectations,
  Nigeria's NDPA, South Africa's POPIA) expect an accessible complaint
  channel to be discoverable, not buried.
- **A dated changelog for ToS/Privacy Policy updates** — lets you answer "what
  did this user agree to on date X" and is close to a hard requirement for
  *material* changes in GDPR-covered markets.
- **Consider a soft geofence/notice** (not necessarily a hard block) for
  jurisdictions where resident crypto participation is heavily restricted or
  prohibited — a lawyer can help you compile the current short list. Even an
  honest "residents of X may face restrictions on this feature under local
  law" notice is meaningfully better than silence if it's ever reviewed.
