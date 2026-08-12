<template>
  <q-page padding class="bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 q-my-none text-weight-bold row items-center gap-sm">
          <q-icon name="mdi-inbox-arrow-down-outline" color="primary" class="q-mr-xs" />
          Video Suggestions — Review
        </h1>
        <div class="text-caption text-grey-7 q-mt-xs">
          Community-submitted additions to the Eco Ops library (src/pages/EcoLibrary.vue). Approved
          rows merge into the library live for every visitor; nothing is ever written back into
          public/ot6a.json itself.
        </div>
      </div>
      <div>
        <q-btn-toggle
          v-model="statusFilter"
          class="q-mr-sm"
          toggle-color="primary"
          :options="[
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ]"
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
      >
        <template v-slot:top-right>
          <q-input v-model="filter" outlined dense debounce="300" placeholder="Search title, area..." style="width: 300px;">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-title="props">
          <q-td :props="props">
            <a :href="`https://www.youtube.com/watch?v=${props.row.youtube_id}`" target="_blank" rel="noopener">{{ props.value }}</a>
            <div v-if="props.row.note" class="text-caption text-grey-7">{{ props.row.note }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <template v-if="props.row.status === 'pending'">
              <q-btn dense flat size="sm" color="positive" label="Approve" @click="review(props.row.id, 'approved')" />
              <q-btn dense flat size="sm" color="negative" label="Reject" @click="review(props.row.id, 'rejected')" />
            </template>
            <template v-else>
              <q-btn dense flat size="sm" color="grey-7" label="Reset to pending" @click="review(props.row.id, 'pending')" />
            </template>
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

interface VideoSuggestionRow {
  id: string; submitted_by: string; area: string; subcat_id: string
  youtube_id: string; title: string; note: string | null
  status: 'pending' | 'approved' | 'rejected'; created_at: string
}

const $q     = useQuasar()
const member = useMemberStore()

const rows          = ref<VideoSuggestionRow[]>([])
const loading         = ref(false)
const filter          = ref('')
const statusFilter    = ref<'pending' | 'approved' | 'rejected'>('pending')

const columns = [
  { name: 'title',      label: 'Title',    field: 'title',    align: 'left' as const, sortable: true },
  { name: 'area',        label: 'Area',    field: 'area',     align: 'left' as const, sortable: true },
  { name: 'subcat_id',   label: 'Section', field: 'subcat_id', align: 'left' as const },
  { name: 'created_at',  label: 'Submitted', field: (r: VideoSuggestionRow) => new Date(r.created_at).toLocaleDateString(), align: 'left' as const, sortable: true },
  { name: 'actions',     label: '',        field: 'id' },
]

async function load() {
  if (!supabase) return
  loading.value = true
  try {
    const { data } = await supabase.from('video_suggestions').select('*')
      .eq('status', statusFilter.value).order('created_at', { ascending: false })
    rows.value = (data as VideoSuggestionRow[]) ?? []
  } finally {
    loading.value = false
  }
}

async function review(id: string, status: 'pending' | 'approved' | 'rejected') {
  if (!supabase || !member.userId) return
  const { error } = await supabase.from('video_suggestions').update({
    status,
    reviewed_at: status === 'pending' ? null : new Date().toISOString(),
    reviewed_by: status === 'pending' ? null : member.userId,
  }).eq('id', id)
  if (!error) {
    $q.notify({ type: 'positive', message: `Marked ${status}` })
    await load()
  } else {
    $q.notify({ type: 'negative', message: 'Update failed — sign in as an admin account' })
  }
}

onMounted(load)
</script>
