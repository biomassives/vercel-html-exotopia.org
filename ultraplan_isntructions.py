#!/usr/bin/env python3
"""
Applies the No-Solid-Ground Settlement Environment (Twin-Cylinder Station
Interior) plan to a local checkout of the Exotopia repo.

Usage:
    python3 apply_station_interior.py [repo_root]

Safe by construction: every edit to an existing file asserts its anchor text
appears EXACTLY once before replacing it. If your tree has diverged from what
this script expects, it stops and tells you which anchor failed rather than
guessing. New files are only written if they don't already exist (or already
match exactly, in which case it's a no-op).
"""
import sys
import pathlib

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()


def apply_edit(rel_path: str, old: str, new: str, desc: str):
    path = ROOT / rel_path
    if not path.exists():
        print(f"[SKIP] {rel_path}: file not found")
        return
    text = path.read_text(encoding="utf-8")
    if new in text and old not in text:
        print(f"[OK]   {rel_path}: already applied ({desc})")
        return
    count = text.count(old)
    if count != 1:
        print(f"[FAIL] {rel_path}: anchor not found exactly once "
              f"(found {count}x) for: {desc}")
        print("       --- expected anchor ---")
        print(old)
        print("       -----------------------")
        return
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"[DONE] {rel_path}: {desc}")


def write_new_file(rel_path: str, content: str):
    path = ROOT / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        existing = path.read_text(encoding="utf-8")
        if existing == content:
            print(f"[OK]   {rel_path}: already exists, identical")
            return
        print(f"[FAIL] {rel_path}: already exists with DIFFERENT content — "
              f"not overwriting. Review manually.")
        return
    path.write_text(content, encoding="utf-8")
    print(f"[DONE] {rel_path}: created ({len(content.splitlines())} lines)")


# ─────────────────────────────────────────────────────────────────────────────
# 1. New file: src/lib/surface-classify.ts
# ─────────────────────────────────────────────────────────────────────────────

SURFACE_CLASSIFY_TS = '''/**
 * Surface classification — decides whether a settlement destination has a
 * walkable solid surface at all. Two independent vocabularies:
 *   - NASA-catalogued planets (GalaxyPage.vue)  → public/topo-params.json (surface_type)
 *   - Cluster planets (ClusterSystemPage.vue)   → ClusterPlanet.type (already in memory)
 * Loader mirrors src/lib/void-oracle.ts::loadVoidOracle() — module-scope
 * cache + inflight dedup, fetch once per session.
 */

export type SurfaceType =
  | 'gas_giant' | 'hot_gas_giant' | 'magma_ocean' | 'lava'
  | 'basalt' | 'desert' | 'frozen_rocky' | 'hycean' | 'iron_rocky'
  | 'ocean' | 'rocky' | 'sub_neptune' | 'super_earth' | 'unknown'

type TopoParams = Record<string, { surface_type: SurfaceType } & Record<string, unknown>>

const TOPO_URL = '/topo-params.json'

let _cache:    TopoParams | null | undefined     = undefined
let _inflight: Promise<TopoParams | null> | null = null

async function loadTopoParams(): Promise<TopoParams | null> {
  if (_cache !== undefined) return _cache
  if (_inflight) return _inflight

  _inflight = (async (): Promise<TopoParams | null> => {
    try {
      const res = await fetch(TOPO_URL)
      if (!res.ok) { _cache = null; return null }
      const data = await res.json() as TopoParams
      _cache = data
      return data
    } catch {
      _cache = null
      return null
    }
  })()

  const result = await _inflight
  _inflight = null
  return result
}

export const NO_GROUND_SURFACE_TYPES: ReadonlySet<SurfaceType> = new Set([
  'gas_giant', 'hot_gas_giant', 'magma_ocean', 'lava',
])

/** Looks up a NASA-catalogued planet's surface_type. Returns null if unresolved (bodyless/malformed address). */
export async function getSurfaceType(plName: string): Promise<SurfaceType | null> {
  const data = await loadTopoParams()
  return data?.[plName]?.surface_type ?? null
}

export async function hasNoSolidGround(plName: string): Promise<boolean> {
  const type = await getSurfaceType(plName)
  return type != null && NO_GROUND_SURFACE_TYPES.has(type)
}

// ── Cluster planets — type already in memory, no fetch needed ────────────────

export const NO_GROUND_CLUSTER_TYPES: ReadonlySet<string> = new Set([
  'gas_giant', 'hot_jupiter', 'lava_world',
])

export function clusterPlanetHasNoSolidGround(type: string): boolean {
  return NO_GROUND_CLUSTER_TYPES.has(type)
}

// ── Bodyless coordinate systems (no planet at all) ────────────────────────────

export const BODYLESS_COORD_SYSTEMS = [
  'exo-stellar-orbital-v1', 'exo-orbital-v1', 'exo-lunar-orbital-v1',
] as const

export function isBodylessCoordSystem(v: string): boolean {
  return (BODYLESS_COORD_SYSTEMS as readonly string[]).includes(v)
}
'''

write_new_file("src/lib/surface-classify.ts", SURFACE_CLASSIFY_TS)


# ─────────────────────────────────────────────────────────────────────────────
# 2. src/lib/settlements.ts — extend SettlementRecord['type'] + orbitalKey()
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/lib/settlements.ts",
    old="""  type: 'surface' | 'cluster' | 'moon' | 'orbital' | 'bh-orbital'""",
    new="""  type: 'surface' | 'cluster' | 'moon' | 'orbital' | 'bh-orbital' | 'stellar-orbital' | 'lunar-orbital'""",
    desc="add stellar-orbital/lunar-orbital to SettlementRecord type union",
)

apply_edit(
    "src/lib/settlements.ts",
    old="""/** Canonical key for a moon settlement. */
export function moonKey(planetName: string, moonIdx: number, coordVariant: string): string {
  return `moon:${planetName}:${moonIdx}:${coordVariant}`
}""",
    new="""/** Canonical key for a moon settlement. */
export function moonKey(planetName: string, moonIdx: number, coordVariant: string): string {
  return `moon:${planetName}:${moonIdx}:${coordVariant}`
}

/** Canonical key for a bodyless orbital settlement (stellar/planetary/lunar orbit, or a black-hole zone). */
export function orbitalKey(coordSystem: string, hostname: string, refName?: string): string {
  return refName ? `${coordSystem}:${hostname}:${refName}` : `${coordSystem}:${hostname}`
}""",
    desc="add orbitalKey() helper",
)


# ─────────────────────────────────────────────────────────────────────────────
# 3. src/lib/settlement-items.ts — CYLINDER_ZONE_POSITIONS, autoPosition() zone
#    map param, exported buildItemMesh()
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/lib/settlement-items.ts",
    old="""import { reactive, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { safeRead, safeWrite, hashStorageKey } from './storage-cipher'""",
    new="""import { reactive, computed, watch } from 'vue'
import type { Ref } from 'vue'
import * as THREE from 'three'
import { safeRead, safeWrite, hashStorageKey } from './storage-cipher'""",
    desc="add THREE import (needed by extracted buildItemMesh)",
)

