<template>
  <Teleport to="body">
    <Transition name="pd-fade">
      <div v-if="modelValue" class="pd-overlay">

        <!-- ── Header ─────────────────────────────────────────────────────── -->
        <div class="pd-header">
          <span class="pd-badge">⬡ PARALLEL DIMENSIONS</span>
          <span class="pd-base-label">{{ baseExolocation }}</span>
          <button class="pd-close" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <!-- ── Body ───────────────────────────────────────────────────────── -->
        <div class="pd-body">

          <p class="pd-lede">
            Same location, a different named dimension — cloned from this gallery as a starting
            point, free to diverge from there. Only settlements you own can be forked.
          </p>

          <!-- ── Existing dimensions ─────────────────────────────────────── -->
          <div class="pd-section-label">This gallery's dimensions</div>
          <div class="pd-list">
            <div v-if="rows.length === 0" class="pd-empty">
              <q-icon name="mdi-hexagon-outline" size="20px" class="q-mb-xs" />
              <div>No parallel dimensions yet — create the first one below.</div>
            </div>
            <button v-for="row in rows" :key="row.key" class="pd-row"
              :class="{ 'pd-row--current': row.key === currentKey }"
              @click="visit(row)">
              <div class="pd-row-dot" :class="`pd-row-dot--${row.isBase ? 'base' : row.branchType}`" />
              <div class="pd-row-body">
                <div class="pd-row-label">
                  {{ row.label }}
                  <span v-if="row.key === currentKey" class="pd-here-chip">HERE</span>
                </div>
                <div class="pd-row-meta">
                  <span class="pd-type-chip">{{ row.isBase ? 'base' : row.branchType }}</span>
                  <span v-if="row.divergenceNote" class="pd-sub-chip">{{ row.divergenceNote }}</span>
                </div>
              </div>
              <q-icon name="chevron_right" size="14px" class="pd-row-arrow" />
            </button>
          </div>

          <!-- ── Create new ───────────────────────────────────────────────── -->
          <div class="pd-section-label q-mt-md">Create a parallel dimension</div>

          <div v-if="!sourceSettlement" class="pd-empty pd-empty--blocked">
            <q-icon name="lock_outline" size="20px" class="q-mb-xs" />
            <div>Claim this settlement first — a dimension needs something real to fork from.</div>
          </div>

          <div v-else class="pd-create-form">
            <input v-model="newName" class="pd-input" placeholder="Dimension name — e.g. Aspire 2030" />
            <div class="pd-type-row">
              <button v-for="t in BRANCH_TYPES" :key="t.key" class="pd-type-pip"
                :class="{ 'pd-type-pip--active': newType === t.key }"
                @click="newType = t.key">
                {{ t.label }}
              </button>
            </div>
            <textarea v-model="newNote" class="pd-textarea" rows="2"
              placeholder="How does this dimension diverge from here? (optional)" />
            <div class="pd-create-row">
              <span v-if="newBranchId" class="pd-preview">{{ newBranchId }}</span>
              <span v-if="createError" class="pd-error">{{ createError }}</span>
              <q-btn dense unelevated size="sm" color="deep-purple-8" text-color="purple-2"
                icon="mdi-hexagon-multiple" label="Fork this gallery"
                :disable="!newName.trim()" @click="createBranch" />
            </div>
          </div>

        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettlements, forkSettlement, type BranchType, type SettlementRecord } from 'src/lib/settlements'

const props = defineProps<{
  modelValue:      boolean
  baseKey:         string
  baseExolocation: string
  hostname:        string
  planetName:      string
  currentKey:      string
  currentBranchId: string | null
}>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const router      = useRouter()
const settlements = useSettlements()

const sourceSettlement = computed<SettlementRecord | undefined>(() => settlements.getSettlement(props.baseKey))

// ── Existing dimensions list — the base settlement (if it exists) plus every
// branch whose baseKey points back to it. ────────────────────────────────────

