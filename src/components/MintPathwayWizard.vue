<template>
  <div class="mpw-root">

    <!-- Section header -->
    <div class="mpw-header">
      <div class="mpw-title">CONFIGURE YOUR MINT</div>
      <div class="mpw-sub">Choose a settlement pathway · each pre-loads a Mule knowledge corpus and module set</div>
      <div class="mpw-env-note" v-if="envNote">{{ envNote }}</div>
    </div>

    <!-- Pathway card gallery -->
    <div class="mpw-grid">
      <div
        v-for="p in pathways"
        :key="p.id"
        class="mpw-card"
        :class="{ 'mpw-card--selected': selected?.id === p.id }"
        :style="{ '--accent': p.color, '--bg-from': p.bgFrom, '--bg-to': p.bgTo }"
        @click="select(p)"
      >
        <!-- Card inner background -->
        <div class="mpw-card-bg"/>

        <!-- Emoji + name row -->
        <div class="mpw-card-top">
          <span class="mpw-emoji">{{ p.emoji }}</span>
          <div class="mpw-card-names">
            <div class="mpw-card-name">{{ p.name }}</div>
            <div class="mpw-card-tagline">{{ p.tagline }}</div>
          </div>
          <!-- Selected checkmark -->
          <div class="mpw-check" v-if="selected?.id === p.id">✓</div>
        </div>

        <!-- Description (shown on hover or when selected) -->
        <div class="mpw-card-desc">{{ p.description }}</div>

        <!-- Module tags -->
        <div class="mpw-modules">
          <span v-for="m in p.modules" :key="m" class="mpw-module-tag">{{ m }}</span>
        </div>

        <!-- Example settlement name -->
        <div class="mpw-example">e.g. {{ p.exampleName }}</div>

        <!-- Selection indicator bar -->
        <div class="mpw-select-bar"/>
      </div>
    </div>

    <!-- Selected pathway detail panel -->
    <Transition name="mpw-detail">
      <div v-if="selected" class="mpw-detail">

        <!-- Mule companion section -->
        <div class="mpw-mule-section">
          <MuleCreature :size="72" class="mpw-mule-img"/>
          <div class="mpw-mule-info">
            <div class="mpw-mule-title">mule-bot · land care</div>
            <div class="mpw-mule-pathway">{{ selected.name }} Configuration</div>
            <div class="mpw-mule-desc">
              Your Mule arrives pre-loaded with specialist knowledge for
              <strong>{{ selected.name }}</strong> — land care focus:
              {{ corpusDesc(selected) }}.
              All data stays local; no cloud connection.
            </div>
          </div>
        </div>

        <!-- Module summary -->
        <div class="mpw-module-summary">
          <div class="mpw-ms-label">STATION MODULES INCLUDED</div>
          <div class="mpw-ms-list">
            <div v-for="m in selected.modules" :key="m" class="mpw-ms-item">
              <span class="mpw-ms-icon">{{ MODULE_ICONS[m] ?? '◈' }}</span>
              <span class="mpw-ms-name">{{ m.toUpperCase() }}</span>
              <span class="mpw-ms-desc">{{ MODULE_DESC[m] ?? '' }}</span>
            </div>
          </div>
        </div>

        <!-- Confirm button -->
        <div class="mpw-confirm-row">
          <button class="mpw-btn" @click="$emit('select', selected)">
            {{ selected.emoji }} Use {{ selected.name }} →
          </button>
          <button class="mpw-btn mpw-btn--ghost" @click="selected = null">
            ← Change selection
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MuleCreature from 'src/components/MuleCreature.vue'
import { getEnabledPathways, type MintPathway } from 'src/lib/mint-config'

const emit = defineEmits<{
  (e: 'select', pathway: MintPathway): void
}>()

const pathways  = getEnabledPathways()
const selected  = ref<MintPathway | null>(null)

// Show env note if not all pathways are enabled
const envNote = computed(() => {
  const all = 6
  if (pathways.length < all) {
    return `${pathways.length} of ${all} pathways enabled · set VITE_ENABLED_PATHWAYS in .env to customise`
  }
  return ''
})

function select(p: MintPathway) {
  selected.value = selected.value?.id === p.id ? null : p
}

function corpusDesc(p: MintPathway): string {
  const descs: Record<string, string> = {
    eco:      'water system health, sustainable farming, and eco-ops field reporting',
    gallery:  'Hub Approvideo art library, $SUNLIGHT NFT metadata, and event coordination',
    watsan:   'water quality protocols, potability assessment, and community health',
    learning: 'educational advocacy materials and youth career development pathways',
    food:     'food co-op business planning, farm mapping, and soil health metrics',
    command:  'all land care specialist domains across water, art, business, youth, and media',
  }
  return descs[p.id] ?? 'community knowledge and field operations'
}

const MODULE_ICONS: Record<string, string> = {
  gallery:    '🎨',
  watsan:     '💧',
  energy:     '⚡',
  shelter:    '🏠',
  healthcare: '🏥',
  food:       '🌾',
  command:    '🌐',
}

const MODULE_DESC: Record<string, string> = {
  gallery:    'Orbital gallery, collector cards, event NFTs',
  watsan:     'Water quality measurement and certification',
  energy:     'Renewable energy monitoring and distribution',
  shelter:    'Housing, infrastructure, and safety systems',
  healthcare: 'Health card IDs, community clinic records',
  food:       'Farm maps, product tracking, storage logs',
  command:    'Station governance, DAO coordination, Mule command',
}
</script>

<style scoped>
/* ── Root ────────────────────────────────────────────────────────────────────── */

