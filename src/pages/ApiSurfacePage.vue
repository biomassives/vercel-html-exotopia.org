<template>
  <q-page class="as-page">
    <div class="as-wrap">

      <!-- Header -->
      <div class="as-header">
        <div class="as-badge">CURRENT STATE — AS BUILT, NOT AS PLANNED</div>
        <h1 class="as-title">API &amp; Data Surface</h1>
        <p class="as-sub">
          Every table, static data file, address format, and pure-function SDK that makes up
          Exotopia's data/API surface today, in one place. Anything not yet shipped is labelled
          <span class="as-tag as-tag--specified">SPECIFIED</span> or
          <span class="as-tag as-tag--gap">NOT BUILT</span> rather than presented as live.
          See <code class="as-code">SPEC_API_PRODUCT.md</code> for the refined data-model and
          distribution/federation plan built on top of this inventory.
        </p>
        <div class="as-stat-row">
          <div class="as-stat"><div class="as-stat-n">{{ TOTAL_TABLES }}</div><div class="as-stat-l">tables, 9 domains</div></div>
          <div class="as-stat"><div class="as-stat-n">{{ FETCHED_JSON.length }}</div><div class="as-stat-l">fetched JSON sources</div></div>
          <div class="as-stat"><div class="as-stat-n">8</div><div class="as-stat-l">exoloc scopes (4 live)</div></div>
          <div class="as-stat"><div class="as-stat-n">4</div><div class="as-stat-l">pure-function SDK files</div></div>
        </div>
      </div>

      <!-- ── SYSTEM DIAGRAM ─────────────────────────────────────────────── -->
      <section class="as-section">
        <h2 class="as-section-title">⬡ How the four pieces fit together</h2>
        <div class="as-diagram-wrap">
          <svg viewBox="0 0 900 260" class="as-diagram-svg" preserveAspectRatio="xMidYMid meet">
            <!-- connecting lines -->
            <path d="M 155 70 L 155 190" fill="none" stroke="rgba(0,160,210,0.30)" stroke-width="1.4"/>
            <path d="M 380 70 L 380 190" fill="none" stroke="rgba(0,160,210,0.30)" stroke-width="1.4"/>
            <path d="M 605 70 L 605 190" fill="none" stroke="rgba(0,160,210,0.30)" stroke-width="1.4"/>
            <path d="M 155 130 L 605 130" fill="none" stroke="rgba(0,160,210,0.18)" stroke-width="1.2" stroke-dasharray="3,3"/>
            <path d="M 745 190 L 745 130 L 605 130" fill="none" stroke="rgba(255,170,60,0.45)" stroke-width="1.3" stroke-dasharray="4,3"/>

            <!-- Box 1: Static JSON -->
            <g>
              <rect x="30" y="18" width="250" height="52" rx="6" fill="rgba(0,20,45,0.75)" stroke="rgba(0,160,210,0.45)" stroke-width="1"/>
              <text x="155" y="38" text-anchor="middle" class="as-svg-title">Static JSON Data</text>
              <text x="155" y="54" text-anchor="middle" class="as-svg-sub">public/*.json — built offline, served as files</text>
            </g>

            <!-- Box 2: Address grammar -->
            <g>
              <rect x="330" y="18" width="150" height="52" rx="6" fill="rgba(0,20,45,0.75)" stroke="rgba(0,160,210,0.45)" stroke-width="1"/>
              <text x="405" y="38" text-anchor="middle" class="as-svg-title">Address Grammar</text>
              <text x="405" y="54" text-anchor="middle" class="as-svg-sub">exotopia:{scope}:{path}</text>
            </g>

            <!-- Box 3: Local SDK -->
            <g>
              <rect x="530" y="18" width="150" height="52" rx="6" fill="rgba(0,20,45,0.75)" stroke="rgba(0,160,210,0.45)" stroke-width="1"/>
              <text x="605" y="38" text-anchor="middle" class="as-svg-title">Local SDK</text>
              <text x="605" y="54" text-anchor="middle" class="as-svg-sub">pure TS functions, no server</text>
            </g>

            <!-- Box 4: gap -->
            <g>
              <rect x="700" y="150" width="185" height="52" rx="6" fill="rgba(40,20,0,0.55)" stroke="rgba(255,170,60,0.45)" stroke-width="1" stroke-dasharray="3,3"/>
              <text x="792" y="170" text-anchor="middle" class="as-svg-title as-svg-title--gap">GET /api/v1/exoloc</text>
              <text x="792" y="186" text-anchor="middle" class="as-svg-sub as-svg-sub--gap">specified, not built</text>
            </g>

            <!-- Box: Supabase schema -->
            <g>
              <rect x="30" y="190" width="640" height="60" rx="6" fill="rgba(0,20,45,0.80)" stroke="rgba(0,200,150,0.45)" stroke-width="1.1"/>
              <text x="350" y="212" text-anchor="middle" class="as-svg-title">Supabase Schema — 9 domains, {{ TOTAL_TABLES }} tables</text>
              <text x="350" y="230" text-anchor="middle" class="as-svg-sub">public + eco_ops · RLS-gated · already reachable at /rest/v1/&lt;table&gt; on public-read tables</text>
            </g>
          </svg>
        </div>
        <p class="as-body">
          The four pieces were built independently, at different times, for different immediate needs —
          not designed as one system. A settlement's <strong>address</strong> is a pure offline string
          (no server involved at all). The <strong>local SDK</strong> builds and validates those strings
          and manages the client-local settlement record. The <strong>Supabase schema</strong> is the one
          real stateful backend, reached today either through the app's own client calls or — because
          Supabase auto-generates PostgREST — directly at <code class="as-code">/rest/v1/&lt;table&gt;</code>
          for anything with a public-read RLS policy. A documented, versioned <code class="as-code">/api/v1/…</code>
          layer in front of all of this is specified in <code class="as-code">SPEC_EXOLOC_ADDRESS.md</code>
          §5 but does not exist in this codebase.
        </p>
      </section>

      <!-- ── TABS ───────────────────────────────────────────────────────── -->
      <section class="as-section">
        <q-tabs
          v-model="tab"
          class="as-tabs"
          active-color="cyan-4"
          indicator-color="cyan-4"
          align="left"
          dense
          no-caps
        >
          <q-tab name="database" label="Database (Supabase)" />
          <q-tab name="static" label="Static Data Files" />
          <q-tab name="address" label="Address Grammar" />
          <q-tab name="sdk" label="Local SDK" />
          <q-tab name="gaps" label="Gaps &amp; Roadmap" />
        </q-tabs>

        <q-tab-panels v-model="tab" class="as-panels" animated>

          <!-- ═══════════ DATABASE ═══════════ -->
          <q-tab-panel name="database" class="as-panel">

            <div class="as-warn">
              <div class="as-warn-icon">⚠</div>
              <div>
                <div class="as-warn-title">Migration numbering collision — real, both applied, not renumbered</div>
                <div class="as-warn-body">
                  <code class="as-code">supabase/migrations/</code> has two files sharing prefix
                  <strong>015</strong> (<code class="as-code">015_settlements.sql</code> /
                  <code class="as-code">015_support_messages.sql</code>) and two sharing prefix
                  <strong>018</strong> (<code class="as-code">018_member_participation_mode.sql</code> /
                  <code class="as-code">018_pfas_log_fingerprint.sql</code>). Both pairs are real, applied
                  migrations — this is a genuine numbering gap, not a typo in this page. Renumbering
                  applied migrations is a real, separate decision for a human to make (it touches whatever
                  migration-tracking table records what's already run) — this page documents the collision
                  rather than silently fixing it. See <code class="as-code">SPEC_API_PRODUCT.md</code> §3.2
                  for a proposed numbering-discipline rule going forward.
                </div>
              </div>
            </div>

            <div class="as-domain-list">
              <q-expansion-item
                v-for="d in DOMAINS"
                :key="d.id"
                class="as-domain"
                header-class="as-domain-header"
                expand-icon-class="as-domain-icon"
                :label="`${d.icon}  ${d.label}`"
                :caption="`${d.tables.length} table${d.tables.length === 1 ? '' : 's'} · migrations ${d.migrations.join(', ')}`"
                default-opened
              >
                <div class="as-domain-body">
                  <p v-if="d.note" class="as-domain-note">{{ d.note }}</p>
                  <div class="as-table-list">
                    <div v-for="t in d.tables" :key="t.name" class="as-table-row">
                      <div class="as-table-name">
                        <span v-if="t.schema !== 'public'" class="as-schema-tag">{{ t.schema }}.</span>{{ t.name }}
                      </div>
                      <div class="as-table-mig">{{ t.migration }}</div>
                      <div class="as-table-rls">
                        <span class="as-rls-badge" :class="`as-rls-badge--${t.rlsClass}`">{{ t.rlsLabel }}</span>
                      </div>
                      <div class="as-table-desc">{{ t.desc }}</div>
                    </div>
                  </div>
                </div>
              </q-expansion-item>
            </div>
          </q-tab-panel>

          <!-- ═══════════ STATIC DATA ═══════════ -->
          <q-tab-panel name="static" class="as-panel">
            <h3 class="as-sub-head">Fetched at runtime</h3>
            <p class="as-body">Confirmed by grepping every <code class="as-code">fetch(</code> call in
              <code class="as-code">src/stores/</code> and page components against files in
              <code class="as-code">public/</code> — this list is not a guess.</p>
            <div class="as-json-table">
              <div class="as-json-row as-json-row--head">
                <span>Path</span><span>Size</span><span>Contains</span><span>Consumer</span>
              </div>
              <div v-for="f in FETCHED_JSON" :key="f.path" class="as-json-row">
                <span class="as-json-path">{{ f.path }}</span>
                <span class="as-json-size">{{ f.size }}</span>
                <span class="as-json-desc">{{ f.desc }}</span>
                <span class="as-json-consumer">{{ f.consumer }}</span>
              </div>
            </div>

            <h3 class="as-sub-head q-mt-lg">Present in <code class="as-code">public/</code>, not fetched anywhere</h3>
            <p class="as-body">Build-pipeline inputs/outputs and staged files with no
              <code class="as-code">fetch()</code> call referencing them anywhere in <code class="as-code">src/</code> —
              listed here so they read as build artifacts, not as part of the live surface.</p>
            <div class="as-json-table">
              <div class="as-json-row as-json-row--head">
                <span>Path</span><span>Size</span><span style="grid-column: span 2">Note</span>
              </div>
              <div v-for="f in UNUSED_JSON" :key="f.path" class="as-json-row as-json-row--unused">
                <span class="as-json-path">{{ f.path }}</span>
                <span class="as-json-size">{{ f.size }}</span>
                <span class="as-json-desc" style="grid-column: span 2">{{ f.desc }}</span>
              </div>
            </div>
          </q-tab-panel>

          <!-- ═══════════ ADDRESS GRAMMAR ═══════════ -->
          <q-tab-panel name="address" class="as-panel">
            <p class="as-body">
              Canonical format: <code class="as-code">exotopia:{{ '{scope}' }}:{{ '{path}' }}</code> — a pure,
              offline string with no collision authority (see <code class="as-code">SETTLEMENT_ADDRESS_API.md</code>).
              Full grammar in <code class="as-code">SPEC_EXOLOC_ADDRESS.md</code>.
            </p>
            <div class="as-scope-list">
              <div v-for="s in SCOPES" :key="s.scope" class="as-scope-card">
                <div class="as-scope-head">
                  <span class="as-scope-name">{{ s.scope }}</span>
                  <span class="as-tag" :class="s.status === 'Production' ? 'as-tag--built' : 'as-tag--specified'">{{ s.status }}</span>
                </div>
                <div class="as-scope-desc">{{ s.desc }}</div>
                <div class="as-scope-example">{{ s.example }}</div>
              </div>
            </div>
            <div class="as-warn as-warn--gap q-mt-md">
              <div class="as-warn-icon">🛑</div>
              <div>
                <div class="as-warn-title">GET /api/v1/exoloc — confirmed absent</div>
                <div class="as-warn-body">
                  Named as "Public API" in <code class="as-code">SPEC_EXOLOC_ADDRESS.md</code>'s own header,
                  but re-verified directly for this audit: <code class="as-code">api/</code> in this repo
                  contains only a static <code class="as-code">gallery1.json</code>, and no
                  <code class="as-code">exoloc</code> handler exists anywhere in <code class="as-code">src/</code>
                  or <code class="as-code">api/</code>. <code class="as-code">SETTLEMENT_ADDRESS_API.md</code> §1
                  already said so as of its last update; still true today.
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- ═══════════ LOCAL SDK ═══════════ -->
          <q-tab-panel name="sdk" class="as-panel">
            <p class="as-body">
              Four pure-function TypeScript files — no server calls except where noted — that amount to a
              real, unpackaged SDK for anyone building against Exotopia's address and settlement model
              client-side.
            </p>
            <div class="as-sdk-list">
              <div v-for="f in SDK_FILES" :key="f.file" class="as-sdk-card">
                <div class="as-sdk-head">
                  <code class="as-sdk-file">{{ f.file }}</code>
                  <span class="as-tag as-tag--built">BUILT</span>
                </div>
                <div class="as-sdk-desc">{{ f.desc }}</div>
                <div class="as-sdk-exports">
                  <div v-for="e in f.exports" :key="e" class="as-sdk-export">{{ e }}</div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- ═══════════ GAPS ═══════════ -->
          <q-tab-panel name="gaps" class="as-panel">
            <div class="as-gap-list">
              <div v-for="g in GAPS" :key="g.title" class="as-gap-item">
                <span class="as-tag" :class="`as-tag--${g.tagClass}`">{{ g.tag }}</span>
                <div>
                  <div class="as-gap-title">{{ g.title }}</div>
                  <div class="as-gap-desc" v-html="g.desc"></div>
                </div>
              </div>
            </div>
          </q-tab-panel>

        </q-tab-panels>
      </section>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const tab = ref('database')

// ── Database domains ──────────────────────────────────────────────────────
// RLS classes: 'public' (public read) | 'owner' (owner+admin only) |
// 'server' (no client write, RPC/trigger only) | 'mixed' (tiered) | 'admin' (admin-only)

interface TableInfo {
  name: string
  schema: 'public' | 'eco_ops'
  migration: string
  rlsClass: 'public' | 'owner' | 'server' | 'mixed' | 'admin'
  rlsLabel: string
  desc: string
}

interface Domain {
  id: string
  label: string
  icon: string
  migrations: string[]
  note?: string
  tables: TableInfo[]
}

const DOMAINS: Domain[] = [
  {
    id: 'identity', label: 'Identity & Social', icon: '👤', migrations: ['001', '018'],
    tables: [
      { name: 'members', schema: 'public', migration: '001', rlsClass: 'public', rlsLabel: 'Public read · self write', desc: 'One row per registered member, keyed to auth.users.id.' },
      { name: 'connections', schema: 'public', migration: '001', rlsClass: 'owner', rlsLabel: 'Read own only', desc: 'Green-light mutual-opt-in graph gating comments and mentorship.' },
      { name: 'comments', schema: 'public', migration: '001', rlsClass: 'owner', rlsLabel: 'Author + connected only', desc: 'Blog comment threads, parent/child replies.' },
      { name: 'reactions', schema: 'public', migration: '001', rlsClass: 'owner', rlsLabel: 'Author + connected only', desc: 'Emoji reactions on comments.' },
      { name: 'member_participation_mode', schema: 'public', migration: '018_member_participation_mode', rlsClass: 'admin', rlsLabel: 'Self + admin read · no client update', desc: 'Self-attested adult/group/youth bracket — deliberately not public, unlike members, since "is this a minor" must never be public-readable.' },
    ],
  },
  {
    id: 'rewards', label: 'Rewards & Incentive Ledger', icon: '🏅', migrations: ['002', '007', '014'],
    tables: [
      { name: 'reward_events', schema: 'public', migration: '002 / 007', rlsClass: 'server', rlsLabel: 'Public read · RPC-only write', desc: 'Append-only points ledger. All writes go through award_self_reported()/award_quiz_completion()/debit_construction() since migration 007 closed the raw-insert hole.' },
      { name: 'certificates', schema: 'public', migration: '002 / 007', rlsClass: 'server', rlsLabel: 'Public read · derived only', desc: 'Issued credentials, never self-issued — minted only by refresh_certificates().' },
      { name: 'mentor_sessions', schema: 'public', migration: '002 / 007', rlsClass: 'owner', rlsLabel: 'Both parties only', desc: 'Peer mentorship pairing with pair-cooldown and immutable-field guards.' },
      { name: 'admin_members', schema: 'public', migration: '002 / 007', rlsClass: 'admin', rlsLabel: 'Self + admin read only', desc: 'Small admin allow-list — was public-read until 007 stopped broadcasting it to every visitor.' },
      { name: 'points_catalog', schema: 'public', migration: '007', rlsClass: 'public', rlsLabel: 'Public read · migration-only write', desc: 'Server-authoritative point values per action_key — the client never supplies a point value.' },
      { name: 'quiz_reward_rules', schema: 'public', migration: '007', rlsClass: 'public', rlsLabel: 'Public read', desc: 'Quiz pass thresholds and prerequisite chains.' },
      { name: 'construction_catalog', schema: 'public', migration: '014', rlsClass: 'public', rlsLabel: 'Public read · migration-only write', desc: 'Server-side item build costs — debited via debit_construction(), a real negative reward_events row.' },
    ],
  },
  {
    id: 'pfas', label: 'PFAS Citizen Science', icon: '🧪', migrations: ['003', '018'],
    note: 'Fully public system throughout (SELECT true) — meant to be readable by signed-out visitors, not gated behind connections like the comment system.',
    tables: [
      { name: 'focus_areas', schema: 'public', migration: '003', rlsClass: 'public', rlsLabel: 'Fully public read · owner write', desc: 'A place (real or simulated) with PFAS/PFOA relevance.' },
      { name: 'decon_projects', schema: 'public', migration: '003', rlsClass: 'public', rlsLabel: 'Fully public read · owner write', desc: 'A specific decontamination effort at a focus area.' },
      { name: 'project_log_entries', schema: 'public', migration: '003 / 018_pfas_log_fingerprint', rlsClass: 'public', rlsLabel: 'Fully public read · append-only', desc: 'Progress log entries — the actual logging surface. Server-computes a SHA-256 fingerprint on insert since 018.' },
      { name: 'method_proposals', schema: 'public', migration: '003', rlsClass: 'public', rlsLabel: 'Fully public read · author write', desc: 'Publicly proposed cleanup methods with precedent citations.' },
      { name: 'proposal_endorsements', schema: 'public', migration: '003', rlsClass: 'public', rlsLabel: 'Fully public read · append-only', desc: 'Lightweight public support signal on a method proposal.' },
      { name: 'branch_settlements', schema: 'public', migration: '003', rlsClass: 'public', rlsLabel: 'Fully public read · append-only', desc: 'First real exo-branch-v1 implementation — a Λ24-inspired "possible worlds" designation (structured comparison data, not genuine lattice decoding).' },
    ],
  },
  {
    id: 'ecology', label: 'Ecology & Biodiversity Citizen Science', icon: '🌿', migrations: ['009'],
    note: 'Mirrors the PFAS site → project → log shape exactly, renamed for this domain.',
    tables: [
      { name: 'ecology_sites', schema: 'public', migration: '009', rlsClass: 'public', rlsLabel: 'Fully public read · owner write', desc: 'A place with ecology/biodiversity relevance — carries a real access_status lifecycle (unresearched → map_research_done → inquiry_sent → access_confirmed).' },
      { name: 'ecology_projects', schema: 'public', migration: '009', rlsClass: 'public', rlsLabel: 'Fully public read · owner write', desc: 'A specific effort at a site — forest garden, rain garden, bird blind, restoration, survey.' },
      { name: 'ecology_log_entries', schema: 'public', migration: '009', rlsClass: 'public', rlsLabel: 'Fully public read · append-only', desc: 'Progress log entries, species counts / canopy % etc. in a free-form metrics jsonb column.' },
    ],
  },
  {
    id: 'settlements', label: 'Settlements (claim + publish)', icon: '🏠', migrations: ['012', '015', '016', '017'],
    tables: [
      { name: 'settlements', schema: 'public', migration: '015_settlements / 017', rlsClass: 'owner', rlsLabel: 'Owner-only CRUD', desc: 'Server-backed mirror of the client-local SettlementRecord — a signed-in member\'s claim surviving a cleared cache. No collision authority over key/exolocation, by design.' },
      { name: 'settlement_items', schema: 'public', migration: '016', rlsClass: 'owner', rlsLabel: 'Owner-only CRUD', desc: 'One row per (owner, settlement) holding the full item list as JSONB, mirroring the client\'s persist()-rewrites-the-array model.' },
      { name: 'settlement_profiles', schema: 'public', migration: '012', rlsClass: 'mixed', rlsLabel: 'Public when published', desc: 'The opt-in "publish a settlement page" flow — public_slug is a generated key, deliberately not the exoloc address itself.' },
    ],
  },
  {
    id: 'community-nodes', label: 'Community Nodes', icon: '🏪', migrations: ['008'],
    tables: [
      { name: 'community_nodes', schema: 'public', migration: '008', rlsClass: 'mixed', rlsLabel: 'Public when published', desc: 'Business/creative-page directory backing the orbital gallery pipeline. Explicitly not a marketplace — no price/offer/bid field. Rate-limited insert, guarded status transitions.' },
    ],
  },
  {
    id: 'knowledge-keepers', label: 'Knowledge Keepers', icon: '🌾', migrations: ['005'],
    tables: [
      { name: 'knowledge_keeper_records', schema: 'public', migration: '005', rlsClass: 'mixed', rlsLabel: 'Published tier public · pending tier restricted', desc: 'Wisdom-from-Elders contributions. Consent-tiered by submitter relationship: self/family/friend publish immediately, student_researcher holds for admin review.' },
    ],
  },
  {
    id: 'eco-ops', label: 'Eco Ops (separate `eco_ops` schema)', icon: '💧', migrations: ['013'],
    note: '013 backfills version control for a schema that was originally stood up directly on the hosted project via the Supabase dashboard — see that migration\'s own header for why this mattered (nobody could audit RLS from source until it existed). Deliberately excludes SPEC_ECO_OPS_API.md §8a\'s SME-payment columns and §8b\'s table_banking_requests, neither confirmed live.',
    tables: [
      { name: 'sites', schema: 'eco_ops', migration: '013', rlsClass: 'mixed', rlsLabel: 'Public tier public · else owner/admin', desc: 'Water quality, forest garden, rain garden, bird blind, language doc, PFAS, or elder-knowledge field site.' },
      { name: 'monitoring_records', schema: 'eco_ops', migration: '013', rlsClass: 'mixed', rlsLabel: 'Readable iff parent site is', desc: 'Parent record for type-specific observations; insertable by the named observer.' },
      { name: 'water_quality_obs', schema: 'eco_ops', migration: '013', rlsClass: 'mixed', rlsLabel: 'Readable iff parent site is', desc: 'pH, turbidity, nutrients, BMWP, cyanobacteria, PFAS ppt/compounds, UK CSO event fields.' },
      { name: 'macroinvertebrate_samples', schema: 'eco_ops', migration: '013', rlsClass: 'mixed', rlsLabel: 'Readable iff parent site is', desc: 'BMWP family/score detail rows.' },
      { name: 'country_standards', schema: 'eco_ops', migration: '013', rlsClass: 'public', rlsLabel: 'Public read · admin write', desc: 'US/KE/CR/CA/GB regulatory thresholds — reference data, not user data.' },
      { name: 'sme_profiles', schema: 'eco_ops', migration: '013', rlsClass: 'public', rlsLabel: 'Public read directory · self write', desc: 'Subject-matter-expert directory — display_name/expertise are meant to be discoverable.' },
      { name: 'sme_engagements', schema: 'eco_ops', migration: '013', rlsClass: 'owner', rlsLabel: 'Site owner + engaged SME only', desc: 'Site ↔ SME connection record.' },
      { name: 'knowledge_records', schema: 'eco_ops', migration: '013', rlsClass: 'mixed', rlsLabel: 'Public only if tier=public AND consented', desc: 'eco_ops-side elder/language/field-note records — separate from the public.knowledge_keeper_records table above.' },
      { name: 'certificates', schema: 'eco_ops', migration: '013', rlsClass: 'server', rlsLabel: 'Server-issued only', desc: 'Open Badges 3.0 / W3C VC 2.0 credentials — written only by a service-role Edge Function, never by a client policy.' },
    ],
  },
  {
    id: 'platform-ops', label: 'Platform Ops & Admin', icon: '🛠', migrations: ['004', '006', '010', '011', '015'],
    tables: [
      { name: 'deletion_requests', schema: 'public', migration: '004', rlsClass: 'owner', rlsLabel: 'Self read/insert/cancel · operator completes', desc: 'ARCO "cancellation" self-service queue — the actual delete still needs the Supabase Admin API.' },
      { name: 'video_suggestions', schema: 'public', migration: '010', rlsClass: 'mixed', rlsLabel: 'Approved public · pending restricted', desc: 'Moderation queue for the eco-ops library (ot6a.json) — approved rows are merged in client-side at load time, never written back to the static file.' },
      { name: 'app_error_logs', schema: 'public', migration: '011', rlsClass: 'admin', rlsLabel: 'Anyone inserts · admin-only read', desc: 'Client runtime error capture — errors can happen before sign-in resolves, so insert has no auth requirement.' },
      { name: 'support_messages', schema: 'public', migration: '015_support_messages', rlsClass: 'admin', rlsLabel: 'No client insert policy at all', desc: 'Site contact form inbox — written exclusively by the support-inbox Cloudflare Worker using the service-role key, after Turnstile + rate-limit checks the DB itself can\'t enforce.' },
    ],
  },
]

const TOTAL_TABLES = computed(() => DOMAINS.reduce((n, d) => n + d.tables.length, 0))

// ── Static data files ──────────────────────────────────────────────────────

interface JsonFile { path: string; size: string; desc: string; consumer?: string }

const FETCHED_JSON: JsonFile[] = [
  { path: '/exoplanets-viz.json', size: '2.9 MB', desc: '6,158 confirmed planets — the primary visualization set', consumer: 'src/stores/galaxy.ts' },
  { path: '/frontier-exoplanets.json', size: '2.4 MB', desc: '~5,000 planets / 2,885 systems — modeled sky-gap fill, not real detections', consumer: 'src/stores/galaxy.ts' },
  { path: '/candidate-exoplanets.json', size: '4.4 MB', desc: '~6,830 TESS/KOI candidates awaiting confirmation', consumer: 'src/stores/galaxy.ts, GalleryPage.vue' },
  { path: '/topo-params.json', size: '7.5 MB', desc: 'Per-body surface_type + atmosphere params — 16 confirmed atmospheres, basalt/magma_ocean/hycean surface types', consumer: 'src/lib/surface-classify.ts' },
  { path: '/clusters-xray.json', size: '75 KB', desc: '345 clusters — Takey et al. 2013 XMM-Newton X-ray catalog', consumer: 'useClusterGalaxyData.ts, cosmic-structures.ts' },
  { path: '/clusters/{slug}-members.json', size: '1.5 MB (15 files)', desc: 'Member-galaxy lists per named cluster', consumer: 'ClusterInteriorPage.vue, GalaxyClustersPage.vue, CosmicPage.vue' },
  { path: '/star-systems/{cluster}/{id}.json', size: '19 MB (2,824 files)', desc: 'Generated per-system planet sets — Stage 3 of the Python pipeline', consumer: 'useClusterGalaxyData.ts, ClusterInteriorPage.vue' },
  { path: '/galaxy-oracle/{xid}.json + index.json', size: '5.7 MB (346 files)', desc: 'Oracle-generated galaxy morphology field per X-ray cluster', consumer: 'XClusterPage.vue, useClusterGalaxyData.ts' },
  { path: '/stars/{region}.json', size: '7.4 MB (12 files)', desc: 'HYG v4.1-derived foreground star fields per sky region', consumer: 'CosmicPage.vue, GalaxyClustersPage.vue' },
  { path: '/black-holes/anticipated/{bhId}.json', size: '1.3 MB (10 files)', desc: 'Anticipated/predicted black holes beyond the cataloged set', consumer: 'GalacticCenterPage.vue' },
  { path: '/void-galaxies/{id}-viz.json', size: '1.9 MB (4 files)', desc: 'Particle-field galaxy population per cosmic void', consumer: 'src/lib/void-oracle.ts, VoidInteriorPage.vue, VoidGalaxyPage.vue' },
  { path: '/ot6a.json', size: '253 KB', desc: 'Curated eco-ops video/method library — merges in admin-approved video_suggestions at load time', consumer: 'EcoLibrary.vue, EcoOpsPage.vue' },
]

const UNUSED_JSON: JsonFile[] = [
  { path: '/exoplanets-detail.json', size: '3.3 MB', desc: 'Full-column admin/debug export from the fetch pipeline — no fetch() call references it anywhere in src/.' },
  { path: '/exoapril2_2024.json', size: '5.3 MB', desc: 'Raw NASA archive snapshot — input to parse_exoplanet_export.py, never shipped to the client.' },
  { path: '/exoplanets-stats.json', size: '2.9 KB', desc: 'Coverage-report summary generated by the fetch pipeline — informational, not fetched by the app.' },
  { path: '/frontier-exoplanets-detail.json', size: '20.6 MB', desc: 'The single largest file in public/ — generated but confirmed never fetched anywhere in the app (src/components/AboutExotopiaModal.vue\'s own comment already flags this).' },
  { path: '/ot7a.json', size: '106 KB', desc: 'No fetch() call anywhere in src/ references it — reads as a staged successor to ot6a.json that was never wired up.' },
  { path: '/exolocation-nft-metadata-template.json', size: '8.5 KB', desc: 'Reference template for deed metadata shape — informational, not fetched at runtime.' },
]

// ── Address grammar scopes ──────────────────────────────────────────────────

interface Scope { scope: string; status: string; desc: string; example: string }

const SCOPES: Scope[] = [
  { scope: 'surface', status: 'Production', desc: 'Exoplanet or moon surface region.', example: 'exotopia:surface:kepler-442/kepler-442b/aurora-basin' },
  { scope: 'orbital', status: 'Production', desc: 'Altitude band in orbit around a planet.', example: 'exotopia:orbital:proxima-cen/proxima-cen-b/200-500km-i30' },
  { scope: 'lunar-orbital', status: 'Production', desc: 'Orbit around a moon.', example: 'exotopia:lunar-orbital:j133909/planet-b/moon-1/50-150km-i45' },
  { scope: 'stellar-orbital', status: 'Production', desc: 'Orbital radius band around a host star.', example: 'exotopia:stellar-orbital:alpha-centauri/1.1-1.3au' },
  { scope: 'bh-orbital', status: 'Specified', desc: 'Black hole vicinity zone — photon sphere, ISCO, accretion disk, ergosphere, stable orbit.', example: 'exotopia:bh-orbital:Sgr-A*/photon-sphere' },
  { scope: 'trajectory', status: 'Specified', desc: 'Orbital path / slingshot / transfer arc — resolves to a state vector at a given epoch, not a fixed point.', example: 'exotopia:trajectory:earth→kepler-442b/slingshot' },
  { scope: 'branch', status: 'Specified — partially built', desc: 'Parallel/private/branded/educational universe instance. public.branch_settlements (migration 003) is a first real implementation.', example: 'exotopia:branch:uni-kibaoni-aspire-2030/surface:kepler-442/kepler-442b/aurora-basin' },
  { scope: 'collab', status: 'Specified', desc: 'Collaborative multi-party settlement planning space.', example: 'exotopia:collab:surface:kepler-442/kepler-442b/aurora-basin/uni-kibaoni-build-2026' },
]

