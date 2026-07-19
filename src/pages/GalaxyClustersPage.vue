<template>
  <q-page class="clusters-page">
    <div class="main-layout">

      <!-- ── Main content stream ───────────────────────────────────────── -->
      <div class="main-stream">

        <!-- Header -->
        <div class="cp-header">
          <div class="cp-breadcrumb">L1 COSMIC · L2 CLUSTERS</div>
          <h1 class="cp-title">Galaxy Clusters</h1>
          <p class="cp-subtitle">
            Named superclusters and the full 345-entry XMM-Newton X-ray catalog.
            Member galaxy data available for {{ NAMED_CLUSTERS.length }} major clusters.
          </p>
        </div>

        <!-- Named clusters grid -->
        <section class="cp-section">
          <div class="cp-section-label">NAMED CLUSTERS · {{ NAMED_CLUSTERS.length }} ENTRIES</div>
          <div class="named-grid">
            <button
              v-for="c in NAMED_CLUSTERS"
              :key="c.slug"
              class="nc-card"
              :class="{
                'nc-card--open':    openCluster === c.slug,
                'nc-card--active':  activeCluster?.slug === c.slug,
                'nc-card--loading': loadingSlug === c.slug,
              }"
              @click="toggleCluster(c.slug)"
            >
              <div class="nc-card-top">
                <span class="nc-name">{{ c.name }}</span>
                <span class="nc-dist">{{ c.dist_mpc }} Mpc</span>
              </div>
              <div class="nc-meta">
                <span class="nc-chip">{{ c.member_count }} members</span>
                <span v-if="c.richness"  class="nc-chip">richness {{ c.richness }}</span>
                <span v-if="c.sigma_v"   class="nc-chip">σ {{ c.sigma_v }} km/s</span>
                <span v-if="c.tx_kev"    class="nc-chip nc-chip--xray">T {{ c.tx_kev }} keV</span>
              </div>
              <div class="nc-notes">{{ c.notes }}</div>

              <!-- Enter cluster action -->
              <div class="nc-actions">
                <button
                  class="nc-enter-btn"
                  @click.stop="router.push('/cluster-interior/' + c.slug)"
                >ENTER CLUSTER →</button>
              </div>

              <!-- Member list (expanded inline) -->
              <Transition name="members-expand">
                <div v-if="openCluster === c.slug && memberData[c.slug]" class="nc-members">
                  <div class="ncm-header">
                    <span class="ncm-count">{{ memberData[c.slug]!.members.length }} galaxies loaded</span>
                  </div>
                  <div class="ncm-list">
                    <div
                      v-for="g in memberData[c.slug]!.members.slice(0, 60)"
                      :key="g.id"
                      class="ncm-row"
                      :class="{ 'ncm-row--named': g.is_named }"
                    >
                      <span class="ncm-id">{{ g.name ?? g.id }}</span>
                      <span class="ncm-type" :style="{ color: hubbleColor(g.hubble) }">{{ g.hubble }}</span>
                      <span class="ncm-mag">{{ g.bt_mag != null ? g.bt_mag.toFixed(1) + ' B' : '—' }}</span>
                      <span v-if="g.aliases?.length" class="ncm-alias">{{ g.aliases[0] }}</span>
                      <span v-if="g.notes" class="ncm-note">{{ g.notes }}</span>
                    </div>
                    <div v-if="memberData[c.slug]!.members.length > 60" class="ncm-overflow">
                      + {{ memberData[c.slug]!.members.length - 60 }} more
                    </div>
                  </div>
                </div>
              </Transition>

              <div v-if="openCluster === c.slug && loadingSlug === c.slug" class="nc-loading">
                Loading member data…
              </div>
            </button>
          </div>
        </section>

        <!-- XMM-Newton full catalog -->
        <section class="cp-section">
          <div class="cp-section-label">XMM-NEWTON CATALOG · {{ xmmFiltered.length }} / {{ xmmClusters.length }} ENTRIES</div>

          <div class="xmm-controls">
            <input v-model="xmmSearch" class="xmm-search" placeholder="Filter by name or redshift…" />
            <div class="xmm-sort-group">
              <button
                v-for="s in XMM_SORTS"
                :key="s.key"
                class="xmm-sort-btn"
                :class="{ 'xmm-sort-btn--active': xmmSort === s.key }"
                @click="xmmSort = s.key"
              >{{ s.label }}</button>
            </div>
          </div>

          <div class="xmm-table-wrap">
            <table class="xmm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>z</th>
                  <th>Dist (Mpc)</th>
                  <th>T (keV)</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cx in xmmPage" :key="cx.name" class="xmm-row">
                  <td class="xmm-name">
                    <span class="xmm-dot" :style="{ background: cx.color_hex }" />
                    {{ cx.name }}
                  </td>
                  <td class="xmm-z">{{ cx.z.toFixed(4) }}</td>
                  <td class="xmm-dist">{{ cx.dist_mpc.toFixed(0) }}</td>
                  <td class="xmm-kev" :style="{ color: tempColor(cx.tap_kev) }">{{ cx.tap_kev.toFixed(2) }}</td>
                  <td class="xmm-src">{{ cx.source }}</td>
                </tr>
              </tbody>
            </table>

            <div class="xmm-pager">
              <button class="xmm-pg-btn" :disabled="xmmPage_ === 0" @click="xmmPage_--">‹ prev</button>
              <span class="xmm-pg-label">{{ xmmPage_ + 1 }} / {{ xmmTotalPages }}</span>
              <button class="xmm-pg-btn" :disabled="xmmPage_ >= xmmTotalPages - 1" @click="xmmPage_++">next ›</button>
            </div>
          </div>
        </section>

        <!-- ── Coverage notes footer ──────────────────────────────────── -->
        <section class="cp-section cp-coverage">
          <div class="cp-section-label">COVERAGE NOTES · DATA QUALITY</div>

          <div class="cov-grid">

            <div class="cov-block">
              <div class="cov-heading">Catalog scope</div>
              <p class="cov-body">
                Navigable member catalogs exist for {{ NAMED_CLUSTERS.length }} named clusters
                ({{ NAMED_CLUSTERS.reduce((s,c) => s + c.member_count, 0).toLocaleString() }} total
                member galaxy slots). The XMM-Newton index lists 345 clusters by X-ray detection;
                the remaining {{ 345 - NAMED_CLUSTERS.length }} are represented by coordinates and
                ICM temperature only — no member lists, star systems, or population data have been
                generated for these entries.
              </p>
            </div>

            <div class="cov-block">
              <div class="cov-heading">Sparse and uncertain areas</div>
              <ul class="cov-list">
                <li>
                  <span class="cov-tag">Norma</span>
                  Within 5° of the Galactic plane. Member identification is incomplete
                  due to dust extinction along the line of sight toward the Great Attractor.
                  Morphologies and offsets were extrapolated from X-ray centroid data; optical
                  cataloguing remains ongoing.
                </li>
                <li>
                  <span class="cov-tag">Bullet Cluster</span>
                  High-velocity merger system at z = 0.296 (~720 Mpc). No optically
                  confirmed named members in this catalog. All 200 members are procedurally
                  assigned. The post-shock ICM temperature model may underestimate
                  ionization and stripping effects in the wake region.
                </li>
                <li>
                  <span class="cov-tag">Shapley Supercluster</span>
                  Composite structure spanning &gt;150 Mpc along the line of sight.
                  Member offsets are projected onto a single mean-distance plane; the true
                  3D sub-cluster distribution across 25+ Abell systems is not modelled.
                  Velocity dispersions reflect the full supercluster, not individual halos.
                </li>
                <li>
                  <span class="cov-tag">Hydra-A</span>
                  No named bright members identified in the current member catalog.
                  All 160 entries are procedurally generated. The BCG (3C 218) hosts a
                  powerful radio jet whose radiation zone is approximated using a uniform
                  radiation factor rather than a jet-geometry model.
                </li>
                <li>
                  <span class="cov-tag">Eridanus Supergroup</span>
                  Sparse southern-sky group with low velocity dispersion (σ ≈ 250 km/s).
                  Group membership boundary is loosely defined; some members may belong
                  to the adjacent Fornax Wall filament.
                </li>
              </ul>
            </div>

            <div class="cov-block">
              <div class="cov-heading">Generated content — known assumptions</div>
              <ul class="cov-list">
                <li>
                  Star-system populations use a deterministic seeded model (Mulberry32 RNG)
                  calibrated on observed morphology–density relations
                  (Dressler 1980; Whitmore et al. 1993). Spectral distributions, ICM stress
                  factors, and planet architecture biases are physically motivated
                  approximations — individual system properties should not be interpreted
                  as observationally accurate.
                </li>
                <li>
                  Background stellar populations rendered in the galaxy interior view
                  (1,000–5,000 stars per galaxy) are visual representations only.
                  Actual galaxy stellar populations range from ~10⁸ (dwarf irregulars)
                  to ~10¹³ stars (cD BCGs). The displayed density is navigational, not
                  physical.
                </li>
                <li>
                  Planet equilibrium temperatures use a simplified luminosity–distance
                  relation. Atmospheric retention, tidal locking, and binary-star
                  dynamics are not modelled at this time.
                </li>
                <li>
                  Settlement tiers (Candidate / Frontier / Theoretical) reflect
                  rough habitability scoring — they are in-world classifications and
                  do not constitute scientific habitability assessments.
                </li>
              </ul>
            </div>

            <div class="cov-block">
              <div class="cov-heading">Observational anchors used</div>
              <ul class="cov-list">
                <li><span class="cov-tag">Chandra</span> ICM temperature, X-ray morphology, ram-pressure stripping geometry, cooling flow identification</li>
                <li><span class="cov-tag">XMM-Newton</span> Primary source for the 345-entry temperature catalog; cluster boundary radii (R₅₀₀)</li>
                <li><span class="cov-tag">Hubble / HST</span> Optical morphology classification, BCG identification, tidal feature mapping</li>
                <li><span class="cov-tag">JWST</span> Infrared dust infall zones and proto-planetary disk enrichment signals, applied where pipeline data was available</li>
                <li><span class="cov-tag">NED / HyperLeda / RC3</span> Member galaxy positions, redshifts, Hubble classifications, B-band magnitudes</li>
              </ul>
            </div>

            <div class="cov-block">
              <div class="cov-heading">Data currency and upcoming revisions</div>
              <p class="cov-body">
                Member catalogs compiled from NED, HyperLeda, and the RC3 catalog.
                Positions, redshifts, and morphologies last verified 2026-05.
                Ongoing surveys — DESI spectroscopic redshifts, Euclid weak-lensing
                mass maps, and Rubin/LSST photometric catalogs — may revise cluster
                membership boundaries, BCG identifications, and morphological
                classifications in future pipeline runs.
                The Norma and Ophiuchus clusters are candidates for updated optical
                catalogs once Rubin southern-sky coverage is public.
              </p>
            </div>

          </div><!-- /cov-grid -->
        </section>

      </div><!-- /main-stream -->

      <!-- ── Detail panel ──────────────────────────────────────────────── -->
      <ClusterDetailPanel
        :cluster="activeCluster"
        @close="activeCluster = null"
      />

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ClusterDetailPanel from 'src/components/ClusterDetailPanel.vue'
import type { NamedClusterMeta } from 'src/components/ClusterDetailPanel.vue'

