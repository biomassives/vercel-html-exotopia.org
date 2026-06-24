<template>
  <Teleport to="body">
    <Transition name="vp-slide">
      <div v-if="verifyStore.panelOpen" class="vp-root">

        <!-- Header -->
        <div class="vp-header">
          <span class="vp-title">◉ EXOTOPIA VERIFY</span>
          <span class="vp-shortcut">Shift+V</span>
          <div class="vp-tabs">
            <button v-for="t in TABS" :key="t.id"
              :class="['vp-tab', { 'vp-tab--active': activeTab === t.id }]"
              @click="activeTab = t.id">{{ t.label }}</button>
          </div>
          <button class="vp-close" @click="verifyStore.closePanel()">✕</button>
        </div>

        <!-- Body -->
        <div class="vp-body">

          <!-- ── CATALOG TAB ─────────────────────────────────────────── -->
          <div v-if="activeTab === 'catalog'">
            <template v-if="!galaxyStore.isLoaded">
              <div class="vp-loading">Galaxy data not yet loaded — visit /galaxy first</div>
            </template>
            <template v-else>
              <div class="vp-section-head">
                CATALOG STATS  ·  {{ audit.totalPlanets.toLocaleString() }} planets  ·
                {{ audit.totalSystems.toLocaleString() }} systems
                <button class="vp-copy" @click="copyAudit">⎘ copy</button>
              </div>

              <!-- Field coverage bars -->
              <div class="vp-sub">FIELD COVERAGE</div>
              <div v-for="f in audit.fieldCoverage" :key="f.field" class="vp-coverage-row">
                <span class="vp-fc-label">{{ f.label }}</span>
                <div class="vp-bar-wrap">
                  <div class="vp-bar-fill" :style="{ width: f.pct + '%' }"
                    :class="f.pct < 60 ? 'vp-bar--warn' : f.pct < 80 ? 'vp-bar--mid' : 'vp-bar--ok'" />
                </div>
                <span class="vp-fc-pct" :class="f.pct < 60 ? 'vp-warn' : f.pct < 80 ? 'vp-mid' : 'vp-ok'">
                  {{ f.pct }}%
                </span>
                <span class="vp-fc-miss">{{ f.missing.toLocaleString() }} missing</span>
              </div>

              <!-- Tier distribution -->
              <div class="vp-sub">TIER DISTRIBUTION</div>
              <div class="vp-kv-grid">
                <span class="vp-k">Confirmed</span> <span class="vp-v vp-ok">{{ audit.tierCounts.confirmed.toLocaleString() }}</span>
                <span class="vp-k">Candidate</span>  <span class="vp-v vp-mid">{{ audit.tierCounts.candidate.toLocaleString() }}</span>
                <span class="vp-k">Frontier</span>   <span class="vp-v vp-mid">{{ audit.tierCounts.frontier.toLocaleString() }}</span>
                <span class="vp-k">Theoretical</span><span class="vp-v">{{ audit.tierCounts.theoretical.toLocaleString() }}</span>
                <span class="vp-k">HZ planets</span> <span class="vp-v vp-ok">{{ audit.hzPlanets.toLocaleString() }} ({{ Math.round(audit.hzPlanets / audit.totalPlanets * 100) }}%)</span>
              </div>

              <!-- Spectral distribution -->
              <div class="vp-sub">SPECTRAL CLASS DISTRIBUTION</div>
              <div class="vp-spec-row">
                <span v-for="(n, cls) in specTop" :key="cls" class="vp-spec-chip"
                  :style="{ background: specColor(String(cls)) }">
                  {{ cls }}: {{ n }}
                </span>
              </div>

              <!-- Anomalies -->
              <div class="vp-sub">ANOMALIES</div>
              <div class="vp-kv-grid">
                <span class="vp-k">Eqt &gt; 4000 K</span>
                <span class="vp-v" :class="audit.anomalies.eqtTooHot.length ? 'vp-warn' : 'vp-ok'">
                  {{ audit.anomalies.eqtTooHot.length }}
                  <span v-if="audit.anomalies.eqtTooHot.length" class="vp-note">
                    (e.g. {{ audit.anomalies.eqtTooHot[0]?.pl_name }})
                  </span>
                </span>
                <span class="vp-k">Eqt &lt; 15 K</span>
                <span class="vp-v" :class="audit.anomalies.eqtTooCold.length ? 'vp-warn' : 'vp-ok'">
                  {{ audit.anomalies.eqtTooCold.length }}
                </span>
                <span class="vp-k">Orbit &gt; 80 AU</span>
                <span class="vp-v" :class="audit.anomalies.wideOrbit.length > 10 ? 'vp-warn' : 'vp-mid'">
                  {{ audit.anomalies.wideOrbit.length }}
                  <span class="vp-note">(wide-orbit / rogue planets)</span>
                </span>
                <span class="vp-k">Distance &gt; 15 kpc</span>
                <span class="vp-v" :class="audit.anomalies.badDistance.length ? 'vp-warn' : 'vp-ok'">
                  {{ audit.anomalies.badDistance.length }}
                </span>
              </div>

              <!-- Discovery method -->
              <div class="vp-sub">DISCOVERY METHOD</div>
              <div class="vp-kv-grid">
                <template v-for="(n, m) in discoveryTop" :key="m">
                  <span class="vp-k">{{ m }}</span>
                  <span class="vp-v">{{ (n as number).toLocaleString() }}</span>
                </template>
              </div>
            </template>
          </div>

          <!-- ── KNOWN SYSTEMS TAB ───────────────────────────────────── -->
          <div v-if="activeTab === 'known'">
            <div class="vp-section-head">
              KNOWN SYSTEM VERIFICATION
              <span :class="allPassed ? 'vp-ok' : 'vp-warn'">
                {{ knownResults.filter(r => r.found && r.checks.every(c => c.passed)).length }} /
                {{ knownResults.length }} systems fully verified
              </span>
            </div>

            <div v-if="!galaxyStore.isLoaded" class="vp-loading">
              Load galaxy data to run known system checks
            </div>
            <div v-else>
              <div v-for="res in knownResults" :key="res.hostname" class="vp-sys-block">
                <div class="vp-sys-head">
                  <span class="vp-sys-name">{{ res.hostname }}</span>
                  <span v-if="!res.found" class="vp-fail">NOT IN CATALOG</span>
                  <span v-else-if="res.checks.every(c => c.passed)" class="vp-ok">✓ all checks pass</span>
                  <span v-else class="vp-warn">⚠ {{ res.checks.filter(c => !c.passed).length }} issues</span>
                </div>
                <div class="vp-sys-note">{{ res.notes }}</div>
                <div v-for="chk in res.checks" :key="chk.name" class="vp-check-row">
                  <span class="vp-check-icon" :class="chk.passed ? (chk.warn ? 'vp-mid' : 'vp-ok') : 'vp-fail'">
                    {{ chk.passed ? (chk.warn ? '~' : '✓') : '✗' }}
                  </span>
                  <span class="vp-check-name">{{ chk.name }}</span>
                  <span class="vp-check-got" :class="chk.passed ? '' : 'vp-fail'">{{ chk.got }}</span>
                  <span class="vp-check-want">→ expect {{ chk.want }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── CURRENT SYSTEM TAB ─────────────────────────────────── -->
          <div v-if="activeTab === 'system'">
            <template v-if="!verifyStore.currentHostname || !currentSys">
              <div class="vp-loading">
                Open a star system in the Milky Way map to inspect rendering details.
              </div>
            </template>
            <template v-else>
              <div class="vp-section-head">
                {{ verifyStore.currentHostname }}
                <span class="vp-sys-meta">
                  {{ currentSys.st_spectype ?? '?' }}  ·
                  {{ currentSys.st_teff ?? '?' }} K  ·
                  {{ currentSys.sy_dist?.toFixed(1) ?? '?' }} pc  ·
                  {{ currentSys.planets.length }} planet{{ currentSys.planets.length !== 1 ? 's' : '' }}  ·
                  {{ currentSys.sy_snum ?? 1 }} star{{ (currentSys.sy_snum ?? 1) > 1 ? 's' : '' }}
                </span>
              </div>

              <div v-for="(detail, i) in planetDetails" :key="detail.pl_name" class="vp-planet-block">
                <div class="vp-planet-head">
                  <span class="vp-planet-name">{{ detail.pl_name }}</span>
                  <span v-if="detail.isInHZ" class="vp-hz-badge">HZ ✓</span>
                  <span v-if="detail.warnings.length" class="vp-warn">⚠ {{ detail.warnings.length }}</span>
                  <span v-else class="vp-ok">✓ clean</span>
                </div>

                <div class="vp-kv-grid vp-compact">
                  <span class="vp-k">Orbital AU</span>
                  <span class="vp-v" :class="detail.orbAUSource === 'fallback' ? 'vp-warn' : 'vp-ok'">
                    {{ detail.orbAU?.toFixed(3) ?? '—' }} AU
                    <span v-if="detail.orbAUSource === 'fallback'" class="vp-badge vp-badge--warn">FALLBACK #{{ detail.fallbackIdx }}</span>
                    <span v-else class="vp-badge vp-badge--ok">catalog</span>
                  </span>
                  <span class="vp-k">Viz distance</span>
                  <span class="vp-v">{{ detail.vizDist?.toFixed(1) ?? '—' }} scene units</span>
                  <span class="vp-k">Planet pR</span>
                  <span class="vp-v" :class="detail.pRSource === 'minimum' ? 'vp-mid' : 'vp-ok'">
                    {{ detail.pR.toFixed(2) }}
                    <span class="vp-badge" :class="detail.pRSource === 'minimum' ? 'vp-badge--warn' : 'vp-badge--ok'">{{ detail.pRSource }}</span>
                  </span>
                  <span class="vp-k">Ang. speed</span>
                  <span class="vp-v" :class="detail.angSpeed == null ? 'vp-warn' : 'vp-ok'">
                    {{ detail.angSpeed?.toExponential(2) ?? 'n/a' }} rad/f
                    <span v-if="detail.angSpeedSource === 'fallback_floor'" class="vp-badge vp-badge--warn">period floored</span>
                  </span>
                  <span class="vp-k">Temperature</span>
                  <span class="vp-v" :class="detail.eqt == null ? 'vp-warn' : detail.isInHZ ? 'vp-ok' : ''">
                    {{ detail.eqt != null ? detail.eqt + ' K' : 'unknown' }}
                    <span v-if="detail.isInHZ" class="vp-badge vp-badge--ok">in HZ</span>
                  </span>
                  <span v-if="detail.hzInAU" class="vp-k">HZ range</span>
                  <span v-if="detail.hzInAU" class="vp-v">{{ detail.hzInAU.toFixed(2) }} – {{ detail.hzOutAU?.toFixed(2) }} AU</span>
                </div>

                <div v-for="w in detail.warnings" :key="w" class="vp-warning">⚠ {{ w }}</div>
              </div>

              <!-- Scene stats (if available) -->
              <template v-if="verifyStore.sceneStats">
                <div class="vp-sub">SCENE GRAPH</div>
                <div class="vp-kv-grid vp-compact">
                  <span class="vp-k">systemObjects</span> <span class="vp-v">{{ verifyStore.sceneStats.systemObjects }}</span>
                  <span class="vp-k">animObjects</span>   <span class="vp-v">{{ verifyStore.sceneStats.animObjects }}</span>
                  <span class="vp-k">planets</span>       <span class="vp-v">{{ verifyStore.sceneStats.planets }}</span>
                  <span class="vp-k">orbit rings</span>   <span class="vp-v">{{ verifyStore.sceneStats.orbitRings }}</span>
                  <span class="vp-k">sprites</span>       <span class="vp-v">{{ verifyStore.sceneStats.sprites }}</span>
                  <span class="vp-k">labels</span>        <span class="vp-v">{{ verifyStore.sceneStats.labels }}</span>
                </div>
              </template>
            </template>
          </div>

          <!-- ── FORMULAE TAB ────────────────────────────────────────── -->
          <div v-if="activeTab === 'formulae'">
            <div class="vp-section-head">RENDERING FORMULA SPOT-CHECKS</div>

            <div v-for="fc in formulaChecks" :key="fc.name" class="vp-formula-block">
              <div class="vp-formula-name">{{ fc.name }}</div>
              <div class="vp-formula-expr">{{ fc.formula }}</div>
              <div v-for="c in fc.cases" :key="c.input" class="vp-formula-case">
                <span class="vp-check-icon" :class="c.passed ? 'vp-ok' : 'vp-fail'">
                  {{ c.passed ? '✓' : '✗' }}
                </span>
                <span class="vp-fc-input">{{ c.input }}</span>
                <span class="vp-fc-got" :class="c.passed ? '' : 'vp-fail'">{{ c.got }}</span>
                <span v-if="!c.passed" class="vp-fc-want">expect {{ c.expected }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVerifyStore }   from 'src/stores/verify'
import { useGalaxyStore }   from 'src/stores/galaxy'
import {
  auditCatalog, checkKnownSystems, verifyPlanetRendering, runFormulaChecks,
} from 'src/lib/verify'
import { auToViz, fallbackAU } from 'src/lib/three-utils'

const verifyStore  = useVerifyStore()
const galaxyStore  = useGalaxyStore()

const TABS = [
  { id: 'catalog',  label: 'CATALOG'  },
  { id: 'known',    label: 'KNOWN SYS' },
  { id: 'system',   label: 'CUR.SYS'  },
  { id: 'formulae', label: 'FORMULAE' },
]
const activeTab = ref<'catalog' | 'known' | 'system' | 'formulae'>('catalog')

// ── Keyboard shortcut ─────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.shiftKey && e.key === 'V') { e.preventDefault(); verifyStore.togglePanel() }
  if (e.key === 'Escape' && verifyStore.panelOpen) verifyStore.closePanel()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ── Catalog audit ─────────────────────────────────────────────────────────────

const audit = computed(() => {
  if (!galaxyStore.isLoaded) return auditCatalog([], new Map())
  return auditCatalog(galaxyStore.planets, galaxyStore.systems)
})

const specTop = computed(() => {
  const d = audit.value.specDistrib
  return Object.fromEntries(
    Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 8)
  )
})

