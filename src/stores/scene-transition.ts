import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TransitionMode = 'lightning' | 'iris' | 'inversion' | 'dissolve'

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
   * @param vx   – click x as % of viewport width  (0-100) — for 'dissolve', this
   *              is also the departing handoff origin the arriving scene should
   *              reproduce (see src/lib/scene-handoff.ts)
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
    // 'lightning' duration must track SceneTransition.vue's drawLightningFrame
    // (t = elapsed / 1600) and its runLoop cutoff (elapsed < 1610) — kept in
    // sync manually here, same as the existing iris/inversion/dissolve pairs
    // below. 'dissolve' is intentionally short — it only needs long enough for
    // SceneTransition.vue to grab a snapshot of the live canvas before the
    // route change tears the scene down; the actual reveal happens later, in
    // the 'arriving' phase's crossfade (see signalArriving()/clear() below).
    const dur = m === 'lightning' ? 1600 : m === 'inversion' ? 550 : m === 'dissolve' ? 100 : 380
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
