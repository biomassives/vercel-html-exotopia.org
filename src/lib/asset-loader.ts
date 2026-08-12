/**
 * asset-loader.ts
 *
 * Shared GLTFLoader/TextureLoader scaffolding for swapping the app's
 * procedural placeholder meshes/materials for authored art, once it exists.
 * Every loader here fails soft: a missing file (the expected state until an
 * asset is actually dropped in under public/assets/) resolves to `null`
 * instead of throwing or logging, so every caller can fall back to its
 * existing procedural version with a plain `if (result) { ... }` — no
 * try/catch, no console noise while assets are still being made.
 *
 * Path convention: ASSET_PATHS below is the single source of truth for what
 * filename each system looks for. Nothing in the loading or fallback code
 * needs to change when a real asset arrives — drop the file in at the exact
 * path and it's picked up on next load. See the README in each
 * public/assets/<category>/ folder for format/size guidance.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader    = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

// Loads are cached by URL so multiple callers asking for the same asset in
// the same session (e.g. two settlements both placing a 'beacon') share one
// fetch instead of each triggering their own — including the shared "this
// 404'd" result, so a missing asset isn't re-requested on every mesh build.
const gltfCache    = new Map<string, Promise<GLTF | null>>()
const textureCache = new Map<string, Promise<THREE.Texture | null>>()

/** Load a .glb/.gltf, or null if it doesn't exist (yet) — never throws/rejects. */
export function tryLoadGLTF(url: string): Promise<GLTF | null> {
  let p = gltfCache.get(url)
  if (!p) {
    p = new Promise<GLTF | null>(resolve => {
      gltfLoader.load(url, resolve, undefined, () => resolve(null))
    })
    gltfCache.set(url, p)
  }
  return p
}

/** Load a texture, or null if it doesn't exist (yet) — never throws/rejects. */
export function tryLoadTexture(url: string): Promise<THREE.Texture | null> {
  let p = textureCache.get(url)
  if (!p) {
    p = new Promise<THREE.Texture | null>(resolve => {
      textureLoader.load(url, resolve, undefined, () => resolve(null))
    })
    textureCache.set(url, p)
  }
  return p
}

// ── Drop-in path convention ───────────────────────────────────────────────
// Everything lives under public/assets/, so these are plain root-relative
// URLs — no import-time bundling, just static files the dev/prod server
// serves as-is. See design-asset-conventions.md for the full punch list
// these correspond to.

export const ASSET_PATHS = {
  /** One .glb per ITEM_MESH_PRESETS key, e.g. 'beacon' -> settlement-items/beacon.glb */
  settlementItem: (presetKey: string): string =>
    `/assets/settlement-items/${presetKey}.glb`,

  /**
   * One .glb per REMEDIATION_METHODS[].key (src/data/pfas-methods-library.ts)
   * — SPEC_AUTHORED_ART_LIBRARY.md's "Technologies" grouping. A distinct
   * folder from settlementItem: these represent real, named equipment
   * (a GAC vessel, an IX skid) rather than abstract settlement decor, so
   * they get their own art direction rather than sharing the decor look.
   * Until a real model exists at this path, callers fall back to
   * settlement-items.ts's generic-orb placeholder (see buildItemMesh()'s
   * default case) — the "morphous model" stand-in.
   */
  technology: (methodKey: string): string =>
    `/assets/technologies/${methodKey}.glb`,

  /** One equirectangular JPG per PlanetType (CosmicPage.vue proposed zones). */
  planetSurface: (planetType: string): string =>
    `/assets/planets/${planetType}.jpg`,

  /** Tileable normal/roughness pair for the Local Step Portal's frame ring. */
  portalFrameNormal:    '/assets/portal/frame-normal.jpg',
  portalFrameRoughness: '/assets/portal/frame-roughness.jpg',

  /**
   * One .glb per fixed dome structure (DomeInteriorPage.vue's buildStructures()
   * — the library, and any future named structure). Unlike settlementItem,
   * there's no enumerable catalogue behind this — each dome has exactly one
   * of each, not "one of N types" — so this is a plain named lookup, not a
   * preset-key grouping.
   */
  domeStructure: (name: string): string =>
    `/assets/dome-structures/${name}.glb`,
} as const
