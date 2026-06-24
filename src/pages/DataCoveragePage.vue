<template>
  <q-page class="dc-page">
    <div class="dc-wrap">

      <!-- Header -->
      <div class="dc-header">
        <div class="dc-badge">VISUALIZATION DATA</div>
        <h1 class="dc-title">Data Coverage</h1>
        <p class="dc-sub">
          What Exotopia shows, where the data comes from, what we know,
          and where the gaps are. Updated as catalogs are refreshed.
        </p>
      </div>

      <!-- ── COSMIC VIEW EXPLAINER ──────────────────────────────────────── -->
      <section class="dc-section">
        <h2 class="dc-section-title">🌌 What you're seeing in the cosmic view</h2>
        <div class="dc-body">
          The cosmic view shows the <strong>observable universe at supercluster scale</strong> — the largest structures known.
          Each element represents real astrophysical data:
        </div>
        <div class="dc-explain-grid">
          <div class="dc-explain-item">
            <div class="dc-ei-symbol" style="background:rgba(200,136,10,0.20);border-color:rgba(200,136,10,0.50)">⬡</div>
            <div>
              <div class="dc-ei-title">Laniakea Supercluster</div>
              <div class="dc-ei-desc">
                The low-poly icosahedral shells represent the <strong>great cosmic voids</strong> — regions of
                near-empty space between galaxy filaments. The Local Void, Boötes Void (one of the
                largest known voids at ~300 Mpc), Sculptor Void, and the KBC Void (which we are
                inside) are all modelled as polygonal boundaries because their actual edges are
                diffuse, not sharp. The iridescent colour and flowing animation represent dark energy
                density fluctuations within each void.
              </div>
            </div>
          </div>
          <div class="dc-explain-item">
            <div class="dc-ei-symbol" style="background:rgba(60,130,220,0.20);border-color:rgba(60,130,220,0.50)">●</div>
            <div>
              <div class="dc-ei-title">Named galaxy clusters</div>
              <div class="dc-ei-desc">
                Virgo, Centaurus, Coma, Perseus, Hydra, Fornax, Norma (Great Attractor core),
                and Shapley Concentration. Positions from published RA/Dec/distance measurements
                converted to equatorial Cartesian coordinates at 1 scene unit = 15 Mpc.
              </div>
            </div>
          </div>
          <div class="dc-explain-item">
            <div class="dc-ei-symbol" style="background:rgba(0,210,200,0.15);border-color:rgba(0,210,200,0.40)">✦</div>
            <div>
              <div class="dc-ei-title">345 X-ray clusters</div>
              <div class="dc-ei-desc">
                The Takey et al. 2013 XMM-Newton X-ray cluster catalog (<code>clusters-xray.json</code>).
                Temperature-coded glow sprites. Zoom in to trigger the galaxy member LOD field —
                individual galaxy morphology sprites drawn from member catalogs.
              </div>
            </div>
          </div>
          <div class="dc-explain-item">
            <div class="dc-ei-symbol" style="background:rgba(255,200,50,0.15);border-color:rgba(255,200,50,0.40)">★</div>
            <div>
              <div class="dc-ei-title">Laniakea flow lines</div>
              <div class="dc-ei-desc">
                Nine bezier curves showing galaxy velocity streams converging on the Great Attractor
                (RA 243°, Dec −29°, 65 Mpc). The Tully et al. 2014 definition of Laniakea: any
                galaxy whose peculiar velocity flows toward the GA is "inside" the supercluster.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CATALOG SOURCES ──────────────────────────────────────────────── -->
      <section class="dc-section" id="catalogs">
        <h2 class="dc-section-title">📊 Catalog sources</h2>
        <div class="dc-catalog-table">
          <div class="dc-cat-row dc-cat-row--head">
            <span>Catalog</span><span>Records</span><span>Coverage</span><span>Used for</span>
          </div>
          <div v-for="c in CATALOGS" :key="c.name" class="dc-cat-row">
            <span class="dc-cat-name">{{ c.name }}</span>
            <span class="dc-cat-count">{{ c.count }}</span>
            <span class="dc-cat-cov">{{ c.coverage }}</span>
            <span class="dc-cat-use">{{ c.use }}</span>
          </div>
        </div>
      </section>

      <!-- ── COVERAGE GAPS ─────────────────────────────────────────────────── -->
      <section class="dc-section" id="gaps">
        <h2 class="dc-section-title">⚠ Known gaps</h2>
        <div class="dc-gap-list">
          <div class="dc-gap-item" v-for="g in GAPS" :key="g.title">
            <div class="dc-gap-icon">{{ g.icon }}</div>
            <div>
              <div class="dc-gap-title">{{ g.title }}</div>
              <div class="dc-gap-desc">{{ g.desc }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── LAGRANGE ADDRESSING ───────────────────────────────────────────── -->
      <section class="dc-section" id="addressing">
        <h2 class="dc-section-title">⬡ Lagrange Addressing — how exolocation coordinates work</h2>

        <div class="dc-body">
          Every virtual settlement in Exotopia has a permanent on-chain address built from
          a coordinate system identifier, a reference body, and a location descriptor.
          The address encodes both <strong>where</strong> the settlement is and
          <strong>what gravitational environment</strong> it inhabits.
        </div>

        <!-- Address format -->
        <div class="dc-addr-example">
          <div class="dc-addr-line">
            <span class="dc-addr-seg dc-addr-seg--system">exo-surface-v1</span>
            <span class="dc-addr-colon">:</span>
            <span class="dc-addr-seg dc-addr-seg--body">Kepler-442b</span>
            <span class="dc-addr-colon">:</span>
            <span class="dc-addr-seg dc-addr-seg--loc">15N,23W</span>
          </div>
          <div class="dc-addr-labels">
            <span>Coordinate system</span>
            <span>Reference body</span>
            <span>Plot centre (lat/lon, 10°×10°)</span>
          </div>
        </div>

        <!-- Trophic levels + coordinate systems -->
        <div class="dc-trophic-grid">
          <div v-for="t in TROPHIC_LEVELS" :key="t.level" class="dc-trophic-item"
            :class="`dc-trophic-item--${t.cls}`">
            <div class="dc-ti-badge">{{ t.level }}</div>
            <div class="dc-ti-name">{{ t.name }}</div>
            <div class="dc-ti-coord">{{ t.coord }}</div>
            <div class="dc-ti-desc">{{ t.desc }}</div>
            <div v-if="t.lagrange" class="dc-ti-lagrange">{{ t.lagrange }}</div>
          </div>
        </div>

        <!-- Lagrange points explained -->
        <div class="dc-lagrange-explainer">
          <h3 class="dc-sub-head">Lagrange points in the exomoon address system</h3>
          <div class="dc-body">
            When a moon orbits a planet, four of the five Lagrange equilibrium points are
            viable settlement locations. <strong>L4 and L5</strong> (the trojan points,
            ±60° in the moon's orbit) are naturally stable — material accumulates there
            without station-keeping. <strong>L1 and L2</strong> are unstable but offer
            direct line-of-sight to the planet or deep space respectively.
          </div>
          <div class="dc-lagrange-diagram">
            <!-- SVG schematic of moon-planet Lagrange system -->
            <svg viewBox="0 0 400 220" class="dc-lagrange-svg">
              <!-- Planet -->
              <circle cx="200" cy="110" r="28" fill="rgba(80,140,200,0.30)" stroke="rgba(80,140,200,0.70)" stroke-width="1.5"/>
              <text x="200" y="115" text-anchor="middle" font-family="monospace" font-size="10" fill="rgba(160,210,255,0.80)">PLANET</text>
              <!-- Moon orbit -->
              <ellipse cx="200" cy="110" rx="140" ry="55" fill="none" stroke="rgba(100,160,200,0.25)" stroke-width="0.8" stroke-dasharray="4,4"/>
              <!-- Moon at 0° -->
              <circle cx="340" cy="110" r="10" fill="rgba(180,180,100,0.35)" stroke="rgba(220,220,80,0.70)" stroke-width="1.2"/>
              <text x="340" y="114" text-anchor="middle" font-family="monospace" font-size="8" fill="rgba(220,220,80,0.85)">MOON</text>
              <!-- L1 between planet and moon -->
              <circle cx="294" cy="110" r="5" fill="rgba(255,140,60,0.50)" stroke="rgba(255,140,60,0.90)" stroke-width="1"/>
              <text x="294" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="rgba(255,160,80,0.85)">L1</text>
              <!-- L2 behind moon -->
              <circle cx="376" cy="110" r="5" fill="rgba(255,100,60,0.50)" stroke="rgba(255,100,60,0.90)" stroke-width="1"/>
              <text x="376" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="rgba(255,120,80,0.85)">L2</text>
              <!-- L3 opposite moon -->
              <circle cx="60" cy="110" r="5" fill="rgba(150,150,150,0.40)" stroke="rgba(160,160,160,0.70)" stroke-width="1"/>
              <text x="60" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="rgba(160,160,160,0.70)">L3</text>
              <!-- L4 +60° -->
              <circle cx="270" cy="63" r="7" fill="rgba(80,220,130,0.45)" stroke="rgba(80,220,130,0.90)" stroke-width="1.2"/>
              <text x="270" y="50" text-anchor="middle" font-family="monospace" font-size="9" fill="rgba(100,240,150,0.90)">L4 ★</text>
              <!-- L5 -60° -->
              <circle cx="270" cy="157" r="7" fill="rgba(80,220,130,0.45)" stroke="rgba(80,220,130,0.90)" stroke-width="1.2"/>
              <text x="270" y="175" text-anchor="middle" font-family="monospace" font-size="9" fill="rgba(100,240,150,0.90)">L5 ★</text>
              <!-- Labels -->
              <text x="8" y="16" font-family="monospace" font-size="8" fill="rgba(80,220,130,0.70)">★ = stable (no station-keeping)</text>
              <text x="8" y="28" font-family="monospace" font-size="8" fill="rgba(255,150,80,0.65)">● = unstable (requires correction)</text>
              <!-- coord label -->
              <text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="8" fill="rgba(80,140,180,0.55)">exo-moon-lagrange-v1 : Kepler-442b/Moon-I : L4</text>
            </svg>
          </div>
        </div>
      </section>

    </div>
  </q-page>
</template>

<script setup lang="ts">
const CATALOGS = [
  { name: 'NASA Exoplanet Archive (vizualization set)', count: '6,158 planets / 5,000+ systems', coverage: 'Confirmed, candidate, frontier', use: 'Galaxy star-system sprites, surface views, settlement addressing' },
  { name: 'XMM-Newton Takey2013 X-ray clusters',       count: '345 clusters',   coverage: '149–2,884 Mpc', use: 'Cosmic view cluster sprites, LOD galaxy fields' },
  { name: 'HYG Star Database v4.1',                    count: '119,626 stars',  coverage: 'All sky',        use: 'Cluster foreground star fields, stellar physics display' },
  { name: 'Virgo Cluster Catalog (VCC)',                count: '2,096 galaxies', coverage: '8° radius of Virgo', use: 'Virgo LOD 2/3 galaxy morphology field' },
  { name: 'Fornax Cluster Catalog (FCC)',               count: '340 galaxies',   coverage: 'Fornax cluster', use: 'Fornax LOD 2/3 galaxy field' },
  { name: 'Third Reference Catalogue (RC3)',            count: '23,022 galaxies','coverage': 'Named clusters','use': 'LOD 3 galaxy structure parameters (axis ratio, PA)' },
  { name: 'Laniakea flow model (Tully+ 2014)',          count: '9 flow lines',   coverage: 'Within Laniakea (~160 Mpc)', use: 'Cosmic view velocity stream visualization' },
  { name: 'Frontier / candidate exoplanets (internal)', count: '~6,000 predicted', coverage: 'Sky coverage gaps', use: 'Frontier NFT system, sky gap fill' },
]

const GAPS = [
  { icon: '📏', title: '2.1% of planets have no measured distance',
    desc: 'Mostly direct-imaging discoveries (young stars, wide separations). We assign deterministic estimated positions from 120–380 pc using hostname seed — they appear consistently but may be misplaced by hundreds of parsecs.' },
  { icon: '🌌', title: 'Southern hemisphere cluster coverage is thinner',
    desc: 'Norma/Great Attractor region and Shapley Concentration are in the galactic plane (zone of avoidance). Dust extinction makes optical observations harder — fewer confirmed member galaxies.' },
  { icon: '🔭', title: 'Individual galaxy structures approximated for most clusters',
    desc: 'Only Virgo and Fornax use real VCC/FCC catalog member positions. Other clusters use procedural King-profile member distributions calibrated to richness and morphology-density relation.' },
  { icon: '🪐', title: 'Moon data is sparse',
    desc: 'The NASA archive records system-level moon counts (sy_mnum) for most systems but not individual moon properties. Moon orbits in the settlement view use deterministic seeded approximations.' },
  { icon: '⭐', title: 'Stellar spectral types missing for ~30% of systems',
    desc: 'When st_spectype is null we estimate from st_teff using the Planckian locus. Temperature itself is missing for some very distant systems — colour defaults to G-type amber.' },
]

const TROPHIC_LEVELS = [
  { level: 'L1', name: 'STELLAR',    cls: 'l1', coord: 'exo-stellar-orbital-v1',
    desc: 'Orbit around the host star directly. High radiation environment.',
    lagrange: null },
  { level: 'L2', name: 'PLANETARY',  cls: 'l2', coord: 'exo-surface-v1· exo-orbital-v1',
    desc: 'On or orbiting a confirmed exoplanet. The most common settlement tier.',
    lagrange: null },
  { level: 'L3', name: 'LUNAR',      cls: 'l3', coord: 'exo-lunar-orbital-v1',
    desc: 'Orbit around a moon of an exoplanet. Parent planet dominates the sky.',
    lagrange: null },
  { level: 'L4', name: 'SUBLUNARY',  cls: 'l4', coord: 'exo-moon-surface-v1',
    desc: 'On the surface of a moon. Permanent day or night on tidally locked moons.',
    lagrange: null },
  { level: 'L5', name: 'SYZYGY',     cls: 'l5', coord: 'exo-moon-lagrange-v1',
    desc: 'At a moon–planet Lagrange equilibrium point.',
    lagrange: 'L4/L5: stable trojan points — natural accumulation, no station-keeping required. L1/L2: unstable, requires active correction burns.' },
  { level: 'L6', name: 'LIMINAL',    cls: 'l6', coord: 'exo-moon-interface-v1',
    desc: 'At a transition zone between moon and planet gravitational domains.',
    lagrange: 'Five zone types: Hill sphere boundary · Roche limit · tidal-lock transition · magnetosphere interface · orbital resonance zone.' },
]
</script>

<style scoped>
.dc-page { background: #020408; min-height: 100vh; font-family: 'Courier New', monospace; }
.dc-wrap { max-width: 900px; margin: 0 auto; padding: 36px 24px 80px; display: flex; flex-direction: column; gap: 40px; }

.dc-badge { font-size: 8.5px; letter-spacing: 0.20em; color: rgba(0,180,220,0.50); margin-bottom: 8px; }
.dc-title { font-size: 26px; font-weight: 300; color: rgba(210,235,255,0.92); letter-spacing: 0.05em; margin: 0 0 8px; }
.dc-sub   { font-size: 11px; color: rgba(110,165,200,0.65); line-height: 1.65; max-width: 560px; margin: 0; }

.dc-section { display: flex; flex-direction: column; gap: 16px; }
.dc-section-title { font-size: 14px; font-weight: 400; color: rgba(200,235,255,0.88); letter-spacing: 0.06em; margin: 0; border-left: 2px solid rgba(0,180,220,0.35); padding-left: 12px; }
.dc-body { font-size: 10.5px; color: rgba(120,175,215,0.72); line-height: 1.70; }
.dc-body strong { color: rgba(200,230,255,0.85); }
.dc-sub-head { font-size: 11px; color: rgba(160,210,240,0.80); margin: 8px 0 4px; font-weight: 400; }

/* Explain grid */
.dc-explain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.dc-explain-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: rgba(0,8,22,0.70); border: 1px solid rgba(0,100,160,0.18); border-radius: 6px; }
.dc-ei-symbol { width: 36px; height: 36px; border-radius: 6px; border: 1px solid; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.dc-ei-title { font-size: 11px; font-weight: 600; color: rgba(200,230,255,0.88); margin-bottom: 4px; }
.dc-ei-desc  { font-size: 9px; color: rgba(110,165,205,0.65); line-height: 1.60; }

/* Catalog table */
.dc-catalog-table { display: flex; flex-direction: column; border: 1px solid rgba(0,100,160,0.18); border-radius: 6px; overflow: hidden; }
.dc-cat-row { display: grid; grid-template-columns: 2fr 1fr 1.2fr 2fr; gap: 8px; padding: 7px 12px; border-bottom: 1px solid rgba(0,60,100,0.18); font-size: 9px; }
.dc-cat-row:last-child { border-bottom: none; }
.dc-cat-row--head { background: rgba(0,20,45,0.70); font-size: 7.5px; letter-spacing: 0.12em; color: rgba(0,180,220,0.55); }
.dc-cat-name  { color: rgba(180,220,245,0.85); }
.dc-cat-count { color: rgba(0,210,255,0.75); font-size: 8.5px; }
.dc-cat-cov   { color: rgba(100,155,195,0.60); }
.dc-cat-use   { color: rgba(100,155,195,0.60); }

/* Gaps */
.dc-gap-list { display: flex; flex-direction: column; gap: 10px; }
.dc-gap-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; background: rgba(0,8,22,0.70); border: 1px solid rgba(0,80,130,0.18); border-radius: 5px; }
.dc-gap-icon  { font-size: 18px; flex-shrink: 0; }
.dc-gap-title { font-size: 10.5px; font-weight: 600; color: rgba(200,230,255,0.85); margin-bottom: 3px; }
.dc-gap-desc  { font-size: 9px; color: rgba(110,165,205,0.62); line-height: 1.60; }

/* Address example */
.dc-addr-example { background: rgba(0,12,30,0.80); border: 1px solid rgba(0,120,180,0.25); border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.dc-addr-line  { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.dc-addr-seg   { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; }
.dc-addr-seg--system { background: rgba(0,80,130,0.45); color: rgba(0,210,255,0.90); border: 1px solid rgba(0,160,210,0.35); }
.dc-addr-seg--body   { background: rgba(60,30,0,0.45);  color: rgba(255,180,60,0.90);  border: 1px solid rgba(220,150,30,0.35); }
.dc-addr-seg--loc    { background: rgba(0,60,30,0.45);  color: rgba(80,230,140,0.90);  border: 1px solid rgba(60,200,110,0.35); }
.dc-addr-colon { font-size: 14px; color: rgba(80,130,170,0.50); font-weight: 300; }
.dc-addr-labels { display: grid; grid-template-columns: 2fr 1.5fr 2fr; font-size: 7.5px; letter-spacing: 0.10em; color: rgba(70,130,170,0.55); padding-top: 4px; }

/* Trophic grid */
.dc-trophic-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.dc-trophic-item { padding: 12px; background: rgba(0,8,22,0.75); border: 1px solid rgba(0,80,130,0.18); border-radius: 6px; display: flex; flex-direction: column; gap: 4px; }
.dc-ti-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; color: rgba(0,200,240,0.70); }
.dc-ti-name  { font-size: 11px; font-weight: 600; color: rgba(200,230,255,0.88); }
.dc-ti-coord { font-size: 8px; color: rgba(0,180,220,0.55); font-style: italic; margin-bottom: 2px; }
.dc-ti-desc  { font-size: 8.5px; color: rgba(110,165,205,0.65); line-height: 1.55; }
.dc-ti-lagrange { font-size: 8px; color: rgba(80,220,130,0.70); border-top: 1px solid rgba(60,200,110,0.18); padding-top: 5px; margin-top: 3px; line-height: 1.55; }

.dc-trophic-item--l4 { border-color: rgba(80,220,130,0.25); }
.dc-trophic-item--l5 { border-color: rgba(80,220,130,0.30); }
.dc-trophic-item--l6 { border-color: rgba(200,160,80,0.25); }

/* Lagrange diagram */
.dc-lagrange-explainer { display: flex; flex-direction: column; gap: 10px; }
.dc-lagrange-diagram { background: rgba(0,8,22,0.85); border: 1px solid rgba(0,80,130,0.20); border-radius: 6px; padding: 12px; }
.dc-lagrange-svg { width: 100%; height: auto; display: block; }
</style>
