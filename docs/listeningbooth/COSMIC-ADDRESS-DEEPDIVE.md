# Cosmic Address — Deep Dive
## Financial · Aesthetic · Functional

*Companion document to OUTLINE.md — Track 6 source material and project reference*
*SCD Hub · exotopia.org · pon.ink · April 2026*

---

## What the Cosmic Address Is

A Cosmic Address is a structured string of the form:

```
[coordinate_system]:[reference_body_key]:[location_descriptor]
```

For example:
```
exo-surface-v1:Kepler-452b:Aurora-Basin
exo-orbital-v1:Proxima-Cen-b:200-500km-i30
exo-stellar-orbital-v1:Alpha-Centauri:1.1-1.3au
```

It is assigned once, permanently, at the moment of a user's first eco-ops check-in. It cannot
be purchased. It cannot be claimed in advance. It is not a username.

It is a property deed, an artistic identity, and a functional key — simultaneously. The three
sections below develop each of those dimensions in full.

---

## I. Financial

### The primary claim: earned, not bought

Every other virtual real estate system to date has priced its land and sold it.
The Cosmic Address inverts this: the only way to receive an address is to do something real.
One eco-ops check-in — mapping a waste site, logging water quality, reporting on a farm practice,
running a cleaning activity — triggers the assignment. The work is logged, evidence-optional
but strongly encouraged, and the address follows automatically.

This is not a gift. It is a wage paid in property rather than currency. The work was done.
The address is the record of it.

This structural inversion matters financially because it means the virtual real estate in
Exotopia represents a real-world activity base rather than a speculation base. Addresses are
distributed to people who are already doing something, not to people who believe prices will
rise. The secondary market, when it develops, will trade in addresses that have *history* —
eco-ops activity logs, earned objects, community participation records — rather than in blank
plots acquired at launch.

### Address type and its financial character

Four coordinate systems are supported, each with a different financial profile:

**`exo-surface-v1` — surface polygon on an exoplanet**
The default type for most participants. A bounded lat/long polygon on the planet surface.
Analogous to land — it has a shape, a location relative to the planet's geography, and can
in principle carry improvements (settlement objects, earned features). The most
comprehensible property type for participants unfamiliar with orbital mechanics.

**`exo-orbital-v1` — altitude band in orbit around an exoplanet**
Zone-based rather than surface. Altitude min/max in km, inclination. More appropriate for
technical roles (station builders, facilitators running orbital workshops). Has an industrial
character — orbital zones are where infrastructure sits, not where you settle.

**`exo-stellar-orbital-v1` — orbital radius band around the host star**
The largest-scale address type. An AU-range band around the star. Analogous to claiming a
zone of the solar system rather than a plot on a planet. Appropriate for senior roles,
long-tenured participants, or rare airdrop events tied to planet discovery announcements.
The scarcest type — there is only one stellar system per host star.

**`exo-lunar-orbital-v1` — orbit around a moon of an exoplanet**
The most niche type, requiring a named moon (the participant may name an unnamed moon
themselves under the protocol). Highest symbolic value per assignment — the name they give
the moon is on-chain forever.

### Revenue flow and the address as financial infrastructure

The 80 / 15 / 5 revenue split applies to all transactions conducted within the ecosystem
where an address is the property in question:

- **80%** to the address holder (the participant)
- **15%** to the Community Hardware Fund — WATSAN equipment, mapping tools, field infrastructure
- **5%** to platform operations

When an address holder mints objects into their settlement, hosts events, licenses their
space for workshops, or sells settlement objects on the pon.ink marketplace, this split
applies automatically via smart contract. The address is not just a property — it is a
revenue-routing node. Its on-chain record carries the holder's wallet identity, and every
downstream transaction that cites that address as origin triggers the split.

This means the Community Hardware Fund is continuously capitalised by activity, not by a
one-time fundraise. Every workshop hosted at Aurora Basin — wherever it is — directs 15% to
physical tools that end up in the field. The virtual and the real are financially entangled
by design.

### Appreciation and the activity premium

A newly assigned address has base value. An address with 50 eco-ops check-ins, three earned
settlement objects, a named region, a gallery exhibition record, and three hosted community
events has substantially more. Unlike land, which appreciates passively, a Cosmic Address
appreciates with participation. Dormant addresses do not appreciate. Active addresses do.