apply_edit(
    "src/lib/settlement-items.ts",
    old="""export const ZONE_POSITIONS: Record<ItemZone, { cx: number; cz: number; radius: number }> = {
  'library':    { cx:  0,  cz: -18, radius: 10 },
  'water-edge': { cx: 34,  cz: -26, radius:  8 },
  'garden':     { cx:  4,  cz: -50, radius: 16 },
  'gateway':    { cx:  0,  cz:  42, radius:  7 },
  'courtyard':  { cx:  8,  cz:  -4, radius:  9 },
  'open-floor': { cx: -18, cz: -28, radius: 13 },
}""",
    new="""export const ZONE_POSITIONS: Record<ItemZone, { cx: number; cz: number; radius: number }> = {
  'library':    { cx:  0,  cz: -18, radius: 10 },
  'water-edge': { cx: 34,  cz: -26, radius:  8 },
  'garden':     { cx:  4,  cz: -50, radius: 16 },
  'gateway':    { cx:  0,  cz:  42, radius:  7 },
  'courtyard':  { cx:  8,  cz:  -4, radius:  9 },
  'open-floor': { cx: -18, cz: -28, radius: 13 },
}

// Same ItemZone keys, laid out for a long narrow cylinder deck instead of a
// circular dome — so a settler's items stay portable between the two shells.
export const CYLINDER_ZONE_POSITIONS: Record<ItemZone, { cx: number; cz: number; radius: number }> = {
  'library':    { cx: -50, cz:   0, radius: 14 },
  'water-edge': { cx:  50, cz: -20, radius: 12 },
  'garden':     { cx:  50, cz:  20, radius: 16 },
  'gateway':    { cx:   0, cz: -55, radius: 10 },
  'courtyard':  { cx:   0, cz:   0, radius: 12 },
  'open-floor': { cx: -50, cz:  30, radius: 14 },
}""",
    desc="add CYLINDER_ZONE_POSITIONS table",
)

apply_edit(
    "src/lib/settlement-items.ts",
    old="""/** Deterministic zone position for an item (no explicit posX/Z set). */
export function autoPosition(
  item: SettlementItem,
  slotIdx: number,
): { x: number; z: number } {
  if (item.posX !== undefined && item.posZ !== undefined) {
    return { x: item.posX, z: item.posZ }
  }
  const zone  = ZONE_POSITIONS[item.zone]
  const angle = (slotIdx / 5) * Math.PI * 2
  const r     = zone.radius * 0.55
  return {
    x: zone.cx + Math.cos(angle) * r,
    z: zone.cz + Math.sin(angle) * r,
  }
}""",
    new="""/** Deterministic zone position for an item (no explicit posX/Z set). */
export function autoPosition(
  item: SettlementItem,
  slotIdx: number,
  zoneMap: Record<ItemZone, { cx: number; cz: number; radius: number }> = ZONE_POSITIONS,
): { x: number; z: number } {
  if (item.posX !== undefined && item.posZ !== undefined) {
    return { x: item.posX, z: item.posZ }
  }
  const zone  = zoneMap[item.zone]
  const angle = (slotIdx / 5) * Math.PI * 2
  const r     = zone.radius * 0.55
  return {
    x: zone.cx + Math.cos(angle) * r,
    z: zone.cz + Math.sin(angle) * r,
  }
}

// ── Item mesh builder (shared by DomeInteriorPage.vue and StationInteriorPage.vue) ──

export function buildItemMesh(presetKey: string, colorHex: string): THREE.Group {
  const col   = new THREE.Color(colorHex)
  const group = new THREE.Group()

  const glow = (r: number, y: number, opacity = 0.20): THREE.Mesh => new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 8),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
  )

  switch (presetKey) {
    case 'beacon': {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 4.2, 7), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      post.position.y = 2.1
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.14, 7, 16), new THREE.MeshBasicMaterial({ color: col }))
      ring.position.y = 4.4
      const g = glow(1.0, 0)
      g.position.y = 4.4
      group.add(post, ring, g)
      break
    }
    case 'crystal': {
      const oct = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.1),
        new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.25), shininess: 55, transparent: true, opacity: 0.88 })
      )
      oct.position.y = 2.4
      const g = glow(1.6, 0, 0.14)
      g.position.y = 2.4
      group.add(oct, g)
      break
    }
    case 'planter': {
      const pot   = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 1.4, 8), new THREE.MeshPhongMaterial({ color: 0x5a3518 }))
      pot.position.y = 0.7
      const soil  = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.35, 8), new THREE.MeshPhongMaterial({ color: 0x1a0800 }))
      soil.position.y = 1.57
      const plant = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 6), new THREE.MeshPhongMaterial({ color: col, flatShading: true }))
      plant.position.y = 3.0
      group.add(pot, soil, plant)
      break
    }
    case 'solar-array': {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.14, 2.2), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      frame.rotation.x = -0.35
      frame.position.y = 1.8
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 2.0), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.08) }))
      panel.rotation.x = -0.35
      panel.position.y = 1.87
      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), new THREE.MeshPhongMaterial({ color: 0x334455 }))
      post2.position.y = 0.8
      group.add(frame, panel, post2)
      break
    }
    case 'monument': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.8, 8), new THREE.MeshPhongMaterial({ color: 0x2a3a4a }))
      base.position.y = 0.4
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4.5, 7), new THREE.MeshPhongMaterial({ color: col }))
      shaft.position.y = 3.0
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 5), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.22) }))
      cap.position.y = 5.9
      const g = glow(0.9, 0, 0.18)
      g.position.y = 5.9
      group.add(base, shaft, cap, g)
      break
    }
    case 'archive-node': {
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 2.2), new THREE.MeshPhongMaterial({ color: 0x162440, emissive: 0x001133, emissiveIntensity: 0.3 }))
      box.position.y = 1.4
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.24, 2.84, 2.24)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.7 }))
      edge.position.y = 1.4
      const g = glow(1.4, 1.4, 0.10)
      group.add(box, edge, g)
      break
    }
    case 'water-filter': {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.2, 10), new THREE.MeshPhongMaterial({ color: 0x0a1e3a, shininess: 30 }))
      tank.position.y = 1.6
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.09, 6, 16), new THREE.MeshBasicMaterial({ color: col }))
      ring2.position.y = 3.0
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 6), new THREE.MeshPhongMaterial({ color: 0x334455 }))
      pipe.rotation.z = 0.3
      pipe.position.set(1.4, 0.8, 0)
      group.add(tank, ring2, pipe)
      break
    }
    case 'art-sphere': {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 18, 18),
        new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.18), shininess: 60 })
      )
      sphere.position.y = 2.2
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.8, 7), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      stand.position.y = 0.9
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 }))
      orbit.position.y = 2.2
      orbit.rotation.x = 0.6
      const g = glow(2.0, 2.2, 0.10)
      group.add(sphere, stand, orbit, g)
      break
    }
    case 'comms-relay': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5, 6), new THREE.MeshPhongMaterial({ color: 0x1a2e3e }))
      cone.position.y = 2.5
      for (const ry of [1.6, 3.2]) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7 }))
        r.position.y = ry; r.rotation.x = Math.PI / 2
        group.add(r)
      }
      const g = glow(0.8, 5.2, 0.22)
      g.position.y = 5.2
      group.add(cone, g)
      break
    }
    case 'seed-vault': {
      const vault = new THREE.Mesh(new THREE.CapsuleGeometry(1.0, 2.2, 6, 10), new THREE.MeshPhongMaterial({ color: 0x1a2e1a, shininess: 12 }))
      vault.position.y = 2.1
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.35, 10), new THREE.MeshPhongMaterial({ color: col }))
      lid.position.y = 3.45
      const g = glow(1.2, 2.1, 0.12)
      group.add(vault, lid, g)
      break
    }
    case 'decon-site-marker': {
      // Warning-post marker, colored by decon_projects.status at attach time.
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.6, 6), new THREE.MeshPhongMaterial({ color: 0x2a2a2a }))
      post.position.y = 1.3
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.25), flatShading: true }))
      pennant.rotation.z = Math.PI / 2
      pennant.position.set(0.5, 2.3, 0)
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 }))
      ring3.rotation.x = Math.PI / 2
      ring3.position.y = 0.05
      const g = glow(1.0, 0.05, 0.14)
      group.add(post, pennant, ring3, g)
      break
    }
    default: {
      // Generic orb
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.2) }))
      sphere.position.y = 1.0
      group.add(sphere)
    }
  }

  // Point light per item — keeps the surrounding area lit
  const pl = new THREE.PointLight(col.getHex(), 0.5, 14)
  pl.position.y = 2.0
  group.add(pl)

  return group
}""",
    desc="add zoneMap param to autoPosition(); add exported buildItemMesh()",
)


