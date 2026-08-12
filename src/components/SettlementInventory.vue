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
              <div v-if="item.donorName" class="si-provenance">
                <q-icon name="brush" size="9px" class="q-mr-xxs" />Designed by {{ item.donorName }}
              </div>
              <div v-if="item.donorKey" class="si-provenance" :title="item.donorKey">
                <q-icon name="swap_horiz" size="9px" class="q-mr-xxs" />From {{ donorLabel(item.donorKey) }}
              </div>
              <div class="si-item-date">{{ fmtDate(item.acquiredAt) }}</div>

              <!-- Design controls -->
              <div v-if="editingId === item.id" class="si-edit">
                <div class="si-edit-row">
                  <label class="si-edit-label">Colour</label>
                  <input type="color" class="si-color-input" :value="item.color"
                    @input="onColorInput(item.id, $event)" />
                </div>
                <div class="si-edit-row">
                  <label class="si-edit-label">Zone</label>
                  <select class="si-zone-select" :value="item.zone" @change="onZoneChange(item.id, $event)">
                    <option v-for="zone in ZONES" :key="zone" :value="zone">{{ zone }}</option>
                  </select>
                </div>
                <button v-if="requiresBuilder(item)" class="si-share-btn" @click="openVoxelBuilderForEdit(item)">
                  <q-icon name="view_in_ar" size="11px" class="q-mr-xxs" />Edit sculpture
                </button>
                <button v-if="canShare(item)" class="si-share-btn" @click="openShare(item)">
                  <q-icon name="ios_share" size="11px" class="q-mr-xxs" />Share this design
                </button>
                <div v-else class="si-share-note">
                  This item records real-world work, so it can't be shared as a design.
                </div>
              </div>
            </div>
            <div class="si-item-actions">
              <q-btn flat dense round :icon="editingId === item.id ? 'expand_less' : 'tune'" size="xs"
                :color="editingId === item.id ? 'cyan-5' : 'blue-grey-7'"
                @click="editingId = editingId === item.id ? null : item.id"
                :title="editingId === item.id ? 'Close design controls' : 'Edit design'" />
              <q-btn flat dense round icon="delete_outline" size="xs" color="blue-grey-7"
                @click="confirmRemove(item)" title="Remove item" />
            </div>
          </div>
        </div>

        <!-- Acquire / theme buttons -->
        <div class="si-footer">
          <q-btn flat dense icon="add_circle" label="Acquire item" color="cyan-5" size="sm"
            @click="acquireOpen = true" />
          <q-btn flat dense icon="palette" label="Apply a theme" color="purple-4" size="sm"
            @click="themeOpen = true" />
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

          <!-- Redeem a gift code -->
          <div class="si-redeem">
            <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.08em">
              OR REDEEM A GIFT CODE
            </div>
            <div class="si-redeem-hint">
              Someone can share a design with you from their own settlement — paste their code here.
            </div>
            <textarea v-model="redeemCode" class="si-redeem-input" rows="2"
              placeholder="Paste gift code…" @input="redeemError = ''" />
            <div v-if="redeemError" class="si-redeem-error">{{ redeemError }}</div>
            <q-btn flat dense size="sm" color="cyan-5" label="Redeem" :disable="!redeemCode.trim()"
              @click="doRedeem" />
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

          <div v-if="acquireType === 'constructed' && member.isSignedIn" class="si-balance"
            :class="{ 'si-balance--debt': financeBalance < 0 }">
            <q-icon :name="financeBalance < 0 ? 'trending_down' : 'savings'" size="13px" class="q-mr-xxs" />
            <span>{{ financeBalance }} finance-literacy pts</span>
            <span v-if="financeBalance < 0" class="si-balance-hint">
              — in debt. Points have no real-world value; a
              <router-link to="/learn" class="si-balance-link">P-Fin 8 quiz</router-link>
              pays real points back in.
            </span>
          </div>
          <div v-else-if="acquireType === 'constructed'" class="si-balance">
            Sign in to track a real balance — building is untracked (and free) until then.
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

        <div v-if="acquireError" class="si-acquire-error">{{ acquireError }}</div>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" :disable="acquireBusy" @click="resetAcquire" />
          <q-btn v-if="acquireStep === 2 && acquirePreset"
            unelevated :label="acquireBusy ? 'Building…' : 'Add to settlement'" color="cyan-8"
            :disable="acquireBusy" @click="doAcquire" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Apply a theme -->
    <q-dialog v-model="themeOpen" position="right">
      <q-card class="si-acquire-card">
        <q-card-section class="q-pb-xs">
          <div class="row items-center q-mb-xs">
            <q-icon name="palette" color="purple-4" size="18px" class="q-mr-sm" />
            <div class="text-subtitle2 text-blue-grey-1" style="letter-spacing:0.06em">APPLY A THEME</div>
          </div>
          <q-separator color="blue-grey-8" />
        </q-card-section>

        <q-card-section>
          <div class="si-theme-intro">
            A theme adds several items at once, coloured from your settlement's own hue.
          </div>
          <div v-if="member.isSignedIn" class="si-balance" :class="{ 'si-balance--debt': financeBalance < 0 }">
            <q-icon :name="financeBalance < 0 ? 'trending_down' : 'savings'" size="13px" class="q-mr-xxs" />
            <span>{{ financeBalance }} finance-literacy pts</span>
          </div>
          <div class="si-preset-list">
            <button v-for="pack in THEME_PACK_LIST" :key="pack.key"
              class="si-preset-btn"
              :class="{ 'si-preset-btn--sel': themePack === pack.key }"
              @click="themePack = pack.key">
              <div class="si-theme-dots">
                <span v-for="(_, i) in pack.items" :key="i" class="si-theme-dot"
                  :style="{ background: themePackItemColorHex(settlementKey, i) }" />
              </div>
              <div>
                <div class="si-preset-label">{{ pack.label }}</div>
                <div class="si-preset-desc">{{ pack.description }}</div>
                <div class="si-preset-cost">{{ pack.items.length }} items</div>
              </div>
            </button>
          </div>
        </q-card-section>

        <div v-if="acquireError" class="si-acquire-error">{{ acquireError }}</div>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" :disable="themeBusy" @click="closeTheme" />
          <q-btn v-if="themePack" unelevated :label="themeBusy ? 'Building…' : 'Apply theme'" color="purple-8"
            :disable="themeBusy" @click="doApplyTheme" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Share a design -->
    <q-dialog v-model="shareOpen">
      <q-card class="si-acquire-card">
        <q-card-section class="q-pb-xs">
          <div class="row items-center q-mb-xs">
            <q-icon name="ios_share" color="cyan-5" size="18px" class="q-mr-sm" />
            <div class="text-subtitle2 text-blue-grey-1" style="letter-spacing:0.06em">SHARE THIS DESIGN</div>
          </div>
          <q-separator color="blue-grey-8" />
        </q-card-section>

        <q-card-section>
          <div class="si-theme-intro">
            Send this code to someone else — they can redeem it to place your design in their own
            settlement, credited to you. Nothing is bought, sold, or transferred away from you.
          </div>

          <div class="text-caption text-blue-grey-6 q-mb-xs" style="font-size:9px;letter-spacing:0.1em">
            CREDIT THE DESIGN TO (OPTIONAL)
          </div>
          <input v-model="designerName" type="text" class="si-redeem-input" placeholder="Your name or handle" />

          <div class="text-caption text-blue-grey-6 q-mt-sm q-mb-xs" style="font-size:9px;letter-spacing:0.1em">
            GIFT CODE
          </div>
          <textarea class="si-redeem-input si-code-out" rows="4" readonly :value="shareCode" />
          <q-btn flat dense size="sm" :color="copied ? 'green-5' : 'cyan-5'"
            :icon="copied ? 'check' : 'content_copy'"
            :label="copied ? 'Copied' : 'Copy code'" @click="copyShareCode" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Done" color="blue-grey-5" @click="shareOpen = false" />
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

    <!-- Voxel sculpture builder — acquiring a new requiresBuilder item, or editing an existing one -->
    <VoxelBuilderDialog
      v-model="voxelBuilderOpen"
      :initial="voxelBuilderInitial"
      :settlement-key="props.settlementKey"
      @save="onVoxelBuilderSave"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useSettlementItems,
  ITEM_MESH_PRESETS,
  themePackItemColorHex,
  exportItemGiftCode,
  importItemGiftCode,
  type ItemAcquisitionType,
  type ItemZone,
  type SettlementItem,
  type VoxelPayload,
} from 'src/lib/settlement-items'
import { THEME_PACKS } from 'src/data/theme-packs'
import { useRewardsStore } from 'src/stores/rewards'
import { useMemberStore } from 'src/stores/member'
import VoxelBuilderDialog from 'src/components/VoxelBuilderDialog.vue'

