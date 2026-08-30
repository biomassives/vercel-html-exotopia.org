# UX Flow Review — 2026-08-29

Method: local Playwright driving Chromium against `npx quasar dev` (localhost:9000), at 1440px and 390px widths, walking the five journeys below plus a source-level trace of every navigation target involved (route params, computed modes, hardcoded data arrays). Screenshots and text dumps are in `/tmp/ux-review-shots/` (not committed — local session artifacts only).

Scope note: this focuses on today's uncommitted session (the blockchain-scope correction, the expanded `DocPage.vue`, the new `/api-surface` page, and the mobile CSS fixes). Two pre-existing issues that sit directly in the first-time-landing path are included under Journey 1 because they materially affect that journey, but they predate today's session — called out explicitly so they aren't mistaken for regressions from today's work.

A trivial one-line-per-entry text fix was made directly during this review (not a recommendation) — see the note at the bottom.

---

## Journey 2 — Claiming a settlement (highest-priority findings)

### F1. Every shallow "claim a planet" CTA in the app lands on the wrong product [CRITICAL]

`MintPage.vue` has two personalities selected by `mintMode`, computed from URL query params:

```
claimHost/claimLat/claimLon = route.query.host/lat/lon
hasClaimPlot = host && planet && !isNaN(lat) && !isNaN(lon)
mintMode = hasClaimPlot ? 'surface-deed' : 'general'
```

`'surface-deed'` is the real thing — a specific plot, lat/lon, the "LETTERS PATENT" deed panel, and the actual free/local-first claim mechanics. `'general'` is a *different feature entirely*: an NFT collector-card shop ("Design your place in the cosmos — 11 hand-crafted SVG collector's cards... START MINTING").

I grepped every navigation to `/mint` in the codebase. The ones that build `?host=&lat=&lon=` (correct) only exist on deep, already-drilled-down screens: `SurfaceViewPage.vue`, `PlanetClaimOverlay.vue`, `ClusterSurfacePage.vue`, `ClusterInteriorPage.vue`, `ClusterGalaxyPage.vue`. Every other CTA in the app — including the ones today's session specifically rewrote to say "claim," not "mint" — pushes plain `/mint` with no params:

- `MainLayout.vue` mega-menu: "Start a Settlement" card, "Claim free deed →" action, "Begin settlement →" cta
- `MainLayout.vue` mobile drawer: "Claim a Planet"
- `CosmicPage.vue`: the "CLAIM A WORLD" panel's "Claim World" button, and the "SETTLE" step chip
- `GalaxyPage.vue`: "Reserve for Settlement" button on a clicked (even unconfirmed) star
- `GalleryPage.vue`, `PlanetSystemsPage.vue`, `WelcomeOverlay.vue`

So a user who clicks any of the app's most prominent "claim/settle" entry points — the ones this session's copy pass specifically targeted — is dropped onto an unrelated NFT card-collecting landing page, not a settlement-claim flow. The only way to reach the real claim UI is to already know to go Galaxy → pick a star → pick a planet → surface view → pick a plot first.

**Fix options:** (a) point the shallow CTAs at the galaxy/picker flow instead of `/mint` directly; (b) have plain `/mint` (no params) redirect into "pick a world" rather than defaulting to the card shop; (c) if the general-mode card shop is a legitimate separate feature, stop reusing "claim a planet"/"claim a settlement" language on its own entry points so the two products aren't asking to be confused with each other.

### F2. Even on the correct claim screen, leftover mint/NFT skin contradicts the "free, no wallet" framing next to it [HIGH]

Inside `MintPage.vue` itself (`surface-deed`, `moon-orbital`, and `cluster-world`/`cluster-outpost` hero variants):

- Three separate "FREE TO MINT · 0 USDC" badges remain (surface-deed hero, moon-orbital hero, cluster-world hero)
- The general-mode hero still has a "START MINTING" button
- The gold-rush "LETTERS PATENT / TERRITORIAL LAND DEED / DEED NO. EXO-..." styling is unchanged
- Meanwhile the same file's own consent checkbox text a few hundred lines away says "This creates a free address record — no wallet, no blockchain transaction, no investment" and a code comment confirms wallet/chain minting was deliberately removed from the mechanics

