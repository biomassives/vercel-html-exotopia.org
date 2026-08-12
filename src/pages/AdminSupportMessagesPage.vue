<template>
  <q-page padding class="bg-grey-1">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 q-my-none text-weight-bold row items-center gap-sm">
          <q-icon name="mdi-email-outline" color="primary" class="q-mr-xs" />
          Support Messages — Review
        </h1>
        <div class="text-caption text-grey-7 q-mt-xs">
          Submissions from the site contact form (src/pages/SiteContactPage.vue), inserted by the
          workers/support-inbox Cloudflare Worker. Submitters already received an auto-reply —
          this queue is for the actual human follow-up.
        </div>
      </div>
      <div>
        <q-btn-toggle
          v-model="statusFilter"
          class="q-mr-sm"
          toggle-color="primary"
          :options="[
            { label: 'New', value: 'new' },
            { label: 'In progress', value: 'in_progress' },
            { label: 'Resolved', value: 'resolved' },
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
          <q-input v-model="filter" outlined dense debounce="300" placeholder="Search name, email, subject..." style="width: 300px;">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-message_type="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'bug' ? 'negative' : 'primary'" outline>{{ props.value }}</q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-from="props">
          <q-td :props="props">
            <div>{{ props.row.name }}</div>
            <a :href="`mailto:${props.row.email}`" class="text-caption text-grey-7">{{ props.row.email }}</a>
          </q-td>
        </template>

        <template v-slot:body-cell-message="props">
          <q-td :props="props">
            <div v-if="props.row.subject" class="text-weight-medium">{{ props.row.subject }}</div>
            <div class="text-caption text-grey-7 sm-message-body">{{ props.row.body }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <template v-if="props.row.status === 'new'">
              <q-btn dense flat size="sm" color="primary" label="In progress" @click="setStatus(props.row.id, 'in_progress')" />
              <q-btn dense flat size="sm" color="positive" label="Resolve" @click="setStatus(props.row.id, 'resolved')" />
            </template>
            <template v-else-if="props.row.status === 'in_progress'">
              <q-btn dense flat size="sm" color="positive" label="Resolve" @click="setStatus(props.row.id, 'resolved')" />
              <q-btn dense flat size="sm" color="grey-7" label="Reset" @click="setStatus(props.row.id, 'new')" />
            </template>
            <template v-else>
              <q-btn dense flat size="sm" color="grey-7" label="Reopen" @click="setStatus(props.row.id, 'new')" />
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

interface SupportMessageRow {
  id: string
  message_type: 'bug' | 'support' | 'partnership' | 'press' | 'general'
  name: string
  email: string
  subject: string | null
  body: string
  status: 'new' | 'in_progress' | 'resolved'
  created_at: string
}

const $q     = useQuasar()
const member = useMemberStore()

const rows       = ref<SupportMessageRow[]>([])
const loading      = ref(false)
const filter        = ref('')
const statusFilter  = ref<'new' | 'in_progress' | 'resolved'>('new')

const columns = [
  { name: 'message_type', label: 'Type',    field: 'message_type', align: 'left' as const, sortable: true },
  { name: 'from',         label: 'From',    field: 'name',         align: 'left' as const },
  { name: 'message',      label: 'Message', field: 'body',         align: 'left' as const },
  { name: 'created_at',   label: 'Received', field: (r: SupportMessageRow) => new Date(r.created_at).toLocaleString(), align: 'left' as const, sortable: true },
  { name: 'actions',      label: '',        field: 'id' },
]

async function load() {
  if (!supabase) return
  loading.value = true
  try {
    const { data } = await supabase.from('support_messages').select('*')
      .eq('status', statusFilter.value).order('created_at', { ascending: false })
    rows.value = (data as SupportMessageRow[]) ?? []
  } finally {
    loading.value = false
  }
}

async function setStatus(id: string, status: 'new' | 'in_progress' | 'resolved') {
  if (!supabase || !member.userId) return
  const { error } = await supabase.from('support_messages').update({
    status,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    resolved_by: status === 'resolved' ? member.userId : null,
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

<style scoped>
.sm-message-body {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
