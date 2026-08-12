/**
 * settlement-items.ts
 *
 * Data model for objects placed inside a settlement dome.
 *
 * Acquisition types:
 *   constructed — built by the settler using eco-ops activity points
 *   traded      — received from another settlement; carries donor provenance
 *   generated   — awarded via pon.ink airdrop events
 *   eco-ops     — earned through community SHG / field-work milestones
 *   reward      — unlocked by an Impact Profile certificate (see rewards-catalog.ts)
 *
 * Storage (hybrid model):
 *   localStorage  — source of truth for constructed/placed items
 *   pon.ink events (future) — authoritative for generated/traded items
 *                             read-only imported into the same store
 */

import { reactive, computed, watch } from 'vue'
import type { Ref } from 'vue'
import * as THREE from 'three'
import { safeRead, safeWrite, hashStorageKey, encryptForStorage, decryptFromStorage } from './storage-cipher'
import { tryLoadGLTF, ASSET_PATHS } from './asset-loader'
import { disposeScene } from './three-utils'
import { REMEDIATION_METHODS } from 'src/data/pfas-methods-library'
import { supabase } from './supabase'

// ── Core types ────────────────────────────────────────────────────────────────

export type ItemAcquisitionType = 'constructed' | 'traded' | 'generated' | 'eco-ops' | 'reward'

export type ItemZone =
  | 'library'
  | 'water-edge'
  | 'garden'
  | 'gateway'
  | 'courtyard'
  | 'open-floor'

export interface SettlementItem {
  id:              string
  type:            ItemAcquisitionType
  meshPreset:      string        // key into ITEM_MESH_PRESETS
  label:           string
  description:     string
  zone:            ItemZone
  color:           string        // '#RRGGBB'
  posX?:           number        // explicit placement (scene-local to dome centre)
  posZ?:           number
  // Constructed
  buildCost?:      number        // eco-ops points spent
  // Traded
  donorKey?:       string        // donor settlement key
  donorStarColor?: string        // '#RRGGBB' — trail colour on arrival
  donorName?:      string        // human-readable design credit (attribution, not a price)
  // Generated
  airdropBundle?:  string        // pon.ink bundle type
  // Eco-ops
  community?:      string        // name of the SHG / community that earned it
  // Voxel-built presets (see requiresBuilder on ItemMeshPreset) — a settler's own
  // colour-grid sculpture. Absent (or empty) means "not yet designed": buildItemMesh()
  // falls back to that preset's plain placeholder shape.
  voxels?:         VoxelPayload
  // Metadata
  acquiredAt:      number        // unix ms
  settlementKey:   string
}

/**
 * A settler-designed voxel sculpture — a fixed-size grid of colours, nothing else.
 * Deliberately not free text or an image: there's no field here that could carry a
 * slur or an objectionable photo, so unlike a hypothetical "upload your own art"
 * feature, this needs no admin review queue or public-visibility gate. Same trust
 * model as the gift-code sharing below it: peer-to-peer, attribution only.
 */
export interface VoxelPayload {
  size:    number     // grid is size × size × size — fixed at VOXEL_GRID_SIZE for v1
  palette: string[]   // up to VOXEL_MAX_COLORS '#RRGGBB' strings used in this sculpture
  cells:   number[]   // flat array, length size**3; 0 = empty, else a 1-based palette index
}

export const VOXEL_GRID_SIZE  = 5
export const VOXEL_MAX_COLORS = 8

/** True if the payload has valid shape and at least one non-empty cell. */
export function hasVoxelContent(voxels: VoxelPayload | undefined): voxels is VoxelPayload {
  return !!voxels
    && Number.isInteger(voxels.size) && voxels.size > 0
    && Array.isArray(voxels.palette) && voxels.palette.length > 0
    && Array.isArray(voxels.cells) && voxels.cells.length === voxels.size ** 3
    && voxels.cells.some(c => c > 0)
}

// ── Mesh preset catalogue ─────────────────────────────────────────────────────

