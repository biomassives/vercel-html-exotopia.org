<template>
  <div class="cd-panel" :class="{ 'cd-panel--active': !!cluster }">

    <div v-if="!cluster" class="cd-empty">
      <div class="cd-glitch-text">// NO CLUSTER SELECTED</div>
      <p class="cd-hint">Select a structure from the named index to populate astrophysical metrics.</p>
    </div>

    <div v-else class="cd-content">

      <div class="cd-header-block">
        <div class="cd-meta-row">
          <span class="cd-sys-id">ID: {{ cluster.slug.toUpperCase() }}</span>
          <span class="cd-status-dot" :class="{ 'cd-status-dot--xray': !!cluster.tx_kev }" />
        </div>
        <h2 class="cd-title">{{ cluster.name }}</h2>
        <div class="cd-coordinates">
          RA {{ cluster.ra_str }} · DEC {{ cluster.dec_str }}
        </div>
      </div>

      <hr class="cd-divider" />

      <div class="cd-metrics-grid">
        <div class="cd-metric">
          <div class="cd-metric-label">DISTANCE</div>
          <div class="cd-metric-val">{{ cluster.dist_mpc.toFixed(1) }} <span class="cd-unit">Mpc</span></div>
        </div>
        <div class="cd-metric">
          <div class="cd-metric-label">MEMBERS</div>
          <div class="cd-metric-val">{{ cluster.member_count }} <span class="cd-unit">gals</span></div>
        </div>
        <div v-if="cluster.tx_kev" class="cd-metric">
          <div class="cd-metric-label">ICM TEMP T_X</div>
          <div class="cd-metric-val cd-metric-val--xray">{{ cluster.tx_kev.toFixed(1) }} <span class="cd-unit">keV</span></div>
        </div>
        <div v-if="cluster.sigma_v" class="cd-metric">
          <div class="cd-metric-label">VEL DISP σ_v</div>
          <div class="cd-metric-val">{{ cluster.sigma_v }} <span class="cd-unit">km/s</span></div>
        </div>
        <div v-if="cluster.richness" class="cd-metric">
          <div class="cd-metric-label">RICHNESS</div>
          <div class="cd-metric-val">{{ cluster.richness }}</div>
        </div>
      </div>

      <div class="cd-box">
        <div class="cd-box-label">DYNAMICS · MORPHOLOGY</div>
        <p class="cd-box-text">{{ cluster.notes }}</p>
      </div>

      <div class="cd-box">
        <div class="cd-box-label">DERIVED HYDROSTATIC ESTIMATES</div>
        <table class="cd-table">
          <tbody>
            <tr>
              <td>Est. total mass M_200</td>
              <td class="cd-td-right cd-td-bright">{{ estimatedMass }} M☉</td>
            </tr>
            <tr>
              <td>Virial radius R_200</td>
              <td class="cd-td-right cd-td-bright">{{ estimatedVirialRadius }} Mpc</td>
            </tr>
            <tr>
              <td>ICM sound speed c_s</td>
              <td class="cd-td-right cd-td-bright">{{ estimatedSoundSpeed }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cd-footer">
        <button class="cd-dismiss" @click="$emit('close')">‹ DISMISS</button>
        <span class="cd-syslog">SYS.LOC // L2_CLS_OK</span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface NamedClusterMeta {
  slug:         string
  name:         string
  dist_mpc:     number
  member_count: number
  richness?:    number
  sigma_v?:     number
  tx_kev?:      number
  notes:        string
  ra_str:       string
  dec_str:      string
}

const props = defineProps<{ cluster: NamedClusterMeta | null }>()
defineEmits<{ (e: 'close'): void }>()

const estimatedMass = computed(() => {
  if (!props.cluster) return '—'
  if (props.cluster.sigma_v) {
    const m = Math.pow(props.cluster.sigma_v / 1000, 3) * 1.2e15
    return m.toExponential(2)
  }
  return '~1.00e+14'
})

const estimatedVirialRadius = computed(() => {
  if (!props.cluster?.tx_kev) return '—'
  return (0.25 * Math.sqrt(props.cluster.tx_kev)).toFixed(2)
})

