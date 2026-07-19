<template>
  <div class="bhdn" :class="{ 'is-collapsed': collapsed }">
    <div class="bhdn-header">
      <span class="bhdn-title">DEFENDER VIEW</span>
      <span class="bhdn-sep">│</span>
      <span class="bhdn-current">{{ targetLabel }}</span>
      <span class="bhdn-dist">{{ formatPc(currentDistancePc) }}</span>
      <button class="bhdn-collapse" @click="collapsed = !collapsed">{{ collapsed ? '▲' : '▼' }}</button>
    </div>

    <div v-show="!collapsed" class="bhdn-body">
      <!-- Log-scale parsec gradient slider -->
      <div
        ref="trackEl"
        class="bhdn-track"
        @pointerdown="onTrackDown"
        @mousemove="onTrackHover"
        @mouseleave="hoverPc = null"
      >
        <div class="bhdn-gradient" />

        <!-- Tick marks for real objects in this scene -->
        <div
          v-for="m in placedMarkers" :key="m.label"
          class="bhdn-marker"
          :style="{ left: m.pct + '%', background: m.color }"
          :title="`${m.label} — ${formatPc(m.distancePc)}`"
        />
        <div
          v-for="m in placedMarkers" :key="m.label + '-lbl'"
          class="bhdn-marker-label"
          :style="{ left: m.pct + '%' }"
        >{{ m.label }}</div>

        <!-- Current camera position handle -->
        <div class="bhdn-handle" :style="{ left: handlePct + '%' }" />

        <!-- Hover readout -->
        <div v-if="hoverPc !== null" class="bhdn-hover-line" :style="{ left: hoverPct + '%' }">
          <span class="bhdn-hover-label">{{ formatPc(hoverPc) }}</span>
        </div>
      </div>

      <div class="bhdn-scale-labels">
        <span>{{ formatPc(minPc) }}</span>
        <span class="bhdn-scale-mid">drag or click to fly the camera to any distance</span>
        <span>{{ formatPc(maxPc) }}</span>
      </div>

      <!-- Quick-switch between catalog black holes -->
      <div v-if="catalogList.length" class="bhdn-switch">
        <span class="bhdn-switch-label">OTHER OBJECTS</span>
        <div class="bhdn-switch-list">
          <button
            v-for="bh in catalogList" :key="bh.id"
            class="bhdn-switch-btn"
            :class="{ 'bhdn-switch-btn--active': bh.id === currentId }"
            @click="emit('jumpTo', bh.id)"
          >{{ bh.label }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface DefenderMarker { label: string; distancePc: number; color?: string }
export interface DefenderCatalogEntry { id: string; label: string }

const props = defineProps<{
  targetLabel:       string
  currentDistancePc: number
  minPc:             number
  maxPc:             number
  markers:           DefenderMarker[]
  catalogList:       DefenderCatalogEntry[]
  currentId:         string
}>()

const emit = defineEmits<{
  seek:   [distancePc: number]
  jumpTo: [bhId: string]
}>()

const collapsed = ref(false)
const trackEl    = ref<HTMLElement | null>(null)
const hoverPc    = ref<number | null>(null)

// ── Log-scale mapping ──────────────────────────────────────────────────────────
// minPc/maxPc can span from a fraction of an AU up to tens of parsecs — a
// linear slider would make the compact-object cluster an unusable sliver, so
// every position on this track is a log10 interpolation, same principle as
// the rest of this codebase's "documented compression" approach to scale.

const logMin = computed(() => Math.log10(Math.max(props.minPc, 1e-9)))
const logMax = computed(() => Math.log10(Math.max(props.maxPc, props.minPc * 10, 1e-8)))

function pcToPct(pc: number): number {
  const l = Math.log10(Math.max(pc, 1e-9))
  const t = (l - logMin.value) / Math.max(1e-9, logMax.value - logMin.value)
  return Math.min(100, Math.max(0, t * 100))
}

function pctToPc(pct: number): number {
  const t = Math.min(1, Math.max(0, pct / 100))
  const l = logMin.value + t * (logMax.value - logMin.value)
  return Math.pow(10, l)
}

const handlePct = computed(() => pcToPct(props.currentDistancePc))
const hoverPct  = computed(() => hoverPc.value !== null ? pcToPct(hoverPc.value) : 0)

const placedMarkers = computed(() =>
  props.markers
    .filter(m => m.distancePc > 0)
    .map(m => ({ ...m, pct: pcToPct(m.distancePc), color: m.color ?? '#00e5ff' }))
)

// ── Formatting ──────────────────────────────────────────────────────────────────

function formatPc(pc: number): string {
  const au = pc * 206265
  if (au < 1)      return `${(au * 1000).toFixed(1)} mAU`
  if (au < 1000)   return `${au.toFixed(au < 10 ? 2 : 0)} AU`
  if (pc < 0.306)  return `${(au / 63241).toFixed(3)} ly`
  if (pc < 1000)   return `${pc.toFixed(pc < 10 ? 3 : 1)} pc`
  return `${(pc / 1000).toFixed(2)} kpc`
}

// ── Interaction ───────────────────────────────────────────────────────────────

function pctFromEvent(e: { clientX: number }): number {
  const el = trackEl.value
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  return ((e.clientX - rect.left) / rect.width) * 100
}

function onTrackHover(e: MouseEvent) {
  hoverPc.value = pctToPc(pctFromEvent(e))
}

function onTrackDown(e: PointerEvent) {
  const seek = () => emit('seek', pctToPc(pctFromEvent(e)))
  seek()
  const onMove = (ev: PointerEvent) => emit('seek', pctToPc(pctFromEvent(ev)))
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
</script>

<style scoped>
.bhdn {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  width: min(720px, 92vw);
  background: rgba(1, 8, 16, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  font-size: 11px;
  color: #b0c8e8;
  backdrop-filter: blur(4px);
  z-index: 20;
}

.bhdn-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
}
.is-collapsed .bhdn-header { border-bottom: none; }

.bhdn-title {
  color: #00e5ff;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.bhdn-sep { color: rgba(176, 200, 232, 0.3); }
.bhdn-current { color: #b0c8e8; flex: 1; }
.bhdn-dist { color: #00ffcc; font-weight: 600; }

.bhdn-collapse {
  background: none;
  border: none;
  color: #00e5ff;
  cursor: pointer;
  padding: 0 4px;
  font-size: 10px;
}

.bhdn-body { padding: 14px 16px 10px; }

.bhdn-track {
  position: relative;
  height: 34px;
  cursor: pointer;
  touch-action: none;
}

.bhdn-gradient {
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #ff6644 0%, #ffcc66 22%, #00e5ff 55%, #6688ff 78%, #9955ff 100%);
  opacity: 0.55;
}

.bhdn-marker {
  position: absolute;
  top: 10px;
  width: 3px;
  height: 14px;
  border-radius: 1px;
  transform: translateX(-50%);
  box-shadow: 0 0 6px currentColor;
}

.bhdn-marker-label {
  position: absolute;
  top: 26px;
  transform: translateX(-50%);
  font-size: 9px;
  color: rgba(176, 200, 232, 0.7);
  white-space: nowrap;
  pointer-events: none;
}

.bhdn-handle {
  position: absolute;
  top: 4px;
  width: 10px;
  height: 26px;
  transform: translateX(-50%);
  background: #00ffcc;
  border-radius: 2px;
  box-shadow: 0 0 10px #00ffcc, 0 0 2px #fff;
  pointer-events: none;
}

.bhdn-hover-line {
  position: absolute;
  top: 0;
  width: 1px;
  height: 17px;
  background: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}
.bhdn-hover-label {
  position: absolute;
  top: -14px;
  transform: translateX(-50%);
  font-size: 9px;
  color: #fff;
  white-space: nowrap;
}

.bhdn-scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 22px;
  font-size: 9px;
  color: rgba(176, 200, 232, 0.5);
}
.bhdn-scale-mid { font-style: italic; }

.bhdn-switch {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 229, 255, 0.1);
}
.bhdn-switch-label {
  display: block;
  font-size: 9px;
  letter-spacing: 0.05em;
  color: rgba(176, 200, 232, 0.5);
  margin-bottom: 6px;
}
.bhdn-switch-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 62px;
  overflow-y: auto;
}
.bhdn-switch-btn {
  background: rgba(0, 80, 120, 0.18);
  border: 1px solid rgba(0, 180, 220, 0.25);
  color: #b0c8e8;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 10px;
  cursor: pointer;
  font-family: inherit;
}
.bhdn-switch-btn:hover {
  background: rgba(0, 180, 220, 0.20);
  color: #00e5ff;
}
.bhdn-switch-btn--active {
  background: rgba(0, 229, 255, 0.18);
  color: #00e5ff;
  border-color: #00e5ff;
}
</style>
