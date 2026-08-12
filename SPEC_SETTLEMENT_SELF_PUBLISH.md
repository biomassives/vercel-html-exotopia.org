# SPEC: Settlement Self-Publish — A Guided, Bring-Your-Own-Account Deploy Wizard

**Status:** Proposed — planning phase, not yet implemented, drafted by background research pass for review.
**Date:** 2026-08-06
**Scope:** A new in-app wizard that walks a community member through turning their own node/settlement content into their own fully self-owned Exotopia instance, without the platform ever custodying credentials capable of acting on their behalf.
**Relates to:** `SPEC_SELF_HOSTED_NETWORK.md` (the manual process this wizard automates the *steps* of, not the architecture of), `SETTLEMENT_ADDRESS_API.md` (the IPFS-pinning-not-blockchain durability model this reuses), `SPEC_COMMUNITY_NODES.md` §4 (`exportForSelfHost()`, the closest existing prior art)

---

## 0. Why this document exists

An earlier planning pass put "let users turn their node into their own hosted instance" on the backlog, framed as: *the platform holds OAuth tokens for the user's GitHub/GitLab and Vercel accounts and auto-deploys on their behalf.* That same pass flagged this as **the single highest-risk item in the whole backlog** — a token layer with repo-write and deploy-trigger scope is real attack surface (a compromised token store could push malicious code to a user's repo or deploy arbitrary content to their Vercel account), it's the one backlog item where legal, security, privacy, and dev-tooling exposure all score high simultaneously, and it was explicitly recommended to get a dedicated threat-modeling and legal-review conversation before any implementation work began.

This spec does not do that threat-modeling exercise on the custodial version, because it proposes not building that version. It designs a different architecture instead: **bring-your-own-account (BYOA)**. The wizard's job is to be a configuration assistant and instruction-giver — it hands the user deep links, pre-filled forms, and copy-paste values — and the user connects and authenticates to GitHub/GitLab, Vercel, Supabase, and an IPFS pinning provider **directly, in each vendor's own UI, under their own login.** The platform's stated goal is to never hold a standing credential capable of writing to the user's repo or triggering a deploy on their behalf. Where that goal can't be hit perfectly for a given vendor, this spec says so explicitly rather than quietly falling back to custody.

This reframing doesn't just reduce risk — it's why this feature is buildable at all without the threat-modeling/legal-review gate the OAuth-custody version required. Nothing here is settled. Every vendor mechanism below is described to the best of available documented knowledge as of this writing and flagged **[VERIFY]** where a human should re-check current vendor docs before implementation — vendor onboarding flows change often and none of this has been tested against live APIs in this environment.

---

## 1. What's actually there today (grounding)

