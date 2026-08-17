# The Lessons Are Real

## A status check on Learn, Sky Lessons, and the Eco-Ops Library — the mentoring tools next to them, and the citizen-science roadmap items that aren't built yet

*SCD Hub · Exotopia.org · August 2026*

---

## The short version

Exotopia has three separate places to learn something, and until this week two of them
were nearly invisible. `/learn` (financial-literacy and settlement-science quizzes that pay
real reward points), `/sky-lessons` (three astronomy/navigation lessons, grade 8 through
grad school), and the Eco-Ops Library (104 field-tested WATSAN, biodiversity, and
remediation videos, no quiz format) are all real, all shipped, and none of them were
equally easy to find. This post is a status check: what's actually built across lessons,
mentoring, and the citizen-science/business tracks around them, and — separately, clearly
marked — what's still a roadmap item and shouldn't be mistaken for shipped.

---

## A few direct questions

**Is this a game?**
No. There's no in-app purchase, no pay-to-win mechanic, and the "points" you earn from
quizzes or mentor sessions have no cash value and never will. They unlock cosmetic
settlement objects and certificates. Think of it as a very literal incentive layer over
real learning and real field work, not a game economy.

**Then what is it?**
A citizen-science and eco-ops platform with a navigable-universe front end. The universe —
galaxies, exoplanets, settlements — is the interface. The substance underneath it is a
library of field methods, a place to log real PFAS/PFOA decontamination progress, a
mentor-pairing system, and (as of this post) a small business/location directory. The
3D navigation isn't decoration bolted onto a spreadsheet; it's also not the point.

**Do the lessons actually teach anything, or are they filler?**
`/learn`'s finance-literacy quizzes are built off the P-Fin Index, a real personal-finance
literacy assessment — passing PFIN-8 and the full PFIN-28 unlocks settlement objects, but
the questions themselves aren't invented for the app. `/sky-lessons` computes an
exoplanet's actual sky from NASA Exoplanet Archive data — the constellations you'd see from
Kepler-442b are a geometry problem with a real answer, not flavor text. The Eco-Ops Library
is the odd one out on purpose: it's reference material, not a quiz. Nobody gets certified
from watching a video; the domain competency framework (below) requires evidence of
actually doing the thing.

**Is the citizen-science side simulated, or is it tracking real work?**
Both, and it matters which is which. Decontamination progress logs, method proposals, and
mentor-session confirmations on this platform represent claims about real-world field work —
we don't independently verify every log entry, the same trust model as most citizen-science
platforms. The "simulation" language in our roadmap section below refers to something
different and not yet built: letting participants model and share a *strategy* before doing
the work, the way you'd sketch a plan before executing it. That's future tense. Don't
confuse it with the present-tense logging system, which is real today.

---

## What's real today

### Three lessons surfaces, and a fix to how you find them

- **`/learn`** — quizzes across exoplanet science, settlement protocol, and P-Fin
  personal-finance literacy. PFIN-8 unlocks a settlement seed object; the full PFIN-28
  unlocks a parallel-universe settlement. This is the one lessons surface that was already
  prominent — a main-nav card, a mobile-nav entry, and a homepage tile.
- **`/sky-lessons`** — three lessons: *Reading the Sky from Another World* (grades 8–11),
  *The Mathematics of Synthetic Skies* (grade 12–grad, full coordinate-transform and
  parallax-pipeline code walkthroughs), and *Galactic Center Astrophysics* (grad/public
  science). Real orbital mechanics and real catalog data, not narrative flavor text.
- **The Eco-Ops Library (`/eco-library`)** — 104 videos across 9 domains (Water, Energy,
  Waste, Food, Shelter, Health, Decontamination, Ecology & Biodiversity, Microplastics).
  Field-tested methods, not a quiz — the reference material a mentor points a mentee at
  before they go build something.

Here's what was actually weak, concretely: `/sky-lessons` and `/eco-library` had real routes
and real content, but neither one had a single entry point in the main site chrome
(`MainLayout.vue`) — no desktop nav card, no mobile-menu item, no homepage tile. They only
surfaced inside onboarding, a couple of deep links from other pages, and the About modal's
"eco-ops library" link. `/learn` had four separate entry points; the other two had zero in
the primary nav. That's fixed as of this post — both now have a full card in the PARTICIPATE
nav group (art, hover panel, and all, matching every other entry there), a mobile-nav item,
and a listing in the About modal alongside `/learn`. Same content, same routes — just findable
now instead of buried behind onboarding.

### PFAS/PFOA decontamination tracking

`/pfas-citizen-science` is a working project log: real remediation methods, public method
proposals anyone can publish and others can endorse, and a place to log progress-entries
against a specific decontamination project. Publishing a method proposal pays reward points
on the "educating others" track; each progress-log entry pays a smaller amount on its own.
None of it requires a blockchain or a wallet.

### The mentor system, and a new group-leader view

`mentor_sessions` has existed since the original rewards migration: a mentor and a mentee
request a session on a topic, both sides confirm independently (a session can't be
reassigned or self-confirmed by one party alone — that's enforced server-side, not just in
the UI), and four confirmed sessions as a mentor earns a Mentorship certificate. That part
was already real.

What's new: if you're mentoring more than one person — running a small group through WATSAN,
biodiversity, remediation, or library-research work together — the Rewards page now has a
"Your Mentees" section that rolls up every session where you're the mentor into one row per
person, with a best-effort domain guess per session (matched against the domain vocabulary
in `SPEC_DOMAIN_COMPETENCY.md`) and a link out to the relevant Eco-Ops Library area, PFAS
tracker, or Knowledge Keeper records for that domain. It's a read on data that already
existed, not a new table — one mentor_sessions row per request, same as always, just viewed
per mentee instead of per request.

### A real place to list a business or location

`community_nodes` supports `business_listing` and `business_location` node types today —
go to `/my-listings`, describe a business, a physical location, or a creative page, and it
appears in the community gallery directory (`/gallery`) alongside everyone else's. This is
the concrete, shipped hook for "cleaner industries and small-business opportunities
demonstrating real-world earth services": a member running a water-filtration business, a
composting operation, or a native-plant nursery has a real place to list it today, not a
promise of one.

---

## Roadmap — not built yet

Everything below this line is not shipped. It's the direction, not the state of the app.
Same rule the About modal follows for everything it links to: nothing on this list gets
presented as more than it is.

- **Simulation-strategy sharing between citizen-science participants.** The ability to model
  and share a *plan* — a proposed sequence of remediation steps, a habitat-planting layout —
  before anyone executes it, so two participants working similar sites can compare
  approaches ahead of time rather than after. Today, the platform only records what already
  happened (a progress log, a method proposal). Planning-stage sharing doesn't exist.
- **Decontamination target-setting.** Right now a decon project accumulates progress-log
  entries with no formal target — no "reduce PFAS concentration to X by date Y" structure to
  log against. Adding real targets, and tracking progress against them, is on the roadmap
  and not started.
- **Deeper cleaner-industry/small-business integration.** `/my-listings` gets a business into
  the gallery directory today, full stop. It doesn't yet connect that listing to the domain
  competency framework, to eco-ops project data, or to anything beyond "here's a pin in the
  directory." Tying a business listing to, say, a mentor's confirmed WATSAN domain work, or
  to specific eco-ops projects it supports, is a real idea with no implementation behind it
  yet.

If you're building against any of this, treat the "real today" section as the actual
surface area, and the roadmap section as exactly that — direction, not a promise of when.
