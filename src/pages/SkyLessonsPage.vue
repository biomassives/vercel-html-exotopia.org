<template>
  <q-page class="sl-page">

    <!-- ── Top bar ──────────────────────────────────────────────────────────── -->
    <div class="sl-topbar">
      <router-link to="/" class="sl-home-link">
        <span class="sl-home-exo">EXO</span><span class="sl-home-topia">TOPIA</span>
        <span class="sl-home-arrow">↗</span>
      </router-link>
      <span class="sl-breadcrumb">
        <router-link to="/docs" class="sl-bread-link">DOCS</router-link>
        <span class="sl-bread-sep">/</span>
        SKY GENERATION — EDUCATIONAL LESSONS
      </span>
    </div>

    <!-- ── Body layout ─────────────────────────────────────────────────────── -->
    <div class="sl-layout">

      <!-- ── Left sidebar ────────────────────────────────────────────────── -->
      <nav class="sl-nav">

        <!-- Lesson selector -->
        <div class="sl-lesson-selector">
          <div class="sl-selector-label">SELECT LESSON</div>
          <button
            class="sl-lesson-btn"
            :class="{ 'sl-lesson-btn--active': activeLesson === 1 }"
            @click="setLesson(1)"
          >
            <span class="sl-lesson-grade">GRADES 8–11</span>
            <span class="sl-lesson-title">Reading the Sky<br>from Another World</span>
          </button>
          <button
            class="sl-lesson-btn"
            :class="{ 'sl-lesson-btn--active': activeLesson === 2 }"
            @click="setLesson(2)"
          >
            <span class="sl-lesson-grade">GRADE 12 — GRAD</span>
            <span class="sl-lesson-title">Mathematics of<br>Synthetic Skies</span>
          </button>
          <button
            class="sl-lesson-btn"
            :class="{ 'sl-lesson-btn--active': activeLesson === 3 }"
            @click="setLesson(3)"
          >
            <span class="sl-lesson-grade">GRAD / PUBLIC SCIENCE</span>
            <span class="sl-lesson-title">Galactic Center<br>Astrophysics</span>
          </button>
        </div>

        <!-- Section nav -->
        <div class="sl-nav-sections">
          <div class="sl-nav-head">SECTIONS</div>
          <a
            v-for="s in activeSections"
            :key="s.id"
            class="sl-nav-item"
            :class="{ 'sl-nav-item--active': activeSection === s.id }"
            @click.prevent="scrollTo(s.id)"
          >{{ s.label }}</a>
        </div>

        <div class="sl-nav-foot">
          <router-link to="/docs" class="sl-foot-link">← Back to Docs</router-link>
        </div>
      </nav>

      <!-- ── Main content ─────────────────────────────────────────────────── -->
      <main class="sl-content" ref="contentEl">

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- LESSON 1 — Grades 8-11                                         -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <template v-if="activeLesson === 1">

          <div class="sl-lesson-header">
            <div class="sl-lesson-badge">GRADES 8–11</div>
            <h1 class="sl-h1">Reading the Sky from Another World</h1>
            <p class="sl-intro">How Exotopia builds a unique, scientifically accurate night sky for every exoplanet settlement — and why no two worlds see the same constellations.</p>
            <div class="sl-meta">
              <span>⏱ 45–60 min</span>
              <span>📐 Arithmetic + geometry concepts</span>
              <span>🔭 No telescope required</span>
            </div>
          </div>

          <!-- S1.1 -->
          <section :id="'l1-big-idea'" class="sl-section">
            <h2 class="sl-h2">1. The big idea</h2>
            <p class="sl-p">Every culture on Earth has looked up at the same night sky and seen the same patterns: Orion, the Big Dipper, the Southern Cross. Those patterns exist because the stars that form them happen to be in the same general direction from Earth, even though most are not actually near each other in space.</p>
            <p class="sl-p">Now imagine you could teleport to an exoplanet 342 light-years away. Look up. The sky would be unrecognisable. Orion would be gone. The Big Dipper would be scrambled. The Sun — our Sun — would be a faint star you'd need a telescope to find. You would be looking at a sky no human has ever seen. If you lived there, you would invent completely new constellations from scratch.</p>
            <p class="sl-p">Exotopia computes that sky — not as an artistic guess, but as a geometric calculation using real catalog data from the NASA Exoplanet Archive. Every settlement in the platform sees a physically correct sky for its exact location in the galaxy.</p>
            <div class="sl-callout sl-callout--info">
              <strong>Key insight:</strong> Constellations are not properties of stars — they are properties of where you are standing. Change your position by a few hundred light-years, and every pattern in the sky changes with it.
            </div>
          </section>

          <!-- S1.2 -->
          <section :id="'l1-star-address'" class="sl-section">
            <h2 class="sl-h2">2. A star's three-part address</h2>
            <p class="sl-p">Before we can compute the sky from another planet, we need to know where every star is. Astronomers use a three-number address — like a cosmic GPS:</p>
            <table class="sl-table">
              <thead><tr><th>Number</th><th>What it means</th><th>Analogy</th></tr></thead>
              <tbody>
                <tr><td>Right Ascension (RA)</td><td>East-west position on the sky, 0°–360°</td><td>Longitude on a globe</td></tr>
                <tr><td>Declination (Dec)</td><td>North-south position on the sky, −90° to +90°</td><td>Latitude on a globe</td></tr>
                <tr><td>Distance (d)</td><td>How far away the star is, in parsecs (1 pc ≈ 3.26 light-years)</td><td>How far the pin is from the globe's surface</td></tr>
              </tbody>
            </table>
            <p class="sl-p">Together, these three numbers place every star as a point in three-dimensional space. Our two example stars today:</p>
            <table class="sl-table">
              <thead><tr><th>Star</th><th>RA</th><th>Dec</th><th>Distance</th><th>Notes</th></tr></thead>
              <tbody>
                <tr><td>Kepler-442 (host star)</td><td>294.6°</td><td>+41.8°</td><td>342 pc · 1,115 ly</td><td>G-type — Sun-like. Has a confirmed habitable-zone rocky planet.</td></tr>
                <tr><td>K2-90 (host star)</td><td>59.15°</td><td>+22.47°</td><td>134.2 pc · 438 ly</td><td>K-type — cooler, orange. 2.7° from the centre of the Pleiades cluster at nearly the same distance.</td></tr>
              </tbody>
            </table>
          </section>

          <!-- S1.3 -->
          <section :id="'l1-parallax'" class="sl-section">
            <h2 class="sl-h2">3. The pencil trick — what parallax means</h2>
            <p class="sl-p">Hold a pencil at arm's length. Close your right eye. Now close your left eye instead. The pencil appears to jump against the background wall, even though it didn't move. That jump is <strong>parallax</strong>.</p>
            <p class="sl-p">Now hold the pencil only 10 cm from your face and repeat. The jump is much bigger. Hold it at arm's length again — the jump is smaller. The closer the object, the bigger the parallax shift when you change your viewpoint.</p>
            <p class="sl-p">Stars work exactly the same way. Move your viewpoint by 342 light-years — to Kepler-442b — and every nearby star appears to jump to a new position in the sky. Stars that are far away (thousands of light-years) barely move. Stars that are close (tens of light-years) jump dramatically — sometimes to a completely different part of the sky.</p>
            <div class="sl-callout">
              A star 10 light-years from Earth shifts by roughly <strong>60° or more</strong> in the sky when viewed from Kepler-442b (1,115 light-years away). A star 2,000 light-years away shifts by less than <strong>0.01°</strong> — invisible to the naked eye.
            </div>
          </section>

          <!-- S1.4 -->
          <section :id="'l1-kepler442'" class="sl-section">
            <h2 class="sl-h2">4. Example: the sky from Kepler-442b</h2>
            <p class="sl-p">Kepler-442b orbits a G-type star 1,115 light-years from Earth in the constellation Lyra (as we see it from here). Its host star has a surface temperature of 5,765 K — nearly identical to the Sun's 5,778 K — so the daytime sky would glow under a slightly warm yellow-white sun.</p>
            <p class="sl-p">Here is what changes when you move from Earth to Kepler-442b:</p>
            <ul class="sl-ul">
              <li><strong>The Sun becomes a faint star.</strong> From 1,115 light-years away, the Sun shines at about magnitude 9.5 — invisible to the naked eye. You would need binoculars to find it at all.</li>
              <li><strong>The Kepler field dissolves.</strong> About 3,000 confirmed exoplanet host stars are crammed into a 10° × 12° patch of Earth's sky (the Kepler Space Telescope's field of view). From Kepler-442b, those stars are spread across a completely different area of the sky, because each one is at a different 3D position and appears from a different angle.</li>
              <li><strong>Orion is unrecognisable.</strong> The seven stars of Orion are at distances ranging from 243 to 1,344 light-years from Earth — all in roughly the same direction from us, but vastly different distances. From 1,115 light-years away in a different direction, those seven stars are scattered across dozens of different parts of the sky.</li>
            </ul>
            <div class="sl-code-block">Kepler-442 host star — 3D position in space (Earth = origin):
  x = +105.5 parsecs  (toward RA 0° / Dec 0°)
  y = +228.4 parsecs  (toward north celestial pole)
  z = +231.5 parsecs  (into the page, opposite RA 90°)

