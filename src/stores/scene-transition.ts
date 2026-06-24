import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TransitionMode = 'lightning' | 'spirograph' | 'iris'

export const useSceneTransitionStore = defineStore('scene-transition', () => {
  const phase   = ref<'idle' | 'departing' | 'black' | 'arriving'>('idle')
  const mode    = ref<TransitionMode>('iris')
  const ox      = ref(50)   // % of viewport width  — departure origin
  const oy      = ref(50)   // % of viewport height
  const bearing = ref(0)    // radians — approach angle passed to arriving scene

  /**
   * Trigger a departure animation from the given viewport origin.
   * Returns a Promise that resolves when the screen is fully black and it is
   * safe to router.push() to the next route.
   *
   * @param vx   – click x as % of viewport width  (0-100)
   * @param vy   – click y as % of viewport height (0-100)
   * @param m    – animation mode
   * @param b    – bearing in radians for the arriving scene's camera entry
   */
  function depart(vx = 50, vy = 50, m: TransitionMode = 'iris', b = 0): Promise<void> {
    ox.value      = vx
    oy.value      = vy
    mode.value    = m
    bearing.value = b
    phase.value   = 'departing'
    const dur = m === 'spirograph' ? 1500 : m === 'lightning' ? 900 : 380
    return new Promise(resolve => {
      setTimeout(() => { phase.value = 'black'; resolve() }, dur)
    })
  }

  /** Called by SceneTransition.vue when route changes during 'black' phase. */
  function signalArriving() {
    if (phase.value === 'black') phase.value = 'arriving'
  }

  /** Called by SceneTransition.vue when arrival animation is complete. */
  function clear() {
    phase.value = 'idle'
  }

  return { phase, mode, ox, oy, bearing, depart, signalArriving, clear }
})
