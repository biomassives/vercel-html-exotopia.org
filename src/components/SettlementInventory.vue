<template>
  <div class="si-root">

    <!-- Toggle handle — always visible -->
    <button class="si-handle" @click="open = !open" :title="open ? 'Close inventory' : 'Open settlement inventory'">
      <q-icon name="inventory_2" size="16px" color="cyan-4" />
      <span class="si-count">{{ items.length }}</span>
    </button>

    <!-- Slide-in panel -->
    <Transition name="si-slide">
      <div v-if="open" class="si-panel">

        <!-- Header -->
        <div class="si-header">
          <q-icon name="inventory_2" size="13px" color="cyan-5" class="q-mr-xs" />
          <span class="si-title">SETTLEMENT ITEMS</span>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5" @click="open = false" />
        </div>

        <!-- Type tabs -->
        <div class="si-tabs">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            class="si-tab"
            :class="{ 'si-tab--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <q-icon :name="tab.icon" size="11px" />
            <span>{{ tab.label }}</span>
            <span class="si-tab-count">{{ tabCount(tab.key) }}</span>
          </button>
        </div>

        <!-- Item list -->
        <div class="si-list">
          <div v-if="visibleItems.length === 0" class="si-empty">
            <q-icon name="add_circle_outline" size="22px" color="blue-grey-7" class="q-mb-xs" />
            <div class="si-empty-text">No {{ activeTab === 'all' ? '' : activeTab }} items yet.</div>
            <div class="si-empty-hint">Use "Acquire" below to add your first item.</div>
          </div>

          <div v-for="item in visibleItems" :key="item.id" class="si-item">
            <div class="si-item-dot" :style="{ background: item.color }" />
            <div class="si-item-body">
              <div class="si-item-label">{{ item.label }}</div>
              <div class="si-item-meta">
                <span class="si-zone-chip">{{ item.zone }}</span>
                <span class="si-type-chip" :class="`si-type--${item.type}`">{{ TYPE_LABELS[item.type] }}</span>
              </div>
              <div v-if="item.community" class="si-provenance">
                <q-icon name="groups" size="9px" class="q-mr-xxs" />{{ item.community }}
              </div>
              <div v-if="item.donorKey" class="si-provenance">
                <q-icon name="swap_horiz" size="9px" class="q-mr-xxs" />From {{ item.donorKey }}
              </div>
              <div class="si-item-date">{{ fmtDate(item.acquiredAt) }}</div>
            </div>
            <q-btn flat dense round icon="delete_outline" size="xs" color="blue-grey-7"
              @click="confirmRemove(item)" title="Remove item" />
          </div>
        </div>

        <!-- Acquire button -->
        <div class="si-footer">
          <q-btn flat dense icon="add_circle" label="Acquire item" color="cyan-5" size="sm"
            @click="acquireOpen = true" />
        </div>

      </div>
    </Transition>

    <!-- Acquire dialog -->
    <q-dialog v-model="acquireOpen" position="right">
      <q-card class="si-acquire-card">
        <q-card-section class="q-pb-xs">
          <div class="row items-center q-mb-xs">
            <q-icon name="add_box" color="cyan-5" size="18px" class="q-mr-sm" />
            <div class="text-subtitle2 text-blue-grey-1" style="letter-spacing:0.06em">ACQUIRE ITEM</div>
          </div>
          <q-separator color="blue-grey-8" />
        </q-card-section>

        <!-- Step 1: select acquisition type -->
        <q-card-section v-if="acquireStep === 1">
          <div class="text-caption text-blue-grey-5 q-mb-sm" style="letter-spacing:0.08em">HOW ARE YOU ACQUIRING THIS?</div>
          <div class="si-acq-grid">
            <button v-for="at in ACQ_TYPES" :key="at.key"
              class="si-acq-btn"
              :class="{ 'si-acq-btn--sel': acquireType === at.key }"
              @click="acquireType = at.key; acquireStep = 2">
              <q-icon :name="at.icon" size="18px" :color="at.color" class="q-mb-xs" />
              <div class="si-acq-label">{{ at.label }}</div>
              <div class="si-acq-desc">{{ at.desc }}</div>
            </button>
          </div>
        </q-card-section>

        <!-- Step 2: select preset -->
        <q-card-section v-else-if="acquireStep === 2">
          <div class="row items-center q-mb-sm">
            <q-btn flat dense round icon="arrow_back" size="xs" color="blue-grey-5" @click="acquireStep = 1" />
            <span class="text-caption text-blue-grey-4 q-ml-xs" style="letter-spacing:0.08em">
              {{ ACQ_TYPES.find(a=>a.key===acquireType)?.label.toUpperCase() }} · SELECT ITEM
            </span>
          </div>
          <div class="si-preset-list">
            <button
              v-for="[key, preset] in eligiblePresets"
              :key="key"
              class="si-preset-btn"
              :class="{ 'si-preset-btn--sel': acquirePreset === key }"
              @click="acquirePreset = key"
            >
              <div class="si-preset-dot"
                :style="{ background: '#' + preset.defaultColor.toString(16).padStart(6,'0') }" />
              <div>
                <div class="si-preset-label">{{ preset.label }}</div>
                <div class="si-preset-desc">{{ preset.description }}</div>
                <div v-if="preset.buildCost && acquireType === 'constructed'" class="si-preset-cost">
                  {{ preset.buildCost }} eco-ops pts
                </div>
              </div>
            </button>
          </div>

          <!-- Zone override -->
          <div class="q-mt-sm">
            <div class="text-caption text-blue-grey-6 q-mb-xs" style="font-size:9px;letter-spacing:0.1em">PLACEMENT ZONE</div>
            <div class="si-zone-row">
              <button v-for="zone in ZONES" :key="zone"
                class="si-zone-btn"
                :class="{ 'si-zone-btn--sel': acquireZone === zone }"
                @click="acquireZone = zone">{{ zone }}</button>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="resetAcquire" />
          <q-btn v-if="acquireStep === 2 && acquirePreset"
            unelevated label="Add to settlement" color="cyan-8"
            @click="doAcquire" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Remove confirm -->
    <q-dialog v-model="removeConfirmOpen">
      <q-card class="bg-dark text-blue-grey-1" style="min-width:280px">
        <q-card-section>
          <div class="text-subtitle2">Remove "{{ itemToRemove?.label }}"?</div>
          <div class="text-caption text-blue-grey-5 q-mt-xs">This cannot be undone.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="removeConfirmOpen = false" />
          <q-btn flat label="Remove" color="red-5" @click="doRemove" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useSettlementItems,
  ITEM_MESH_PRESETS,
  type ItemAcquisitionType,
  type ItemZone,
  type SettlementItem,
} from 'src/lib/settlement-items'

