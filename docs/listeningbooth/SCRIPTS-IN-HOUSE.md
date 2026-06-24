# Exotopia Listening Booth — Full Scripts (In-House Tracks)
## Tracks 1, 2, 3, 6

*SCD Hub · exotopia.org · pon.ink*
*Draft scripts — April 2026*
*Source: OUTLINE.md · COSMIC-ADDRESS-DEEPDIVE.md*

---

> **About these scripts**
>
> Tracks 1, 2, 3, and 6 are written from the outline and can be recorded in-house without
> community voice participants. Tracks 4 and 5 require OT Kulcha and Uni-Kibaoni-Peace-Youth-SHG
> involvement and are handled in separate materials.
>
> Notation used below:
> - `[BEAT]` — a deliberate pause. One beat ≈ 0.8 seconds.
> - `[...]` — longer pause or fade moment. Typically 1.5–2 seconds.
> - `{{PLANET_NAME}}` — dynamic placeholder, filled by the app at runtime.
> - Words in *italics* in stage directions are for the director and editor, not in the script.
> - Duration estimates assume natural speaking pace — not rushed, not slow.

---

---

## Track 1 — "First Light"

**Duration:** ~45 seconds
**Trigger:** Welcome page. Auto-plays after the cinematic dome render completes (~4s intro drift).
**Voice:** Calm, gender-neutral. Warm. Contained — as if slightly pressurised air between
speaker and listener. This is a person who has arrived here many times and never stopped
finding it remarkable.

---

*[Allow 2 seconds of silence and ambient bed before the first word.]*

You are on the surface of {{PLANET_NAME}}.

[BEAT]

That number is real — the distance from here to your sun.
This star existed before the Earth did.
[BEAT]
And someone found it.

[...]

The settlement behind you holds what has been earned here —
water logged, land mapped, systems tracked, ground-truth reported.
[BEAT]
Each record became something in this place.

[...]

The signpost will orient you.
The library is to your left — it opens to what this community has built.
[BEAT]
The pyramid ahead is the transit terminal.
[BEAT]
It goes further than you think.

[...]

*[Music bed fades in slowly under last line and continues beneath scene.]*

This is yours to explore.

---

**Word count:** ~90 words
**Estimated duration:** 42–48 seconds including pauses

**Notes for direction:**
- Record the planet name placeholder as `[NAME]` or a real exoplanet name — it will be
  replaced dynamically by the app, but the surrounding sentence should not change delivery.
- The phrase "That number is real" should not be louder — just slightly more present.
  The emphasis is factual, not dramatic.
- "It goes further than you think" — the only line that carries any invitation. Slight
  downward inflection. Not a tease. A plain statement.

---

---

## Track 2 — "The Conduit Opens"

**Duration:** Exactly 7 seconds. Locked to portal animation.
**Trigger:** WormholePortal animation begins in the app.
**Voice:** Sparse. The voice is layered with itself at a perfect fifth (no reverb). Feels
like the transit infrastructure briefly making itself audible. Four cues only, nothing more.

*This track requires tight sync to the portal's four visual phases.*
*Test with the actual WormholePortal animation open before final mix.*

---

| Time | Visual phase | Script cue |
|---|---|---|
| 0.0–1.0 s | E8 rings assemble | `{{DEPARTURE_SYSTEM}}` |
| 1.0–1.8 s | Spin begins | `[breath — audible, unhurried]` |
| 1.8–4.0 s | Radial streaks | `{{DESTINATION_SYSTEM}}` |
| 4.0–6.0 s | White flash + ring shards | `[silence — only the clipped high tone]` |
| 6.0–7.0 s | Emerge — arrival glow | `here` |

---

**Full cue sheet for director:**

**Cue 1 (0.0 s):** Speak the departure system name — just the name, nothing else.
Placed left in stereo field (70% left).
*Example: "Kepler-452" or "Sol" if departing from Earth context.*

**Breath (1.0 s):** Single audible breath, centre-panned.
Not hesitation — readiness. Like a diver before entry.

**Cue 2 (1.8 s):** Speak the destination system name — slowly, as if sounding it for the
first time. Allow it to drift past centre to slightly right.
*Example: "Tau Ceti" or "Gliese 667".*
Let the name end naturally before the 4.0-second mark.

