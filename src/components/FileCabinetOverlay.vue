<template>
  <Teleport to="body">
    <Transition name="fc-fade">
      <div v-if="modelValue" class="fc-overlay">

        <!-- ── Header ─────────────────────────────────────────────────────── -->
        <div class="fc-header">
          <span class="fc-badge">⬡ FILE CABINET</span>
          <div class="fc-tabs">
            <button v-for="tab in DRAWERS" :key="tab.key"
              class="fc-tab-pip"
              :class="{ 'fc-tab-pip--active': activeDrawer === tab.key }"
              @click="activeDrawer = tab.key">
              <q-icon :name="tab.icon" size="11px" />
              <span>{{ tab.label }}</span>
              <span class="fc-tab-count">{{ tab.count() }}</span>
            </button>
          </div>
          <button class="fc-close" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <!-- ── Body ───────────────────────────────────────────────────────── -->
        <div class="fc-body">

          <div v-if="activeDrawer !== 'coming-soon'" class="fc-toolbar">
            <input v-model="searchQuery" class="fc-search" placeholder="Search this drawer…" />
            <select v-model="sortKey" class="fc-sort">
              <option v-for="opt in sortOptionsForDrawer" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
            </select>
          </div>

          <div class="fc-list">

            <!-- Coming Soon — static, always renders regardless of sign-in state -->
            <template v-if="activeDrawer === 'coming-soon'">
              <div class="fc-coming-soon-banner">
                Documented in SPEC.md §18.5 but with no backing data in this app yet —
                nothing shown here is fabricated.
              </div>
              <div v-for="entry in fileCabinet.comingSoonDrawer" :key="entry.label" class="fc-cs-row">
                <q-icon name="hourglass_empty" size="13px" class="fc-cs-icon" />
                <div>
                  <div class="fc-cs-label">{{ entry.label }}</div>
                  <div class="fc-cs-note">{{ entry.note }}</div>
                </div>
              </div>
            </template>

            <!-- Signed out — real drawers all show the same prompt -->
            <div v-else-if="!member.isSignedIn" class="fc-empty">
              <q-icon name="lock_outline" size="22px" class="q-mb-xs" />
              <div>Sign in to see your own records here.</div>
            </div>

            <div v-else-if="fileCabinet.loading" class="fc-empty">
              <q-spinner-orbit color="cyan-5" size="24px" />
              <div class="q-mt-sm">Loading…</div>
            </div>

            <div v-else-if="visibleRows.length === 0" class="fc-empty">
              <q-icon name="folder_off" size="22px" class="q-mb-xs" />
              <div>{{ emptyMessage }}</div>
            </div>

            <template v-else>
              <div v-for="row in visibleRows" :key="row.id" class="fc-row">
                <div class="fc-row-dot" />
                <div class="fc-row-body">
                  <div class="fc-row-label">{{ row.label }}</div>
                  <div class="fc-row-meta">
                    <span class="fc-type-chip">{{ row.chip }}</span>
                    <span v-if="row.sub" class="fc-sub-chip">{{ row.sub }}</span>
                  </div>
                  <a v-if="row.ponInkUrl" :href="row.ponInkUrl" target="_blank" rel="noopener" class="fc-link">
                    <q-icon name="link" size="10px" class="q-mr-xxs" />pon.ink profile
                  </a>
                  <a v-for="(m, i) in row.mediaLinks ?? []" :key="i" :href="m" target="_blank" rel="noopener" class="fc-link">
                    <q-icon name="ondemand_video" size="10px" class="q-mr-xxs" />{{ m }}
                  </a>
                  <div class="fc-row-date">{{ fmtDate(row.date) }}</div>
                </div>
              </div>
            </template>

          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFileCabinetStore } from 'src/stores/file-cabinet'
import { useMemberStore } from 'src/stores/member'