From Kepler-442b, the Sun appears in direction:
  x = −105.5 / 342 = −0.308
  y = −228.4 / 342 = −0.668
  z = −231.5 / 342 = −0.677

  → The Sun appears in a direction roughly opposite to where Kepler-442
    appears in Earth's sky. You would look toward the constellation
    Lepus (the Hare) — below Orion — to find it.</div>
          </section>

          <!-- S1.5 -->
          <section :id="'l1-k290'" class="sl-section">
            <h2 class="sl-h2">5. Example: K2-90b — inside the Pleiades</h2>
            <p class="sl-p">K2-90 is one of the most cosmically interesting teaching examples we have: it sits just 2.7° from the centre of the Pleiades cluster on the sky, and at almost exactly the same distance (134 vs 136 parsecs). It is physically in the Pleiades region of space.</p>
            <p class="sl-p">From Earth, the Pleiades look like a tight, beautiful cluster of blue-white stars — seven of them visible to the naked eye (the "Seven Sisters"). But from the surface of K2-90b, you are no longer looking <em>at</em> the Pleiades from the outside. You are <em>inside</em> the region. Some of those famous blue-white stars might be only 5–10 light-years away from K2-90. Others might be 30–40 light-years away. They are no longer a compact cluster — they are your neighbourhood, scattered across your entire sky.</p>
            <p class="sl-p">The Seven Sisters pattern, as seen from Earth, does not exist from K2-90b. You would see the same individual stars, but they would form completely different shapes. The settlement community on K2-90b would need to name those patterns from scratch.</p>
            <div class="sl-callout sl-callout--info">
              <strong>This is the "new constellations" moment.</strong> Exotopia computes this for every settlement automatically — each planet's sky shows the real star neighborhood from that planet's 3D position. The Pleiades dissolve. Orion scatters. The sky is genuinely new.
            </div>
          </section>

          <!-- S1.6 -->
          <section :id="'l1-orange-sun'" class="sl-section">
            <h2 class="sl-h2">6. The orange sun of K2-90</h2>
            <p class="sl-p">The host star of K2-90b is a K-type dwarf — cooler than our Sun at 4,484 K vs the Sun's 5,778 K. That 1,300 K difference in surface temperature changes the colour of the star from yellow-white to a deep orange.</p>
            <p class="sl-p">Exotopia converts the host star's measured temperature into a colour using a lookup that matches the way stars actually appear to the eye:</p>
            <table class="sl-table">
              <thead><tr><th>Spectral type</th><th>Temperature (K)</th><th>Colour</th><th>Example star</th></tr></thead>
              <tbody>
                <tr><td>O</td><td>&gt; 30,000</td><td>Blue-violet</td><td>Zeta Puppis</td></tr>
                <tr><td>B</td><td>10,000 – 30,000</td><td>Blue-white</td><td>Rigel</td></tr>
                <tr><td>A</td><td>7,500 – 10,000</td><td>White</td><td>Vega, Sirius</td></tr>
                <tr><td>F</td><td>6,000 – 7,500</td><td>Yellow-white</td><td>Procyon</td></tr>
                <tr><td>G</td><td>5,200 – 6,000</td><td>Yellow (Sun-like)</td><td>Sun, Kepler-442</td></tr>
                <tr><td>K</td><td>3,700 – 5,200</td><td>Orange</td><td>Arcturus, <strong>K2-90</strong></td></tr>
                <tr><td>M</td><td>&lt; 3,700</td><td>Deep red-orange</td><td>Proxima Centauri</td></tr>
              </tbody>
            </table>
            <p class="sl-p">Standing on K2-90b, you would look up at an orange sun. The daytime sky would be tinged differently from Earth's blue. Sunsets and sunrises would look unlike anything we experience here.</p>
          </section>

          <!-- S1.7 — Activity -->
          <section :id="'l1-activity'" class="sl-section">
            <h2 class="sl-h2">7. Activity — find the Sun from Kepler-442b</h2>
            <div class="sl-callout sl-callout--activity">
              <strong>🔭 Classroom exercise</strong> — Use the coordinates above to work through these questions. Answers follow.
            </div>

            <p class="sl-p"><strong>Part A</strong> — The Sun is at position (0, 0, 0) in our coordinate system. Kepler-442's host star is at approximately (105, 228, 232) in parsecs. If you are standing on Kepler-442b looking back toward the Sun, in what general direction are you looking? (Hint: subtract the two positions.)</p>
            <p class="sl-p"><strong>Part B</strong> — Tau Ceti is a nearby star 3.65 parsecs from Earth. From Earth it appears at RA 26°, Dec −16°. From Kepler-442b, would tau Ceti appear very close to the Sun in the sky, or in a completely different direction? Explain your reasoning using the concept of distance and parallax.</p>
            <p class="sl-p"><strong>Part C</strong> — Alcyone, the brightest Pleiades star, is roughly 135 parsecs from Earth. K2-90 is at 134 parsecs. From K2-90b, would Alcyone appear as a very bright nearby star, or as a distant background star? How does your answer compare to how Alcyone looks from Earth?</p>
            <p class="sl-p"><strong>Discussion</strong> — If you were the first community to settle on K2-90b, what constellations would you name? What local stars might appear bright enough to use as navigation landmarks? What story might you tell about the Pleiades stars now scattered across your sky?</p>

            <div class="sl-code-block">ANSWERS

Part A: Looking from Kepler-442b toward the Sun means looking in
        the direction (0−105, 0−228, 0−232) = (−105, −228, −232).
        Normalised: (−0.308, −0.668, −0.677).
        This points roughly toward the constellation Lepus (below Orion
        as we see it from Earth) — a completely unfamiliar direction.

Part B: Tau Ceti is only 3.65 pc from Earth, while Kepler-442 is 342 pc.
        From Kepler-442b, both the Sun and tau Ceti are in almost exactly
        the same direction — tau Ceti is only ~0.8° away from the Sun as
        seen from that distance. They would appear as two stars very close
        together in the sky. Parallax is tiny when the baseline (3.65 pc)
        is much smaller than the viewing distance (342 pc).

Part C: Alcyone at ~135 pc and K2-90 at 134 pc are physically close to
        each other. From K2-90b, Alcyone could be as close as a few
        light-years away (a nearby star) or tens of light-years depending
        on exact position. From Earth, the Pleiades look like a compact
        cluster because we see them from 440 light-years away. From
        inside the cluster, individual stars are spread across your whole sky.</div>
          </section>

        </template>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- LESSON 2 — Grade 12 through Graduate                           -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <template v-if="activeLesson === 2">

          <div class="sl-lesson-header">
            <div class="sl-lesson-badge sl-lesson-badge--adv">GRADE 12 — GRADUATE</div>
            <h1 class="sl-h1">The Mathematics of Synthetic Skies</h1>
            <p class="sl-intro">A full derivation of the coordinate transforms, parallax vector pipeline, stellar spectral colour, angular size calculations, and black hole safe-orbit physics used to generate every sky in Exotopia.</p>
            <div class="sl-meta">
              <span>⏱ 90–120 min</span>
              <span>📐 Trigonometry, vectors, basic orbital mechanics</span>
              <span>💻 JavaScript code from the production codebase</span>
            </div>
          </div>

          <!-- S2.1 -->
          <section :id="'l2-coords'" class="sl-section">
            <h2 class="sl-h2">1. Coordinate transform: equatorial spherical → Cartesian</h2>
            <p class="sl-p">The standard equatorial coordinate system specifies a star's sky position as right ascension α (east, 0°–360°) and declination δ (north +90°, south −90°). Combined with a distance r in parsecs, this gives a spherical coordinate triple (r, α, δ).</p>
            <p class="sl-p">Converting to 3D Cartesian space with Earth at the origin, and applying the astronomical convention that x points toward (α=0, δ=0), y toward the north celestial pole (δ=+90°), and z toward (α=270°, δ=0) — note the <strong>negative z</strong> for increasing RA, reflecting the right-handed coordinate system against the left-handed RA convention:</p>
            <div class="sl-code-block">x = r · cos(δ) · cos(α)
y = r · sin(δ)
z = −r · cos(δ) · sin(α)

where α, δ are in radians: α = RA° × π/180,  δ = Dec° × π/180</div>
            <p class="sl-p">The production function in <code class="sl-code">src/lib/three-utils.ts</code>:</p>
            <div class="sl-code-block">export function raDecToVec3(raDeg: number, decDeg: number, radius: number): THREE.Vector3 {
  const ra  = (raDeg  * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    -radius * Math.cos(dec) * Math.sin(ra)
  )
}</div>
            <p class="sl-p"><strong>Worked example — Kepler-442 host star:</strong></p>
            <div class="sl-code-block">Input:   RA = 294.6°,  Dec = 41.8°,  d = 342 pc
         α  = 5.1430 rad,  δ = 0.7297 rad

x =  342 × cos(0.7297) × cos(5.1430)
  =  342 × 0.7443       × 0.4147
  =  +105.5 pc

y =  342 × sin(0.7297)
  =  342 × 0.6679
  =  +228.4 pc

z = −342 × cos(0.7297) × sin(5.1430)
  = −342 × 0.7443       × (−0.9099)
  =  +231.5 pc

Kepler-442 = (105.5, 228.4, 231.5) pc</div>
            <p class="sl-p"><strong>Worked example — K2-90 host star:</strong></p>
            <div class="sl-code-block">Input:   RA = 59.15°,  Dec = 22.47°,  d = 134.2 pc
         α  = 1.0327 rad,  δ = 0.3923 rad

x =  134.2 × cos(0.3923) × cos(1.0327)
  =  134.2 × 0.9239       × 0.5115
  =  +63.4 pc

y =  134.2 × sin(0.3923)
  =  134.2 × 0.3827
  =  +51.4 pc

z = −134.2 × cos(0.3923) × sin(1.0327)
  = −134.2 × 0.9239       × 0.8592
  =  −106.5 pc

K2-90 = (63.4, 51.4, −106.5) pc</div>
          </section>

          <!-- S2.2 -->
          <section :id="'l2-parallax'" class="sl-section">
            <h2 class="sl-h2">2. The parallax pipeline — full code walkthrough</h2>
            <p class="sl-p">The sky seen from a settlement is computed in <code class="sl-code">addStarField()</code> inside <code class="sl-code">src/pages/SurfaceViewPage.vue</code>. The core algorithm (Layer 2, catalog stars with parallax) operates as follows:</p>
            <div class="sl-code-block">// 1 — Observer 3D position (the settlement's host star coordinates)