const props = defineProps<{ settlementKey: string }>()

const skRef  = computed(() => props.settlementKey)
const { items, byType, addItem, removeItem } = useSettlementItems(skRef)

// ── UI state ──────────────────────────────────────────────────────────────────

const open    = ref(false)
const activeTab = ref<'all' | ItemAcquisitionType>('all')

const TABS = [
  { key: 'all' as const,          label: 'All',        icon: 'grid_view' },
  { key: 'constructed' as const,  label: 'Built',      icon: 'build' },
  { key: 'traded' as const,       label: 'Traded',     icon: 'swap_horiz' },
  { key: 'generated' as const,    label: 'Airdrop',    icon: 'bolt' },
  { key: 'eco-ops' as const,      label: 'Eco-ops',    icon: 'eco' },
]

const TYPE_LABELS: Record<ItemAcquisitionType, string> = {
  constructed: 'built',
  traded:      'traded',
  generated:   'airdrop',
  'eco-ops':   'eco-ops',
}

function tabCount(tab: typeof activeTab.value): number {
  if (tab === 'all') return items.value.length
  return byType.value[tab].length
}

const visibleItems = computed<SettlementItem[]>(() =>
  activeTab.value === 'all' ? items.value : byType.value[activeTab.value]
)

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

// ── Acquire flow ──────────────────────────────────────────────────────────────

const acquireOpen  = ref(false)
const acquireStep  = ref<1 | 2>(1)
const acquireType  = ref<ItemAcquisitionType>('constructed')
const acquirePreset = ref<string>('')
const acquireZone  = ref<ItemZone>('open-floor')

const ZONES: ItemZone[] = ['library', 'water-edge', 'garden', 'gateway', 'courtyard', 'open-floor']