const discoveryTop = computed(() => {
  const d = audit.value.discoveryDist
  return Object.fromEntries(
    Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6)
  )
})

function specColor(cls: string): string {
  const map: Record<string, string> = {
    O: '#6a7fff', B: '#88aaff', A: '#ccddff', F: '#ffeecc',
    G: '#ffcc66', K: '#ff9944', M: '#ff6633', '?': '#445566',
  }
  return map[cls] ?? '#334455'
}

function copyAudit() {
  void navigator.clipboard.writeText(JSON.stringify(audit.value, null, 2))
}

// ── Known system checks ───────────────────────────────────────────────────────

const knownResults = computed(() => {
  if (!galaxyStore.isLoaded) return []
  return checkKnownSystems(galaxyStore.systems)
})

const allPassed = computed(() =>
  knownResults.value.every(r => r.found && r.checks.every(c => c.passed))
)

// ── Current system rendering details ─────────────────────────────────────────

const currentSys = computed(() => {
  if (!verifyStore.currentHostname || !galaxyStore.isLoaded) return null
  return galaxyStore.systems.get(verifyStore.currentHostname) ?? null
})

const planetDetails = computed(() => {
  const sys = currentSys.value
  if (!sys) return []
  const sorted = [...sys.planets].sort((a, b) => {
    const au = (p: typeof a) => p.pl_orbsmax != null ? p.pl_orbsmax : 999
    return au(a) - au(b)
  })
  return sorted.map((pl, i) =>
    verifyPlanetRendering(pl, i, sorted.length, auToViz, fallbackAU)
  )
})