const estimatedSoundSpeed = computed(() => {
  if (!props.cluster?.tx_kev) return '—'
  return `${(1000 * Math.sqrt(props.cluster.tx_kev / 7.4)).toFixed(0)} km/s`
})
</script>

<style scoped>

.cd-panel {
  width: 320px;
  flex-shrink: 0;
  background: rgba(0, 4, 16, 0.96);
  border-left: 1px solid rgba(0, 80, 140, 0.22);
  font-family: 'Courier New', monospace;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 44px;
  height: calc(100vh - 44px);
  overflow-y: auto;
}

/* ── Empty state ────────────────────────────────────────────────────────────── */

.cd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  border: 1px dashed rgba(0, 80, 140, 0.14);
  border-radius: 3px;
  padding: 24px;
  text-align: center;
}

.cd-glitch-text {
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: rgba(0, 140, 200, 0.40);
  font-weight: bold;
}

.cd-hint {
  font-size: 8.5px;
  color: rgba(80, 130, 170, 0.38);
  line-height: 1.65;
  margin: 0;
}

/* ── Content ────────────────────────────────────────────────────────────────── */

.cd-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}

/* header */
.cd-header-block { display: flex; flex-direction: column; gap: 3px; }

.cd-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cd-sys-id {
  font-size: 7.5px;
  letter-spacing: 0.12em;
  color: rgba(0, 180, 220, 0.45);
}

.cd-status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(100, 210, 255, 0.55);
  box-shadow: 0 0 5px rgba(100, 210, 255, 0.35);
}
.cd-status-dot--xray {
  background: rgba(255, 150, 50, 0.80);
  box-shadow: 0 0 6px rgba(255, 140, 40, 0.55);
}

.cd-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(180, 220, 248, 0.94);
  margin: 4px 0 0;
}

.cd-coordinates {
  font-size: 8px;
  color: rgba(80, 140, 185, 0.48);
  letter-spacing: 0.06em;
}

.cd-divider {
  border: 0;
  border-top: 1px solid rgba(0, 70, 130, 0.18);
  margin: 0;
}

/* metrics */
.cd-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.cd-metric {
  background: rgba(0, 10, 32, 0.60);
  border: 1px solid rgba(0, 55, 105, 0.20);
  border-radius: 3px;
  padding: 9px 10px;
}

.cd-metric-label {
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(70, 135, 180, 0.48);
  margin-bottom: 4px;
}

.cd-metric-val {
  font-size: 14px;
  font-weight: 700;
  color: rgba(140, 200, 240, 0.90);
  line-height: 1;
}
.cd-metric-val--xray { color: rgba(255, 180, 80, 0.90); }

.cd-unit {
  font-size: 7.5px;
  font-weight: 400;
  color: rgba(80, 140, 185, 0.48);
}

/* section boxes */
.cd-box {
  background: rgba(0, 8, 24, 0.42);
  border: 1px solid rgba(0, 40, 88, 0.16);
  border-radius: 2px;
  padding: 11px 12px;
}

.cd-box-label {
  font-size: 7px;
  letter-spacing: 0.13em;
  color: rgba(0, 155, 205, 0.42);
  margin-bottom: 7px;
}

.cd-box-text {
  font-size: 8.5px;
  color: rgba(120, 170, 205, 0.68);
  line-height: 1.65;
  margin: 0;
}

.cd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5px;
}
.cd-table td { padding: 3px 0; color: rgba(100, 150, 185, 0.58); }
.cd-td-right { text-align: right; }
.cd-td-bright { color: rgba(150, 205, 240, 0.82); }

/* footer */
.cd-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
}

.cd-dismiss {
  background: transparent;
  border: 1px solid rgba(0, 80, 140, 0.28);
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.07em;
  color: rgba(90, 160, 205, 0.65);
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.cd-dismiss:hover {
  background: rgba(0, 40, 90, 0.30);
  color: rgba(0, 200, 255, 0.88);
  border-color: rgba(0, 160, 230, 0.38);
}

.cd-syslog {
  font-size: 6.5px;
  letter-spacing: 0.08em;
  color: rgba(70, 120, 155, 0.28);
}

</style>
