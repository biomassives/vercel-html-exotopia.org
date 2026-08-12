# Dome structure models

Drop a `.glb` (glTF 2.0, binary, single file) in this folder named after the structure it
replaces. `src/pages/DomeInteriorPage.vue`'s `enhanceDomeStructure()` picks it up automatically on
next load — no code change needed. Until a file exists, the current procedural placeholder keeps
rendering (with a lighting fix already applied — see that function's comment for the bug this
replaced: the placeholder box was reading as a flat black rectangle because its only light sat
above the roof, not facing the side visitors actually see).

| Filename        | Replaces |
|------------------|----------|
| `library.glb`    | The dome's library structure (`buildStructures()` in `DomeInteriorPage.vue`) |

Unlike `public/assets/settlement-items/`, there's no enumerable catalogue behind this folder —
each dome has exactly one library, not "one of N types" — so new filenames get added here as new
named structures get their own `enhanceDomeStructure(group, 'name')` call in the page, not from a
preset-key list.

## Recommended source — Kenney's CC0 space-kit assets

[Kenney's asset packs](https://kenney.nl) are CC0 (public domain — no attribution legally
required, though crediting Kenney is easy and appreciated; see `CREDITS.md` in this folder). They
ship glTF directly, so no format conversion is needed:

- **[Space Station Kit](https://kenney.nl/assets/space-station-kit)** (80+ models, glTF/OBJ/FBX) —
  best fit for `library.glb`: pick a habitat/module piece with some visible internal detail
  (windows, paneling) rather than a plain hull segment, since this is the one large fixed
  structure every visitor sees up close.
- **[Modular Space Kit](https://kenney.nl/assets/modular-space-kit)** — corridor/module pieces,
  useful if `library.glb` ends up composed of more than one piece.
- **[Space Kit](https://kenney.nl/assets/space-kit)** — broader sci-fi prop set, useful for future
  structures beyond the library.

Other good CC0/openly-licensed sources if Kenney's kits don't have the right piece:
[OpenGameArt.org's CC0 3D low-poly collection](https://opengameart.org/content/cc0-assets-3d-low-poly),
and [Sketchfab](https://sketchfab.com) — search for "space station" / "habitat module", then use
its License filter sidebar (set to "Downloadable" models) and check each result's license badge
individually before using one; Sketchfab hosts everything from CC0 to CC-BY-NC on the same search
page, so the filter alone isn't a substitute for checking the specific model's page.

## Format notes

- **glTF 2.0, `.glb` binary.**
- **Origin/pivot**: base at `y = 0`, centered on `x = 0, z = 0` — the app positions the group
  itself (`(0, 0, -15)` for the library), it doesn't re-center your geometry.
- **Scale**: the current placeholder is a 14×18×14 box — match that rough footprint so the model
  doesn't clip through the dome floor/wall or look out of proportion with everything else in the
  scene (the item props in `settlement-items/`, the dome shell itself).
- **Lighting**: don't bake in a point light — the app already lights this structure with two real
  `THREE.PointLight`s (roof + a front-facing fill added specifically because the placeholder read
  too dark from the default camera angle) and preserves them across the swap.

## Attribution (CREDITS.md)

CC0 doesn't require it, but if a model's source page suggests crediting the artist, add a line to
`CREDITS.md` in this folder (create it if it doesn't exist) — `<filename> — <artist/source>,
<license>, <url>`. Keeps provenance visible without needing to embed attribution in the app UI
itself, which CC0 assets don't need anyway.
