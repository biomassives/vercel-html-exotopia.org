# The Twin-Cylinder Station

## Some locations were never going to have a garden and a dome. Here's what we built instead, for orbits, black holes, and worlds with no ground to stand on.

*Exotopia.org — July 2026*

---

We had a bug report: navigating to some locations around Tau Cet showed the star system rendering as if it were sitting *in front of* the settlement — geometry punching through geometry, nothing lining up. The instinct was to go fix the intersection. The actual problem was upstream of that: our settlement renderer only knows how to build one thing — a dome on solid ground, terrain plane and all — and it was building that regardless of whether "ground" made any physical sense for what was being visited.

Some places don't have ground. A pure orbital or stellar-orbital address has no planet under it at all — nothing to raise a dome on. A gas giant or a magma-ocean world has a body, but not one you could stand on. Up to now, the renderer didn't know the difference. It just built a temperate rocky-world scene by default and hoped nobody looked too closely.

So instead of patching the intersection, we built the thing that should have been there from the start: a real environment for locations with no solid ground, styled the way orbital habitats actually get designed in the literature we went and checked — twin counter-rotating cylinders, in the O'Neill-cylinder tradition, not a small ring and not a hand-wave.

<style>
.post-carousel { position: relative; margin: 28px 0; }
.post-carousel input { display: none; }
.post-carousel__track {
  display: flex;
  overflow-x: hidden;
  border-radius: 8px;
  border: 1px solid rgba(0, 180, 220, 0.20);
  background: #010510;
}
.post-carousel__slide {
  flex: 0 0 100%;
  margin: 0;
  display: none;
}
.post-carousel__slide img { display: block; width: 100%; height: auto; }
.post-carousel__slide figcaption {
  padding: 10px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(150, 190, 215, 0.75);
  background: rgba(0, 10, 22, 0.9);
  border-top: 1px solid rgba(0, 130, 170, 0.18);
}
#sc-1:checked ~ .post-carousel__track .post-carousel__slide:nth-child(1),
#sc-2:checked ~ .post-carousel__track .post-carousel__slide:nth-child(2),
#sc-3:checked ~ .post-carousel__track .post-carousel__slide:nth-child(3),
#sc-4:checked ~ .post-carousel__track .post-carousel__slide:nth-child(4) {
  display: block;
}
.post-carousel__dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}
.post-carousel__dots label {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(0, 150, 200, 0.25);
  cursor: pointer;
  transition: background 0.15s;
}
#sc-1:checked ~ .post-carousel__dots label:nth-child(1),
#sc-2:checked ~ .post-carousel__dots label:nth-child(2),
#sc-3:checked ~ .post-carousel__dots label:nth-child(3),
#sc-4:checked ~ .post-carousel__dots label:nth-child(4) {
  background: #00d4dc;
}
</style>

<div class="post-carousel">
  <input type="radio" name="station-carousel" id="sc-1" checked>
  <input type="radio" name="station-carousel" id="sc-2">
  <input type="radio" name="station-carousel" id="sc-3">
  <input type="radio" name="station-carousel" id="sc-4">
  <div class="post-carousel__track">
    <figure class="post-carousel__slide">
      <img src="/blog-assets/station-interior/hero.png" alt="Station interior deck, curved wireframe hull overhead">
      <figcaption>Inside the deck — the curved hull reads as a wireframe overhead, not a flat ceiling.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/station-interior/zone-labels.png" alt="Zone labels overlay: open-floor, library, courtyard">
      <figcaption>Zone labels toggled on — the same library/water-edge/garden/courtyard zones a dome settlement uses, just laid out along a deck instead of a circle.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/station-interior/control-hints.png" alt="Control hints panel: drag, scroll, WASD, click to inspect">
      <figcaption>First-person controls — drag to look, WASD to walk, click an item to inspect it.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/station-interior/black-hole-variant.png" alt="Black hole station variant with orange accretion-tint lighting">
      <figcaption>Same scene, a black-hole zone instead of a star — the lighting shifts to a fixed accretion-glow tint rather than guessing a star color that doesn't exist.</figcaption>
    </figure>
  </div>
  <div class="post-carousel__dots">
    <label for="sc-1"></label>
    <label for="sc-2"></label>
    <label for="sc-3"></label>
    <label for="sc-4"></label>
  </div>
</div>

## What actually ships

**A real classifier, not a fourth guess.** The codebase already had three separate, disagreeing hand-rolled "is this a gas giant" checks scattered across two pages, none of which gated anything. We didn't add a fourth. `src/lib/surface-classify.ts` reads the `surface_type` field that the topo-params pipeline was already computing and never using — `gas_giant`, `hot_gas_giant`, `magma_ocean`, `lava` count as no-ground — plus a second check for the curated cluster-galaxy planet catalog, plus a check for the three bodyless orbital coordinate systems (`exo-orbital-v1`, `exo-stellar-orbital-v1`, `exo-lunar-orbital-v1`).

**Four separate entry points now check before committing to a scene.** Clicking a planet in the galaxy view, descending to a planet in a cluster system, claiming a settlement at a black hole, and — the one that actually matters most — `SurfaceViewPage` itself now redirects if the planet it resolved is `null` or no-ground, which is the backstop for every deep link, bookmark, or hand-edited URL, not just the two navigation buttons we knew about.

**One real bug fixed along the way.** Black-hole settlement claims were hardcoding `Sgr-A*` regardless of which black hole was actually being viewed — a latent mislabeling bug that predates this work and would have kept mislabeling every non-Sgr-A* claim indefinitely if we hadn't been in that function anyway.

**Twin counter-rotating cylinders, not a single ring.** Two hulls, a connecting truss linking them (the thing a real counter-rotating pair needs to cancel angular momentum), end caps and hubs, opposite spin directions on the wireframe overhead. The walkable interior itself is a flat deck for now — a genuinely curved walking surface where "down" continuously recomputes toward the spin axis is a real engineering project on its own, and correctness mattered more than physical literalism for a first pass.

**Item placement just works, because we didn't rebuild it.** Whatever you've placed in a dome settlement — the same twelve mesh presets, the same zone system — now also places into a station interior, just laid out along the cylinder's length instead of around a dome's circumference. The mesh-building code used to be duplicated logic waiting to happen; it's a shared export now, used by both.

## What we're not claiming

The interior is dark. Genuinely dark — fixed ambient and hemisphere light levels, one directional source, a conservative tone-mapping exposure. That's an honest description of what's running today, not a screenshot artifact, and it's the first thing on the list to revisit before this feels finished rather than functional. The walking surface is flat, not curved. And the literal bug report that started this — the specific geometry intersecting on a Tau Cet approach — was diagnosed architecturally, not reproduced live before the fix shipped; if it turns out to have had a second, unrelated cause, that's still an open thread.

What we can say is narrower and more useful: there is now a real destination for the places that never had one, built on research into how these habitats are actually supposed to work, not invented from scratch.
