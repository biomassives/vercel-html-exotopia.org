<template>
  <q-page class="dp-page">

    <!-- TOPBAR -->
    <header class="dp-topbar">

      <div class="dp-topbar-left">

        <!-- NAV TOGGLE -->
        <button
          class="dp-nav-toggle"
          @click="navCollapsed = !navCollapsed"
        >
          <q-icon
            :name="navCollapsed ? 'chevron_right' : 'chevron_left'"
            size="18px"
          />
        </button>

        <!-- BRAND -->
        <router-link
          to="/"
          class="dp-home-link"
        >
          <span class="dp-home-exo">EXO</span>
          <span class="dp-home-topia">TOPIA</span>
        </router-link>

      </div>

      <div class="dp-topbar-title">
        Documentation
      </div>

      <!-- SEARCH -->
      <div class="dp-search-wrap">

        <q-input
          v-model="query"

          dense
          dark
          outlined

          placeholder="Search docs…"

          class="dp-search-input"

          @focus="searchFocused = true"

          @blur="onBlur"

          @keydown.down.prevent="
            hintIdx =
              Math.min(
                hintIdx + 1,
                hints.length - 1
              )
          "

          @keydown.up.prevent="
            hintIdx =
              Math.max(
                hintIdx - 1,
                0
              )
          "

          @keydown.enter.prevent="
            selectHint(hints[hintIdx])
          "
        >

          <template #prepend>
            <q-icon
              name="search"
              size="14px"
              color="blue-grey-5"
            />
          </template>

          <template #append>

            <div class="row items-center no-wrap q-gutter-xs">

              <q-icon
                v-if="query"
                name="close"
                size="14px"
                class="cursor-pointer"
                @click="clearSearch"
              />

              <div class="dp-kbd">
                ⌘K
              </div>

            </div>

          </template>

        </q-input>

        <!-- SEARCH RESULTS -->
        <div
          v-if="
            searchFocused &&
            hints.length
          "
          class="dp-search-results"
        >

          <button
            v-for="(hint, i) in hints"
            :key="hint.id"

            class="dp-search-result"

            :class="{
              'dp-search-result--active':
                i === hintIdx
            }"

            @mousedown.prevent="
              selectHint(hint)
            "
          >

            <div class="dp-search-section">
              {{ hint.section }}
            </div>

            <div class="dp-search-title">
              {{ hint.title }}
            </div>

          </button>

        </div>

      </div>

    </header>

    <!-- BODY -->
    <div class="dp-layout">

      <!-- SIDEBAR -->
      <aside
        class="dp-nav"
        :class="{
          'dp-nav--collapsed':
            navCollapsed
        }"
      >

        <div
          v-for="section in NAV"
          :key="section.id"
          class="dp-nav-section"
        >

          <div
            class="dp-nav-head"
            @click="toggleNav(section.id)"
          >

            <span v-if="!navCollapsed">
              {{ section.icon }}
              {{ section.label }}
            </span>

            <span v-else>
              {{ section.icon }}
            </span>

            <q-icon
              v-if="!navCollapsed"
              :name="
                openNav.has(section.id)
                  ? 'expand_less'
                  : 'expand_more'
              "
              size="14px"
            />

          </div>

          <transition name="fade">

            <div
              v-if="
                openNav.has(section.id) &&
                !navCollapsed
              "
              class="dp-nav-items"
            >

              <a
                v-for="item in section.items"
                :key="item.id"

                class="dp-nav-item"

                :class="{
                  'dp-nav-item--active':
                    activeSection === item.id
                }"

                @click.prevent="
                  scrollTo(item.id)
                "
              >
                {{ item.label }}
              </a>

            </div>

          </transition>

        </div>

      </aside>

      <!-- CONTENT -->
      <main
        class="dp-content"
        :class="{
          'dp-content--expanded':
            navCollapsed
        }"
      >

        <section
          id="getting-started"
          class="dp-section"
        >

          <h1 class="dp-h1">
            Getting Started
          </h1>

          <p class="dp-p">
            Your documentation content...
          </p>

          <div
            id="what-is"
            class="dp-sub"
          >

            <h2 class="dp-h2">
              What is Exotopia?
            </h2>

            <p class="dp-p">
              Exotopia connects exoplanets,
              NFTs, eco-ops,
              and decentralized community systems.
            </p>

          </div>

        </section>

      </main>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const navCollapsed = ref(false)

