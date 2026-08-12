# Exotopia — Status Report, August 10, 2026

*SCD Hub (Sustainable Community Development Hub) · A Colorado 501(c)(3) nonprofit*
*For sharing — this is written to hand to someone who's never seen the project before.*

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

Worth saying plainly rather than around: **there is no user base yet.** This is pre-launch.
Nobody outside the small group building it has an account, a settlement, or a reason to have
noticed it exists. That's not a caveat to bury — it's the honest starting point for anything
in this report. Everything below is "what's real and working," not "what people are using,"
because there isn't a "people are using it" yet.

What *is* true: the core is no longer a demo shell. A settler can claim a real, confirmed
exoplanet or a procedurally-generated world inside a real galaxy cluster, land on its surface,
build inside a settlement dome, and the whole thing persists locally on their own device —
no account required, no blockchain, no gas fee. That loop — claim, build, persist — works
end-to-end today, across every world type the app supports.

## What's real and working

**The universe itself**
- Five-level navigable descent: cosmic web → galaxy cluster → star system → planet surface →
  settlement interior, sharing one renderer where the handoffs matter (camera composition
  carries across scene transitions rather than cutting to an unrelated establishing shot)
- 6,298 confirmed/candidate exoplanets, 345 X-ray galaxy clusters (Takey 2013 catalog),
  2,824 procedurally-generated star-system files, 15 hand-curated named galaxy clusters with
  real member catalogs
- A full local-sky pipeline: the 118,218-star Hipparcos catalog, real parallax math computed
  per settlement (not "the same stars shifted a bit" — genuinely recomputed apparent position
  and brightness from that specific world's location in space), all 88 IAU constellations with
  real line patterns, laying the groundwork for community-authored "local zodiacs" unique to
  each settled system

**Settling and building**
- Three independent ways to claim a world — a real confirmed exoplanet, a generated world
  inside a galaxy cluster, or a bodyless orbital claim for gas giants and other worlds with no
  solid surface — all converging on the same settlement record, all working end-to-end
  (this took real debugging this cycle: the orbital-claim path had no way to actually register
  a settlement at all until it was found and fixed)
- Settlers design their own decorations — including a voxel-sculpture builder for a settlement's
  "Art Sphere" display object, deliberately constrained to a colour grid rather than free
  uploads, so creative expression doesn't require a moderation system this small team can't
  staff, with peer-to-peer gift codes for sharing designs between settlements
- A bioluminescent gallery structure near every settlement dome — warm procedural lighting
  marking its entrance, walk close enough and it opens into a geodesic-biodome-styled interior,
  distinct in tone from the main dome's cooler architecture

**The legal and organizational ground underneath**
- Terms of Service and Privacy Policy now correctly identify SCD Hub (a confirmed Colorado
  501(c)(3)) as the operating entity, with real fundraising/tax-deductibility language,
  volunteer-protection and charitable-immunity clauses, and a Zimbabwe compliance analysis
  (CDPA/POTRAZ) done properly rather than assumed
- No settlements database, ever — a settlement lives in the owning browser's storage and,
  optionally, an IPFS pin the owner controls. Not a promise about future architecture; the
  literal current state, chosen specifically so this nonprofit is never the custodian of user
  data it would then be responsible for protecting

## Honest gaps, not hidden

This report follows the same rule the rest of this project's internal docs use: say what's
stubbed, not just what's shipped. The sky-data pipeline above computes real per-settlement
star positions, but the generated files are large enough (full precision, per planet) that a
smarter shared-bucket data architecture is designed and specced but not yet built. The
Progressive Web App install experience currently only represents the citizen-science module,
not the settlement/cosmic-web experience most of this report describes — also specced, not yet
built. Both are next.

## What's next

1. Ship the sky-data "regime" architecture — shared sky data across nearby settlements instead
   of one full file per planet, cutting the data footprint roughly 25–30x while keeping full
   precision where it matters (the constellation layer)
2. Broaden the installable-app identity beyond the citizen-science module so the settlement/
   cosmic-web experience has its own home-screen presence
3. The first real settlers — this report exists in part because "zero users" stops being true
   the moment someone reads it and claims a world

---

*Exotopia.org is a project of SCD Hub, a Colorado 501(c)(3) nonprofit. Source is open —
`github.com/biomassives/vercel-html-exotopia.org`. Questions, bug reports, and "I want to try
this" all go to the same place: the in-app contact form, or `ecocommunity@protonmail.com`.*
