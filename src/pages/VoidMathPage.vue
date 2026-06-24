<template>
  <q-page class="vm-page">
    <!-- Top bar -->
    <div class="vm-topbar">
      <router-link to="/docs" class="vm-back">← docs</router-link>
      <span class="vm-topbar-title">Void Architecture &amp; Conduit Mathematics</span>
      <span class="vm-topbar-sub">how empty space becomes navigation</span>
    </div>

    <div class="vm-body">
      <!-- Sidebar -->
      <nav class="vm-sidebar">
        <div class="vm-nav-head">SECTIONS</div>
        <a
          v-for="s in sections"
          :key="s.id"
          :href="'#' + s.id"
          class="vm-nav-item"
          :class="{ 'vm-nav-item--active': activeSection === s.id }"
          @click.prevent="scrollTo(s.id)"
        >{{ s.label }}</a>

        <div class="vm-nav-head" style="margin-top:18px">VOID DATA</div>
        <div v-for="v in voidSummaries" :key="v.name" class="vm-void-chip">
          <span class="vm-void-name">{{ v.name }}</span>
          <span class="vm-void-r">{{ v.r }} Mpc</span>
          <span class="vm-void-inside" :class="v.inside ? 'vm-inside' : 'vm-outside'">
            {{ v.inside ? '← inside' : 'outside →' }}
          </span>
        </div>
      </nav>

      <!-- Main content -->
      <main class="vm-main" ref="mainEl" @scroll="onScroll">

        <!-- ── 1. Cosmic Voids ──────────────────────────────────────────────── -->
        <section id="cosmic-voids" class="vm-section">
          <h1 class="vm-h1">1. Cosmic Voids</h1>
          <p class="vm-p">
            The large-scale structure of the universe is a cosmic web: dense clusters and filaments
            surrounding vast under-dense regions called <em>voids</em>. Inside a void, galaxy number
            density falls to roughly 20% of the cosmic mean. The boundaries — compensation walls —
            are slightly over-dense rings where matter piled up as the void expanded during the
            universe's history.
          </p>

          <h2 class="vm-h2">Four voids in the game dataset</h2>
          <table class="vm-table">
            <thead><tr><th>Void</th><th>RA (°)</th><th>Dec (°)</th><th>Centre dist (Mpc)</th><th>Radius (Mpc)</th><th>Position</th><th>Conduit</th></tr></thead>
            <tbody>
              <tr><td>Local Void</td><td>219</td><td>+26</td><td>23</td><td>45</td><td class="vm-inside">inside (edge)</td><td>yes</td></tr>
              <tr><td>Sculptor Void</td><td>5</td><td>−30</td><td>23</td><td>25</td><td class="vm-inside">inside (barely)</td><td>yes</td></tr>
              <tr><td>Boötes Void</td><td>230</td><td>+46</td><td>250</td><td>130</td><td class="vm-outside">outside</td><td>yes</td></tr>
              <tr><td>KBC Void</td><td>—</td><td>—</td><td>0 (centre = us)</td><td>300</td><td class="vm-inside">deep inside</td><td>no (pending)</td></tr>
            </tbody>
          </table>

          <div class="vm-callout vm-callout--note">
            The Milky Way sits at the edge of the Local Void (23 Mpc from centre, radius 45 Mpc)
            and near the edge of the Sculptor Void (23 / 25 Mpc). Both conditions trigger the
            <em>inside</em> branch of the conduit placement algorithm below.
            The KBC (Keenan-Barger-Cowie) Void is a controversially large underdensity centred
            on us, extending to ~300 Mpc.
          </div>

          <h2 class="vm-h2">Hamaus density profile</h2>
          <p class="vm-p">
            The Hamaus–Sutter–Wandelt (HSW) model (Hamaus et al. 2014, arXiv:1403.5499) describes
            the radial density contrast as:
          </p>
          <pre class="vm-code">δ(r) = δ_c · [1 − (r / r_s)^α] / [1 + (r / r_v)^β]

  δ(r)  — density contrast relative to cosmic mean (negative = underdense)
  r_s   — scale radius of the inner core (r_s < r_v for underdense voids)
  r_v   — void radius (where δ crosses zero)
  α, β  — shape parameters (~2, ~8 for typical voids)
  δ_c   — central density contrast (~−0.8 for a deep void)</pre>
          <p class="vm-p">
            At r = r_v, the profile crosses zero. Beyond that, δ goes slightly positive —
            the <strong>compensation wall</strong> where matter density exceeds the mean. The wall peaks
            at r ≈ 1.0–1.2 × r_v and decays back to zero at large r.
          </p>
        </section>

        <!-- ── 2. Coordinate System ──────────────────────────────────────────── -->
        <section id="coordinates" class="vm-section">
          <h1 class="vm-h1">2. Coordinate System</h1>
          <p class="vm-p">
            All void and cluster positions are stored as <strong>RA / Dec / distance</strong>
            (equatorial coordinates), then converted to a Three.js Cartesian frame for rendering.
          </p>

          <h2 class="vm-h2">mpcToVec3 — spherical → Cartesian</h2>
          <pre class="vm-code">// src/data/cosmic-structures.ts (not exported — used internally)