const props = defineProps<{ settlementKey: string }>()

const skRef  = computed(() => props.settlementKey)
const { items, byType, addItem, removeItem, updateItem } = useSettlementItems(skRef)

const rewards = useRewardsStore()
const member  = useMemberStore()
const financeBalance = computed(() => rewards.pointsByTrack.finance_literacy)

onMounted(() => { if (member.isSignedIn) void rewards.loadMyRewards() })

// ── UI state ──────────────────────────────────────────────────────────────────

const open    = ref(false)
const activeTab = ref<'all' | ItemAcquisitionType>('all')

const TABS = [
  { key: 'all' as const,          label: 'All',        icon: 'grid_view' },
  { key: 'constructed' as const,  label: 'Built',      icon: 'build' },
  { key: 'traded' as const,       label: 'Traded',     icon: 'swap_horiz' },
  { key: 'generated' as const,    label: 'Airdrop',    icon: 'bolt' },
  { key: 'eco-ops' as const,      label: 'Eco-ops',    icon: 'eco' },
  { key: 'reward' as const,       label: 'Earned',     icon: 'workspace_premium' },
]

const TYPE_LABELS: Record<ItemAcquisitionType, string> = {
  constructed: 'built',
  traded:      'traded',
  generated:   'airdrop',
  'eco-ops':   'eco-ops',
  reward:      'earned',
}