.mpw-root {
  font-family: 'Courier New', monospace;
  padding: 20px 0 0;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */

.mpw-header {
  margin-bottom: 18px;
}
.mpw-title {
  font-size: 9px;
  letter-spacing: 0.22em;
  color: rgba(0, 200, 240, 0.55);
  margin-bottom: 5px;
}
.mpw-sub {
  font-size: 11px;
  color: rgba(160, 200, 230, 0.70);
  letter-spacing: 0.05em;
}
.mpw-env-note {
  font-size: 8px;
  color: rgba(80, 130, 170, 0.50);
  margin-top: 4px;
  letter-spacing: 0.08em;
}

/* ── Card grid ───────────────────────────────────────────────────────────────── */

.mpw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

/* ── Individual card ─────────────────────────────────────────────────────────── */

.mpw-card {
  position: relative;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  cursor: pointer;
  padding: 14px 14px 10px;
  transition: border-color 0.16s, transform 0.14s, box-shadow 0.16s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-to, #060810);
}

.mpw-card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--bg-from, #080c18), var(--bg-to, #040608));
  z-index: 0;
}

.mpw-card > * { position: relative; z-index: 1; }

.mpw-card:hover {
  border-color: var(--accent, rgba(0,180,220,0.40));
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.55), 0 0 0 1px var(--accent, rgba(0,160,200,0.20));
}

.mpw-card--selected {
  border-color: var(--accent, #44aaff) !important;
  box-shadow: 0 0 22px rgba(0,0,0,0.6), 0 0 0 1px var(--accent), inset 0 0 30px rgba(0,0,0,0.30) !important;
  transform: translateY(-2px);
}
.mpw-card--selected .mpw-select-bar {
  height: 2.5px;
  background: var(--accent, #44aaff);
  opacity: 0.90;
}

/* ── Card content ────────────────────────────────────────────────────────────── */

.mpw-card-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mpw-emoji {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
}

.mpw-card-names { flex: 1; min-width: 0; }
.mpw-card-name  {
  font-size: 12px;
  font-weight: 600;
  color: rgba(220, 240, 255, 0.90);
  letter-spacing: 0.05em;
}
.mpw-card-tagline {
  font-size: 8.5px;
  color: rgba(120, 175, 210, 0.65);
  letter-spacing: 0.06em;
  margin-top: 2px;
}

.mpw-check {
  font-size: 13px;
  color: var(--accent, #44aaff);
  flex-shrink: 0;
  font-weight: 700;
}

.mpw-card-desc {
  font-size: 8.5px;
  color: rgba(140, 185, 215, 0.65);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mpw-modules {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.mpw-module-tag {
  font-size: 7px;
  letter-spacing: 0.10em;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--accent, rgba(0,160,210,0.28));
  color: var(--accent, rgba(0,200,240,0.70));
  opacity: 0.75;
  background: rgba(0,0,0,0.25);
}

.mpw-example {
  font-size: 7.5px;
  color: rgba(80, 130, 160, 0.45);
  letter-spacing: 0.06em;
  font-style: italic;
}

.mpw-select-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;
  transition: height 0.16s, opacity 0.16s;
  opacity: 0;
}

/* ── Detail panel ────────────────────────────────────────────────────────────── */

.mpw-detail {
  margin-top: 20px;
  background: rgba(0, 6, 18, 0.88);
  border: 1px solid rgba(0, 140, 200, 0.20);
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Mule section */
.mpw-mule-section {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.mpw-mule-img {
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(0, 20, 40, 0.60);
  border: 1px solid rgba(200, 150, 60, 0.25);
  padding: 4px;
}
.mpw-mule-info { flex: 1; }
.mpw-mule-title {
  font-size: 8px;
  letter-spacing: 0.18em;
  color: rgba(200, 150, 60, 0.55);
  margin-bottom: 4px;
}
.mpw-mule-pathway {
  font-size: 11px;
  color: rgba(220, 200, 130, 0.80);
  margin-bottom: 5px;
}
.mpw-mule-desc {
  font-size: 9px;
  color: rgba(150, 190, 220, 0.68);
  line-height: 1.60;
}
.mpw-mule-desc strong { color: rgba(200, 230, 255, 0.85); }

/* Module summary */
.mpw-module-summary {}
.mpw-ms-label {
  font-size: 8px;
  letter-spacing: 0.16em;
  color: rgba(0, 180, 220, 0.45);
  margin-bottom: 8px;
}
.mpw-ms-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 6px;
}
.mpw-ms-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  background: rgba(0, 20, 40, 0.45);
  border: 1px solid rgba(0, 100, 160, 0.18);
  border-radius: 4px;
  font-size: 8.5px;
}
.mpw-ms-icon  { font-size: 12px; flex-shrink: 0; }
.mpw-ms-name  { color: rgba(180, 220, 245, 0.80); font-weight: 600; flex-shrink: 0; }
.mpw-ms-desc  { color: rgba(100, 155, 185, 0.55); font-size: 7.5px; }

/* Confirm row */
.mpw-confirm-row {
  display: flex;
  gap: 10px;
}
.mpw-btn {
  padding: 8px 18px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(0, 220, 255, 0.90);
  background: rgba(0, 60, 100, 0.42);
  border: 1px solid rgba(0, 180, 220, 0.40);
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
}
.mpw-btn:hover {
  background: rgba(0, 90, 140, 0.58);
  border-color: rgba(0, 230, 255, 0.60);
}
.mpw-btn--ghost {
  color: rgba(80, 140, 180, 0.65);
  background: transparent;
  border-color: rgba(60, 110, 150, 0.22);
}

/* Transition */
.mpw-detail-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.mpw-detail-leave-active { transition: opacity 0.14s ease, transform 0.14s ease; }
.mpw-detail-enter-from   { opacity: 0; transform: translateY(-8px); }
.mpw-detail-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
