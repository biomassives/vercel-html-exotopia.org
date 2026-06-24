/**
 * src/stores/verify.ts
 *
 * Minimal shared state for the VerifyPanel.
 * Pages write here when they want the panel to reflect their view.
 */

import { defineStore } from 'pinia'
import { ref }         from 'vue'

export interface SceneStats {
  systemObjects:    number
  animObjects:      number
  focusMoonObjects: number
  planets:          number
  orbitRings:       number
  labels:           number
  sprites:          number
}

export const useVerifyStore = defineStore('verify', () => {
  const panelOpen           = ref(false)
  const currentHostname     = ref<string | null>(null)   // set by GalaxyPage on system entry
  const sceneStats          = ref<SceneStats | null>(null)

  function openPanel()  { panelOpen.value = true  }
  function closePanel() { panelOpen.value = false }
  function togglePanel() { panelOpen.value = !panelOpen.value }

  function updateScene(hostname: string | null, stats: SceneStats) {
    currentHostname.value = hostname
    sceneStats.value      = stats
  }

  function clearScene() {
    currentHostname.value = null
    sceneStats.value      = null
  }

  return { panelOpen, currentHostname, sceneStats, openPanel, closePanel, togglePanel, updateScene, clearScene }
})