defineProps<{ modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const fileCabinet = useFileCabinetStore()
const member      = useMemberStore()

// ── Drawer tabs ──────────────────────────────────────────────────────────────

type DrawerKey = 'eco-ops' | 'certs' | 'rewards' | 'settlements' | 'creative' | 'coming-soon'

const DRAWERS: { key: DrawerKey; label: string; icon: string; count: () => number }[] = [
  { key: 'eco-ops',     label: 'Eco-Ops Records', icon: 'eco',               count: () => fileCabinet.ecoOpsDrawer.length },
  { key: 'certs',       label: 'Certifications',  icon: 'workspace_premium', count: () => fileCabinet.certificationsDrawer.length },
  { key: 'rewards',     label: 'Rewards',         icon: 'stars',             count: () => fileCabinet.rewardsDrawer.length },
  { key: 'settlements', label: 'Settlement Docs', icon: 'description',       count: () => fileCabinet.settlementDocsDrawer.length },
  { key: 'creative',    label: 'Creative Assets', icon: 'palette',           count: () => fileCabinet.creativeAssetsDrawer.length },
  { key: 'coming-soon', label: 'Coming Soon',     icon: 'hourglass_empty',   count: () => fileCabinet.comingSoonDrawer.length },
]

const activeDrawer = ref<DrawerKey>('eco-ops')

// ── Search / sort ────────────────────────────────────────────────────────────

interface SortOption { key: string; label: string }

const SORT_OPTIONS: Record<DrawerKey, SortOption[]> = {
  'eco-ops':     [{ key: 'observed_at', label: 'Date observed' }, { key: 'proof_status', label: 'Proof status' }],
  'certs':       [{ key: 'issued_at', label: 'Date issued' }, { key: 'source', label: 'Source' }],
  'rewards':     [{ key: 'created_at', label: 'Date' }, { key: 'points', label: 'Points' }],
  'settlements': [{ key: 'createdAt', label: 'Date created' }, { key: 'type', label: 'Type' }],
  'creative':    [{ key: 'createdAt', label: 'Date created' }, { key: 'source', label: 'Source' }],
  'coming-soon': [],
}

const searchQuery = ref('')
const sortKey      = ref('')

const sortOptionsForDrawer = computed(() => SORT_OPTIONS[activeDrawer.value])

watch(activeDrawer, () => {
  searchQuery.value = ''
  sortKey.value = sortOptionsForDrawer.value[0]?.key ?? ''
}, { immediate: true })

// ── Row shape — one normalized shape all 5 real drawers map into ─────────────

interface Row {
  id:          string
  label:       string
  chip:        string
  sub?:        string
  date:        string
  searchBlob:  string
  sortValues:  Record<string, string | number>
  ponInkUrl?:  string
  mediaLinks?: string[]
}

function rowsForDrawer(key: DrawerKey): Row[] {
  switch (key) {
    case 'eco-ops':
      return fileCabinet.ecoOpsDrawer.map(r => ({
        id: r.id, label: r.record_type, chip: r.record_type, sub: r.proof_status,
        date: r.observed_at,
        searchBlob: [r.record_type, r.notes, r.protocol].filter(Boolean).join(' ').toLowerCase(),
        sortValues: { observed_at: r.observed_at, proof_status: r.proof_status },
      }))
    case 'certs':
      return fileCabinet.certificationsDrawer.map(c => ({
        id: c.id, label: c.certificate_type, chip: c.certificate_type, sub: c.cert_subtype ?? c.source,
        date: c.issued_at,
        searchBlob: [c.certificate_type, c.source].join(' ').toLowerCase(),
        sortValues: { issued_at: c.issued_at, source: c.source },
      }))
    case 'rewards':
      return fileCabinet.rewardsDrawer.map(e => ({
        id: e.id, label: e.action_key, chip: e.track, sub: `${e.points} pts`,
        date: e.created_at,
        searchBlob: [e.action_key, e.track].join(' ').toLowerCase(),
        sortValues: { created_at: e.created_at, points: e.points },
      }))
    case 'settlements':
      return fileCabinet.settlementDocsDrawer.map(s => ({
        id: s.key, label: s.displayName, chip: s.type,
        date: s.createdAt,
        searchBlob: [s.displayName, s.planetName, s.hostname].join(' ').toLowerCase(),
        sortValues: { createdAt: s.createdAt, type: s.type },
      }))
    case 'creative':
      return fileCabinet.creativeAssetsDrawer.map(a => ({
        id: a.id, label: a.label, chip: a.kind, sub: a.status,
        date: a.createdAt,
        searchBlob: [a.label, a.kind].join(' ').toLowerCase(),
        sortValues: { createdAt: a.createdAt, source: a.source },
        ponInkUrl: a.ponInkUrl, mediaLinks: a.mediaLinks,
      }))
    case 'coming-soon':
      return []
  }
}

const visibleRows = computed<Row[]>(() => {
  let rows = rowsForDrawer(activeDrawer.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) rows = rows.filter(r => r.searchBlob.includes(q))
  const sk = sortKey.value
  if (sk) {
    rows = [...rows].sort((a, b) => {
      const av = a.sortValues[sk] ?? ''
      const bv = b.sortValues[sk] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return bv - av
      return String(bv).localeCompare(String(av))
    })
  }
  return rows
})

const EMPTY_HINTS: Record<DrawerKey, string> = {
  'eco-ops':     'Log a field observation from the citizen-science tools to see it here.',
  'certs':       'Certificates are issued automatically once a track threshold is crossed.',
  'rewards':     'Earn points from eco-ops, quizzes, or mentorship to see them here.',
  'settlements': 'Establish a settlement to see it here.',
  'creative':    'Place an item in your settlement or publish a creative page to see it here.',
  'coming-soon': '',
}
const emptyMessage = computed(() => {
  const label = DRAWERS.find(d => d.key === activeDrawer.value)?.label ?? ''
  return `No ${label.toLowerCase()} yet. ${EMPTY_HINTS[activeDrawer.value]}`
})

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}
</script>

<style scoped>
/* ── Overlay shell — same pattern as PlanetClaimOverlay.vue's .claim-overlay ── */

.fc-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 2, 10, 0.96);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  font-family: 'Courier New', monospace;
}

