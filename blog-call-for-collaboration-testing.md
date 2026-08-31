# Exotopia Is Looking for People to Try to Break It

## An open call for testers, mentors, and technical collaborators — pre-launch, zero users, built in the open

*SCD Hub · Exotopia.org · August 2026*

---

## The ask, plainly

We're not asking anyone to use a finished product. Exotopia is pre-launch — there is no user
base yet, nobody outside the small group building it has a settlement. What we're asking for is
people willing to actually drive the thing — click through real flows, try to break them, tell
us what's confusing, what's broken, and what doesn't match what we claim it does — before we
put it in front of people who don't already know how forgiving to be with new software.

This is a different ask than our conservation-biology collaboration call. That one is about
co-authoring scientific content. This one is about the tooling itself: does it work, is it
clear, does it hold up.

## What's actually ready to test today

Grounded in our own internal status report (published alongside this call) — not a promise,
the current real state:

- **The full navigable universe** — cosmic web down to a settlement interior, five levels, real
  astronomical data at every stop (6,298 confirmed exoplanets, 345 X-ray galaxy clusters, a
  118,218-star sky pipeline). Try claiming a world three different ways: a real confirmed
  exoplanet, a procedurally generated one, and a bodyless orbital claim for a gas giant with no
  solid surface.
- **A settlement that persists with no account and no blockchain** — build something, close the
  tab, come back. It should still be there, stored on your own device.
- **The new Milky Way** — browse to a star system and look at the galaxy backdrop, then land on
  a settlement surface and look up. Two different views, same underlying real astronomy; they
  should agree with each other.
- **Space station interiors**, for worlds with no solid surface — look for the two large
  circular windows and the collapsible guide/schedule panel.
- **The File Cabinet** — approach a settlement's gallery structure and go inside; browse the
  drawers (certifications, rewards, settlement documents, creative assets).
- **`/sky-lessons` and the Eco-Ops field library** — now reachable from the main nav for the
  first time; tell us if they're actually findable or if we just moved the problem.
- **The PFAS/PFOA decontamination tracker, mentor-session system, and `/my-listings` business
  directory** — real logging and real data, not simulated for demo purposes.
- **The bug/feature/security report flow** — built into the app itself; we want to know if it's
  actually usable under pressure, i.e. right after you've just hit the bug you're reporting.

## What kind of testing help we're specifically asking for

- **Click-through testers, no technical background required.** Pick a world, claim it, build
  something, try to get lost or confused on purpose. The most useful bug reports we've gotten
  internally came from screenshots of a wrong picture, not a stack trace — you don't need to
  know why something's broken to tell us it looks wrong.
- **Mentors and group leaders** running WATSAN, biodiversity, remediation, or library-research
  work with more than one person — the mentor tooling was built for exactly this and has had
  approximately zero real-world use yet.
- **Developers willing to read code, not just click through it.** We test with Playwright
  (headless browser automation) against both a local and a hosted Supabase environment — if
  you'd rather find bugs by reading `src/` than clicking around, that's just as useful, and the
  codebase is open (GPL v3).
- **Anyone willing to try the onboarding flow from a cold start** — no prior context, exactly
  the way a first-time user would hit it. This is the single most valuable kind of tester, and
  the hardest for us to simulate ourselves once we already know how everything works.

## What we are not asking for

Money, a long-term commitment, or your name on anything public unless you want it there. There's
no financial reward for testing — the platform's existing "points" system has no cash value and
isn't a compensation mechanism for this ask. If you find something real, we'll credit you by
name (or not) exactly as you prefer.

## What we're honest about before you start

- This is genuinely pre-launch software. You will find rough edges. That's the point of asking
  now rather than after a real launch.
- Some things are specced but not built yet — the sky-data storage architecture, a broader PWA
  install identity, a fix to onboarding-template copy that's gone stale relative to the current
  local-first architecture. None of these block testing the parts above; all are listed plainly
  in the status report so nobody discovers a known gap and reports it as news to us.
- A cosmic void detail page (`/void/local-void`) mixes real NASA/IPAC catalog data with a
  small, clearly-labeled amount of generated filler for a region real astronomy expects to be
  sparse. If you poke at the data and it looks partly synthetic, that's disclosed, not a bug.

## How to actually do this

1. Read the current status report (`blog-status-report-aug17-2026.md` in the repo, or linked from
   this post) for an honest snapshot of what's built.
2. Pick a flow from the list above and just use it.
3. Report anything — confusing, broken, or just "this took longer than it should have."
   **If you have a GitHub account**, use the in-app report flow (bug/feature/security icon) or
   file directly at `github.com/biomassives/vercel-html-exotopia.org/issues/new` — it's the same
   template either way. **If you don't have a GitHub account** and don't want to make one just
   to report a bug, email **ecocommunity@protonmail.com** instead — that's our existing,
   privacy-policy-covered support channel (see `legal-privacy.md` §"Communications"), not a new
   intake surface, so there's no new data-handling exposure in offering it here.
4. If you want write access or a longer conversation about contributing directly, say so in
   your report — we'll follow up.

## Contact

SCD Hub
ecocommunity@protonmail.com
`github.com/biomassives/vercel-html-exotopia.org`