This creates a participation incentive that is also a healthy secondary market signal: buyers
on the aftermarket are purchasing an address's *history*, which is transparent on-chain. There
is no information asymmetry — the activity log is public. This distinguishes Exotopia
addresses from most NFT real estate, where buyers have little to evaluate beyond speculation.

### Notes for audio script writers

The financial angle should never be led with. It's true and it matters, but if Track 6
opens with "your address has financial value," it sounds like a pitch. Lead instead with
the address as a permanent record of work — the financial dimension follows from that
without needing to be stated explicitly. The line "yours because of work you did, not money
you spent" from the OUTLINE already captures this correctly.

---

## II. Aesthetic

### The address as a generated world

Every Cosmic Address resolves to a rendered environment that is unique — not by
arbitrary variation, but because it is derived from real astronomical data about a specific
planet. Two addresses at different exoplanets produce two different visual worlds, and the
differences are not cosmetic.

The parameters that drive visual generation:

| Data field | Visual output |
|---|---|
| `st_teff` (host star temperature) | Sky color, star glow hue, directional light color |
| `pl_eqt` (planet equilibrium temp) | Terrain color palette, vegetation hue, fog density |
| `hostname` (host star name as seed) | Deterministic RNG for rock placement, vegetation positions |
| `ra`, `dec` (celestial coordinates) | Background star field positions from the full catalog |
| `sy_dist` (distance in parsecs) | Transit routing class (direct / Local Void / Boötes Void) |

A G-type star at 5800 K produces a pale yellow-white sun arc and warm terrain.
An M-type star at 3500 K produces an orange-red sun with cooler, bluer terrain tones.
A planet at 280 K equilibrium temperature generates green-hued vegetation; one at 900 K
generates amber-to-red vegetation that looks like a world perpetually in autumn fire.

This means the Cosmic Address is not just a coordinate — it is the seed of a visual identity.
The address `exo-surface-v1:Kepler-452b` always renders the same way. It has a look.
The holder of that address has a home that no one else has, because no other confirmed
exoplanet has exactly those parameters.

### The string itself as aesthetic object

The address string has a formal beauty that is worth dwelling on in audio.

```
exo-surface-v1:Kepler-452b:Aurora-Basin
```

Three parts. Three registers.

The prefix — `exo-surface-v1` — is technical: a schema declaration, a version,
a coordinate system. It sounds like a file format. It is a file format.
But it is also a category of existence: *surface, exo, version one*. The first
iteration of the idea of being somewhere that is not Earth.

The middle — `Kepler-452b` — is a scientific designation assigned by the Kepler Space
Telescope mission to the 452nd star in its catalog, second planet. The letter `b` means
first discovered planet. The number means it was the 452nd star examined in a particular
sky patch. The name carries the history of how it was found — a telescope staring at a
fixed square of sky for years, watching for the dimming of starlight as a planet crosses.

The suffix — `Aurora-Basin` or whatever the participant names it — is the human act on
top of the astronomical record. The participant gives the place a name. That name is
on-chain. It will exist, attached to the address, for as long as the chain persists.
The participant has named a place on a planet 1,400 light-years away.

This is the aesthetic arc of the Cosmic Address: technical → scientific → personal.

### Settlement as visual autobiography

When the address is rendered in Exotopia, what is shown is not a blank plot. It is a
living world derived from data. The soul orbs orbiting the library represent community
members who have visited or participated. The settlement objects in the library represent
earned eco-ops milestones. The water feature, the vegetation, the color of the sky —
all respond to the specific planetary conditions.

A participant looking at their settlement is looking at:

- A planet they did not invent (NASA confirmed it)
- A sky they did not design (stellar temperatures determine it)
- A landscape shaped by their work (eco-ops check-ins added each object)
- A name they chose (the region name, on-chain, permanent)

This four-layer structure — discovered / derived / earned / named — is the aesthetic
philosophy of the Cosmic Address. It is the opposite of pure creative freedom (which can
become arbitrary). It is grounded in constraints that are real: the planet exists,
the physics is real, the work was actually done.

### The E8 pyramid as aesthetic punctuation

Every settlement has a pyramid at a fixed position on the terrain. It is the same geometry
at every address — a four-sided cone (ConeGeometry, 4 segments) rotated 45° to present a
corner to the viewer. Its edges glow amber. Its pulsing PointLight (2.2 Hz) operates
independently of the rest of the scene.