function mpcToVec3(raDeg, decDeg, distMpc) {
  const ra  = (raDeg  * Math.PI) / 180   // Right Ascension → radians
  const dec = (decDeg * Math.PI) / 180   // Declination     → radians
  return new THREE.Vector3(
    distMpc * Math.cos(dec) * Math.cos(ra),   // X  (Galactic East)
    distMpc * Math.sin(dec),                  // Y  (North Celestial Pole)
    -distMpc * Math.cos(dec) * Math.sin(ra),  // Z  negative → Three.js front
  )
}</pre>
          <p class="vm-p">
            The sign convention on Z follows standard astronomical right-hand coordinates mapped
            to Three.js: RA increases <em>counterclockwise</em> as seen from the North Celestial Pole,
            so the sine term picks up a negation when converting to Three.js's
            right-hand frame (where positive Z is toward the viewer).
          </p>

          <h2 class="vm-h2">Scene scale</h2>
          <pre class="vm-code">MPC_SCALE = 1 / 15   // 1 Mpc → 0.0667 scene units

// Boötes void centre in scene units:
//   250 Mpc × (1/15) = 16.7 units from camera origin

// Boötes void radius in scene units:
//   130 Mpc × (1/15) = 8.67 units</pre>

          <h2 class="vm-h2">Worked example — Boötes Void centre</h2>
          <pre class="vm-code">RA = 230°, Dec = 46°, dist = 250 Mpc

ra  = 230 × π/180 = 4.0143 rad
dec =  46 × π/180 = 0.8029 rad

x = 250 × cos(0.8029) × cos(4.0143) = 250 × 0.6947 × (−0.7431) = −129.1 Mpc
y = 250 × sin(0.8029)               = 250 × 0.7193             =  179.8 Mpc
z = −250 × cos(0.8029) × sin(4.0143)= −250 × 0.6947 × (−0.6691) =  116.3 Mpc

Scene units: (−8.61, 11.99, 7.75)</pre>
        </section>

        <!-- ── 3. Conduit Placement Algorithm ────────────────────────────────── -->
        <section id="conduit-algorithm" class="vm-section">
          <h1 class="vm-h1">3. Conduit Placement Algorithm</h1>
          <p class="vm-p">
            Conduits are wormhole transit nodes placed just inside the near edge of each void —
            accessible from the cosmic view without needing to fly all the way to the void centre.
          </p>

          <h2 class="vm-h2">The rule: two cases</h2>
          <pre class="vm-code">// src/data/cosmic-structures.ts — buildConduits()
const centre = mpcToVec3(v.raDeg, v.decDeg, v.distMpc)
const dir    = centre.clone().normalize()   // direction from Milky Way toward void

// CASE A — we are OUTSIDE the void (distMpc ≥ radiusMpc)
//   Place conduit just inside the near shell face, 5% inward from the edge:
conduitDist = v.distMpc - v.radiusMpc * 0.95

// CASE B — we are INSIDE the void (distMpc &lt; radiusMpc)
//   We're already in the void; place the exit conduit near the far shell:
conduitDist = v.radiusMpc * 0.9

const pos = dir.clone().multiplyScalar(conduitDist)</pre>

          <h2 class="vm-h2">Worked values for all three conduits</h2>
          <table class="vm-table">
            <thead>
              <tr>
                <th>Void</th><th>distMpc</th><th>radiusMpc</th>
                <th>Case</th><th>conduitDist (Mpc)</th><th>Scene dist (units)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Local Void</td><td>23</td><td>45</td>
                <td class="vm-inside">B — inside</td>
                <td><strong>40.5</strong> = 45 × 0.9</td><td>2.70</td>
              </tr>
              <tr>
                <td>Sculptor Void</td><td>23</td><td>25</td>
                <td class="vm-inside">B — inside</td>
                <td><strong>22.5</strong> = 25 × 0.9</td><td>1.50</td>
              </tr>
              <tr>
                <td>Boötes Void</td><td>250</td><td>130</td>
                <td class="vm-outside">A — outside</td>
                <td><strong>126.5</strong> = 250 − 130 × 0.95</td><td>8.43</td>
              </tr>
            </tbody>
          </table>

          <div class="vm-callout vm-callout--note">
            The Boötes conduit at 126.5 Mpc is 6.5 Mpc inside the near void edge (120 Mpc).
            This puts it well within the sparse interior, but reachable without the 250 Mpc full
            journey to the void centre.
          </div>

          <h2 class="vm-h2">Direction vector</h2>
          <p class="vm-p">
            The conduit is placed along the unit vector from the Milky Way toward the void centre.
            For the Local Void (inside case), the direction is the same (outward from MW origin),
            but the conduit distance is simply measured from the origin, not from the void centre.
          </p>
          <pre class="vm-code">// For Local Void: centre = mpcToVec3(219°, 26°, 23)
