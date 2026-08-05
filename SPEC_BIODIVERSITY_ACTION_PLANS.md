# SPEC_BIODIVERSITY_ACTION_PLANS.md — Expert-Authored Planting Plans, Not Crowd-Sourced Surveys

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Living document — reframes the biodiversity pillar of `009_ecology_biodiversity.sql` /
`/ecology-citizen-science`. Planning only, nothing here is built yet.*

---

## 1. The reframe

The biodiversity pillar was built (last pass) on the same shape as the PFAS pillar: a member logs
a site, starts a project, logs progress entries. That's the right shape for citizen-science
*measurement* (testing water, counting species). It's the **wrong** shape for what's actually
wanted here: **coordinated, expert-designed planting action plans that ordinary people, plant
nurseries, homeowners, and town administrators execute and maintain** — not design themselves.

Concretely, the goal is a **pollinator pathway / stepping-stone network**: small, distributed
plantings ("urban islands") sited close enough together that short-flight-range foragers (many
native solitary bees fly only a few hundred meters) can move through a fragmented urban/suburban
landscape instead of hitting a dead end. This is an established real practice — regional
"Pollinator Pathway" networks already do exactly this — not a new ecological theory. What's new
here is Exotopia's role: distribute expert-vetted plans, help people get the legal right to plant,
and keep them planting/maintaining successfully over time (reminders, printable care sheets).

## 2. What already fits — a real win, not a rebuild

**The site-access pipeline is already the "obtaining and maintaining rights to plant" mechanism.**
`ecology_sites.access_status` (`unresearched` → `map_research_done` → `inquiry_sent` →
`access_confirmed`/`not_required`) plus `src/data/ecology-fieldwork-library.ts`'s map-research
steps, site-type → contact-pathway table, and letter-of-inquiry generator already cover exactly
this — including the "private land" pathway a gas-station-corner or road-edge parcel would use.
Nothing needs to be rebuilt here; a planting action plan just needs to *point at* a secured
`ecology_site` rather than inventing a separate permission flow.

**`ecology_projects.project_type` already has room to extend.** Adding `'pollinator_stepping_stone'`
to the existing `CHECK` constraint is the same small additive migration
`SPEC_COMMUNITY_NODES.md` §2 already documents as the pattern for extending a constrained enum —
no redesign.

**`habitat_type` (free text on `ecology_sites`) already fits marginal-land cataloging.** Values
like `"gas station margin"`, `"road edge"`, `"parking lot island"`, `"curb strip"` need no schema
change — just a documented vocabulary (and maybe a quick-pick list in the UI instead of a bare
text input).

## 3. What's genuinely new

**(a) Plan authorship — a real open question, see §5 Q1.** A `planting_action_plans` table:
region, target pollinator guild, structured species list (native, guild-appropriate, favoring
short-flight-range foragers), site-siting criteria (which marginal-land types work), a maintenance
schedule, printable-sheet content, and `authored_by`. Unlike `method_proposals` (user-submitted,
community-endorsed), this content needs to be **expert-vetted before publication**, not
crowd-endorsed after — closer to how `pfas-methods-library.ts` is static, vetted-before-shipping
content than to the self-publish community-nodes model.

**(b) Plan adoption** — a resident/business/town picks a published plan and adopts it for a
specific secured `ecology_site` (a join: `plan_id` + `site_id` + adopter). This is the connective
tissue between "expert plan" and "real place with real legal access."

**(c) Web reminders — genuinely new infrastructure, not an extension of anything that exists.**
Nothing in this app currently sends a reminder of any kind. A reminder schedule derived from a
plan's maintenance calendar + the adoption date needs: a schedule model, and a delivery mechanism
(in-app notification vs. email vs. browser push — see §5 Q3, each has a different build cost and a
different consent story relative to `DemoConsentOverlay.vue`'s existing off-device-processing
consent).

**(d) Printable care sheets** — a print-optimized view (species list + care calendar + site
info) of an adopted plan. Contained: mostly a print stylesheet + a clean render, not new data
model.