// ── Named cluster index ───────────────────────────────────────────────────────

interface MemberGalaxy {
  id:        string
  name?:     string
  aliases?:  string[]
  ra:        number
  dec:       number
  hubble:    string
  bt_mag?:   number
  is_named?: boolean
  notes?:    string
}

interface ClusterMembers {
  cluster:      string
  member_count: number
  members:      MemberGalaxy[]
}

const NAMED_CLUSTERS: NamedClusterMeta[] = [
  {
    slug: 'virgo', name: 'Virgo Cluster', dist_mpc: 16.5, member_count: 250,
    richness: 7, sigma_v: 760, tx_kev: 2.5,
    ra_str: '12h 27m', dec_str: '+12° 43′',
    notes: 'Three subclusters (M87/M49/NGC4261). 2096 confirmed VCC members. Core AGN heating from M87 jet.',
  },
  {
    slug: 'coma', name: 'Coma Cluster', dist_mpc: 99.0, member_count: 250,
    richness: 9, sigma_v: 880, tx_kev: 8.2,
    ra_str: '12h 59m', dec_str: '+27° 58′',
    notes: 'Abell 1656. Prototypical rich regular cluster. BCGs NGC4889 + NGC4874. Bullet-like substructure in X-ray.',
  },
  {
    slug: 'perseus', name: 'Perseus Cluster', dist_mpc: 73.6, member_count: 250,
    richness: 8, sigma_v: 1040, tx_kev: 6.0,
    ra_str: '03h 19m', dec_str: '+41° 30′',
    notes: 'Abell 426. Brightest X-ray cluster. NGC1275 (Perseus A) BCG with filamentary H-alpha nebula.',
  },
  {
    slug: 'centaurus', name: 'Centaurus Cluster', dist_mpc: 47.0, member_count: 200,
    richness: 6, sigma_v: 740, tx_kev: 4.0,
    ra_str: '12h 48m', dec_str: '−41° 18′',
    notes: 'Abell 3526. NGC4696 BCG. Remarkable ICM cooling flow and cold front structure.',
  },
  {
    slug: 'fornax', name: 'Fornax Cluster', dist_mpc: 20.0, member_count: 200,
    richness: 5, sigma_v: 380, tx_kev: 1.3,
    ra_str: '03h 38m', dec_str: '−35° 27′',
    notes: 'Nearest rich cluster after Virgo. Low velocity dispersion. NGC1399 BCG.',
  },
  {
    slug: 'hydra', name: 'Hydra Cluster', dist_mpc: 50.0, member_count: 150,
    richness: 5, sigma_v: 680, tx_kev: 3.3,
    ra_str: '10h 37m', dec_str: '−27° 32′',
    notes: 'Abell 1060. Irregular morphology. Two BCGs: NGC3309 and NGC3311.',
  },
  {
    slug: 'norma', name: 'Norma Cluster', dist_mpc: 67.0, member_count: 150,
    richness: 8, sigma_v: 925, tx_kev: 5.5,
    ra_str: '16h 15m', dec_str: '−60° 51′',
    notes: 'Abell 3627. Core of the Great Attractor. Heavily obscured by Galactic plane.',
  },
  {
    slug: 'shapley', name: 'Shapley Supercluster', dist_mpc: 200.0, member_count: 200,
    sigma_v: 1200,
    ra_str: '13h 24m', dec_str: '−31° 00′',
    notes: 'Densest concentration of galaxies within 600 Mpc. 25+ Abell clusters. ~10¹⁶ M☉.',
  },
  {
    slug: 'andromeda-group', name: 'Andromeda Group', dist_mpc: 0.78, member_count: 100,
    ra_str: '00h 42m', dec_str: '+41° 16′',
    notes: 'M31 and associated galaxies. ~50 confirmed members within Local Group halo.',
  },
  {
    slug: 'eridanus-supergroup', name: 'Eridanus Supergroup', dist_mpc: 20.0, member_count: 150,
    sigma_v: 250,
    ra_str: '03h 36m', dec_str: '−21° 00′',
    notes: 'Sparse supergroup in southern sky. NGC1332 and NGC1395 dominant spirals.',
  },
  {
    slug: 'bootes-void', name: 'Boötes Void', dist_mpc: 250.0, member_count: 50,
    tx_kev: 0,
    ra_str: '15h 20m', dec_str: '+46° 00′',
    notes: 'One of the largest known cosmic voids (~130 Mpc radius). Discovered Kirshner et al. 1981. Population of blue star-forming irregulars; no hot ICM.',
  },
  {
    slug: 'local-void', name: 'Local Void', dist_mpc: 23.0, member_count: 50,
    tx_kev: 0,
    ra_str: '14h 36m', dec_str: '+26° 00′',
    notes: 'Nearest major void adjacent to Laniakea. NGC 6503, NGC 6946 (Fireworks), IC 342 (Hidden Galaxy) on near wall. Pristine ISM; no ram-pressure stripping.',
  },
]