# ─────────────────────────────────────────────────────────────────────────────
# 4. src/pages/DomeInteriorPage.vue — remove local buildItemMesh, import the
#    shared one from settlement-items.ts instead
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/pages/DomeInteriorPage.vue",
    old="""import {
  useSettlementItems,
  ITEM_MESH_PRESETS,
  ZONE_POSITIONS,
  autoPosition,
  type ItemAcquisitionType,
  type SettlementItem,
} from 'src/lib/settlement-items'""",
    new="""import {
  useSettlementItems,
  ITEM_MESH_PRESETS,
  ZONE_POSITIONS,
  autoPosition,
  buildItemMesh,
  type ItemAcquisitionType,
  type SettlementItem,
} from 'src/lib/settlement-items'""",
    desc="import shared buildItemMesh instead of defining it locally",
)

apply_edit(
    "src/pages/DomeInteriorPage.vue",
    old="""// ── Mesh builders ──────────────────────────────────────────────────────────────

function buildItemMesh(presetKey: string, colorHex: string): THREE.Group {
  const col   = new THREE.Color(colorHex)
  const group = new THREE.Group()

  const glow = (r: number, y: number, opacity = 0.20): THREE.Mesh => new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 8),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
  )

  switch (presetKey) {
    case 'beacon': {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 4.2, 7), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      post.position.y = 2.1
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.14, 7, 16), new THREE.MeshBasicMaterial({ color: col }))
      ring.position.y = 4.4
      const g = glow(1.0, 0)
      g.position.y = 4.4
      group.add(post, ring, g)
      break
    }
    case 'crystal': {
      const oct = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.1),
        new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.25), shininess: 55, transparent: true, opacity: 0.88 })
      )
      oct.position.y = 2.4
      const g = glow(1.6, 0, 0.14)
      g.position.y = 2.4
      group.add(oct, g)
      break
    }
    case 'planter': {
      const pot   = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 1.4, 8), new THREE.MeshPhongMaterial({ color: 0x5a3518 }))
      pot.position.y = 0.7
      const soil  = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.35, 8), new THREE.MeshPhongMaterial({ color: 0x1a0800 }))
      soil.position.y = 1.57
      const plant = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 6), new THREE.MeshPhongMaterial({ color: col, flatShading: true }))
      plant.position.y = 3.0
      group.add(pot, soil, plant)
      break
    }
    case 'solar-array': {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.14, 2.2), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      frame.rotation.x = -0.35
      frame.position.y = 1.8
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 2.0), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.08) }))
      panel.rotation.x = -0.35
      panel.position.y = 1.87
      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), new THREE.MeshPhongMaterial({ color: 0x334455 }))
      post2.position.y = 0.8
      group.add(frame, panel, post2)
      break
    }
    case 'monument': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.8, 8), new THREE.MeshPhongMaterial({ color: 0x2a3a4a }))
      base.position.y = 0.4
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4.5, 7), new THREE.MeshPhongMaterial({ color: col }))
      shaft.position.y = 3.0
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 5), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.22) }))
      cap.position.y = 5.9
      const g = glow(0.9, 0, 0.18)
      g.position.y = 5.9
      group.add(base, shaft, cap, g)
      break
    }
    case 'archive-node': {
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 2.2), new THREE.MeshPhongMaterial({ color: 0x162440, emissive: 0x001133, emissiveIntensity: 0.3 }))
      box.position.y = 1.4
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.24, 2.84, 2.24)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.7 }))
      edge.position.y = 1.4
      const g = glow(1.4, 1.4, 0.10)
      group.add(box, edge, g)
      break
    }
    case 'water-filter': {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.2, 10), new THREE.MeshPhongMaterial({ color: 0x0a1e3a, shininess: 30 }))
      tank.position.y = 1.6
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.09, 6, 16), new THREE.MeshBasicMaterial({ color: col }))
      ring2.position.y = 3.0
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 6), new THREE.MeshPhongMaterial({ color: 0x334455 }))
      pipe.rotation.z = 0.3
      pipe.position.set(1.4, 0.8, 0)
      group.add(tank, ring2, pipe)
      break
    }
    case 'art-sphere': {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 18, 18),
        new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.18), shininess: 60 })
      )
      sphere.position.y = 2.2
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.8, 7), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      stand.position.y = 0.9
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 }))
      orbit.position.y = 2.2
      orbit.rotation.x = 0.6
      const g = glow(2.0, 2.2, 0.10)
      group.add(sphere, stand, orbit, g)
      break
    }
    case 'comms-relay': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5, 6), new THREE.MeshPhongMaterial({ color: 0x1a2e3e }))
      cone.position.y = 2.5
      for (const ry of [1.6, 3.2]) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7 }))
        r.position.y = ry; r.rotation.x = Math.PI / 2
        group.add(r)
      }
      const g = glow(0.8, 5.2, 0.22)
      g.position.y = 5.2
      group.add(cone, g)
      break
    }
    case 'seed-vault': {
      const vault = new THREE.Mesh(new THREE.CapsuleGeometry(1.0, 2.2, 6, 10), new THREE.MeshPhongMaterial({ color: 0x1a2e1a, shininess: 12 }))
      vault.position.y = 2.1
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.35, 10), new THREE.MeshPhongMaterial({ color: col }))
      lid.position.y = 3.45
      const g = glow(1.2, 2.1, 0.12)
      group.add(vault, lid, g)
      break
    }
    case 'decon-site-marker': {
      // Warning-post marker, colored by decon_projects.status at attach time.
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.6, 6), new THREE.MeshPhongMaterial({ color: 0x2a2a2a }))
      post.position.y = 1.3
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.25), flatShading: true }))
      pennant.rotation.z = Math.PI / 2
      pennant.position.set(0.5, 2.3, 0)
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 }))
      ring3.rotation.x = Math.PI / 2
      ring3.position.y = 0.05
      const g = glow(1.0, 0.05, 0.14)
      group.add(post, pennant, ring3, g)
      break
    }
    default: {
      // Generic orb
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.2) }))
      sphere.position.y = 1.0
      group.add(sphere)
    }
  }

  // Point light per item — keeps the surrounding area lit
  const pl = new THREE.PointLight(col.getHex(), 0.5, 14)
  pl.position.y = 2.0
  group.add(pl)

  return group
}

// ── Scene ─────────────────────────────────────────────────────────────────────""",
    new="""// ── Scene ─────────────────────────────────────────────────────────────────────""",
    desc="remove local buildItemMesh (now shared via settlement-items.ts)",
)


