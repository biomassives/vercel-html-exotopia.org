/**
 * src/stores/portal.ts
 *
 * Pinia store controlling the WormholePortal overlay.
 * Any page can call openPortal() to trigger the 7-second transit animation;
 * WormholePortal.vue watches this store and navigates on transit-complete.
 */

import { defineStore } from 'pinia'
import { ref }         from 'vue'

export interface PortalDestination {
  /** Human-readable label shown during transit */
  label:    string
  /** Vue Router target path (e.g. '/surface/...' or '/cosmic') */
  route:    string
  /** Optional hostname to pass to the surface view */
  hostname?: string
  /**
   * Spectral color of the departure point (CSS hex, e.g. '#ff9933' for a K-type star).
   * WormholePortal uses this to tint the beginning of the transit.
   * If omitted, a default is derived from the current route.
   */
  sourceColor?: string
  /**
   * Spectral color of the arrival point.
   * WormholePortal uses this to tint the end of the transit.
   * If omitted, a default is derived from the destination route.
   */
  destColor?: string
}

export const usePortalStore = defineStore('portal', () => {
  const active      = ref(false)
  const destination = ref<PortalDestination | null>(null)
  const showHelp    = ref(false)

  function openPortal(dest: PortalDestination) {
    destination.value = dest
    active.value      = true
  }

  function closePortal() {
    active.value      = false
    destination.value = null
  }

  return { active, destination, showHelp, openPortal, closePortal }
})
