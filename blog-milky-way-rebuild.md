# We Rebuilt the Milky Way

## Real spiral arm data, a bug that put our galaxy's core on top of the Sun, and a night sky that finally looks like one

*SCD Hub · Exotopia.org · August 2026*

---

## The short version

Two backdrops changed this week: the face-on spiral you see browsing star systems at `/galaxy`,
and — new — a glowing band across the sky when you're standing on a planet's surface. Both used
to be decoration. Both are now driven by real numbers from the actual research literature on the
Milky Way's structure, and one genuine bug got fixed along the way: our galaxy's own core used to
be drawn sitting on top of the Sun.

---

## What was wrong

The old spiral had four arms, spaced at exactly 90° from each other, all sharing one pitch angle,
with a central bar tilted 44° for no particular reason. None of those numbers came from anywhere.
The real Milky Way's arms aren't evenly spaced, don't share one pitch angle, and several of them
visibly change pitch partway along their length. The bar's real angle, per the modern reference
(Wegg & Gerhard 2013, VVV red-clump mapping), is closer to 27°.

Meanwhile, if you stood on a settlement's surface and looked up, there was no Milky Way at all —
just generic scattered stars. The single most recognizable feature of a real night sky, missing.

## What we did

We pulled real per-arm data from Reid et al. 2019 — VLBI trigonometric parallaxes of about 200
star-forming regions, the field's standard modern map of the galaxy. Seven real arms replaced the
old four, including two that were simply absent before: the 3-kpc arm, and the Local Arm (the
Orion Spur) — the minor spur between the Sagittarius and Perseus arms where the Sun actually sits.
Several arms got their real two-segment pitch ("kink") instead of one flattened number. The bar
went to 27°.

Then we found the bigger problem. The spiral texture had never been given a position in the
scene — it defaulted to sitting exactly on the Sun's own location, the same point every real star
and our existing Sagittarius A* marker are anchored to. Which meant the bright galactic core was
being drawn on top of the observer, not 8.15 kpc away where it actually is. We computed the real
direction to Sgr A* — the same RA/Dec our existing black-hole marker already used — and moved the
whole disk so the core sits in the correct real direction and the Sun lands exactly where every
other real object in the scene already does.

Color changed too. The old model gave each arm its own invented hue — blue, amber, pink, teal —
which reads as "which of the four arms is this," not physics. Real spiral arms are picked out by
young blue stars and pink star-forming regions running along every arm's ridgeline, not by each
arm having its own paint color. Dust lanes moved from floating in the gaps between arms to where
they actually sit: hugging each arm's inner, galactic-centre-facing edge.

## The new sky band

This is the part that didn't exist before at all. Standing inside the disk, the Milky Way isn't a
face-on spiral — it's a band wrapping the whole sky along the plane you're embedded in, brightest
toward the galactic centre, split by a dark dust lane (the "Great Rift" you can see with the naked
eye from a dark site). We built that as a texture wrapped around the sky, oriented with the same
real coordinates as the galaxy view, so the bright direction actually points toward Sagittarius A*
from wherever your settlement happens to be. Two different systems, two different real sky
orientations — checked both, and the band correctly looks different in each.

## What we're not claiming

The dust lanes are shaped by hand to match the real qualitative pattern, not sampled from an
actual measured extinction map. The two-segment arms' exact kink point is approximated at each
arm's midpoint, not read off the paper's full per-source table. Star-forming knots are seeded
procedurally, not placed at real catalogued positions. None of this is presented as more precise
than it is — see the full technical writeup for the complete list.

## What's next

We looked at what a follow-up pass could pull from — real data first. A 2025 paper (Shen, Hou,
Liu & Gao) reconciling young- and evolved-star spiral tracers with Gaia DR3 parallaxes gives the
Local Arm — the one the Sun sits in — a pitch angle of 25.2°, notably different from the 11.4° we
have now; that's a one-line update once we've read the full source table. A real catalog of ~8,000
Galactic HII regions (Anderson et al. 2014, WISE) could replace our procedurally-scattered
star-forming knots with real, named, correctly-positioned ones. A real 3D dust map (Green et al.'s
"Bayestar," built on Gaia + Pan-STARRS1 + 2MASS) could replace our hand-shaped dust lanes with an
actual measured extinction profile. And ESO's real photographic all-sky Milky Way panorama is
CC BY 4.0 — attribution only — which makes a downsampled version of an actual photograph a
legitimate option as a layer under the procedural band, not just more procedural generation. None
of this is built yet; full citations and priority order are in the spec.

## Where to look

- `/galaxy` — the face-on spiral, now offset correctly from the Sun.
- Any settlement surface (e.g. `/surface/TRAPPIST-1/TRAPPIST-1%20e`) — rotate the view to find the
  band; it wraps the full sky as a real great circle.
- `SPEC_MILKY_WAY_VISUALIZATION.md` in the repo — full technical detail, exact file/line
  references, and the complete "what's next" list.

---

*Full technical detail: `SPEC_MILKY_WAY_VISUALIZATION.md`. Questions or corrections:
acmeideal@gmail.com.*
