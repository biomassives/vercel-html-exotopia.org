# SPEC_LIFECYCLE_TRACKER.md — Unified Object Lifecycle & Dependency Supply-Chain Spec
**SCD Hub · GPL v3 · Draft v0.1**

---

## Purpose

The repo has independently grown five things that are all the same shape — a data object that moves through a small set of named states, gets reviewed by an admin, and leaves an audit trail:

| Object | Statuses | Where |
|---|---|---|
| `support_messages` | `new → in_progress → resolved` | migration 015, `AdminSupportMessagesPage.vue` |
| `video_suggestions` | `pending → approved / rejected` | migration 010, `AdminVideoSuggestionsPage.vue` |
| Bounty issues | `open → claimed → submitted → verified → paid` | GitHub Issues + labels, `/claim` bot |
| Security bulletins | `Open → Patched → Mitigated → No Action Required` | `SPEC_SECURITY_BULLETIN.md` (Draft, not built) |
| `app_error_logs` | *(none — append-only)* | migration 011 |

Each was built as a one-off: its own status `CHECK` constraint, its own `resolved_at`/`resolved_by` columns (or none), its own copy-pasted `Admin*Page.vue` with a `q-btn-toggle` filter and a `q-table`. That worked fine at five objects. It stops working at eight or ten — every new "thing that needs review" (dependency records, per Part B below; future ones like data-submission review, partnership-inquiry follow-up) means another bespoke table and another 200-line admin page that's 90% identical to the last one.

This spec has two parts:

- **Part A** — a generic lifecycle-object pattern, so the *next* tracked object doesn't need a new admin page, just a config entry.
- **Part B** — applying that pattern to a genuinely new object class this repo doesn't track at all today: **the npm dependencies themselves**, in response to the real risk class the user flagged (chalk/debug/ansi-* maintainer-account compromise, Sept 2025; typosquatted crypto-adjacent packages). This repo ships several chain SDKs to the browser — it is a plausible target for exactly that attack pattern, and right now nothing tracks dependency provenance as a lifecycle at all.

---

## Part A — Generic lifecycle object model

### A.1 Why a shared table beats N bespoke tables

The current pattern duplicates, per object: a `status` text column + `CHECK`, `resolved_at`, `resolved_by uuid REFERENCES members(id)`, `resolution_note`, an admin RLS policy pair, and a hand-written Vue admin page. None of that is domain-specific — the domain-specific part is just the row's own columns (`name`/`email`/`body` for a support message, `video_url`/`title` for a suggestion) and the *set* of valid statuses.

Split it in two:

1. **Domain tables stay domain tables.** `support_messages`, `video_suggestions`, etc. keep their own columns. They lose the `resolved_at`/`resolved_by`/`resolution_note` columns — those move to the shared table below.
2. **One shared, append-only `lifecycle_events` table** records every status transition for every tracked object, regardless of type:

```sql
CREATE TABLE public.lifecycle_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type   text        NOT NULL,   -- 'support_message' | 'video_suggestion' | 'dependency' | ...
  object_id     uuid        NOT NULL,   -- FK-by-convention into the domain table, not enforced (cross-table FK)
  from_status   text,                   -- null on creation
  to_status     text        NOT NULL,
  note          text,
  actor         uuid        REFERENCES public.members(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.lifecycle_events (object_type, object_id, created_at);
```

`current status` for any object is just "the most recent `to_status` in `lifecycle_events` for that `(object_type, object_id)`" — either read live with a `DISTINCT ON` query, or (if that gets slow) kept denormalized as a `status` column on the domain table that a trigger updates whenever a row lands in `lifecycle_events`. Start without the trigger; add it only if a real page needs the denormalized read.

RLS: `lifecycle_events` gets the same `is_admin()`-gated `SELECT` as everything else, and — this is the important part — **no client insert policy**, same reasoning as `support_messages` had none. Transitions are written by whichever server-side code (Worker, or an RPC function called from the admin UI under `is_admin()`) is authorized to change that object type. This gives one place to answer "who changed what, when" across every tracked object, instead of grepping five tables.

### A.2 One admin component, config-driven

Replace the growing pile of `Admin*Page.vue` files with one `AdminLifecycleQueue.vue` that takes a config object:

```ts
interface LifecycleQueueConfig {
  objectType: string
  table: string                 // domain table to select * from
  statuses: string[]            // valid to_status values, in workflow order
  columns: { key: string; label: string }[]   // which domain columns to show in the table
  detailSlots?: Record<string, Component>     // optional per-column custom rendering
}
```

`AdminSupportMessagesPage.vue` and `AdminVideoSuggestionsPage.vue` become two ~15-line files that instantiate `AdminLifecycleQueue` with different configs, instead of two full copies of the `q-btn-toggle` + `q-table` + `setStatus()` boilerplate. New objects (dependency records, a future data-submission review queue) get a config entry, not a new file.

**Migration path, not a rewrite:** this is additive. `support_messages`/`video_suggestions` keep working as-is until someone actually touches those admin pages next — convert opportunistically, don't stop to do a mechanical refactor of working code.

### A.3 What does *not* belong in this model

`app_error_logs` is correctly *not* a lifecycle object — it's an append-only log with no workflow, no "done" state. Forcing a status column onto it would be exactly the kind of speculative abstraction to avoid. The rule: an object belongs in the lifecycle model only if it has more than one meaningful state and something (admin, bot, submitter) needs to see *when* and *why* it moved between them. A log is not that.

---

## Part B — Dependency supply-chain lifecycle

### B.1 The risk, grounded in what's actually in this repo