**Silence (4.0–6.0 s):** No voice. Post-production adds a single high sine tone (approx.
3500 Hz), hard-clipped, rising 0.3 s then cut abruptly at 5.5 s. Silence to 6.0 s.

**Cue 3 (6.0 s):** One word: `here`. Panned right (60% right). Warm exhale underneath.
The tone of arrival, not announcement.

---

**Production notes:**
- The fifth-interval double is generated in post, not by the voice actor. Record clean, dry.
- The departure and destination names are dynamic — record a library of 20–30 system names
  individually for the app to assemble at runtime, or use TTS for the name-only cues.
- Do not add any music or drone under this track. The portal visual is already a crescendo.
- The clipped tone in post: record at natural level, then brick-wall limit it to +3 dB
  before the hard cut. Distortion is intended.

---

---

## Track 3 — "The Pyramid Speaks"

**Duration:** ~30 seconds
**Trigger:** User clicks the pyramid at their settlement. Plays before destination panel opens.
Can be skipped.
**Voice:** Slightly deeper than Track 1. Deliberate pace — not slow, but unhurried. This speaker
has read the astrophysics and finds it beautiful, but they're not going to perform that beauty.
A systems architect who happens to work at cosmic scale.

---

*[No intro silence. This begins as the pyramid pulse is heard.]*

The geometry beneath this floor is not a design choice.
[BEAT]
Eight dimensions of rotational symmetry, projected down to three.
[BEAT]
The transit network follows its edges.

[...]

Between the great voids — Local, Boötes, Sculptor — the fabric thins.
[BEAT]
The conduits run along those margins.
[BEAT]
Not through the voids. Along them.

[...]

Near systems transit direct.
[BEAT]
Systems further out route through the conduit infrastructure — the void boundaries
carry the signal where open space cannot.
[BEAT]
Beyond three hundred parsecs, the route is longer. The geometry holds.

[...]

Select your destination.

*[Panel opens. Track ends.]*

---

**Word count:** ~95 words
**Estimated duration:** 28–34 seconds including pauses

**Notes for direction:**
- "Not through the voids. Along them." — the key line. The distinction matters
  and the speaker knows it. Slight weight on *along*, but no performance.
- "The geometry holds." — understated confidence. Not inspiring. True.
- Record dry with minimal room. This is a direct channel — no acoustic space implied.
- Optional sub-bass pulse at 2.2 Hz under the whole track (matching pyramid's PointLight
  pulse in the code). Added in post at very low level — felt more than heard.

---

---

## Track 6 — "Cosmic Address"

**Duration:** ~40 seconds
**Trigger:** One-time. Fires at the moment a user's Cosmic Address is first assigned —
immediately after their first eco-ops check-in. Stored in localStorage to prevent re-fire.
Can be revisited from profile page.

**Voice:** Same voice as Track 1, but quieter. The dome is empty except for this person.
This moment is for one listener, not an audience.

---

*[No music. Ambient drone only — very low, barely present.]*
*[2 seconds of near-silence before the first word.]*

{{COSMIC_ADDRESS}}

[BEAT]

*[Pause 1.5 seconds after the address is spoken. Let it land.]*

That is a real place.

[...]

{{HOST_STAR_DESCRIPTION}}

[...]

This address is permanent.
[BEAT]
It is recorded on-chain and it is yours —
not because you paid for it.
[BEAT]
Because you did something.

[...]

*[Three or four notes — live instrument, unhurried. Something like a door quietly opening.]*

Welcome home.

---

**Dynamic placeholders — filled by the app at runtime:**

`{{COSMIC_ADDRESS}}`
The full address string, read aloud as a real address.
*Example reading of `exo-surface-v1:Kepler-452b:Aurora-Basin`:*
> *"exo-surface, version one. Kepler four-five-two b. Aurora Basin."*

The app should pass a phonetic rendering of the address, not the raw string, to ensure
correct pronunciation of the host star designation.