const ACQ_TYPES: { key: ItemAcquisitionType; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'constructed', label: 'Construct',  icon: 'build',       color: 'amber-5',  desc: 'Build with eco-ops points' },
  { key: 'traded',      label: 'Trade',      icon: 'swap_horiz',  color: 'cyan-5',   desc: 'Receive from another settlement' },
  { key: 'generated',   label: 'Airdrop',    icon: 'bolt',        color: 'purple-4', desc: 'Generated by pon.ink event' },
  { key: 'eco-ops',     label: 'Eco-ops',    icon: 'eco',         color: 'green-5',  desc: 'Earned via community activity' },
]

const eligiblePresets = computed(() =>
  Object.entries(ITEM_MESH_PRESETS).filter(([, p]) => p.acquiredBy.includes(acquireType.value))
)

function resetAcquire() {
  acquireOpen.value  = false
  acquireStep.value  = 1
  acquirePreset.value = ''
}

function doAcquire() {
  if (!acquirePreset.value) return
  const preset = ITEM_MESH_PRESETS[acquirePreset.value]!
  addItem({
    type:     acquireType.value,
    meshPreset: acquirePreset.value,
    zone:     acquireZone.value || preset.zoneDefault,
    buildCost: preset.buildCost,
  })
  resetAcquire()
}

// ── Remove flow ───────────────────────────────────────────────────────────────

const removeConfirmOpen = ref(false)
const itemToRemove      = ref<SettlementItem | null>(null)

function confirmRemove(item: SettlementItem) {
  itemToRemove.value      = item
  removeConfirmOpen.value = true
}

function doRemove() {
  if (itemToRemove.value) removeItem(itemToRemove.value.id)
  removeConfirmOpen.value = false
  itemToRemove.value      = null
}
</script>

<style scoped>
.si-root { position: absolute; right: 0; top: 50%; transform: translateY(-50%); z-index: 20; }

.si-handle {
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: rgba(0, 15, 35, 0.85); border: 1px solid rgba(0, 150, 200, 0.3);
  border-right: none; border-radius: 6px 0 0 6px;
  padding: 8px 6px; cursor: pointer;
  backdrop-filter: blur(6px);
}
.si-handle:hover { background: rgba(0, 25, 55, 0.90); }
.si-count { font-size: 9px; font-family: monospace; color: #00ccee; }

/* Panel */
.si-panel {
  position: absolute; right: 0; top: 0; transform: translateY(-50%);
  width: 280px;
  background: rgba(1, 5, 20, 0.96);
  border: 1px solid rgba(0, 150, 200, 0.22);
  border-radius: 6px 0 0 6px;
  backdrop-filter: blur(10px);
  display: flex; flex-direction: column;
  max-height: 78vh;
  overflow: hidden;
}

.si-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.25);
  background: rgba(0, 8, 28, 0.70);
  flex-shrink: 0;
}
.si-title { font-size: 9px; letter-spacing: 0.16em; color: rgba(0, 180, 220, 0.65); font-family: monospace; }

/* Tabs */
.si-tabs {
  display: flex; flex-wrap: wrap; gap: 2px; padding: 5px 6px;
  border-bottom: 1px solid rgba(0, 50, 100, 0.20);
  flex-shrink: 0;
}
.si-tab {
  display: flex; align-items: center; gap: 3px;
  padding: 3px 7px; border-radius: 3px;
  font-size: 9px; letter-spacing: 0.06em;
  color: rgba(100, 150, 180, 0.65);
  background: transparent; border: none; cursor: pointer;
}
.si-tab:hover { background: rgba(0, 80, 120, 0.25); color: rgba(160, 210, 235, 0.9); }
.si-tab--active { background: rgba(0, 100, 160, 0.30); color: #00ccee; }
.si-tab-count {
  background: rgba(0, 100, 160, 0.30); color: #00aacc;
  border-radius: 8px; padding: 0 5px; font-size: 8px;
}

/* Item list */
.si-list { flex: 1; overflow-y: auto; padding: 6px 0; scrollbar-width: thin; scrollbar-color: rgba(0,120,180,0.2) transparent; }

.si-empty { display: flex; flex-direction: column; align-items: center; padding: 24px 12px; text-align: center; }
.si-empty-text { font-size: 10px; color: rgba(80, 130, 160, 0.7); margin-bottom: 4px; }
.si-empty-hint { font-size: 8px; color: rgba(60, 100, 130, 0.55); }

.si-item {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 40, 80, 0.15);
}
.si-item:last-child { border-bottom: none; }
.si-item:hover { background: rgba(0, 30, 60, 0.25); }