// ── Member data ───────────────────────────────────────────────────────────────

const openCluster   = ref<string | null>(null)
const loadingSlug   = ref<string | null>(null)
const activeCluster = ref<NamedClusterMeta | null>(null)
const memberData    = ref<Record<string, ClusterMembers>>({})

async function fetchMembers(slug: string) {
  if (memberData.value[slug]) return
  loadingSlug.value = slug
  try {
    const res  = await fetch(`/clusters/${slug}-members.json`)
    memberData.value[slug] = await res.json() as ClusterMembers
  } catch { /* missing file — show nothing */ }
  finally { loadingSlug.value = null }
}

function toggleCluster(slug: string) {
  if (openCluster.value === slug) {
    openCluster.value   = null
    activeCluster.value = null
  } else {
    openCluster.value   = slug
    activeCluster.value = NAMED_CLUSTERS.find(c => c.slug === slug) ?? null
    void fetchMembers(slug)
  }
}

// ── XMM catalog ───────────────────────────────────────────────────────────────

interface XmmEntry {
  name: string; ra_deg: number; dec_deg: number
  z: number; dist_mpc: number; tap_kev: number
  color_hex: string; source: string
}

const xmmClusters = ref<XmmEntry[]>([])
const xmmSearch   = ref('')
const xmmSort     = ref<'dist' | 'z' | 'kev'>('dist')
const xmmPage_    = ref(0)
const XMM_PAGE_SZ = 30

