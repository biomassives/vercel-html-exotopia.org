# The Fourth Track

## A proposal for a Visual Library of settlement objects and design elements — and an open question about what the Financial Literacy Power-Up actually delivers today

*SCD Hub / Exotopia.org — August 2026*

---

This is a proposal, not a shipped feature. Nothing described under "The Visual Library, concretely" below exists in code yet — no table, no store method, no page, no `RewardTrack` value. It follows the same open-development practice as `blog-financial-literacy-parallel-universe-powerup.md` and `blog-e8-library-ecology-area-proposal.md`: name the gap, show the concrete path across it, and say plainly which parts are real today and which are not. This post also surfaces something found while grounding this proposal in the actual code — a live piece of marketing copy that describes an unshipped mechanic in the present tense. That finding is reported honestly below, as an open question for a maintainer to resolve, not something this post silently fixed.

---

## Part 1 — a look at the Financial Literacy Power-Up as it actually runs today

Before proposing a new track, we went back and read the existing one end to end: the quiz content (`src/data/finance-literacy-quiz.ts`), the reward plumbing (`src/data/rewards-catalog.ts`, `src/stores/rewards.ts`), `SPEC.md` §21 and §21.5, and the live marketing copy on `PlatformPage.vue`. Three findings.

### Finding 1: the quiz content is deeper than it looks, but it's shaped like one audience, not two

P-Fin 8 and P-Fin 28 are both aimed, per this platform's own mandate, at two different groups: young people meeting these ideas for the first time, and adults who may want less 101-level material. The content does get more substantive at the second tier — P-Fin 28 introduces real distinctions a beginner quiz wouldn't need (secured vs. unsecured debt, fiduciary duty, concentration risk, expense-ratio compounding over decades, the mechanics of gross vs. net pay) that a "regular person" audience would plausibly find worth their time.

But the *form* never changes between the two tiers. Every question in both P-Fin 8 and P-Fin 28 uses the same four-option multiple-choice shape with the same style of exaggerated wrong answers — "The color of your resume paper," "A pricing error the bank will eventually correct," "The color of the bank's logo." That's an effective, approachable way to teach a first-timer, and it's honestly a reasonable choice for P-Fin 8. It reads noticeably younger for P-Fin 28, which is pitched at people who may already know a budget isn't "a punishment for overspending" and would rather the quiz spend its questions on the harder material instead of leaving room in the options list for a joke. The net effect: the two quizzes differ in *topic depth*, not in *register* — which means the "regular people" half of the stated audience gets real content wrapped in a tone built for the "young people" half. Worth a pass to differentiate the framing, not just the difficulty, if this stays a two-tier design.

### Finding 2: the points-to-object loop is invisible until after you've already finished

We traced the actual user path: `/learn`'s quiz-selection card shows only the area's badge name ("P-Fin 8 Certified"), a description, question count, and difficulty. The quiz modal itself never mentions points or a settlement-object payoff. The completion dialog shows the badge name and score — still no mention of what settlement object was unlocked, or that one was. The only place a specific object name and description appear is the Rewards page's Impact Profile, which a user has to separately navigate to *after* completing the quiz to discover what they got.

So today, someone opening `/learn` genuinely cannot tell what completing a quiz earns them before they start — not the points value, not the object, not even that an object exists — unless they've already read the Platform page's callout. That's a legibility gap independent of whether the reward is well-designed: the "perk" is real (see Finding 3), but it's not shown at the moment it would matter for someone deciding whether to start.

### Finding 3: the incentive design itself coheres with the non-negotiable — what it unlocks does not

The platform's own stated line is direct: "this is education, not a financial product — nothing here moves money, extends credit, or manages assets." Measured against that, the actual mechanic holds up: points have no cash value, quiz completion issues a certificate server-side (not client-mintable, per `SPEC.md` §21.3), and the unlock is a cosmetic 3D object added to an existing settlement. Nothing here transacts. Good.