// ── Local SDK ────────────────────────────────────────────────────────────────

interface SdkFile { file: string; desc: string; exports: string[] }

const SDK_FILES: SdkFile[] = [
  {
    file: 'src/lib/settlements.ts',
    desc: 'Address-key builders, the reactive client-local settlement store, and its optional Supabase sync for signed-in members.',
    exports: [
      'surfaceKey(planetName) / clusterKey(...) / moonKey(...) / orbitalKey(...)',
      'resolveExolocRoute(address, getPlanetHostname) → { path } | null',
      'useSettlements() → { settlements, hasSettlement, getSettlement, addSettlement, updateSettlement, removeSettlement }',
      'loadMySettlements() — merges server rows into local state on sign-in',
      'interface SettlementRecord',
    ],
  },
  {
    file: 'src/lib/moon-settlement.ts',
    desc: 'Trophic hierarchy (L1–L6) for moon-relative locations, Lagrange points, interface zones, and feasibility scoring.',
    exports: [
      'TROPHIC_HIERARCHY, LAGRANGE_POINTS, INTERFACE_ZONES (reference tables)',
      'buildMoonRefBody(parentPlanet, hostStar, moonIndex, ra, dec, distPc)',
      'moonSurfaceAddress(...) / moonLagrangeAddress(...) / moonInterfaceAddress(...)',
      'assessMoonSurfaceFeasibility(...) / assessLagrangeFeasibility(...) → { score, tier, notes, warnings }',
    ],
  },
  {
    file: 'src/lib/resonance-split.ts',
    desc: 'Single source of truth for contribution-allocation percentages — kept after on-chain minting was removed since the underlying split math is provider-agnostic.',
    exports: [
      'STANDARD_SPLIT, SETTLEMENT_SPLIT — creator / community_fund / platform fractions',
      'PRIMARY_MINT_IS_FREE — true; primary settlement minting carries no fee to split today',
      'toSunlightShape(split) / formatSplit(split) → "99 / 0.75 / 0.25"',
    ],
  },
  {
    file: 'src/lib/ipfs-pinning.ts',
    desc: 'Durability layer replacing blockchain minting. No collision-proof claim registry, by design — durability comes from content persistence, not exclusivity.',
    exports: [
      'interface PinningService { name, isConfigured(), pin(metadata) }',
      'pinataService — one real, working implementation',
      'PINNING_SERVICES — registry array; a second provider slots in without touching callers',
      'hasAnyPinningConfigured() / pinSettlement(metadata, service?)',
    ],
  },
]