const XMM_SORTS = [
  { key: 'dist' as const, label: 'Distance' },
  { key: 'z'    as const, label: 'Redshift' },
  { key: 'kev'  as const, label: 'Temperature' },
]

const route  = useRoute()
const router = useRouter()

onMounted(async () => {
  const res = await fetch('/clusters-xray.json')
  xmmClusters.value = await res.json()

  // Auto-expand cluster when arriving from CosmicPage "Visit" button
  const clusterParam = route.query.cluster as string | undefined
  if (clusterParam) {
    const match = NAMED_CLUSTERS.find(c => c.slug === clusterParam)
    if (match) toggleCluster(match.slug)
  }
})

watch([xmmSearch, xmmSort], () => { xmmPage_.value = 0 })

const xmmFiltered = computed(() => {
  const q = xmmSearch.value.toLowerCase()
  let list = xmmClusters.value
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || String(c.z).includes(q))
  return [...list].sort((a, b) =>
    xmmSort.value === 'dist' ? a.dist_mpc - b.dist_mpc :
    xmmSort.value === 'z'    ? a.z - b.z :
    b.tap_kev - a.tap_kev
  )
})

const xmmTotalPages = computed(() => Math.ceil(xmmFiltered.value.length / XMM_PAGE_SZ))
const xmmPage = computed(() =>
  xmmFiltered.value.slice(xmmPage_.value * XMM_PAGE_SZ, (xmmPage_.value + 1) * XMM_PAGE_SZ)
)