const activeSection = ref('getting-started')

const query = ref('')

const searchFocused = ref(false)

const hintIdx = ref(0)

const NAV = [
  { id: 'getting-started', icon: '🚀', label: 'Getting Started', items: [
    { id: 'getting-started', label: 'Overview'              },
    { id: 'what-is',         label: 'What is Exotopia?'     },
    { id: 'new-user',        label: 'Quickstart'            },
    { id: 'free-platform',   label: '99/0.75/0.25 Model'         },
  ]},
  { id: 'visualization', icon: '🌌', label: 'Visualization', items: [
    { id: 'visualization',       label: 'Overview'               },
    { id: 'cosmic-view',         label: 'Cosmic Web & Voids'     },
    { id: 'galaxy-clusters',     label: 'Galaxy Clusters & LOD'  },
    { id: 'system-view',         label: 'Star Systems'           },
    { id: 'settlement-surfaces', label: 'Settlement Surfaces'    },
  ]},
  { id: 'protocol', icon: '⬡', label: 'Protocol & Economy', items: [
    { id: 'protocol',     label: 'Overview'              },
    { id: 'exolocation',  label: 'Exolocation Addresses' },
    { id: 'sunlight-nft', label: '$SUNLIGHT NFT'         },
    { id: 'art-tokens',   label: 'ART Tokens'            },
    { id: 'robot-mule',   label: 'mule-bot'         },
  ]},
  { id: 'glossary-section', icon: '📖', label: 'Glossary', items: [
    { id: 'glossary-section', label: 'Key Terms (45)' },
  ]},
  { id: 'chains-section', icon: '🔗', label: 'Networks', items: [
    { id: 'chains-section', label: 'Overview'             },
    { id: 'polygon',        label: 'Polygon Amoy'        },
    { id: 'celo',           label: 'Celo Alfajores'      },
    { id: 'algorand',       label: 'Algorand (planned)'  },
  ]},
  { id: 'data-section', icon: '📊', label: 'Data & Coverage', items: [
    { id: 'data-section', label: 'Overview'       },
    { id: 'catalogs',     label: 'Catalog Sources'},
    { id: 'data-gaps',    label: 'Known Gaps'     },
  ]},
  { id: 'specs-section', icon: '⚙', label: 'Technical Specs', items: [
    { id: 'specs-section',      label: 'Overview'              },
    { id: 'game-theory',        label: 'Game Theory (DRK-E/QNT-P)' },
    { id: 'security-model',     label: 'Wallet Security'       },
    { id: 'settlement-hashmark',label: 'Settlement Hashmark'   },
    { id: 'field-recording',    label: 'Field Recording'       },
    { id: 'coordinate-math',    label: 'Coordinate Maths'      },
  ]},
  { id: 'security-section', icon: '🔐', label: 'Security', items: [
    { id: 'security-section',      label: 'Overview'              },
    { id: 'cve-bulletin',          label: 'Security Bulletin'     },
    { id: 'smart-contract-risks',  label: 'Smart Contract Risks'  },
    { id: 'api-security',          label: 'API Security'          },
  ]},
  { id: 'contributing', icon: '🌍', label: 'Community', items: [
    { id: 'contributing', label: 'Contributing & Community' },
  ]},
]

const openNav = ref(
  new Set(
    NAV.map(s => s.id)
  )
)

function toggleNav(id: string) {

  if (openNav.value.has(id)) {
    openNav.value.delete(id)
  }

  else {
    openNav.value.add(id)
  }

  openNav.value =
    new Set(openNav.value)
}

function scrollTo(id: string) {

  const el =
    document.getElementById(id)

  if (!el) return

  const offset = -72

  const y =
    el.getBoundingClientRect().top +
    window.pageYOffset +
    offset

  window.scrollTo({
    top: y,
    behavior: 'smooth'
  })

  activeSection.value = id
}


