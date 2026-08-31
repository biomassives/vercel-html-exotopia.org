# SPEC_MULE_HOLOGRAPHIC_PROFILES.md — The Mule, Redesigned as a Grouping of Holographic Intelligence Profiles

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Living document — supersedes the persona/architecture framing in `SPEC_MULEBOT_API.md` and
`GLOSSARY.md` [26]. Planning only, nothing here is built yet. `SPEC_MULEBOT_API.md`'s endpoint
map (corpus, earnings, land-care, Approvideo) is not replaced — it's still the right resource
model for whichever profile is active; this document adds the profile layer on top of it.*

---

## 0. Why this redesign

The Mule stays the Mule — the name change under consideration in this session's earlier
discussion is dropped. The `[28] 40 Acres` reference ("40 acres and a mule," the unfulfilled
Reconstruction-era land-redistribution promise) is real historical weight this project has
already built into its identity correctly; nothing here walks that back.

Two things *do* change, both from direct maintainer input:

1. **The Mule stops being one fixed character and becomes a grouping of selectable
   "Holographic Intelligence Profiles."** Previously (`GLOSSARY.md` [26], `SPEC_MULEBOT_API.md`)
   the Mule was a single persona — "Natural & Regenerative Land Care Specialist" — with one
   fixed voice and one fixed scope. That's now one profile among several, not the whole design.
   A settler picks which profile is active, the way you'd pick which specialist to talk to.
2. **It runs on a real local LLM now, not "no LLM."** `GLOSSARY.md` [26] currently says
   "Local-network only — no cloud, no LLM, corpus stays sovereign" — describing a corpus-lookup
   system with no actual language model behind it. That line is now wrong on purpose: the goal
   is a real local LLM, sized to run on modest/small hardware, with the corpus-sovereignty
   principle *kept* (nothing leaves the device, no cloud API call) rather than achieved by simply
   not having a model at all. §4 covers the hardware target.

Everything else about the Mule — local-first, no wallet or blockchain required to use it, comes
free with a settlement's 40-acre claim — is unchanged.

---

## 1. What a Holographic Intelligence Profile is

A profile is a **persona layered on top of one shared local LLM backend** — not a separate model
per profile. Same underlying inference engine, same corpus, different system framing, different
visual presentation, different default emphasis on which parts of the platform it steers a
settler toward. Switching profiles changes *how the Mule shows up and what it leads with*, not
which facts it knows — the corpus (per `SPEC_MULEBOT_API.md` §"Corpus") is shared across every
profile a settler has access to.

Visually, each profile is a differently-lit variant of the existing `MuleCreature.vue` mech-mule
silhouette — same base geometry (the ears, the antenna mane, the hexagonal sensor eyes, the
muzzle plate), a different accent-glow palette and a different animated "active circuit" pattern
per profile, so a settler can recognize which profile is speaking at a glance without reading a
label. This is a re-skin of existing SVG art, not a new mascot per profile — the point is "one
Mule, several faces," not five unrelated characters.

---

## 2. The profile roster

Six profiles, each built around one or more of the domain-competency areas already defined in
`src/data/domain-competency.ts` (`DOMAINS`) — reusing that existing taxonomy rather than
inventing a parallel one, so a profile's "what it helps with" stays consistent with what mentors,
the Eco-Ops Library, and the certificate system already mean by those same domain names.

| Profile | Domains (from `DOMAINS`) | Real-world mission emphasis | Accent |
|---|---|---|---|
| **Land Steward** | `soil`, `food`, `shelter`, `climate` | Regenerative land use — the practical, ground-level default | Amber/warm |
| **Water Guardian** | `water`, `restoration` | Clean water, PFAS/decontamination — directly "less toxic" | Cyan/blue |
| **Biodiversity Scout** | `biodiversity` | Habitat, pollinators, species monitoring — directly "more biodiverse" | Green |
| **Commons Keeper** | (governance — see §2.1, not yet a `DOMAINS` entry) | Community guidelines, Ecommunity DAO participation, conflict de-escalation, mentor coordination — directly "safely governed, peaceful world" | Violet |
| **Knowledge Elder** | `iek`, `arts` | Traditional/indigenous knowledge, cultural practice, Knowledge Keeper records — the FPIC-governed [119] domain | Gold |
| **General Mule** | all domains, no specialization | The default for a settler who hasn't picked a specialist yet — broad, shallow, always available | Teal (matches current `MuleCreature.vue` palette — this is the profile that ships first, since it needs no new domain-routing work) |

### 2.1 Commons Keeper needs a real domain entry, not an invented one

