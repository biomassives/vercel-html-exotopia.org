# Proposed-zone planet surface textures

Drop a JPG in this folder named after the planet type it replaces. Picked up
automatically by `CosmicPage.vue`'s `renderProposedOrbit()` on next load —
no code change needed. Until a file exists, the current flat-color
placeholder sphere keeps rendering exactly as it does today.

| Filename           | Used for (`PlanetType` in CosmicPage.vue) | Placeholder color |
|---------------------|--------------------------------------------|--------------------|
| `rocky.jpg`         | `rocky`                                     | `#88aacc` |
| `super-earth.jpg`   | `super-earth`                                | `#66cc88` |
| `gas.jpg`           | `gas`                                        | `#ffaa44` |
| `ice.jpg`           | `ice`                                         | `#aaddff` |

## Format notes

- **Equirectangular**, 2:1 aspect — `2048x1024` or `1024x512` is plenty; these render small (a proposed zone's theoretical planet is a few dozen pixels on screen most of the time).
- Applied as the sphere's `map` only — no normal/roughness slot wired up yet. Keep the texture reasonably neutral in mid-tone brightness since it's shown at `opacity: 0.70` over a dark starfield.
- These are **theoretical/uncharted** zone markers, not real exoplanet imagery — stylized is appropriate; nothing here claims to depict an actual observed surface.