// ── Formula checks ────────────────────────────────────────────────────────────

const formulaChecks = computed(() => runFormulaChecks(auToViz))
</script>

<style scoped>
/* ── Panel shell ──────────────────────────────────────────────────── */

.vp-root {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9800;
  height: 46vh;
  min-height: 280px;
  background: rgba(0, 4, 14, 0.97);
  border-top: 1px solid rgba(0, 200, 255, 0.30);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
}

/* ── Header ───────────────────────────────────────────────────────── */

.vp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.40);
  background: rgba(0, 8, 22, 0.60);
  flex-shrink: 0;
}

.vp-title   { font-size: 9px; letter-spacing: 0.14em; color: rgba(0, 200, 255, 0.80); }
.vp-shortcut { font-size: 8px; color: rgba(0, 100, 140, 0.55); margin-right: auto; }

.vp-tabs { display: flex; gap: 2px; }

.vp-tab {
  background: none;
  border: 1px solid rgba(0, 100, 140, 0.30);
  color: rgba(0, 160, 200, 0.55);
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.1s;
}

.vp-tab--active {
  background: rgba(0, 180, 220, 0.18);
  border-color: rgba(0, 200, 255, 0.55);
  color: #00e5ff;
}

.vp-tab:hover:not(.vp-tab--active) { color: rgba(0, 200, 240, 0.75); }