const obsRA   = system.value?.ra  ?? 0
const obsDec  = system.value?.dec ?? 0
const obsDist = system.value?.sy_dist ?? 0
const obsPc   = raDecToVec3(obsRA, obsDec, obsDist)   // parsec-space vector

// 2 — For each catalog star p:
const starDist = p.sy_dist ?? 1000
const starPc   = raDecToVec3(p.ra, p.dec, starDist)

// 3 — Vector from observer to star
const relVec = new THREE.Vector3().subVectors(starPc, obsPc)
const distToStar = relVec.length()   // distance from observer to this star (parsecs)
relVec.normalize()                   // direction only — this is the sky position

// 4 — Project onto sky sphere (radius 900 scene units)
const skyPos = relVec.multiplyScalar(900)

// 5 — Colour from host star temperature
const col = starColorFromTeff(p.st_teff)

// 6 — Apparent brightness from distance to OBSERVER (not Earth)
const size = Math.max(0.4, 2.4 - Math.log10(distToStar + 1) * 0.6)</div>
            <p class="sl-p"><strong>Full numerical example — tau Ceti as seen from Kepler-442b:</strong></p>
            <div class="sl-code-block">tau Ceti: RA=26.02°, Dec=−15.94°, d=3.65 pc
  τ_pc = raDecToVec3(26.02, −15.94, 3.65)
       = (3.152, −1.004, −1.539)  pc

Observer at Kepler-442b: obsPc = (105.5, 228.4, 231.5)

relVec = τ_pc − obsPc = (3.152−105.5, −1.004−228.4, −1.539−231.5)
       = (−102.35, −229.40, −233.04)

|relVec| = √(102.35² + 229.40² + 233.04²)
         = √(10,475 + 52,624 + 54,308)
         = √117,407  ≈  342.6 pc

normalized = (−0.299, −0.670, −0.680)

Compare: direction from K-442b back to Sun = (−0.308, −0.668, −0.677)
Angle between them = arccos(dot product) ≈ 0.8°

