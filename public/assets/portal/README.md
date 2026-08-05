# Local Step Portal frame textures

Drop these two files in this folder to replace the flat procedural frame
material. Picked up automatically by `src/lib/local-step-portal.ts` on next
load — no code change needed. Until they exist, the frame keeps rendering as
a flat-colored metal/roughness material exactly as it does today.

| Filename                  | Slot                                  |
|-----------------------------|----------------------------------------|
| `frame-normal.jpg`          | `MeshStandardMaterial.normalMap`        |
| `frame-roughness.jpg`       | `MeshStandardMaterial.roughnessMap`     |

## Format notes

- **Tileable** — the frame is a `TubeGeometry` following a square path, UV-wrapped once around the whole perimeter (U) by once around the tube's circumference (V), repeated 16× along U in code. Design one tileable "trim" pattern rather than a single wraparound image.
- Standard tangent-space normal map convention (OpenGL-style, +Y up) for `frame-normal.jpg`; grayscale for `frame-roughness.jpg` (white = rough, black = smooth).
- Base color/emissive stay procedural (temperature-derived per portal, see `local-step-portal.ts`) — these two maps only add surface detail (carved/etched motif, wear, etc.) on top of that color, they don't replace it.
- If you want an **albedo/color map** too (rather than relying entirely on the procedural tint), flag it — that's a small additional wiring change to `local-step-portal.ts`, not something this scaffolding does yet.