.vp-close {
  background: none; border: none;
  color: rgba(0, 150, 180, 0.55);
  font-size: 12px; cursor: pointer; padding: 0 2px;
  transition: color 0.1s;
}
.vp-close:hover { color: #00e5ff; }

/* ── Body ─────────────────────────────────────────────────────────── */

.vp-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 180, 220, 0.2) transparent;
}

.vp-loading {
  color: rgba(80, 130, 160, 0.65);
  font-size: 9px;
  padding: 12px 0;
}

.vp-section-head {
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(0, 180, 220, 0.70);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 60, 100, 0.35);
  padding-bottom: 4px;
}

.vp-sub {
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(0, 120, 160, 0.55);
  margin: 10px 0 5px;
}

.vp-copy {
  background: none; border: 1px solid rgba(0, 140, 180, 0.30);
  color: rgba(0, 160, 200, 0.55); font-family: inherit; font-size: 8px;
  padding: 1px 6px; cursor: pointer; border-radius: 2px;
  transition: all 0.1s; margin-left: auto;
}
.vp-copy:hover { color: #00e5ff; border-color: rgba(0, 200, 255, 0.5); }

/* ── Field coverage bars ──────────────────────────────────────────── */

.vp-coverage-row {
  display: grid;
  grid-template-columns: 110px 1fr 30px 110px;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.vp-fc-label  { color: rgba(100, 150, 180, 0.75); font-size: 9px; }
.vp-fc-pct    { font-size: 9px; text-align: right; }
.vp-fc-miss   { font-size: 7px; color: rgba(80, 120, 150, 0.55); }

.vp-bar-wrap {
  height: 5px;
  background: rgba(0, 40, 70, 0.55);
  border-radius: 2px;
  overflow: hidden;
}

.vp-bar-fill  { height: 100%; border-radius: 2px; transition: width 0.3s; }
.vp-bar--ok   { background: rgba(0, 200, 120, 0.7); }
.vp-bar--mid  { background: rgba(200, 160, 40, 0.7); }
.vp-bar--warn { background: rgba(220, 80, 40, 0.7); }

/* ── KV grid ──────────────────────────────────────────────────────── */

.vp-kv-grid {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 2px 8px;
  margin-bottom: 6px;
}
.vp-compact { grid-template-columns: 100px 1fr; }

.vp-k { color: rgba(70, 120, 155, 0.65); font-size: 9px; }
.vp-v { color: rgba(160, 210, 230, 0.85); font-size: 9px; }

.vp-sys-meta { font-size: 8px; color: rgba(80, 130, 160, 0.65); }

/* ── Status colours ───────────────────────────────────────────────── */

.vp-ok   { color: rgba(60, 220, 120, 0.85); }
.vp-mid  { color: rgba(220, 180, 40, 0.85); }
.vp-warn { color: rgba(255, 160, 40, 0.90); }
.vp-fail { color: rgba(255, 80, 60, 0.90); }
.vp-note { font-size: 8px; color: rgba(80, 120, 150, 0.60); margin-left: 4px; }

.vp-badge {
  font-size: 7px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 4px;
  border: 1px solid;
}
.vp-badge--ok   { border-color: rgba(60, 220, 120, 0.4); color: rgba(60, 220, 120, 0.8); }
.vp-badge--warn { border-color: rgba(255, 160, 40, 0.4); color: rgba(255, 160, 40, 0.8); }

.vp-warning {
  font-size: 8px;
  color: rgba(255, 150, 40, 0.85);
  padding: 2px 6px;
  border-left: 2px solid rgba(255, 150, 40, 0.45);
  margin: 2px 0;
}

/* ── Spectral distribution chips ─────────────────────────────────── */

.vp-spec-row { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }

.vp-spec-chip {
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 3px;
  color: rgba(0, 0, 0, 0.8);
  font-weight: bold;
}

/* ── Known system blocks ──────────────────────────────────────────── */

.vp-sys-block {
  border: 1px solid rgba(0, 60, 100, 0.35);
  border-radius: 4px;
  padding: 6px 9px;
  margin-bottom: 8px;
}

.vp-sys-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.vp-sys-name { font-size: 10px; color: rgba(0, 200, 240, 0.80); letter-spacing: 0.05em; }
.vp-sys-note { font-size: 7px; color: rgba(80, 120, 150, 0.60); margin-bottom: 5px; }

.vp-check-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font-size: 9px;
}

.vp-check-icon { font-size: 10px; width: 14px; flex-shrink: 0; }
.vp-check-name { color: rgba(100, 150, 180, 0.75); flex: 0 0 90px; }
.vp-check-got  { color: rgba(160, 210, 230, 0.85); flex: 0 0 130px; }
.vp-check-want { color: rgba(80, 110, 140, 0.55); font-size: 8px; }

.vp-hz-badge {
  font-size: 7px;
  padding: 1px 5px;
  border: 1px solid rgba(60, 220, 120, 0.45);
  border-radius: 2px;
  color: rgba(60, 220, 120, 0.80);
}

/* ── Planet blocks ────────────────────────────────────────────────── */

.vp-planet-block {
  border: 1px solid rgba(0, 50, 90, 0.40);
  border-radius: 4px;
  padding: 6px 9px;
  margin-bottom: 7px;
}

.vp-planet-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}

