/**
 * useSpatialLocation — URL-driven camera navigation for every visualization page.
 *
 * Usage (inside a Vue page, after scene init):
 *
 *   const spatial = useSpatialLocation(
 *     () => camera,    // getter — may be null before initScene
 *     () => controls,
 *   )
 *
 *   onMounted(() => {
 *     initScene()
 *     spatial.restoreFromUrl()   // apply ?at= / ?cam= on first load
 *   })
 *
 *   // Navigate to a named scope (updates URL + GSAP flies camera):
 *   spatial.flyTo('settlement:library')
 *   spatial.flyTo('settlement:pyramid:chamber', { duration: 2.5 })
 *
 *   // Capture exact camera state into a shareable URL:
 *   navigator.clipboard.writeText(spatial.captureUrl())
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import gsap from 'gsap'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { SCOPE_PRESETS, encodeCam, parseCam, adjustForTerrain } from 'src/lib/spatial-scopes'
import type { SpatialCam } from 'src/lib/spatial-scopes'

export type { SpatialCam }

export interface FlyToOptions {
  duration?:   number         // seconds (default 1.8)
  ease?:       string         // GSAP ease string (default 'power2.inOut')
  onComplete?: () => void
  writeUrl?:   boolean        // push query params to history (default true)
  immediate?:  boolean        // skip animation, snap instantly (default false)
}

export function useSpatialLocation(
  getCamera:   () => THREE.PerspectiveCamera | null,
  getControls: () => OrbitControls | null,
  // Optional — pages whose settlement geometry sits at a procedural vertical
  // offset (e.g. SurfaceViewPage's terrainBaseY) provide this so terrain-anchored
  // presets land on the actual geometry instead of the coordinates they were
  // authored against. See adjustForTerrain() in spatial-scopes.ts.
  getTerrainBaseY?: () => number | null,
) {
  const route  = useRoute()
  const router = useRouter()

  function _resolvePreset(scope: string): SpatialCam | null {
    const preset = SCOPE_PRESETS[scope]
    if (!preset) return null
    return adjustForTerrain(preset, scope, getTerrainBaseY?.() ?? null)
  }

  // ── Read URL state ─────────────────────────────────────────────────────────

  const currentScope = computed<string>(() => String(route.query.at ?? ''))

  const currentCamOverride = computed<SpatialCam | null>(() => {
    const raw = String(route.query.cam ?? '')
    return raw ? parseCam(raw) : null
  })

  const activePreset = computed<SpatialCam | null>(() =>
    currentCamOverride.value ?? _resolvePreset(currentScope.value)
  )

  // ── Apply URL state (call after scene is ready) ────────────────────────────

  function restoreFromUrl() {
    const cam = activePreset.value
    if (!cam) return
    applyImmediate(cam)
  }

  function applyImmediate(cam: SpatialCam) {
    const c = getCamera(); const ctrl = getControls()
    if (!c || !ctrl) return
    c.position.set(cam.x, cam.y, cam.z)
    c.fov = cam.fov
    c.updateProjectionMatrix()
    ctrl.target.set(cam.tx, cam.ty, cam.tz)
    ctrl.update()
  }

  // ── Named scope navigation ─────────────────────────────────────────────────

  function flyTo(scope: string, opts: FlyToOptions = {}) {
    if (!SCOPE_PRESETS[scope]) {
      if (import.meta.env.DEV) console.warn(`[useSpatialLocation] unknown scope: "${scope}"`)
      return
    }
    const cam = _resolvePreset(scope)
    if (!cam) return
    _animate(cam, { scopeKey: scope, camKey: undefined }, opts)
  }

  /** Fly to explicit coordinates (URL will encode as ?cam= instead of ?at=). */
  function flyToExact(cam: SpatialCam, opts: FlyToOptions = {}) {
    _animate(cam, { scopeKey: undefined, camKey: encodeCam(cam) }, opts)
  }

  function _animate(
    cam: SpatialCam,
    keys: { scopeKey: string | undefined; camKey: string | undefined },
    opts: FlyToOptions,
  ) {
    const {
      duration   = 1.8,
      ease       = 'power2.inOut',
      onComplete,
      writeUrl   = true,
      immediate  = false,
    } = opts

    if (immediate) {
      applyImmediate(cam)
      onComplete?.()
      if (writeUrl) _pushUrl(keys)
      return
    }

    const c = getCamera(); const ctrl = getControls()
    if (!c || !ctrl) { applyImmediate(cam); return }

    const tl = gsap.timeline({
      onComplete: () => {
        c.updateProjectionMatrix()
        ctrl.update()
        onComplete?.()
      },
    })

    tl.to(c.position,  { x: cam.x, y: cam.y, z: cam.z, duration, ease }, 0)
    tl.to(ctrl.target, { x: cam.tx, y: cam.ty, z: cam.tz, duration, ease }, 0)
    tl.to(c, {
      fov: cam.fov, duration, ease,
      onUpdate: () => c.updateProjectionMatrix(),
    }, 0)

    if (writeUrl) _pushUrl(keys)
  }

  function _pushUrl(keys: { scopeKey?: string; camKey?: string }) {
    const q = { ...route.query }
    delete q['at']
    delete q['cam']
    if (keys.scopeKey) q['at']  = keys.scopeKey
    if (keys.camKey)   q['cam'] = keys.camKey
    void router.replace({ query: q })
  }

  // ── Share / bookmark current camera ───────────────────────────────────────

  /** Returns an absolute URL encoding the current camera position exactly. */
  function captureUrl(): string {
    const c = getCamera(); const ctrl = getControls()
    if (!c || !ctrl) return window.location.href
    const snap: SpatialCam = {
      x: c.position.x, y: c.position.y, z: c.position.z,
      tx: ctrl.target.x, ty: ctrl.target.y, tz: ctrl.target.z,
      fov: c.fov,
    }
    const q = new URLSearchParams(window.location.search)
    q.delete('at')
    q.set('cam', encodeCam(snap))
    return `${window.location.origin}${window.location.pathname}?${q.toString()}`
  }

  /** Snapshot current camera as a SpatialCam (useful for building orb links). */
  function snapshotCam(): SpatialCam | null {
    const c = getCamera(); const ctrl = getControls()
    if (!c || !ctrl) return null
    return {
      x: c.position.x, y: c.position.y, z: c.position.z,
      tx: ctrl.target.x, ty: ctrl.target.y, tz: ctrl.target.z,
      fov: c.fov,
    }
  }

  return {
    currentScope,
    currentCamOverride,
    activePreset,
    restoreFromUrl,
    applyImmediate,
    flyTo,
    flyToExact,
    captureUrl,
    snapshotCam,
  }
}