The E8 floor inlay around its base — 8 radial lines corresponding to the 8 dimensions of
the E8 root system — is the same at every settlement. Every address has the same pyramid.

This is intentional. The pyramid is not personalised. It is the piece of every address that
is shared — the transit infrastructure that connects one address to every other. Aesthetically,
it is the mark of belonging to the network rather than the mark of individual ownership.

The tension between the unique environment (driven by the specific planet's data) and the
universal pyramid (the same at every address) is the central aesthetic statement:
you are here, in your specific place, and you are also connected to everyone else's
specific place.

### Language and audio aesthetic

Track 6 should handle the address's aesthetic dimension through the act of speaking it aloud.

Reading `exo-surface-v1:Kepler-452b` as a spoken phrase — slowly, as if it is an address
being read to someone who is writing it down — treats the technical string with the same
weight as a postal address or a GPS coordinate read to a navigator. It is that serious.
It deserves that pace.

The narration around it should not explain the aesthetic — it should enact it.
The voice speaking the address *is* the aesthetic moment. The string, read aloud,
sounds like what it is: coordinates in a universe the speaker is genuinely inside.

---

## III. Functional

### Address structure and parsing

The full address is a colon-delimited string with three mandatory segments:

```
[coordinate_system]:[pl_name_or_host]:[location_descriptor]
```

**Segment 1 — coordinate_system:** One of four values:
- `exo-surface-v1`
- `exo-orbital-v1`
- `exo-lunar-orbital-v1`
- `exo-stellar-orbital-v1`

**Segment 2 — reference body key:** The `pl_name` from the NASA Exoplanet Archive
(e.g. `Kepler-452b`, `Proxima-Cen-b`). For stellar orbital addresses, the host star
name is used instead (e.g. `Alpha-Centauri`). This key is the canonical lookup into
the NASA archive and into `galaxyStore` in the application.

**Segment 3 — location descriptor:** A human-readable region name chosen by the
participant (kebab-cased: `Aurora-Basin`, `Sound-Lab-3`, `Mpeketoni-Node`).
For orbital address types, this may be a structured range descriptor
(`200-500km-i30` for orbital altitude 200–500 km at 30° inclination).

The full address is stored as the `exolocation.coordinate_system` +
`exolocation.reference_body.pl_name` + `exolocation.region_name` fields in the
off-chain NFT metadata JSON uploaded to IPFS/Arweave. It also appears as a
`trait_type: Coordinate System` attribute in the on-chain NFT record for indexing
by marketplaces.

### The on-chain record

The address lives in two places simultaneously:

**On-chain:** A compressed NFT minted via Metaplex Bubblegum on Solana
(or Algorand ARC-69 equivalent, depending on user chain preference).
The on-chain record carries:
- The address string (via NFT attributes)
- The owner's wallet pubkey
- The assignment date
- The protocol version (`PON INK v1.0`)
- A URI pointing to the off-chain metadata JSON

This record is immutable once minted. The assignment date cannot be altered.
The address cannot be re-assigned to a different planet.

**Off-chain (IPFS/Arweave):** The full `exolocation` JSON block, which carries the
complete boundary definition (polygon coordinates, orbital parameters, AU ranges),
the reference body's RA/Dec, NASA archive ID, and distance. This is the data that
the Exotopia renderer uses to generate the scene. The CID of this JSON is the
authoritative link between the on-chain NFT and the rendered environment.

### Cross-platform lookup

The Cosmic Address functions as the primary shared key across the three platforms:

**On exotopia.org:** The address is parsed on navigation to `/surface/:hostname/:planetName`.
The `hostname` and `planetName` segments map directly to `galaxyStore.getSystem()` and
`galaxyStore.getPlanet()`. The settlement badge in the surface view displays
`exo-surface-v1:{hostname}:{planetName}`. The address is the render trigger.

**On pon.ink:** The user's dashboard profile displays their Cosmic Address prominently.
All NFT minting operations that originate from the user's settlement cite the address
as the `exolocation.reference_body` in the metadata. Payment and event hosting flows
use the address to route the 80/15/5 split — the address is the revenue origin node
in the smart contract.

**On ecocity.com:** Settlement objects (EcocitySolution NFTs — watsan, energy, shelter,
healthcare, food categories) carry the recipient's address in their `exolocation` field.
When an object is earned through eco-ops and minted by the system, the address is written
into the object's metadata at mint time. The object belongs to the address, not just to
the wallet. If the holder transfers the object to a different wallet, the object's address
provenance remains — it knows where it was earned.

### The assignment flow

```
User submits first eco-ops check-in (pon.ink mobile app)
        │
        ▼
Check-in logged to Supabase + IPFS (location, activity type, evidence if provided)
        │
        ▼
Assignment logic runs:
  · Pick nearest unassigned exoplanet to user's GPS coordinates
    (using RA/Dec → approximate Galactic lat/long proximity heuristic)
  · Or: random draw from planet pool filtered by
    st_teff (known) + sy_dist (known) — ensures a fully rendered scene
  · Assign coordinate_system based on user role:
    - Participant / most roles → exo-surface-v1
    - Senior facilitator, technical support → exo-orbital-v1 available
    - Mentor, administrator (on nomination) → exo-stellar-orbital-v1 available
        │
        ▼
User chooses region name (prompt in app: "Name your settlement")
        │
        ▼
Address string assembled: exo-surface-v1:{pl_name}:{region-name}
        │
        ▼
Metadata JSON built from NASA archive data for that planet
Uploaded to IPFS / Arweave → CID returned
        │
        ▼
Compressed NFT minted on Solana (Bubblegum) or Algorand (ARC-69)
  · Wallet: user's connected wallet (pon.ink auth)
  · Attributes: address string, assignment date, protocol version
  · URI: IPFS CID of metadata JSON
        │
        ▼
Track 6 audio fires: "Cosmic Address" narration reads the address aloud
Exotopia welcome page re-renders to the assigned planet
```

### Address as transit origin

The Cosmic Address is the user's home base in the wormhole transit system. When the user
activates the pyramid at their settlement, the transit routing logic uses their address's
`sy_dist` to classify their position in the conduit network:

- **< 50 pc distance** — direct transit available to nearby systems
- **50–300 pc** — routes through the Local Void conduit (void periphery, ≈ 23 Mpc from Milky Way)
- **> 300 pc** — routes through the Boötes Void conduit (≈ 250 Mpc, radiusMpc 130)

This means the choice of planet at address assignment is not only aesthetic — it determines
the user's structural position in the transit network. A participant assigned to Proxima Cen b
(1.3 pc) has a fundamentally different network topology from one assigned to a Kepler-field
planet at 1,400 pc. The close-in address can reach many more systems directly; the far address
has access to the deep-field conduit network that the nearby address cannot reach without
relaying.

In a mature ecosystem, these positional differences create natural roles: close-in addresses
become hubs for local cluster activity; far addresses serve as anchors for inter-cluster transit
routing. The address is not just where you live — it is where you sit in the network.

### Governance tie-in

Settlement addresses map to DAO governance under the Ecommunity DAO. Each address is a
voting node. Governance tokens are earned through participation, facilitation, and mentorship
— not purchased. The address must be active (at least one eco-ops check-in in the rolling
90-day window) to retain voting weight.

Dormant addresses retain ownership but lose governance weight proportionally over time until
activity resumes. This prevents inactive players from accumulating permanent governance
influence — the address has to keep being used to keep mattering politically, just as it
has to keep being used to keep appreciating financially.

The connection between the Cosmic Address and the Earth-based community is therefore
structural at every level: financially (activity drives appreciation and revenue routing),
aesthetically (the address is a visual record of the work that earned it), functionally
(the address is the key to every platform service and the home node in the transit network),
and politically (the address is the voting unit in the DAO, conditioned on ongoing participation).

---

## Cross-cutting notes for script writers

**What to say to someone who asks "why does my virtual address matter?"**

Say: because it is real in four ways that no other virtual address is.

1. The planet is real — confirmed by NASA, visible from Earth with a telescope if you know where to look.
2. The work that earned it is real — logged, on-chain, evidence-backed if submitted.
3. The environment it generates is real data, not invented art direction.
4. The revenue it generates routes to real field equipment and real communities.

**What not to say:**

Do not compare it to Decentraland, The Sandbox, or any metaverse land sale.
Those are speculation vehicles. The Cosmic Address is not.

Do not say "own a piece of the universe." The universe is not for sale and we are not
selling it. Say instead: "there is a planet, it has coordinates, and you are in them."

Do not foreground the NFT. The NFT is the receipt. The address is the thing.

**The one line, if you need it:**

*"A real planet. Real work. Your name, on-chain, at a location in space — permanent."*