//   centre ≈ (−18.9, 10.1, 10.4) Mpc
//   dir    = centre.normalize() ≈ (−0.822, 0.439, 0.452)
//   conduitDist = 40.5 Mpc
//   pos    = dir × 40.5 ≈ (−33.3, 17.8, 18.3) Mpc
//            ↳ scene: (−2.22, 1.19, 1.22)</pre>
        </section>

        <!-- ── 4. Void Shader Math ───────────────────────────────────────────── -->
        <section id="void-shader" class="vm-section">
          <h1 class="vm-h1">4. Void Shader — HSW Membrane</h1>
          <p class="vm-p">
            Each void is rendered as a transparent sphere using a GLSL shader derived from the
            Hamaus et al. density profile. The shader turns the viewing angle into a proxy for
            the line-of-sight depth through the compensation wall.
          </p>

          <h2 class="vm-h2">Key insight: angle = density proxy</h2>
          <pre class="vm-code">// At a point on the void's spherical surface:
float cosA = abs(dot(vNormal, vViewDir));   // 1 = face-on, 0 = grazing

// Face-on (cosA ≈ 1, sinA ≈ 0):
//   Your line of sight passes straight through the empty interior → faint
//
// Grazing (cosA ≈ 0, sinA ≈ 1):
//   Your line of sight is nearly tangent, travelling a long path through
//   the dense compensation wall → bright

float sinA = sqrt(max(0.0, 1.0 - cosA * cosA));   // column-density proxy</pre>

          <h2 class="vm-h2">HSW wall components</h2>
          <pre class="vm-code">// wallRamp: ramps from 0 (interior) to 1 (at shell and beyond)
float wallRamp = smoothstep(0.10, 0.85, sinA);

// wallRing: sharp peak near sinA ≈ 0.92 — the compensation wall ring
//   exp(−k·(sinA − peak)²) is a Gaussian centered on sinA = 0.92
float wallRing = exp(-10.0 * (sinA - 0.92) * (sinA - 0.92));

// Combined: broad ramp + sharp ring
float hsw = wallRamp * 0.55 + wallRing * 0.45;

// Final alpha — very low to keep voids ghostly (additive blending)
float alpha = hsw      * 0.17   // main wall signal
            + wallRing * 0.07   // extra ring brightening
            + sp       * 0.03   // micro-sparkle (position-based noise)
            + ...;
gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.18));</pre>

          <div class="vm-callout vm-callout--note">
            The maximum alpha of 0.18 with <code>THREE.AdditiveBlending</code> means voids are never
            opaque — you always see the cosmic web behind them. This reflects the observational
            reality: voids are inferred from galaxy redshift surveys, not from absorption.
          </div>

          <h2 class="vm-h2">Slow drift animation</h2>
          <pre class="vm-code">// Very slow single-frequency position-based drift — just above static
float drift = sin(vObjPos.x * 1.6 + uTime * 0.05) * 0.5 + 0.5;