export interface ItemMeshPreset {
  label:        string
  defaultColor: number           // 0xRRGGBB
  zoneDefault:  ItemZone
  acquiredBy:   ItemAcquisitionType[]
  description:  string
  buildCost?:   number           // for constructed items
  // Acquiring this preset opens a creative dialog (e.g. VoxelBuilderDialog) instead
  // of an instant add — SettlementInventory.vue checks this flag, not a preset key.
  requiresBuilder?: boolean
}

/** Preset key for the free lighting item every settlement is founded with. */
export const STARTER_LIGHT_PRESET = 'starter-lantern'

export const ITEM_MESH_PRESETS: Record<string, ItemMeshPreset> = {
  [STARTER_LIGHT_PRESET]: {
    label: 'Settlement Lantern', defaultColor: 0xffffff, zoneDefault: 'gateway',
    acquiredBy: [],   // system-granted only at founding — never manually acquirable
    description: 'Baseline illumination granted automatically when a settlement is founded. Its colour is unique to this settlement.',
  },
  'beacon': {
    label: 'Signal Beacon', defaultColor: 0x00ddff, zoneDefault: 'gateway',
    acquiredBy: ['constructed', 'generated', 'reward', 'traded'],
    description: 'Broadcasts settlement presence to the conduit network.',
    buildCost: 40,
  },
  'crystal': {
    label: 'Resonance Crystal', defaultColor: 0xcc88ff, zoneDefault: 'courtyard',
    acquiredBy: ['generated', 'eco-ops', 'reward', 'traded'],
    description: 'Harmonic receiver that amplifies ambient light.',
  },
  'planter': {
    label: 'Garden Planter', defaultColor: 0x44bb44, zoneDefault: 'garden',
    acquiredBy: ['constructed', 'eco-ops', 'traded'],
    description: 'Cultivates alien flora adapted to local conditions.',
    buildCost: 20,
  },
  'solar-array': {
    label: 'Solar Array', defaultColor: 0xffcc44, zoneDefault: 'open-floor',
    acquiredBy: ['constructed', 'traded'],
    description: 'Harvests light from the host star.',
    buildCost: 60,
  },
  'monument': {
    label: 'Community Monument', defaultColor: 0x88aacc, zoneDefault: 'courtyard',
    // No 'traded': this attests a real community milestone, so it is not
    // shareable via a gift code the way decorative presets are.
    acquiredBy: ['eco-ops', 'reward'],
    description: 'Marks a community milestone or declaration.',
  },
  'archive-node': {
    label: 'Archive Node', defaultColor: 0x4488ff, zoneDefault: 'library',
    acquiredBy: ['constructed', 'traded', 'reward'],
    description: 'Extends the settlement knowledge base.',
    buildCost: 35,
  },
  'water-filter': {
    label: 'Water Filtration Unit', defaultColor: 0x0055aa, zoneDefault: 'water-edge',
    acquiredBy: ['constructed', 'traded', 'eco-ops'],
    description: 'Improves water quality metrics for this settlement.',
    buildCost: 50,
  },
  'art-sphere': {
    label: 'Art Sphere', defaultColor: 0xff6688, zoneDefault: 'courtyard',
    acquiredBy: ['constructed', 'traded', 'generated'],
    description: 'A settler-built voxel sculpture on display — design it yourself, or receive one as a trade.',
    buildCost: 30,
    requiresBuilder: true,
  },
  'comms-relay': {
    label: 'Comms Relay', defaultColor: 0x55ffaa, zoneDefault: 'gateway',
    acquiredBy: ['constructed', 'generated', 'reward', 'traded'],
    description: 'Strengthens conduit range to neighbouring settlements.',
    buildCost: 45,
  },
  'seed-vault': {
    label: 'Seed Vault', defaultColor: 0xbbcc88, zoneDefault: 'library',
    acquiredBy: ['eco-ops', 'traded', 'reward'],
    description: 'Stores genetic diversity — a symbol of long-term commitment.',
  },
  'decon-site-marker': {
    label: 'Decontamination Site Marker', defaultColor: 0xffaa33, zoneDefault: 'water-edge',
    // No 'traded': this attests real logged citizen-science work, so it is not
    // shareable via a gift code the way decorative presets are.
    acquiredBy: ['eco-ops', 'reward'],
    description: 'Marks a PFAS/PFOA decontamination project logged in your citizen-science work. Color reflects project status at the time it was attached (amber = planning/active, cyan = monitoring, green = complete) — set via the color override when the item is added, not live-updating.',
  },

  // ── Technologies grouping (SPEC_AUTHORED_ART_LIBRARY.md §3–5) ──────────────
  // One entry per REMEDIATION_METHODS[].key (pfas-methods-library.ts) — never
  // hand-duplicated here, so the key can't drift out of sync with the source
  // catalogue. Renders as the generic-orb placeholder (buildItemMesh()'s
  // default case, since no case below matches these keys) until a real .glb
  // exists at ASSET_PATHS.technology(key) — see enhanceTechnologyMesh().
  ...Object.fromEntries(REMEDIATION_METHODS.map((m): [string, ItemMeshPreset] => [m.key, {
    label: m.name,
    defaultColor: m.media === 'water' ? 0x2288cc : m.media === 'soil' ? 0x996633 : 0x55aa88,
    zoneDefault: m.media === 'soil' ? 'garden' : 'water-edge',
    // Self-selected by the settlement owner to feature on their public page
    // (see settlement_profiles.technology_keys) — not a certificate/effort
    // gate like the reward-only presets above.
    acquiredBy: ['eco-ops'],
    description: m.mechanism,
  }])),
}