In September 2025, several extremely widely-depended-on npm packages (`chalk`, `debug`, `ansi-styles`, `strip-ansi`, `color-convert`, `supports-color`, `wrap-ansi`, and others in the same maintainer's namespace) were compromised via a phishing attack on the maintainer's npm account. Malicious versions were published carrying a payload that scanned for browser-side crypto wallet activity and rewrote transaction destinations. The packages themselves were innocuous (terminal color/formatting) — the danger was entirely in *trust*: they're transitive dependencies of nearly everything, so the compromise propagated silently through `npm install` on any project that didn't pin exact versions.

This repo's actual exposure, checked directly against the five `package.json`/lockfile pairs in the tree:

| Location | Runtime deps | Notable | Lockfile | Dependabot coverage |
|---|---|---|---|---|
| `/` (main app) | `@solana/web3.js`, `ethers`, `algosdk`, `@metaplex-foundation/*`, `@supabase/supabase-js`, `gsap`, `three`, `vue`, … | `playwright` is listed under `dependencies`, not `devDependencies` — it's test-only, should move | yes | **yes** (`.github/dependabot.yml`, weekly, `directory: "/"` only) |
| `contracts/` | none (all dev) | `axios` present **transitively** (via `hardhat-toolbox`) | yes | no |
| `v1/` | `express` | legacy directory — confirm whether it's still deployed anywhere before deciding its dependency posture | yes | no |
| `diagrams/` | none (peer dep only, Observable notebook export) | — | **no lockfile** | no |
| `workers/support-inbox/` | **none** | only `wrangler`/`typescript`/`@cloudflare/workers-types` as devDependencies | yes | no |

`chalk` and `debug` do appear in this tree — but only as *transitive* dependencies of build tooling (eslint, wrangler, hardhat, playwright's own dependency chains), never as direct dependencies and never shipped into the browser bundle. That's meaningfully lower risk than a direct runtime dependency, but not zero: a compromised transitive package still executes at `npm install`/build time (postinstall scripts, or code that runs the moment `npm run build`/`wrangler deploy` imports it), which is CI/local-machine-level exposure, not just browser-bundle exposure.

The higher-value target in this repo specifically is the **main app's runtime dependency list** — `@solana/web3.js`, `ethers`, `algosdk`, `@metaplex-foundation/*`, `@supabase/supabase-js` are exactly the class of package a wallet-draining supply-chain attack would target, because they run in every visitor's browser, not just in CI. A typosquat of any of these (`@metaplex-foundaton/...`, `web3js` vs `@solana/web3.js`, etc.) landing in a dependency bump would be the realistic worst case here, not chalk/debug themselves.

`axios` has its own history of real CVEs (SSRF via redirect handling, ReDoS in earlier versions) independent of any single incident — it's worth tracking for that reason on its own, not just as a supply-chain-adjacent name.

### B.2 Dependency records as lifecycle objects

Apply Part A's model: each **direct** dependency, across all five `package.json` files, is a `lifecycle_events` object with `object_type = 'dependency'` and stages:

```
introduced → vetted → pinned → monitored → (flagged → remediated) → retired
```

| Stage | Gate |
|---|---|
| **introduced** | New direct dependency proposed in a PR. Require a one-line justification in the PR description (why this package, not an existing one already in the tree). |
| **vetted** | Before merge: confirm exact package name against the project's own docs/GitHub org (typosquat check — this matters most for any new `@solana/*`, `@metaplex-foundation/*`, `ethers`/`algosdk`-adjacent package, since those are the highest-value targets here); run `npm audit signatures` where provenance attestation is available; check maintainer count / release cadence on npmjs — a single-maintainer package with sparse releases is a higher-risk profile (the actual shape of the Sept 2025 compromised packages). |
| **pinned** | Exact or narrow-range version in `package.json`, lockfile committed. `npm ci` (never bare `npm install`) in any build/deploy script, so the lockfile — not the registry at build time — is authoritative. |
| **monitored** | Dependabot watches the package's ecosystem. See B.3 — this is the actual current gap. |
| **flagged** | An advisory (Dependabot alert, GitHub Security Advisory, or a manual report) names this package/version. Transition recorded with the advisory link as `note`. |
| **remediated** | Patched version pinned, or package replaced/removed. |
| **retired** | Dependency removed entirely (e.g. if `v1/` is confirmed dead and archived out of the npm surface). |

This doesn't require new product UI to start — Phase 1 is literally a markdown table in this file (B.1's table above, kept current) plus normal PR review discipline. The `lifecycle_events` table only becomes worth populating for this object type once there's an actual admin surface consuming it (B.4).

### B.3 The concrete, fixable gap: Dependabot coverage

`.github/dependabot.yml` today:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

This watches only the root app. `contracts/`, `v1/`, `diagrams/`, and `workers/support-inbox/` get zero automated update PRs — a compromised or vulnerable version in any of those four goes unnoticed until someone manually runs `npm audit` in that specific directory. Fix is mechanical: add one `updates` entry per directory that has a `package.json` (skip `diagrams/` until it has a lockfile, or add one first). This is the single highest-value, lowest-effort action item in this spec — it requires no schema, no UI, just a four-line YAML addition.

### B.4 Admin surface (later, reuses Part A)

Once Part A's `AdminLifecycleQueue` component exists, add a `Dependency Health` card to `AdminPage.vue` (same pattern as the existing Support Messages / Video Suggestions / Error Log cards) showing: direct-dependency count per `package.json`, lockfile presence, last Dependabot PR date, and any `flagged`-stage rows. This is explicitly Phase 2 — Phase 1 (B.3) delivers the actual safety improvement; the admin view is visibility on top of it, not a prerequisite.

### B.5 Relationship to `SPEC_SECURITY_BULLETIN.md`

`SPEC_SECURITY_BULLETIN.md` already defines a CVE bulletin format, ART-disbursement contributor chain, and `Open/Patched/Mitigated/No Action Required` status — but it's scoped outward, to chain/NFT/wallet CVEs relevant to *the community* (EVM clients, Solidity, wallet software, IPFS). It is not scoped to this repo's own build-time npm dependency tree, and its ART-disbursement machinery is overkill for an internal ops concern. Reuse its bulletin *format* (the field layout: `SUMMARY` / `AFFECTED` / `WHAT TO DO` / `STATUS`) for the `flagged`→`remediated` note in B.2 when an internal dependency incident happens, but don't route internal dependency advisories through the community verification/reward chain — that's a mismatch of audience and stakes.

---

## Non-goals / open questions

- No CI-wired `npm audit` gate yet (e.g. failing a build on a new high-severity advisory) — natural Phase 2 once Dependabot coverage (B.3) is in place and its noise level is understood.
- Whether `v1/` is still deployed anywhere isn't answered here — its dependency posture (and whether it belongs in Dependabot coverage at all vs. archival) depends on that.
- The denormalized `status` column + trigger on domain tables (A.1) is deferred until a real query is shown to need it — don't build it speculatively.
- Socket.dev or an equivalent supply-chain-specific scanner (beyond `npm audit`, which is CVE-database-driven and was notably *not* what caught the Sept 2025 incident quickly) isn't adopted here — worth a follow-up discussion, not decided in this draft.

---

*Draft — discuss before implementing Part A's schema migration or Part B's Dependabot change.*
