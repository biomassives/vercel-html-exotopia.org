# SPEC_API_PRODUCT.md — Exotopia's Data/API Surface as a Product

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Planning document. Nothing in this file stands up new infrastructure. Where it proposes
schema or naming changes, those are recommendations for a human to schedule as ordinary
migrations — this file does not apply any of them.*

---

## 0. What this is, and why it's separate from the audit page

`/api-surface` (the in-app page shipped alongside this doc) documents what Exotopia's
data/API surface **is today** — every table, every static JSON file, every pure function,
with an honest built/specified/aspirational label on each. This document is the other half:
given that inventory, (1) what would a genuinely *coherent* version of it look like, and
(2) what would it take for more than one independently-run instance to agree on it well
enough to interoperate. Read the audit page first if you haven't; this document assumes it.

This is a plan, in the same register as `SPEC_SELF_HOSTED_NETWORK.md` and
`SETTLEMENT_ADDRESS_API.md`: it separates **built** (exists, working, in the repo today),
**specified** (designed here or in a sibling spec, not implemented), and **speculative**
(a direction worth naming, not yet designed in enough detail to build). §4 keeps a running
scorecard.

---

## 1. The honest starting point

Exotopia's "API" today is four things that have never been designed as one system:

1. A Postgres/Supabase schema, `public` plus a separately-stood-up `eco_ops` schema, reached
   two ways: through the app's own Supabase client calls, and — because Supabase
   auto-generates PostgREST — through `/rest/v1/<table>` directly, gated by RLS. **This second
   path is a real, already-existing public read API for every table with a public SELECT
   policy** (`points_catalog`, `country_standards`, `focus_areas`, `ecology_sites`,
   `method_proposals`, `sme_profiles`, published `community_nodes`/`settlement_profiles`,
   and more) — it has just never been *documented* as an API, so nobody outside this codebase
   knows it's there or that it's covered by RLS rather than by a hand-written contract.
2. A large static-JSON data surface (astronomy catalogs, generated per-system/per-cluster
   files, topo-params, the eco-ops video library) served as plain files from `public/`, with
   no schema versioning, no content negotiation, no index of what exists beyond "grep the
   fetch calls" — which is exactly what the audit page had to do to enumerate it.
3. A set of pure TypeScript functions (`settlements.ts`, `moon-settlement.ts`,
   `resonance-split.ts`, `ipfs-pinning.ts`) that are a real, dependency-free SDK for anyone
   building against Exotopia's address/settlement model client-side — but they've never been
   packaged, versioned, or documented as one, so "the settlement address SDK" isn't a thing
   anyone outside this repo could name or import separately.
4. `SPEC_EXOLOC_ADDRESS.md`'s address grammar, which is the one piece of this surface that
   already reads like a real spec (versioned scopes, a registry table, a documented but
   unbuilt public API) — and `SETTLEMENT_ADDRESS_API.md`, which already does exactly the
   built-vs-specified separation this document generalizes to the rest of the surface.

None of these four were designed against each other. The refined model in §2 doesn't propose
replacing any of them — each is doing real work — it proposes naming the relationships between
them explicitly and fixing the handful of places where the seams show.

---

## 2. Refined core data model

### 2.1 The real entities

Stripped of table-name noise, everything in §1 is built from six kinds of thing:

| Entity | What it actually is | Where it lives today |
|---|---|---|
| **Identity** | A member (`public.members`, `auth.users`) and, separately, whether that account has admin standing (`admin_members`) or a self-attested participation mode (`member_participation_mode`) | `public` schema, migrations 001/002/018 |
| **Location** | An exolocation address string (`exotopia:{scope}:{path}`) — a pure, offline, unenforced computation with no collision authority, per `SETTLEMENT_ADDRESS_API.md` | `SPEC_EXOLOC_ADDRESS.md` grammar; built by `settlements.ts`/`moon-settlement.ts` |
| **Claim** | A settlement record binding an identity to a location, with a durability story (localStorage always; `public.settlements`/`settlement_items` if signed in; IPFS pin if the owner opts in) | `settlements.ts`, migrations 015/016/017, `ipfs-pinning.ts` |
| **Published surface** | A claim's or a business's public-facing page — `settlement_profiles` (a settlement, opt-in publish) and `community_nodes` (a business/creative listing, not necessarily tied to a claim) are the same shape (owner, moderated status lifecycle, public-when-published RLS) solving two different product needs | migrations 008, 012 |
| **Field-work record** | A site → project → log-entry chain, repeated identically three times: PFAS (003), ecology/biodiversity (009), and eco_ops water-quality/monitoring (013) | migrations 003, 009, 013 |
| **Ledger entry** | An append-only, server-computed reward_events row, always derived through a `SECURITY DEFINER` RPC (`award_self_reported`, `award_quiz_completion`, `debit_construction`, the trigger-only `mentor_session_reward`/`proposal_endorsement_reward`) — never a raw client INSERT since migration 007 | migrations 002, 007, 014 |