const DOC_INDEX: DocHint[] = [
  { id: 'what-is',         section: 'Getting Started', title: 'What is Exotopia?',     text: 'exoplanet virtual land nft community eco-ops field work nasa catalog' },
  { id: 'new-user',        section: 'Getting Started', title: 'Quickstart',             text: 'new user wallet onboard first mint testnet polygon celo' },
  { id: 'free-platform',   section: 'Getting Started', title: '99/0.75/0.25 Model',          text: 'fee model resonance split creator platform free zero percent aftermarket' },
  { id: 'cosmic-view',     section: 'Visualization',   title: 'Cosmic Web & Voids',     text: 'laniakea void bootes local sculptor supercluster filament dark energy blob timular' },
  { id: 'galaxy-clusters', section: 'Visualization',   title: 'Galaxy Clusters & LOD', text: 'lod level detail cluster virgo coma norma xray morphology elliptical spiral' },
  { id: 'system-view',     section: 'Visualization',   title: 'Star Systems',           text: 'planet orbit multiplanet multimoon lagrange l4 l5 camera co-orbit' },
  { id: 'settlement-surfaces', section: 'Visualization', title: 'Settlement Surfaces', text: 'dome surface stone circle xray dkmat dark matter pyramid exoplanet ground' },
  { id: 'exolocation',     section: 'Protocol',        title: 'Exolocation Addresses', text: 'coordinate system trophic level sublunary syzygy liminal exo-surface-v1 lagrange' },
  { id: 'sunlight-nft',    section: 'Protocol',        title: '$SUNLIGHT NFT',         text: 'sound music creative recording polygon license royalty bars' },
  { id: 'art-tokens',      section: 'Protocol',        title: 'ART Tokens',            text: 'activity reward eco-ops sponsor water farm field work token resellable' },
  { id: 'robot-mule',      section: 'Protocol',        title: 'mule-bot',         text: 'mule ai local corpus sovereign knowledge assistant settlement specialist domain' },
  { id: 'glossary-section',section: 'Glossary',        title: 'Key Terms',             text: 'glossary definitions terms protocol trophic astronomy settlement nft' },
  { id: 'polygon',         section: 'Networks',        title: 'Polygon Amoy',          text: 'polygon matic amoy testnet chainid 80002 metamask rpc faucet evm' },
  { id: 'celo',            section: 'Networks',        title: 'Celo Alfajores',        text: 'celo alfajores testnet chainid 44787 valora mpesa east africa mobile wallet' },
  { id: 'algorand',        section: 'Networks',        title: 'Algorand',              text: 'algorand arc3 arc69 arc nft metadata ipfs on-chain' },
  { id: 'catalogs',        section: 'Data',            title: 'Catalog Sources',       text: 'nasa exoplanet archive xmm newton takey hyg virgo vcc fcc rc3 laniakea' },
  { id: 'data-gaps',       section: 'Data',            title: 'Known Gaps',            text: 'missing distance sy_dist null coverage gap southern hemisphere moon data' },
  { id: 'game-theory',     section: 'Specs',           title: 'Game Theory',           text: 'drk-e qnt-p dark energy positron timular blob quantum void cluster' },
  { id: 'security-model',  section: 'Specs',           title: 'Wallet Security',       text: 'scrypt encryption indexeddb browser wallet mnemonic seed phrase anti-phishing' },
  { id: 'settlement-hashmark', section: 'Specs',       title: 'Settlement Hashmark',   text: 'sha256 hash quilt design signature dome stone circle reconstruction' },
  { id: 'field-recording', section: 'Specs',           title: 'Field Recording',       text: 'audio microphone record mediarecorder indexeddb local storage voice' },
  { id: 'coordinate-math', section: 'Specs',           title: 'Coordinate Maths',      text: 'ra dec parsec mpc scene units l4 companion orbit tangent normal' },
  { id: 'security-section',     section: 'Security', title: 'Security Overview',          text: 'security nft wallet smart contract vulnerability cve bulletin disclosure' },
  { id: 'cve-bulletin',         section: 'Security', title: 'Security Bulletin',          text: 'cve bulletin community art token disbursement contributors verifier curator submitter' },
  { id: 'smart-contract-risks', section: 'Security', title: 'Smart Contract Risks',       text: 'reentrancy front-running mev sandwich attack honeypot rug pull phishing address poisoning cwe' },
  { id: 'api-security',         section: 'Security', title: 'API & mule-bot Security',    text: 'cors rate limiting jwt signature settlement auth mule-bot local node' },
  { id: 'contributing',    section: 'Community',       title: 'Community',             text: 'citizen science arts education international community ot kulcha fana ka gpl' },
]

