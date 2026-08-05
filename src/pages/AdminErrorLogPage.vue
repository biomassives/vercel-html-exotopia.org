<template>
  <q-page padding class="bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 q-my-none text-weight-bold row items-center gap-sm">
          <q-icon name="mdi-bug-outline" color="primary" class="q-mr-xs" />
          App Error Log
        </h1>
        <div class="text-caption text-grey-7 q-mt-xs">
          Client-side Vue/window errors captured by src/boot/error-reporting.ts. Repeats of the same
          error in one browser session bump occurrence_count rather than creating new rows.
        </div>
      </div>
      <div>
        <q-btn-toggle
          v-model="showResolved"
          class="q-mr-sm"
          toggle-color="primary"
          :options="[{ label: 'Unresolved', value: false }, { label: 'All', value: true }]"
          @update:model-value="load"
        />
        <q-btn color="primary" icon="refresh" label="Refresh" :loading="loading" @click="load" outline />
      </div>
    </div>

    <q-card flat bordered class="br-8 shadow-1">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :filter="filter"
        :loading="loading"
        flat
        :pagination="{ rowsPerPage: 25, sortBy: 'last_seen_at', descending: true }"
      >
        <template v-slot:top-right>
          <q-input v-model="filter" outlined dense debounce="300" placeholder="Search message, source..." style="width: 300px;">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-level="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'error' ? 'negative' : 'warning'">{{ props.value }}</q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-message="props">
          <q-td :props="props">
            <div class="ael-message" @click="expanded = expanded === props.row.id ? null : props.row.id">
              {{ props.value }}
              <q-badge v-if="props.row.occurrence_count > 1" color="grey-6" class="q-ml-xs">×{{ props.row.occurrence_count }}</q-badge>
            </div>
            <pre v-if="expanded === props.row.id && props.row.stack" class="ael-stack">{{ props.row.stack }}</pre>
            <div v-if="expanded === props.row.id" class="text-caption text-grey-7 q-mt-xs">{{ props.row.url }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-resolved="props">
          <q-td :props="props">
            <q-badge :color="props.value ? 'positive' : 'grey-5'">{{ props.value ? 'resolved' : 'open' }}</q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn v-if="!props.row.resolved" dense flat size="sm" color="positive" label="Mark resolved"
              @click="resolve(props.row.id)" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'

interface AppErrorLog {
  id: string; message: string; stack: string | null; level: 'error' | 'warn'
  source: string | null; url: string | null; occurrence_count: number
  created_at: string; last_seen_at: string
  resolved: boolean; resolved_at: string | null; resolution_note: string | null
}

const $q     = useQuasar()
const member = useMemberStore()

const rows         = ref<AppErrorLog[]>([])
const loading       = ref(false)
const filter        = ref('')
const showResolved  = ref(false)
const expanded       = ref<string | null>(null)

const columns = [
  { name: 'level',        label: 'Level',   field: 'level',        align: 'left' as const, sortable: true },
  { name: 'message',      label: 'Message', field: 'message',      align: 'left' as const },
  { name: 'source',       label: 'Source',  field: 'source',       align: 'left' as const, sortable: true },
  { name: 'last_seen_at', label: 'Last seen', field: (r: AppErrorLog) => new Date(r.last_seen_at).toLocaleString(), align: 'left' as const, sortable: true },
  { name: 'resolved',     label: 'Status',  field: 'resolved',     align: 'left' as const, sortable: true },
  { name: 'actions',      label: '',        field: 'id' },
]

async function load() {
  if (!supabase) return
  loading.value = true
  try {
    let q = supabase.from('app_error_logs').select('*').order('last_seen_at', { ascending: false }).limit(200)
    if (!showResolved.value) q = q.eq('resolved', false)
    const { data } = await q
    rows.value = (data as AppErrorLog[]) ?? []
  } finally {
    loading.value = false
  }
}

async function resolve(id: string) {
  if (!supabase || !member.userId) return
  const { error } = await supabase.from('app_error_logs').update({
    resolved: true, resolved_at: new Date().toISOString(), resolved_by: member.userId,
  }).eq('id', id)
  if (!error) {
    $q.notify({ type: 'positive', message: 'Marked resolved' })
    await load()
  } else {
    $q.notify({ type: 'negative', message: 'Update failed — sign in as an admin account' })
  }
}

onMounted(load)
</script>

<style scoped>
.ael-message { cursor: pointer; max-width: 480px; white-space: normal; word-break: break-word; }
.ael-stack {
  font-size: 10px; line-height: 1.4; background: #1a1a1a; color: #ddd; padding: 8px 10px;
  border-radius: 4px; margin: 6px 0 0; max-width: 640px; overflow-x: auto; white-space: pre-wrap;
}
</style>