interface Row {
  key: string
  label: string
  isBase: boolean
  branchType?: BranchType
  divergenceNote?: string
}

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  if (sourceSettlement.value) {
    out.push({ key: sourceSettlement.value.key, label: sourceSettlement.value.displayName, isBase: true })
  }
  for (const r of settlements.settlements.value) {
    if (r.type === 'branch' && r.baseKey === props.baseKey) {
      out.push({ key: r.key, label: r.displayName, isBase: false, branchType: r.branchType, divergenceNote: r.divergenceNote })
    }
  }
  return out
})

function visit(row: Row) {
  const branchId = row.isBase ? '' : settlements.getSettlement(row.key)?.branchId ?? ''
  const query = branchId ? `?branch=${encodeURIComponent(branchId)}` : ''
  void router.push(`/surface/${encodeURIComponent(props.hostname)}/${encodeURIComponent(props.planetName)}/gallery${query}`)
}

// ── Create form ──────────────────────────────────────────────────────────────

const BRANCH_TYPES: { key: BranchType; label: string }[] = [
  { key: 'private',     label: 'Private' },
  { key: 'public',      label: 'Public' },
  { key: 'branded',     label: 'Branded' },
  { key: 'research',    label: 'Research' },
  { key: 'educational', label: 'Educational' },
]

const newName  = ref('')
const newType  = ref<BranchType>('private')
const newNote  = ref('')
const createError = ref('')

/** Slugifies the free-text name into a bare designation — lowercase, hyphens, no ':'. */
const newBranchId = computed(() => newName.value.trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, ''))

function createBranch() {
  createError.value = ''
  const source = sourceSettlement.value
  if (!source) { createError.value = 'No settlement to fork from.'; return }

  // Captured before clearing the form below — newBranchId is a computed
  // derived from newName, so it would read back empty if read after reset.
  const branchId = newBranchId.value
  if (!branchId) { createError.value = 'Give this dimension a name.'; return }

  const candidateKey = `branch:${branchId}:${props.baseKey}`
  if (settlements.hasSettlement(candidateKey)) {
    createError.value = 'A dimension with that name already exists here.'
    return
  }

  const branch = forkSettlement(source, branchId, newType.value, newNote.value.trim() || undefined)
  settlements.addSettlement(branch)

  newName.value = ''
  newNote.value = ''
  void router.push(
    `/surface/${encodeURIComponent(props.hostname)}/${encodeURIComponent(props.planetName)}/gallery?branch=${encodeURIComponent(branchId)}`
  )
}
</script>

<style scoped>
/* ── Overlay shell — same pattern as FileCabinetOverlay.vue's .fc-overlay ───── */

.pd-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(5, 0, 12, 0.96);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  font-family: 'Courier New', monospace;
}

.pd-fade-enter-active { transition: opacity 0.22s ease; }
.pd-fade-leave-active  { transition: opacity 0.16s ease; }
.pd-fade-enter-from,
.pd-fade-leave-to      { opacity: 0; }

.pd-header {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(180, 130, 255, 0.16);
  flex-shrink: 0;
}
.pd-badge {
  font-size: 9px; letter-spacing: 0.14em;
  color: rgba(210, 170, 255, 0.85);
  background: rgba(70, 20, 120, 0.32);
  border: 1px solid rgba(160, 100, 220, 0.35);
  border-radius: 3px; padding: 2px 7px;
}
.pd-base-label { font-size: 9.5px; color: rgba(180, 150, 210, 0.55); margin-left: auto; }
.pd-close {
  background: none; border: 1px solid rgba(150, 120, 180, 0.30);
  color: rgba(170, 140, 200, 0.70); width: 26px; height: 26px;
  border-radius: 4px; cursor: pointer; font-size: 12px;
  transition: color 0.12s, border-color 0.12s;
}
.pd-close:hover { color: #ff6666; border-color: rgba(200, 80, 80, 0.45); }

.pd-body { flex: 1; overflow-y: auto; padding: 18px 24px 28px; max-width: 640px; margin: 0 auto; width: 100%; }
.pd-lede { font-size: 11px; line-height: 1.6; color: rgba(200, 180, 220, 0.65); margin: 0 0 18px; }

.pd-section-label {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(180, 150, 210, 0.55); margin-bottom: 8px;
}

.pd-list { display: flex; flex-direction: column; gap: 2px; }
.pd-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 28px 12px; text-align: center; color: rgba(160, 140, 180, 0.55); font-size: 11px;
  border: 1px dashed rgba(150, 120, 180, 0.20); border-radius: 6px;
}
.pd-empty--blocked { color: rgba(200, 150, 150, 0.65); }