- **`SPEC_SELF_HOSTED_NETWORK.md` §2** and `src/pages/DocPage0.vue`'s "Run Your Own Instance" section (`:id="'new-user'"`) already document the manual 3-step baseline: create a Supabase project and run `supabase/migrations/` (13 files today) against it; fork/clone the repo to GitHub, GitLab, or Gitea; connect the repo in Vercel, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON`, deploy. `vercel.json` owns build config, headers, and CSP already — nothing to hand-configure there.
- There is **zero in-app tooling** for any of this today. It's prose in a docs page. The user does all three steps by hand, across three separate vendor dashboards, with no state tracking, no pre-filled values, no progress indicator.
- **`.env.example`** already documents the exact two Supabase vars and one optional Pinata var (`VITE_PINATA_JWT`) needed, and already carries a security note worth repeating here because it's directly relevant to this spec's security lens (§4.2): *"this is a `VITE_` var, so it ships in the public client bundle and is readable by anyone who opens devtools... do NOT use an Admin key."* The app's existing convention is already "use a narrowly-scoped, write-only key that's safe to expose client-side" — this spec's BYOA design is a natural extension of a pattern already in place, not a new philosophy.
- **`src/lib/ipfs-pinning.ts`** ships one working `PinningService` implementation today: **Pinata**, via `VITE_PINATA_JWT`, using a v3 scoped "Files: write" key the user generates themselves in Pinata's own dashboard. The interface is explicitly designed (see its header comment) to accept additional providers — "Web3.Storage, self-hosted, etc." — without callers changing. **nft.storage is not currently one of them.** The backlog framing that named nft.storage specifically should be read as "the pinning-provider step, generalized" rather than a commitment to that one vendor — see §4.5 open question.
- **`src/stores/community-nodes.ts`'s `exportForSelfHost()`** (surfaced via `CommunityNodesPage.vue`'s "Download my listings (JSON)" button, `exportData()`) is the closest existing prior art for "a user takes their own data elsewhere." It is a pure client-side `Blob`/`URL.createObjectURL` JSON download — no network call, no deploy automation, no account connection of any kind. This spec's wizard is a much bigger step than that, but the underlying instinct — client-side, user-initiated, nothing routed through our servers unless it has to be — is exactly the one this spec keeps.
- **`src/pages/PfasCitizenSciencePage.vue`'s `logFieldWaiverAcceptance()`** is the existing pattern for a consent-with-consequences gate: a checkbox that must be ticked before a specific action with real-world exposure (a non-simulated field site), logged with a timestamp to a `localStorage` array (`exo.field-waiver-log`), referenced back to `RISK_REDUCTION_RECOMMENDATIONS.md` §3/§7 in its own code comment. This spec's consent step (§3.3) reuses this exact pattern rather than inventing a new one.
- **`compliance/INDEX.md`** (the "Our operating strategy" section) already states the philosophy this spec leans on: *"a legal entity can be restricted but cannot un-publish open-source code or delete public blockchain records"* — and separately, principle 2: *"Be a tool, not a custodian... we do not hold user funds... we are infrastructure, not a custodian."* This spec is that same principle applied to deploy tooling instead of financial custody.

---

## 2. Vendor mechanisms researched — what BYOA looks like per vendor

All four vendors are described here from documented, well-known platform behavior as of training knowledge, not from a live check in this session (no internet access). **[VERIFY]** markers indicate that a human should re-confirm current vendor docs/UI before implementation — these platforms change onboarding flows without much notice.

### 2.1 GitHub — get the code into the user's own account

The cleanest mechanism is not OAuth at all: GitHub supports marking a repository as a **template**, after which a deep link of the shape `https://github.com/new?template_owner={owner}&template_name={repo}&owner=@me&name={suggested-name}` opens GitHub's own "create a new repository" screen, pre-filled to clone from that template, entirely on `github.com`, using whatever session the user is already logged into. No token, no OAuth app installation, no code from our side ever touches their account. **[VERIFY]** whether this repo is currently marked as a GitHub template repository (a one-time toggle in repo settings) — if not, this link doesn't work as described and the fallback is a plain "Fork" link instead (mechanically similar, slightly different resulting repo relationship).

The alternative — a PAT the user pastes in, or full OAuth (authorization-code or device flow) — is not needed for the "get the code" step at all if the template-link approach works, and is explicitly **not recommended** here: any token capable of creating/writing repos on the user's behalf is exactly the custody surface this redesign exists to avoid, even if it's short-lived. If a future need arises for the app to *verify* the repo was actually created (rather than trust a self-reported checkbox), a device-flow, read-only-scoped token would be the least-bad option — flagged as a nice-to-have in §5, not MVP.

### 2.2 GitLab — same shape, different vendor

GitLab supports an equivalent "fork" deep link (`.../-/forks/new`) and, per GitLab's own docs, OAuth device flow support (RFC 8628) since GitLab 15.x. **[VERIFY]** GitLab's current fork-with-namespace-prefilled URL parameters — the exact query-string shape should be re-checked against GitLab's live docs. Same recommendation as GitHub: prefer the plain deep-link/fork mechanism over any token exchange for the MVP.

### 2.3 Vercel — the strongest case, and the one to build the wizard's design around