`{{HOST_STAR_DESCRIPTION}}`
Two sentences, generated from the planet's catalog data. Template:
> *"[PLANET] orbits a [STAR_TYPE] star [DISTANCE] parsecs from Earth —
> [ONE_DESCRIPTIVE_DETAIL_FROM_CATALOG]."*

Examples of the descriptive detail slot, drawn from real catalog fields:
- "a star slightly older and cooler than our sun, its light running orange at the horizon"
- "a K-type star — quieter than the sun, burning longer"
- "a star that has hosted this planet for six billion years"
- "one of the nearest confirmed exoplanets to Earth"

The description should never mention probability or uncertainty ("may be", "could have").
These are facts about the star system, not speculation about habitability.

---

**Full annotated script for recording:**

The voice actor records everything except the placeholder slots. The session produces:

| Segment | Content | Notes |
|---|---|---|
| `[ADDRESS_SLOT]` | `[silence — 1.0 s]` | App inserts TTS read of address here |
| `[PAUSE_AFTER_ADDRESS]` | `[silence — 1.5 s]` | Baked into the track |
| `"That is a real place."` | Fixed | |
| `[PAUSE]` | `[silence — 1.0 s]` | Baked in |
| `[DESCRIPTION_SLOT]` | `[silence — 4.0 s max]` | App inserts TTS description |
| `[PAUSE]` | `[silence — 1.0 s]` | Baked in |
| `"This address is permanent."` | Fixed | |
| `"It is recorded on-chain and it is yours —"` | Fixed | |
| `"not because you paid for it."` | Fixed | |
| `"Because you did something."` | Fixed | |
| `[MUSICAL_PHRASE]` | 3–4 notes, live instrument | Post-production / separate session |
| `"Welcome home."` | Fixed | After the musical phrase resolves |

*Note on assembly:* The track is assembled at playback time by the app. The recorded narration
contains silent gaps at the address and description slots. The app fills those gaps with
synthesised or pre-generated audio for the specific address and planet data. The result plays
as a single continuous audio stream.

---

**Notes for direction:**
- The address readout (by TTS or separate recording) should be read as an actual address —
  with slight pauses between the three segments. Not a serial number. A place.
- "not because you paid for it." — the only line with any edge. Flat delivery.
  The contrast is implicit; don't lean into it.
- "Welcome home." — very quiet. Possibly the quietest thing recorded in this entire set.
  Not valediction. Not a sign-off. A simple true statement.
- The musical phrase: three or four notes is not a guideline — it's a ceiling. Two notes is fine.
  A single sustained note that resolves is fine. What it must not be: a sting, a fanfare, a
  theme, a reference to anything else in the set. It should sound like someone setting something
  down gently.

---

---

## Assembly Notes — All Tracks

### Naming convention

Delivered audio files should follow this naming scheme:

```
lb-01-first-light.wav
lb-02-conduit-opens.wav
lb-03-pyramid-speaks.wav
lb-06-cosmic-address-fixed.wav          ← the recorded portions only
lb-06-cosmic-address-assembled.wav      ← test assembly with sample planet data
```

(Tracks 4 and 5 will follow the same `lb-04-*` / `lb-05-*` pattern when recorded.)

### Format

- 24-bit / 48 kHz WAV for delivery
- Stereo except Track 3 which can be mono (spread in post if needed)
- No normalisation — deliver at natural levels, allow post to handle final gain

### Integration spec sketch

Full integration spec is a separate document, but the key trigger points per track:

| Track | Vue trigger | Method |
|---|---|---|
| 1 | `WelcomePage` mounted + scene loaded | `new Audio(url).play()` after GSAP intro |
| 2 | `portalStore.openPortal()` called | Sync start with portal animation frame 0 |
| 3 | Pyramid mesh raycaster click | Play before routing panel opens (delay panel ~1s) |
| 6 | First eco-ops check-in API response | One-shot: `localStorage.setItem('lb6_played', '1')` guard |

Track 2 is the only track that requires frame-accurate sync. All others are fire-and-forget
with soft fade-out if the user navigates away.

---

*Scripts complete — April 2026*
*Next: community recording sessions for Tracks 4 and 5*
*See OUTLINE.md for production notes, COSMIC-ADDRESS-DEEPDIVE.md for Track 6 source material*