# ─────────────────────────────────────────────────────────────────────────────
# 5. src/router/routes.ts — new station-interior route
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/router/routes.ts",
    old="""      {
        path: 'station/:stationId?',
        name: 'station',
        component: () => import('src/pages/StationPage.vue'),
        meta: { title: 'Station Builder' },
        props: true,
      },""",
    new="""      {
        path: 'station/:stationId?',
        name: 'station',
        component: () => import('src/pages/StationPage.vue'),
        meta: { title: 'Station Builder' },
        props: true,
      },
      {
        // Twin-cylinder station interior — bodyless orbital addresses (exo-orbital-v1,
        // exo-stellar-orbital-v1, exo-lunar-orbital-v1, black-hole zones) and real
        // no-solid-crust planets (gas giants, magma-ocean/lava worlds) land here
        // instead of SurfaceViewPage's flat-terrain dome scene.
        path: 'station-interior/:hostname/:refName?',
        name: 'station-interior',
        component: () => import('src/pages/StationInteriorPage.vue'),
        meta: { title: 'Station Interior' },
        props: true,
      },""",
    desc="add station-interior route",
)


# ─────────────────────────────────────────────────────────────────────────────
# 6. src/pages/GalaxyPage.vue — classify before descending to a planet surface
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/pages/GalaxyPage.vue",
    old="""import { BLACK_HOLE_CATALOG, bhColorHex } from 'src/data/black-holes'""",
    new="""import { BLACK_HOLE_CATALOG, bhColorHex } from 'src/data/black-holes'
import { getSurfaceType, NO_GROUND_SURFACE_TYPES } from 'src/lib/surface-classify'""",
    desc="import surface-classify helpers",
)

apply_edit(
    "src/pages/GalaxyPage.vue",
    old="""function enterPlanetSurface(pl: Planet) {
  if (enteringPlanet.value) return
  enteringPlanet.value = true
  controls.enabled = false

  const targetRoute = `/surface/${encodeURIComponent(pl.hostname)}/${encodeURIComponent(pl.pl_name)}`

  // Brief zoom toward the planet before the descent transition fires. GalaxyPage
  // and SurfaceViewPage now share the same renderer/camera, so this reads as one
  // continuous approach — an iris wipe covers the pageGroup swap underneath
  // rather than the WormholePortal, which is reserved for lateral/long-haul jumps.
  const pMesh = systemObjects.find(
    o => (o as THREE.Mesh).isMesh && o.userData.type === 'planet' && o.userData.planet?.pl_name === pl.pl_name
  ) as THREE.Mesh | undefined

  if (pMesh) {
    const p      = pMesh.position.clone()
    const sc     = p.clone().project(camera!)
    const ox     = (sc.x + 1) / 2 * 100
    const oy     = (1 - sc.y) / 2 * 100
    const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
    gsap.to(controls.target, {
      duration: 0.8, x: p.x, y: p.y, z: p.z,
      ease: 'power2.in', onUpdate: () => controls.update(),
      onComplete: () => { void descendToPlanetSurface(targetRoute, ox, oy, bearing) },
    })
    gsap.to(camera.position, {
      duration: 0.8, x: p.x, y: p.y, z: p.z + 2,
      ease: 'power2.in', onUpdate: () => controls.update(),
    })
  } else {
    void descendToPlanetSurface(targetRoute, 50, 50, 0)
  }
}""",
    new="""function enterPlanetSurface(pl: Planet) {
  if (enteringPlanet.value) return
  enteringPlanet.value = true
  controls.enabled = false

  // Brief zoom toward the planet before the descent transition fires. GalaxyPage
  // and SurfaceViewPage now share the same renderer/camera, so this reads as one
  // continuous approach — an iris wipe covers the pageGroup swap underneath
  // rather than the WormholePortal, which is reserved for lateral/long-haul jumps.
  // (Target route is resolved inside descendToPlanetSurface, once surface-type
  // classification returns — kept out of this function so the classification
  // fetch never delays the zoom's visual feedback.)
  const pMesh = systemObjects.find(
    o => (o as THREE.Mesh).isMesh && o.userData.type === 'planet' && o.userData.planet?.pl_name === pl.pl_name
  ) as THREE.Mesh | undefined

  if (pMesh) {
    const p      = pMesh.position.clone()
    const sc     = p.clone().project(camera!)
    const ox     = (sc.x + 1) / 2 * 100
    const oy     = (1 - sc.y) / 2 * 100
    const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
    gsap.to(controls.target, {
      duration: 0.8, x: p.x, y: p.y, z: p.z,
      ease: 'power2.in', onUpdate: () => controls.update(),
      onComplete: () => { void descendToPlanetSurface(pl, ox, oy, bearing) },
    })
    gsap.to(camera.position, {
      duration: 0.8, x: p.x, y: p.y, z: p.z + 2,
      ease: 'power2.in', onUpdate: () => controls.update(),
    })
  } else {
    void descendToPlanetSurface(pl, 50, 50, 0)
  }
}""",
    desc="enterPlanetSurface: pass Planet through instead of a pre-built route string",
)

apply_edit(
    "src/pages/GalaxyPage.vue",
    old="""async function descendToPlanetSurface(targetRoute: string, ox: number, oy: number, bearing: number) {
  await transition.depart(ox, oy, 'iris', bearing)
  void router.push(targetRoute)
}""",
    new="""async function descendToPlanetSurface(pl: Planet, ox: number, oy: number, bearing: number) {
  const surfaceType = await getSurfaceType(pl.pl_name)
  const targetRoute = (surfaceType != null && NO_GROUND_SURFACE_TYPES.has(surfaceType))
    ? `/station-interior/${encodeURIComponent(pl.hostname)}/${encodeURIComponent(pl.pl_name)}?reason=no-solid-crust&surfaceType=${surfaceType}`
    : `/surface/${encodeURIComponent(pl.hostname)}/${encodeURIComponent(pl.pl_name)}`
  await transition.depart(ox, oy, 'iris', bearing)
  void router.push(targetRoute)
}""",
    desc="descendToPlanetSurface: classify and pick the real target route",
)


# ─────────────────────────────────────────────────────────────────────────────
# 7. src/pages/ClusterSystemPage.vue — branch before descending to a cluster
#    planet with no solid ground
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/pages/ClusterSystemPage.vue",
    old="""import { disposeScene }                          from 'src/lib/three-utils'""",
    new="""import { disposeScene }                          from 'src/lib/three-utils'
import { clusterPlanetHasNoSolidGround }          from 'src/lib/surface-classify'""",
    desc="import clusterPlanetHasNoSolidGround",
)