`Commons Keeper` is the one profile whose subject matter — community governance, conflict
de-escalation, "safely governed, peaceful world" — has no corresponding entry in
`src/data/domain-competency.ts`'s `DOMAINS` today. Rather than inventing profile-only content
with nothing real behind it (the exact overclaiming pattern this project's own `blog-following-
through.md` exists to warn against), Commons Keeper's real, shipped surface for launch is:

- `[30] Ecommunity DAO` governance participation
- `legal-community-guidelines.md` / the Community Guidelines route
- The mentor-session confirmation system (`[149] Mentor Session`) — both-sides-confirm as a real,
  already-server-enforced small-scale "safely governed" mechanism
- `SPEC_NETWORKS_OF_TRUST.md`'s graded trust-rung system

A `governance` entry in `DOMAINS` (with its own `ecoLibraryArea`/`route`, following the exact
shape every other entry already uses) is real, cheap, additive work — not part of this spec's
scope to implement, but named here as the one prerequisite Commons Keeper needs before it can
launch with the same "reuse what's real" discipline as the other five profiles.

---

## 3. What every profile is oriented toward — the actual ask

Whichever profile is active, the Mule's job is not to *be* the mission — it's to connect a
settler's actual next action to it. Every profile's response pattern, regardless of persona
flavor, should be structured around three things, in this order:

1. **What real feature on this platform gets you closer to this goal right now** — a specific
   route, not a vague suggestion. (`/pfas-citizen-science` for Water Guardian, `/my-listings` for
   a settler asking about a cleaner-industry business idea, `/knowledge-keepers` for Knowledge
   Elder, etc.)
2. **What real-world action that feature actually represents** — the Mule should never let a
   settler mistake "I did the in-app thing" for "the real-world work happened," the same
   distinction `blog-the-lessons-are-real.md`'s Q&A section already draws explicitly for the
   whole platform.
3. **How this connects to the larger goal** — named plainly: less toxic, more biodiverse, more
   safely governed, more peaceful, in the settler's own real community, not just their settlement.
   This is the one place a profile's *voice* differs — Land Steward says this in practical
   land-care terms, Commons Keeper in governance/relationship terms, Biodiversity Scout in
   habitat-connectivity terms — but the structure (real feature → real action → real goal) is
   the same across all six.

This mirrors the honesty discipline this whole project already runs on (see `blog-the-lessons-
are-real.md`'s "real today / roadmap" split, `blog-following-through.md`'s accountability
framing) — the Mule should never claim credit for real-world outcomes it can only nudge toward.

---

## 4. Local, small-hardware LLM target

The explicit engineering goal: a real local language model backing every profile, running
entirely on the settler's own device or a modest local node — no cloud inference call, keeping
the corpus-sovereignty principle `GLOSSARY.md` [26] already stated, just achieved with a real
model instead of no model.

**Workshop test target**: the maintainer named a specific small model to prototype against,
transcribed here as **"Kino 3.3"** — the exact vendor/model name and version should be confirmed
against the actual model card before this becomes a real dependency anywhere in the codebase;
this spec does not assert a specific parameter count, license, or provenance for it, since that
wasn't independently verified while writing this document.

Design constraints this implies, regardless of which exact model ends up chosen:

- **Small enough to run on modest consumer hardware** — no assumption of a dedicated GPU or
  cloud-class inference budget. This is a hardware-accessibility requirement in the same spirit
  as the platform's offline-first PWA work (`blog-field-ready-global-systems.md`) — a settler in
  a low-bandwidth or low-power-budget context should not be locked out of having a Mule.
- **One model, six personas** — the profile-switching mechanism (§1) has to be a
  prompt/system-context change, not six separately-loaded models; loading six small models would
  likely cost more memory than one slightly larger one.
- **Corpus stays local** — matches the existing `[26]` principle exactly; only the "no LLM"
  clause is what's being revised, not the "no cloud" clause.
- **Phase 1 remains a stub, same as `SPEC_MULEBOT_API.md` already planned** — mock responses
  first, real local inference second. This spec doesn't change that phased implementation path,
  only what Phase 2+ is actually implementing (a real small local model instead of a
  corpus-lookup-only system).

---

## 5. UI/UX — initial elements

Two screens, both drafted as a companion design artifact to this spec (see the linked Artifact,
or `docs/mule-holographic-profiles-mockup.html` if exported to the repo):

1. **Profile selector** — reached from the settlement gallery, the same place `[26]` mule-bot
   already lives. A grid of six holographic profile cards, each a re-tinted `MuleCreature.vue`
   silhouette per §1/§2, with the profile name, a one-line description, and which real-world
   mission emphasis it leads with. Selecting one doesn't lock out the others — a settler can
   switch profiles per-conversation; the corpus and settlement context carry over regardless of
   which profile is currently speaking.
2. **Active-profile dashboard** — the chosen profile's "home" view: a status summary in the
   shape `SPEC_MULEBOT_API.md`'s root endpoint already defines (corpus freshness, next
   recommended action, current earnings) plus a visible "why this matters" line connecting the
   next recommended action to the profile's real-world mission emphasis (§3), so the mission
   framing is never just marketing copy sitting apart from the actual interface.

---

## 6. What this spec does not do

- Does not implement the local-LLM inference layer, the profile-switching UI, or the new
  `governance` domain entry — all future work, named explicitly rather than implied as done.
- Does not touch `MuleCreature.vue`'s actual SVG markup — the re-tinting described in §1 is a
  design direction (palette/animation swap per profile), not a code change made by this document.
- Does not revise `SPEC_MULEBOT_API.md`'s endpoint map — that remains the resource model
  underneath whichever profile is active; only the persona/framing layer on top of it changes.
- Does not decide the exact wording each profile uses — that's a content-writing pass, not an
  architecture decision, and belongs after the profile roster (§2) and mission-framing pattern
  (§3) are confirmed.

## 7. Open questions

- Exact identity/provenance of the "Kino 3.3" workshop test target (§4) — needs confirming
  before any real dependency is added.
- Whether all six profiles ship at once or Land Steward + General Mule ship first as the two
  with the most existing real feature-surface behind them, with the other four following once
  Commons Keeper's `governance` domain entry (§2.1) exists.
- Whether profile-switching is a settler-facing setting (persistent per-settlement default) or a
  per-conversation choice with no persistence — affects whether this needs a new localStorage key
  or just client-side session state.

---

*Related: `SPEC_MULEBOT_API.md` (resource/endpoint model, unchanged), `GLOSSARY.md` [26] mule-bot
(needs a matching update — see that entry), `src/data/domain-competency.ts` (domain taxonomy
reused in §2), `SPEC_NETWORKS_OF_TRUST.md` (Commons Keeper's trust-rung reference in §2.1).*