**What doesn't hold up is the specific language used to describe that unlock — on `PlatformPage.vue`, and, we found while checking it, in the reward data itself.**

`PlatformPage.vue`'s "New — Financial Literacy Power-Up" callout currently reads, in the present tense:

> "...unlock a personal link-page settlement seed. Master all 28 questions of the full P-Fin Index across those same 8 areas and the settlement upgrades into a numbered parallel-universe world with the full Train & Certify toolset."

We checked `src/stores/rewards.ts`, `src/lib/settlements.ts`, and grepped `src/` for `parallel-universe`, `link-page`, and `exo-branch`. None of that mechanic exists. `SettlementRecord` in `settlements.ts` has no "seed" state, no link-page concept, and no `parallel-universe` settlement type — its `type` field is exactly `'surface' | 'cluster' | 'moon' | 'orbital' | 'bh-orbital' | 'stellar-orbital' | 'lunar-orbital'`. There is no code path that spawns a second, numbered settlement, and no "Train & Certify toolset" gated behind anything. What completing P-Fin 8 or P-Fin 28 actually does, end to end: `awardQuizCompletion()` calls the `award_quiz_completion()` RPC, which (server-side, per `SPEC.md` §21.3) records a `reward_events` row and issues a certificate; the certificate's `settlement_object_key` maps through `SETTLEMENT_OBJECT_MESH` to an ordinary mesh preset in `src/lib/settlement-items.ts` — `'seed-vault'` for P-Fin 8 (label: "Seed Vault," description: "Stores genetic diversity — a symbol of long-term commitment"), `'beacon'` for P-Fin 28 (label: "Signal Beacon," description: "Broadcasts settlement presence to the conduit network"). Both are decorative objects added to the member's **existing** settlement, the same kind of object anyone can otherwise get by construction, trade, or eco-ops activity. No new settlement. No link page. No parallel universe. No toolset.

That "personal link-page settlement seed" / "numbered parallel-universe world with the full Train & Certify toolset" language is, word for word, the mechanic proposed — explicitly as a proposal, opening with "This is a proposal, not a shipped feature" — in `blog-financial-literacy-parallel-universe-powerup.md`, whose entry in `src/data/blog-posts.ts` is still marked `status: 'draft'` (not even public) pending a compliance review named in its own editorial note. The live callout describes that unshipped proposal as something that already works.

It's not confined to one file, either. The same "Personal Link-Page Settlement Seed" and "Upgrades your seed into a full numbered parallel-universe settlement" wording is baked into `SETTLEMENT_OBJECTS` in `rewards-catalog.ts` itself — which means it's also what the Rewards page shows a user *after* they complete the quiz, as the description of the object they just received. `OnboardPage.vue` and `RewardsPage.vue` both carry shorter versions of the same claim. So the gap isn't only a marketing overstatement made before a user commits — it's also how the platform describes the reward back to the user once they've already earned it.

`SPEC.md` §23 exists specifically because this platform has been burned by this exact pattern before — a public claim (a July 2026 press release) describing capability ahead of what was built, and §23.2 separately names an earlier version of this same Platform-page promise as one of the two gaps that section corrected. §23.3 commits to "public-facing claims... should describe what is running in production, not what a spec describes as the target." The current callout is a recurrence of the thing §23 already named and pledged to stop doing, not a new category of problem.

**We are not fixing this.** Per the scope of this review, correcting a live promise made to users — many of them youth — about what participating actually earns them is a decision for a maintainer to make explicitly, not something to fold into a documentation pass. What we can say plainly: a user who completes P-Fin 8 today receives 25 points, a server-issued certificate, and a "Seed Vault" decorative object added to the settlement they already have. A user who completes P-Fin 28 receives 60 points, a certificate, and a "Signal Beacon" decorative object, same settlement. Neither gets a new settlement, a link page, or a "Train & Certify toolset." Our recommendation, for whoever makes this call: rewrite the `PlatformPage.vue` callout (and the matching `SETTLEMENT_OBJECTS` copy in `rewards-catalog.ts`, plus the short mentions in `OnboardPage.vue` and `RewardsPage.vue`) to describe the Seed Vault / Signal Beacon mechanic honestly — real points, a real certificate, a real object added to your settlement — and either move the "link-page settlement seed" / "parallel-universe world" language into a clearly labeled "coming" section, or drop it from live copy until the mechanic in the proposal actually ships.