// ── Gaps & roadmap ───────────────────────────────────────────────────────────

interface Gap { title: string; desc: string; tag: string; tagClass: 'gap' | 'specified' }

const GAPS: Gap[] = [
  { tag: 'NOT BUILT', tagClass: 'gap', title: 'GET /api/v1/exoloc', desc: 'Named as "Public API" in <code class="as-code">SPEC_EXOLOC_ADDRESS.md</code>\'s own header. Re-verified for this audit: <code class="as-code">api/</code> contains only a static gallery1.json, no exoloc handler exists anywhere in the codebase.' },
  { tag: 'NOT BUILT', tagClass: 'gap', title: 'A directory service (address → IPFS CID)', desc: '<code class="as-code">SETTLEMENT_ADDRESS_API.md</code> §3: without one, a visitor can\'t look up what\'s pinned at an address without already knowing the CID — and building one repeats the same custodial-liability tradeoff a chain-based collision authority already had, just for a directory instead of a claim registry.' },
  { tag: 'SPECIFIED', tagClass: 'specified', title: 'exoloc v2 scopes — bh-orbital, trajectory, collab', desc: 'Fully specified in <code class="as-code">SPEC_EXOLOC_ADDRESS.md</code> §3.5–3.8. Only <code class="as-code">branch</code> has a real table (<code class="as-code">branch_settlements</code>) behind it.' },
  { tag: 'PARTIAL', tagClass: 'specified', title: 'SPEC_ECO_OPS_API.md phases 1–4', desc: 'Phase 0 (PWA offline layer, GitHub bounty network) is shipped. Phases 1–4 — Leaflet site map, water-quality-alert Edge Function, SME match, certificate issuance, table-banking M-Pesa flow, regulatory report formatting — are designed in detail but not built. The <code class="as-code">eco_ops</code> schema itself (migration 013) backfills only §2.1\'s core tables, deliberately excluding §8a/§8b\'s payment columns.' },
  { tag: 'ALREADY LIVE', tagClass: 'specified', title: 'PostgREST auto-REST on every public-RLS table', desc: 'Every table in the Database tab with a public-read policy is already reachable at <code class="as-code">/rest/v1/&lt;table&gt;</code> with no code to write — this has just never been documented as an API before this page.' },
  { tag: 'GOTCHA', tagClass: 'gap', title: 'Migration numbering collision (015, 018)', desc: 'Two applied migrations share the 015 prefix, two share the 018 prefix — a real gap in the sequence, not a typo. See the Database tab and <code class="as-code">SPEC_API_PRODUCT.md</code> §3.2 for a proposed rule going forward.' },
  { tag: 'DEAD WEIGHT', tagClass: 'gap', title: 'frontier-exoplanets-detail.json (20.6 MB)', desc: 'The single largest file in public/ — generated by the fetch pipeline but never fetched anywhere in the app.' },
]
</script>