→ From Kepler-442b, tau Ceti and the Sun appear only 0.8° apart —
  indistinguishable without a telescope. Both are tiny dots in the
  same patch of sky, because tau Ceti (3.65 pc from Earth) is
  negligibly offset compared to the 342 pc viewing distance.</div>
          </section>

          <!-- S2.3 -->
          <section :id="'l2-color'" class="sl-section">
            <h2 class="sl-h2">3. Stellar colour from effective temperature</h2>
            <p class="sl-p">The exact <code class="sl-code">starColorFromTeff()</code> function in <code class="sl-code">src/lib/three-utils.ts</code> uses a step approximation to the blackbody colour curve. For educational reference, the physically rigorous approach is to integrate Planck's law B(λ,T) over the photopic sensitivity functions for R, G, and B channels:</p>
            <div class="sl-code-block">Planck radiance:
  B(λ, T) = (2hc²/λ⁵) × 1 / (exp(hc/λkT) − 1)

  h = 6.626×10⁻³⁴ J·s   (Planck)
  c = 2.998×10⁸ m/s      (speed of light)
  k = 1.381×10⁻²³ J/K    (Boltzmann)
  λ = wavelength (m)

  Peak wavelength (Wien's law):  λ_max = b/T,  b = 2.898×10⁻³ m·K

  For K2-90 (T=4,484 K):  λ_max = 2.898×10⁻³/4484 = 646 nm  → orange/red
  For Kepler-442 (T=5,765 K):  λ_max = 2.898×10⁻³/5765 = 503 nm  → green peak
                                 → but eye integrates across all λ → appears yellow-white

Production step-function (hex colours match human perception):
  export function starColorFromTeff(teff: number | null): THREE.Color {
    if (!teff)          return new THREE.Color(0xfff4ea)  // G default
    if (teff >= 30000)  return new THREE.Color(0x9bb0ff)  // O  — blue
    if (teff >= 10000)  return new THREE.Color(0xaabfff)  // B  — blue-white
    if (teff >=  7500)  return new THREE.Color(0xcad7ff)  // A  — white
    if (teff >=  6000)  return new THREE.Color(0xf8f7ff)  // F  — yellow-white
    if (teff >=  5200)  return new THREE.Color(0xfff4ea)  // G  — solar yellow
    if (teff >=  3700)  return new THREE.Color(0xffd2a1)  // K  — orange
    return              new THREE.Color(0xffcc6f)          // M  — deep red-orange
  }</div>
          </section>

          <!-- S2.4 -->
          <section :id="'l2-exomoon'" class="sl-section">
            <h2 class="sl-h2">4. Exomoon sky — angular size and tidal physics</h2>
            <p class="sl-p">An exomoon settlement inherits the host star's parallax-shifted star catalog (the moon is at effectively the same 3D position as its parent planet for distant stars). The qualitative difference is the foreground: the parent planet fills a large fraction of the sky.</p>
            <p class="sl-p"><strong>Angular diameter formula:</strong></p>
            <div class="sl-code-block">α = 2 · arctan(R_planet / d_orbit)

where R_planet = planet radius,  d_orbit = moon orbital distance from planet centre

Example — gas giant (R = 8 R⊕ = 51,008 km) at d = 400,000 km:
  α = 2 · arctan(51,008 / 400,000)
    = 2 · arctan(0.12752)
    = 2 · 7.27°
    = 14.5°   ← about 28× the angular diameter of the Moon from Earth (0.52°)

If the moon orbits at 200,000 km:
  α = 2 · arctan(51,008 / 200,000) = 2 · 14.3° = 28.6°   ← fills 1/6 of the sky</div>
            <p class="sl-p"><strong>Tidal locking physics:</strong> Most exomoons close enough to their parent planet to be habitable will be tidally locked — one face always toward the planet, the other always facing away. The planet-facing hemisphere has the planet permanently overhead; the far hemisphere sees only stars and the host sun. The interface zone (the terminator line running pole-to-pole) sees the planet perpetually on the horizon, partially set, catching the most dramatic phase-cycle lighting.</p>
            <p class="sl-p"><strong>Hill sphere</strong> — the maximum radius at which a moon can maintain a stable orbit around the planet rather than being captured by the star:</p>
            <div class="sl-code-block">r_H = a · ∛(m_planet / 3m_star)

where a = planet's orbital semi-major axis,  m_planet/m_star in same units

Example — K2-90b (m ≈ 7.27 M⊕ = 7.27 × 5.97×10²⁴ kg = 4.34×10²⁵ kg):
  Host star mass estimated from T_eff=4484, R=0.619 R☉:
  Roughly m_star ≈ 0.55 M☉ = 0.55 × 1.989×10³⁰ kg = 1.09×10³⁰ kg

  a = 0.096 AU = 0.096 × 1.496×10⁸ km = 1.436×10⁷ km

  r_H = 1.436×10⁷ · ∛(4.34×10²⁵ / (3 × 1.09×10³⁰))
       = 1.436×10⁷ · ∛(1.328×10⁻⁵)
       = 1.436×10⁷ · 0.02359
       = 338,900 km  ≈  0.87 R☉  ≈  0.89 Earth–Moon distance

  → Stable moon orbits around K2-90b must stay within ~339,000 km.
    The Earth–Moon distance is 384,400 km — a Moon-analogue here
    would be at the edge of stability.</div>
            <p class="sl-p"><strong>Roche limit</strong> — the inner boundary inside which a fluid body would be disrupted by tidal forces:</p>
            <div class="sl-code-block">d_Roche = 2.44 · R_planet · ∛(ρ_planet / ρ_moon)

For K2-90b (R = 2.6 R⊕ = 16,565 km, assuming ρ_planet ≈ 3,500 kg/m³, ρ_moon ≈ 3,000 kg/m³):
  d_Roche = 2.44 × 16,565 × ∛(3500/3000)
           = 2.44 × 16,565 × 1.053
           = 42,560 km

  → Any natural moon must form or migrate to orbit > 42,560 km from K2-90b's centre.
    Inside this radius, tidal forces tear apart any fluid or loosely consolidated body.</div>
          </section>

          <!-- S2.5 -->
          <section :id="'l2-orbital'" class="sl-section">
            <h2 class="sl-h2">5. Orbital settlement sky — the host star as near-field object</h2>
            <p class="sl-p">An orbital station at distance d from its host star (no planetary surface) sees the star itself dominate the near-field. The star's angular diameter:</p>
            <div class="sl-code-block">α_star = 2 · arctan(R_star / d)

K2-90 (R_star = 0.619 R☉ = 0.619 × 696,000 km = 430,824 km):

  At d = 0.096 AU (K2-90b's actual orbit, 14.36×10⁶ km):
    α = 2 · arctan(430,824 / 14,360,000) = 2 · arctan(0.02999) = 2 × 1.719° = 3.44°
    (Sun from Earth: 0.534°  →  K2-90 appears 6.4× larger than our Sun)

  At d = 0.5 AU (outer habitable zone):
    α = 2 · arctan(430,824 / 74,800,000) = 2 · arctan(0.00576) = 2 × 0.330° = 0.660°
    (1.24× Sun apparent size — still noticeably orange-tinted)

  At d = 0.035 AU (K2-90c inner planet orbit, 5.24×10⁶ km):
    α = 2 · arctan(430,824 / 5,240,000) = 2 · arctan(0.08222) = 2 × 4.703° = 9.41°
    → The star covers ~9° — 18× the solar disc. Extreme radiation environment.</div>
            <p class="sl-p">On the orbital station, there is no fixed gravitational "down." The frame of reference for sky navigation is the star direction. Other planets in the system appear as moving discs cycling through phases — their angular diameters and phase angles calculable from known orbital periods and sizes.</p>
          </section>

          <!-- S2.6 -->
          <section :id="'l2-blackhole'" class="sl-section">
            <h2 class="sl-h2">6. Black hole safe orbital colony</h2>
            <p class="sl-p">A settlement orbiting a black hole must stay beyond the <strong>innermost stable circular orbit (ISCO)</strong>. For a non-rotating (Schwarzschild) black hole, the three critical radii are all multiples of the Schwarzschild radius r_s:</p>
            <div class="sl-code-block">Schwarzschild radius:   r_s    = 2GM/c²         — event horizon
Photon sphere:          r_ph   = 1.5 r_s        — light orbits (unstable)
ISCO:                   r_ISCO = 3   r_s        — innermost STABLE orbit

Constants:  G = 6.674×10⁻¹¹ m³ kg⁻¹ s⁻²
            c = 2.998×10⁸ m/s
            M☉ = 1.989×10³⁰ kg   (1 solar mass)

For 1 solar mass:  r_s = 2 × 6.674×10⁻¹¹ × 1.989×10³⁰ / (2.998×10⁸)²
                       = 2.954×10³ m  ≈  2.95 km

Scaling: r_s = 2.95 km × (M / M☉)</div>
            <p class="sl-p"><strong>Worked example — M87* (6.5 × 10⁹ M☉):</strong></p>
            <div class="sl-code-block">r_s    = 2.95 km × 6.5×10⁹ = 1.918×10¹⁰ km = 128.3 AU
r_ph   = 1.5 × 128.3 AU   = 192.4 AU
r_ISCO = 3   × 128.3 AU   = 384.9 AU

For reference:
  Mercury orbit   =   0.39 AU
  Earth orbit     =   1.00 AU
  Neptune orbit   =  30.1  AU
  Pluto orbit     =  39.5  AU
  r_ISCO (M87*)   = 384.9  AU  ← ~9.7× Pluto's orbit

A safe colony must orbit at r > 384.9 AU — beyond the equivalent of
a 10× Pluto-distance zone around a stellar-mass equivalent point.
At r_ISCO the orbital velocity approaches a significant fraction of c;
period = 2π · r_ISCO / v_orbital ≈ few years at those radii.

For a rotating (Kerr) black hole, r_ISCO shrinks:
  Prograde equatorial: r_ISCO = r_s (at maximal spin — the ergosphere boundary)
  Retrograde:          r_ISCO = 4.5 r_s
  M87* spin parameter a/M ≈ 0.90 (EHT 2019/2021 results):
    prograde r_ISCO ≈ 0.9 r_s ≈ 115 AU — tighter safe zone for co-rotating colonies</div>
            <p class="sl-p"><strong>Sky distortion near ISCO:</strong> At radii approaching r_ph, gravitational lensing bends incoming light from background stars. The apparent sky position of every star shifts toward the black hole. Near r_ph, you can simultaneously see both poles of the sky — light from directly behind you is bent around the BH and arrives from the forward direction. The result is an "Einstein ring" — a bright annulus of all background light compressed into a ring around the BH shadow. Constellations near the sky edge of the BH appear as arcs; those far from it are barely distorted. The lensing pattern is unique to each orbital radius and inclination.</p>
          </section>

          <!-- S2.7 -->
          <section :id="'l2-constellations'" class="sl-section">
            <h2 class="sl-h2">7. Constellation detection — identifying the brightest local stars</h2>
            <p class="sl-p">The parallax-shifted star catalog for each settlement is already computed and stored in the Three.js BufferGeometry's <code class="sl-code">size</code> attribute. Extracting the brightest stars — the candidates for community naming — is a sort on that attribute:</p>
            <div class="sl-code-block">// Concept — extract top N brightest from the catalog pass:
const candidates = []
for (const p of galaxyStore.planets) {
  if (p.hostname === hostname) continue
  const starPc  = raDecToVec3(p.ra, p.dec, p.sy_dist ?? 1000)
  const relVec  = starPc.clone().sub(obsPc)
  const dist    = relVec.length()
  const appSize = Math.max(0.4, 2.4 - Math.log10(dist + 1) * 0.6)
  candidates.push({ hostname: p.hostname, dir: relVec.normalize(), size: appSize, teff: p.st_teff })
}
candidates.sort((a, b) => b.size - a.size)
const top30 = candidates.slice(0, 30)

// top30 is the constellation-naming candidate pool for this settlement.
// Each entry has a sky direction, brightness, and spectral colour.
// A settlement's DAO record stores named groupings as arrays of indices into this list.</div>
            <p class="sl-p">A star in top30 for <em>Kepler-442b</em> might be the 200th brightest star from Earth. A star in top30 for <em>K2-90b</em> might include a Pleiades star that is Earth's 5th magnitude from here but appears as a magnitude 1 nearby star from inside the cluster. The sets are disjoint. The constellations are community-owned.</p>
          </section>

          <!-- S2.8 -->
          <section :id="'l2-code'" class="sl-section">
            <h2 class="sl-h2">8. Runnable code examples</h2>
            <p class="sl-p">These self-contained functions require only <code class="sl-code">THREE.js</code> (or can run as plain JavaScript by replacing <code class="sl-code">THREE.Vector3</code> with a simple object). Paste into a browser console or a CodeSandbox.</p>

            <p class="sl-p"><strong>Example 1 — place a star in parsec space:</strong></p>
            <div class="sl-code-block">function raDecToVec3(raDeg, decDeg, distPc) {
  const ra  = raDeg  * Math.PI / 180
  const dec = decDeg * Math.PI / 180
  return {
    x:  distPc * Math.cos(dec) * Math.cos(ra),
    y:  distPc * Math.sin(dec),
    z: -distPc * Math.cos(dec) * Math.sin(ra),
  }
}

const kepler442 = raDecToVec3(294.6, 41.8,   342.0)   // → {x:105.5, y:228.4, z:231.5}
const k290      = raDecToVec3(59.15, 22.47,  134.2)   // → {x:63.4,  y:51.4,  z:-106.5}
console.log('Kepler-442:', kepler442)
console.log('K2-90:',      k290)</div>

            <p class="sl-p"><strong>Example 2 — parallax shift for a target star:</strong></p>
            <div class="sl-code-block">function parallaxDirection(observerRa, observerDec, observerDist, targetRa, targetDec, targetDist) {
  const obs    = raDecToVec3(observerRa,  observerDec,  observerDist)
  const target = raDecToVec3(targetRa,    targetDec,    targetDist)
  const dx = target.x - obs.x,  dy = target.y - obs.y,  dz = target.z - obs.z
  const len = Math.sqrt(dx*dx + dy*dy + dz*dz)
  return { x: dx/len, y: dy/len, z: dz/len, distPc: len }
}

// tau Ceti as seen from Kepler-442b vs from Earth
const fromEarth   = parallaxDirection(0, 0, 0,   26.02, -15.94, 3.65)
const fromK442b   = parallaxDirection(294.6, 41.8, 342.0,  26.02, -15.94, 3.65)
console.log('tau Ceti from Earth:',     fromEarth)    // close to RA=26°, Dec=-16° direction
console.log('tau Ceti from K-442b:',   fromK442b)    // almost exactly toward Sun direction
// Angle between them:
const dot = fromEarth.x*fromK442b.x + fromEarth.y*fromK442b.y + fromEarth.z*fromK442b.z
console.log('Angular separation (°):', Math.acos(Math.min(1, dot)) * 180/Math.PI)  // ≈ 97°</div>

            <p class="sl-p"><strong>Example 3 — angular size of parent planet on exomoon surface:</strong></p>
            <div class="sl-code-block">function angularDiameterDeg(radiusKm, distanceKm) {
  return 2 * Math.atan(radiusKm / distanceKm) * 180 / Math.PI
}

const moonAngle  = angularDiameterDeg(1737,  384400)   // Moon from Earth  → 0.518°
const jupAngle   = angularDiameterDeg(71492, 400000)   // Jupiter from Europa-distance → 14.5°
const k290bAngle = angularDiameterDeg(2.6 * 6371, 300000) // K2-90b from hypothetical moon
console.log('Moon from Earth (°):', moonAngle.toFixed(3))
console.log('Jupiter from Europa-type moon (°):', jupAngle.toFixed(2))
console.log('K2-90b from 300,000 km moon (°):', k290bAngle.toFixed(2))</div>

            <p class="sl-p"><strong>Example 4 — Schwarzschild radius and ISCO:</strong></p>
            <div class="sl-code-block">const G   = 6.674e-11   // m³ kg⁻¹ s⁻²
const c   = 2.998e8    // m/s
const Msun = 1.989e30  // kg
const AU_m = 1.496e11  // metres per AU

function schwarzschildAU(massSolarMasses) {
  const r_s_m = 2 * G * (massSolarMasses * Msun) / (c * c)
  return r_s_m / AU_m
}

const r_s_M87  = schwarzschildAU(6.5e9)         // M87* Schwarzschild radius
const r_isco   = 3 * r_s_M87                    // ISCO for non-rotating BH
console.log('M87* r_s (AU):', r_s_M87.toFixed(1))    // → 128.3 AU
console.log('M87* r_ISCO (AU):', r_isco.toFixed(1))  // → 384.9 AU
console.log('r_ISCO / Pluto orbit:', (r_isco / 39.5).toFixed(1), '× Pluto')  // → 9.7×</div>

            <p class="sl-p"><strong>Example 5 — Hill sphere radius:</strong></p>
            <div class="sl-code-block">function hillSphereKm(orbitSemiMajorAU, planetMassKg, starMassKg) {
  const a_km = orbitSemiMajorAU * 1.496e8   // AU → km
  return a_km * Math.cbrt(planetMassKg / (3 * starMassKg))
}

const K290b_mass = 7.27 * 5.97e24   // kg (7.27 Earth masses)
const K290_star  = 0.55 * 1.989e30  // kg (estimated ~0.55 solar masses for K-dwarf)
const hillKm = hillSphereKm(0.096, K290b_mass, K290_star)
console.log('K2-90b Hill sphere (km):', hillKm.toFixed(0))   // → ~339,000 km
console.log('Earth–Moon distance: 384,400 km')
console.log('Moon-analogue barely fits:', hillKm > 384400 ? 'NO' : 'YES (just)') // → YES (just)</div>
          </section>

        </template>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- LESSON 3 — Galactic Center Astrophysics                        -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <template v-if="activeLesson === 3">

          <div class="sl-lesson-header">
            <div class="sl-lesson-badge sl-lesson-badge--adv">GRAD / PUBLIC SCIENCE</div>
            <h1 class="sl-h1">Galactic Center Astrophysics</h1>
            <p class="sl-intro">The math and physics behind the Sgr A* scene — from Kepler's equation and orbital elements, through Schwarzschild geometry and time dilation, to accretion disk thermophysics and the Event Horizon Telescope image. Everything in the <router-link to="/galactic-center" class="sl-inline-link">Galactic Center</router-link> visualization is grounded in these derivations.</p>
            <div class="sl-meta">
              <span class="sl-meta-item">Objects: Sgr A* · S2 · IRS 13E</span>
              <span class="sl-meta-item">Math: Kepler · Schwarzschild · Kerr</span>
              <span class="sl-meta-item">Data: GRAVITY Collaboration 2022</span>
            </div>
          </div>

          <!-- S3.1 -->
          <section :id="'l3-why-sgra'" class="sl-section">
            <h2 class="sl-h2">1. Why Sagittarius A* is the most studied black hole</h2>
            <p class="sl-p">There are two black holes whose images we have directly obtained: M87* (6.5 × 10⁹ solar masses, 55 million light-years away) and Sagittarius A* (4.154 × 10⁶ solar masses, 26,000 light-years away). Our galaxy's central black hole wins on every metric that matters for science:</p>
            <table class="sl-table">
              <tr><th>Property</th><th>Sgr A*</th><th>M87*</th></tr>
              <tr><td>Mass</td><td>4.154 × 10⁶ M☉</td><td>6.5 × 10⁹ M☉</td></tr>
              <tr><td>Distance</td><td>8,178 pc (26,000 ly)</td><td>16.8 Mpc (55 × 10⁶ ly)</td></tr>
              <tr><td>Angular size of shadow</td><td>51.8 μas (EHT 2022)</td><td>42 μas (EHT 2019)</td></tr>
              <tr><td>Schwarzschild radius</td><td>0.082 AU</td><td>128 AU</td></tr>
              <tr><td>ISCO radius</td><td>~0.37 AU (Kerr a*≈0.5)</td><td>~100–384 AU</td></tr>
              <tr><td>Event timescale</td><td>minutes (flares 5–6/day)</td><td>months–years</td></tr>
              <tr><td>Orbital monitoring</td><td>S-stars tracked for 30+ years</td><td>no resolved stellar orbits</td></tr>
            </table>
            <p class="sl-p">Sgr A* appears almost the same angular size on the sky as M87* despite being 1,500× less massive and 2,000× closer — a remarkable coincidence that the Event Horizon Telescope exploited to image both. But the critical advantage is the <strong>S-star cluster</strong>: a population of hot young stars orbiting within a few light-weeks of the black hole, whose orbital motion gives us the most direct mass measurement of any black hole in the universe.</p>
            <div class="sl-callout sl-callout--info">The S-star S2 completes one full orbit around Sgr A* every 16 years. Its periapsis approach in 2018 was measured by the GRAVITY interferometer at 1 microarcsecond precision — confirming general relativistic effects including Schwarzschild precession and gravitational redshift in a regime no prior test had reached.</div>
          </section>

          <!-- S3.2 -->
          <section :id="'l3-kepler3'" class="sl-section">
            <h2 class="sl-h2">2. Kepler's Third Law — weighing a black hole from a stellar orbit</h2>
            <p class="sl-p">Newton's generalization of Kepler's Third Law connects an orbit's period P and semi-major axis a to the total mass of the system M:</p>
            <div class="sl-code-block">P² = (4π² / GM) · a³

Rearranged to solve for mass:
  M = 4π² · a³ / (G · P²)

Constants:
  G = 6.674 × 10⁻¹¹  m³ kg⁻¹ s⁻²
  1 AU = 1.496 × 10¹¹ m
  1 yr = 3.156 × 10⁷ s
  1 M☉ = 1.989 × 10³⁰ kg</div>
            <p class="sl-p"><strong>Worked example — S2 orbit:</strong> The GRAVITY interferometer measures S2's angular semi-major axis as 125.058 milliarcseconds (mas). At the Galactic Center distance R₀ = 8,178 parsecs (1 pc = 3.086 × 10¹⁶ m), the physical semi-major axis is:</p>
            <div class="sl-code-block">a = θ_arcsec × R₀_pc × 1 AU/arcsec
  = 0.125058" × 8178 pc × (1 AU / 1")

But 1 pc = 206,265 AU, so:
  a = 0.125058 × 8178 × 1 AU  (in units where 1 pc subtends 1 AU at 206,265 pc)

Actually: a_AU = θ_arcsec × R₀_pc = 0.125058 × 8178 = 1022.9 AU

Convert to metres: a = 1022.9 × 1.496 × 10¹¹ = 1.530 × 10¹⁴ m

S2 period: P = 16.0455 yr = 16.0455 × 3.156 × 10⁷ = 5.065 × 10⁸ s

Sgr A* mass: M = 4π² × a³ / (G × P²)
  a³ = (1.530 × 10¹⁴)³ = 3.582 × 10⁴² m³
  P² = (5.065 × 10⁸)² = 2.565 × 10¹⁷ s²
  GP² = 6.674 × 10⁻¹¹ × 2.565 × 10¹⁷ = 1.712 × 10⁷ m³ s⁻² kg⁻¹ × kg → 1.712 × 10⁷
  M = 39.478 × 3.582 × 10⁴² / 1.712 × 10⁷ = 8.258 × 10³⁶ kg

In solar masses: 8.258 × 10³⁶ / 1.989 × 10³⁰ = 4.152 × 10⁶ M☉  ✓

Agrees with published value 4.154 × 10⁶ M☉ (GRAVITY Collaboration 2022)</div>
            <div class="sl-callout sl-callout--warning">This mass measurement has no equivalent in astronomy — it directly weighs a single object with no assumptions about gas physics, light emission, or dark matter distribution. It is the most precise measurement of any supermassive black hole.</div>
          </section>

          <!-- S3.3 -->
          <section :id="'l3-elements'" class="sl-section">
            <h2 class="sl-h2">3. The six Keplerian orbital elements — a star's full address in space</h2>
            <p class="sl-p">Any bound orbit in Newtonian gravity is an ellipse. Six numbers — the <strong>Keplerian orbital elements</strong> — uniquely specify the shape, orientation, and timing of that ellipse in 3D space:</p>
            <table class="sl-table">
              <tr><th>Symbol</th><th>Name</th><th>What it describes</th><th>S2 value</th></tr>
              <tr><td>a</td><td>Semi-major axis</td><td>Half the longest axis of the ellipse; sets overall orbit size</td><td>1,023 AU</td></tr>
              <tr><td>e</td><td>Eccentricity</td><td>How elongated (0 = circle, 1 = parabola). Periapsis = a(1−e), apoapsis = a(1+e)</td><td>0.8843</td></tr>
              <tr><td>i</td><td>Inclination</td><td>Tilt of the orbital plane relative to the reference plane (here: sky plane)</td><td>134.6°</td></tr>
              <tr><td>Ω</td><td>Longitude of ascending node</td><td>Where the orbit crosses the reference plane going "up"; measured from north celestial pole</td><td>228.2°</td></tr>
              <tr><td>ω</td><td>Argument of periapsis</td><td>Rotation of the ellipse within its plane; angle from ascending node to periapsis</td><td>66.1°</td></tr>
              <tr><td>t_p</td><td>Time of periapsis</td><td>When the star was closest to Sgr A*</td><td>2002.315</td></tr>
            </table>
            <p class="sl-p">For S2: periapsis distance = a(1 − e) = 1023 × (1 − 0.8843) = <strong>118 AU</strong>, at which point S2 travels at 7,650 km/s (2.55% of c). Apoapsis = a(1 + e) = 1023 × 1.8843 = <strong>1928 AU</strong>. At epoch 2026.5, S2 is near apoapsis (mean anomaly ≈ 180° through its current orbit).</p>
            <p class="sl-p">To convert these six numbers into a 3D Cartesian position [x, y, z], we use a sequence of rotations: first rotate by ω in the orbital plane to get from the ascending node to the star's position, then by i to tilt the plane, then by Ω to align with the reference frame. In the Galactic Center scene this is the function <code class="sl-code">orbitalToXYZ()</code> in <code class="sl-code">src/data/galactic-center.ts</code>:</p>
            <div class="sl-code-block">// Position in orbital plane
xOrb = r · cos(ν)      // ν = true anomaly (angle from periapsis)
yOrb = r · sin(ν)

// Rotate to 3D frame via ω, i, Ω:
x = (cos Ω cos ω − sin Ω sin ω cos i) xOrb + (−cos Ω sin ω − sin Ω cos ω cos i) yOrb
y = (sin Ω cos ω + cos Ω sin ω cos i) xOrb + (−sin Ω sin ω + cos Ω cos ω cos i) yOrb
z = (sin ω sin i) xOrb + (cos ω sin i) yOrb</div>
          </section>

          <!-- S3.4 -->
          <section :id="'l3-keplerEq'" class="sl-section">
            <h2 class="sl-h2">4. Kepler's equation — why orbits can't be solved with algebra</h2>
            <p class="sl-p">Given the six orbital elements and a target time t, what is the star's actual position? This requires finding the <strong>true anomaly</strong> ν — the angle from periapsis to the current position, measured at the focus. The route from time to true anomaly has three steps:</p>
            <div class="sl-code-block">Step 1 — Mean anomaly M (uniform, grows linearly with time):
  M = 2π · (t − t_p) / P
  → For S2 at 2026.5: M = 2π × (2026.5 − 2002.315) / 16.0455 = 9.467 rad ≡ 182° (mod 360°)

Step 2 — Eccentric anomaly E (Kepler's equation — transcendental):
  E − e sin(E) = M                  ← cannot be solved algebraically
  → Solve by Newton-Raphson iteration:
       E₀ = M  (starting guess; use π for high eccentricity e > 0.8)
       E_{n+1} = E_n − (E_n − e sin E_n − M) / (1 − e cos E_n)
       Repeat until |ΔE| < 10⁻¹²  (converges in 3–15 iterations for e < 0.99)

  For S2 (e = 0.8843, M ≈ 3.226 rad):
    E ≈ 3.163 rad ≈ 181.3°

Step 3 — True anomaly ν from eccentric anomaly E:
  tan(ν/2) = √((1 + e)/(1 − e)) · tan(E/2)
  ν = 2 · atan2(√(1+e) · sin(E/2),  √(1−e) · cos(E/2))
  → For S2 at 2026.5: ν ≈ 179.7° → near apoapsis ✓

Step 4 — Radius from E:
  r = a(1 − e cos E) = 1023 × (1 − 0.8843 × cos(181.3°)) = 1023 × 1.884 ≈ 1927 AU</div>
            <p class="sl-p">The reason Kepler's equation is transcendental (has no closed-form solution) is that orbital motion sweeps equal areas in equal times (Kepler's second law), but the geometric angle along an ellipse does not vary uniformly — the star moves fastest near periapsis and slowest near apoapsis. The eccentric anomaly E is an intermediate "linearized" angle that accounts for this.</p>
            <div class="sl-callout sl-callout--info">For very high eccentricities (e → 1, as in S62 at e = 0.976 or S4714 at e = 0.985), the star spends almost all its time near apoapsis and flashes through periapsis in a tiny fraction of the period. S4714's closest approach (13 AU from Sgr A*, 161 Schwarzschild radii) lasts only a few days out of its 12-year orbit.</div>
          </section>

          <!-- S3.5 -->
          <section :id="'l3-schwarzschild'" class="sl-section">
            <h2 class="sl-h2">5. Schwarzschild geometry — the three critical radii</h2>
            <p class="sl-p">For a non-rotating (Schwarzschild) black hole, three radii define the structure of spacetime around it:</p>
            <div class="sl-code-block">1. Schwarzschild radius (event horizon):
   r_s = 2GM/c²

   For 1 M☉:   r_s = 2 × 6.674×10⁻¹¹ × 1.989×10³⁰ / (2.998×10⁸)²
                    = 2.954 × 10³ m  ≈  2.95 km

   Scaling:    r_s = 2.95 km × (M / M☉)

   For Sgr A* (4.154 × 10⁶ M☉):
               r_s = 2.95 × 4.154 × 10⁶ km = 1.226 × 10⁷ km = 12.26 million km
               r_s = 12.26 × 10⁶ / 1.496 × 10⁸ AU = 0.0820 AU ✓

2. Photon sphere:
   r_ph = 1.5 r_s = 3GM/c²

   Light can orbit the BH here — but the orbit is unstable. A photon
   displaced outward escapes; displaced inward falls in. From r_ph,
   the entire sky collapses to a single bright ring above and below.

   For Sgr A*: r_ph = 1.5 × 0.0820 AU = 0.123 AU = 18.4 million km

3. Innermost Stable Circular Orbit (ISCO):
   r_ISCO = 3 r_s = 6GM/c²   (Schwarzschild — non-rotating)

   Inside r_ISCO, circular orbits are unstable: any perturbation
   causes the object to spiral inward and fall into the BH.
   This is the inner edge of the accretion disk and the minimum
   safe settlement radius.

   For Sgr A* (Schwarzschild): r_ISCO = 3 × 0.0820 = 0.246 AU</div>
            <p class="sl-p">The <strong>Schwarzschild metric</strong> is the exact solution to Einstein's field equations for a spherically symmetric mass:</p>
            <div class="sl-code-block">ds² = −(1 − r_s/r) c² dt² + (1 − r_s/r)⁻¹ dr² + r² dΩ²

The key consequence for a settlement: at orbital radius r,
the ratio of proper time (local clock) to coordinate time (distant observer) is:

  dτ/dt = √(1 − r_s/r)         ← gravitational time dilation

At the photon sphere (r = 1.5 r_s):  dτ/dt = √(1 − 2/3) = √(1/3) = 0.577
At ISCO (r = 3 r_s):                 dτ/dt = √(1 − 1/3) = √(2/3) = 0.816
At 50 r_s:                           dτ/dt = √(1 − 1/50) = √0.980 = 0.990
At 1400 r_s (S2 periapsis):          dτ/dt = √(1 − 1/1400)      = 0.9996</div>
          </section>

          <!-- S3.6 -->
          <section :id="'l3-kerr'" class="sl-section">
            <h2 class="sl-h2">6. Kerr black holes — spin changes everything</h2>
            <p class="sl-p">Real black holes rotate. The Kerr metric (1963) describes spacetime around a spinning black hole. The spin parameter a* = J/(Mc) ranges from 0 (Schwarzschild) to 1 (maximally rotating). Sgr A*'s spin is poorly constrained but estimated at 0.1–0.9; our model uses a* ≈ 0.5.</p>
            <p class="sl-p">Spin radically changes the ISCO:</p>
            <div class="sl-code-block">ISCO radius vs. spin parameter (prograde equatorial orbit):

  a* = 0.0  (Schwarzschild):     r_ISCO = 6.0 r_s
  a* = 0.5:                      r_ISCO ≈ 4.2 r_s
  a* = 0.9:                      r_ISCO ≈ 2.3 r_s
  a* = 0.998 (near-maximal):     r_ISCO ≈ 1.24 r_s
  a* = 1.0   (extremal):         r_ISCO = 1.0 r_s  (ISCO = event horizon)

  Retrograde orbit: r_ISCO grows larger — up to 9 r_s at a* = 1

For Sgr A* at a* ≈ 0.5:
  Prograde ISCO ≈ 4.2 r_s = 4.2 × 0.082 AU = 0.344 AU = 51.5 million km

The Kerr metric also predicts an ergosphere — a region outside the event horizon
where spacetime itself rotates faster than c:
  r_ergo = r_s / 2 + √( (r_s/2)² − (a*)² cos²θ · r_s² )
  At the equator (θ = π/2): r_ergo = r_s

  Nothing inside the ergosphere can remain stationary — frame-dragging
  forces all objects to co-rotate with the BH. Energy can be extracted
  from the ergosphere via the Penrose process.</div>
            <div class="sl-callout sl-callout--info">The Blandford-Znajek mechanism — electromagnetic extraction of spin energy from the ergosphere — is the leading explanation for relativistic jets. Sgr A* shows only weak jets (it's under-fed), unlike M87* where the jet extends 5,000 light-years and is visible from Earth. Future measurement of Sgr A*'s spin by the ngEHT may distinguish between competing jet models.</div>
          </section>

          <!-- S3.7 -->
          <section :id="'l3-timedilation'" class="sl-section">
            <h2 class="sl-h2">7. Gravitational time dilation — clocks that run differently near a black hole</h2>
            <p class="sl-p">The Schwarzschild metric tells us that a clock at radius r runs slower than a clock far from the black hole by the factor:</p>
            <div class="sl-code-block">τ/t = √(1 − r_s/r)          (gravitational time dilation, Schwarzschild)

This has two physical consequences:

1. GRAVITATIONAL REDSHIFT — photons emitted at radius r arrive at
   infinity with wavelength stretched by:
   λ_obs / λ_emit = 1 / √(1 − r_s/r)  = 1 / (τ/t)

   At r = 3 r_s (ISCO): z = 1/0.816 − 1 = 0.225 → 22.5% redshift
   (S2 shows z ≈ 0.000179 at periapsis due to gravitational + Doppler effects,
    first detected by GRAVITY Collaboration 2018 — direct test of GR at BH)

2. TIME EXPERIENCE — a year at the ISCO Platform (r = 4.5 r_s):
   τ/t = √(1 − 1/4.5) = √(0.778) = 0.882
   → 1 year passes locally for every 1.134 years far away
   → A 10-year mission costs 11.3 years of "calendar time" outside

Settlement zone comparison (Sgr A*):
  Photon Sphere Station  r = 1.5 r_s    τ/t = 0.577   (slowest clock)
  ISCO Platform          r = 4.5 r_s    τ/t = 0.832
  Flare Observatory      r = 6.0 r_s    τ/t = 0.913
  Accretion Disk Mid     r = 50  r_s    τ/t = 0.990
  S2 Transit Deck        r = 1400 r_s   τ/t = 0.9996  (barely measurable)</div>
            <p class="sl-p">For a complete treatment including orbital velocity (special relativistic time dilation) the formula is more complex. At periapsis S2 travels at 7,650 km/s (β = 0.0255), adding a Lorentz factor γ = 1/√(1−β²) = 1.000326 on top of the gravitational effect. Both effects were measured simultaneously by GRAVITY in 2018.</p>
          </section>

          <!-- S3.8 -->
          <section :id="'l3-disk'" class="sl-section">
            <h2 class="sl-h2">8. Accretion disk physics — why Sgr A* glows, flares, and heats</h2>
            <p class="sl-p">Matter falling toward a black hole forms a disk because angular momentum prevents it from falling straight in. As material loses energy through viscosity and magnetic instability (magnetorotational instability, MRI), it spirals slowly inward, converting gravitational potential energy to heat and radiation.</p>
            <p class="sl-p"><strong>Temperature profile:</strong> For a geometrically thin, optically thick "Shakura-Sunyaev" disk, the effective temperature at radius r is:</p>
            <div class="sl-code-block">T(r) ∝ (M_dot / M²)^(1/4) · (r/r_s)^(-3/4) · f(r)^(1/4)

where f(r) = 1 − √(r_ISCO/r)  is a correction that drives T → 0 at r_ISCO

Simplified approximate temperature for Sgr A* accretion disk:
  At r ≈ 50 r_s  (hot inner edge, ~4 AU):    T ≈ 10⁷ K   (10 million K)
  At r ≈ 360 r_s (mid disk, ~30 AU):         T ≈ 10⁵ K   (100,000 K)
  At r ≈ 1000 r_s (outer disk, ~82 AU):      T ≈ 10⁴ K   (10,000 K)

These temperatures emit mostly as:
  10⁷ K → X-ray  (peak: λ_peak = 2.898 mm·K / 10⁷ K = 0.29 nm)
  10⁵ K → UV     (peak: λ_peak = 29 nm)
  10⁴ K → near-IR/optical (peak: λ_peak = 290 nm)</div>
            <p class="sl-p"><strong>Doppler brightening:</strong> The disk rotates at near-relativistic speeds near the ISCO. The approaching side (moving toward the observer) is <strong>relativistically beamed</strong> — photons are blue-shifted and compressed into a smaller solid angle, making that side appear 2–5× brighter. This asymmetry is the diagnostic signature of a rotating accretion disk and is visible in the EHT image of M87*. In our scene, we model this with a per-vertex color shift proportional to cos(azimuth).</p>
            <p class="sl-p"><strong>Flares:</strong> Sgr A* is not feeding steadily. Its current accretion rate is ~10⁻⁸ M☉/year — tiny by AGN standards. Instead of a bright continuous disk, it has a dim disk punctuated by brief bright flares every few hours. JWST MIRI observations (2025) detected 5–6 major flares per day, originating from compact plasmoid structures at ~6 Schwarzschild radii — consistent with <strong>magnetic reconnection</strong> events where opposing magnetic field lines snap and release energy (like solar flares, but 10¹⁰× more energetic). Plasmoid orbital speeds at 6 r_s are ~0.3 c.</p>
          </section>

          <!-- S3.9 -->
          <section :id="'l3-irs13e'" class="sl-section">
            <h2 class="sl-h2">9. IRS 13E — watching an intermediate-mass black hole spiral in</h2>
            <p class="sl-p">IRS 13E is a compact cluster of massive stars located 0.1 light-years (6,300 AU) from Sgr A*. It contains an intermediate-mass black hole (IMBH) candidate with mass ≥ 10,000 M☉, surrounded by 6 Wolf-Rayet stars being stripped by Sgr A*'s tidal field.</p>
            <p class="sl-p"><strong>What is an IMBH?</strong> Black holes come in three established mass ranges: stellar (3–100 M☉, formed from collapsing stars), supermassive (10⁶–10¹⁰ M☉, found in galactic nuclei), and intermediate (10²–10⁶ M☉, poorly understood). IMBHs are the missing link: they are predicted to form in dense star clusters and migrate to galactic centers over billions of years, building up SMBHs through repeated mergers. IRS 13E is currently the best-studied IMBH candidate with direct evidence (multi-disk structure from VLT + ALMA + Chandra).</p>
            <p class="sl-p"><strong>Dynamical friction:</strong> The IRS 13E cluster sinks toward Sgr A* via Chandrasekhar dynamical friction — the gravitational drag exerted by the cluster on the surrounding sea of stars and dark matter. The timescale is:</p>
            <div class="sl-code-block">t_fric ≈ (M_cluster / M_star) × t_cross × ln(Λ)⁻¹

where ln(Λ) is the Coulomb logarithm (~10 for galactic center conditions)
and t_cross is the crossing time of the Nuclear Star Cluster.

Estimate for IRS 13E at 0.1 ly from Sgr A*:
  M_cluster ~ 5 × 10⁴ M☉
  t_fric ~ 10 Myr → cluster will merge with Sgr A* in ~10 million years

Current separation: 6,300 AU → IMBH orbital period around Sgr A*:
  P ≈ √(a³/M) = √(6300³ / 4.154 × 10⁶) yr
    = √(2.50 × 10¹¹ / 4.154 × 10⁶)
    = √(6.02 × 10⁴)
    = 245 yr   ← the cluster completes one orbit every ~245 years</div>
            <p class="sl-p"><strong>Gravitational waves:</strong> As the IMBH spirals in, it radiates gravitational waves — an <strong>intermediate mass-ratio inspiral</strong> (IMRI). These waves are in the millihertz frequency band detectable by the future LISA space interferometer (launch 2037). When the IMBH reaches r ~ 100 r_s from Sgr A*, the inspiral enters the "plunge" phase — the last few hundred orbits produce a gravitational wave chirp of increasing frequency and amplitude. LISA is expected to detect events like IRS 13E's final inspiral throughout the galaxy, providing the most precise tests of general relativity near the ISCO ever performed.</p>
            <div class="sl-callout sl-callout--warning">Note on data: The IMBH interpretation of IRS 13E is strong but not yet universally accepted — some models explain the multi-disk structure as an unusually massive stellar cluster without a central BH. The mass lower limit of ≥ 10,000 M☉ (Schödel et al. 2023) is firm; the question is whether it is concentrated in a single object or distributed among stellar remnants.</div>
          </section>

          <!-- S3.10 -->
          <section :id="'l3-eht'" class="sl-section">
            <h2 class="sl-h2">10. Event Horizon Telescope — imaging the unseeable</h2>
            <p class="sl-p">The 2022 image of Sgr A* from the Event Horizon Telescope (EHT) is one of the most technically demanding observations in the history of astronomy. The challenge: the apparent angular diameter of Sgr A*'s shadow is only 51.8 microarcseconds (μas). For comparison, the full Moon is 1,800,000 μas — Sgr A*'s shadow is 35 million times smaller.</p>
            <p class="sl-p"><strong>Very Long Baseline Interferometry (VLBI):</strong> To achieve this resolution, the EHT links radio telescopes at wavelength λ = 1.3 mm across a baseline D equal to Earth's diameter (12,742 km). The diffraction-limited resolution is:</p>
            <div class="sl-code-block">θ_min = λ / D                 (angular resolution, radians)
      = 1.3 × 10⁻³ m / 1.274 × 10⁷ m
      = 1.020 × 10⁻¹⁰ rad
      = 1.020 × 10⁻¹⁰ × 206,265 × 10⁶ μas
      = 21 μas

Sgr A* shadow diameter (EHT 2022): 51.8 ± 2.3 μas  ✓  (resolved at ~2.5 beam widths)

Shadow diameter from the Schwarzschild radius:
  The shadow diameter (not the event horizon but its lensed image) is:
  θ_shadow = 5√3 × r_s / D_GC       (for a Schwarzschild BH)
           = 5√3 × 12.26 × 10⁶ km / (8178 pc × 3.086 × 10¹³ km/pc)
           = 8.66 × 12.26 × 10⁶ / (2.524 × 10¹⁷)
           = 1.061 × 10⁸ / 2.524 × 10¹⁷  rad
           = 4.20 × 10⁻¹⁰ rad = 86.7 μas (predicted without spin effects)

  Spin and viewing angle reduce this slightly. Measured: 51.8 μas.
  The factor 5√3 comes from the photon capture cross-section in GR:
  photons inside 2.6 r_s (the photon capture radius) are absorbed by the BH,
  creating the dark "shadow" region.</div>
            <p class="sl-p"><strong>Why Sgr A* was harder to image than M87*:</strong> Despite similar angular sizes, Sgr A*'s mass is 1,500× smaller, so its event timescale (light crossing time of the Schwarzschild radius) is 1,500× shorter — just 20 seconds. During the hours-long EHT observation, the emission structure changes continuously. The collaboration required new imaging algorithms that average over these rapid variations. M87* is essentially static on these timescales.</p>
            <div class="sl-callout sl-callout--info">The EHT image shows the photon ring — a bright ring of lensed light around the dark shadow. This ring is created by photons that orbit the BH once, twice, or more before escaping. The n=0 ring (direct emission) is widest; n=1 (one orbit) is thinner; n=2 etc. are exponentially fainter and thinner. Future higher-frequency VLBI (the ngEHT at 0.87 mm or 0.345 mm) aims to resolve individual photon rings and directly measure Sgr A*'s spin.</div>
          </section>

        </template>

      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// ── Lesson state ──────────────────────────────────────────────────────────────

const route = useRoute()
const activeLesson  = ref(route.query.lesson ? Number(route.query.lesson) : 1)
const activeSection = ref('')
const contentEl     = ref<HTMLElement | null>(null)

function setLesson(n: number) {
  activeLesson.value = n
  activeSection.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Section nav definitions ───────────────────────────────────────────────────

const SECTIONS_L1 = [
  { id: 'l1-big-idea',     label: '1. The big idea'                  },
  { id: 'l1-star-address', label: '2. Star addresses'                },
  { id: 'l1-parallax',     label: '3. Parallax — the pencil trick'   },
  { id: 'l1-kepler442',    label: '4. Kepler-442b sky'               },
  { id: 'l1-k290',         label: '5. K2-90b — inside the Pleiades' },
  { id: 'l1-orange-sun',   label: '6. The orange sun of K2-90'       },
  { id: 'l1-activity',     label: '7. Activity & answers'            },
]

const SECTIONS_L2 = [
  { id: 'l2-coords',        label: '1. Coordinate transform'       },
  { id: 'l2-parallax',      label: '2. Parallax pipeline'          },
  { id: 'l2-color',         label: '3. Stellar colour (T_eff)'     },
  { id: 'l2-exomoon',       label: '4. Exomoon — angular size'     },
  { id: 'l2-orbital',       label: '5. Orbital settlement sky'     },
  { id: 'l2-blackhole',     label: '6. Black hole safe orbit'      },
  { id: 'l2-constellations',label: '7. Constellation detection'   },
  { id: 'l2-code',          label: '8. Runnable code examples'     },
]

const SECTIONS_L3 = [
  { id: 'l3-why-sgra',     label: '1. Why Sgr A* is unique'          },
  { id: 'l3-kepler3',      label: '2. Weighing a black hole'         },
  { id: 'l3-elements',     label: '3. Six orbital elements'          },
  { id: 'l3-keplerEq',     label: '4. Kepler\'s equation'            },
  { id: 'l3-schwarzschild',label: '5. Schwarzschild geometry'        },
  { id: 'l3-kerr',         label: '6. Kerr BH — spin changes everything' },
  { id: 'l3-timedilation', label: '7. Gravitational time dilation'   },
  { id: 'l3-disk',         label: '8. Accretion disk physics'        },
  { id: 'l3-irs13e',       label: '9. IRS 13E — IMBH dynamics'       },
  { id: 'l3-eht',          label: '10. EHT — imaging the unseeable'  },
]

const activeSections = computed(() =>
  activeLesson.value === 1 ? SECTIONS_L1
  : activeLesson.value === 2 ? SECTIONS_L2
  : SECTIONS_L3
)

// ── Scroll tracking ───────────────────────────────────────────────────────────

function onWindowScroll() {
  const ids = activeSections.value.map(s => s.id)
  for (const id of [...ids].reverse()) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top < 120) {
      activeSection.value = id
      break
    }
  }
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.pageYOffset - 70
  window.scrollTo({ top: y, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onWindowScroll))
onUnmounted(() => window.removeEventListener('scroll', onWindowScroll))
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.sl-page {
  background: #020408;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.sl-topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  height: 48px;
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.95);
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}

.sl-home-link {
  display: flex; align-items: baseline; gap: 2px; text-decoration: none;
  font-size: 12px; font-weight: 300; letter-spacing: 0.16em; flex-shrink: 0;
  transition: opacity 0.12s;
}
.sl-home-link:hover { opacity: 0.75; }
.sl-home-exo   { color: #4dd0e1; }
.sl-home-topia { color: #90a4ae; }
.sl-home-arrow { color: rgba(80,160,200,0.50); font-size: 10px; margin-left: 3px; }

.sl-breadcrumb {
  font-size: 9px; letter-spacing: 0.14em; color: rgba(80,140,180,0.50);
  display: flex; align-items: center; gap: 8px;
}
.sl-bread-link { color: rgba(0,200,240,0.65); text-decoration: none; }
.sl-bread-link:hover { color: #00e5ff; }
.sl-bread-sep  { color: rgba(80,120,160,0.35); }

/* ── Layout ───────────────────────────────────────────────────────────────── */
.sl-layout {
  display: flex;
  flex: 1;
  margin-top: 48px;
  min-height: calc(100vh - 48px);
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
.sl-nav {
  width: 230px;
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.90);
  border-right: 1px solid rgba(0, 70, 120, 0.20);
  padding: 16px 0 40px;
  position: sticky;
  top: 48px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,100,160,0.20) transparent;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sl-lesson-selector {
  padding: 0 12px 16px;
  border-bottom: 1px solid rgba(0,60,110,0.18);
}

.sl-selector-label {
  font-size: 7.5px; letter-spacing: 0.18em; color: rgba(0,180,220,0.45);
  margin-bottom: 10px; padding: 0 2px;
}

.sl-lesson-btn {
  display: flex; flex-direction: column; gap: 3px;
  width: 100%; text-align: left;
  padding: 10px 12px; margin-bottom: 6px;
  background: rgba(0,10,28,0.60);
  border: 1px solid rgba(0,70,120,0.25);
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.sl-lesson-btn:hover { border-color: rgba(0,180,220,0.45); background: rgba(0,20,50,0.70); }
.sl-lesson-btn--active {
  border-color: rgba(0,210,255,0.55);
  background: rgba(0,40,90,0.50);
}

.sl-lesson-grade {
  font-size: 7px; letter-spacing: 0.16em;
  color: rgba(0,200,240,0.60);
}
.sl-lesson-btn--active .sl-lesson-grade { color: rgba(0,220,255,0.80); }

.sl-lesson-title {
  font-size: 9.5px; color: rgba(160,210,240,0.75); line-height: 1.45;
}
.sl-lesson-btn--active .sl-lesson-title { color: rgba(200,235,255,0.92); }

.sl-nav-sections {
  padding: 16px 12px 0;
  display: flex; flex-direction: column; gap: 1px;
}

.sl-nav-head {
  font-size: 7.5px; letter-spacing: 0.16em; color: rgba(0,160,200,0.40);
  margin-bottom: 8px;
}

.sl-nav-item {
  padding: 5px 8px; font-size: 9px; color: rgba(110,165,205,0.60);
  cursor: pointer; text-decoration: none; display: block;
  border-radius: 3px; letter-spacing: 0.02em;
  transition: background 0.10s, color 0.10s;
  border-left: 2px solid transparent;
}
.sl-nav-item:hover { background: rgba(0,30,70,0.55); color: rgba(0,220,255,0.82); }
.sl-nav-item--active {
  color: rgba(0,220,255,0.88);
  background: rgba(0,40,90,0.45);
  border-left-color: rgba(0,200,255,0.50);
}

.sl-nav-foot {
  margin-top: auto;
  padding: 16px 14px 0;
  border-top: 1px solid rgba(0,60,110,0.18);
}
.sl-foot-link {
  font-size: 8.5px; color: rgba(0,180,220,0.55); text-decoration: none;
  letter-spacing: 0.06em; transition: color 0.12s;
}
.sl-foot-link:hover { color: rgba(0,220,255,0.80); }

/* ── Content ──────────────────────────────────────────────────────────────── */
.sl-content {
  flex: 1;
  padding: 28px 48px 100px;
  max-width: 820px;
}

/* ── Lesson header ────────────────────────────────────────────────────────── */
.sl-lesson-header {
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
}

.sl-lesson-badge {
  display: inline-block;
  font-size: 8px; letter-spacing: 0.18em;
  color: rgba(0,200,240,0.75);
  background: rgba(0,40,80,0.50);
  border: 1px solid rgba(0,160,220,0.30);
  border-radius: 3px; padding: 3px 10px; margin-bottom: 12px;
}
.sl-lesson-badge--adv {
  color: rgba(200,160,255,0.80);
  background: rgba(40,0,80,0.40);
  border-color: rgba(160,100,255,0.30);
}

.sl-h1 {
  font-size: 24px; font-weight: 300; color: rgba(210,240,255,0.92);
  letter-spacing: 0.04em; margin: 0 0 12px;
}

.sl-intro {
  font-size: 11px; color: rgba(140,195,230,0.72); line-height: 1.75;
  margin: 0 0 16px; max-width: 620px;
}

.sl-meta {
  display: flex; gap: 20px; flex-wrap: wrap;
  font-size: 8.5px; color: rgba(90,145,185,0.60); letter-spacing: 0.04em;
}

/* ── Section ──────────────────────────────────────────────────────────────── */
.sl-section {
  margin-bottom: 48px;
  scroll-margin-top: 70px;
}

.sl-h2 {
  font-size: 15px; font-weight: 600; color: rgba(180,220,245,0.88);
  letter-spacing: 0.04em; margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,60,110,0.20);
}

.sl-p {
  font-size: 10.5px; color: rgba(120,175,215,0.72); line-height: 1.80;
  margin: 0 0 12px; max-width: 680px;
}
.sl-p strong { color: rgba(200,230,255,0.85); }

.sl-ul {
  padding-left: 18px; margin: 6px 0 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.sl-ul li { font-size: 10px; color: rgba(120,175,215,0.70); line-height: 1.70; }
.sl-ul li strong { color: rgba(200,230,255,0.85); }

/* ── Code blocks ──────────────────────────────────────────────────────────── */
.sl-code-block {
  background: rgba(0,6,18,0.90);
  border: 1px solid rgba(0,80,130,0.22);
  border-radius: 5px;
  padding: 14px 16px;
  font-size: 9.5px; color: rgba(0,220,150,0.80);
  white-space: pre; overflow-x: auto;
  margin: 10px 0 16px;
  line-height: 1.75;
  max-width: 700px;
}

.sl-code {
  background: rgba(0,25,55,0.55);
  border: 1px solid rgba(0,100,160,0.22);
  border-radius: 3px; padding: 1px 6px;
  font-size: 9.5px; color: rgba(0,210,255,0.80);
}

/* ── Callouts ─────────────────────────────────────────────────────────────── */
.sl-callout {
  background: rgba(0,30,60,0.40);
  border-left: 3px solid rgba(0,160,220,0.50);
  border-radius: 0 4px 4px 0;
  padding: 11px 15px;
  font-size: 10px; color: rgba(140,200,235,0.78); line-height: 1.65;
  margin: 12px 0; max-width: 660px;
}
.sl-callout strong { color: rgba(210,240,255,0.90); }

.sl-callout--info {
  background: rgba(0,50,40,0.35);
  border-left-color: rgba(0,200,150,0.50);
  color: rgba(130,215,190,0.80);
}

.sl-callout--activity {
  background: rgba(30,20,60,0.40);
  border-left-color: rgba(160,100,255,0.50);
  color: rgba(190,165,240,0.80);
}

.sl-callout--warning {
  background: rgba(50,25,0,0.40);
  border-left-color: rgba(220,140,0,0.55);
  color: rgba(215,175,110,0.85);
}

.sl-inline-link {
  color: rgba(80,180,220,0.85);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.sl-inline-link:hover { color: rgba(0,220,255,0.95); }

/* ── Tables ───────────────────────────────────────────────────────────────── */
.sl-table {
  width: 100%; border-collapse: collapse;
  margin: 10px 0 16px; font-size: 9.5px;
  max-width: 700px;
}
.sl-table th {
  text-align: left; padding: 6px 10px;
  font-size: 8px; letter-spacing: 0.12em;
  color: rgba(0,180,220,0.55);
  border-bottom: 1px solid rgba(0,80,130,0.22);
  background: rgba(0,12,30,0.60);
}
.sl-table td {
  padding: 7px 10px; color: rgba(140,195,230,0.75);
  border-bottom: 1px solid rgba(0,50,90,0.18);
  vertical-align: top;
}
.sl-table tr:last-child td { border-bottom: none; }
.sl-table td:first-child { color: rgba(180,220,245,0.85); }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sl-nav { display: none; }
  .sl-content { padding: 20px 20px 80px; }
}
</style>