// At 0.05 rad/s, it takes ~126 seconds to complete one full cycle.
// The colour barely shifts; the void membrane reads as nearly static.</pre>
        </section>

        <!-- ── 5. Boötes Real Data ───────────────────────────────────────────── -->
        <section id="bootes-data" class="vm-section">
          <h1 class="vm-h1">5. Boötes Void — Real Data Pipeline</h1>
          <p class="vm-p">
            The Boötes Void (Kirshner et al. 1987) is the only void in our dataset currently
            backed by real catalog data: 2,836 galaxies from NASA/IPAC NED TAP
            (<code>NEDTAP.objdir</code>), pre-computed and stored in
            <code>public/void-galaxies/bootes-viz.json</code>.
          </p>

          <h2 class="vm-h2">Dataset statistics</h2>
          <table class="vm-table">
            <thead><tr><th>Metric</th><th>Value</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>Catalog galaxies (NED)</td><td class="vm-hi">2,836</td><td>real objects, stable NED IDs</td></tr>
              <tr><td>Generated filler</td><td>40</td><td>deterministic seed, ambient background</td></tr>
              <tr><td>Total population</td><td>2,876</td><td></td></tr>
              <tr><td>Wall-band galaxies (r &gt; 0.8 × r_v)</td><td class="vm-hi">1,760 (61%)</td><td>density peaks at r ≈ r_v</td></tr>
              <tr><td>AGN hosts</td><td>191 (6.7%)</td><td>suppressed vs cosmic mean (~10%)</td></tr>
              <tr><td>Void radius</td><td>130 Mpc</td><td>z_center = 0.058</td></tr>
              <tr><td>r_void_mpc range</td><td>8.5 – 143.0 Mpc</td><td>some galaxies extend slightly beyond shell</td></tr>
            </tbody>
          </table>

          <h2 class="vm-h2">Morphology in void environment</h2>
          <table class="vm-table">
            <thead><tr><th>Type</th><th>Count</th><th>Fraction</th><th>Implication</th></tr></thead>
            <tbody>
              <tr><td>Sb (spiral)</td><td>1,064</td><td>37%</td><td>void environment favours blue, star-forming spirals</td></tr>
              <tr><td>Irr (irregular)</td><td>764</td><td>27%</td><td>high Irr fraction — fewer merger/quench events</td></tr>
              <tr><td>Sa (spiral)</td><td>522</td><td>18%</td><td></td></tr>
              <tr><td>S0 (lenticular)</td><td>272</td><td>9%</td><td>transitional</td></tr>
              <tr><td>E (elliptical)</td><td>229</td><td>8%</td><td>surprisingly low — confirms void environment suppresses mergers</td></tr>
              <tr><td>cD (dominant)</td><td>25</td><td>1%</td><td>only in the dense wall filaments</td></tr>
            </tbody>
          </table>

          <p class="vm-p">
            The morphology mix is diagnostic: void environments have fewer mergers and tidal
            interactions, so galaxies stay spiral/irregular longer. The 6.7% AGN rate is below the
            cosmic mean, consistent with two recent papers (arXiv:2512.14825, arXiv:2601.00594) finding
            that void environments suppress black hole accretion.
          </p>

          <h2 class="vm-h2">Galaxy position format</h2>
          <pre class="vm-code">// Each galaxy in bootes-viz.json:
{
  gid:        "bootes-void_cat_0000",   // stable ID
  source:     "catalog",                // "catalog" | "generated"
  morph:      "Sb",
  col_hex:    "#7895fe",                // blue bias for void spiral
  pos_void:   [-1.96, -3.22, 2.10],    // scene units rel. to void centre
  size_su:    0.0187,                   // sprite size in scene units
  opacity:    0.717,
  is_wall:    false,                    // true when r > 0.8 × r_v
  has_agn:    false,
  z:          0.0592,                   // redshift
  r_void_mpc: 64.69,                   // distance from void centre in Mpc
}</pre>

          <h2 class="vm-h2">The wall_band_frac parameter</h2>
          <pre class="vm-code">// bootes-viz.json metadata:
wall_band_frac: 0.8   // galaxies beyond r > 0.8 × r_v are tagged is_wall=true

// This matches the Hamaus profile: the density compensation wall
// becomes significant at r ≈ 0.8 × r_v and peaks at r ≈ 1.0–1.2 × r_v.
// 1760 / 2876 = 61% of galaxies are in the wall band — consistent with
// observational surveys that find void interiors are 90%+ empty.</pre>

          <h2 class="vm-h2">The void oracle loader</h2>
          <pre class="vm-code">// src/lib/void-oracle.ts — fetch-on-demand, in-memory cache
import { loadVoidOracle } from 'src/lib/void-oracle'

const data = await loadVoidOracle('bootes-void')
// → VoidOracleFile | null
// Internally: fetch('/void-galaxies/bootes-void-viz.json')
//             cache in Map; deduplicate concurrent fetches

