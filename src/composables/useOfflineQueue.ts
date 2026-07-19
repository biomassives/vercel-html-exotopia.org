/**
 * Shim — delegates to the ecoOffline Pinia store.
 * All queue state is now shared across every component that calls this.
 * Call store.init() once at mount; the window event listeners live for the
 * app's lifetime so do NOT remove them on component unmount.
 */
import { computed, onMounted } from 'vue'
import { useEcoOfflineStore, type QueuedSubmission } from 'src/stores/eco-offline'

export type { QueuedSubmission }

export function useOfflineQueue() {
  const store = useEcoOfflineStore()

  onMounted(() => void store.init())

  return {
    queue:   computed(() => store.queue),
    pending: computed(() => store.pending),
    failed:  computed(() => store.failed),
    synced:  computed(() => store.syncedItems),
    online:  computed(() => store.online),
    enqueue: store.enqueue,
    syncNow: store.syncNow,
    remove:  store.removeQueueItem,
    refresh: store.refreshQueue,
  }
}