// ── Zone world positions (relative to dome centre at ground level) ────────────
// Match interior scene layout: library at (0,−18), water at (36,−28),
// garden deeper in, gateway near entrance (+Z side), courtyard in the middle.

export const ZONE_POSITIONS: Record<ItemZone, { cx: number; cz: number; radius: number }> = {
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
}

/** Deterministic zone position for an item (no explicit posX/Z set). */
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

/**
 * How many items get their own dynamic point light. Beyond this the meshes still
 * render in full — they just rely on the scene's existing lighting, since every
 * additional PointLight costs a real-time shading pass on every lit material.
 */
export const MAX_ITEM_LIGHTS = 12

/**
 * One InstancedMesh cube per non-empty voxel cell — used both for the placed
 * art-sphere mesh (below) and the VoxelBuilderDialog's live preview, so the two
 * always render identically. Centered on the group's local origin; callers
 * position/scale the returned mesh as needed.
 */
export function buildVoxelInstancedMesh(voxels: VoxelPayload): THREE.InstancedMesh {
  const { size, palette, cells } = voxels
  const cellSize = 1
  const offset = (size - 1) / 2

  const filled: { x: number; y: number; z: number; color: THREE.Color }[] = []
  for (let i = 0; i < cells.length; i++) {
    const paletteIdx = cells[i]!
    if (paletteIdx <= 0) continue
    const hex = palette[paletteIdx - 1]
    if (!hex) continue
    const x = i % size
    const y = Math.floor(i / size) % size
    const z = Math.floor(i / (size * size))
    filled.push({ x: x - offset, y: y - offset, z: z - offset, color: new THREE.Color(hex) })
  }

  const geometry = new THREE.BoxGeometry(cellSize * 0.92, cellSize * 0.92, cellSize * 0.92)
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 40 })
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(filled.length, 1))

  const m = new THREE.Matrix4()
  filled.forEach((cell, idx) => {
    m.makeTranslation(cell.x * cellSize, cell.y * cellSize, cell.z * cellSize)
    mesh.setMatrixAt(idx, m)
    mesh.setColorAt(idx, cell.color)
  })
  mesh.count = filled.length
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.instanceMatrix.needsUpdate = true

  return mesh
}