.si-item-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
.si-item-body { flex: 1; min-width: 0; }
.si-item-label { font-size: 10px; color: rgba(180, 220, 240, 0.90); margin-bottom: 2px; }
.si-item-meta { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 2px; }
.si-item-date { font-size: 8px; color: rgba(70, 100, 130, 0.55); margin-top: 2px; font-family: monospace; }

.si-zone-chip {
  font-size: 7.5px; padding: 1px 5px; border-radius: 2px;
  background: rgba(0, 60, 100, 0.30); color: rgba(100, 160, 200, 0.70);
  letter-spacing: 0.06em;
}
.si-type-chip {
  font-size: 7.5px; padding: 1px 5px; border-radius: 2px; letter-spacing: 0.06em;
}
.si-type--constructed { background: rgba(180, 120, 0, 0.20);  color: rgba(255, 190, 60, 0.75); }
.si-type--traded      { background: rgba(0, 120, 180, 0.20);  color: rgba(80, 200, 240, 0.75); }
.si-type--generated   { background: rgba(120, 0, 180, 0.20);  color: rgba(190, 100, 255, 0.80); }
.si-type--eco-ops     { background: rgba(0, 130, 50, 0.20);   color: rgba(80, 210, 120, 0.80); }

.si-provenance { font-size: 8px; color: rgba(100, 160, 200, 0.55); display: flex; align-items: center; gap: 2px; }

/* Footer */
.si-footer {
  padding: 7px 10px;
  border-top: 1px solid rgba(0, 60, 100, 0.20);
  flex-shrink: 0;
}

/* Acquire dialog */
.si-acquire-card {
  width: 320px;
  background: rgba(1, 5, 20, 0.98);
  border: 1px solid rgba(0, 140, 200, 0.20);
}
.si-acq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.si-acq-btn {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 8px; border-radius: 5px;
  background: rgba(0, 15, 40, 0.70);
  border: 1px solid rgba(0, 80, 130, 0.25);
  cursor: pointer; text-align: center;
}
.si-acq-btn:hover, .si-acq-btn--sel { background: rgba(0, 50, 90, 0.50); border-color: rgba(0, 150, 200, 0.45); }
.si-acq-label { font-size: 10px; color: rgba(160, 210, 235, 0.90); margin-bottom: 3px; }
.si-acq-desc  { font-size: 8px; color: rgba(80, 130, 160, 0.65); }

.si-preset-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
.si-preset-btn {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 7px 9px; border-radius: 4px;
  background: rgba(0, 12, 30, 0.70); border: 1px solid rgba(0, 60, 100, 0.22);
  cursor: pointer; text-align: left;
}
.si-preset-btn:hover, .si-preset-btn--sel { background: rgba(0, 40, 80, 0.50); border-color: rgba(0, 140, 200, 0.40); }
.si-preset-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
.si-preset-label { font-size: 10px; color: rgba(170, 215, 240, 0.90); }
.si-preset-desc  { font-size: 8px; color: rgba(80, 130, 160, 0.60); margin-top: 1px; }
.si-preset-cost  { font-size: 8px; color: rgba(255, 190, 60, 0.70); margin-top: 2px; }

.si-zone-row { display: flex; flex-wrap: wrap; gap: 4px; }
.si-zone-btn {
  font-size: 8px; padding: 2px 7px; border-radius: 3px; cursor: pointer;
  background: rgba(0, 30, 60, 0.50); border: 1px solid rgba(0, 80, 130, 0.22);
  color: rgba(100, 160, 200, 0.65);
}
.si-zone-btn:hover, .si-zone-btn--sel { background: rgba(0, 80, 130, 0.40); color: #00ccee; border-color: rgba(0, 150, 200, 0.45); }

/* Slide transition */
.si-slide-enter-active, .si-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.si-slide-enter-from, .si-slide-leave-to { transform: translateX(100%) translateY(-50%); opacity: 0; }
</style>