Everything else in the schema (support_messages, app_error_logs, deletion_requests,
video_suggestions, knowledge_keeper_records) is operational plumbing around these six, not a
seventh core concept.

### 2.2 The pattern that's already real, and should be named

**Site → Project → Log-entry, repeated three times.** `003_pfas_citizen_science.sql`'s
`focus_areas → decon_projects → project_log_entries` and `009_ecology_biodiversity.sql`'s
`ecology_sites → ecology_projects → ecology_log_entries` are structurally identical — same
column shapes, same RLS posture (fully public read, owner-scoped write, append-only logs),
same points-catalog integration. `013_eco_ops_schema.sql`'s `sites → monitoring_records →
{water_quality_obs, macroinvertebrate_samples}` is the same shape again, in a separate schema,
with a stricter (owner/admin-only) RLS posture because it also carries a `private` access
tier and photo evidence.

This is not a coincidence to clean up by merging the tables — PFAS and ecology are
intentionally public-by-default citizen science with a lighter trust model, while `eco_ops`
carries `SPEC_ECO_OPS_API.md`'s multi-country regulatory-submission and SME-payment weight and
needs the stricter model. **The refinement is naming the pattern**, not merging the tables:

> **Site-Project-Log pattern**: a place with an `access_status`/`access_tier` lifecycle, a
> specific effort at that place with a lifecycle `status`, and an append-only log of dated
> entries with a free-form `metrics jsonb` column. Any future citizen-science domain (a fourth
> one is plausible — see `SPEC_BIODIVERSITY_ACTION_PLANS.md`'s open authorship questions)
> should default to this shape rather than re-deriving it, and should say explicitly in its
> migration header which existing instance (PFAS's public model or eco_ops's stricter one) it
> is following and why.

**Published-surface duplication.** `community_nodes` and `settlement_profiles` are two
94%-identical implementations of "an owner publishes a moderated public page, can toggle
published/archived, cannot self-reverse an admin takedown, gets a generated slug or reuses an
address." This duplication is a real refinement candidate — a `published_surfaces` supertype
with `community_nodes` and `settlement_profiles` as typed extensions would remove the repeated
trigger logic (`enforce_*_status_transition`, `enforce_*_creation_limit`) — but is **out of
scope to actually do** here: both tables are live, migrating them is a real data migration
with RLS-policy risk, not a naming fix, and neither this document nor a human skimming it
should read "name the pattern" as "go merge these tables now."

### 2.3 Naming inconsistencies found

| Inconsistency | Where | Proposed fix (naming only, not a migration) |
|---|---|---|
| `hostname`/`planet_name` vs `parent_planet`/`host_star` for the same astronomical concept | `settlements` table columns vs `moon-settlement.ts`'s `MoonReferenceBody` | New code should use `hostStar`/`planetName` (the `settlements.ts` convention, since it's the one with a server-side table) — `moon-settlement.ts`'s naming predates it |
| `exolocation` (table/interface field) vs `exoloc_address` (community_nodes column, `defender-nav.types.ts`, most `.vue` usages) for literally the same string | `public.settlements.exolocation`, `public.settlement_profiles.exolocation` vs `public.community_nodes.exoloc_address` | Standardize new columns on `exoloc_address` — it's the more common name across the codebase by a wide margin; `exolocation` on the two settlement tables is now a hard-to-fix legacy name, document it as such rather than pretend it's the standard |
| Two independent "branch settlement" foreign keys with the same shape (`decon_projects.branch_settlement_id`, `ecology_projects.branch_settlement_id`) both pointing at `public.branch_settlements` | migrations 003, 009 | Already correctly shared — no fix needed, called out here so a future `eco_ops`-side "simulated/branch" feature reuses the same table rather than inventing an `eco_ops.branch_settlements` |
| `focus_areas`/`ecology_sites`.`base_address` vs `community_nodes`.`exoloc_address` vs `settlements`.`exolocation` — three different column names for "an optional exoloc address this row is attached to," none of them foreign-keyed to anything (the astronomical catalog isn't a table this schema owns) | migrations 003, 008, 009, 015 | Not fixable without a real migration on live tables; documented here as the reason a genuine `/api/v1/exoloc/body/{slug}` endpoint (§2.4) would need to search four differently-named columns across three tables, not one |

### 2.4 What a genuine `/api/v1/...` read layer would need

`SETTLEMENT_ADDRESS_API.md` §3 already thought through the address/IPFS side of this
question and concluded the missing piece is a **directory** (address → CID), not a claim
registry, and that building one repeats the exact custodial-liability tradeoff
`compliance/INDEX.md` already rejects. That conclusion holds and this section doesn't
re-litigate it. What's new here is the *rest* of the surface — the citizen-science and
published-surface tables — where a read API is a much smaller step than a directory, because
most of the work already exists:

- **It mostly already exists, unpackaged.** Every publicly-readable table in §2.1 (points
  catalog, country standards, published community nodes/settlement profiles, all three
  citizen-science domains' sites/projects/logs, SME profiles) is already reachable at
  `<supabase-url>/rest/v1/<table>?<postgrest-filter>` with no code to write. The gap is not
  "build an API," it's "document the one that's already live" — which fields are public,
  which PostgREST operators are supported (`eq.`, `cs.{}`, `gte.`/`lte.`, `in.(...)`, per
  `SPEC_ECO_OPS_API.md` §3.1), and that it is keyed to a specific hosted Supabase project's
  URL, which is a property every self-hosted instance sets independently (§3).
- **A stable `/api/v1/...` path in front of it is still worth having**, not because PostgREST
  is inadequate, but because a self-hosted instance's Supabase URL is not a stable public
  contract — it changes if an operator migrates hosting, and two instances' URLs are never the
  same. A thin, versioned path (`exotopia.org/api/v1/sites?type=water_quality&country=GB`,
  proxied to the underlying PostgREST call by a Cloudflare Worker or Vercel function, matching
  the existing `/api/proof/eco-ops`-style bridge pattern in `SPEC_ECO_OPS_API.md` §3.3) gives
  external consumers — a Rivers Trust dashboard, a partner org's own tooling, another Exotopia
  instance — one thing to point at regardless of which instance answers it, and is the natural
  home for the address-resolution endpoints `SPEC_EXOLOC_ADDRESS.md` §5 already specifies
  (`GET /api/v1/exoloc?address=...`, still not built, still gated on §3's directory question).
- **Versioning convention (new — none exists today).** Nothing in this codebase currently
  says what "v1" would mean if it broke. Proposed: a genuine `/api/v1/...` surface is versioned
  by *response shape*, not by database schema — `v1` is a promise about the JSON contract for
  each documented endpoint, independent of migration numbers, so a table can gain columns
  (already the norm — see `017_settlement_fingerprint.sql`, `018_pfas_log_fingerprint.sql`
  each adding one column to an existing table) without breaking `v1` callers, and a `v2` only
  gets minted when a response shape needs a breaking change, not on every migration. This
  needs a human decision before any code is written; it is not implemented anywhere today.
- **Access-tier translation is the actual hard part, not the routing.** `sites.access_tier`,
  `knowledge_records.access_tier`, `sites.precision` (the lat/lng fuzzing tier) all need to be
  correctly enforced by whatever sits in front of PostgREST — a public v1 endpoint must never
  become a way to bypass RLS by construction (e.g., a proxy that forwards the anon key
  unconditionally is fine, since RLS still applies; a proxy using the service-role key to
  "simplify" queries would defeat every RLS policy in this document and must never be built
  this way).

---

## 3. Distribution plan: what "more than one instance" needs from the data model

`SPEC_SELF_HOSTED_NETWORK.md` §4 already named the two hard problems plainly and this plan
doesn't relitigate them — it treats the data model itself as the prerequisite infrastructure
those two problems would eventually need, and stops there. Nothing below is a federation
protocol; it's what would have to be true about the schema *before* one could be designed.

### 3.1 Why the data model has to go first

Two instances can't reconcile overlapping edits (unsolved problem #1) or establish trust
between each other (unsolved problem #2) if they don't agree on what a "site," a "settlement,"
or a "monitoring record" *is* well enough to recognize the same real-world thing described
by two different databases. Today that agreement is implicit — it's whatever
`013_eco_ops_schema.sql`'s comment-documented-after-the-fact schema happens to say a given
week, on one hosted project. Two independent operators cloning this repo today would each get
a working, RLS-correct instance (§2 of `SPEC_SELF_HOSTED_NETWORK.md` is real and resolved) —
but nothing says their two `eco_ops.sites` tables mean the same thing if either operator later
hand-edits their own schema, which is exactly how the original `eco_ops` schema drifted from
its spec before `013_eco_ops_schema.sql` reconstructed it from `SPEC_ECO_OPS_API.md` §2.1.

### 3.2 A versioned, documented schema contract

Proposed shape for what "stable enough to interoperate on" would need to mean, built from
pieces that already exist:

1. **Migrations are already the mechanism — the gap is discipline, not tooling.** The
   001–018 migration sequence *is* a versioned schema history; the fix isn't a new versioning
   system, it's two rules going forward: (a) never reuse a number two applied migrations
   already share — the `015`/`018` collision documented on the audit page happened once and
   should be the last time, and (b) a migration that changes a table's *meaning* (not just
   adds a column) gets a comment header stating what changed and why, the way `013`, `017`,
   and `018_pfas_log_fingerprint.sql` already do. This alone would make "what schema does
   instance X run" a `SELECT` against a migrations-tracking table plus a diff against this
   repo's `supabase/migrations/`, rather than something that requires dashboard access to
   verify — which is precisely the problem `013`'s own header describes solving for the
   original out-of-band `eco_ops` schema.
2. **A machine-readable schema manifest, generated, not hand-maintained.** A small script
   (in the spirit of `scripts/generate-topo-params.py`/`scripts/fetch-exoplanet-archive.mjs`
   — this repo already has an established convention of generator scripts producing committed
   static JSON) that introspects `supabase/migrations/*.sql` and emits a `schema-manifest.json`
   listing every table, column, type, and RLS policy. This is the concrete deliverable a
   "versioned, documented schema contract" would cash out as — not a new spec file to keep in
   sync by hand (the exact failure mode `013`'s header describes: a schema that drifted from
   its own spec because nothing generated one from the other), but a build artifact every
   instance can produce from its own migrations and diff against another instance's manifest
   to answer "do we agree on what a site is" mechanically. **Not built. Proposed here for the
   first time.**
3. **The manifest is the thing federation would eventually version, not the app.** If
   `SPEC_SELF_HOSTED_NETWORK.md` §5 Q1's export/pull model (extending
   `exportForSelfHost()`) is ever built, the receiving instance's import step needs to know
   whether the exporting instance's `eco_ops.sites` row shape matches its own closely enough
   to import safely. A schema manifest with a version number is what that check would run
   against — "this export was produced by an instance running schema-manifest v3; I'm running
   v3 too, safe to import" — rather than the receiving instance guessing from the JSON shape
   at import time.

### 3.3 Connecting to `ipfs-pinning.ts`'s plugin architecture

`ipfs-pinning.ts` already solved a smaller version of "more than one provider, one interface"
for pinning: `PinningService` is a two-method interface (`isConfigured()`, `pin()`), one real
implementation ships (Pinata), and the header explicitly says the point is that "a different
provider... can be added later without touching callers." The distribution plan's actual
contribution here is narrow: **that same shape generalizes to instance-to-instance data
exchange**, once §3.2's manifest exists to make "compatible enough to exchange with" a
checkable fact rather than an assumption:

```ts
// Speculative — no such interface exists today. Sketched here to show the
// shape the plugin pattern would take, not as code ready to add.
interface InstanceExportTarget {
  readonly name: string          // e.g. "Local file download" (today's only real target)
  isConfigured(): boolean
  publish(bundle: SelfHostExportBundle): Promise<string>   // returns a locator: URL, CID, file path
}
```

Today `exportForSelfHost()` (`src/stores/community-nodes.ts`) has exactly one "target": a
JSON blob the browser downloads, per `CommunityNodesPage.vue`. A second target — pin the
export bundle to IPFS via the *already-shipped* `ipfs-pinning.ts`, giving a receiving
instance's admin a CID to fetch instead of a file to be emailed — is the natural first
extension, and reuses shipped code rather than adding a dependency. A third target (push
directly to another instance's import endpoint) is the "sync" end of
`SPEC_SELF_HOSTED_NETWORK.md` §5 Q1's spectrum and should stay unbuilt until Q1/Q2 there are
actually answered — this document does not attempt to answer them.

### 3.4 What this plan deliberately does not do

- **No new centralized service.** Every proposal above (migration discipline, a generated
  manifest, an export-target interface) runs entirely inside each independent instance's own
  deploy. Nothing here asks any instance to register with, authenticate against, or depend on
  an Exotopia-operated server — that would be exactly the custodial authority
  `compliance/INDEX.md`'s "tool, not custodian" strategy and `SETTLEMENT_ADDRESS_API.md` §2's
  "no collision authority, permanently" both already rule out.
- **No attempt to solve conflict resolution or trust/identity.** Those remain exactly as open
  as `SPEC_SELF_HOSTED_NETWORK.md` §4 left them. A schema manifest makes "do these two
  instances agree on what a site is" answerable; it says nothing about whose edit wins when
  they both log the same real-world site, or how instance A verifies that instance B's export
  is what it claims. `DocPage0.vue`'s "per-node pubkey pinning" idea (mule-bot-scoped today)
  is still the closest existing thinking on the identity half, per `SPEC_SELF_HOSTED_NETWORK.md`
  §4 — this document doesn't extend it, only points at it again.
- **No implementation.** §3.2's manifest generator and §3.3's export-target interface are
  both "proposed, not built" — sized here so a human can schedule them as ordinary follow-up
  work, not so an agent should go build them off the back of this planning pass.

---

## 4. Built / specified / speculative scorecard

| Item | Status |
|---|---|
| PostgREST auto-REST on every public-RLS table | **Built** (Supabase default), never documented as an API until the `/api-surface` page |
| Exoloc address grammar, v1 scopes (`surface`, `orbital`, `lunar-orbital`, `stellar-orbital`) | **Built** |
| Exoloc address grammar, v2 scopes (`bh-orbital`, `trajectory`, `branch`, `collab`) | **Specified** in `SPEC_EXOLOC_ADDRESS.md`; `branch` partially built (`branch_settlements` table) |
| `GET /api/v1/exoloc` | **Not built.** Confirmed absent from the codebase as of this audit — `api/` contains only a static `gallery1.json` |
| Site→Project→Log pattern name (§2.2) | **Speculative** naming only; the three implementations are all built and stay as-is |
| Naming-inconsistency fixes (§2.3) | **Speculative recommendations**, not applied to any live column |
| A versioned `/api/v1/...` proxy in front of PostgREST | **Speculative.** Not designed beyond §2.4's sketch; no endpoint list, no auth model beyond "RLS still applies" |
| Response-shape versioning convention | **Speculative.** No decision has been made; §2.4 flags it as needing one |
| Migration-numbering discipline (§3.2.1) | **Speculative process change** — costs nothing to adopt, changes no code |
| Generated schema manifest | **Speculative.** Named and scoped here for the first time; no script exists |
| `InstanceExportTarget` / IPFS export target | **Speculative.** Sketched in §3.3; `exportForSelfHost()` itself is **built** with one target (file download) |
| Federation / live sync between instances | **Unsolved**, per `SPEC_SELF_HOSTED_NETWORK.md` §4 — this document does not attempt it |

---

## 5. Related documents

- `SETTLEMENT_ADDRESS_API.md` — the address/IPFS pipeline's built-vs-specified breakdown this
  document generalizes to the rest of the data surface
- `SPEC_EXOLOC_ADDRESS.md` — the address grammar, scope registry, and the still-unbuilt
  `/api/v1/exoloc` this document does not re-specify
- `SPEC_ECO_OPS_API.md` — the `eco_ops` schema's own fuller design and phase plan; §2.1–2.3
  there is the canonical schema this document's §2 draws on
- `SPEC_SELF_HOSTED_NETWORK.md` — the deploy-stack baseline (resolved) and the
  federation/conflict-resolution/trust questions (unresolved) this plan is scoped underneath
- `SPEC_COMMUNITY_NODES.md` §4 — `exportForSelfHost()`, the prior art §3.3 extends
- `src/lib/ipfs-pinning.ts` — the plugin-interface pattern §3.3 generalizes
- `compliance/INDEX.md` — "tool, not custodian," the operating strategy §3.4 stays inside
- The in-app `/api-surface` page — the built-today inventory this document assumes as input
