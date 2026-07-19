<template>
  <q-page class="bh-page">
    <div class="bh-header">
      <div class="bh-eyebrow">EXOTOPIA · OBSERVATORY</div>
      <div class="bh-title">Black Holes</div>
      <p class="bh-intro">
        Every entry here has strong, citable observational evidence — direct imaging, Keplerian
        maser-disk dynamics, astrometric orbit-fitting, or decades of X-ray binary monitoring.
        Sagittarius A* is our own galaxy's supermassive black hole; the rest span every other way
        we know a black hole is there.
      </p>
    </div>

    <div class="bh-grid">
      <div class="bh-card bh-card--sgra" @click="$router.push('/galactic-center')">
        <div class="bh-card-type">GALACTIC NUCLEUS</div>
        <div class="bh-card-name">Sagittarius A*</div>
        <div class="bh-card-stats">
          <span>4.154 × 10⁶ M☉</span>
          <span>26,000 ly</span>
        </div>
        <div class="bh-card-note">
          Our own galaxy's supermassive black hole — imaged by the EHT in 2022, orbited by the
          precisely-tracked S-stars.
        </div>
      </div>

      <div
        v-for="bh in BLACK_HOLE_CATALOG"
        :key="bh.id"
        class="bh-card"
        :class="`bh-card--${bh.sceneType}`"
        @click="$router.push(`/bh/${bh.id}`)"
      >
        <div class="bh-card-type">{{ sceneTypeLabel(bh.sceneType) }}</div>
        <div class="bh-card-name">{{ bh.label }}</div>
        <div class="bh-card-stats">
          <span>{{ massLabel(bh.mass_msun) }}</span>
          <span>{{ distLabel(bh.dist_pc) }}</span>
        </div>
        <div class="bh-card-note">{{ bh.discovery }}</div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { BLACK_HOLE_CATALOG, type BHSceneType } from 'src/data/black-holes'

function massLabel(m: number): string {
  return m >= 1e6 ? `${(m / 1e6).toFixed(2)}M M☉` : `${m.toFixed(1)} M☉`
}

function distLabel(pc: number): string {
  const ly = pc * 3.2616
  return pc > 1e6 ? `${(ly / 1e6).toFixed(1)}M ly` : `${Math.round(ly).toLocaleString()} ly`
}

function sceneTypeLabel(t: BHSceneType): string {
  if (t === 'x-ray-binary')  return 'X-RAY BINARY'
  if (t === 'globular-imbh') return 'INTERMEDIATE-MASS'
  if (t === 'agn-jet')       return 'AGN JET'
  return 'MEGAMASER DISK'
}
</script>

<style scoped lang="scss">
.bh-page {
  min-height: 100vh;
  background: #000205;
  padding: 48px 24px 64px;
}

.bh-header {
  max-width: 720px;
  margin: 0 auto 36px;
}
.bh-eyebrow { font-size: 10px; letter-spacing: 0.16em; color: rgba(80,120,170,0.70); margin-bottom: 6px; }
.bh-title   { font-size: 26px; color: rgba(200,220,240,0.92); font-weight: 500; margin-bottom: 12px; }
.bh-intro   { font-size: 13px; line-height: 1.7; color: rgba(140,170,200,0.70); }

.bh-grid {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.bh-card {
  background: rgba(6, 10, 20, 0.75);
  border: 1px solid rgba(70, 100, 150, 0.18);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
}
.bh-card:hover {
  border-color: rgba(120, 170, 220, 0.45);
  background: rgba(10, 18, 32, 0.9);
  transform: translateY(-2px);
}

.bh-card--sgra { border-color: rgba(255, 200, 120, 0.28); }
.bh-card--sgra:hover { border-color: rgba(255, 200, 120, 0.55); }

.bh-card-type {
  font-size: 8.5px; letter-spacing: 0.12em;
  color: rgba(90, 160, 210, 0.75);
  margin-bottom: 6px;
}
.bh-card-name {
  font-size: 15px; color: rgba(210, 225, 240, 0.92);
  margin-bottom: 8px;
}
.bh-card-stats {
  display: flex; gap: 12px;
  font-size: 10.5px; font-family: monospace;
  color: rgba(150, 190, 220, 0.80);
  margin-bottom: 10px;
}
.bh-card-note {
  font-size: 10px; line-height: 1.55;
  color: rgba(110, 140, 170, 0.65);
}
</style>