const hints = computed(() => {

  const q =
    query.value
      .trim()
      .toLowerCase()

  if (q.length < 2) {
    return []
  }

  return DOC_INDEX.filter(d =>

    d.title
      .toLowerCase()
      .includes(q)

    ||

    d.text
      .toLowerCase()
      .includes(q)

  ).slice(0, 6)
})

function selectHint(hint: any) {

  if (!hint) return

  scrollTo(hint.id)

  closeSearch()
}

function closeSearch() {

  searchFocused.value = false

  hintIdx.value = 0
}

function clearSearch() {

  query.value = ''

  closeSearch()
}

function onBlur() {

  setTimeout(() => {
    closeSearch()
  }, 120)
}

// ── Key glossary terms (abbreviated for docs index) ───────────────────────────

const KEY_TERMS = [
  { id:  1,  term: 'STN',           short: 'Station Number — prefix for Orbital Station announcement IDs (STN-001…).' },
  { id:  3,  term: 'EXOLOC',        short: 'The exo- namespace for all virtual property addresses.' },
  { id:  6,  term: 'Trophic Level', short: 'A settlement\'s position in the gravitational hierarchy of a star system (L1–L6).' },
  { id: 10,  term: 'L4 SUBLUNARY',  short: 'Trophic level 4 — on the surface of a moon. Coordinate system: exo-moon-surface-v1.' },
  { id: 11,  term: 'L5 SYZYGY',     short: 'Trophic level 5 — at a moon–planet Lagrange equilibrium point.' },
  { id: 24,  term: 'Exolocation',   short: 'Permanent on-chain address anchoring a settlement to a specific location on an exoplanet.' },
  { id: 29,  term: 'Stone Circle',  short: 'Cultural landmark at the centre of each settlement. Marks cardinal directions and carries the intention statement.' },
  { id: 31,  term: 'Resonance Split', short: '99 / 0.75 / 0.25 — 100% to creator. Platform is free and self-optimising.' },
  { id: 40,  term: 'PON INK',       short: 'Primary operations portal for the SCD Hub — records every action on-chain.' },
  { id: 41,  term: 'SCD Hub',       short: 'Sustainable Community Development Hub — US non-profit building digital infrastructure for community resilience.' },
  { id: 42,  term: 'E8 Coxeter Lattice', short: 'Mathematical basis for the wormhole conduit network transit routing geometry.' },
  { id: 45,  term: 'Hub Approvideo', short: 'SCD Hub curated video resource library — maintained by mule-bot.' },
]

const CATALOG_ROWS = [
  { name: 'NASA Exoplanet Archive (viz set)',  count: '6,158 planets',   use: 'Galaxy star-system sprites, surface views, addressing' },
  { name: 'XMM-Newton Takey2013 X-ray',       count: '345 clusters',    use: 'Cosmic view cluster sprites, LOD galaxy fields' },
  { name: 'HYG Star Database v4.1',            count: '119,626 stars',   use: 'Cluster foreground star fields, stellar physics' },
  { name: 'Virgo Cluster Catalog (VCC)',        count: '2,096 galaxies',  use: 'Virgo LOD 2/3 galaxy morphology field' },
  { name: 'Fornax Cluster Catalog (FCC)',       count: '340 galaxies',    use: 'Fornax LOD 2/3 galaxy field' },
  { name: 'Third Reference Catalogue (RC3)',    count: '23,022 galaxies', use: 'LOD 3 galaxy structure parameters' },
]

// ── Hash routing — scroll to anchor on mount ──────────────────────────────────







</script>

<style scoped>

/* PAGE */

.dp-page {

  min-height: 100vh;

  background:
    #020408;

  color: white;

  overflow-x: hidden;
}

/* TOPBAR */

.dp-topbar {

  position: fixed;

  top: 0;
  left: 0;
  right: 0;

  z-index: 3000;

  height: 54px;

  display: flex;
  align-items: center;

  padding: 0 18px;

  background:
    rgba(0,4,14,0.94);

  border-bottom:
    1px solid rgba(0,120,180,0.16);

  backdrop-filter:
    blur(12px);
}