// data.galaxies:    VoidGalaxy[]  — 2876 items
// data.radius_mpc:  130
// data.wall_band_frac: 0.8
// data.catalog_count: 2836   ← source of truth for real-vs-generated badge</pre>
        </section>

        <!-- ── 6. Open Questions ─────────────────────────────────────────────── -->
        <section id="open-questions" class="vm-section">
          <h1 class="vm-h1">6. Open Questions</h1>
          <p class="vm-p">
            The current conduit system is a first-pass geometric construction. As the platform
            matures toward real astronomical data, several design decisions need revisiting.
          </p>

          <div class="vm-q" id="q-kbc">
            <div class="vm-q-head">Q1 — KBC Void conduits: where do they go?</div>
            <p class="vm-p">
              The KBC (Keenan-Barger-Cowie) Void is centred on us and extends ~300 Mpc. Because
              <code>hasConduit: false</code>, it has no transit node. But the void edge is a
              real astronomical feature (an overdensity ring of clusters including Virgo, Centaurus,
              Perseus). Should we add conduits at the KBC periphery?
            </p>
            <pre class="vm-code">// KBC: distMpc = 0, radiusMpc = 300 → inside case
// conduitDist would be = 300 × 0.9 = 270 Mpc — in the Perseus-Pisces region

// In scene units: 270 / 15 = 18 units from origin — beyond most rendered clusters
// This is a valid transit node if we want to exit the KBC shell
// toward the Great Wall or Perseus-Pisces supercluster filament.</pre>
            <div class="vm-q-status vm-q-status--open">Status: open — design needed</div>
          </div>

          <div class="vm-q" id="q-real-conduits">
            <div class="vm-q-head">Q2 — Should conduit placement use real galaxy positions?</div>
            <p class="vm-p">
              The current algorithm places conduits at a fixed geometric position (90–95% of void
              radius from MW toward void centre). With 1,760 real wall-band galaxies in Boötes, we
              could instead place conduits near the densest real cluster in the wall.
            </p>
            <pre class="vm-code">// Option A — current: pure geometry
conduitPos = dir × conduitDist

// Option B — data-driven: find the wall galaxy cluster with the most
//            neighbors within 15 Mpc, and use that as the conduit anchor
const wallGalaxies = data.galaxies.filter(g => g.is_wall)
const densest = findDensestClump(wallGalaxies, clumpRadius = 15)
conduitPos = densest.centroid   // in scene units relative to void centre
// → then add void.pos to get world position</pre>
            <p class="vm-p">
              Option B makes conduits feel "found" rather than "placed" — they emerge from the
              real structure. But it requires the void data to be loaded before the conduit can
              be rendered, adding async complexity to the cosmic view.
            </p>
            <div class="vm-q-status vm-q-status--exploring">Status: exploring — trade-off between realism and load latency</div>
          </div>

          <div class="vm-q" id="q-local-void">
            <div class="vm-q-head">Q3 — The Local Void edge case: are we actually inside?</div>
            <p class="vm-p">
              The Milky Way sits ~23 Mpc from the Local Void centre, with the void radius at 45 Mpc.
              This means the Milky Way is inside the void by the current geometry — but observational
              surveys put us at the edge rather than deep inside. The 23 Mpc figure is to the void's
              <em>gravitational centre</em>, not to the nearest wall.
            </p>
            <pre class="vm-code">// Current conduit placement (inside branch):
conduitDist = 45 × 0.9 = 40.5 Mpc (RA 219°, Dec +26°)
// This puts the conduit near the void far wall — correct for an "exit" node
// when you're already inside.

// But if we treat MW as on the edge (distMpc ≈ radiusMpc):
// The conduit would flip to the outside branch:
conduitDist = 23 − 45 × 0.95 = 23 − 42.75 = −19.75 Mpc (negative!)
// → The formula breaks. The 0.95 factor assumes you're outside by at least 5%.
// We need a guard for the edge case: when conduitDist &lt; 0, use distMpc × 0.5</pre>
            <div class="vm-q-status vm-q-status--bug">Status: edge case — formula produces negative distance when dist ≈ radius</div>
          </div>

          <div class="vm-q" id="q-hamaus-params">
            <div class="vm-q-head">Q4 — Should each void have its own Hamaus α, β parameters?</div>
            <p class="vm-p">
              The current shader uses <em>implicit</em> fixed values (sinA = 0.92 wall ring peak,
              smoothstep 0.10–0.85 ramp) that approximate α = 2, β = 8 — typical for medium-mass
              voids. But real voids have different shapes:
            </p>
            <table class="vm-table">
              <thead><tr><th>Void</th><th>Typical α</th><th>Typical β</th><th>Wall peak sinA</th><th>Character</th></tr></thead>
              <tbody>
                <tr><td>Local Void (shallow)</td><td>~1.5</td><td>~5</td><td>~0.88</td><td>broad soft wall</td></tr>
                <tr><td>Boötes Void (deep)</td><td>~2.5</td><td>~10</td><td>~0.95</td><td>sharp narrow wall</td></tr>
                <tr><td>KBC Void (very large)</td><td>~1.2</td><td>~4</td><td>~0.82</td><td>very diffuse</td></tr>
              </tbody>
            </table>
            <pre class="vm-code">// Proposed: pass α, β as uniforms per void sphere