.pd-row {
  display: flex; align-items: center; gap: 10px;
  width: 100%; text-align: left;
  padding: 9px 8px; border-radius: 4px;
  background: none; border: 1px solid transparent;
  cursor: pointer; font-family: inherit;
}
.pd-row:hover { background: rgba(140, 90, 220, 0.08); }
.pd-row--current { border-color: rgba(180, 130, 255, 0.35); background: rgba(140, 90, 220, 0.10); }

.pd-row-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.pd-row-dot--base       { background: rgba(0, 229, 255, 0.65); }
.pd-row-dot--private    { background: rgba(200, 150, 255, 0.65); }
.pd-row-dot--public     { background: rgba(120, 220, 150, 0.65); }
.pd-row-dot--branded    { background: rgba(255, 190, 100, 0.65); }
.pd-row-dot--research   { background: rgba(100, 180, 255, 0.65); }
.pd-row-dot--educational{ background: rgba(220, 180, 100, 0.65); }

.pd-row-body { flex: 1; min-width: 0; }
.pd-row-label { font-size: 11.5px; color: rgba(230, 220, 240, 0.92); display: flex; align-items: center; gap: 7px; }
.pd-here-chip {
  font-size: 7.5px; letter-spacing: 0.08em; padding: 1px 5px; border-radius: 8px;
  background: rgba(140, 90, 220, 0.30); color: rgba(220, 200, 255, 0.90);
}
.pd-row-meta { display: flex; gap: 5px; margin-top: 3px; flex-wrap: wrap; }
.pd-type-chip {
  font-size: 8px; padding: 1px 6px; border-radius: 2px; letter-spacing: 0.06em;
  background: rgba(70, 20, 120, 0.28); color: rgba(210, 170, 255, 0.80);
}
.pd-sub-chip { font-size: 8.5px; color: rgba(170, 150, 190, 0.55); }
.pd-row-arrow { color: rgba(150, 120, 180, 0.40); flex-shrink: 0; }

.pd-create-form { display: flex; flex-direction: column; gap: 8px; }
.pd-input, .pd-textarea {
  font-family: inherit; font-size: 11px;
  padding: 7px 10px; border-radius: 4px;
  background: rgba(15, 5, 25, 0.70); color: rgba(230, 215, 245, 0.90);
  border: 1px solid rgba(160, 100, 220, 0.25);
  resize: vertical;
}
.pd-input:focus, .pd-textarea:focus { outline: none; border-color: rgba(190, 140, 255, 0.55); }

.pd-type-row { display: flex; gap: 5px; flex-wrap: wrap; }
.pd-type-pip {
  font-size: 9.5px; padding: 4px 10px; border-radius: 10px;
  background: none; border: 1px solid rgba(150, 120, 180, 0.25);
  color: rgba(180, 160, 200, 0.65); cursor: pointer; font-family: inherit;
}
.pd-type-pip--active {
  color: rgba(220, 200, 255, 0.95);
  border-color: rgba(190, 140, 255, 0.55);
  background: rgba(140, 90, 220, 0.20);
}

.pd-create-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.pd-preview { font-size: 9.5px; color: rgba(150, 130, 180, 0.55); flex: 1; }
.pd-error { font-size: 9.5px; color: rgba(255, 130, 130, 0.85); }
</style>
