# Exotopia — Status Report, August 17, 2026

*SCD Hub (Sustainable Community Development Hub) · A Colorado 501(c)(3) nonprofit*
*For sharing — this is written to hand to someone who's never seen the project before.
Supersedes the August 10 report; nothing in that one is wrong, this one is just more current.*

---

## What this is, in one paragraph

Exotopia is a navigable 3D universe — built from real astronomical data, not a generic space
skybox — where you can descend from the large-scale cosmic web, through a galaxy cluster,
into a real star system, down to an exoplanet's surface, and claim a settlement there. Every
level is grounded in a real published catalog: 6,298 confirmed exoplanets, 345 X-ray-selected
galaxy clusters, a full 118,218-star Hipparcos catalog for computing what the sky actually
looks like from a specific settled world. It's not a game skin on top of fake data — the
numbers on screen are the numbers from the archive. The project exists to make citizen
science, ecological fieldwork, and a nonprofit's community-development work feel like part of
something larger than a spreadsheet, without pretending any of it is more certain than it is.

## Where it actually stands: pre-launch, zero users, built in the open

Still true, still worth saying plainly: **there is no user base yet.** This is pre-launch.
Everything below is "what's real and working," not "what people are using."

## What's new since the last report (one week)

- **The Milky Way is accurate now, in two places.** The spiral you see browsing star systems
  used to be four evenly-spaced arms with one invented pitch angle and a bar tilted for no
  reason. It's now seven real arms from Reid et al. 2019 (VLBI parallax data — the field's
  standard modern map), a real 27° bar angle, and a bug fix that used to draw the galaxy's own
  core sitting on top of the Sun. Standing on a planet's surface now also shows a real galactic
  band across the sky for the first time — that feature didn't exist before at all.
- **Space station interiors got real windows.** The old ones were small, rectangular, and out
  of reach. Now there are two huge circular windows — full "portholes" at each end of the
  cylinder — plus a collapsible guide panel with a deck map and schedule, keyed to the actual
  zone layout of whatever station you're in.
- **Art/gallery objects are enterable now.** Walk up to a settlement's gallery structure and go
  inside to a real File Cabinet — literature, credentials, rewards, settlement documents, and
  creative assets, organized in browsable drawers, backed by the same Supabase tables the rest
  of the platform uses.
- **Two lessons surfaces that had zero discoverability now have full nav entries.**
  `/sky-lessons` (three astronomy/navigation lessons, computed from a settlement's actual real
  sky) and the 104-video Eco-Ops field library had real content and real routes, but no card in
  the main site nav — you could only reach them through onboarding or a buried deep link. Fixed.
- **Mentors leading more than one person now get a real view for it.** If you're running a
  small group through WATSAN, biodiversity, or remediation work, the Rewards page rolls every
  session where you're the mentor into one row per mentee, with links out to the relevant field
  library.
- **A real place to list a business or location** now exists at `/my-listings` — a water-
  filtration business, a composting operation, a native-plant nursery — appearing in the public
  community directory alongside everyone else's page.
- **The Local Void isn't empty anymore.** A cosmic-void detail page was silently showing "no
  catalogued objects" — the underlying data-fetch script was hitting NASA/IPAC NED's hard
  60-second query timeout and failing over to nothing. Fixed; the page now shows 262 real
  catalogued galaxies plus a small, literature-bounded amount of representative filler for the
  void's genuinely sparse interior (never claimed as more real than it is).
- **Cleaned out unused blockchain tooling.** A Hardhat smart-contract subproject and Solana/
  Metaplex NFT-minting dependencies were sitting in the codebase, unused (nothing in the live
  app imports them — the settlement/mint journey runs on IPFS pinning, not on-chain minting) and
  responsible for the majority of this repo's outstanding dependency vulnerability count. Removed
  the unused npm packages, archived the actual chain-interaction code (still real, working,
  portable — just moved to `archive/chains/` for if/when this project or another one picks
  blockchain minting back up) rather than deleting it outright.

## What's still real and working (carried over from last report)

- Five-level navigable descent: cosmic web → galaxy cluster → star system → planet surface →
  settlement interior, one renderer, camera composition carried across transitions
- Three independent ways to claim a world (confirmed exoplanet, generated world, bodyless
  orbital claim for gas giants), all converging on the same settlement record
- A settlement persists entirely on the owner's own device — no account required, no
  blockchain, no gas fee, no settlements database, ever
- Real ToS/Privacy Policy under the confirmed Colorado 501(c)(3), including a Zimbabwe
  compliance analysis (CDPA/POTRAZ) done properly, not assumed
- PFAS/PFOA decontamination tracking with a public, endorsable methods library

## Honest gaps, not hidden

- The sky-data "regime" architecture (shared sky data across nearby settlements instead of one
  full file per planet) is specced but not built — still next, not done.
- The installable PWA identity still only represents the citizen-science module, not the
  settlement/cosmic-web experience most of this report describes.
- The onboarding welcome-letter template (email/SMS/audio) still describes settlement addresses
  as "recorded on the blockchain" — that's stale relative to the actual local-first/IPFS
  architecture above and needs a content pass before it goes to anyone new. Flagged, not fixed
  yet.
- Local Void's interior population is honestly hybrid: real NED catalog objects plus a small,
  literature-bounded amount of generated filler for a region real astronomy expects to be
  sparse — not presented as more complete than it is.

## What's next

1. Ship the sky-data "regime" architecture (still the top item, unchanged from last report)
2. Fix the onboarding template's stale blockchain language before it reaches a real new user
3. Broaden the installable-app identity beyond the citizen-science module
4. The first real testers and settlers — see the open call for collaboration and testing,
   published alongside this report

---

*Exotopia.org is a project of SCD Hub, a Colorado 501(c)(3) nonprofit. Source is open —
`github.com/biomassives/vercel-html-exotopia.org`. Questions, bug reports, and "I want to try
this" all go to the same place: the in-app contact form, or `ecocommunity@protonmail.com`.*