**(e) Connectivity-aware siting ("does this actually close a gap in the pathway?") — the
research-heavy piece.** Real GIS-based green-space-connectivity modeling exists in the literature,
but building that is a large lift disproportionate to a first version. Proposed v1 instead: each
plan states a target inter-site spacing for its pollinator guild (e.g. "space within ~250m for
short-range solitary bees"), and the UI simply shows other adopted-plan sites on a map so an
adopter can informally see where gaps are — a heuristic and a visualization, not real network
analysis. Flag real connectivity modeling as a possible v2, not part of this pass.

**(f) A lightweight advisory mode, no account needed.** Someone who just wants a downloadable
region-appropriate plan — a homeowner, a town administrator — shouldn't have to create an account
or commit to logging progress. This argues for a public "browse plans by region" page, separate
from (though linking into) the full `ecology_sites`/`ecology_projects` pipeline that assumes
ongoing engagement.

## 4. Where PFAS's model genuinely doesn't transfer

Worth stating plainly since it's a correction, not an addition: `decon_progress_log`-style
self-reported field logging (points for logging *your own* observations) doesn't make sense as the
core loop here. The core loop is *did the planting succeed* (survival rate, bloom timing, observed
pollinator visitation — simple, non-expert-verifiable signals a nursery or homeowner can honestly
report), tracked against an expert-set plan, not novel data a citizen scientist is generating for
the first time. Rewards, if any, should attach to plan adoption + sustained maintenance, not to
volume of logging.

## 5. Resolved decisions

**Q1 — Resolved: cite real regional authorities, attributed, per region.** Same practice as the
compost-campaign post's Safer States citation. v1 plan content is vetted static data (like
`pfas-methods-library.ts`) — no `expert_members` role or in-app authoring UI needed yet. Revisit
if/when a specific named partner org is ready to author directly.

**Q2 — Resolved: multi-region from the start, not one default.** Target regions, reflecting
Exotopia's actual outreach pipeline, not a hypothetical:

- **Boulder & Douglas Counties, Colorado, USA** — reuses the compost campaign's existing anchor.
- **Costa Rica**
- **Seoul, South Korea**
- **Mpeketoni / Lamu region, Kenya**
- **Nairobi, Kenya**
- plus other places already in Exotopia's outreach pipeline, not yet named — the region list
  should be **structurally open** (a simple registry, not a hardcoded enum), so adding a region is
  "add a row citing a real authority," never a schema change.

These are ecologically very different (semi-arid Front Range, tropical Central America, temperate
East Asia, coastal and highland East Africa) — each needs its own real authoritative source found
and cited, not one generic list adapted five ways. **Scope call for the build itself:** ship the
region-extensible mechanism plus one fully real, properly-sourced example (Colorado, the region
with the most existing Exotopia context already) first; the other regions get a real place in the
registry and a "content pending — help source this" state rather than fabricated species lists.
Guessing at native short-flight-pollinator species for Lamu or Seoul without a verified regional
source would be irresponsible planting advice, not a shortcut worth taking.

**Before any plan content gets written for these five regions, read
["Five Places, Five Priorities"](/blog/regional-ecological-priorities-snapshot) first** — a
region-by-region check of what locals actually treat as urgent (sourced from 2025–2026 reporting),
with the finding that none of the five support a generic "just plant pollinator gardens" pitch as
written; each needs its planting-plan framing sequenced behind (or merged with) whatever's already
locally urgent — wildfire/drought in Colorado, pesticide exposure in Costa Rica, air quality in
Seoul, mangrove/development pressure in Lamu, and sanitation/water/air in Nairobi's informal
settlements ahead of anything park-edge-adjacent.

**Q3 — Resolved: in-app + PWA push where installed, plus email via Mailgun/Supabase for
everyone else.** Two things worth flagging before building on this:

- **PWA isn't actually active yet.** `quasar.config.js` already has a `pwa:` block (manifest,
  icons, `workboxMode: 'generateSW'`) — but there's no `src-pwa/` directory, and the app isn't
  currently built in PWA mode. The config existing doesn't mean push notifications work today;
  standing up real PWA mode (service worker, install prompt, push subscription handling) is a
  prerequisite, not a given.
- **Don't build the Mailgun pipeline from scratch — `welcome-letter.md` already designed one.**
  That document has a working Deno Edge Function pattern (`mailgun.js` via `npm:`, template upload
  via the Mailgun API, a `{{double_brace}}` variable convention shared between Mailgun templates
  and the edge function) for the PON INK welcome-letter flow — designed but not yet deployed
  (`supabase/functions/` doesn't exist in the repo yet, confirmed). Reminder emails should extend
  that same function/template pattern once it exists, not invent a second one.

## 6. Related documents

- `supabase/migrations/009_ecology_biodiversity.sql` — the `ecology_sites` access-pipeline this
  reuses wholesale
- `welcome-letter.md` — the existing (undeployed) Mailgun + Supabase Edge Function design, the
  pattern reminder delivery should extend rather than duplicate
- `src/data/ecology-fieldwork-library.ts` — map-research/letter-of-inquiry mechanism this plugs
  into for the "rights to plant" requirement
- `src/data/pfas-methods-library.ts` — the static-vetted-content precedent for Q1's cheapest option
- `SPEC_COMMUNITY_NODES.md` §2 — the enum-extension pattern `project_type` would follow
- `blog-municipal-compost-campaign-strategy.md` — the attribution-practice precedent for Q1's
  "cite a real authority" option
