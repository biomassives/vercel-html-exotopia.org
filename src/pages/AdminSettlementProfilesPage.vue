<template>
  <q-page padding class="bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 q-my-none text-weight-bold row items-center gap-sm">
          <q-icon name="cottage" color="primary" class="q-mr-xs" />
          Settlement Profiles — Moderation
        </h1>
        <div class="text-caption text-grey-7 q-mt-xs">
          Public settlement pages (/settlement/:slug), self-published, rate-limited 3/24h per owner.
          This view is for taking down abuse/spam and restoring wrongly-flagged profiles — same
          shape as Community Nodes moderation.
        </div>
      </div>
      <q-btn color="primary" icon="refresh" label="Refresh" :loading="loading" @click="load" outline />
    </div>

    <q-card flat bordered class="br-8 shadow-1 q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label>Auto-sync actions taken offline</q-item-label>
          <q-item-label caption>
            Off (default): an archive/restore attempted while offline just fails, and is logged locally
            as "failed" for you to retry by hand. On: the same attempt is queued by the service worker
            and applied automatically once connectivity returns — logged locally as "queued" in the
            meantime. Either way, every attempt is recorded below before the network call, so nothing
            you click can silently disappear.
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="autosync" color="primary" @update:model-value="onToggleAutosync" />
        </q-item-section>
      </q-item>
    </q-card>

    <q-card flat bordered class="br-8 shadow-1">
      <q-table
        :rows="rowsWithDuplicateFlag"
        :columns="columns"
        row-key="id"
        :filter="filter"
        :loading="loading"
        :grid="$q.screen.lt.sm"
        flat
      >
        <template v-slot:top-right>
          <q-input v-model="filter" outlined dense debounce="300" placeholder="Search title, focus, owner..." style="width: 300px; max-width: 100%;">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="STATUS_COLOR[props.value as string]">{{ props.value }}</q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-duplicate="props">
          <q-td :props="props">
            <q-badge v-if="props.row.dupScore > DUP_THRESHOLD" color="warning" class="cursor-help">
              possible dup — {{ Math.round(props.row.dupScore * 100) }}%
              <q-tooltip>Similar to "{{ props.row.dupWith }}" ({{ Math.round(props.row.dupScore * 100) }}% match on
                focus, tech keys, name, and location). A hint for review, not an automatic call.</q-tooltip>
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn v-if="props.row.status !== 'archived'" dense flat size="sm" color="negative" label="Archive"
              @click="setStatus(props.row.id, 'archived', props.row.display_name)" />
            <q-btn v-else dense flat size="sm" color="positive" label="Restore"
              @click="setStatus(props.row.id, 'published', props.row.display_name)" />
          </q-td>
        </template>

        <!-- grid-mode card layout for small screens (q-table's built-in fallback) -->
        <template v-slot:item="props">
          <q-card flat bordered class="q-ma-xs col-12">
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="text-weight-bold">{{ props.row.display_name }}</div>
                <q-badge :color="STATUS_COLOR[props.row.status]">{{ props.row.status }}</q-badge>
              </div>
              <div class="text-caption text-grey-7">{{ props.row.focus }} · {{ props.row.exolocation }}</div>
              <div class="text-caption text-grey-6">owner: {{ props.row.owner_id }}</div>
              <q-badge v-if="props.row.dupScore > DUP_THRESHOLD" color="warning" class="q-mt-xs">
                possible dup — {{ Math.round(props.row.dupScore * 100) }}% match ("{{ props.row.dupWith }}")
              </q-badge>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn v-if="props.row.status !== 'archived'" dense flat size="sm" color="negative" label="Archive"
                @click="setStatus(props.row.id, 'archived', props.row.display_name)" />
              <q-btn v-else dense flat size="sm" color="positive" label="Restore"
                @click="setStatus(props.row.id, 'published', props.row.display_name)" />
            </q-card-actions>
          </q-card>
        </template>
      </q-table>
    </q-card>

    <q-card flat bordered class="br-8 shadow-1 q-mt-md">
      <q-item>
        <q-item-section>
          <q-item-label>Local audit trail</q-item-label>
          <q-item-label caption>
            Every archive/restore attempt from this browser, most recent first. Not synced anywhere —
            this device's own record of what was clicked and what happened to it.
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-list separator>
        <q-item v-for="entry in modLog" :key="entry.id">
          <q-item-section>
            <q-item-label>{{ entry.targetLabel }} → <strong>{{ entry.toStatus }}</strong></q-item-label>
            <q-item-label caption>{{ new Date(entry.at).toLocaleString() }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="OUTCOME_COLOR[entry.outcome]">{{ entry.outcome }}</q-badge>
          </q-item-section>
          <q-item-section side v-if="entry.outcome === 'failed'">
            <q-btn dense flat size="sm" label="Retry" color="primary"
              @click="setStatus(entry.targetId, entry.toStatus as SettlementProfileStatus, entry.targetLabel)" />
          </q-item-section>
        </q-item>
        <q-item v-if="!modLog.length">
          <q-item-section class="text-grey-6">No actions taken yet in this browser.</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useSettlementProfilesStore, type SettlementProfile, type SettlementProfileStatus } from 'src/stores/settlement-profiles'
import { nearestProfiles } from 'src/lib/settlement-profile-similarity'
import { listModLog, type AdminModEntry } from 'src/lib/admin-mod-log'

const $q    = useQuasar()
const store = useSettlementProfilesStore()

const rows    = ref<SettlementProfile[]>([])
const loading = ref(false)
const filter  = ref('')
const modLog  = ref<AdminModEntry[]>([])
const autosync = ref(store.autosyncEnabled)

const DUP_THRESHOLD = 0.55

const STATUS_COLOR: Record<string, string> = { published: 'positive', archived: 'negative' }
const OUTCOME_COLOR: Record<AdminModEntry['outcome'], string> = { applied: 'positive', queued: 'warning', failed: 'negative' }

const columns = [
  { name: 'display_name', label: 'Name',      field: 'display_name', align: 'left' as const, sortable: true },
  { name: 'focus',        label: 'Focus',     field: 'focus',        align: 'left' as const, sortable: true },
  { name: 'owner_id',     label: 'Owner',     field: 'owner_id',     align: 'left' as const },
  { name: 'status',       label: 'Status',    field: 'status',       align: 'left' as const, sortable: true },
  { name: 'duplicate',    label: '',          field: 'dupScore' },
  { name: 'created_at',   label: 'Created',   field: (r: SettlementProfile) => new Date(r.created_at).toLocaleDateString(), align: 'left' as const, sortable: true },
  { name: 'actions',      label: '',          field: 'id' },
]

// Duplicate-candidate flag per row, computed against the other currently-loaded rows.
// O(n²) — fine at admin-console scale; see settlement-profile-similarity.ts's header
// for why this isn't a single Euclidean encoding of the whole row.
const rowsWithDuplicateFlag = computed(() => rows.value.map(r => {
  const best = nearestProfiles(r, rows.value, 1)[0]
  return { ...r, dupScore: best?.score ?? 0, dupWith: best?.candidate.display_name ?? null }
}))

async function load() {
  loading.value = true
  try { rows.value = await store.fetchAllProfilesForAdmin() } finally { loading.value = false }
  modLog.value = listModLog()
}

function onToggleAutosync(v: boolean) {
  store.setAutosyncEnabled(v)
}

async function setStatus(id: string, status: SettlementProfileStatus, label: string) {
  const result = await store.setProfileStatusAsAdmin(id, status, label)
  if (result.ok) {
    $q.notify({ type: 'positive', message: `Profile ${status}` })
  } else if (result.queued) {
    $q.notify({ type: 'warning', message: 'Offline — queued, will apply once connectivity returns' })
  } else {
    $q.notify({ type: 'negative', message: 'Update failed' })
  }
  await load()
}

onMounted(load)
</script>

<style scoped>
/*
 * The app runs Quasar with a global dark theme (quasar.config.js), which
 * sets body--dark's text color to white — inherited by every unstyled
 * element on the page regardless of that element's own background. This
 * page opts into a light bg-grey-1 background, so without this override
 * every unstyled default (h1, q-table headers/cells, captions) renders
 * white-on-near-white and is functionally invisible. Confirmed via
 * getComputedStyle during review: h1/td/th all computed rgb(255,255,255)
 * against a rgb(250,250,250) background. A q-page `:dark="false"` prop does
 * NOT fix this — QPage has no such prop, it silently becomes a no-op DOM
 * attribute — the actual fix has to re-set `color` here, closer to the text
 * than body--dark's inherited value. rgba(0,0,0,.87) matches Quasar's own
 * light-mode text convention. Same issue and fix applies to
 * AdminNodesPage.vue, which has the identical bg-grey-1-on-dark-theme setup.
 */
.q-page { color: rgba(0, 0, 0, 0.87); }
</style>