.fc-fade-enter-active { transition: opacity 0.22s ease; }
.fc-fade-leave-active  { transition: opacity 0.16s ease; }
.fc-fade-enter-from,
.fc-fade-leave-to      { opacity: 0; }

/* ── Header ─────────────────────────────────────────────────────────────────── */

.fc-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(255, 170, 85, 0.16);
  flex-shrink: 0;
}

.fc-badge {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(255, 190, 130, 0.80);
  background: rgba(120, 70, 0, 0.28);
  border: 1px solid rgba(220, 160, 40, 0.30);
  border-radius: 3px;
  padding: 2px 7px;
}

.fc-tabs { display: flex; gap: 6px; margin-left: auto; flex-wrap: wrap; }

.fc-tab-pip {
  display: flex; align-items: center; gap: 4px;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(150, 150, 160, 0.55);
  padding: 3px 9px;
  border-radius: 10px;
  border: 1px solid rgba(150, 150, 160, 0.20);
  background: none;
  cursor: pointer;
}
.fc-tab-pip:hover { color: rgba(220, 220, 230, 0.80); }
.fc-tab-pip--active {
  color: rgba(255, 200, 120, 0.90);
  border-color: rgba(220, 160, 40, 0.45);
  background: rgba(120, 70, 0, 0.25);
}
.fc-tab-count {
  background: rgba(120, 70, 0, 0.30); color: rgba(255, 190, 100, 0.80);
  border-radius: 8px; padding: 0 5px; font-size: 8px;
}

.fc-close {
  margin-left: 10px;
  background: none;
  border: 1px solid rgba(120, 120, 130, 0.30);
  color: rgba(140, 140, 150, 0.70);
  width: 26px; height: 26px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.12s, border-color 0.12s;
}
.fc-close:hover { color: #ff6666; border-color: rgba(200,80,80,0.45); }

/* ── Body ───────────────────────────────────────────────────────────────────── */

.fc-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.fc-toolbar { display: flex; gap: 10px; flex-shrink: 0; margin-bottom: 12px; }
.fc-search {
  flex: 1; min-width: 0;
  font-family: inherit; font-size: 11px;
  padding: 6px 10px; border-radius: 4px;
  background: rgba(20, 15, 5, 0.70); color: rgba(230, 210, 180, 0.90);
  border: 1px solid rgba(255, 170, 85, 0.22);
}
.fc-search:focus { outline: none; border-color: rgba(255, 190, 100, 0.55); }
.fc-sort {
  font-family: inherit; font-size: 10px;
  padding: 6px 8px; border-radius: 4px;
  background: rgba(20, 15, 5, 0.70); color: rgba(200, 180, 150, 0.85);
  border: 1px solid rgba(255, 170, 85, 0.22);
}

.fc-list { flex: 1; overflow-y: auto; }

.fc-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 12px; text-align: center;
  color: rgba(150, 150, 160, 0.65);
  font-size: 11px;
}

.fc-row {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 9px 6px;
  border-bottom: 1px solid rgba(255, 170, 85, 0.08);
}
.fc-row:hover { background: rgba(255, 170, 85, 0.04); }
.fc-row-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; background: rgba(255, 190, 100, 0.60); }
.fc-row-body { flex: 1; min-width: 0; }
.fc-row-label { font-size: 11px; color: rgba(230, 210, 180, 0.92); margin-bottom: 3px; }
.fc-row-meta { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 3px; }
.fc-type-chip {
  font-size: 8px; padding: 1px 6px; border-radius: 2px; letter-spacing: 0.06em;
  background: rgba(120, 70, 0, 0.25); color: rgba(255, 190, 100, 0.80);
}
.fc-sub-chip {
  font-size: 8px; padding: 1px 6px; border-radius: 2px; letter-spacing: 0.06em;
  background: rgba(0, 60, 100, 0.25); color: rgba(100, 180, 220, 0.80);
}
.fc-row-date { font-size: 8.5px; color: rgba(130, 120, 100, 0.60); margin-top: 3px; font-family: monospace; }
.fc-link { display: block; font-size: 9px; color: rgba(100, 200, 240, 0.80); margin-top: 2px; text-decoration: none; }
.fc-link:hover { text-decoration: underline; }

/* ── Coming Soon ────────────────────────────────────────────────────────────── */

.fc-coming-soon-banner {
  font-size: 9.5px; line-height: 1.5; color: rgba(150, 150, 160, 0.70);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(150, 150, 160, 0.15);
  border-radius: 5px; padding: 8px 12px; margin-bottom: 12px;
}
.fc-cs-row {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 8px 6px;
  border-bottom: 1px solid rgba(150, 150, 160, 0.08);
}
.fc-cs-icon { color: rgba(150, 150, 160, 0.50); margin-top: 2px; }
.fc-cs-label { font-size: 10.5px; color: rgba(190, 190, 200, 0.85); }
.fc-cs-note  { font-size: 9px; color: rgba(130, 130, 140, 0.60); margin-top: 2px; }
</style>