uniforms: {
  uAlpha:    { value: 2.5 },   // Boötes
  uBeta:     { value: 10.0 },
  uWallPeak: { value: 0.95 },
}
// In GLSL:
float wallRing = exp(-uBeta * 0.4 * (sinA - uWallPeak) * (sinA - uWallPeak));</pre>
            <div class="vm-q-status vm-q-status--exploring">Status: design proposal — needs α, β literature values per void</div>
          </div>

          <div class="vm-q" id="q-inside-nav">
            <div class="vm-q-head">Q5 — Inside-void navigation: return conduit geometry</div>
            <p class="vm-p">
              When the user enters a void interior (VoidInteriorPage), they see the sparse galaxy
              field. The conduit <em>into</em> the void is the same node used to <em>exit</em>.
              This creates a conceptual mismatch: the conduit should have two faces — an entry
              face (from cosmic view) and an exit face (from void interior pointing back to the
              cosmic web).
            </p>
            <pre class="vm-code">// Current: conduit is a double pyramid at fixed world position.
// Proposed: two-headed conduit (or two separate markers):

// Entry face (seen from cosmic view):
//   pyramid pointing INTO the void → suggests "enter here"

// Exit face (seen from void interior):
//   pyramid pointing OUT toward MW → suggests "return to web"

// The exit node in void interior should be placed at:
//   voidEntryPos + normal pointing toward MW origin
//   i.e.  conduitPos.normalize().negate() × exitRadius
//   where exitRadius keeps it near the void's inner shell face</pre>
            <div class="vm-q-status vm-q-status--open">Status: open — void interior navigation not yet built</div>
          </div>

          <div class="vm-q" id="q-multi-conduit">
            <div class="vm-q-head">Q6 — Multiple conduits per void</div>
            <p class="vm-p">
              Large voids like Boötes (130 Mpc radius) could have multiple transit nodes on
              different faces of the void shell, connecting to different filaments of the cosmic web.
              The current single-conduit model places one node on the MW-facing shell.
            </p>
            <pre class="vm-code">// Boötes Void wall has 1760 real galaxies distributed around 360°.
// Filament entry points (densest wall zones) could become separate conduits:
//   Conduit A — near wall face toward MW (current, 126.5 Mpc)
//   Conduit B — far wall face toward Hercules Supercluster (~380 Mpc)
//   Conduit C — lateral face toward Coma Supercluster

// Build rule: take the 1760 wall galaxies, cluster in angular space,
// pick top 3 angular clusters, place one conduit per cluster at 95% of r_v
// along the mean direction of that cluster.

const wallDirs = wallGalaxies.map(g => new THREE.Vector3(...g.pos_void).normalize())
const clusters = angularKMeans(wallDirs, k = 3)
const conduits = clusters.map(c => c.centroid.multiplyScalar(v.radiusMpc * 0.95 / 15))</pre>
            <div class="vm-q-status vm-q-status--future">Status: future — requires angular clustering + multi-conduit UI</div>
          </div>
        </section>

        <!-- ── 7. Architecture Evolution ────────────────────────────────────── -->
        <section id="evolution" class="vm-section">
          <h1 class="vm-h1">7. Architecture Evolution</h1>

          <h2 class="vm-h2">What we built first</h2>
          <table class="vm-table">
            <thead><tr><th>Layer</th><th>Initial approach</th><th>Basis</th></tr></thead>
            <tbody>
              <tr><td>Void shells</td><td>Spheres with Hamaus-approximated shader</td><td>Analytic (fixed α, β)</td></tr>
              <tr><td>Void populations</td><td>None (just shell geometry)</td><td>—</td></tr>
              <tr><td>Conduit positions</td><td>Geometric: 90–95% of radius</td><td>Procedural</td></tr>
              <tr><td>Conduit shape</td><td>Single tall upward cone (4-sided)</td><td>Visual marker</td></tr>
              <tr><td>Conduit hover</td><td>3-line text tooltip</td><td>—</td></tr>
            </tbody>
          </table>

          <h2 class="vm-h2">What is changing</h2>
          <table class="vm-table">
            <thead><tr><th>Layer</th><th>New approach</th><th>Basis</th></tr></thead>
            <tbody>
              <tr><td>Boötes population</td><td>2,836 NED catalog + 40 generated galaxies</td><td>Real TAP query</td></tr>
              <tr><td>Source badge</td><td><code>source: 'catalog' | 'generated'</code></td><td>Observational provenance</td></tr>
              <tr><td>Wall detection</td><td><code>is_wall</code> flag from r_void_mpc &gt; 0.8 × r_v</td><td>Hamaus profile</td></tr>
              <tr><td>Conduit shape</td><td>Double pyramid (upper + lower cone) with Y-rotation + edge wireframe</td><td>Visual clarity</td></tr>
              <tr><td>Conduit hover</td><td>SVG radar meta-map: nearby clusters, BHs, other conduits + strategic value</td><td>Navigation aid</td></tr>
              <tr><td>BH navigation</td><td>"Enter Host Cluster" button on SMBH/ULSMBH galaxies</td><td>First-class routing</td></tr>
            </tbody>
          </table>

          <h2 class="vm-h2">Target: per-void data pipeline</h2>
          <pre class="vm-code">// Currently only Boötes has a *-viz.json.