export function buildItemMesh(presetKey: string, colorHex: string, withLight = true, voxels?: VoxelPayload): THREE.Group {
  const col   = new THREE.Color(colorHex)
  const group = new THREE.Group()

  const glow = (r: number, y: number, opacity = 0.20): THREE.Mesh => new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 8),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
  )

  switch (presetKey) {
    case STARTER_LIGHT_PRESET: {
      const post  = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.0, 6), new THREE.MeshPhongMaterial({ color: 0x2a2a2a }))
      post.position.y = 1.5
      const shade = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 0),
        new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.45), transparent: true, opacity: 0.88 })
      )
      shade.position.y = 3.1
      const g = glow(1.1, 3.1, 0.24)
      group.add(post, shade, g)
      break
    }
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
      // A settler's voxel sculpture, on display — falls back to a plain sphere
      // placeholder for items with no design yet (freshly traded/generated, or
      // pre-dating this feature).
      let display: THREE.Object3D
      if (hasVoxelContent(voxels)) {
        display = buildVoxelInstancedMesh(voxels)
        display.scale.setScalar(2.6 / voxels.size)   // fit the grid to roughly the old sphere's footprint
      } else {
        display = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 18, 18),
          new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.18), shininess: 60 })
        )
      }
      display.position.y = 2.2
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.8, 7), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      stand.position.y = 0.9
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 }))
      orbit.position.y = 2.2
      orbit.rotation.x = 0.6
      const g = glow(2.0, 2.2, 0.10)
      group.add(display, stand, orbit, g)
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

  // Point light per item — keeps the surrounding area lit. Callers cap how many
  // items get one, since every light costs a real-time shading pass.
  if (withLight) {
    const pl = new THREE.PointLight(col.getHex(), 0.5, 14)
    pl.position.y = 2.0
    group.add(pl)
  }

  return group
}

/**
 * After buildItemMesh() has already built and (typically) been added to the
 * scene, try to swap its procedural placeholder children for an authored
 * .glb — see ASSET_PATHS.settlementItem in asset-loader.ts for the exact
 * drop-in path per preset key. No-op (resolves false, group left untouched)
 * until that file actually exists, so this is safe to call unconditionally
 * for every item.
 *
 * Keeps the group's own PointLight child (if buildItemMesh added one) since
 * an authored model isn't expected to carry its own light — the point light
 * still lands at y=2.0 regardless of the swapped-in model's proportions.
 *
 * Callers that registered this group's meshes for hover/raycasting (e.g.
 * DomeInteriorPage.vue's itemMeshArr) need to re-run that registration when
 * this resolves true, since the previously-registered procedural meshes are
 * disposed and no longer in the scene graph.
 */
export async function enhanceItemMeshWithAsset(group: THREE.Group, presetKey: string): Promise<boolean> {
  const gltf = await tryLoadGLTF(ASSET_PATHS.settlementItem(presetKey))
  if (!gltf) return false

  const keptLight = group.children.find(c => (c as THREE.PointLight).isPointLight)
  for (const child of [...group.children]) {
    group.remove(child)
    if (child !== keptLight) disposeScene(child)
  }

  group.add(gltf.scene)
  if (keptLight) group.add(keptLight)
  return true
}

/**
 * Same swap-in as enhanceItemMeshWithAsset(), but for the Technologies
 * grouping specifically (SPEC_AUTHORED_ART_LIBRARY.md) — a distinct asset
 * folder (ASSET_PATHS.technology, not settlementItem) since these represent
 * real, named remediation equipment rather than abstract settlement decor
 * and get their own art direction. methodKey matches REMEDIATION_METHODS[].key.
 */
export async function enhanceTechnologyMesh(group: THREE.Group, methodKey: string): Promise<boolean> {
  const gltf = await tryLoadGLTF(ASSET_PATHS.technology(methodKey))
  if (!gltf) return false

  const keptLight = group.children.find(c => (c as THREE.PointLight).isPointLight)
  for (const child of [...group.children]) {
    group.remove(child)
    if (child !== keptLight) disposeScene(child)
  }

  group.add(gltf.scene)
  if (keptLight) group.add(keptLight)
  return true
}