.dp-topbar-left {

  display: flex;
  align-items: center;
  gap: 10px;
}

.dp-nav-toggle {

  width: 34px;
  height: 34px;

  border: none;

  border-radius: 8px;

  background:
    rgba(0,20,40,0.8);

  color:
    rgba(180,220,255,0.8);

  cursor: pointer;
}

.dp-home-link {

  text-decoration: none;

  font-size: 12px;

  letter-spacing: 0.14em;
}

.dp-home-exo {
  color: #4dd0e1;
}

.dp-home-topia {
  color: #90a4ae;
}

.dp-topbar-title {

  flex: 1;

  text-align: center;

  font-size: 10px;

  letter-spacing: 0.18em;

  color:
    rgba(120,170,210,0.5);
}

/* SEARCH */

.dp-search-wrap {

  position: relative;

  width: 260px;

  z-index: 5000;
}

.dp-search-input :deep(.q-field__control) {

  background:
    rgba(0,12,24,0.92);

  border-radius: 10px;
}

.dp-kbd {

  font-size: 9px;

  padding: 2px 6px;

  border-radius: 4px;

  background:
    rgba(0,25,50,0.8);

  color:
    rgba(120,180,220,0.7);
}

.dp-search-results {

  position: absolute;

  top: calc(100% + 8px);

  left: 0;
  right: 0;

  overflow: hidden;

  border-radius: 12px;

  background:
    rgba(0,6,18,0.985);

  border:
    1px solid rgba(0,120,180,0.22);

  box-shadow:
    0 18px 48px rgba(0,0,0,0.6);

  z-index: 9999;
}

.dp-search-result {

  width: 100%;

  padding: 12px 14px;

  border: none;

  text-align: left;

  cursor: pointer;

  background: transparent;

  border-bottom:
    1px solid rgba(0,50,90,0.18);
}

.dp-search-result:hover,
.dp-search-result--active {

  background:
    rgba(0,40,90,0.5);
}

.dp-search-section {

  font-size: 8px;

  color:
    rgba(0,180,220,0.55);

  margin-bottom: 4px;
}

.dp-search-title {

  font-size: 11px;

  color:
    rgba(220,235,255,0.92);
}

/* LAYOUT */

.dp-layout {

  display: flex;

  padding-top: 54px;
}

/* SIDEBAR */

.dp-nav {

  position: sticky;

  top: 54px;

  width: 260px;

  height: calc(100vh - 54px);

  overflow-y: auto;

  background:
    rgba(0,6,18,0.9);

  border-right:
    1px solid rgba(0,90,140,0.18);

  transition:
    width 0.22s ease;
}

.dp-nav--collapsed {

  width: 72px;
}

.dp-nav-head {

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 10px 14px;

  cursor: pointer;

  color:
    rgba(0,210,255,0.72);

  font-size: 10px;
}

.dp-nav-item {

  display: block;

  padding:
    7px 14px 7px 24px;

  color:
    rgba(130,180,220,0.7);

  text-decoration: none;

  cursor: pointer;
}

.dp-nav-item:hover {

  background:
    rgba(0,40,90,0.45);
}

.dp-nav-item--active {

  background:
    rgba(0,60,120,0.45);

  border-left:
    2px solid #00d4ff;
}

/* CONTENT */

.dp-content {

  flex: 1;

  padding:
    36px 54px 120px;

  transition:
    padding 0.22s ease;
}

.dp-content--expanded {

  padding-left: 72px;
}

.dp-section {

  max-width: 860px;
}

.dp-h1 {

  font-size: 28px;

  margin-bottom: 18px;

  color:
    rgba(220,240,255,0.94);
}

.dp-h2 {

  font-size: 16px;

  margin-bottom: 10px;

  color:
    rgba(190,225,255,0.9);
}

.dp-p {

  line-height: 1.8;

  color:
    rgba(140,190,225,0.72);
}

/* TRANSITIONS */

.fade-enter-active,
.fade-leave-active {

  transition:
    opacity 0.16s ease;
}

.fade-enter-from,
.fade-leave-to {

  opacity: 0;
}

</style>