The mechanics are already correct (per the file's own header comment) — this is purely leftover surface copy that reads as "old skin over new mechanics" right next to copy that was already fixed. Recommend a copy-only sweep of the remaining "MINT"/"0 USDC" labels to match the local-first framing used everywhere else on the same page.

### F3. `RealmFunnel.vue` (today's copy target) is dead code [LOW, informational]

The task brief for this review assumed "RealmFunnel cards → galaxy/cosmic view" was part of the live claim funnel. It isn't — `RealmFunnel.vue` is not imported by any page, layout, or component in `src/` (confirmed by grep across the whole tree). `blog-risk-reduction-pass.md` mentions it was "the funnel component shown across the app" historically, describing a since-removed NFT-marketplace pitch it used to make — it appears to have been unhooked when that marketplace was pulled, and never re-wired. Today's copy fix to it ("Claim address," "FREE TO CLAIM") is correct but has zero effect on what any real user sees. Worth a decision: re-wire it or delete it, so future copy passes don't keep polishing something nobody can reach.

---

## Journey 3 — Docs discovery

### F4. `/docs`' own Glossary excerpt contradicts the page's own opening paragraph [HIGH — 2 lines fixed directly, rest still open]

`DocPage.vue`'s "Getting Started" section (rewritten today) opens with: *"Settlements are local-first: claiming and personalizing one is a free, device-resident record — no wallet, blockchain, or account required."* That's correct and clear.

Scroll further down the *same single-page document* to its own inline Glossary section, and — before today's fix — it said:

- **[24] Exolocation** — "Permanent **on-chain** address anchoring a settlement..."
- **[40] PON INK** — "Primary operations portal for the SCD Hub — **records every action on-chain**."

This isn't stale content living in a different file — `GLOSSARY.md` itself was correctly updated today (`git diff GLOSSARY.md` shows entry [24] now says "local-first... no wallet or blockchain required"). The problem is that `DocPage.vue` keeps its own **hardcoded, duplicate** `KEY_TERMS` array (lines ~815 area) instead of sourcing from `GLOSSARY.md`, and that duplicate wasn't touched by today's pass — so the same fact now has two different answers eight seconds of scrolling apart, on the exact page a new user reads to understand the model.

**I fixed the two contradicting lines directly** (trivial text edits, see note at bottom) so they now match `GLOSSARY.md`'s corrected wording. Left open, because it's a real rewrite, not a one-liner: three more spots further down the same page still describe core mechanics as NFT-default —
- "Observatory context & provenance": *"This block is stored with the NFT metadata when a world is claimed, anchoring the deed..."*
- Game Theory section: *"Two optional engagement economies layer on top of settlement NFTs"*
- "Settlement Hashmark": *"The hashmark JSON (stored with the NFT) is sufficient to reconstruct..."*

Recommend rephrasing these three to describe the data as stored with the local settlement record (optionally mirrored into NFT metadata if minted via pon.ink), and — longer-term — having `DocPage.vue` read from `GLOSSARY.md` rather than hand-duplicating entries, since this exact drift is likely to recur otherwise.

### F5. Structure and `/api-surface` discoverability are actually fine — worth confirming, not just flagging problems

The sidebar's ten sections (Getting Started → Visualization → Events & Outreach → Protocol & Economy → Glossary → Data & Coverage → **API & Data Surface** → Data Pipeline → Technical Specs → Security → Community) read as one coherent manual, not several stapled-together documents — depth and tone are consistent throughout. `/api-surface` specifically is not buried: it has its own sidebar section, its own intro blurb inline in the page body, and an explicit "Open the API & Data Surface map →" link. No fix needed here — see F7 for the one real discoverability gap, which is cross-viewport, not within `/docs` itself.

---

## Journey 4 — Rewards/education loop

### F6. Confirmed: the reward is still invisible until after you've already gone looking for it [HIGH]

The badge *name* is visible before starting a quiz (`LearnPage.vue` cards show "🏅 Water Guardian" etc. up front) — that part is fine. The gap is what happens next:

1. Finishing a quiz opens a completion dialog that shows only the emoji, "{badge} earned," the score, and a single "Back to quizzes" button — no link to `/rewards` or any indication of what the badge actually does.
2. `/rewards` itself, in the default signed-out state every first-time visitor is in, renders almost nothing: a two-line summary, a "How does this work? →" link, and a magic-link sign-in box — no preview of certificates, settlement objects, or the Impact Profile.
3. The one place that actually explains all of this well — `/rewards-guide` — is excellent (plain language, concrete thresholds, an explicit "not a financial product" disclaimer, a real FAQ) but is only reachable via that one small link on the mostly-empty `/rewards` page, and isn't linked from the quiz completion dialog at all.

So the realistic first-time path is: finish quiz → see a badge name and a score → dead end → separately discover the `/rewards` nav item → hit a sign-in wall → maybe notice "How does this work?" → finally get the real explanation, several steps after the moment of highest interest (having just earned something).

**Fix:** add a "See what this unlocks →" link from the completion dialog straight to `/rewards-guide`, and/or surface 3-4 lines of `/rewards-guide`'s plain-language summary directly on `/rewards` above the sign-in box instead of gating all explanation behind sign-in.

---

## Journey 5 — Nav consistency

### F7. `/api-surface` has a one-tap mobile shortcut but no desktop equivalent [MEDIUM]

Today's session added `/api-surface` to the mobile hamburger drawer (`MainLayout.vue`, new button under the docs group) but not to the desktop mega-menu — grepping `MainLayout.vue` for `api-surface` / "API & Data Surface" finds only the one mobile drawer button. Desktop's `DOCS` nav item is a deliberate plain link with no dropdown (there's an existing code comment: *"Docs links live inside /docs page sidebar — this is a direct nav link only"*), so a desktop user's only path to `/api-surface` is DOCS → sidebar/inline link, while a mobile user gets it in one tap from the drawer. That's a real asymmetry in how prominent the feature is per platform, for a page whose audience (self-hosters, integrators) skews toward desktop.

**Fix:** either add an equivalent quick-access card on desktop (e.g. under PARTICIPATE, or a "Build/Integrate" group), or drop the mobile-only shortcut so both platforms agree on how deep this page sits.

Everything else checked — the mega-menu card set vs. the mobile drawer's equivalent buttons, and their route targets — is consistent aside from the copy already covered in F1/F2.

---

## Journey 1 — First-time landing (pre-existing, not from today's session, but directly in the path being assessed)

### F8. The very first thing a new visitor sees is a full legal-consent gate [pre-existing]

`DemoConsentOverlay.vue` blocks every route except `/terms`, `/privacy`, `/community-guidelines` until `localStorage.exo_demo_consent` is set — which, for a genuinely new visitor, means before they see anything else at all. It requires scrolling all three legal documents to the bottom (Terms of Service alone runs to 16 numbered sections plus 10 jurisdiction-specific regional notices, several with `[BRACKETED]` unfinished placeholders visible) and checking two consent boxes before "Continue" even enables. This is well-built (good unbundled-consent practice, logs timestamps, exempts the doc routes it links to) but it means the literal first content a new user reads is dense legal template text, not "what is this and what do I do first." Not from today's diff, but worth flagging since it sits directly upstream of the onboarding journey this review was asked to assess.

### F9. Top nav auto-collapses to unlabeled icons after ~5 seconds [pre-existing, minor]

`MainLayout.vue`'s `barMode` auto-hides the full `EXOTOPIA / EXPLORE / PARTICIPATE / DOCS / BLOG` bar down to three unlabeled icons (home/search/menu) after 5 seconds of no interaction on non-settlement routes. A first-time visitor who spends more than a few seconds just looking at the cosmic web view (a reasonable thing to do on first landing) loses the labeled navigation before they've had a chance to read it. Onboarding itself (`OnboardPage.vue`) is otherwise clean and well-sequenced (Mission → About You → Path → Commit → Your Place → Begin) — no issues found there.

---

## Trivial fix made during this review

In `src/pages/DocPage.vue`, the hardcoded `KEY_TERMS` glossary array had two entries left over from before today's blockchain-scope correction, directly contradicting the page's own "Getting Started" intro a few paragraphs above them (see F4). Fixed both to match `GLOSSARY.md`'s already-corrected wording:

- `id: 24` (Exolocation): "Permanent on-chain address..." → "Permanent, local-first address... — no wallet or blockchain required."
- `id: 40` (PON INK): "...records every action on-chain." → "Optional creative-economy portal (sound tools, payments, NFT minting) — not required to create or use a settlement."

No other files were changed.