Vercel has a long-standing, well-documented **"Deploy Button"** pattern (`https://vercel.com/new/clone?repository-url=...`) built for exactly this use case: a third-party site links to it, the link opens on `vercel.com`, and the *user's own* Vercel account does the importing, env-var configuration, and deploying — the referring site never sees a Vercel token. Materially relevant query parameters (**[VERIFY]** exact current names/behavior against Vercel's live docs before implementation):

- `repository-url` — the repo Vercel should import (pointing this at the user's own fork from step 2.1, not at SCD Hub's canonical repo, is what keeps their deploy independently owned and billed)
- `env` — a comma-separated list of **environment variable names** Vercel should prompt the user to fill in during the import flow (`VITE_SUPABASE_URL,VITE_SUPABASE_ANON` at minimum; optionally `VITE_PINATA_JWT` or whichever pinning var applies)
- `envDescription` / `envLink` — human-readable help text and a link Vercel shows next to the env-var prompts, which is where the wizard can point the user back to `.env.example`'s existing instructions rather than duplicating them

The important design property: **only variable names are passed in the URL, never values.** Vercel's own import screen then asks the user to type in their Supabase URL/anon key and pinning JWT directly into Vercel's own form. If this holds up under implementation **[VERIFY]**, the platform never receives, transmits, or stores any of those secret values at any point — not even transiently in browser memory for the purpose of building a link. This is the single biggest lever in this whole design and the reason §2.4/§2.5 below are written the way they are.

**[VERIFY], and important to flag honestly:** it is not fully certain from documented knowledge alone whether Vercel's clone flow, when pointed at a repo the user does *not* yet have write access to, performs the git-provider fork/import into the user's own connected account as part of the same flow, or whether the user must have already completed a separate fork (§2.1/§2.2) first. If Vercel's flow already handles that transparently, step 1 of the wizard (§3.1) could collapse entirely — the user would go straight to a single Vercel link that does both the fork and the deploy. This is flagged as the biggest open implementation question in §5, not resolved here, because getting it wrong changes the wizard from three steps to effectively one.

### 2.4 Supabase — the weakest link for one-click, and the one requiring the most manual instruction

There is no Supabase equivalent of Vercel's deploy-button URL that spins up a *new* project pre-configured from a template as far as documented knowledge here can confirm. Project creation requires a logged-in Supabase dashboard session, an org selection, a region, and a database password set by the user — normal manual steps, not skippable via a deep link. **[VERIFY]** whether Supabase has since added a project-creation deep link or "quickstart" flow comparable to Vercel's — this is exactly the kind of thing that changes and should be re-checked, since it would meaningfully simplify this step if it exists.

Given that, this spec's realistic design for Supabase is: a deep link to `https://supabase.com/dashboard/new` (or the org-picker equivalent) to save the user one navigation step, clear instructions for the two remaining manual actions (create project; run the schema), and **one genuinely new, useful piece of tooling**: a build-time-generated, single concatenated SQL file assembled from `supabase/migrations/*.sql` (in filename order, since the existing migrations are already numbered `001_...` through `013_...`) that the wizard offers as one "copy this into your SQL editor" block instead of thirteen separate files the user would otherwise have to run one at a time in the right order. This is a real, scoped, useful addition — see §4.4.

The user then copies their new project's URL and anon key from *their own* Supabase dashboard (Project Settings → API) directly into Vercel's env-var prompt from §2.3 — never into our app at all, per the same design property.

### 2.5 IPFS pinning — reuse what's already shipped, don't hard-commit to nft.storage

The original backlog framing named nft.storage specifically. As §1 notes, the app's actually-shipped `PinningService` implementation today is **Pinata**, not nft.storage, and the interface is explicitly designed to be provider-agnostic. Two things worth flagging honestly rather than papering over:

- Whichever provider is used, the mechanism is identical to §2.4's pattern and already proven in this codebase: the user creates their own scoped, write-only API key in the provider's own dashboard (Pinata's "Files: write"-only scoped key is the shipped example) and pastes it as a `VITE_*` env var into Vercel's prompt — same "we never see the value" property.
- **[VERIFY]** nft.storage's current status and API-key model before committing the wizard's copy to naming it specifically. nft.storage underwent service changes/consolidation in the 2024 timeframe that this document's training knowledge cannot confirm the current state of with confidence. Recommend the wizard's UI say "your pinning provider" generically, defaulting to whatever `PINNING_SERVICES` in `ipfs-pinning.ts` reports as configured/available, with nft.storage added as a second `PinningService` implementation only after a human confirms it's still a going concern with a stable API-key model matching Pinata's shape.
- Pinning is optional today (`addSettlement()` never required it) and should stay optional in this wizard too — a self-hosted instance is fully functional without it, durability is the only thing it adds.

---

## 3. The wizard: three steps, one explicit gate

### 3.1 Step 1 — "Get the code into your own account"

**Screen:** two buttons, "Create my repo on GitHub" / "Create my repo on GitLab," each a plain `<a>` deep link per §2.1/§2.2, opening in a new tab. No form fields, no account connection inside our app at all.

**What the user does:** clicks, lands on GitHub/GitLab's own site already logged in (or logs in there if not), reviews the pre-filled repo name/visibility, clicks "Create repository" themselves.

**What the app stores:** nothing server-side. Optionally, a text field ("paste your new repo's URL here") the user can fill in purely so the wizard can pre-fill §3.2's Vercel link's `repository-url` — held in page/component state and `localStorage` only, never sent to any server we control, and skippable (leaving it blank just means the user pastes their repo URL manually into Vercel's own import screen in step 3).

**Progress tracking:** self-reported. A "Done — I created my repo" checkbox advances the wizard. This is not verified against GitHub/GitLab's API in the MVP — see §5 for the tradeoffs of adding real verification later.

### 3.2 Step 2 — "Stand up your backend"

**Screen, part A (Supabase):** a deep link to Supabase's dashboard new-project screen, a "Copy migration SQL" button (the concatenated-migrations file from §2.4), and instructions: create the project, paste the copied SQL into the SQL editor and run it, then note your Project URL and anon key from Project Settings → API — you'll paste those into Vercel in the next step, not here.

**Screen, part B (pinning, optional):** a collapsed "optional: durability via IPFS pinning" section naming whichever provider(s) `ipfs-pinning.ts` currently supports, with the same "create your own scoped key in their dashboard" instruction, explicitly marked skippable.

**What the app stores:** nothing. No field in this step ever asks the user to type a Supabase URL, anon key, or pinning key into our app — those are typed once, directly into Vercel's own prompt in step 3, per §2.3's design property. If that property turns out not to hold under implementation **[VERIFY]**, the fallback (holding the values in page memory only, for the seconds it takes to build the Vercel link, never persisting or transmitting them) is the documented next-best option, not silently substituted for the ideal one.

**Progress tracking:** self-reported, same as step 1.

### 3.3 Step 3 — "Deploy — and the consent gate"

This is where §0's stated goal has to become a specific, real gate rather than a checkbox at the top of the wizard. The gate sits **immediately before the "Deploy to Vercel" button becomes clickable**, on the last screen our own app renders before handing off to Vercel's site — because that is the actual point of no return: the moment before it, nothing exists yet outside the user's own accounts in a form anyone else can reach; the moment after it, a live, publicly reachable, billed instance exists under the user's name that SCD Hub has no ability to administer, moderate, or undo.

**Screen contents:**
1. A summary: repo URL (if provided), which Supabase project (self-reported, not verified), which pinning provider (if any).
2. Consent copy — **drafted here as a strawman only, not final language; needs an actual legal review pass before shipping** (§4.1): *"I understand I am about to deploy my own, independently owned and operated copy of Exotopia. SCD Hub does not administer, moderate, or take responsibility for this instance — its content, hosting costs, security, and legal compliance in my jurisdiction are mine. I can shut it down at any time by removing it from my own Vercel/GitHub/GitLab/Supabase accounts."*
3. A checkbox tied to that copy, disabled/unchecked by default.
4. Only once checked: the "Deploy to Vercel" button (§2.3's link) becomes active.

**What the app stores:** the checkbox acceptance is logged locally, mirroring `logFieldWaiverAcceptance()` exactly — a timestamped entry in a `localStorage` array (e.g. `exo.self-publish-consent-log`), not sent to any server. This is deliberately the same shallow, client-local logging posture as the existing PFAS field-waiver pattern — good enough to show *this browser* recorded an affirmative, timestamped acceptance before the button unlocked, not a server-side audit trail. Whether that's sufficient evidentiary weight for this specific action (vs. the field-waiver case) is itself part of the legal-review ask in §4.1, not assumed here.

**What happens next:** clicking "Deploy to Vercel" opens `vercel.com/new/clone?...` in a new tab. Everything after that point happens on Vercel's site, using Vercel's own relationship with the user's GitHub/GitLab account, ending in a live deployment the wizard has no further involvement in.

### 3.4 What the wizard explicitly never asks for

No GitHub/GitLab/Vercel/Supabase/pinning-provider password, PAT, or OAuth token, at any step. No field in this wizard is a secret-value input that submits to our servers. If a future iteration needs real (not self-reported) verification of any step, that's a deliberate, separate design decision requiring its own security review — not something to slip in as a "just add a token field" shortcut later.

---

## 4. The four lenses

### 4.1 Legal

The BYOA architecture changes the shape of the exposure, not just its size. Under the original OAuth-custody framing, SCD Hub would have been an active participant in every deploy — holding tokens, making API calls on the user's behalf, and therefore plausibly a co-actor in whatever the resulting instance did or contained. Under this design, SCD Hub gives instructions and links; the user performs every account-creating, code-deploying, and content-publishing action themselves, in their own name, under their own vendor accounts and billing. That's a materially different position, and it's the same one `compliance/INDEX.md`'s operating strategy already stakes out for the platform generally ("infrastructure, not a custodian") and the same "can't un-publish open-source code" logic already applied to the GPL license itself — this spec extends that logic to deploy tooling.

That said: **the consent-step copy in §3.3 is a strawman, not a finished legal artifact.** It needs the same kind of review `RISK_REDUCTION_RECOMMENDATIONS.md` §3/§7 already asks for elsewhere in this codebase (an actual click-through with logged timestamp, not a buried clause) — but the specific language ("solely responsible," what counts as adequate disclosure of hosting-cost and jurisdiction-compliance obligations) is exactly the kind of thing that should go through the same legal-review pass the earlier planning pass explicitly recommended for the custodial version, scoped down to just this narrower question rather than a full threat-model of a token-custody system that this spec no longer proposes building.

### 4.2 Security

The stated goal — the platform never holds a credential capable of acting on the user's behalf — holds up per-vendor as researched in §2, with the caveats already flagged inline:

- **GitHub/GitLab:** no token at all in the MVP design (§2.1/§2.2). Strongest case.
- **Vercel:** no token, assuming §2.3's env-var-names-only property holds under implementation **[VERIFY]**. This is the load-bearing assumption of the whole design — if Vercel's clone flow turns out to require a referring-site API key or OAuth app installation to prefill `env` values (rather than just prompting the user to type them), the design needs to fall back to the page-memory-only option noted in §3.2, and that fallback should be treated as a real design regression worth flagging to a human, not silently accepted.
- **Supabase:** no token — the app never touches Supabase credentials at all in this design, per §2.4.
- **Pinning:** no token — same scoped, user-generated, client-side-only pattern already shipped for Pinata, per §2.5.

Where the app does hold *something* transiently (an optional, user-pasted repo URL in §3.1, held in page state/`localStorage` to prefill a later link) — that's public, non-secret data the user is choosing to give us for their own convenience, not a credential, and it's the only thing in the whole flow that isn't zero-persistence. Worth naming precisely rather than rounding it up to "we store nothing" or down to "we store secrets."

### 4.3 Privacy

In the MVP as designed, the platform learns nothing account-specific about the user's external vendor accounts — no GitHub username, no Vercel org/team, no Supabase project ref, no email tied to any of those services — because every "did you complete this step" signal is a self-reported checkbox, and wizard progress state lives in `localStorage` on the user's own device, the same pattern already used for settlement state (`storage-cipher.ts`) and the field-waiver log. This directly answers the question posed in the task framing this spec responds to: does the wizard need to know the user's GitHub username to show progress — no, a local, unverified checkbox is sufficient for the MVP, and if real verification is ever added (§5), that's the moment this privacy analysis needs to be redone, not before.

The one voluntary exception is the optional repo-URL paste (§3.1) — client-side only, never transmitted, and the user can see exactly what it's for (prefilling the next deep link) rather than it being an opaque "we're tracking your GitHub identity" collection point.

If a future phase adds an opt-in "list my self-hosted instance in a community directory" feature (the natural connection point to `SPEC_SELF_HOSTED_NETWORK.md` §4/§5 Q1's federation-export direction and `exportForSelfHost()`), that is a **separate, explicit, opt-in publish action** — not something this wizard does implicitly as a side effect of walking through the deploy steps. Flagged as out of MVP scope in §5, not assumed as part of this design.

### 4.4 UX / dev-tooling this actually requires

This is genuinely new work, not a restatement of what exists:

- **A new wizard page** (e.g. a `/self-publish` route, or an extension of `CommunityNodesPage.vue`'s existing self-host affordance) — a 3-step stepper UI matching this repo's existing dark, monospace `cn-*`/`dp-*` visual language rather than introducing a new one.
- **Deep-link builder functions** — pure, no-network-call string builders for the GitHub template URL, GitLab fork URL, Vercel clone URL, and Supabase dashboard URL, in the same shape as `src/lib/settlements.ts`'s address-key builders (pure functions, easily unit-testable, no side effects).
- **A concatenated-migrations artifact** for §3.2's "copy migration SQL" button — either a small build-time script (following this repo's existing `scripts/generate-*.mjs`/`.py` convention) that emits a static file the wizard fetches, or a runtime fetch-and-concatenate of the 13 files in `supabase/migrations/` in filename order. The build-time version is preferred — it avoids the wizard needing to fetch 13 separate files at runtime and matches the existing pattern of static-JSON-generated-at-build-time already used elsewhere in this codebase (`generate-topo-params.py`, `generate-region-maps.mjs`, etc.).
- **A local consent-log utility** — a small, reusable version of `logFieldWaiverAcceptance()`'s pattern, since this is now the second feature in the codebase wanting "timestamped, localStorage-logged, gate-before-an-action" consent (the PFAS field waiver being the first) — worth extracting into a shared helper rather than a second copy-pasted implementation, flagged as a small refactor opportunity, not required for MVP.
- **Copy review** for every instructional string in the wizard (not just the consent gate) — accuracy against live vendor UIs matters more here than in most of this codebase, since a stale "click this button" instruction that no longer matches a vendor's current onboarding screen actively confuses a non-developer user, which is exactly the audience this feature is for.

---

## 5. Open questions

**Q1 — Does Vercel's clone flow fork/import the source repo into the user's own git account automatically, or does the user need to have already forked it (§3.1) first?**
This is the single biggest unresolved question in this spec. If Vercel's flow already handles it, step 1 may not need to be a separate wizard screen at all — the whole wizard could collapse toward "connect Supabase, then one Vercel link." If it doesn't, the three-step structure as designed is correct. **[VERIFY]** against Vercel's current docs before any implementation work, since it changes the wizard's actual shape, not just its copy.

**Q2 — Does §2.3's env-var-names-only property actually hold?**
The entire "we never see a secret value" security posture (§4.2) rests on Vercel's `env=` parameter only needing variable *names*, with Vercel itself prompting the user for values during import. If that's wrong and Vercel needs values pre-supplied some other way, the design has to fall back to page-memory-only handling (still not persisted, still not sent to our servers, but a real downgrade from "never touches our app at all"). **[VERIFY]** before implementation.

**Q3 — Is nft.storage still a going concern with a stable, user-generatable API-key model matching Pinata's shape?**
The backlog idea named it specifically; the shipped code doesn't use it. **[VERIFY]** current status before writing wizard copy that names it, or generalize the copy to "your pinning provider" and treat adding nft.storage as a `PinningService` implementation as a separate, smaller follow-up.

**Q4 — Is self-reported (unverified) step completion good enough for v1, or does the wizard need real verification** (e.g. a device-flow, read-only-scoped GitHub/GitLab token just to confirm a repo exists; polling a pasted deployment URL for a health check)?
Recommend shipping self-reported-only for v1 — it fully preserves the zero-credential security/privacy posture in §4.2/§4.3, at the cost of the wizard not being able to tell the user "actually, that didn't work." Revisit only if support burden from broken/incomplete self-hosted attempts turns out to be real, not preemptively.

**Q5 — Should completing this wizard offer an opt-in listing in a community directory of self-hosted instances?**
Natural tie-in to `SPEC_SELF_HOSTED_NETWORK.md` §4/§5 Q1, and to `exportForSelfHost()` as prior art. Deliberately scoped out of this spec's MVP (§4.3) — a separate, explicit publish action if built at all, not a default behavior of finishing the wizard.

**Q6 — Is the repo currently marked as a GitHub template repository, and what is GitLab's current fork-URL parameter shape?**
Small, concrete, pre-implementation checklist items (§2.1/§2.2) rather than open design questions, called out here so they don't get lost.

**Q7 — Legal review of the §3.3 consent copy.**
Explicitly not resolved by this document — see §4.1. The copy in §3.3 is a strawman for that review to react to, not a draft intended to ship as-is.

---

## 6. Implementation phases (proposed, not started)

- [ ] **Phase 1 — MVP wizard.** Steps 1–3 as designed in §3, self-reported progress only (Q4 resolved as "not yet"), no community-directory tie-in (Q5 out of scope), consent copy still a strawman pending legal review (Q7 open — this phase should not ship until that review lands). Blocked on Q1/Q2/Q3/Q6 being verified against live vendor docs first, since they change the actual step structure, not just copy.
- [ ] **Phase 2 — polish.** Extract a shared consent-log helper (§4.4) if a second consumer besides the PFAS field waiver makes the duplication worth resolving. Revisit Q4 (verification) only if real support burden shows up.
- [ ] **Phase 3 — community directory tie-in (optional, separate feature).** Opt-in "list my instance" as its own explicit action, connecting to `SPEC_SELF_HOSTED_NETWORK.md` §4/§5's still-unresolved federation questions — not gated on this spec, and this spec's MVP should ship without it.

---

## 7. Related documents

- `SPEC_SELF_HOSTED_NETWORK.md` — the manual 3-step baseline this wizard wraps tooling around; §4/§5 Q1's federation-export direction is where Q5 above would eventually connect
- `SETTLEMENT_ADDRESS_API.md` — the IPFS-pinning-not-blockchain durability model §2.5 reuses; also the source of the "be a tool, not a custodian" framing this spec extends
- `SPEC_COMMUNITY_NODES.md` §4 — `exportForSelfHost()`, the closest existing prior art for a user taking their own data elsewhere
- `RISK_REDUCTION_RECOMMENDATIONS.md` §3/§7 — the logged-consent-before-consequential-action pattern §3.3 reuses
- `compliance/INDEX.md` — "Our operating strategy" section, the "cannot un-publish open-source code" and "be a tool, not a custodian" language §4.1 leans on
- `src/lib/ipfs-pinning.ts` — the shipped `PinningService` interface and Pinata implementation §2.5 is grounded in
- `src/pages/PfasCitizenSciencePage.vue` — `logFieldWaiverAcceptance()`, the exact pattern §3.3's consent log reuses
- `src/pages/DocPage0.vue` → "Run Your Own Instance" — the in-app docs prose this wizard would eventually sit alongside or replace
- `.env.example` — the env-var names §2.3/§3.2 reference; also the source of the "scoped, `VITE_`-safe key" convention this spec extends to every vendor credential

---

*SCD Hub · Exotopia.org · GPL v3*
