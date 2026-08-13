<template>
  <q-page padding class="bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 q-my-none text-weight-bold row items-center gap-sm">
          <q-icon name="storefront" color="primary" class="q-mr-xs" />
          Community Nodes — Moderation
        </h1>
        <div class="text-caption text-grey-7 q-mt-xs">
          Business listings, business locations, and creative pages across every owner. Publish is
          self-service; this view is for taking down abuse/spam and restoring wrongly-flagged nodes.
        </div>
      </div>
      <q-btn color="primary" icon="refresh" label="Refresh" :loading="loading" @click="load" outline />
    </div>

    <q-card flat bordered class="br-8 shadow-1">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :filter="filter"
        :loading="loading"
        :grid="$q.screen.lt.sm"
        flat
      >
        <template v-slot:top-right>
          <q-input v-model="filter" outlined dense debounce="300" placeholder="Search title, type, owner..." style="width: 300px; max-width: 100%;">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="STATUS_COLOR[props.value as string]">{{ props.value }}</q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn v-if="props.row.status !== 'archived'" dense flat size="sm" color="negative" label="Archive"
              @click="setStatus(props.row.id, 'archived')" />
            <q-btn v-else dense flat size="sm" color="positive" label="Restore"
              @click="setStatus(props.row.id, 'published')" />
          </q-td>
        </template>

        <!-- grid-mode card layout for small screens (q-table's built-in fallback) -->
        <template v-slot:item="props">
          <q-card flat bordered class="q-ma-xs col-12">
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="text-weight-bold">{{ props.row.title }}</div>
                <q-badge :color="STATUS_COLOR[props.row.status]">{{ props.row.status }}</q-badge>
              </div>
              <div class="text-caption text-grey-7">{{ props.row.node_type }}</div>
              <div class="text-caption text-grey-6">owner: {{ props.row.owner_id }}</div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn v-if="props.row.status !== 'archived'" dense flat size="sm" color="negative" label="Archive"
                @click="setStatus(props.row.id, 'archived')" />
              <q-btn v-else dense flat size="sm" color="positive" label="Restore"
                @click="setStatus(props.row.id, 'published')" />
            </q-card-actions>
          </q-card>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useCommunityNodesStore, type CommunityNode } from 'src/stores/community-nodes'

const $q    = useQuasar()
const store = useCommunityNodesStore()

const rows    = ref<CommunityNode[]>([])
const loading = ref(false)
const filter  = ref('')

const STATUS_COLOR: Record<string, string> = { draft: 'grey', published: 'positive', archived: 'negative' }

const columns = [
  { name: 'title',     label: 'Title',     field: 'title',     align: 'left' as const, sortable: true },
  { name: 'node_type', label: 'Type',      field: 'node_type', align: 'left' as const, sortable: true },
  { name: 'owner_id',  label: 'Owner',     field: 'owner_id',  align: 'left' as const },
  { name: 'status',    label: 'Status',    field: 'status',    align: 'left' as const, sortable: true },
  { name: 'created_at',label: 'Created',   field: (r: CommunityNode) => new Date(r.created_at).toLocaleDateString(), align: 'left' as const, sortable: true },
  { name: 'actions',   label: '',          field: 'id' },
]

async function load() {
  loading.value = true
  try { rows.value = await store.fetchAllNodesForAdmin() } finally { loading.value = false }
}

async function setStatus(id: string, status: 'published' | 'archived') {
  const ok = await store.setNodeStatusAsAdmin(id, status)
  if (ok) {
    $q.notify({ type: 'positive', message: `Node ${status}` })
    await load()
  } else {
    $q.notify({ type: 'negative', message: 'Update failed' })
  }
}

onMounted(load)
</script>

<style scoped>
/* See AdminSettlementProfilesPage.vue's identical rule for why this is
 * needed: global dark theme (quasar.config.js) + this page's light
 * bg-grey-1 background otherwise renders white-on-near-white text,
 * confirmed via getComputedStyle during review of the sibling page. */
.q-page { color: rgba(0, 0, 0, 0.87); }
</style>