---

## Part 2 — the Visual Library, concretely

`SPEC.md` §21.5 already named this gap without proposing a fix:

> "Library curation and example finding... not implemented as its own track or flow... no UI to submit a curation entry, no automatic trigger" and "Creation of models useful in eco-ops... not implemented at all — no schema, no store method, no catalog entry."

It also named the shortest real path across that gap: "a fourth `RewardTrack` value plus a `library_contribution_verified` (or similar) action key and a lightweight submission form — not a new architecture." This section takes that up.

### What a Visual Library is

A public, browsable catalog of the 3D objects and avatar/design elements people can add to their settlements — today's `ITEM_MESH_PRESETS` in `src/lib/settlement-items.ts` (beacon, crystal, planter, solar array, monument, archive node, art sphere, comms relay, seed vault, decon-site marker, plus every `REMEDIATION_METHODS` technology entry) — where the community can look at what exists, discuss what's missing or could be improved, and propose new entries. The point isn't a new rendering system; it's making an already-real, already-growing catalog **legible and contributable**, the same way this platform already did for its video library (`blog-e8-library-ecology-area-proposal.md`'s gap analysis + JSON-append pattern) and for cross-chain minting concepts (`src/lib/mint-style.ts`'s `ECOCITY_MODELS` catalog). Neither of those precedents required new architecture to add curated content — they required a place to propose it and a person or process to say yes.

### What already exists to build on

| Piece | File | Relevance |
|---|---|---|
| The actual object catalog and mesh-building logic — every preset's label, color, zone, `acquiredBy` types, build cost, and the `buildItemMesh()` switch that renders it | `src/lib/settlement-items.ts` (808 lines) | This *is* the Visual Library's underlying data today — just not exposed as its own browsable, cross-referenceable surface. |
| A second, independent curated-model catalog (Ecocity sustainable-design objects: biosand filter, solar array, compressed earth block, aquaponics tank, etc.), each with an id/name/category/impact/optional GLTF CID | `src/lib/mint-style.ts` | Proof this platform already has more than one hand-maintained "catalog of buildable things" — a Visual Library would be a third, focused specifically on settlement-object design. |
| The closest existing UI precedent for "browse a curated set of things tied to your account": six drawers (Eco-Ops Records, Certifications, Rewards/Points, Settlement Documents, **Creative Assets**, Coming Soon) rendered from real Supabase queries plus two composable reads | `src/stores/file-cabinet.ts`, rendered on `GalleryInteriorPage.vue` | The Creative Assets drawer already merges `settlement_items` rows with `community_nodes` creative pages into one list — structurally, that's "browse the things I've made or acquired." A Visual Library adds a public, cross-member version of the same idea, plus a submission path. |
| The existing peer-signal pattern this repo already ships, for a domain (PFAS method proposals) that also has no formal reviewer role | `supabase/migrations/003_pfas_citizen_science.sql` (`method_proposals`, `proposal_endorsements` tables), `src/pages/MethodProposalsPage.vue` | This is the reusable governance shape — see below. |
| A public showcase page for minting/collectible concepts (not the personal Creative Assets list — a curated gallery for anyone to browse) | `src/pages/GalleryPage.vue` | Secondary precedent for a public, non-owner-scoped browse surface, as opposed to file-cabinet's per-member view. |

### The reward-track extension

Following §21.5's own sketch directly:

- **New `RewardTrack` value: `'visual_library'`**, added to the four-value union in `src/stores/rewards.ts` alongside `'volunteering' | 'finance_literacy' | 'educating_others'`. `pointsByTrack`'s accumulator object gets the fourth key; nothing else in the ledger, certificate, or settlement-object-unlock plumbing needs to change — that generalization already exists, exactly as §21.5 says.
- **Two action keys**, not one, because submission and acceptance are different moments worth crediting differently:
  - `visual_library_submission` — small, self-serve credit (proposed: 5 pts, capped per member per period the same way `award_self_reported()` already caps other self-report action keys) for completing and posting a submission. This exists so contributing effort is recognized even before review finishes, the same spirit as `method_proposal_published` crediting the act of publishing separately from `method_proposal_endorsed` crediting engagement with it.
  - `visual_library_contribution_verified` — the real unlock (proposed: 25 pts, in line with the existing generic `contribution_verified` value), **admin-granted only**, awarded when a submission is actually merged into the live `ITEM_MESH_PRESETS` catalog.
- **Certificate + settlement object**: a new `certificate_type: 'visual_library_contributor'` mapped to a new `SETTLEMENT_OBJECTS` entry (proposed key: `atelier_marker`) — reusing an existing mesh preset thematically (`archive-node`'s "Extends the settlement knowledge base" framing fits well) rather than requiring new 3D geometry to ship this. A sustained-contribution threshold (e.g., three verified entries) could parallel `PFAS_RESEARCHER_LOG_THRESHOLD`'s pattern for a second, rarer object later — not needed for a first version.

### The submission → review → unlock flow

The honest constraint, already flagged in `SPEC.md` around line 2152: this repo has no formal peer-reviewer role hierarchy anywhere, for method proposals or anything else. So this proposal does not invent one for the Visual Library either. Instead it reuses the shape that already works for exactly that constraint — `method_proposals` / `proposal_endorsements`:

1. **Submit** — a lightweight form (new `VisualLibraryPage.vue`, structured like `MethodProposalsPage.vue`) capturing: what the object/element is, which existing preset it improves or what new preset it proposes, a description, reference images, and licensing/attribution notes. Written to a new `visual_library_submissions` table — public `SELECT`, owner-scoped `INSERT`, same RLS shape as `method_proposals`. Awards `visual_library_submission` immediately (self-reported, matching the trust model §21.3 already applies everywhere except mentor confirmation).
2. **Community discussion, not formal peer review** — anyone can leave an endorsement/comment on a `visual_library_endorsements` table, mirroring `proposal_endorsements`. This is real, visible community signal — exactly the kind PFAS method proposals already get — without pretending a reviewer hierarchy exists. Optionally, a first endorsement could credit the endorser a small amount (mirroring `method_proposal_endorsed`'s 4 pts), to encourage the review activity itself.
3. **Admin verification is still the actual gate**, same as `contribution_verified` today — an admin decides a submission is genuinely mergeable (technically sound as a preset description, not a licensing problem, fits the settlement-object visual language) and grants `visual_library_contribution_verified`, issuing the certificate server-side per §21.3's model.
4. **Catalog merge** — for a first version, this is a manual step: a maintainer adds the verified entry to `ITEM_MESH_PRESETS` as a real PR, exactly the way the Eco Library's `"youtubeId": "PENDING"` slots get filled by "a coordinator will verify... and open a PR" per `blog-e8-library-ecology-area-proposal.md`. No schema change, no dynamic preset loading required to ship this. A `community_presets` table read at runtime by `buildItemMesh()` — so a verified submission could go live without a code deploy — is the natural next step, but it's explicitly out of scope for a first version; call it the second phase, not a prerequisite.

### Why admin-gated, not peer-reviewed

Two reasons, both grounded in what's actually in this codebase rather than what would be nice to have. First, `SPEC.md` §24.3 already states plainly that a formal peer-reviewer role for method proposals doesn't exist — inventing one for the Visual Library specifically, while the platform's only comparable review-shaped feature runs without one, would be new governance surface area this proposal has no mandate to create. Second, a settlement object is rendered directly into every settlement that unlocks it — a bad or copyright-uncertain asset merged without a real check has more downstream reach than a comment on a method proposal. Admin-as-final-gate, with open community endorsement as real (but non-binding) signal, matches both the honesty constraint and the risk profile.

### Where the finance-literacy audience crosses into this one

This is the part of the proposal worth being explicit about, because Part 1's audience — young people meeting these concepts for the first time — is also exactly who this platform most wants contributing creative work, not just consuming it. A plausible path, using only mechanics described above: a member completes P-Fin 8, receives the Seed Vault object honestly described (see Part 1's recommended fix) as a real decorative object on their existing settlement. They browse their settlement, and from there the new public Visual Library page, to see what other objects look like and how they're described. If they have a design idea — a better description for an existing preset, a genuinely new object concept, an improvement to how the Seed Vault itself renders — they submit it. If it's endorsed and eventually verified, they receive the same real reward pattern the finance track already established: points, a server-issued certificate, and a second real object in their settlement, this time one they helped design rather than one they unlocked by quiz score. Two separate tracks (`finance_literacy`, `visual_library`), one continuous path for the same person, both feeding the identical certificate-and-settlement-object plumbing described in `SPEC.md` §21.2–21.3. That's the actual argument for building this as a fourth track on the existing ledger rather than a separate system: the "perks" a young person earns from one incentive track are visibly the same *kind* of thing — a real object in a settlement they own — as the perks from the next one, which is what makes moving between tracks feel like progression instead of starting over.

---

## What's proposal vs. what already exists — summary

| Claim | Status |
|---|---|
| `ITEM_MESH_PRESETS` catalog, `buildItemMesh()` rendering | **Real** — `src/lib/settlement-items.ts` |
| `ECOCITY_MODELS` curated catalog (separate precedent) | **Real** — `src/lib/mint-style.ts` |
| File Cabinet drawers, incl. Creative Assets | **Real** — `src/stores/file-cabinet.ts`, `GalleryInteriorPage.vue` |
| `method_proposals` / `proposal_endorsements` peer-signal pattern | **Real** — `supabase/migrations/003_pfas_citizen_science.sql`, `MethodProposalsPage.vue` |
| Ledger/certificate/settlement-object-unlock plumbing generalizing to a new track | **Real, already generalized** — `SPEC.md` §21.2–21.3 |
| `'visual_library'` `RewardTrack` value, `visual_library_submission` / `visual_library_contribution_verified` action keys | **Proposed** — not in `src/stores/rewards.ts` or `rewards-catalog.ts` today |
| `visual_library_submissions` / `visual_library_endorsements` tables, `VisualLibraryPage.vue` | **Proposed** — no schema, no page |
| `atelier_marker` settlement object / certificate | **Proposed** |
| Dynamic `community_presets` table read at runtime | **Aspirational** — explicitly phase two, not needed to ship a first version |
| PlatformPage.vue's "personal link-page settlement seed" / "numbered parallel-universe world with the full Train & Certify toolset" | **Live copy describing an unshipped mechanic** — flagged above as an open question, not fixed in this post |

---

## Sources / prior art on this platform

- `SPEC.md` §21 ("Rewards & Incentive Ledger") and §21.5 specifically, which named this gap and its shortest fix before this post existed.
- `SPEC.md` §23 ("A Note on Following Through"), which already corrected an earlier version of the Platform-page finance-literacy promise once and committed to describing what's running rather than what's specified.
- [`blog-financial-literacy-parallel-universe-powerup.md`] — the unshipped proposal whose language is currently live on `PlatformPage.vue`.
- [`blog-e8-library-ecology-area-proposal.md`] — structural precedent for a library proposal on this platform: gap analysis, concrete proposal, honest "what this covers and doesn't."
- [`blog-following-through.md`] — the standing-practice post this proposal tries to follow, not repeat the mistake of.
