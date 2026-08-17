<template>
  <Transition name="am-fade">
    <div v-if="modelValue" class="am-backdrop" @click.self="close">
      <div class="am-card" role="dialog" aria-modal="true" aria-labelledby="am-title">
        <button class="am-close" aria-label="Close" @click="close">✕</button>

        <div class="am-badge">WHAT IS EXOTOPIA</div>
        <h2 id="am-title" class="am-title">A navigable universe, built on real data</h2>
        <p class="am-lead">
          Exotopia lets you descend from the large-scale structure of the observable universe —
          galaxy clusters, great voids, supercluster filaments — all the way to a settlement on a
          confirmed exoplanet, exomoon, or orbital habitat. Every level of that descent
          corresponds to a real scale of astronomical structure, and the numbers behind it come
          from published catalogs, not invented ones.
        </p>
        <p class="am-lead">
          Not everything you see is a measurement, though — some of it is a physically-grounded
          model built on top of real inputs (a real cluster's X-ray temperature shaping its
          member galaxies' morphology mix, for instance). We think that's a legitimate way to
          build this, as long as it's never presented as more than it is. So we keep auditing
          our own numbers publicly, like this one:
        </p>

        <div class="am-chart-card">
          <div class="am-chart-eyebrow">Star field coverage audit — August 2026</div>
          <div class="am-chart-title">Exotopia ships 61,817 real stars. Here's where that sits.</div>

          <div class="am-barchart">
            <div v-for="c in catalogs" :key="c.name" class="am-bar-row">
              <div class="am-bar-label">
                <span class="am-catname">{{ c.name }}</span>
                <span class="am-catnote">{{ c.note }}</span>
              </div>
              <div class="am-bar-track">
                <div
                  class="am-bar-fill"
                  :class="{ 'am-bar-fill--hi': c.highlight }"
                  :style="{ width: barPct(c.value) + '%' }"
                />
              </div>
              <div class="am-bar-value">{{ formatNum(c.value) }}</div>
            </div>
          </div>

          <p class="am-chart-note">
            Log-scaled — six real orders of magnitude, naked-eye to Gaia. No artificial sky gaps
            were found in the shipped field; the one real pattern (stars cluster toward the
            galactic plane, ~4× denser than the poles) is physics, not a catalog defect.
          </p>

          <div class="am-chart-links">
            <router-link to="/blog/how-many-stars">Read the full write-up →</router-link>
            <a href="https://claude.ai/code/artifact/00f3ed1e-d2ba-4c6a-8c65-04691180c76c" target="_blank" rel="noopener">
              Interactive chart + sky heatmap ↗
            </a>
          </div>
        </div>

        <div class="am-chart-card">
          <div class="am-chart-eyebrow">Systems &amp; black holes — current stats, August 2026</div>
          <div class="am-chart-title">What's real, what's modeled, and how much of each</div>

          <div class="am-stat-grid">
            <div class="am-stat-row" v-for="s in systemStats" :key="s.label">
              <div class="am-stat-label">
                <span class="am-catname">{{ s.label }}</span>
                <span class="am-catnote">{{ s.note }}</span>
              </div>
              <div class="am-stat-value">{{ s.value }}</div>
            </div>
          </div>

          <p class="am-chart-note">
            "Frontier" systems are a statistically modeled extension of the real Hipparcos catalog
            — a population model, not individual detections. Same rule for the two black-hole
            rows: 11 real, individually cited objects (Sgr A* plus the 10 in our catalog, spanning
            EHT direct imaging, megamaser disk dynamics, astrometric binary orbit-fitting, X-ray
            binary radial velocity, and hypervelocity tracer stars) versus the standard
            galaxy-wide stellar-mass black hole population estimate — which we cite for context but
            don't render as individual objects, since it isn't one.
          </p>
        </div>

        <p class="am-lead am-lead--tight">
          Exotopia is also built to minimize surfaces where one person could locate, track, or
          harass another — nothing here shows another user's live location, and social features
          stay mutual-consent, not proactively monitored.
          <router-link to="/community-guidelines">Community Guidelines</router-link>
        </p>

        <div class="am-actions-block">
          <div class="am-chart-eyebrow">What to do here</div>
          <div class="am-actions-grid">
            <router-link v-for="a in ACTIONS" :key="a.to" :to="a.to" class="am-action" @click="close">
              <div class="am-action__label">{{ a.label }}</div>
              <div class="am-action__desc">{{ a.desc }}</div>
            </router-link>
          </div>
        </div>

        <div class="am-footlinks">
          <router-link to="/terms">Terms</router-link>
          <router-link to="/privacy">Privacy</router-link>
          <router-link to="/community-guidelines">Community Guidelines</router-link>
          <a href="https://github.com/biomassives/vercel-html-exotopia.org" target="_blank" rel="noopener">Source</a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function close() {
  emit('update:modelValue', false)
}

// Curated, not exhaustive — real working features across the "constellation
// of use cases" (exploration, settling, citizen science, learning/mentoring,
// library upkeep), not a full site map. Each links to a page that actually
// does something today.
const ACTIONS: { to: string; label: string; desc: string }[] = [
  { to: '/cosmic', label: 'Explore the universe', desc: 'Descend from cosmic structure down to a single exoplanet' },
  { to: '/planet-systems', label: 'Claim a settlement', desc: 'Pick a confirmed exoplanet and establish an address there' },
  { to: '/settlements', label: 'Browse published settlements', desc: 'See what other settlers have built and published' },
  { to: '/pfas-citizen-science', label: 'Do citizen science', desc: 'Log real PFAS/PFOA decontamination progress, or propose a method' },
  { to: '/learn', label: 'Learn & earn a certificate', desc: 'Financial-literacy and other quizzes that pay real settlement points' },
  { to: '/sky-lessons', label: 'Take a sky lesson', desc: 'Navigation, orbital math, and galactic-center astrophysics, from beginner to grad level' },
  { to: '/rewards', label: 'Volunteer, mentor, track points', desc: 'Log field work, confirm a mentor session, see your reward tracks' },
  { to: '/eco-library', label: 'Browse the eco-ops library', desc: 'Field-tested methods for water, soil, and habitat work' },
  { to: '/gallery', label: 'Visit the community gallery', desc: 'Businesses, creative pages, and places other members have listed' },
]

// Same comparison set as the published "How Many Stars?" artifact/blog post —
// keep these three in sync if the shipped star count or catalog figures change.
const catalogs = [
  { name: 'Naked eye (V ≤ 6.5)',        value: 9100,        note: 'unaided sky' },
  { name: 'Exotopia — shipped field',   value: 61817,       note: 'V ≤ 8.5, real HYG v3', highlight: true },
  { name: 'HYG v3 — full catalog',      value: 119614,      note: 'Hipparcos + Yale BSC + Gliese' },
  { name: 'Hipparcos (1997)',           value: 118218,      note: 'ESA astrometric mission' },
  { name: 'Tycho-2 (2000)',             value: 2539913,     note: 'complete to V ≈ 11.5' },
  { name: '2MASS Point Source',         value: 470000000,   note: 'near-infrared, all-sky' },
  { name: 'Gaia DR3 (2022)',            value: 1800000000,  note: '~1.46B with full astrometry' },
]

// Verified directly against the shipped data files (public/exoplanets-viz.json,
// candidate-exoplanets.json, frontier-exoplanets.json — NOT frontier-exoplanets-
// detail.json, which exists in public/ but isn't actually fetched anywhere in
// the app, so it's not a "current" figure) and src/data/black-holes.ts. Keep in
// sync with those sources if the shipped catalogs change.
const systemStats: { label: string; value: string; note: string }[] = [
  { label: 'Confirmed',                        value: '6,298 planets · 4,716 systems', note: 'NASA Exoplanet Archive' },
  { label: 'Candidate',                        value: '6,830 planets · 6,623 systems', note: 'TESS/KOI, awaiting confirmation' },
  { label: 'Frontier',                         value: '5,000 planets · 2,885 systems', note: 'modeled extension of Hipparcos, not detections' },
  { label: 'Black holes — cataloged',          value: '11 (Sgr A* + 10)',              note: 'EHT imaging, megamaser dynamics, astrometric & X-ray binaries' },
  { label: 'Black holes — galaxy-wide estimate', value: '~100 million (est.)',          note: 'stellar-mass BH population model — not individually shown' },
]

const minLog = Math.log10(1000)
const maxLog = Math.log10(2e9)

function barPct(value: number): number {
  return 100 * (Math.log10(value) - minLog) / (maxLog - minLog)
}

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return n.toLocaleString()
  return String(n)
}
</script>