apply_edit(
    "src/pages/ClusterSystemPage.vue",
    old="""// ── Navigation ─────────────────────────────────────────────────────────────────
async function descendToPlanet(p: ClusterPlanet) {
  const mesh = planetMeshes.value.find(m => m.userData.planetId === p.id)""",
    new="""// ── Navigation ─────────────────────────────────────────────────────────────────
async function descendToPlanet(p: ClusterPlanet) {
  if (clusterPlanetHasNoSolidGround(p.type)) {
    void router.push({
      name: 'station-interior',
      params: { hostname: systemLabel.value, refName: p.id },
      query: {
        reason:      'no-solid-crust',
        surfaceType: p.type,
        clusterSlug: clusterSlug.value,
        memberId:    memberId.value,
        systemIdx:   systemIdx.value,
      },
    })
    return
  }

  const mesh = planetMeshes.value.find(m => m.userData.planetId === p.id)""",
    desc="descendToPlanet: branch to station-interior before any camera tween",
)


# ─────────────────────────────────────────────────────────────────────────────
# 8. src/pages/SurfaceViewPage.vue — the real backstop
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/pages/SurfaceViewPage.vue",
    old="""import {
  buildClimateProfile, formatTempK, formatRangeK, usesFahrenheit,
} from 'src/lib/planet-climate'""",
    new="""import {
  buildClimateProfile, formatTempK, formatRangeK, usesFahrenheit,
} from 'src/lib/planet-climate'
import { hasNoSolidGround } from 'src/lib/surface-classify'""",
    desc="import hasNoSolidGround",
)

apply_edit(
    "src/pages/SurfaceViewPage.vue",
    old="""  await galaxyStore.loadData()

  // Log surface/moon visit for smart preset generation in MintStylePage
  logNavEvent(isMoonView.value ? 'moon_view' : 'surface_view', {""",
    new="""  await galaxyStore.loadData()

  // No-solid-ground backstop: bodyless/malformed addresses (planet.value is null
  // for ANY unresolved hostname/planetName, from any entry path — deep link,
  // bookmark, hand-edited URL), and real gas-giant/magma-ocean/lava worlds, don't
  // get the flat-terrain dome scene. See src/lib/surface-classify.ts.
  if (!isMoonView.value) {
    const noGround = !planet.value || await hasNoSolidGround(planetName.value)
    if (noGround) {
      const reason = planet.value ? 'no-solid-crust' : 'bodyless-orbital'
      void router.replace(
        `/station-interior/${encodeURIComponent(hostname.value)}/${encodeURIComponent(planetName.value)}?reason=${reason}`
      )
      return
    }
  }

  // Log surface/moon visit for smart preset generation in MintStylePage
  logNavEvent(isMoonView.value ? 'moon_view' : 'surface_view', {""",
    desc="add no-solid-ground backstop before initScene()",
)


# ─────────────────────────────────────────────────────────────────────────────
# 9. src/pages/GalacticCenterPage.vue — claim redirects to a scene, not just /mint
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/pages/GalacticCenterPage.vue",
    old="""  void router.push(`/mint?mode=bh-orbital&bh=Sgr-A*&zone=${encodeURIComponent(zone.id)}&addr=${encodeURIComponent(zone.exoloc_address)}`)""",
    new="""  void router.push(`/station-interior/Sgr-A*/${encodeURIComponent(zone.id)}?reason=bodyless-orbital&zone=${encodeURIComponent(zone.id)}&addr=${encodeURIComponent(zone.exoloc_address)}`)""",
    desc="claimSettlement: redirect to the station-interior scene instead of only /mint",
)


# ─────────────────────────────────────────────────────────────────────────────
# 10. src/pages/StationPage.vue — "Enter Station" CTA on the success screen
# ─────────────────────────────────────────────────────────────────────────────

apply_edit(
    "src/pages/StationPage.vue",
    old="""          <div class="row q-gutter-sm q-mt-md justify-center">
            <q-btn unelevated color="cyan-8" icon="scatter_plot" label="Milky Way Map"
              @click="$router.push('/galaxy')" />
            <q-btn outline color="blue-grey-5" label="Build another"
              @click="resetWizard" />
          </div>""",
    new="""          <div class="row q-gutter-sm q-mt-md justify-center">
            <q-btn unelevated color="cyan-8" icon="mdi-space-station" label="Enter Station"
              @click="$router.push(`/station-interior/${encodeURIComponent(form.hostname)}/${encodeURIComponent(form.planetName)}`)" />
            <q-btn unelevated color="cyan-8" icon="scatter_plot" label="Milky Way Map"
              @click="$router.push('/galaxy')" />
            <q-btn outline color="blue-grey-5" label="Build another"
              @click="resetWizard" />
          </div>""",
    desc="mint-success panel: add Enter Station button",
)


# ─────────────────────────────────────────────────────────────────────────────
# 11. New file: src/pages/StationInteriorPage.vue
# ─────────────────────────────────────────────────────────────────────────────

