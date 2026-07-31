# SPEC_COMMUNITY_NODES.md — Business Listings, Locations, Creative Pages, and "X"

**SCD Hub · Exotopia.org · Active — v1 · GPL v3**

---

## 1. What this is

A "community node" is a self-service content record a member creates and manages: a business
listing, a business location, a music/creative page — or a type nobody has designed yet. Nodes are
the data source behind `OrbitalGalleryEntry[]` (`src/lib/defender-nav.types.ts`), a rendering
pipeline that existed fully-built and fully wired in `DefenderNav.vue` but had nothing feeding it —
every page that assembled `DefenderNavData` hardcoded `galleries: []`. This spec is about the data
model that finally populates it, and specifically the mechanism that lets new node types get added
without a schema rewrite each time.

**Not a marketplace.** A node describes what someone offers and how to reach them. It never carries
a price, cart, or checkout. See `supabase/migrations/008_community_nodes.sql`'s header for why that
line matters given the "Exchange Depot" removal (`blog-risk-reduction-pass.md`).

## 2. The extensibility mechanism ("X")

`community_nodes.node_type` is a `CHECK`-constrained allow-list — currently `business_listing`,
`business_location`, `creative_page` — not a free string. This is a deliberate trade-off, not an
oversight: fully arbitrary client-supplied type strings are an ops-sec smell (an unvalidated
enum-like column feeding public-facing rendering logic); a rigid, un-extensible schema defeats the
point of building this generically in the first place. The resolution:

- **Adding a new type is a small additive migration**: widen the `CHECK` constraint
  (`ALTER TABLE community_nodes DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (node_type IN (...))`),
  add a case to `nodeTypeToGalleryType()` in `src/stores/community-nodes.ts` (mapping the new type to
  an existing `GalleryType`), and add the type-specific form fields to `CommunityNodesPage.vue`.
  No table redesign, no data migration for existing rows.
- **Type-specific shape lives in `metadata` (jsonb)**, validated at the application layer per
  `node_type`, not in SQL. This is where "X"'s actual fields go — SQL only ever sees an opaque
  object.
- **What never becomes a column**: a price, an offer, a bid. If a future node type genuinely needs
  one, that's a new risk review (Howey-adjacent framing, same category as the removed Exchange
  Depot), not a quiet schema addition.

## 3. Ties to the existing addressing system

A node optionally carries `hostname` (matches `StarSystem.hostname`, scoping which system's gallery
it appears in — free-text, not a foreign key, same loose-reference pattern as
`knowledge_keeper_records.site_ref` / `focus_areas.base_address`) and `exoloc_address` (a full
address in `SPEC_EXOLOC_ADDRESS.md`'s grammar, if the node is attached to a specific settlement
rather than just "somewhere in this system"). See `SETTLEMENT_ADDRESS_API.md` for the address
system's own dependency chain and current gaps (no server-side lookup API yet) — this table doesn't
change any of that; it's a consumer of the address format, not a new authority over it.

## 4. Data ownership and self-host / offramp

Consistent with `compliance/INDEX.md`'s "tool, not custodian" stance: a node's owner can download a
complete, re-importable JSON export of everything they've listed at any time
(`useCommunityNodesStore().exportForSelfHost()`, surfaced as a button on `/my-listings`), independent
of the account-wide export at `/account` (which also now includes `community_nodes` rows via
`member.ts::exportMyData()` for a single unified download). Because the whole platform is GPL v3, an
owner who wants out entirely can run their own instance against their own Supabase project and
re-create their listings there from that export — no migration tooling is promised beyond the
export itself existing in a documented, stable shape.

## 5. Security model summary

Follows the pattern migration 007 established for the reward ledger, not a new one:

- Self-publish is immediate — owners can create/edit/toggle `draft`↔`published` on their own nodes
  without review, matching how every real business-directory product works.
- Creation is rate-limited server-side (5 per 24h per owner) via a `BEFORE INSERT` trigger, so a
  scripted client can't flood the table.
- An owner cannot self-reverse an admin takedown (`archived` → anything else requires
  `is_admin()`), enforced by a `BEFORE UPDATE` trigger, not just RLS.
- No client `DELETE`. Removal is `status = 'archived'` (self-service or admin) or a full
  account-level erasure via the existing `deletion_requests` path (migration 004) — no second
  hard-delete surface was added.
- Every `SECURITY DEFINER` function has `search_path` pinned explicitly in its own definition
  (migration 007's dynamic pin only covered functions that existed at the time it ran).

## 6. Related documents

- `supabase/migrations/008_community_nodes.sql` — the schema itself
- `src/stores/community-nodes.ts` — data access, offline queue, gallery mapping, export
- `src/lib/defender-nav.types.ts` — the `OrbitalGalleryEntry` contract this feeds
- `SPEC_EXOLOC_ADDRESS.md` / `SETTLEMENT_ADDRESS_API.md` — the addressing system nodes attach to
- `SPEC_WORLDBRIDGER_ONE.md` — if a future node type needs multi-author attribution/royalty-split
  (a `cooperative` or `dao`-ownership node with several contributors), defer to that mechanism
  rather than inventing a second one here