function tabCount(tab: typeof activeTab.value): number {
  if (tab === 'all') return items.value.length
  return byType.value[tab].length
}

const visibleItems = computed<SettlementItem[]>(() =>
  activeTab.value === 'all' ? items.value : byType.value[activeTab.value]
)

/**
 * Settlement keys are `type:name[:…]` (see settlements.ts). Show the name part,
 * which is the human-meaningful "where", rather than the internal prefix.
 */
function donorLabel(donorKey: string): string {
  return donorKey.split(':')[1] || donorKey
}

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

// No 'reward' entry: reward objects are unlocked by an Impact Profile
// certificate and attached from /rewards. Letting them be picked here would
// make an earned object self-serve.
//
// No 'generated' entry: the pon.ink airdrop this acquisition type describes
// has no live event source yet — offering it here would let someone "acquire"
// an item from an event that never happened. Existing generated items (from
// before this change, or seeded test data) still show up under the Airdrop
// tab; this only hides it from new acquisitions until a real source exists.
const ACQ_TYPES: { key: ItemAcquisitionType; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'constructed', label: 'Construct',  icon: 'build',       color: 'amber-5',  desc: 'Build for real eco-ops points — see your balance below' },
  { key: 'traded',      label: 'Trade',      icon: 'swap_horiz',  color: 'cyan-5',   desc: 'Receive from another settlement' },
  { key: 'eco-ops',     label: 'Eco-ops',    icon: 'eco',         color: 'green-5',  desc: 'Self-reported community activity (not independently verified)' },
]