// ── Colour helpers ────────────────────────────────────────────────────────────

function hubbleColor(type: string): string {
  if (!type) return '#607d8b'
  const t = type.toUpperCase()
  if (t.startsWith('CD') || t === 'C') return '#ffd2a1'
  if (t.startsWith('E'))               return '#ffe0a8'
  if (t.startsWith('S0'))              return '#c8d8e8'
  if (t.startsWith('S') || t === 'SA' || t === 'SB') return '#80c8ff'
  if (t.startsWith('I'))               return '#a8ff80'
  return '#78909c'
}

function tempColor(kev: number): string {
  if (kev > 8) return 'rgba(255,100,80,0.90)'
  if (kev > 5) return 'rgba(255,180,80,0.85)'
  if (kev > 3) return 'rgba(255,230,100,0.80)'
  return 'rgba(100,210,255,0.80)'
}
</script>

<style scoped>

.clusters-page {
  min-height: 100vh;
  background: rgba(0, 2, 12, 1);
  color: rgba(160, 200, 230, 0.85);
  font-family: 'Courier New', monospace;
}

/* ── Two-column layout ─────────────────────────────────────────────────────── */

.main-layout {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 44px);
}

.main-stream {
  flex: 1;
  min-width: 0;
  padding-bottom: 60px;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */

.cp-header {
  background: linear-gradient(to bottom, rgba(0,30,70,0.20), transparent);
  border-bottom: 1px solid rgba(0, 80, 140, 0.14);
  padding: 30px 28px 22px;
}

.cp-breadcrumb {
  font-size: 7.5px;
  letter-spacing: 0.22em;
  color: rgba(0, 180, 220, 0.40);
  margin-bottom: 7px;
}

.cp-title {
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0.12em;
  color: rgba(180, 220, 248, 0.90);
  margin: 0 0 7px;
}

.cp-subtitle {
  font-size: 9.5px;
  color: rgba(90, 145, 188, 0.52);
  line-height: 1.7;
  margin: 0;
  max-width: 520px;
}

/* ── Sections ───────────────────────────────────────────────────────────────── */

.cp-section { padding: 22px 28px 8px; }

.cp-section-label {
  font-size: 7px;
  letter-spacing: 0.20em;
  color: rgba(0, 160, 210, 0.36);
  margin-bottom: 12px;
}

/* ── Named cluster grid ──────────────────────────────────────────────────────── */

.named-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 9px;
}