// The naming convention supports any void:
//   public/void-galaxies/{voidId}-viz.json
//   where voidId = voidName lowercased, diacritics stripped, spaces → '-'

// voidIdFromName('Local Void')    → 'local-void'
// voidIdFromName('Sculptor Void') → 'sculptor-void'
// voidIdFromName('KBC Void')      → 'kbc-void'
// voidIdFromName('Boötes Void')   → 'bootes-void'  (ö stripped)

// A NED TAP query for the Local Void (~23 Mpc distance, 45 Mpc radius)
// would need a coordinate box centred on RA 219°, Dec +26°, ~90 Mpc diameter.
// Expected yield: far fewer galaxies than Boötes (smaller, closer, better surveyed).</pre>
        </section>

      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const sections = [
  { id: 'cosmic-voids',       label: '1. Cosmic Voids'            },
  { id: 'coordinates',        label: '2. Coordinate System'        },
  { id: 'conduit-algorithm',  label: '3. Conduit Algorithm'        },
  { id: 'void-shader',        label: '4. Void Shader Math'         },
  { id: 'bootes-data',        label: '5. Boötes Real Data'         },
  { id: 'open-questions',     label: '6. Open Questions'           },
  { id: 'evolution',          label: '7. Architecture Evolution'   },
]

const voidSummaries = [
  { name: 'Local Void',    r: 45,  inside: true  },
  { name: 'Sculptor Void', r: 25,  inside: true  },
  { name: 'Boötes Void',  r: 130, inside: false },
  { name: 'KBC Void',     r: 300, inside: true  },
]

const activeSection = ref('cosmic-voids')
const mainEl = ref<HTMLElement | null>(null)

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el || !mainEl.value) return
  const top = el.offsetTop - 24
  mainEl.value.scrollTo({ top, behavior: 'smooth' })
  activeSection.value = id
}

function onScroll() {
  if (!mainEl.value) return
  const scrollTop = mainEl.value.scrollTop + 80
  for (const s of sections) {
    const el = document.getElementById(s.id)
    if (el && el.offsetTop <= scrollTop) activeSection.value = s.id
  }
}

onMounted(() => mainEl.value?.addEventListener('scroll', onScroll))
onUnmounted(() => mainEl.value?.removeEventListener('scroll', onScroll))
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.vm-page {
  background: #020408;
  min-height: 100vh;
  font-family: 'Courier New', Courier, monospace;
  color: #c8d8e8;
}