.vp-planet-name { font-size: 10px; color: rgba(180, 220, 240, 0.85); letter-spacing: 0.04em; }

/* ── Formula checks ───────────────────────────────────────────────── */

.vp-formula-block {
  border: 1px solid rgba(0, 50, 90, 0.40);
  border-radius: 4px;
  padding: 6px 9px;
  margin-bottom: 9px;
}

.vp-formula-name { font-size: 10px; color: rgba(0, 200, 240, 0.75); margin-bottom: 2px; }
.vp-formula-expr { font-size: 8px; color: rgba(80, 130, 160, 0.60); margin-bottom: 5px; }

.vp-formula-case {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font-size: 9px;
}

.vp-fc-input { color: rgba(100, 150, 180, 0.75); flex: 0 0 180px; }
.vp-fc-got   { color: rgba(160, 210, 230, 0.85); }
.vp-fc-want  { color: rgba(255, 120, 60, 0.85); font-size: 8px; margin-left: 6px; }

/* ── Slide-in transition ──────────────────────────────────────────── */

.vp-slide-enter-active { transition: transform 0.22s ease-out, opacity 0.20s ease-out; }
.vp-slide-leave-active { transition: transform 0.18s ease-in,  opacity 0.16s ease-in;  }
.vp-slide-enter-from,
.vp-slide-leave-to     { transform: translateY(100%); opacity: 0; }
</style>
