# SPEC_SELF_HOSTED_NETWORK.md — Independent, Collaborative Exotopia Instances

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Living document — planning only. The deploy stack in §2 is real and working today; the
federation/data-sharing layer in §4 is not built. See `blog-self-hosted-exotopia.md` for the
public-facing version of this pitch.*

---

## 1. What this is

A path for someone other than us to run their own Exotopia instance — on a home network or as
a public deployment — without needing a wallet, a blockchain, or an account with us. This
replaces the old NFT-minting-era onboarding (`Networks` doc section, wallet-connect quickstart,
per-chain faucets) with the app's actual current shape: a client-side SPA with an optional
Supabase backend (`README.md` → Developer setup already documents this — nothing new needed
there).

The reframe this spec is really about: self-hosting isn't just a deployment convenience, it's
the mechanism for **independent instances that still collaborate** on the same visualization,
citizen-science, humanitarian-engineering, and biodiversity work — rather than every instance
being either the one canonical platform or an unconnected fork. §2 (the deploy stack) is
resolved and working. §4 (what "collaborate" actually means mechanically between two instances
neither of us administers) is not — this document says so plainly rather than describing a
federation protocol that doesn't exist.

## 2. Architecture: the three-step baseline

Already documented in `DocPage.vue`'s "Run Your Own Instance" section and
`blog-self-hosted-exotopia.md`; captured here for the technical record:

1. **Supabase** — a project, plus the migrations already in `supabase/migrations/` run
   against it. This is the only stateful backend the app has; everything else (galaxy data,
   glossary, docs) is static JSON/markdown shipped with the build.
2. **Git** — fork or clone to GitLab, Gitea, or GitHub. Nothing in the build or deploy config
   assumes a specific host.
3. **Vercel** — connect the repo, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON` (see
   `.env.example`), deploy. `vercel.json` is the single source of truth for build command,
   headers, and CSP — this spec doesn't restate it.

No wallet, no chain selection, no faucet step exists anywhere in this path.

## 3. Refinements layer — optional, scales past the baseline

Not required to run an instance; each addresses a different constraint once the baseline
stack is outgrown or a specific deployment goal (full independence from external SaaS) is
in play:

| Refinement | Addresses | Notes |
|---|---|---|
| Cloudflare | CDN/edge, DNS, extra security headers in front of the deploy | Layers in front of `vercel.json`'s existing CSP/cache policy, doesn't replace it |
| Redis | Caching, rate limiting, queues | For an instance outgrowing default Supabase-only scaling — e.g. a node serving a large federated community |
| Appwrite (standalone) | Full alternative to Supabase + Vercel | For a fully offline-capable home-network deployment with zero external SaaS dependency |

None of these three are mutually exclusive or ordered — an instance picks whichever subset
matches its actual constraint.

## 4. The unresolved part: instance-to-instance collaboration

The pitch — "shares data and encourages collaborative improvements to our visualization,
citizen science, in the humanitarian engineering realms, biodiversity work" — describes a
goal, not a shipped mechanism. Concretely unresolved:

- **What actually gets shared.** Candidate scopes range from "nothing automatic, instances
  just publish exports other admins can pull manually" up through "live sync of specific
  tables between opted-in instances." No decision made.
- **What stays local.** Citizen-science data in particular may carry privacy/consent
  constraints (see `pfas-citizen-science.ts`'s "parallel dimension for simulated cleanups"
  pattern and the real `ecology_log_entries`/`decon_progress_log` tables) that a naive
  full-sync model would violate. Any federation design has to treat this as a hard
  constraint, not an afterthought.
- **Conflict resolution.** Two independently-run instances editing overlapping data (e.g.
  the same real-world site logged from two communities) need a reconciliation model that
  doesn't currently exist anywhere in this codebase.
- **Trust/identity between instances.** `DocPage.vue`'s "API & mule-bot Security" section
  already flags a related, narrower version of this same problem for its own federation
  phase — "per-node pubkey pinning and cross-settlement corpus queries with
  privacy-preserving aggregation" — which is the closest existing design thinking to what
  instance-to-instance sync would eventually need, but was scoped to mule-bot corpora
  specifically, not general data sharing.

The closest existing prior art is `SPEC_COMMUNITY_NODES.md` §4's `exportForSelfHost()` — a
one-directional, user-initiated data export, not a sync protocol. It's a reasonable starting
point (a pull-based export a receiving instance's admin chooses to import) rather than a
push-based live-sync design, and is flagged in §5 as the likely direction rather than
something more ambitious.

## 5. Open questions

**Q1 — Export/pull vs. sync/push as the starting model?**
Leaning toward extending the `exportForSelfHost()` pattern (admin-initiated, reviewed before
import) as v1, rather than building live sync first. Lower trust requirement, no new
always-on infrastructure, and it's already half-built. Confirm before any federation code
gets written.

**Q2 — Does citizen-science data need a consent/redaction pass before it can leave the
instance it was collected on?**
Given the existing privacy patterns elsewhere in this codebase (self-service deletion
requests, the simulated-vs-real citizen-science separation), an export mechanism probably
can't just dump raw tables. Needs a real answer, not an assumption, before §4 goes further.

**Q3 — Is "collaborative improvement" about data (citizen-science records) or code
(visualization features), or both?**
The blog post and this spec currently read as being about both, loosely. If the actual near-term
priority is "instances share code improvements back via normal git PRs" (already fully
solved — that's just open source) rather than "instances share live data" (not solved), the
messaging and the engineering priority should probably separate these explicitly instead of
treating them as one federation problem.

## 6. Related documents

- `blog-self-hosted-exotopia.md` — the public-facing version of §1/§4's pitch
- `README.md` → Developer setup — the exact commands §2 points to rather than restates
- `DocPage.vue` → "Run Your Own Instance" / "Refinements" — the in-app version of §2/§3
- `SPEC_COMMUNITY_NODES.md` §4 — `exportForSelfHost()`, the closest existing prior art for §4/Q1
- `vercel.json` — deploy config, CSP, and cache policy referenced in §2/§3
- `.env.example` — the two Supabase env vars §2 requires
