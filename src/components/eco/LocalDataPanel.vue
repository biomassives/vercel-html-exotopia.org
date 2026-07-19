<template>
  <q-dialog
    v-model="store.panelOpen"
    position="bottom"
    :full-width="true"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="ldp-card">

      <!-- Header -->
      <div class="ldp-head">
        <div class="ldp-head-left">
          <q-icon name="mdi-database-outline" size="17px" color="teal-4" class="q-mr-xs" />
          <span class="ldp-title">Local data</span>
          <q-badge v-if="store.pendingCount" color="orange-8" :label="store.pendingCount" class="q-ml-sm" />
          <q-badge v-if="store.failedCount"  color="red-8"    :label="store.failedCount"  class="q-ml-xs" />
        </div>
        <q-btn flat dense round icon="mdi-close" size="sm" @click="store.panelOpen = false" />
      </div>

      <!-- Status row -->
      <div class="ldp-status-row">
        <div :class="['ldp-status-dot', store.online ? 'ldp-status-dot--online' : 'ldp-status-dot--offline']" />
        <span class="ldp-status-label">{{ store.online ? 'Online' : 'Offline' }}</span>
        <q-btn
          v-if="store.online && store.pendingCount"
          flat dense size="xs" icon="mdi-sync" label="Sync now"
          color="teal-4" class="q-ml-sm"
          :loading="store.syncing"
          @click="store.syncNow()"
        />
        <q-space />
        <q-btn
          flat dense size="xs"
          icon="mdi-download-outline"
          label="Export JSON"
          color="blue-grey-4"
          @click="exportJson"
        />
      </div>

      <!-- Tabs -->
      <q-tabs v-model="tab" dense align="left" class="ldp-tabs"
              active-color="teal-4" indicator-color="teal-5">
        <q-tab name="pending" :label="`Pending (${store.pendingCount})`" />
        <q-tab name="failed"  :label="`Failed (${store.failedCount})`" />
        <q-tab name="drafts"  :label="`Drafts (${store.draftCount})`" />
        <q-tab name="synced"  :label="`Synced (${store.syncedItems.length})`" />
      </q-tabs>

      <!-- Tab panels -->
      <q-tab-panels v-model="tab" animated class="ldp-panels">

        <!-- ── PENDING ── -->
        <q-tab-panel name="pending" class="ldp-panel">
          <div v-if="!store.pending.length" class="ldp-empty">
            <q-icon name="mdi-check-circle-outline" size="28px" color="teal-6" />
            <span>Nothing waiting to sync</span>
          </div>
          <div v-for="item in store.pending" :key="item.id" class="ldp-item">
            <div class="ldp-item-left">
              <span class="ldp-item-site">{{ item.siteName }}</span>
              <span class="ldp-item-meta">{{ formatType(item.type) }} · {{ formatTime(item.enqueuedAt) }}</span>
              <span v-if="item.photos.length" class="ldp-item-meta ldp-item-photos">
                <q-icon name="mdi-image-multiple-outline" size="11px" />
                {{ item.photos.length }} photo{{ item.photos.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <div class="ldp-item-right">
              <q-chip dense color="orange-9" text-color="white" size="xs" icon="mdi-clock-outline" label="Pending" />
              <q-btn flat round dense icon="mdi-delete-outline" size="xs" color="red-4"
                     @click="removeItem(item.id)" class="q-ml-xs" />
            </div>
          </div>
        </q-tab-panel>

        <!-- ── FAILED ── -->
        <q-tab-panel name="failed" class="ldp-panel">
          <div v-if="!store.failed.length" class="ldp-empty">
            <q-icon name="mdi-check-circle-outline" size="28px" color="teal-6" />
            <span>No failures</span>
          </div>
          <div v-for="item in store.failed" :key="item.id" class="ldp-item">
            <div class="ldp-item-left">
              <span class="ldp-item-site">{{ item.siteName }}</span>
              <span class="ldp-item-meta">{{ formatType(item.type) }} · {{ formatTime(item.enqueuedAt) }}</span>
              <span class="ldp-item-error">{{ item.error }}</span>
            </div>
            <div class="ldp-item-right ldp-item-right--col">
              <q-chip dense color="red-9" text-color="white" size="xs" icon="mdi-alert-circle-outline"
                      :label="`Failed · retry ${item.retries}`" />
              <div class="ldp-item-actions">
                <q-btn flat dense size="xs" icon="mdi-refresh" label="Retry" color="teal-4"
                       @click="store.retryItem(item.id)" />
                <q-btn flat round dense icon="mdi-delete-outline" size="xs" color="red-4"
                       @click="removeItem(item.id)" />
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- ── DRAFTS ── -->
        <q-tab-panel name="drafts" class="ldp-panel">
          <div v-if="!store.drafts.length" class="ldp-empty">
            <q-icon name="mdi-pencil-outline" size="28px" color="blue-grey-5" />
            <span>No saved drafts</span>
          </div>
          <div v-for="d in store.drafts" :key="d.draftKey" class="ldp-item">
            <div class="ldp-item-left">
              <span class="ldp-item-site">{{ d.siteName }}</span>
              <span class="ldp-item-meta">
                {{ d.recordType ? formatType(d.recordType) : 'Type not set' }}
                · step {{ d.step + 1 }}
                · saved {{ formatTime(d.savedAt) }}
              </span>
              <span v-if="d.photos.length" class="ldp-item-meta ldp-item-photos">
                <q-icon name="mdi-image-multiple-outline" size="11px" />
                {{ d.photos.length }} photo{{ d.photos.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <div class="ldp-item-right ldp-item-right--col">
              <q-btn flat dense size="xs" icon="mdi-pencil-outline" label="Resume"
                     color="teal-4" @click="resumeDraft(d)" />
              <q-btn flat round dense icon="mdi-delete-outline" size="xs" color="red-4"
                     @click="store.deleteDraft(d.draftKey)" class="q-mt-xs" />
            </div>
          </div>
        </q-tab-panel>

        <!-- ── SYNCED ── -->
        <q-tab-panel name="synced" class="ldp-panel">
          <div v-if="!store.syncedItems.length" class="ldp-empty">
            <q-icon name="mdi-cloud-check-outline" size="28px" color="blue-grey-5" />
            <span>No synced records yet</span>
          </div>

          <div v-if="store.syncedItems.length" class="ldp-synced-actions">
            <q-btn flat dense size="xs" icon="mdi-delete-sweep-outline"
                   label="Clear old (>7 days)" color="blue-grey-4"
                   @click="store.cleanSynced()" />
          </div>

          <div v-for="item in store.syncedItems" :key="item.id" class="ldp-item">
            <div class="ldp-item-left">
              <span class="ldp-item-site">{{ item.siteName }}</span>
              <span class="ldp-item-meta">
                {{ formatType(item.type) }}
                · synced {{ formatTime(item.syncedAt ?? item.enqueuedAt) }}
              </span>
              <span v-if="item.error" class="ldp-item-warning">{{ item.error }}</span>
            </div>
            <div class="ldp-item-right">
              <q-chip dense color="teal-9" text-color="white" size="xs"
                      icon="mdi-cloud-check-outline" label="Synced" />
              <q-btn flat round dense icon="mdi-delete-outline" size="xs" color="grey-6"
                     @click="removeItem(item.id)" class="q-ml-xs" />
            </div>
          </div>
        </q-tab-panel>

      </q-tab-panels>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref }                  from 'vue'
import { useRouter }            from 'vue-router'
import { useEcoOfflineStore }   from 'src/stores/eco-offline'
import type { MonitoringDraft } from 'src/stores/eco-offline'

const store  = useEcoOfflineStore()
const router = useRouter()
const tab    = ref<'pending' | 'failed' | 'drafts' | 'synced'>('pending')

// Auto-open on failed tab if there are failures
function openOnFailed() {
  tab.value = 'failed'
  store.panelOpen = true
}
defineExpose({ openOnFailed })

// ── Actions ───────────────────────────────────────────────────────────────

async function removeItem(id: string) {
  await store.removeQueueItem(id)
}

async function resumeDraft(d: MonitoringDraft) {
  store.panelOpen = false
  // Navigate to the monitoring entry page for this site with the draft key
  await router.push({
    name: 'eco-ops-monitor',
    params: { siteId: d.siteId },
    query: { draft: d.draftKey },
  })
}

function exportJson() {
  const json = store.exportJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `eco-ops-local-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Formatters ─────────────────────────────────────────────────────────────

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.round(diffMs / 60_000)
    if (diffMins < 1)  return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffH = Math.round(diffMins / 60)
    if (diffH < 24)    return `${diffH}h ago`
    const diffD = Math.round(diffH / 24)
    return `${diffD}d ago`
  } catch { return iso }
}
</script>

<style scoped>
.ldp-card {
  border-radius: 16px 16px 0 0;
  background: #0d1425;
  border-top: 1px solid #1a3050;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.ldp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 6px;
}
.ldp-head-left { display: flex; align-items: center; }
.ldp-title     { font-size: 14px; font-weight: 600; color: #d0e8f8; }

.ldp-status-row {
  display: flex;
  align-items: center;
  padding: 4px 16px 8px;
  font-size: 11.5px;
  color: #7aadcc;
}
.ldp-status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  margin-right: 5px;
}
.ldp-status-dot--online  { background: #26a69a; }
.ldp-status-dot--offline { background: #e53935; }
.ldp-status-label { font-size: 11px; }

.ldp-tabs  { border-bottom: 1px solid #182840; font-size: 12px; }
.ldp-panels { background: transparent; flex: 1; overflow-y: auto; }
.ldp-panel  { padding: 8px 12px; }

.ldp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: #4d7088;
  font-size: 12px;
}

.ldp-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px solid #182840;
  gap: 8px;
}
.ldp-item:last-child { border-bottom: none; }
.ldp-item-left   { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ldp-item-right  { display: flex; align-items: center; flex-shrink: 0; }
.ldp-item-right--col { flex-direction: column; align-items: flex-end; gap: 4px; }
.ldp-item-site   { font-size: 13px; font-weight: 600; color: #c8dff0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ldp-item-meta   { font-size: 10.5px; color: #5a85a0; }
.ldp-item-photos { color: #3a8fa8; }
.ldp-item-error  { font-size: 10px; color: #e57373; word-break: break-word; }
.ldp-item-warning { font-size: 10px; color: #ffa726; word-break: break-word; }
.ldp-item-actions { display: flex; align-items: center; gap: 2px; }

.ldp-synced-actions {
  display: flex;
  justify-content: flex-end;
  padding: 4px 4px 8px;
}
</style>
