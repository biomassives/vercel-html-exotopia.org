/**
 * src/composables/useVizRenderer.ts
 *
 * Singleton WebGLRenderer shared across all visualization pages.
 *
 * The renderer, scene, camera, and controls live at module scope — they survive
 * Vue component lifecycle and router transitions. Each visualization page:
 *   1. On mount  — adds its objects to a pageGroup, configures camera/controls,
 *                  registers a per-frame tick callback via addTick().
 *   2. On unmount — unregisters the tick, disposes and removes its pageGroup,
 *                   removes any canvas event listeners it added.
 *
 * MainLayout.vue owns the <canvas> element and calls init() / destroy() /
 * resize(). All other code calls useVizRenderer() to get the shared refs.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ── Singleton state (module-level — survives Vue lifecycle) ───────────────────

let _canvas:   HTMLCanvasElement        | null = null
let _renderer: THREE.WebGLRenderer      | null = null
let _scene:    THREE.Scene              | null = null
let _camera:   THREE.PerspectiveCamera  | null = null
let _controls: OrbitControls            | null = null
let _rafId:    number                    = 0
let _ready     = false
let _initError: string | null            = null

const _tickFns = new Set<(t: number) => void>()

// Nav-bar height — must match .exo-bar height in MainLayout CSS
export const VIZ_BAR_H = 44

// ── Public composable ─────────────────────────────────────────────────────────

export function useVizRenderer() {

  /**
   * Create the renderer. Call once from MainLayout.vue onMounted.
   * Safe to call again — no-op if already initialized.
   */
  function init(canvas: HTMLCanvasElement) {
    if (_ready || _initError) return
    _canvas = canvas

    try {
      // preserveDrawingBuffer: the 'dissolve' scene-transition mode (see
      // SceneTransition.vue) does a plain 2D-canvas drawImage(vizCanvas, ...)
      // to snapshot the last live frame for its crossfade. Without this flag
      // the browser is free to clear/invalidate the drawing buffer right
      // after compositing, which can make that snapshot come back blank
      // depending on exactly when it's captured relative to the render loop.
      _renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    } catch (err) {
      _initError = err instanceof Error ? err.message : 'WebGL context could not be created.'
      console.warn('[useVizRenderer] WebGL unavailable — 3D visualization disabled:', _initError)
      _renderer = null
      return
    }
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    _renderer.setSize(_w(), _h())
    _renderer.toneMapping         = THREE.ACESFilmicToneMapping
    _renderer.toneMappingExposure  = 0.9

    _scene = new THREE.Scene()

    _camera = new THREE.PerspectiveCamera(55, _w() / _h(), 0.01, 400)

    _controls = new OrbitControls(_camera, canvas)
    _controls.enableDamping  = true
    _controls.dampingFactor  = 0.1

    _attachRelay()

    _ready = true
    _startLoop()
  }

  /**
   * Destroy everything. Call from MainLayout.vue onUnmounted only —
   * i.e. when the whole app is being torn down, not on route changes.
   */
  function destroy() {
    cancelAnimationFrame(_rafId)
    _tickFns.clear()
    _detachRelay()
    _controls?.dispose()
    _renderer?.dispose()
    _canvas = null; _renderer = null; _scene = null
    _camera = null; _controls = null; _ready = false
    _initError = null
  }

  /**
   * Update renderer + camera on window resize.
   * Call from MainLayout.vue's resize handler.
   */
  function resize() {
    if (!_renderer || !_camera) return
    _renderer.setSize(_w(), _h())
    _camera.aspect = _w() / _h()
    _camera.updateProjectionMatrix()
  }

  /**
   * Register a per-frame callback. Returns a cleanup function — call it in
   * the page's onUnmounted to unregister before the page is destroyed.
   *
   *   const stopTick = viz.addTick(t => { ... })
   *   onUnmounted(() => stopTick())
   */
  function addTick(fn: (t: number) => void): () => void {
    _tickFns.add(fn)
    return () => { _tickFns.delete(fn) }
  }

  return {
    /** True once init() has succeeded. */
    get ready()    { return _ready    },
    /** Set if init() failed (e.g. WebGL unavailable). Null when healthy. */
    get initError(){ return _initError },
    get renderer() { return _renderer },
    get scene()    { return _scene    },
    get camera()   { return _camera   },
    get controls() { return _controls },
    /** The canvas element owned by MainLayout. Use for addEventListeners in pages. */
    get canvas()   { return _canvas   },
    init,
    destroy,
    resize,
    addTick,
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _w() { return window.innerWidth }
function _h() { return Math.max(1, window.innerHeight - VIZ_BAR_H) }

function _startLoop() {
  const tick = () => {
    _rafId = requestAnimationFrame(tick)
    _controls?.update()
    const t = performance.now() / 1000
    for (const fn of _tickFns) fn(t)
    if (_renderer && _scene && _camera) _renderer.render(_scene, _camera)
  }
  tick()
}

// ── Pointer/wheel relay ────────────────────────────────────────────────────
//
// .viz-canvas-root is `pointer-events:none` (a pure render target — see app.scss):
// it sits behind each page's transparent `.viz-overlay-page`, which must be the
// hit-test target so its @click/@mousemove raycasting handlers fire over "empty"
// scene regions (where no UI panel sits). But OrbitControls — and page handlers
// like CosmicPage's onCanvasWheel — are bound to the canvas via addEventListener
// and therefore never receive real browser pointer/wheel events.
//
// Relay them: re-dispatch pointerdown/move/up/cancel/wheel/contextmenu onto the
// canvas, but only those whose real target IS the transparent overlay page itself
// (an "empty scene" interaction) — never UI panels, which are descendants with
// their own pointer-events:auto and become the direct target of their own clicks/
// drags, so they're naturally excluded and won't spuriously rotate the scene.
// A drag started on empty space keeps relaying by pointerId even if the cursor
// later crosses over a panel, so OrbitControls doesn't lose the gesture mid-drag.

const _relayedPointers = new Set<number>()

function _isOverlayTarget(e: Event): boolean {
  const t = e.target as HTMLElement | null
  return !!t?.classList?.contains('viz-overlay-page')
}

// Build a non-bubbling clone init dict. `bubbles: false` is essential — without
// it, the clone dispatched on the canvas bubbles back up to `document` and
// re-triggers this same relay, recursing infinitely (the cloned pointerdown
// carries the same pointerId, so the pointermove/up branch below would re-match
// it forever). OrbitControls only needs the event to land directly on the
// canvas (it listens on domElement, not document), so non-bubbling is correct.
function _cloneInit(e: PointerEvent | WheelEvent | MouseEvent) {
  const m = e as MouseEvent, p = e as PointerEvent, w = e as WheelEvent
  return {
    bubbles: false, cancelable: true, composed: false,
    clientX: m.clientX, clientY: m.clientY, screenX: m.screenX, screenY: m.screenY,
    button: m.button, buttons: m.buttons, relatedTarget: m.relatedTarget,
    ctrlKey: m.ctrlKey, shiftKey: m.shiftKey, altKey: m.altKey, metaKey: m.metaKey,
    pointerId: p.pointerId, pointerType: p.pointerType, isPrimary: p.isPrimary,
    width: p.width, height: p.height, pressure: p.pressure,
    tiltX: p.tiltX, tiltY: p.tiltY, twist: p.twist,
    deltaX: w.deltaX, deltaY: w.deltaY, deltaZ: w.deltaZ, deltaMode: w.deltaMode,
  }
}

function _relayPointer(e: PointerEvent) {
  if (!_canvas) return
  if (e.type === 'pointerdown') {
    if (!_isOverlayTarget(e)) return
    _relayedPointers.add(e.pointerId)
  } else if (!_relayedPointers.has(e.pointerId)) {
    return
  }
  if (e.type === 'pointerup' || e.type === 'pointercancel') _relayedPointers.delete(e.pointerId)
  _canvas.dispatchEvent(new PointerEvent(e.type, _cloneInit(e)))

  // OrbitControls' onPointerDown calls canvas.setPointerCapture(pointerId) — which
  // would silently retarget every subsequent real pointermove/pointerup/click for
  // this pointer onto the canvas (regardless of cursor position), starving the
  // overlay page's own raycasting handlers. Re-capture on the real target right
  // after, so real events keep reaching it; the relay (tracked by pointerId above,
  // independent of target) keeps forwarding clones to the canvas either way.
  if (e.type === 'pointerdown') {
    (e.target as Element)?.setPointerCapture?.(e.pointerId)
  }
}

function _relayWheel(e: WheelEvent) {
  if (!_canvas || !_isOverlayTarget(e)) return
  e.preventDefault()  // mirrors the canvas-bound listener — block page scroll/pinch-zoom
  _canvas.dispatchEvent(new WheelEvent(e.type, _cloneInit(e)))
}

function _relayContextMenu(e: MouseEvent) {
  if (!_canvas || !_isOverlayTarget(e)) return
  e.preventDefault()  // mirrors OrbitControls' own contextmenu handler — block right-click menu
  _canvas.dispatchEvent(new MouseEvent(e.type, _cloneInit(e)))
}

function _attachRelay() {
  document.addEventListener('pointerdown',  _relayPointer)
  document.addEventListener('pointermove',  _relayPointer)
  document.addEventListener('pointerup',    _relayPointer)
  document.addEventListener('pointercancel', _relayPointer)
  document.addEventListener('wheel',        _relayWheel, { passive: false })
  document.addEventListener('contextmenu',  _relayContextMenu)
}

function _detachRelay() {
  document.removeEventListener('pointerdown',  _relayPointer)
  document.removeEventListener('pointermove',  _relayPointer)
  document.removeEventListener('pointerup',    _relayPointer)
  document.removeEventListener('pointercancel', _relayPointer)
  document.removeEventListener('wheel',        _relayWheel)
  document.removeEventListener('contextmenu',  _relayContextMenu)
  _relayedPointers.clear()
}