<style scoped>
.am-backdrop {
  position: fixed;
  inset: 0;
  z-index: 8500;
  background: rgba(0, 2, 10, 0.82);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Courier New', monospace;
}

.am-card {
  position: relative;
  width: min(620px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: rgba(4, 8, 20, 0.97);
  border: 1px solid rgba(0, 212, 180, 0.25);
  border-radius: 12px;
  padding: 30px 28px 26px;
  color: #c8d8e8;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.am-close {
  position: absolute;
  top: 14px; right: 14px;
  background: none;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px;
  color: #8898b0;
  width: 26px; height: 26px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
.am-close:hover { color: #cfe8f0; border-color: rgba(0,212,180,0.4); }

.am-badge {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: #00d4b4;
  border: 1px solid rgba(0, 212, 180, 0.35);
  border-radius: 3px;
  padding: 2px 8px;
  margin-bottom: 12px;
}

.am-title { font-size: 19px; font-weight: 700; color: #e8f0ff; margin: 0 0 14px; letter-spacing: -0.01em; line-height: 1.25; }
.am-lead  { font-size: 12.5px; line-height: 1.7; color: #93a5bd; margin: 0 0 14px; }
.am-lead--tight { margin-top: 20px; }
.am-lead a { color: #4fb8e8; }

.am-chart-card {
  margin: 8px 0 6px;
  padding: 18px 18px 16px;
  background: rgba(0,0,0,0.28);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
}
.am-chart-eyebrow {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  color: #ffd873; margin-bottom: 6px;
}
.am-chart-title { font-size: 13.5px; font-weight: 600; color: #e0ecff; margin-bottom: 16px; }

.am-barchart { display: flex; flex-direction: column; gap: 8px; }
.am-bar-row { display: grid; grid-template-columns: 132px 1fr 54px; align-items: center; gap: 10px; }
.am-bar-label { display: flex; flex-direction: column; text-align: right; line-height: 1.25; }
.am-catname { font-size: 10.5px; color: #cfe0f0; font-weight: 600; }
.am-catnote { font-size: 8.5px; color: #6b7684; }
.am-bar-track { position: relative; height: 14px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
.am-bar-fill { position: absolute; inset: 0 auto 0 0; border-radius: 4px 2px 2px 4px; background: linear-gradient(90deg, #0d3a4a, #00b4c8); }
.am-bar-fill--hi { background: linear-gradient(90deg, #a85a00, #ffb020); }
.am-bar-value {
  font-family: 'Courier New', monospace; font-variant-numeric: tabular-nums;
  font-size: 10.5px; color: #cfe0f0; text-align: left;
}

.am-chart-note { font-size: 10.5px; line-height: 1.6; color: #7888a0; margin: 14px 0 10px; }

.am-stat-grid { display: flex; flex-direction: column; gap: 9px; }
.am-stat-row {
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  padding-bottom: 7px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.am-stat-row:last-child { border-bottom: none; padding-bottom: 0; }
.am-stat-label { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.am-stat-value {
  font-family: 'Courier New', monospace; font-variant-numeric: tabular-nums;
  font-size: 11px; color: #ffd873; text-align: right; white-space: nowrap; flex-shrink: 0;
}

.am-chart-links { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 11px; }
.am-chart-links a { color: #4fb8e8; text-decoration: none; }
.am-chart-links a:hover { color: #7ad0ff; }

.am-actions-block { margin: 20px 0 4px; }
.am-actions-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  margin-top: 10px;
}
.am-action {
  display: block; text-decoration: none;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  padding: 10px 12px; transition: border-color 0.15s;
}
.am-action:hover { border-color: rgba(0,212,180,0.35); }
.am-action__label { font-size: 11.5px; font-weight: 600; color: rgba(210,230,250,0.94); margin-bottom: 2px; }
.am-action__desc  { font-size: 9.5px; line-height: 1.4; color: rgba(130,165,190,0.65); }

@media (max-width: 480px) {
  .am-actions-grid { grid-template-columns: 1fr; }
}

.am-footlinks {
  display: flex; flex-wrap: wrap; gap: 6px 14px;
  margin-top: 18px; padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 10.5px;
}
.am-footlinks a { color: #6a8ab0; text-decoration: none; }
.am-footlinks a:hover { color: #8ab0d8; }

.am-fade-enter-active { transition: opacity 0.2s ease; }
.am-fade-leave-active  { transition: opacity 0.15s ease; }
.am-fade-enter-from, .am-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .am-card { padding: 24px 18px 20px; }
  .am-bar-row { grid-template-columns: 96px 1fr 44px; gap: 6px; }
  .am-catnote { display: none; }
}
</style>