const eligiblePresets = computed(() =>
  Object.entries(ITEM_MESH_PRESETS).filter(([, p]) => p.acquiredBy.includes(acquireType.value))
)

const acquireBusy  = ref(false)
const acquireError = ref('')

function resetAcquire() {
  acquireOpen.value  = false
  acquireStep.value  = 1
  acquirePreset.value = ''
  redeemCode.value   = ''
  redeemError.value  = ''
  acquireError.value = ''
}

/**
 * Charges a real construction cost when signed in (see rewards.ts's
 * debitConstruction — debt-permissive by design, never blocks the build).
 * Anonymous settlers keep today's untracked-cost behavior, matching every
 * other rewards.ts action, which also no-ops without a signed-in member —
 * there's no ledger to charge against without one.
 */
async function chargeConstruction(meshPreset: string): Promise<boolean> {
  if (!member.isSignedIn) return true
  const ok = await rewards.debitConstruction(meshPreset)
  if (!ok) acquireError.value = rewards.error || 'Could not charge this build — try again.'
  return ok
}

async function doAcquire() {
  if (!acquirePreset.value || acquireBusy.value) return
  const preset = ITEM_MESH_PRESETS[acquirePreset.value]!
  // Creative presets (e.g. Art Sphere) design their content in the voxel builder
  // instead of getting added instantly — the charge (if any) happens on save there.
  if (preset.requiresBuilder) {
    openVoxelBuilderForAcquire()
    return
  }
  acquireBusy.value = true
  acquireError.value = ''
  try {
    if (acquireType.value === 'constructed' && !(await chargeConstruction(acquirePreset.value))) return
    addItem({
      type:     acquireType.value,
      meshPreset: acquirePreset.value,
      zone:     acquireZone.value || preset.zoneDefault,
      buildCost: preset.buildCost,
    })
    resetAcquire()
  } finally {
    acquireBusy.value = false
  }
}

// ── Voxel sculpture builder ────────────────────────────────────────────────────
// Handles both "acquiring a new requiresBuilder item" (target id null, uses the
// acquire dialog's already-chosen type/preset/zone) and "editing an existing
// item's sculpture" (target id set, just patches item.voxels).

const voxelBuilderOpen    = ref(false)
const voxelBuilderInitial = ref<VoxelPayload | undefined>(undefined)
const voxelBuilderTarget  = ref<string | null>(null)

function requiresBuilder(item: SettlementItem): boolean {
  return !!ITEM_MESH_PRESETS[item.meshPreset]?.requiresBuilder
}

function openVoxelBuilderForAcquire() {
  voxelBuilderTarget.value  = null
  voxelBuilderInitial.value = undefined
  acquireOpen.value         = false
  voxelBuilderOpen.value    = true
}

function openVoxelBuilderForEdit(item: SettlementItem) {
  voxelBuilderTarget.value  = item.id
  voxelBuilderInitial.value = item.voxels
  voxelBuilderOpen.value    = true
}

async function onVoxelBuilderSave(payload: VoxelPayload) {
  if (voxelBuilderTarget.value) {
    updateItem(voxelBuilderTarget.value, { voxels: payload })
    voxelBuilderTarget.value = null
    return
  }
  if (!acquirePreset.value) return
  acquireBusy.value = true
  acquireError.value = ''
  try {
    const preset = ITEM_MESH_PRESETS[acquirePreset.value]!
    if (acquireType.value === 'constructed' && !(await chargeConstruction(acquirePreset.value))) {
      acquireOpen.value = true   // surface the charge failure back on the acquire dialog
      return
    }
    addItem({
      type:       acquireType.value,
      meshPreset: acquirePreset.value,
      zone:       acquireZone.value || preset.zoneDefault,
      buildCost:  preset.buildCost,
      voxels:     payload,
    })
    resetAcquire()
  } finally {
    acquireBusy.value = false
  }
}