<style scoped>
.as-page { background: #020408; min-height: 100vh; font-family: 'Courier New', monospace; }
.as-wrap { max-width: 1080px; margin: 0 auto; padding: 36px 24px 100px; display: flex; flex-direction: column; gap: 40px; }

.as-badge { font-size: 8.5px; letter-spacing: 0.20em; color: rgba(255,170,60,0.55); margin-bottom: 8px; }
.as-title { font-size: 26px; font-weight: 300; color: rgba(210,235,255,0.92); letter-spacing: 0.05em; margin: 0 0 8px; }
.as-sub { font-size: 11px; color: rgba(110,165,200,0.65); line-height: 1.7; max-width: 760px; margin: 0 0 18px; }
.as-code { color: rgba(0,210,255,0.80); background: rgba(0,40,60,0.45); padding: 1px 5px; border-radius: 3px; font-size: 0.95em; }

.as-stat-row { display: flex; gap: 22px; flex-wrap: wrap; }
.as-stat { display: flex; flex-direction: column; gap: 2px; }
.as-stat-n { font-size: 22px; color: rgba(0,220,255,0.85); font-weight: 600; }
.as-stat-l { font-size: 8px; letter-spacing: 0.08em; color: rgba(110,165,200,0.55); text-transform: uppercase; }

.as-tag { display: inline-block; font-size: 7.5px; letter-spacing: 0.10em; padding: 2px 7px; border-radius: 3px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
.as-tag--built { background: rgba(0,150,90,0.22); color: rgba(90,240,170,0.90); border: 1px solid rgba(60,200,130,0.35); }
.as-tag--specified { background: rgba(180,130,20,0.20); color: rgba(255,200,110,0.90); border: 1px solid rgba(220,170,60,0.35); }
.as-tag--gap { background: rgba(180,30,30,0.20); color: rgba(255,130,130,0.90); border: 1px solid rgba(220,70,70,0.35); }

.as-section { display: flex; flex-direction: column; gap: 14px; }
.as-section-title { font-size: 14px; font-weight: 400; color: rgba(200,235,255,0.88); letter-spacing: 0.06em; margin: 0; border-left: 2px solid rgba(0,180,220,0.35); padding-left: 12px; }
.as-body { font-size: 10.5px; color: rgba(120,175,215,0.72); line-height: 1.70; }
.as-body strong { color: rgba(200,230,255,0.85); }
.as-sub-head { font-size: 11px; color: rgba(160,210,240,0.80); margin: 0 0 4px; font-weight: 400; }

/* Diagram */
.as-diagram-wrap { background: rgba(0,8,22,0.75); border: 1px solid rgba(0,100,160,0.20); border-radius: 8px; padding: 12px; }
.as-diagram-svg { width: 100%; height: auto; display: block; }
.as-svg-title { font-family: 'Courier New', monospace; font-size: 11px; fill: rgba(200,235,255,0.90); }
.as-svg-title--gap { fill: rgba(255,190,110,0.90); }
.as-svg-sub { font-family: 'Courier New', monospace; font-size: 7.5px; fill: rgba(110,165,205,0.65); }
.as-svg-sub--gap { fill: rgba(230,170,100,0.60); }

/* Tabs */
.as-tabs { background: rgba(0,10,24,0.60); border: 1px solid rgba(0,90,140,0.22); border-radius: 6px 6px 0 0; font-size: 10.5px; }
.as-panels { background: rgba(0,6,18,0.55); border: 1px solid rgba(0,90,140,0.18); border-top: none; border-radius: 0 0 6px 6px; padding: 4px; }
.as-panel { padding: 16px 10px; display: flex; flex-direction: column; gap: 14px; }

/* Warning callout */
.as-warn { display: flex; gap: 12px; padding: 12px 14px; background: rgba(50,26,0,0.45); border: 1px solid rgba(255,150,40,0.30); border-radius: 6px; }
.as-warn--gap { background: rgba(50,10,10,0.40); border-color: rgba(255,80,80,0.30); }
.as-warn-icon { font-size: 16px; flex-shrink: 0; }
.as-warn-title { font-size: 10.5px; font-weight: 700; color: rgba(255,205,140,0.92); margin-bottom: 4px; }
.as-warn-body { font-size: 9px; color: rgba(220,180,140,0.70); line-height: 1.6; }

/* Domains / expansion */
.as-domain-list { display: flex; flex-direction: column; gap: 8px; }
.as-domain { background: rgba(0,10,24,0.55); border: 1px solid rgba(0,90,140,0.22); border-radius: 6px; }
.as-domain :deep(.as-domain-header) { color: rgba(200,230,255,0.88); font-size: 11px; }
.as-domain :deep(.q-item__label--caption) { color: rgba(0,180,220,0.55); font-size: 8.5px; }
.as-domain :deep(.as-domain-icon) { color: rgba(0,180,220,0.60); }
.as-domain-body { padding: 4px 14px 14px; }
.as-domain-note { font-size: 9px; color: rgba(150,190,220,0.55); font-style: italic; line-height: 1.6; margin: 0 0 10px; }
.as-table-list { display: flex; flex-direction: column; gap: 1px; border: 1px solid rgba(0,80,130,0.18); border-radius: 5px; overflow: hidden; }
.as-table-row { display: grid; grid-template-columns: 1.3fr 1fr 1.6fr 2.6fr; gap: 10px; padding: 8px 10px; background: rgba(0,8,20,0.55); font-size: 9px; align-items: center; }
.as-table-row:nth-child(even) { background: rgba(0,12,28,0.55); }
.as-table-name { color: rgba(0,215,255,0.85); font-weight: 600; }
.as-schema-tag { color: rgba(180,160,255,0.75); }
.as-table-mig { color: rgba(140,180,210,0.55); font-size: 8.5px; }
.as-rls-badge { display: inline-block; font-size: 7.5px; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.03em; }
.as-rls-badge--public { background: rgba(0,140,90,0.20); color: rgba(90,230,160,0.90); }
.as-rls-badge--owner { background: rgba(0,100,160,0.22); color: rgba(110,190,255,0.90); }
.as-rls-badge--server { background: rgba(120,60,190,0.22); color: rgba(200,160,255,0.90); }
.as-rls-badge--mixed { background: rgba(180,130,20,0.22); color: rgba(255,200,110,0.90); }
.as-rls-badge--admin { background: rgba(180,30,30,0.22); color: rgba(255,130,130,0.90); }
.as-table-desc { color: rgba(120,170,205,0.65); line-height: 1.5; }

/* Static data tables */
.as-json-table { display: flex; flex-direction: column; border: 1px solid rgba(0,100,160,0.18); border-radius: 6px; overflow: hidden; }
.as-json-row { display: grid; grid-template-columns: 1.6fr 0.7fr 2.4fr 1.6fr; gap: 10px; padding: 7px 12px; border-bottom: 1px solid rgba(0,60,100,0.18); font-size: 9px; align-items: center; }
.as-json-row:last-child { border-bottom: none; }
.as-json-row--head { background: rgba(0,20,45,0.70); font-size: 7.5px; letter-spacing: 0.10em; color: rgba(0,180,220,0.55); text-transform: uppercase; }
.as-json-row--unused { opacity: 0.75; }
.as-json-path { color: rgba(0,210,255,0.80); font-size: 8.7px; }
.as-json-size { color: rgba(255,200,110,0.75); }
.as-json-desc { color: rgba(120,175,215,0.68); line-height: 1.5; }
.as-json-consumer { color: rgba(140,180,210,0.55); font-size: 8.3px; }

/* Address scopes */
.as-scope-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.as-scope-card { padding: 12px; background: rgba(0,8,22,0.65); border: 1px solid rgba(0,90,140,0.20); border-radius: 6px; display: flex; flex-direction: column; gap: 6px; }
.as-scope-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.as-scope-name { font-size: 11px; font-weight: 700; color: rgba(0,215,255,0.90); }
.as-scope-desc { font-size: 9px; color: rgba(130,180,210,0.68); line-height: 1.55; }
.as-scope-example { font-size: 8px; color: rgba(150,195,140,0.70); background: rgba(0,20,10,0.45); padding: 4px 7px; border-radius: 3px; word-break: break-all; }

/* SDK */
.as-sdk-list { display: flex; flex-direction: column; gap: 10px; }
.as-sdk-card { padding: 12px 14px; background: rgba(0,8,22,0.65); border: 1px solid rgba(0,90,140,0.20); border-radius: 6px; }
.as-sdk-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.as-sdk-file { color: rgba(0,220,255,0.90); font-size: 10.5px; }
.as-sdk-desc { font-size: 9px; color: rgba(130,180,210,0.68); line-height: 1.55; margin-bottom: 8px; }
.as-sdk-exports { display: flex; flex-direction: column; gap: 3px; }
.as-sdk-export { font-size: 8.3px; color: rgba(150,200,175,0.75); background: rgba(0,20,15,0.40); padding: 4px 8px; border-radius: 3px; }

/* Gaps */
.as-gap-list { display: flex; flex-direction: column; gap: 10px; }
.as-gap-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; background: rgba(0,8,22,0.65); border: 1px solid rgba(0,80,130,0.18); border-radius: 5px; }
.as-gap-item .as-tag { flex-shrink: 0; margin-top: 1px; }
.as-gap-title { font-size: 10.5px; font-weight: 600; color: rgba(200,230,255,0.85); margin-bottom: 3px; }
.as-gap-desc { font-size: 9px; color: rgba(120,170,205,0.65); line-height: 1.6; }

@media (max-width: 700px) {
  .as-table-row { grid-template-columns: 1fr; }
  .as-json-row { grid-template-columns: 1fr; }
  .as-scope-list { grid-template-columns: 1fr; }
}
</style>
