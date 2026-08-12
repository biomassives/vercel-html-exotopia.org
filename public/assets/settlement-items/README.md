# Settlement item models

Drop a `.glb` (glTF 2.0, binary, single file) in this folder named exactly
after the preset key it replaces. `src/lib/settlement-items.ts` picks it up
automatically on next page load via `enhanceItemMeshWithAsset()` — no code
change needed. Until a file exists, the current procedural placeholder mesh
keeps rendering exactly as it does today.

| Filename                    | Label (rewards-catalog.ts / settlement-items.ts) |
|------------------------------|---------------------------------------------------|
| `starter-lantern.glb`        | Settlement Lantern (every settlement's founding light) |
| `beacon.glb`                 | Signal Beacon |
| `crystal.glb`                | Resonance Crystal |
| `planter.glb`                | Garden Planter |
| `solar-array.glb`            | Solar Array |
| `monument.glb`                | Community Monument |
| `archive-node.glb`            | Archive Node |
| `water-filter.glb`            | Water Filtration Unit |
| `art-sphere.glb`               | Art Sphere |
| `comms-relay.glb`              | Comms Relay |
| `seed-vault.glb`               | Seed Vault |
| `decon-site-marker.glb`        | Decontamination Site Marker |

## Format notes

- **glTF 2.0, `.glb` binary** — one self-contained file, no separate `.bin`/texture files to keep track of.
- **Origin/pivot**: place the model's base at `y = 0`, centered on `x = 0, z = 0` — the app positions the whole group, it doesn't re-center your geometry.
- **Scale**: roughly human-to-small-building scale. The current placeholders range from ~2 units tall (crystal) to ~6 units tall (monument) — match the placeholder's rough footprint so it doesn't clip through the dome floor or tower over its zone. See the `case '<preset-key>':` block in `src/lib/settlement-items.ts` `buildItemMesh()` for the exact placeholder proportions to match.
- **Materials**: bake color into the glTF material (PBR metalness/roughness workflow) — the app does not recolor the model. If you want the per-settlement tint (`item.color`) to still apply, leave a note and that's a follow-up wiring change, not something the current scaffolding does automatically.
- **Poly budget**: these render at modest distance as background props, often several at once — keep it light, a few thousand triangles is plenty.
- **Lighting**: don't bake a point light into the model. The app already adds a real-time `THREE.PointLight` above the item (for the first `MAX_ITEM_LIGHTS` items) and preserves it across the swap.
