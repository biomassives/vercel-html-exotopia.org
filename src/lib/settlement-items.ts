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
 *
 * Storage (hybrid model):
 *   localStorage  — source of truth for constructed/placed items
 *   pon.ink events (future) — authoritative for generated/traded items
 *                             read-only imported into the same store
 */

import { reactive, computed, watch } from 'vue'
import type { Ref } from 'vue'
import * as THREE from 'three'
import { safeRead, safeWrite, hashStorageKey } from './storage-cipher'

// ── Core types ────────────────────────────────────────────────────────────────

export type ItemAcquisitionType = 'constructed' | 'traded' | 'generated' | 'eco-ops'

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
  // Generated
  airdropBundle?:  string        // pon.ink bundle type
  // Eco-ops
  community?:      string        // name of the SHG / community that earned it
  // Metadata
  acquiredAt:      number        // unix ms
  settlementKey:   string
}

// ── Mesh preset catalogue ─────────────────────────────────────────────────────

export interface ItemMeshPreset {
  label:        string
  defaultColor: number           // 0xRRGGBB
  zoneDefault:  ItemZone
  acquiredBy:   ItemAcquisitionType[]
  description:  string
  buildCost?:   number           // for constructed items
}

export const ITEM_MESH_PRESETS: Record<string, ItemMeshPreset> = {
  'beacon': {
    label: 'Signal Beacon', defaultColor: 0x00ddff, zoneDefault: 'gateway',
    acquiredBy: ['constructed', 'generated'],
    description: 'Broadcasts settlement presence to the conduit network.',
    buildCost: 40,
  },
  'crystal': {
    label: 'Resonance Crystal', defaultColor: 0xcc88ff, zoneDefault: 'courtyard',
    acquiredBy: ['generated', 'eco-ops'],
    description: 'Harmonic receiver that amplifies ambient light.',
  },
  'planter': {
    label: 'Garden Planter', defaultColor: 0x44bb44, zoneDefault: 'garden',
    acquiredBy: ['constructed', 'eco-ops'],
    description: 'Cultivates alien flora adapted to local conditions.',
    buildCost: 20,
  },
  'solar-array': {
    label: 'Solar Array', defaultColor: 0xffcc44, zoneDefault: 'open-floor',
    acquiredBy: ['constructed'],
    description: 'Harvests light from the host star.',
    buildCost: 60,
  },
  'monument': {
    label: 'Community Monument', defaultColor: 0x88aacc, zoneDefault: 'courtyard',
    acquiredBy: ['eco-ops'],
    description: 'Marks a community milestone or declaration.',
  },
  'archive-node': {
    label: 'Archive Node', defaultColor: 0x4488ff, zoneDefault: 'library',
    acquiredBy: ['constructed', 'traded'],
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
    acquiredBy: ['traded', 'generated'],
    description: 'Displays community artwork or an NFT piece.',
  },
  'comms-relay': {
    label: 'Comms Relay', defaultColor: 0x55ffaa, zoneDefault: 'gateway',
    acquiredBy: ['constructed', 'generated'],
    description: 'Strengthens conduit range to neighbouring settlements.',
    buildCost: 45,
  },
  'seed-vault': {
    label: 'Seed Vault', defaultColor: 0xbbcc88, zoneDefault: 'library',
    acquiredBy: ['eco-ops', 'traded'],
    description: 'Stores genetic diversity — a symbol of long-term commitment.',
  },
  'decon-site-marker': {
    label: 'Decontamination Site Marker', defaultColor: 0xffaa33, zoneDefault: 'water-edge',
    acquiredBy: ['eco-ops'],
    description: 'Marks a PFAS/PFOA decontamination project logged in your citizen-science work. Color reflects project status at the time it was attached (amber = planning/active, cyan = monitoring, green = complete) — set via the color override when the item is added, not live-updating.',
  },
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
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'e8.2'   // opaque — was 'exotopia_items_v1'

// Hash the settlement key so no location names appear as localStorage keys
function storageKey(sk: string) { return `${STORAGE_PREFIX}:${hashStorageKey(sk)}` }

function loadItems(sk: string): SettlementItem[] {
  return safeRead<SettlementItem[]>(storageKey(sk), [])
}

function saveItems(sk: string, items: SettlementItem[]) {
  safeWrite(storageKey(sk), items)
}

// ── Shared store ──────────────────────────────────────────────────────────────
// Module-level reactive cache, keyed by settlement key, so every component
// instance pointed at the same settlement shares one live item list (and
// localStorage persistence) rather than each holding its own stale copy.

const itemsStore: Record<string, SettlementItem[]> = reactive({})

function ensureLoaded(sk: string) {
  if (!(sk in itemsStore)) itemsStore[sk] = loadItems(sk)
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useSettlementItems(settlementKey: Ref<string>) {
  ensureLoaded(settlementKey.value)
  watch(settlementKey, sk => ensureLoaded(sk))

  const items = computed({
    get: () => itemsStore[settlementKey.value] ?? [],
    set: (val: SettlementItem[]) => { itemsStore[settlementKey.value] = val },
  })

  function persist() { saveItems(settlementKey.value, items.value) }

  function addItem(
    partial: Pick<SettlementItem, 'type' | 'meshPreset' | 'zone'> &
             Partial<Omit<SettlementItem, 'id' | 'acquiredAt' | 'settlementKey' | 'type' | 'meshPreset' | 'zone'>>
  ): SettlementItem {
    const preset = ITEM_MESH_PRESETS[partial.meshPreset]
    const colHex = '#' + (preset?.defaultColor ?? 0xffffff).toString(16).padStart(6, '0')
    const item: SettlementItem = {
      label:        preset?.label       ?? partial.meshPreset,
      description:  preset?.description ?? '',
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

  function placeItem(id: string, posX: number, posZ: number) {
    items.value = items.value.map(i => i.id === id ? { ...i, posX, posZ } : i)
    persist()
  }

  const byType = computed((): Record<ItemAcquisitionType, SettlementItem[]> => ({
    'constructed': items.value.filter(i => i.type === 'constructed'),
    'traded':      items.value.filter(i => i.type === 'traded'),
    'generated':   items.value.filter(i => i.type === 'generated'),
    'eco-ops':     items.value.filter(i => i.type === 'eco-ops'),
  }))

  return { items, byType, addItem, removeItem, placeItem }
}