.nc-card {
  text-align: left;
  background: rgba(0, 6, 22, 0.72);
  border: 1px solid rgba(0, 60, 110, 0.20);
  border-radius: 4px;
  padding: 13px 15px;
  cursor: pointer;
  transition: background 0.20s, border-color 0.20s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nc-card:hover          { background: rgba(0, 14, 44, 0.85); border-color: rgba(0, 130, 195, 0.28); }
.nc-card--active        { border-color: rgba(0, 180, 255, 0.40); background: rgba(0, 12, 38, 0.90); }
.nc-card--open          { border-color: rgba(0, 160, 240, 0.34); }
.nc-card--loading       { opacity: 0.70; }

.nc-card-top { display: flex; justify-content: space-between; align-items: baseline; }

.nc-name {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(140, 200, 240, 0.90);
}

.nc-dist { font-size: 8px; color: rgba(70, 130, 175, 0.52); }

.nc-meta { display: flex; flex-wrap: wrap; gap: 4px; }

.nc-chip {
  font-size: 7px;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  background: rgba(0, 28, 66, 0.48);
  border: 1px solid rgba(0, 75, 135, 0.18);
  border-radius: 2px;
  color: rgba(90, 160, 205, 0.68);
}

.nc-chip--xray {
  color: rgba(255, 175, 75, 0.80);
  border-color: rgba(255, 135, 35, 0.18);
  background: rgba(36, 18, 0, 0.40);
}

.nc-notes {
  font-size: 8px;
  color: rgba(75, 125, 162, 0.48);
  line-height: 1.60;
}

.nc-loading {
  font-size: 7.5px;
  color: rgba(0, 175, 255, 0.38);
  letter-spacing: 0.10em;
  padding-top: 4px;
}

/* member list */
.nc-members { border-top: 1px solid rgba(0, 55, 105, 0.18); padding-top: 9px; }

.ncm-header { margin-bottom: 5px; }

.ncm-count {
  font-size: 6.5px;
  letter-spacing: 0.12em;
  color: rgba(0, 175, 255, 0.35);
}

.ncm-list { display: flex; flex-direction: column; gap: 1px; }

.ncm-row {
  display: grid;
  grid-template-columns: 105px 34px 50px 1fr;
  gap: 6px;
  align-items: baseline;
  padding: 2px 2px;
  border-radius: 2px;
  transition: background 0.10s;
}
.ncm-row:hover { background: rgba(0, 28, 66, 0.38); }
.ncm-row--named .ncm-id { color: rgba(200, 230, 255, 0.88); }

.ncm-id    { font-size: 8px; color: rgba(120, 178, 215, 0.68); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ncm-type  { font-size: 7px; letter-spacing: 0.03em; }
.ncm-mag   { font-size: 7px; color: rgba(75, 135, 175, 0.48); }
.ncm-alias { font-size: 7px; color: rgba(200, 178, 95, 0.52); }
.ncm-note  { font-size: 6.5px; color: rgba(75, 125, 155, 0.40); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ncm-overflow {
  font-size: 7px;
  color: rgba(75, 125, 165, 0.38);
  padding: 4px 2px;
  letter-spacing: 0.07em;
}

.members-expand-enter-active,
.members-expand-leave-active { overflow: hidden; transition: opacity 0.25s ease, max-height 0.30s ease; max-height: 2000px; }
.members-expand-enter-from,
.members-expand-leave-to     { opacity: 0; max-height: 0; }

/* ── XMM table ───────────────────────────────────────────────────────────────── */

.xmm-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.xmm-search {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  background: rgba(0, 8, 26, 0.70);
  border: 1px solid rgba(0, 95, 155, 0.20);
  border-radius: 3px;
  padding: 5px 11px;
  color: rgba(155, 205, 235, 0.85);
  outline: none;
  width: 200px;
}
.xmm-search::placeholder { color: rgba(65, 115, 160, 0.38); }
.xmm-search:focus { border-color: rgba(0, 175, 255, 0.38); }

.xmm-sort-group { display: flex; gap: 3px; }

.xmm-sort-btn {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.07em;
  padding: 3px 10px;
  background: rgba(0, 16, 48, 0.50);
  border: 1px solid rgba(0, 65, 125, 0.18);
  border-radius: 2px;
  color: rgba(85, 145, 195, 0.52);
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.xmm-sort-btn:hover { background: rgba(0, 28, 68, 0.62); color: rgba(125, 185, 225, 0.78); }
.xmm-sort-btn--active { background: rgba(0, 55, 125, 0.38); border-color: rgba(0, 155, 225, 0.28); color: rgba(0, 200, 255, 0.86); }

.xmm-table-wrap { overflow-x: auto; }

.xmm-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }

.xmm-table th {
  text-align: left;
  padding: 5px 9px;
  font-size: 7px;
  letter-spacing: 0.11em;
  color: rgba(75, 135, 178, 0.48);
  border-bottom: 1px solid rgba(0, 55, 105, 0.18);
  white-space: nowrap;
}

.xmm-row { border-bottom: 1px solid rgba(0, 38, 76, 0.11); transition: background 0.09s; }
.xmm-row:hover { background: rgba(0, 18, 52, 0.38); }
.xmm-row td { padding: 4px 9px; white-space: nowrap; }

.xmm-name { display: flex; align-items: center; gap: 6px; color: rgba(125, 178, 215, 0.72); }

.xmm-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; opacity: 0.68; }

.xmm-z    { color: rgba(95, 158, 205, 0.58); }
.xmm-dist { color: rgba(75, 135, 178, 0.48); }
.xmm-kev  { font-weight: 600; }
.xmm-src  { color: rgba(65, 115, 155, 0.36); font-size: 7px; }

.xmm-pager { display: flex; align-items: center; gap: 13px; padding: 12px 0 4px; }

.xmm-pg-btn {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  padding: 3px 11px;
  background: rgba(0, 18, 52, 0.48);
  border: 1px solid rgba(0, 75, 135, 0.20);
  border-radius: 2px;
  color: rgba(95, 152, 205, 0.62);
  cursor: pointer;
  transition: background 0.14s;
}
.xmm-pg-btn:disabled { opacity: 0.26; cursor: default; }
.xmm-pg-btn:not(:disabled):hover { background: rgba(0, 38, 88, 0.62); }

.xmm-pg-label { font-size: 7.5px; letter-spacing: 0.10em; color: rgba(75, 135, 178, 0.42); }

/* ── Enter cluster button ─────────────────────────────────────────────────── */

.nc-actions { display: flex; justify-content: flex-end; margin-top: 2px; }

.nc-enter-btn {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.14em;
  padding: 4px 10px;
  background: rgba(0, 40, 90, 0.50);
  border: 1px solid rgba(0, 130, 210, 0.28);
  border-radius: 2px;
  color: rgba(0, 190, 255, 0.72);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.nc-enter-btn:hover {
  background: rgba(0, 60, 130, 0.68);
  border-color: rgba(0, 190, 255, 0.50);
  color: rgba(80, 220, 255, 0.95);
}

/* ── Coverage footer ──────────────────────────────────────────────────────── */

.cp-coverage {
  border-top: 1px solid rgba(0, 55, 105, 0.18);
  padding-top: 28px;
  padding-bottom: 48px;
  margin-top: 12px;
}

.cov-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px 28px;
  margin-top: 14px;
}

.cov-block {
  background: rgba(0, 6, 22, 0.45);
  border: 1px solid rgba(0, 50, 100, 0.14);
  border-radius: 4px;
  padding: 14px 16px;
}

.cov-heading {
  font-size: 7px;
  letter-spacing: 0.18em;
  color: rgba(0, 165, 220, 0.48);
  text-transform: uppercase;
  margin-bottom: 9px;
}

.cov-body {
  font-size: 8.5px;
  line-height: 1.80;
  color: rgba(85, 140, 180, 0.58);
  margin: 0;
}

.cov-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cov-list li {
  font-size: 8.5px;
  line-height: 1.78;
  color: rgba(85, 140, 180, 0.58);
  padding-left: 0;
}

.cov-tag {
  display: inline-block;
  font-size: 6.5px;
  letter-spacing: 0.09em;
  padding: 1px 6px;
  margin-right: 6px;
  background: rgba(0, 30, 70, 0.55);
  border: 1px solid rgba(0, 100, 170, 0.20);
  border-radius: 2px;
  color: rgba(0, 185, 240, 0.65);
  vertical-align: 1px;
  white-space: nowrap;
}

</style>