// ── Per-settlement colour ─────────────────────────────────────────────────────
// Deterministic hue from the settlement key, so every settlement's starter
// lantern reads as visually distinct rather than one fixed stock colour.

function settlementHue(sk: string): number {
  const h = parseInt(hashStorageKey(sk), 36)
  return (h % 360) / 360
}

export function starterLightColorHex(sk: string): string {
  const c = new THREE.Color()
  c.setHSL(settlementHue(sk), 0.72, 0.58)
  return '#' + c.getHexString()
}

/**
 * Colour for the nth item of an applied theme pack. Hue-shifts off the same
 * per-settlement base as the starter lantern, so a pack reads as belonging to
 * this settlement rather than dropping in a stock palette.
 */
export function themePackItemColorHex(sk: string, index: number): string {
  const c = new THREE.Color()
  c.setHSL((settlementHue(sk) + index * 0.055) % 1, 0.66, 0.52 + (index % 3) * 0.05)
  return '#' + c.getHexString()
}

// ── Gift codes (peer-to-peer item sharing) ────────────────────────────────────
// A design travels between two browsers as an opaque copyable string. Uses the
// same site-wide storage cipher (its seed is a fixed constant, not per-browser,
// so a code made in one browser decodes in any other). This is attribution and
// distribution only — there is no price, ledger, or transfer of ownership.

export interface GiftCodePayload {
  meshPreset:     string
  zone:           ItemZone
  color:          string
  donorKey:       string
  donorStarColor: string
  donorName?:     string
  voxels?:        VoxelPayload
}

export function exportItemGiftCode(
  item: SettlementItem,
  fromSettlementKey: string,
  designerName?: string,
): string {
  const payload: GiftCodePayload = {
    meshPreset:     item.meshPreset,
    zone:           item.zone,
    color:          item.color,
    donorKey:       fromSettlementKey,
    donorStarColor: starterLightColorHex(fromSettlementKey),
    ...(designerName ? { donorName: designerName } : {}),
    ...(hasVoxelContent(item.voxels) ? { voxels: item.voxels } : {}),
  }
  return encryptForStorage(JSON.stringify(payload))
}

/** Structural validation for a voxel payload arriving over an untrusted gift code. */
function isValidVoxelPayload(v: unknown): v is VoxelPayload {
  if (!v || typeof v !== 'object') return false
  const d = v as Partial<VoxelPayload>
  return Number.isInteger(d.size) && d.size! > 0 && d.size! <= VOXEL_GRID_SIZE
    && Array.isArray(d.palette) && d.palette.length > 0 && d.palette.length <= VOXEL_MAX_COLORS
    && d.palette.every(c => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c))
    && Array.isArray(d.cells) && d.cells.length === d.size! ** 3
    && d.cells.every(c => Number.isInteger(c) && c >= 0 && c <= d.palette!.length)
}