// ── Design controls (recolour / re-zone) ──────────────────────────────────────

const editingId = ref<string | null>(null)

function onColorInput(id: string, ev: Event) {
  updateItem(id, { color: (ev.target as HTMLInputElement).value })
}

function onZoneChange(id: string, ev: Event) {
  updateItem(id, { zone: (ev.target as HTMLSelectElement).value as ItemZone })
}

// ── Theme packs ───────────────────────────────────────────────────────────────

const THEME_PACK_LIST = Object.values(THEME_PACKS)

const themeOpen = ref(false)
const themePack = ref<string>('')

function closeTheme() {
  themeOpen.value = false
  themePack.value = ''
}

const themeBusy = ref(false)

/** Charges each item in the pack in turn — one settlement can afford a
 *  cheap pack while going into debt on an expensive one, same as picking
 *  items individually would. Stops (and keeps whatever was already added)
 *  if a charge fails partway through, rather than silently free-ing the rest. */
async function doApplyTheme() {
  const pack = THEME_PACKS[themePack.value]
  if (!pack || themeBusy.value) return
  themeBusy.value = true
  acquireError.value = ''
  try {
    for (let i = 0; i < pack.items.length; i++) {
      const entry = pack.items[i]!
      if (!(await chargeConstruction(entry.meshPreset))) return
      addItem({
        type:       'constructed',
        meshPreset: entry.meshPreset,
        zone:       entry.zone,
        color:      themePackItemColorHex(props.settlementKey, i),
      })
    }
    closeTheme()
  } finally {
    themeBusy.value = false
  }
}

// ── Share / redeem a design ───────────────────────────────────────────────────
// Peer-to-peer only: a copyable code, carrying attribution. No price, no ledger.

const shareOpen    = ref(false)
const shareItem    = ref<SettlementItem | null>(null)
const designerName = ref('')
const copied       = ref(false)

/** Items attesting real-world work aren't shareable — see ITEM_MESH_PRESETS. */
function canShare(item: SettlementItem): boolean {
  return ITEM_MESH_PRESETS[item.meshPreset]?.acquiredBy.includes('traded') ?? false
}

const shareCode = computed(() =>
  shareItem.value
    ? exportItemGiftCode(shareItem.value, props.settlementKey, designerName.value.trim() || undefined)
    : ''
)

function openShare(item: SettlementItem) {
  shareItem.value    = item
  designerName.value = ''
  copied.value       = false
  shareOpen.value    = true
}

