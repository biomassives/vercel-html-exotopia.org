<template>
  <transition name="slide-down">
    <div v-if="showBar" :class="['offline-bar', barClass]" @click="openPanel">
      <div class="offline-bar-left">
        <q-icon :name="icon" size="15px" />
        <span class="offline-bar-msg">{{ message }}</span>
      </div>
      <div class="offline-bar-right">
        <span v-if="store.failedCount" class="offline-bar-failed">
          {{ store.failedCount }} failed
        </span>
        <span v-if="store.pendingCount" class="offline-bar-queue">
          {{ store.pendingCount }} pending
        </span>
        <q-btn
          v-if="store.pendingCount && store.online"
          flat dense size="xs"
          label="Sync"
          :loading="store.syncing"
          @click.stop="store.syncNow()"
          class="q-ml-xs"
        />
        <q-icon name="mdi-chevron-up" size="13px" class="q-ml-xs offline-bar-chevron" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEcoOfflineStore } from 'src/stores/eco-offline'

const store = useEcoOfflineStore()

onMounted(() => void store.init())

const showBar = computed(() =>
  !store.online || store.pendingCount > 0 || store.failedCount > 0
)

const barClass = computed(() => ({
  'offline-bar--offline': !store.online,
  'offline-bar--failed':  store.online && store.failedCount > 0,
  'offline-bar--pending': store.online && !store.failedCount && store.pendingCount > 0,
}))

const icon = computed(() => {
  if (!store.online)        return 'mdi-wifi-off'
  if (store.failedCount)    return 'mdi-alert-circle-outline'
  if (store.pendingCount)   return 'mdi-cloud-upload-outline'
  return 'mdi-cloud-check-outline'
})

const message = computed(() => {
  if (!store.online)
    return 'Offline — tap to manage local queue'
  if (store.failedCount)
    return `${store.failedCount} submission${store.failedCount !== 1 ? 's' : ''} failed — tap to retry`
  if (store.pendingCount)
    return `${store.pendingCount} submission${store.pendingCount !== 1 ? 's' : ''} queued`
  return ''
})

function openPanel() {
  store.panelOpen = true
}
</script>

<style scoped>
.offline-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 14px;
  font-size: 11.5px;
  font-weight: 500;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.offline-bar--offline { background: #b71c1c; color: #fff; }
.offline-bar--failed  { background: #7b1fa2; color: #fff; }
.offline-bar--pending { background: #e65100; color: #fff; }

.offline-bar-left  { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.offline-bar-msg   { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.offline-bar-right { display: flex; align-items: center; flex-shrink: 0; gap: 4px; }
.offline-bar-queue  { font-size: 11px; opacity: 0.9; }
.offline-bar-failed { font-size: 11px; opacity: 0.9; }
.offline-bar-chevron { opacity: 0.7; }

.slide-down-enter-active,
.slide-down-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.slide-down-enter-from,
.slide-down-leave-to    { transform: translateY(-100%); opacity: 0; }
</style>
