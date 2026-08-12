# PWA: Data Retention, Privacy, and User Experience

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Current user base: zero — this is pre-launch. Written as a forward-looking design pass, not
a retrofit around existing usage patterns, since none exist yet to be constrained by. That's
worth using: whatever PWA identity and caching shape ships first is the one real users will
form expectations around, so it's worth getting the shape right before that happens rather
than after.*

---

## 1. What's already built (more than expected)

Checked against the actual config rather than assumed. `quasar.config.js`'s `pwa` block
already has real Workbox infrastructure, not a stub:

| Mechanism | Scope | Strategy |
|---|---|---|
| OSM map tiles | eco-ops site maps | `CacheFirst`, 30-day TTL, 1,500-tile cap (~15 MB) |
| Supabase REST API | site lists, monitoring records, country standards | `NetworkFirst`, 3s timeout → falls back to cache, 24h TTL |
| Supabase Storage | photos, exports, print docs | `CacheFirst`, 7-day TTL |
| Monitoring/water-quality POST | offline submission | `NetworkOnly` + **Background Sync** queue, retried up to 24h |
| IPFS gateway content | pinned settlement content | `CacheFirst`, 1-year TTL (content-addressed, genuinely immutable) |

Plus a real offline data layer independent of the service worker:
`src/stores/eco-offline.ts` — hand-rolled IndexedDB (`submission-queue` +
`draft-store` object stores), online/offline event listeners, retry logic, a 7-day
synced-item cleanup pass, and a JSON export escape hatch. This is a genuinely
solid offline-first pattern already proven in production code, not a
prototype — worth reusing rather than inventing a second offline pattern
elsewhere in the app (see `SPEC_SKY_DATA_REGIMES.md` §5, which does exactly this
for a different subsystem).

## 2. The gap: one identity, scoped to one-eighth of the app

The manifest is entirely eco-ops-branded:

```js
manifest: {
  name: 'Exotopia Eco Ops',
  short_name: 'Eco Ops',
  start_url: '/eco-ops',
  ...
}
```

`InstallPrompt.vue` is mounted app-wide (`MainLayout.vue`), so it can trigger from *any*
page — the cosmic web, a settlement surface, the gallery — but its copy ("Add Eco Ops to your
home screen," offline monitoring/photos/map-tile features) and the resulting installed app's
identity, icon, and `start_url` are all eco-ops-specific regardless of where the user
triggered install from. A settler installing from their dome interior lands back at
`/eco-ops` every time they reopen the installed app. This isn't a bug exactly — eco-ops is
real, shipped, and deliberately offline-first — but it means the *rest* of the app (settlements,
the cosmic web, the gallery, sky data) currently has no installable identity of its own at all.

**Recommendation**: broaden the manifest to represent Exotopia as a whole —
`name: 'Exotopia'`, `start_url: '/'` — and keep the existing eco-ops `shortcuts` entries
(already present: "New monitoring record," "My sites") as exactly what shortcuts are for:
fast entry points into one part of a broader installed app, not the app's entire identity.
`InstallPrompt.vue`'s copy should generalize accordingly (or become context-aware — different
feature bullets depending on which route triggered it — if that's worth the complexity; a
single broadened pitch is the simpler v1).

## 3. Data retention — what it actually means in this architecture

This matters more here than in a typical app, because of a decision already made and
documented elsewhere (`SETTLEMENT_ADDRESS_API.md`): **there is no settlements database.** A
settlement record lives in exactly two places — the owning browser's `localStorage`
(E8-lattice-obfuscated via `storage-cipher.ts`), and optionally an IPFS pin if the owner chose
to pin it. There's no server-side fallback if that local data is lost. That makes browser
storage durability a genuinely load-bearing property, not a nice-to-have — losing the
`localStorage` entry *is* losing the settlement, full stop, for anyone who never pinned it.

Browsers evict site storage under pressure, more aggressively for sites that were never
installed and haven't been visited recently. The concrete, actionable levers:

- **`navigator.storage.persist()`** — not called anywhere in this codebase today. Requesting
  it (best-effort; browsers grant more readily to installed/engaged origins, per Chrome's own
  documented heuristics) reduces eviction risk for exactly the `localStorage` settlement
  records and IndexedDB stores (`eco-ops-offline`, and `SPEC_SKY_DATA_REGIMES.md`'s proposed
  `sky-cache`) that have no server backup. Cheap to add, no UX cost if silently best-effort
  (matches how `eco-offline.ts` doesn't ask permission for its own IndexedDB usage either).
- **Install = retention signal.** A broadened, whole-app manifest (§2) makes "install" a
  meaningful action a settler can take specifically *because* they understand their settlement
  is otherwise only as durable as this one browser profile — that's a real, honest reason to
  install, distinct from eco-ops' "works with no signal" pitch. Worth surfacing directly in
  product copy once the manifest broadens: not just "install for convenience" but "install so
  your settlement doesn't disappear if you clear this browser."
- **The IPFS pin is the actual backup**, not the PWA — worth being precise about this
  distinction in any user-facing copy the broadened install prompt uses. Storage persistence
  reduces the *chance* of local loss; it isn't a substitute for pinning, which is durability
  independent of this device entirely. Don't let "install the app" messaging accidentally imply
  it replaces "pin your settlement."

## 4. Privacy — the PWA layer shouldn't quietly change the existing model

`legal-privacy.md` and `compliance/INDEX.md` already commit this app to a local-first,
non-custodial posture. The PWA/service-worker layer doesn't change *what's* collected, but it
does add a new place data physically sits on a device, worth reviewing explicitly rather than
assuming it's automatically fine:

- **`supabase-api-v1`'s 24h `NetworkFirst` cache** — currently matches *any*
  `*.supabase.co/rest/v1/` request. Worth an explicit check (not assumed here, genuinely
  worth someone auditing): does any cached response ever include a signed-in member's own
  profile/account data, as opposed to only public site-list/monitoring-record data? On a
  shared or public device, a 24h-cached authenticated response sitting in the Cache Storage
  API is a real, concrete privacy surface that a purely in-memory or `NetworkOnly` fetch
  wouldn't have. If any authenticated endpoint is currently caught by this pattern, either
  scope the `urlPattern` away from it or drop the cache TTL to something session-length.
- **Nothing here should read as "we now track more."** The whole point of the local-first
  architecture is that Exotopia itself has no shared settlements database to leak from in the
  first place (§3) — the PWA layer is entirely about *this device* keeping *its own* data
  reliably, not about any new data reaching SCD Hub. Worth stating that distinction plainly in
  whatever public-facing copy eventually explains the install prompt, since "install this app"
  and "we're collecting more about you" are easy to conflate if not addressed directly.

## 5. Reconciling with `SPEC_SKY_DATA_REGIMES.md`

That spec (written just before this one) designed a custom IndexedDB `sky-cache` store to
avoid re-fetching regime sky files. Having now looked at the *existing* Workbox
`runtimeCaching` array (§1) — which currently has **no rule at all** for `/sky/`,
`/star-systems/`, `/clusters/`, `/exoplanets-viz.json`, or `/topo-params.json` — the simpler
first move is almost certainly a `CacheFirst` runtime-caching rule for `/sky/regimes/` and
`/sky/deltas/`, matching the same pattern already proven for IPFS content: zero new app code,
automatic for every `fetch()` regardless of which component makes it, browser-managed
eviction. That would cover the core "don't re-download a regime you already have" goal with
far less code than a hand-rolled IndexedDB store.

The custom IndexedDB layer would still add real value *on top* of that — specifically,
app-level `generator_version` invalidation (a Workbox `expiration.maxAgeSeconds` TTL is a
blunter proxy for "this regime file changed" than checking an explicit version field) and
structured bulk-pruning by `regimeId`. Recommendation: ship the Workbox `CacheFirst` rule
first as the simple, high-leverage move; treat the custom IndexedDB store as a deferred
enhancement only if TTL-based invalidation proves too imprecise in practice, not as the
default starting point `SPEC_SKY_DATA_REGIMES.md` §5 currently assumes.

## 6. Open questions

**Q1 — Does the broadened manifest need its own icon set**, or do the existing eco-ops icons
(`icons/icon-*.png`) serve as Exotopia's general identity too? Given zero current install
base, this is a good moment to decide rather than one that breaks existing installs.

**Q2 — Should `navigator.storage.persist()` be requested silently on first settlement
creation, or gated behind an explicit "keep my settlement safe on this device" toggle** tied
to the durability messaging in §3? Leaning silent-first (matches `eco-offline.ts`'s existing
no-prompt precedent), revisit if storage eviction turns out to be a real support issue once
there's an actual user base to observe it with.

**Q3 — Multi-manifest support.** Some browsers allow swapping `<link rel="manifest">` per
route for scoped install identities (an "Eco Ops" install *and* a separate "Exotopia" install
from the same origin). Not pursued here — added complexity for a distinction real users
haven't asked for yet, since there are none — but worth revisiting if eco-ops and the main
settlement experience turn out to attract genuinely different installed-app audiences once
there's usage data to look at.

## 7. Related documents

- `SPEC_SKY_DATA_REGIMES.md` — the caching design this spec's §5 revises
- `SETTLEMENT_ADDRESS_API.md` — the local-first, no-shared-database architecture §3's
  retention argument depends on
- `legal-privacy.md`, `compliance/INDEX.md` — the existing privacy commitments §4 checks the
  service-worker cache against
- `src/stores/eco-offline.ts` — the existing offline/IndexedDB pattern, proven and reused
  rather than duplicated