.vm-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 48px;
  background: rgba(2, 6, 16, 0.97);
  border-bottom: 1px solid rgba(0, 200, 255, 0.12);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
}
.vm-back {
  color: rgba(0, 229, 255, 0.55);
  font-size: 11px;
  text-decoration: none;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.vm-back:hover { color: #00e5ff; }
.vm-topbar-title {
  font-size: 12px;
  color: #a0c8e0;
  letter-spacing: 0.07em;
  white-space: nowrap;
}
.vm-topbar-sub {
  font-size: 10px;
  color: rgba(0, 180, 220, 0.40);
  letter-spacing: 0.05em;
  margin-left: auto;
}

.vm-body {
  display: flex;
  height: calc(100vh - 48px);
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.vm-sidebar {
  width: 200px;
  min-width: 200px;
  background: rgba(3, 8, 22, 0.95);
  border-right: 1px solid rgba(0, 200, 255, 0.08);
  overflow-y: auto;
  padding: 16px 0 32px;
}
.vm-nav-head {
  font-size: 8px;
  color: rgba(0, 180, 220, 0.40);
  letter-spacing: 0.14em;
  padding: 0 14px 6px;
}
.vm-nav-item {
  display: block;
  font-size: 10px;
  color: rgba(160, 200, 220, 0.60);
  text-decoration: none;
  padding: 5px 14px;
  letter-spacing: 0.04em;
  transition: color 0.15s;
  cursor: pointer;
  border-left: 2px solid transparent;
}
.vm-nav-item:hover { color: #a0d8f0; }
.vm-nav-item--active {
  color: #00e5ff;
  border-left-color: #00e5ff;
  background: rgba(0, 229, 255, 0.06);
}

.vm-void-chip {
  display: flex;
  flex-direction: column;
  margin: 3px 10px;
  padding: 5px 8px;
  border: 1px solid rgba(0, 180, 220, 0.12);
  border-radius: 3px;
  font-size: 9px;
}
.vm-void-name { color: #a0c8e0; font-weight: 600; letter-spacing: 0.04em; }
.vm-void-r    { color: rgba(150, 190, 210, 0.55); }
.vm-inside    { color: #55aaff; }
.vm-outside   { color: #aaffaa; }

/* ── Main content ─────────────────────────────────────────────────────────── */
.vm-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px 80px;
  max-width: 820px;
}

.vm-section {
  margin-bottom: 64px;
  scroll-margin-top: 24px;
}

.vm-h1 {
  font-size: 17px;
  color: #c0e4ff;
  letter-spacing: 0.06em;
  font-weight: 600;
  margin: 0 0 16px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.15);
  padding-bottom: 8px;
}
.vm-h2 {
  font-size: 12px;
  color: rgba(0, 229, 255, 0.75);
  letter-spacing: 0.10em;
  font-weight: 600;
  margin: 24px 0 8px;
  text-transform: uppercase;
}
.vm-p {
  font-size: 12px;
  color: rgba(180, 210, 230, 0.82);
  line-height: 1.75;
  margin: 0 0 12px;
}

.vm-code {
  background: rgba(0, 180, 255, 0.04);
  border: 1px solid rgba(0, 180, 255, 0.14);
  border-radius: 4px;
  padding: 14px 16px;
  font-size: 11px;
  color: #a0e0ff;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
  margin: 0 0 14px;
  overflow-x: auto;
}

.vm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-bottom: 16px;
}
.vm-table th {
  text-align: left;
  font-size: 9px;
  letter-spacing: 0.10em;
  color: rgba(0, 180, 220, 0.60);
  border-bottom: 1px solid rgba(0, 180, 220, 0.20);
  padding: 6px 10px;
  text-transform: uppercase;
}
.vm-table td {
  padding: 6px 10px;
  color: rgba(180, 210, 230, 0.78);
  border-bottom: 1px solid rgba(0, 180, 220, 0.07);
}
.vm-table tr:hover td { background: rgba(0, 180, 255, 0.04); }
.vm-hi    { color: #00e5ff; font-weight: 600; }

/* inside/outside inline badges in table */
.vm-table .vm-inside  { color: #55aaff; font-size: 10px; }
.vm-table .vm-outside { color: #88ffaa; font-size: 10px; }

.vm-callout {
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 11px;
  line-height: 1.65;
  margin: 0 0 16px;
}
.vm-callout--note {
  background: rgba(0, 150, 200, 0.07);
  border-left: 3px solid rgba(0, 200, 255, 0.35);
  color: rgba(160, 210, 230, 0.80);
}

/* ── Open questions ────────────────────────────────────────────────────────── */
.vm-q {
  border: 1px solid rgba(0, 180, 220, 0.15);
  border-radius: 5px;
  margin-bottom: 20px;
  overflow: hidden;
}
.vm-q-head {
  background: rgba(0, 150, 200, 0.08);
  padding: 10px 14px;
  font-size: 11px;
  color: #80ccee;
  letter-spacing: 0.05em;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 180, 220, 0.12);
}
.vm-q .vm-p,
.vm-q .vm-code {
  margin-left: 14px;
  margin-right: 14px;
}
.vm-q .vm-p { margin-top: 12px; }
.vm-q .vm-code { margin-top: 8px; }
.vm-q-status {
  font-size: 9px;
  letter-spacing: 0.10em;
  padding: 6px 14px;
  border-top: 1px solid rgba(0, 180, 220, 0.10);
}
.vm-q-status--open      { color: #ff9944; background: rgba(255, 130, 40, 0.06); }
.vm-q-status--exploring { color: #ffdd44; background: rgba(255, 220, 40, 0.06); }
.vm-q-status--bug       { color: #ff5555; background: rgba(255, 50, 50, 0.06); }
.vm-q-status--future    { color: #88aacc; background: rgba(100, 140, 200, 0.06); }
</style>