/** Decode a gift code. Returns null for malformed, foreign, or unknown-preset input. */
export function importItemGiftCode(code: string): GiftCodePayload | null {
  try {
    const d = JSON.parse(decryptFromStorage(code.trim())) as Partial<GiftCodePayload>
    if (!d || typeof d.meshPreset !== 'string') return null
    const preset = ITEM_MESH_PRESETS[d.meshPreset]
    // A gift arrives as a trade, so the preset must be tradeable — this keeps
    // the starter lantern (acquiredBy: []) from being clonable via a code.
    if (!preset || !preset.acquiredBy.includes('traded')) return null
    if (typeof d.zone !== 'string' || !(d.zone in ZONE_POSITIONS)) return null
    if (typeof d.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(d.color)) return null
    if (typeof d.donorKey !== 'string' || !d.donorKey) return null
    if (d.voxels !== undefined && !isValidVoxelPayload(d.voxels)) return null
    return {
      meshPreset:     d.meshPreset,
      zone:           d.zone as ItemZone,
      color:          d.color,
      donorKey:       d.donorKey,
      donorStarColor: typeof d.donorStarColor === 'string' ? d.donorStarColor : d.color,
      ...(typeof d.donorName === 'string' && d.donorName ? { donorName: d.donorName } : {}),
      ...(d.voxels ? { voxels: d.voxels } : {}),
    }
  } catch {
    return null
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'e8.2'   // opaque — was 'exotopia_items_v1'
const SEEDED_PREFIX  = 'e8.2s'  // tracks whether the starter lantern was ever granted
const REVEAL_PREFIX  = 'e8.2r'  // tracks whether the one-time reveal animation has played

// Hash the settlement key so no location names appear as localStorage keys
function storageKey(sk: string) { return `${STORAGE_PREFIX}:${hashStorageKey(sk)}` }
function seededKey(sk: string)  { return `${SEEDED_PREFIX}:${hashStorageKey(sk)}` }
function revealKey(sk: string)  { return `${REVEAL_PREFIX}:${hashStorageKey(sk)}` }

function loadItems(sk: string): SettlementItem[] {
  return safeRead<SettlementItem[]>(storageKey(sk), [])
}

function saveItems(sk: string, items: SettlementItem[]) {
  safeWrite(storageKey(sk), items)
}

function makeStarterLight(sk: string): SettlementItem {
  const preset = ITEM_MESH_PRESETS[STARTER_LIGHT_PRESET]!
  return {
    id:            `starter-${hashStorageKey(sk)}`,
    type:          'generated',
    meshPreset:    STARTER_LIGHT_PRESET,
    label:         preset.label,
    description:   preset.description,
    zone:          preset.zoneDefault,
    color:         starterLightColorHex(sk),
    acquiredAt:    Date.now(),
    settlementKey: sk,
  }
}

/**
 * One-time check: has this settlement's founding reveal animation played yet?
 * Consumes the flag — a true result means "play it now", and it will return
 * false for every call after (per settlement, persisted across sessions).
 */
export function consumeStarterReveal(sk: string): boolean {
  const key  = revealKey(sk)
  const seen = safeRead<boolean>(key, false)
  if (!seen) safeWrite(key, true)
  return !seen
}

// ── Shared store ──────────────────────────────────────────────────────────────
// Module-level reactive cache, keyed by settlement key, so every component
// instance pointed at the same settlement shares one live item list (and
// localStorage persistence) rather than each holding its own stale copy.

const itemsStore: Record<string, SettlementItem[]> = reactive({})

function ensureLoaded(sk: string) {
  if (sk in itemsStore) return
  let items = loadItems(sk)
  // Every settlement is founded with a free lantern — grant it once, on first
  // load, to settlements that don't already have items. Gated by its own
  // persisted flag (not items.length) so removing the lantern later doesn't
  // cause it to be re-granted on the next visit.
  if (items.length === 0 && !safeRead<boolean>(seededKey(sk), false)) {
    items = [makeStarterLight(sk)]
    saveItems(sk, items)
    safeWrite(seededKey(sk), true)
  }
  itemsStore[sk] = items
}

// ── Server sync (016_settlement_items.sql) — signed-in members only ────────
//
// Fast-follow to settlements.ts's own sync: same hybrid model (localStorage
// stays the source of truth read on every page load; a signed-in member's
// writes are ALSO upserted server-side so items survive a cleared cache or
// show up on a second device). One row per (owner, settlement), holding the
// whole item list as JSONB — matching persist()'s own always-rewrite-the-
// full-array model, so there's no per-item diffing to get wrong.

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

async function syncItemsUpsert(sk: string, items: SettlementItem[]) {
  const uid = await currentUserId()
  if (!uid || !supabase) return
  await supabase.from('settlement_items')
    .upsert({ owner_id: uid, settlement_key: sk, items }, { onConflict: 'owner_id,settlement_key' })
}

/**
 * Called once when a member's session becomes available (see member.ts) —
 * same integration point as settlements.ts's loadMySettlements(), and called
 * right after it. Pulls down every settlement's items this member has on the
 * server; a server-known settlement replaces the local cache for that
 * settlement (it's the durable copy), and local-only settlements (not yet
 * synced) are pushed up as-is.
 */
export async function loadMySettlementItems(): Promise<void> {
  const uid = await currentUserId()
  if (!uid || !supabase) return
  const { data } = await supabase.from('settlement_items').select('settlement_key, items').eq('owner_id', uid)
  const rows = (data ?? []) as { settlement_key: string; items: SettlementItem[] }[]
  const serverKeys = new Set<string>()
  for (const row of rows) {
    serverKeys.add(row.settlement_key)
    itemsStore[row.settlement_key] = row.items
    saveItems(row.settlement_key, row.items)
  }
  // Push up anything already loaded locally this session that the server
  // doesn't have yet (mirrors settlements.ts's local-only migration path).
  for (const sk of Object.keys(itemsStore)) {
    if (!serverKeys.has(sk)) void syncItemsUpsert(sk, itemsStore[sk]!)
  }
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useSettlementItems(settlementKey: Ref<string>) {
  ensureLoaded(settlementKey.value)
  watch(settlementKey, sk => ensureLoaded(sk))

  const items = computed({
    get: () => itemsStore[settlementKey.value] ?? [],
    set: (val: SettlementItem[]) => { itemsStore[settlementKey.value] = val },
  })

  function persist() {
    saveItems(settlementKey.value, items.value)
    void syncItemsUpsert(settlementKey.value, items.value)
  }

  function addItem(
    partial: Pick<SettlementItem, 'type' | 'meshPreset' | 'zone'> &
             Partial<Omit<SettlementItem, 'id' | 'acquiredAt' | 'settlementKey' | 'type' | 'meshPreset' | 'zone'>>
  ): SettlementItem {
    const preset = ITEM_MESH_PRESETS[partial.meshPreset]
    // Structural guard, not just a UI filter: the acquire picker already hides
    // ineligible presets, but nothing stopped a direct call from bypassing it.
    if (!preset) {
      throw new Error(`Unknown mesh preset "${partial.meshPreset}"`)
    }
    if (!preset.acquiredBy.includes(partial.type)) {
      throw new Error(`"${partial.meshPreset}" cannot be acquired via "${partial.type}"`)
    }
    const colHex = '#' + preset.defaultColor.toString(16).padStart(6, '0')
    const item: SettlementItem = {
      label:        preset.label,
      description:  preset.description,
      color:        colHex,
      ...partial,
      id:           `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      acquiredAt:   Date.now(),
      settlementKey: settlementKey.value,
    }
    items.value = [...items.value, item]
    persist()
    return item
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
    persist()
  }

  function updateItem(
    id: string,
    patch: Partial<Pick<SettlementItem, 'color' | 'zone' | 'label' | 'voxels'>>,
  ) {
    items.value = items.value.map(i => i.id === id ? { ...i, ...patch } : i)
    persist()
  }

  function placeItem(id: string, posX: number, posZ: number) {
    items.value = items.value.map(i => i.id === id ? { ...i, posX, posZ } : i)
    persist()
  }

  const byType = computed((): Record<ItemAcquisitionType, SettlementItem[]> => ({
    'constructed': items.value.filter(i => i.type === 'constructed'),
    'traded':      items.value.filter(i => i.type === 'traded'),
    'generated':   items.value.filter(i => i.type === 'generated'),
    'eco-ops':     items.value.filter(i => i.type === 'eco-ops'),
    'reward':      items.value.filter(i => i.type === 'reward'),
  }))

  return { items, byType, addItem, removeItem, updateItem, placeItem }
}