async function copyShareCode() {
  try {
    await navigator.clipboard.writeText(shareCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch {
    // Clipboard blocked (insecure context / denied) — the code stays selectable.
  }
}

const redeemCode  = ref('')
const redeemError = ref('')

function doRedeem() {
  const decoded = importItemGiftCode(redeemCode.value)
  if (!decoded) {
    redeemError.value = 'That code could not be read. Check it was copied in full.'
    return
  }
  if (decoded.donorKey === props.settlementKey) {
    redeemError.value = 'That design was shared from this settlement.'
    return
  }
  addItem({
    type:           'traded',
    meshPreset:     decoded.meshPreset,
    zone:           decoded.zone,
    color:          decoded.color,
    donorKey:       decoded.donorKey,
    donorStarColor: decoded.donorStarColor,
    ...(decoded.donorName ? { donorName: decoded.donorName } : {}),
    ...(decoded.voxels ? { voxels: decoded.voxels } : {}),
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
.si-type--reward      { background: rgba(180, 140, 0, 0.22);  color: rgba(255, 215, 110, 0.85); }

.si-provenance { font-size: 8px; color: rgba(100, 160, 200, 0.55); display: flex; align-items: center; gap: 2px; }

.si-item-actions { display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; }

/* Per-item design controls */
.si-edit {
  margin-top: 6px; padding: 6px 7px;
  background: rgba(0, 20, 45, 0.55);
  border: 1px solid rgba(0, 90, 140, 0.25);
  border-radius: 4px;
  display: flex; flex-direction: column; gap: 5px;
}
.si-edit-row { display: flex; align-items: center; gap: 6px; }
.si-edit-label {
  font-size: 8px; letter-spacing: 0.08em; color: rgba(100, 160, 200, 0.70);
  width: 38px; flex-shrink: 0;
}
.si-color-input {
  width: 34px; height: 20px; padding: 0; cursor: pointer;
  background: transparent; border: 1px solid rgba(0, 100, 150, 0.35); border-radius: 3px;
}
.si-zone-select {
  flex: 1; min-width: 0;
  font-size: 9px; padding: 2px 4px; border-radius: 3px;
  background: rgba(0, 20, 45, 0.85); color: rgba(150, 200, 230, 0.85);
  border: 1px solid rgba(0, 90, 140, 0.30);
}
.si-share-btn {
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; padding: 4px 6px; border-radius: 3px; cursor: pointer;
  background: rgba(0, 70, 110, 0.35); border: 1px solid rgba(0, 130, 180, 0.30);
  color: rgba(120, 200, 235, 0.85);
}
.si-share-btn:hover { background: rgba(0, 100, 150, 0.45); color: #00ccee; }
.si-share-note { font-size: 8px; color: rgba(90, 130, 160, 0.60); line-height: 1.35; }

/* Footer */
.si-footer {
  padding: 7px 10px;
  border-top: 1px solid rgba(0, 60, 100, 0.20);
  flex-shrink: 0;
  display: flex; flex-wrap: wrap; gap: 2px;
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

/* Theme packs */
.si-theme-intro { font-size: 9px; color: rgba(100, 150, 180, 0.70); line-height: 1.45; margin-bottom: 8px; }
.si-theme-dots { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; margin-top: 2px; }
.si-theme-dot  { width: 9px; height: 9px; border-radius: 50%; }

/* Redeem / share codes */
.si-redeem {
  margin-top: 12px; padding-top: 10px;
  border-top: 1px solid rgba(0, 70, 110, 0.25);
}
.si-redeem-hint { font-size: 8.5px; color: rgba(90, 135, 165, 0.65); line-height: 1.4; margin-bottom: 5px; }
.si-redeem-input {
  width: 100%; resize: vertical;
  font-size: 9px; font-family: monospace; line-height: 1.4;
  padding: 5px 6px; border-radius: 3px;
  background: rgba(0, 12, 30, 0.85); color: rgba(150, 200, 230, 0.90);
  border: 1px solid rgba(0, 90, 140, 0.30);
}
.si-redeem-input:focus { outline: none; border-color: rgba(0, 160, 210, 0.55); }
.si-code-out { color: rgba(120, 200, 235, 0.75); }
.si-redeem-error { font-size: 8.5px; color: rgba(255, 120, 120, 0.85); margin-top: 4px; }

/* Construction balance / debt indicator */
.si-balance {
  display: flex; align-items: center; flex-wrap: wrap; gap: 3px;
  font-size: 9px; color: rgba(150, 200, 230, 0.75);
  background: rgba(0, 30, 60, 0.45); border: 1px solid rgba(0, 90, 140, 0.25);
  border-radius: 4px; padding: 6px 8px; margin-bottom: 8px;
}
.si-balance--debt { color: rgba(255, 190, 130, 0.90); border-color: rgba(255, 150, 60, 0.30); background: rgba(60, 30, 0, 0.35); }
.si-balance-hint { color: inherit; opacity: 0.85; }
.si-balance-link { color: #00ccee; }
.si-acquire-error { font-size: 9px; color: rgba(255, 120, 120, 0.90); padding: 0 16px 8px; }

/* Slide transition */
.si-slide-enter-active, .si-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.si-slide-enter-from, .si-slide-leave-to { transform: translateX(100%) translateY(-50%); opacity: 0; }
</style>