STATION_INTERIOR_VUE = r'''<template>
  <q-page class="si-page">
    <canvas ref="canvasEl" class="si-canvas" @mousemove="onMouseMove" @click="onCanvasClick" />

    <!-- ── Top bar ──────────────────────────────────────────────────────── -->
    <div class="si-topbar">
      <q-btn flat dense size="xs" color="blue-grey-4" icon="arrow_back"
        @click="goBack" label="Back" />
      <div class="si-topbar-center">
        <q-icon name="mdi-space-station" size="12px" color="cyan-5" class="q-mr-xs" />
        <span class="si-title">STATION INTERIOR</span>
        <span class="si-hostname q-ml-sm">{{ hostname }}</span>
      </div>
      <div class="si-exoloc">{{ exolocation }}</div>
    </div>

    <!-- ── Hover tooltip ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="hoveredItem" class="si-tooltip q-pa-sm" :style="tooltipStyle">
        <div class="row items-center q-mb-xs">
          <div class="si-tt-dot q-mr-sm" :style="{ background: hoveredItem.color }" />
          <span class="text-subtitle2 text-blue-grey-1">{{ hoveredItem.label }}</span>
        </div>
        <div class="text-caption text-cyan-5 q-mb-xs">{{ hoveredItem.zone }} · {{ TYPE_LABELS[hoveredItem.type] }}</div>
        <div class="text-caption text-blue-grey-4">{{ hoveredItem.description }}</div>
      </div>
    </Transition>

    <!-- ── Zone labels (toggleable) ────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showZones" class="si-zone-overlay">
        <div v-for="(pos, zone) in CYLINDER_ZONE_POSITIONS" :key="zone"
          class="si-zone-label"
          :style="zoneScreenPos(pos)"
        >{{ zone }}</div>
      </div>
    </Transition>

    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="!sceneReady" class="si-loading column items-center justify-center">
        <q-spinner-orbit color="cyan" size="44px" />
        <div class="text-caption text-blue-grey-5 q-mt-sm">Docking with station…</div>
      </div>
    </Transition>

    <!-- ── Bottom HUD ───────────────────────────────────────────────────── -->
    <div class="si-hud">
      <div class="row items-center q-gutter-x-sm no-wrap">
        <q-btn flat dense round icon="help_outline" color="blue-grey-5" size="sm"
          @click="showHints = !showHints" title="Controls" />
        <q-btn flat dense round
          icon="place" :color="showZones ? 'cyan-5' : 'blue-grey-6'"
          size="sm" title="Toggle zone labels"
          @click="showZones = !showZones" />
        <q-separator vertical color="blue-grey-8" />
        <span class="si-hud-count text-caption text-blue-grey-5">
          {{ items.length }} item{{ items.length !== 1 ? 's' : '' }} placed
        </span>
        <q-separator vertical color="blue-grey-8" />
        <q-btn flat dense round icon="exit_to_app" color="blue-grey-4" size="sm"
          @click="goBack" title="Exit station" />
      </div>
    </div>

    <!-- ── Control hints ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showHints" class="si-hints q-pa-sm">
        <div class="si-hint-row"><q-icon name="mouse" size="11px" class="q-mr-xs" />Drag to look around</div>
        <div class="si-hint-row"><q-icon name="scroll" size="11px" class="q-mr-xs" />Scroll / pinch to zoom</div>
        <div class="si-hint-row"><q-icon name="keyboard" size="11px" class="q-mr-xs" />WASD / arrows to walk</div>
        <div class="si-hint-row"><q-icon name="ads_click" size="11px" class="q-mr-xs" />Click item to inspect</div>
      </div>
    </Transition>

    <!-- ── Inventory panel ─────────────────────────────────────────────── -->
    <SettlementInventory :settlement-key="settlementKey" />

    <!-- ── Item inspector ───────────────────────────────────────────────── -->
    <Transition name="si-inspect-slide">
      <div v-if="selectedItem" class="si-inspect-panel">
        <div class="si-inspect-header">
          <div class="si-inspect-dot" :style="{ background: selectedItem.color }" />
          <span class="si-inspect-title">{{ selectedItem.label }}</span>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5" @click="closeInspector" title="Close" />
        </div>
        <div class="si-inspect-body">
          <div class="si-inspect-meta">
            <span class="si-inspect-chip">{{ selectedItem.zone }}</span>
            <span class="si-inspect-chip">{{ TYPE_LABELS[selectedItem.type] }}</span>
          </div>
          <div class="si-inspect-desc">{{ selectedItem.description }}</div>
          <div v-if="selectedItem.community" class="si-inspect-prov">
            <q-icon name="groups" size="10px" class="q-mr-xs" />{{ selectedItem.community }}
          </div>
          <div v-if="selectedItem.donorKey" class="si-inspect-prov">
            <q-icon name="swap_horiz" size="10px" class="q-mr-xs" />From {{ selectedItem.donorKey }}
          </div>
          <div v-if="selectedItem.airdropBundle" class="si-inspect-prov">
            <q-icon name="bolt" size="10px" class="q-mr-xs" />{{ selectedItem.airdropBundle }}
          </div>
          <div v-if="selectedItem.buildCost" class="si-inspect-prov">
            <q-icon name="build" size="10px" class="q-mr-xs" />{{ selectedItem.buildCost }} eco-ops pts
          </div>
        </div>
        <div class="si-inspect-footer">
          <q-btn flat dense icon="delete_outline" label="Remove from settlement" color="red-5" size="sm"
            @click="confirmRemoveSelected" />
        </div>
      </div>
    </Transition>

    <q-dialog v-model="removeConfirmOpen">
      <q-card class="bg-dark text-blue-grey-1" style="min-width:280px">
        <q-card-section>
          <div class="text-subtitle2">Remove "{{ selectedItem?.label }}"?</div>
          <div class="text-caption text-blue-grey-5 q-mt-xs">This cannot be undone.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="removeConfirmOpen = false" />
          <q-btn flat label="Remove" color="red-5" @click="doRemoveSelected" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { surfacePaletteFor, disposeScene, starColorFromTeff } from 'src/lib/three-utils'
import { useGalaxyStore } from 'src/stores/galaxy'
import {
  useSettlementItems,
  CYLINDER_ZONE_POSITIONS,
  autoPosition,
  buildItemMesh,
  type ItemAcquisitionType,
  type SettlementItem,
} from 'src/lib/settlement-items'
import { orbitalKey } from 'src/lib/settlements'
import SettlementInventory from 'src/components/SettlementInventory.vue'

// ── Route ──────────────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()

const hostname    = computed(() => String(route.params.hostname ?? ''))
const refName     = computed(() => String(route.params.refName  ?? ''))
const coordSystem = computed(() => String(route.query.coordSystem ?? 'exo-orbital-v1'))
const isBlackHole = computed(() => hostname.value === 'Sgr-A*' || !!route.query.zone)

// ── Store ──────────────────────────────────────────────────────────────────────

const galaxyStore = useGalaxyStore()
const system      = computed(() => galaxyStore.getSystem(hostname.value) ?? null)

const settlementKey = computed(() => orbitalKey(coordSystem.value, hostname.value, refName.value || undefined))
const exolocation   = computed(() => refName.value
  ? `${coordSystem.value}:${hostname.value}:${refName.value}`
  : `${coordSystem.value}:${hostname.value}`)

const { items, removeItem } = useSettlementItems(settlementKey)

// ── Constants / display ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemAcquisitionType, string> = {
  constructed: 'constructed',
  traded:      'traded',
  generated:   'airdrop',
  'eco-ops':   'eco-ops',
}

const CYL_R   = 70
const CYL_LEN = 200
const CYL_GAP = 60
const CYL_SEP = CYL_R * 2 + CYL_GAP

// ── UI state ──────────────────────────────────────────────────────────────────

const sceneReady = ref(false)
const showHints  = ref(false)
const showZones  = ref(false)

// ── Three.js ──────────────────────────────────────────────────────────────────

const canvasEl = ref<HTMLCanvasElement>()

let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null
let rafId:    number | null = null
let clock:    THREE.Clock

let hullA: THREE.Mesh | null = null
let hullB: THREE.Mesh | null = null
let deckY = 0

const itemMeshes = new Map<string, THREE.Group>()

let raycaster:  THREE.Raycaster
let itemMeshArr: { mesh: THREE.Object3D; id: string }[] = []

interface HoveredItemData {
  label: string
  color: string
  zone: string
  type: ItemAcquisitionType
  description: string
}
const hoveredItem  = ref<HoveredItemData | null>(null)
const tooltipStyle = ref({ left: '0px', top: '0px' })
const mouseNDC     = new THREE.Vector2()

const selectedItem      = ref<SettlementItem | null>(null)
const removeConfirmOpen = ref(false)
let   selectionRing: THREE.Mesh | null = null

const keysDown = new Set<string>()

// ── Scene ─────────────────────────────────────────────────────────────────────

function buildScene() {
  if (!canvasEl.value) return

  const palette = surfacePaletteFor(280)   // no real body → fixed temperate deck tint

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.85

  scene  = new THREE.Scene()
  scene.background = new THREE.Color(0x010510)
  scene.fog        = new THREE.FogExp2(0x010510, 0.006)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800)
  camera.position.set(0, deckY, 40)

  controls = new OrbitControls(camera, canvasEl.value)
  controls.target.set(0, deckY + 4, 0)
  controls.enableDamping  = true
  controls.dampingFactor  = 0.07
  controls.minDistance    = 0.4
  controls.maxDistance    = 120
  controls.minPolarAngle  = 0.06
  controls.maxPolarAngle  = Math.PI * 0.9
  controls.rotateSpeed    = 0.45
  controls.mouseButtons   = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
  controls.touches        = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  controls.update()

  clock     = new THREE.Clock()
  raycaster = new THREE.Raycaster()

  const starColor = isBlackHole.value
    ? new THREE.Color(0xff6a2a)   // accretion-glow tint — never starColorFromTeff(undefined) for a black-hole origin
    : starColorFromTeff(system.value?.st_teff)

  buildLights(starColor)
  buildHullPair()
  buildEndCaps()
  buildConnectingTruss()
  deckY = buildInteriorGround(palette)
  camera.position.set(0, deckY + 6, 40)
  controls.target.set(0, deckY + 4, 0)
  controls.update()
  buildItems()
  buildSelectionRing()

  window.addEventListener('resize', onResize)
  tick()
  sceneReady.value = true
}

function buildSelectionRing() {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.9, 2.5, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ccee, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = deckY + 0.08
  ring.visible = false
  scene!.add(ring)
  selectionRing = ring
}

function buildLights(starColor: THREE.Color) {
  scene!.add(new THREE.AmbientLight(0x0a1828, 1.2))
  scene!.add(new THREE.HemisphereLight(starColor.clone().multiplyScalar(0.3), new THREE.Color(0x020408), 0.6))
  const sun = new THREE.DirectionalLight(starColor, 0.6)
  sun.position.set(30, 80, -20)
  scene!.add(sun)
}

function buildHullPair() {
  const geo = new THREE.CylinderGeometry(CYL_R, CYL_R, CYL_LEN, 32, 1, true)

  hullA = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0x0c1626, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false,
  }))
  hullA.rotation.x = Math.PI / 2
  scene!.add(hullA)

  const wireA = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x2288bb, wireframe: true, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false,
  }))
  wireA.rotation.x = Math.PI / 2
  scene!.add(wireA)

  hullB = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x0c1626, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false,
  }))
  hullB.rotation.x = Math.PI / 2
  hullB.position.x = CYL_SEP
  scene!.add(hullB)

  const wireB = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x2288bb, wireframe: true, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false,
  }))
  wireB.rotation.x = Math.PI / 2
  wireB.position.x = CYL_SEP
  scene!.add(wireB)
}

function buildEndCaps() {
  const capMat = new THREE.MeshBasicMaterial({ color: 0x081018, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  for (const cx of [0, CYL_SEP]) {
    for (const z of [-CYL_LEN / 2, CYL_LEN / 2]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(CYL_R, 32), capMat)
      cap.position.set(cx, 0, z)
      scene!.add(cap)

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 6, 10), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      hub.rotation.x = Math.PI / 2
      hub.position.set(cx, 0, z + (z < 0 ? 3 : -3))
      scene!.add(hub)
    }
  }
}

function buildConnectingTruss() {
  const beamMat = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 30 })
  for (const z of [-CYL_LEN / 2, 0, CYL_LEN / 2]) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, CYL_SEP, 8), beamMat)
    beam.rotation.z = Math.PI / 2
    beam.position.set(CYL_SEP / 2, 0, z)
    scene!.add(beam)

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.4, 6, 20), new THREE.MeshBasicMaterial({ color: 0x0099cc, transparent: true, opacity: 0.5 }))
    ring.position.set(CYL_SEP / 2, 0, z)
    ring.rotation.y = Math.PI / 2
    scene!.add(ring)
  }
}

function buildInteriorGround(palette: ReturnType<typeof surfacePaletteFor>): number {
  const y = -(CYL_R - 6)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, CYL_LEN * 0.8),
    new THREE.MeshPhongMaterial({ color: palette.terrain, shininess: 2 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, y, 0)
  scene!.add(ground)

  const spoke = new THREE.MeshBasicMaterial({ color: 0x0055aa, transparent: true, opacity: 0.14, depthWrite: false })
  for (const z of [-70, -35, 0, 35, 70]) {
    const pts = [new THREE.Vector3(-55, y + 0.05, z), new THREE.Vector3(55, y + 0.05, z)]
    scene!.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), spoke))
  }

  return y
}

function buildItems() {
  for (const g of itemMeshes.values()) scene?.remove(g)
  itemMeshes.clear()
  itemMeshArr = []

  const zoneCount: Record<string, number> = {}

  for (const item of items.value) {
    const slotIdx = zoneCount[item.zone] ?? 0
    zoneCount[item.zone] = slotIdx + 1

    const pos   = autoPosition(item, slotIdx, CYLINDER_ZONE_POSITIONS)
    const group = buildItemMesh(item.meshPreset, item.color)
    group.position.set(pos.x, deckY, pos.z)
    group.name = `item:${item.id}`
    scene!.add(group)
    itemMeshes.set(item.id, group)

    group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) itemMeshArr.push({ mesh: obj, id: item.id })
    })
  }
}

// ── Animation loop ─────────────────────────────────────────────────────────────

function tick() {
  rafId = requestAnimationFrame(tick)

  const t = clock.getElapsedTime()

  if (hullA) hullA.rotation.z = t * 0.06
  if (hullB) hullB.rotation.z = -t * 0.06

  for (const [id, group] of itemMeshes) {
    const item = items.value.find(i => i.id === id)
    if (item?.meshPreset === 'crystal') {
      group.children[0]!.position.y = 2.4 + Math.sin(t * 0.8) * 0.4
      group.children[0]!.rotation.y = t * 0.5
    }
    if (item?.meshPreset === 'art-sphere') {
      const orbit = group.children[2]
      if (orbit) orbit.rotation.z = t * 0.4
    }
  }

  if (selectionRing?.visible) {
    ;(selectionRing.material as THREE.MeshBasicMaterial).opacity = 0.40 + Math.sin(t * 3) * 0.25
    selectionRing.rotation.z = t * 0.6
  }

  if (keysDown.size > 0 && camera && controls) {
    const WALK = 1.1
    const fwd  = new THREE.Vector3()
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize()
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0))
    const delta = new THREE.Vector3()
    if (keysDown.has('KeyW') || keysDown.has('ArrowUp'))    delta.addScaledVector(fwd,   WALK)
    if (keysDown.has('KeyS') || keysDown.has('ArrowDown'))  delta.addScaledVector(fwd,  -WALK)
    if (keysDown.has('KeyA') || keysDown.has('ArrowLeft'))  delta.addScaledVector(right, -WALK)
    if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) delta.addScaledVector(right,  WALK)
    if (delta.lengthSq() > 0) {
      camera.position.add(delta)
      controls.target.add(delta)
    }
  }

  controls?.update()

  // Keep camera within the elongated deck footprint
  if (camera!.position.x < -58) camera!.position.x = -58
  if (camera!.position.x >  58) camera!.position.x =  58
  const halfLen = CYL_LEN * 0.4 - 4
  if (camera!.position.z < -halfLen) camera!.position.z = -halfLen
  if (camera!.position.z >  halfLen) camera!.position.z =  halfLen
  if (camera!.position.y < deckY + 1.2) camera!.position.y = deckY + 1.2
  if (camera!.position.y > deckY + 60)  camera!.position.y = deckY + 60

  if (renderer && scene && camera) renderer.render(scene, camera)
}

// ── Hover ─────────────────────────────────────────────────────────────────────

function onMouseMove(e: MouseEvent) {
  mouseNDC.x =  (e.clientX / window.innerWidth) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / (window.innerHeight - 44)) * 2 + 1
  tooltipStyle.value = { left: (e.clientX + 14) + 'px', top: (e.clientY - 10) + 'px' }

  if (!camera) return
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(itemMeshArr.map(m => m.mesh), false)
  if (hits.length) {
    const hit  = itemMeshArr.find(m => m.mesh === hits[0]!.object)!
    const item = items.value.find(i => i.id === hit.id)
    if (item) {
      hoveredItem.value = {
        label: item.label, color: item.color, zone: item.zone,
        type: item.type, description: item.description,
      }
      return
    }
  }
  hoveredItem.value = null
}

function onCanvasClick() {
  if (!camera) return
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(itemMeshArr.map(m => m.mesh), false)
  if (hits.length) {
    const hit  = itemMeshArr.find(m => m.mesh === hits[0]!.object)!
    const item = items.value.find(i => i.id === hit.id)
    const group = itemMeshes.get(hit.id)
    if (item && group) {
      selectedItem.value = item
      if (selectionRing) {
        selectionRing.position.x = group.position.x
        selectionRing.position.z = group.position.z
        ;(selectionRing.material as THREE.MeshBasicMaterial).color.set(item.color)
        selectionRing.visible = true
      }
      return
    }
  }
  closeInspector()
}

function closeInspector() {
  selectedItem.value = null
  if (selectionRing) selectionRing.visible = false
}

function confirmRemoveSelected() {
  removeConfirmOpen.value = true
}

function doRemoveSelected() {
  if (selectedItem.value) removeItem(selectedItem.value.id)
  removeConfirmOpen.value = false
  closeInspector()
}

// ── Zone screen projections ─────────────────────────────────────────────────────

function zoneScreenPos(pos: { cx: number; cz: number }): { left: string; top: string } {
  if (!camera || !renderer) return { left: '50%', top: '50%' }
  const v = new THREE.Vector3(pos.cx, deckY + 0.5, pos.cz).project(camera)
  const x = ((v.x + 1) / 2) * window.innerWidth
  const y = ((-v.y + 1) / 2) * window.innerHeight
  return { left: x + 'px', top: y + 'px' }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function goBack() {
  if (route.query.clusterSlug && route.query.memberId && route.query.systemIdx) {
    void router.push({
      name: 'cluster-system',
      params: {
        clusterSlug: String(route.query.clusterSlug),
        memberId:    String(route.query.memberId),
        systemIdx:   String(route.query.systemIdx),
      },
    })
    return
  }
  if (isBlackHole.value) {
    void router.push('/galactic-center')
    return
  }
  void router.push('/galaxy')
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

const keydownFn = (e: KeyboardEvent) => {
  keysDown.add(e.code)
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
}
const keyupFn = (e: KeyboardEvent) => keysDown.delete(e.code)

watch(items, () => {
  if (scene) buildItems()
  if (selectedItem.value && !items.value.some(i => i.id === selectedItem.value!.id)) {
    closeInspector()
  }
}, { deep: true })

onMounted(async () => {
  window.addEventListener('keydown', keydownFn)
  window.addEventListener('keyup',   keyupFn)
  await galaxyStore.loadData()
  buildScene()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keydownFn)
  window.removeEventListener('keyup',   keyupFn)
  keysDown.clear()
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  controls?.dispose()
  if (scene) disposeScene(scene)
  renderer?.dispose()
  renderer = null; scene = null; camera = null; controls = null
})
</script>

<style scoped>
.si-page   { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #010510; }
.si-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

.si-topbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 10px;
  padding: 6px 12px;
  background: rgba(0, 5, 18, 0.82);
  border-bottom: 1px solid rgba(0, 100, 160, 0.20);
  backdrop-filter: blur(6px);
}
.si-topbar-center { flex: 1; display: flex; align-items: center; }
.si-title    { font-size: 9px; letter-spacing: 0.18em; color: rgba(0, 180, 220, 0.65); font-family: monospace; }
.si-hostname { font-size: 9px; color: rgba(130, 190, 220, 0.70); font-family: monospace; }
.si-exoloc   { font-size: 8px; color: rgba(60, 100, 140, 0.55); font-family: monospace; }

.si-tooltip {
  position: absolute; z-index: 20; pointer-events: none;
  background: rgba(1, 5, 20, 0.92); border: 1px solid rgba(0, 130, 190, 0.25);
  border-radius: 4px; min-width: 160px; max-width: 220px;
  backdrop-filter: blur(6px);
}
.si-tt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.si-zone-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 8; }
.si-zone-label {
  position: absolute; transform: translate(-50%, -50%);
  font-size: 8px; letter-spacing: 0.12em;
  color: rgba(0, 150, 200, 0.45); font-family: monospace;
  background: rgba(0, 5, 15, 0.50); padding: 2px 5px; border-radius: 2px;
}

.si-loading { position: absolute; inset: 0; background: #010510; z-index: 50; }

.si-hud {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(0, 5, 20, 0.82); border: 1px solid rgba(0, 80, 130, 0.25);
  border-radius: 20px; padding: 5px 14px;
  backdrop-filter: blur(6px);
}
.si-hud-count { font-family: monospace; font-size: 9px; }

.si-hints {
  position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(0, 5, 20, 0.88); border: 1px solid rgba(0, 70, 120, 0.22);
  border-radius: 5px; backdrop-filter: blur(6px);
}
.si-hint-row { display: flex; align-items: center; font-size: 9px; color: rgba(100, 160, 200, 0.70); margin-bottom: 3px; }
.si-hint-row:last-child { margin-bottom: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.20s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.si-inspect-panel {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 240px; z-index: 20;
  background: rgba(1, 5, 20, 0.96);
  border: 1px solid rgba(0, 150, 200, 0.22);
  border-radius: 0 6px 6px 0;
  backdrop-filter: blur(10px);
  display: flex; flex-direction: column;
  max-height: 70vh; overflow: hidden;
}
.si-inspect-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.25);
  background: rgba(0, 8, 28, 0.70);
  flex-shrink: 0;
}
.si-inspect-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.si-inspect-title { font-size: 11px; color: rgba(180, 220, 240, 0.92); letter-spacing: 0.04em; }
.si-inspect-body  { padding: 10px; overflow-y: auto; }
.si-inspect-meta  { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.si-inspect-chip {
  font-size: 8px; padding: 2px 6px; border-radius: 2px; letter-spacing: 0.06em;
  background: rgba(0, 60, 100, 0.30); color: rgba(100, 160, 200, 0.70);
}
.si-inspect-desc { font-size: 10px; color: rgba(140, 190, 220, 0.80); line-height: 1.5; margin-bottom: 8px; }
.si-inspect-prov {
  font-size: 9px; color: rgba(100, 160, 200, 0.60);
  display: flex; align-items: center; gap: 3px; margin-bottom: 4px;
}
.si-inspect-footer { padding: 8px 10px; border-top: 1px solid rgba(0, 60, 100, 0.20); flex-shrink: 0; }

.si-inspect-slide-enter-active, .si-inspect-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.si-inspect-slide-enter-from, .si-inspect-slide-leave-to { transform: translateX(-100%) translateY(-50%); opacity: 0; }
</style>
'''

write_new_file("src/pages/StationInteriorPage.vue", STATION_INTERIOR_VUE)

print()
print("Done. Review with `git diff` before committing — this script does not")
print("commit or push anything itself.")

