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

      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── Lesson state ──────────────────────────────────────────────────────────────

const activeLesson  = ref(1)
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

const activeSections = computed(() =>
  activeLesson.value === 1 ? SECTIONS_L1 : SECTIONS_L2
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
