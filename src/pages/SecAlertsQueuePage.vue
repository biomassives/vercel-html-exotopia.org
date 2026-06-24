<template>
  <q-page padding class="bg-grey-1">
    <!-- Header Section -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 q-my-none text-weight-bold row items-center gap-sm">
          <q-icon name="security" color="primary" class="q-mr-xs" />
          CISA Known Exploited Vulnerabilities
        </h1>
        <div v-if="metadata" class="text-caption text-grey-7 q-mt-xs">
          Catalog Version: <strong>{{ metadata.catalogVersion }}</strong> • 
          Released: {{ formatDate(metadata.dateReleased) }} • 
          Total: {{ metadata.count }} entries
        </div>
      </div>
      
      <q-btn 
        color="primary" 
        icon="sync" 
        label="Force Sync Feed" 
        :loading="loading" 
        @click="syncKevData" 
        outline
      />
    </div>

    <!-- Data Table Card -->
    <q-card flat bordered class="br-8 shadow-1">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="cveID"
        :filter="filter"
        :loading="loading"
        :pagination="pagination"
        class="kev-table"
        flat
      >
        <!-- Search and Filter Header -->
        <template v-slot:top-right>
          <q-input 
            v-model="filter" 
            outlined 
            dense 
            debounce="300" 
            placeholder="Search CVE, Vendor, Product..."
            style="width: 300px;"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <!-- Custom Column for CVE ID and Ransomware Badge -->
        <template v-slot:body-cell-cveID="props">
          <q-td :props="props">
            <div class="text-weight-bold text-primary text-subtitle2">
              {{ props.value }}
            </div>
            <q-badge 
              v-if="props.row.knownRansomwareCampaignUse === 'Known'" 
              color="negative" 
              label="Ransomware" 
              size="sm"
              class="q-mt-xs"
            />
          </q-td>
        </template>

        <!-- Custom Column for Vulnerability Details -->
        <template v-slot:body-cell-vulnerabilityName="props">
          <q-td :props="props" class="max-width-desc">
            <div class="text-weight-medium text-grey-9">{{ props.value }}</div>
            <div class="text-caption text-grey-7 ellipsis-2-lines q-mt-xs">
              {{ props.row.shortDescription }}
            </div>
          </q-td>
        </template>

        <!-- Custom Column for Required Actions -->
        <template v-slot:body-cell-requiredAction="props">
          <q-td :props="props" class="max-width-desc text-caption text-grey-8 text-wrap">
            {{ props.value }}
          </q-td>
        </template>

        <!-- Custom Column for Due Date Warning -->
        <template v-slot:body-cell-dueDate="props">
          <q-td :props="props">
            <q-badge 
              :color="isOverdue(props.value) ? 'deep-orange-9' : 'orange-7'" 
              text-color="white"
              class="text-weight-bold"
            >
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { kevStore } from 'src/utils/kevStore' // Adjust path based on your exact file tree

const $q = useQuasar()

// State management
const rows = ref([])
const loading = ref(false)
const filter = ref('')
const metadata = ref(null)

const pagination = ref({
  sortBy: 'dueDate',
  descending: true,
  page: 1,
  rowsPerPage: 15
})

// Column definitions for q-table
const columns = [
  { name: 'cveID', align: 'left', label: 'CVE ID', field: 'cveID', sortable: true, style: 'width: 140px' },
  { name: 'vendorProject', align: 'left', label: 'Vendor / Product', field: row => `${row.vendorProject} (${row.product})`, sortable: true, style: 'width: 180px' },
  { name: 'vulnerabilityName', align: 'left', label: 'Vulnerability Details', field: 'vulnerabilityName', sortable: true },
  { name: 'requiredAction', align: 'left', label: 'Required Action', field: 'requiredAction' },
  { name: 'dueDate', align: 'center', label: 'Remediation Due', field: 'dueDate', sortable: true, style: 'width: 130px' }
]

/**
 * Synchronizes external feed with internal IndexedDB caching layers
 */
async function syncKevData() {
  loading.value = true
  try {
    // Check internal cache headers first
    const localMeta = await kevStore.getLocalMeta()
    metadata.value = localMeta

    const response = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')
    if (!response.ok) throw new Error('Network response failed fetching CISA data.')
    
    const remoteData = await response.json()

    // Write back to IndexedDB if remote version is newer or local store is empty
    if (!localMeta || localMeta.catalogVersion !== remoteData.catalogVersion) {
      $q.loading.show({ message: 'Re-indexing local vulnerability catalog...' })
      await kevStore.saveCatalog(remoteData)
      metadata.value = await kevStore.getLocalMeta()
    }

    // Refresh memory rows directly from native IndexedDB storage block
    rows.value = await kevStore.getAllVulnerabilities()
  } catch (error) {
    console.error('Failed to parse or sync KEV catalog:', error)
    $q.notify({
      type: 'negative',
      icon: 'warning',
      message: 'Failed to access or synchronize CISA definitions.'
    })
  } finally {
    loading.value = false
    $q.loading.hide()
  }
}

// Simple helpers for formatting and date rules
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const due = new Date(dateStr)
  const today = new Date()
  return due < today
}

onMounted(() => {
  syncKevData()
})
</script>

<style scoped>
.max-width-desc {
  max-width: 320px;
  white-space: normal;
}
.text-wrap {
  word-break: break-word;
  line-height: 1.4;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
.br-8 {
  border-radius: 8px;
}
</style>
