# Technology models — SPEC_AUTHORED_ART_LIBRARY.md, Grouping 1

Drop a `.glb` (glTF 2.0, binary, single file) in this folder named exactly
after the `REMEDIATION_METHODS[].key` it represents
(`src/data/pfas-methods-library.ts`). `src/lib/settlement-items.ts` picks it
up automatically on next page load via `enhanceTechnologyMesh()` — no code
change needed. Until a file exists, the generic-orb placeholder mesh
(`buildItemMesh()`'s default case) keeps rendering exactly as it does today.

This is a **distinct grouping from `../settlement-items/`**: those represent
abstract settlement decor (a beacon, a monument); these represent real, named
remediation equipment. A GAC filter vessel and an IX resin skid should read
as identifiably *that* technology, not interchangeable within a shared decor
look — see SPEC_AUTHORED_ART_LIBRARY.md §2 for the full distinction.

| Filename | Name (pfas-methods-library.ts) | Media |
|---|---|---|
| `gac.glb` | Granular Activated Carbon (GAC) filtration | water |
| `ix.glb` | Ion Exchange (IX) resin | water |
| `membrane.glb` | High-pressure membrane filtration (Reverse Osmosis / Nanofiltration) | water |
| `foam-fractionation.glb` | Foam fractionation (surface-active foam separation) | water |
| `in-situ-stabilization.glb` | In-situ soil stabilization / solidification | soil |
| `electrochemical-oxidation.glb` | Electrochemical oxidation | water |
| `scwo.glb` | Supercritical Water Oxidation (SCWO) | both |
| `phytoremediation.glb` | Phytoremediation (plant-based uptake) | soil |

## Format notes

- **glTF 2.0, `.glb` binary** — one self-contained file.
- **Origin/pivot**: model base at `y = 0`, centered on `x = 0, z = 0`.
- **Scale**: roughly human-to-small-vessel scale, matching the generic-orb
  placeholder's ~2-unit footprint (see `buildItemMesh()`'s `default` case in
  `src/lib/settlement-items.ts`).
- **Materials**: literal, untinted — bake real color into the glTF material.
  Unlike `../settlement-items/`, these never apply a per-settlement color
  tint even after a real model exists (SPEC_AUTHORED_ART_LIBRARY.md §5, Q2)
  — a GAC vessel should look like a GAC vessel, not a palette-matched prop.
- **Art direction by `media`**: `water` methods are plausibly tank/vessel/
  pipe assemblies; `soil` methods (`in-situ-stabilization`,
  `phytoremediation`) are plausibly ground-level/planted forms — worth
  designing to that distinction rather than one generic industrial-box
  silhouette repeated 8 times.
- **Poly budget**: modest — these render as a settlement's featured
  technology, often just one or two at a time, so a somewhat higher budget
  than `../settlement-items/` is fine, but keep it well under the 10k range.
- **Lighting**: don't bake a point light into the model — the app adds its
  own and preserves it across the swap.
