<template>
  <q-page class="station-page">

    <!-- ── Station list (shown when stations already exist) ─────────────── -->
    <div v-if="showList" class="station-list-view">
      <div class="sl-header">
        <div class="sl-title">
          <q-icon name="mdi-space-station" color="cyan-5" size="18px" class="q-mr-sm" />
          YOUR STATIONS
        </div>
        <q-btn unelevated color="cyan-8" icon="add" label="New Station" size="sm"
          @click="startNew" />
      </div>

      <div class="sl-grid">
        <div
          v-for="s in stationStore.stations"
          :key="s.stationId"
          class="sl-card"
          :class="{ 'sl-card--active': stationStore.activeStation?.stationId === s.stationId }"
          @click="stationStore.activeStation = s"
        >
          <div class="slc-id">{{ s.stationId }}</div>
          <div class="slc-name">{{ s.stationName }}</div>
          <div class="slc-loc">{{ s.hostname }} · {{ s.planetName }}</div>
          <div class="slc-modules">
            <span v-for="m in moduleSlotOrder" :key="m"
              class="slc-slot" :class="s.modules[m] ? 'slc-slot--filled' : 'slc-slot--empty'"
              :title="s.modules[m]?.moduleName ?? `${m} — empty`"
            />
          </div>
          <div class="slc-mint" v-if="s.mintAddress">
            <q-icon name="mdi-check-circle" color="green-5" size="12px" class="q-mr-xs" />
            <span class="text-green-5" style="font-size:7px">MINTED</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Wizard ─────────────────────────────────────────────────────────── -->
    <div v-else class="wizard">

      <!-- Step progress bar -->
      <div class="wiz-progress">
        <div class="wiz-step-track">
          <div
            v-for="(step, i) in STEPS"
            :key="step.id"
            class="wiz-step-item"
            :class="{
              'wiz-step--done':    currentStep > i,
              'wiz-step--active':  currentStep === i,
              'wiz-step--future':  currentStep < i,
            }"
            @click="currentStep > i && (currentStep = i)"
          >
            <div class="wiz-step-dot">
              <q-icon v-if="currentStep > i" name="check" size="10px" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="wiz-step-label">{{ step.label }}</div>
          </div>
          <!-- Track line between dots -->
          <div class="wiz-track-line"
            :style="{ width: (currentStep / (STEPS.length - 1) * 100) + '%' }" />
        </div>
      </div>

      <!-- ══ STEP 0: WELCOME / WHAT IS A STATION ════════════════════════════ -->
      <div v-if="currentStep === 0" class="wiz-panel">
        <div class="wiz-icon-hero">
          <q-icon name="mdi-space-station" size="52px" color="cyan-5" />
        </div>
        <div class="wiz-heading">Build your orbital station</div>
        <div class="wiz-sub">
          A station is your permanent infrastructure in space — a named,
          on-chain record that anchors your eco-ops work, creative output,
          and community contributions to a specific exoplanet location.
        </div>

        <div class="concept-grid q-mt-lg">
          <div class="concept-card" v-for="c in STATION_CONCEPTS" :key="c.title">
            <q-icon :name="c.icon" :color="c.color" size="22px" class="q-mb-xs" />
            <div class="cc-title">{{ c.title }}</div>
            <div class="cc-desc">{{ c.desc }}</div>
          </div>
        </div>

        <div class="wiz-actions q-mt-xl">
          <q-btn
            unelevated color="cyan-8" icon-right="arrow_forward"
            label="Start building →" size="md"
            @click="currentStep = 1"
          />
          <q-btn flat color="blue-grey-5" label="View existing stations"
            v-if="stationStore.stations.length"
            @click="showList = true"
            class="q-ml-sm" size="sm"
          />
        </div>
      </div>

      <!-- ══ STEP 1: STATION IDENTITY ═══════════════════════════════════════ -->
      <div v-if="currentStep === 1" class="wiz-panel">
        <div class="wiz-heading">Name your station</div>
        <div class="wiz-sub">
          This name appears in your pon.ink dashboard, on-chain metadata,
          and when visitors transit to your settlement. Choose something
          that represents your community or purpose.
        </div>

        <div class="wiz-form q-mt-lg">
          <q-input
            v-model="form.stationName"
            label="Station name"
            dark outlined dense
            :rules="[v => v.trim().length >= 2 || 'At least 2 characters',
                     v => v.trim().length <= 48 || 'Max 48 characters']"
            counter maxlength="48"
            hint="e.g. 'Mpeketoni Field Station' · 'OT Kulcha Sound Lab' · 'Aurora Research Hub'"
            class="q-mb-md"
          />

          <q-input
            v-model="form.stationId"
            label="Station ID (auto-generated, editable)"
            dark outlined dense
            :rules="[v => /^[A-Z0-9-]{4,16}$/.test(v) || 'Uppercase, numbers and hyphens, 4–16 chars']"
            hint="STA-001 · MPEKETONI-01 · AURORA"
            class="q-mb-md"
          />
        </div>

        <div class="wiz-hint-box q-mt-md">
          <q-icon name="info" color="cyan-7" size="14px" class="q-mr-sm flex-shrink-0" />
          <span>
            Your station ID becomes part of your permanent exolocation address.
            Once minted on-chain it cannot be changed — but the name can be
            updated via the pon.ink dashboard.
          </span>
        </div>

        <div class="wiz-actions q-mt-xl">
          <q-btn flat color="blue-grey-5" icon="arrow_back" label="Back"
            @click="currentStep = 0" />
          <q-btn unelevated color="cyan-8" icon-right="arrow_forward"
            label="Choose location →"
            :disable="!step1Valid"
            @click="currentStep = 2"
            class="q-ml-sm"
          />
        </div>
      </div>

      <!-- ══ STEP 2: LOCATION ════════════════════════════════════════════════ -->
      <div v-if="currentStep === 2" class="wiz-panel">
        <div class="wiz-heading">Choose your location</div>
        <div class="wiz-sub">
          Your station is anchored to a confirmed exoplanet in the NASA archive.
          This determines your Exotopia address, your settlement's sky view,
          and the planet data shown in your gallery.
        </div>

        <div class="wiz-form q-mt-lg">
          <q-select
            v-model="form.hostname"
            :options="systemOptions"
            label="Star system"
            dark outlined dense
            use-input
            input-debounce="200"
            @filter="filterSystems"
            emit-value map-options
            hint="Type to search 4,590+ star systems"
            class="q-mb-md"
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section>
                  <q-item-label style="font-family:monospace;font-size:11px">{{ opt.label }}</q-item-label>
                  <q-item-label caption>{{ opt.dist }} pc · {{ opt.spec }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="form.planetName"
            :options="planetOptions"
            :disable="!form.hostname"
            label="Planet"
            dark outlined dense
            emit-value map-options
            hint="Select a confirmed exoplanet in this system"
            class="q-mb-md"
          />
        </div>

        <!-- Location preview -->
        <div v-if="form.hostname && form.planetName" class="location-preview q-mt-sm">
          <div class="lp-label">EXOLOCATION ADDRESS PREVIEW</div>
          <div class="lp-address">
            exo-surface-v1:{{ form.hostname }}:{{ form.planetName }}
          </div>
          <div class="lp-meta" v-if="selectedSystem">
            {{ selectedSystem.st_teff ? selectedSystem.st_teff + ' K host star' : '' }}
            {{ selectedSystem.sy_dist ? ' · ' + selectedSystem.sy_dist.toFixed(0) + ' pc from Earth' : '' }}
            {{ selectedPlanet?.pl_eqt ? ' · ' + selectedPlanet.pl_eqt + ' K surface' : '' }}
          </div>
        </div>

        <div class="wiz-hint-box q-mt-md">
          <q-icon name="mdi-earth" color="green-6" size="14px" class="q-mr-sm flex-shrink-0" />
          <span>
            Can't find your planet? Any confirmed NASA archive entry works.
            You can also use the Milky Way map to explore systems and return here.
          </span>
        </div>

        <div class="wiz-actions q-mt-xl">
          <q-btn flat color="blue-grey-5" icon="arrow_back" label="Back"
            @click="currentStep = 1" />
          <q-btn unelevated color="cyan-8" icon-right="arrow_forward"
            label="Configure modules →"
            :disable="!step2Valid"
            @click="currentStep = 3"
            class="q-ml-sm"
          />
        </div>
      </div>

      <!-- ══ STEP 3: MODULE CONFIGURATION ═══════════════════════════════════ -->
      <div v-if="currentStep === 3" class="wiz-panel wiz-panel--wide">
        <div class="wiz-heading">Configure your modules</div>
        <div class="wiz-sub">
          Modules define what your station does. You can name each module now
          and configure it fully later. All slots are optional at this stage —
          install what you have and add more over time.
        </div>

        <div class="module-grid q-mt-lg">
          <div
            v-for="slot in moduleSlotOrder"
            :key="slot"
            class="module-slot"
            :class="{ 'module-slot--filled': !!form.modules[slot]?.name }"
          >
            <!-- Module header -->
            <div class="ms-head">
              <q-icon :name="MODULE_META[slot].icon" :color="MODULE_META[slot].color" size="18px" />
              <div>
                <div class="ms-type">{{ slot.toUpperCase() }}</div>
                <div class="ms-role">{{ MODULE_META[slot].role }}</div>
              </div>
              <q-toggle
                v-model="form.modules[slot].enabled"
                color="cyan-5" dense size="sm"
                class="q-ml-auto"
              />
            </div>

            <Transition name="slot-expand">
              <div v-if="form.modules[slot].enabled" class="ms-body">
                <div class="ms-desc">{{ MODULE_META[slot].desc }}</div>
                <q-input
                  v-model="form.modules[slot].name"
                  :label="`${slot} module name`"
                  dark outlined dense
                  :placeholder="MODULE_META[slot].placeholder"
                  maxlength="48"
                  class="q-mt-xs"
                />
              </div>
            </Transition>

            <div v-if="!form.modules[slot].enabled" class="ms-empty-hint">
              Toggle to enable and name this module
            </div>
          </div>
        </div>

        <div class="wiz-hint-box q-mt-lg">
          <q-icon name="mdi-clock-outline" color="amber-6" size="14px" class="q-mr-sm flex-shrink-0" />
          <span>
            You don't need to fill every slot now. An empty station is valid —
            modules can be installed one at a time as your community grows.
            Each module is a separate Solana cNFT minted independently.
          </span>
        </div>

        <div class="wiz-actions q-mt-xl">
          <q-btn flat color="blue-grey-5" icon="arrow_back" label="Back"
            @click="currentStep = 2" />
          <q-btn unelevated color="cyan-8" icon-right="arrow_forward"
            label="Review & mint →"
            @click="buildStation(); currentStep = 4"
            class="q-ml-sm"
          />
        </div>
      </div>

      <!-- ══ STEP 4: REVIEW & MINT ═══════════════════════════════════════════ -->
      <div v-if="currentStep === 4" class="wiz-panel">
        <div class="wiz-heading">Review your station</div>
        <div class="wiz-sub">
          Check everything before committing on-chain.
          Run a dry run first — it validates metadata without spending gas.
        </div>

        <!-- Summary card -->
        <div class="review-card q-mt-lg">
          <div class="review-row">
            <span class="rr-key">Station name</span>
            <span class="rr-val">{{ form.stationName }}</span>
          </div>
          <div class="review-row">
            <span class="rr-key">Station ID</span>
            <span class="rr-val">{{ form.stationId }}</span>
          </div>
          <div class="review-row">
            <span class="rr-key">Star system</span>
            <span class="rr-val">{{ form.hostname }}</span>
          </div>
          <div class="review-row">
            <span class="rr-key">Planet</span>
            <span class="rr-val">{{ form.planetName }}</span>
          </div>
          <div class="review-row">
            <span class="rr-key">Exolocation</span>
            <span class="rr-val rr-val--code">
              exo-surface-v1:{{ form.hostname }}:{{ form.planetName }}
            </span>
          </div>
          <q-separator dark class="q-my-xs" style="opacity:0.15" />
          <div class="review-row" v-for="slot in moduleSlotOrder" :key="slot">
            <span class="rr-key">{{ slot }}</span>
            <span class="rr-val"
              :class="form.modules[slot].enabled && form.modules[slot].name ? 'rr-val--filled' : 'rr-val--empty'">
              {{ form.modules[slot].enabled && form.modules[slot].name
                  ? form.modules[slot].name
                  : '— empty slot' }}
            </span>
          </div>
        </div>

        <!-- Fee isolation display -->
        <div class="fee-box q-mt-md">
          <div class="fee-free">
            <span class="fee-free-label">MINT COST</span>
            <span class="fee-free-value">FREE</span>
          </div>
          <q-separator dark class="q-my-xs" style="opacity:0.12" />
          <div class="fee-detail">
            <span>Solana Bubblegum cNFT gas</span>
            <span class="fee-gas">~0.000005 SOL (network only)</span>
          </div>
          <div class="fee-note">
            Gas is the only cost at mint time. Exotopia does not operate a resale market —
            there is no aftermarket fee to disclose.
          </div>
        </div>

        <!-- Validation summary -->
        <div class="validation-box q-mt-md" v-if="validationItems.length">
          <div class="vb-label">PRE-FLIGHT CHECKS</div>
          <div v-for="v in validationItems" :key="v.label" class="vb-item">
            <q-icon
              :name="v.ok ? 'check_circle' : 'warning'"
              :color="v.ok ? 'green-5' : 'amber-5'"
              size="13px" class="q-mr-xs"
            />
            {{ v.label }}
            <span class="vb-note">{{ v.note }}</span>
          </div>
        </div>

        <!-- Dry run result -->
        <div v-if="dryRunResult" class="dry-run-result q-mt-sm"
          :class="dryRunResult.ok ? 'dry-run--ok' : 'dry-run--warn'">
          <q-icon :name="dryRunResult.ok ? 'check_circle' : 'warning'" size="14px" class="q-mr-xs" />
          {{ dryRunResult.message }}
        </div>

        <div class="wiz-actions q-mt-xl">
          <q-btn flat color="blue-grey-5" icon="arrow_back" label="Edit"
            @click="currentStep = 3" />
          <q-btn outline color="cyan-6" icon="mdi-eye" label="Dry Run"
            :loading="dryRunning"
            @click="runDryRun"
            class="q-ml-sm"
          />
          <q-btn unelevated color="cyan-8" icon="mdi-send" label="Mint Station Core"
            :loading="minting"
            :disable="!allChecksPass"
            @click="executeMint"
            class="q-ml-sm"
          />
        </div>

        <!-- Success state -->
        <div v-if="mintSuccess" class="mint-success q-mt-lg">
          <q-icon name="check_circle" color="green-4" size="28px" />
          <div class="mint-success-title">Station created!</div>
          <div class="mint-success-desc">
            {{ form.stationName }} is established at {{ form.planetName }}.
          </div>
          <div class="row q-gutter-sm q-mt-md justify-center">
            <q-btn unelevated color="cyan-8" icon="mdi-space-station" label="Enter Station"
              @click="$router.push(`/station-interior/${encodeURIComponent(form.hostname)}/${encodeURIComponent(form.planetName)}`)" />
            <q-btn unelevated color="cyan-8" icon="scatter_plot" label="Milky Way Map"
              @click="$router.push('/galaxy')" />
            <q-btn outline color="blue-grey-5" label="Build another"
              @click="resetWizard" />
          </div>
        </div>
      </div>

    </div><!-- /wizard -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useRouter }        from 'vue-router'
import { useStationStore }  from 'src/stores/station'
import { useGalaxyStore }   from 'src/stores/galaxy'
import type { ModuleType }  from 'src/lib/station-modules'

const stationStore = useStationStore()
const galaxyStore  = useGalaxyStore()
const router       = useRouter()

// ── Wizard state ──────────────────────────────────────────────────────────────

const showList    = ref(false)
const currentStep = ref(0)
const dryRunning  = ref(false)
const minting     = ref(false)
const mintSuccess = ref(false)
const dryRunResult = ref<{ ok: boolean; message: string } | null>(null)

const moduleSlotOrder = stationStore.moduleSlotOrder

// ── Wizard steps config ───────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Welcome'   },
  { id: 1, label: 'Identity'  },
  { id: 2, label: 'Location'  },
  { id: 3, label: 'Modules'   },
  { id: 4, label: 'Mint'      },
]

// ── Station concepts (step 0) ─────────────────────────────────────────────────

const STATION_CONCEPTS = [
  {
    icon: 'mdi-map-marker-star', color: 'cyan-5',
    title: 'Permanent address',
    desc: 'Your station is linked to a real NASA-catalogued exoplanet. The address is on-chain and yours forever.',
  },
  {
    icon: 'mdi-view-module', color: 'amber-5',
    title: 'Modular design',
    desc: 'Seven module types — gallery, watsan, energy, shelter, healthcare, food, and command. Install what you need.',
  },
  {
    icon: 'mdi-handshake', color: 'green-5',
    title: 'Community infrastructure',
    desc: 'Stations power workshops, eco-ops data collection, cultural events, and settlement visits.',
  },
  {
    icon: 'mdi-hexagon-multiple', color: 'purple-4',
    title: 'NFT-backed',
    desc: 'The Station Core and each module are Solana Bubblegum cNFTs. Free to mint — gas is the only cost.',
  },
]

// ── Module metadata (step 3) ──────────────────────────────────────────────────

const MODULE_META: Record<ModuleType, {
  icon: string; color: string; role: string; desc: string; placeholder: string
}> = {
  gallery: {
    icon: 'mdi-rotate-3d', color: 'purple-4',
    role: 'Virtual exhibition space',
    desc: 'Display NFT artworks, host gallery openings, and enable collector visits. Connects to the pon.ink settlement registry.',
    placeholder: 'Aurora Gallery · Community Showcase',
  },
  watsan: {
    icon: 'water_drop', color: 'cyan-5',
    role: 'Water & sanitation field node',
    desc: 'Tracks water quality readings, waste mapping, and sanitation data. Mints on-chain Water Quality Certs.',
    placeholder: 'Mpeketoni Water Station · Field Node Alpha',
  },
  energy: {
    icon: 'mdi-solar-panel', color: 'amber-5',
    role: 'Renewable energy systems',
    desc: 'Solar arrays, biogas digesters, micro-hydro. Tracks energy output and CO₂ offset metrics.',
    placeholder: 'Solar Hub · Biogas Station Beta',
  },
  shelter: {
    icon: 'mdi-home-circle-outline', color: 'orange-4',
    role: 'Habitat & shelter design',
    desc: 'Compressed earth block construction, passive cooling, green roofing. Links to ecocity design specs.',
    placeholder: 'Earth Block Workshop · Habitat Centre',
  },
  healthcare: {
    icon: 'mdi-medical-bag', color: 'red-4',
    role: 'Community health worker support',
    desc: 'Health post protocols, water quality interpretation, health card credential issuance.',
    placeholder: 'Health Post Alpha · Wellness Hub',
  },
  food: {
    icon: 'mdi-sprout', color: 'green-5',
    role: 'Food production & aquaponics',
    desc: 'Aquaponics systems, permaculture gardens, seed banks. Tracks food yield and market linkage.',
    placeholder: 'Aquaponics Lab · Community Garden',
  },
  command: {
    icon: 'mdi-satellite-uplink', color: 'blue-4',
    role: 'Communications & governance',
    desc: 'DAO coordination, event scheduling, community broadcast, and data routing for the settlement network.',
    placeholder: 'Command Centre · Network Hub',
  },
}

// ── Form state ────────────────────────────────────────────────────────────────

const form = reactive({
  stationName: '',
  stationId:   '',
  hostname:    '',
  planetName:  '',
  modules:     Object.fromEntries(
    moduleSlotOrder.map(s => [s, { enabled: false, name: '' }])
  ) as Record<ModuleType, { enabled: boolean; name: string }>,
})

// Auto-generate stationId from name
watch(() => form.stationName, name => {
  form.stationId = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 16)
    || 'STA'
})

// ── Galaxy store integration ──────────────────────────────────────────────────

const systemSearch = ref('')
const systemOptions = ref<{ label: string; value: string; dist: string; spec: string }[]>([])

function filterSystems(val: string, update: (cb: () => void) => void) {
  systemSearch.value = val
  update(() => {
    const q = val.toLowerCase()
    if (!galaxyStore.isLoaded) {
      void galaxyStore.loadData().then(() => buildSystemOptions(q))
      return
    }
    buildSystemOptions(q)
  })
}

function buildSystemOptions(q: string) {
  const seen = new Set<string>()
  systemOptions.value = []
  for (const [host, sys] of galaxyStore.systems) {
    if (seen.has(host)) continue
    if (!host.toLowerCase().includes(q)) continue
    seen.add(host)
    systemOptions.value.push({
      label: host,
      value: host,
      dist:  sys.sy_dist?.toFixed(0) ?? '?',
      spec:  sys.st_spectype?.slice(0, 4) ?? '—',
    })
    if (systemOptions.value.length >= 50) break
  }
}

const selectedSystem = computed(() =>
  form.hostname ? galaxyStore.systems.get(form.hostname) ?? null : null
)

const planetOptions = computed(() => {
  if (!selectedSystem.value) return []
  return selectedSystem.value.planets.map(p => ({
    label: p.pl_name,
    value: p.pl_name,
  }))
})

const selectedPlanet = computed(() => {
  if (!selectedSystem.value || !form.planetName) return null
  return selectedSystem.value.planets.find(p => p.pl_name === form.planetName) ?? null
})

// ── Validation ────────────────────────────────────────────────────────────────

const step1Valid = computed(() =>
  form.stationName.trim().length >= 2 &&
  form.stationName.trim().length <= 48 &&
  /^[A-Z0-9-]{4,16}$/.test(form.stationId)
)

const step2Valid = computed(() =>
  !!form.hostname.trim() && !!form.planetName.trim()
)

const validationItems = computed(() => [
  {
    ok:    step1Valid.value,
    label: 'Station identity',
    note:  step1Valid.value ? `"${form.stationName}" · ${form.stationId}` : 'Name and ID required',
  },
  {
    ok:    step2Valid.value,
    label: 'Exoplanet location',
    note:  step2Valid.value ? `${form.hostname} · ${form.planetName}` : 'Star system and planet required',
  },
  {
    ok:    true,
    label: 'Module slots',
    note:  `${Object.values(form.modules).filter(m => m.enabled && m.name).length} of 7 configured (all optional)`,
  },
  {
    ok:    true,
    label: 'Mint cost',
    note:  'FREE — network gas only (~0.000005 SOL)',
  },
])

const allChecksPass = computed(() =>
  step1Valid.value && step2Valid.value
)

// ── Actions ───────────────────────────────────────────────────────────────────

function startNew() {
  showList.value   = false
  currentStep.value = 0
  mintSuccess.value = false
  dryRunResult.value = null
}

function buildStation() {
  // Persist to store
  const existing = stationStore.stations.find(s => s.stationId === form.stationId)
  if (!existing) {
    const station = stationStore.createStation(
      form.stationId, form.stationName, form.hostname, form.planetName
    )
    // Install named modules
    for (const [slot, m] of Object.entries(form.modules) as [ModuleType, { enabled: boolean; name: string }][]) {
      if (m.enabled && m.name.trim()) {
        stationStore.installModule(station.stationId, {
          moduleType:  slot,
          moduleName:  m.name.trim(),
          mint:        null,
          solutions:   [],
        })
      }
    }
  }
}

async function runDryRun() {
  dryRunning.value    = true
  dryRunResult.value  = null
  await new Promise(r => setTimeout(r, 900))   // simulate validation
  dryRunning.value    = false
  dryRunResult.value  = allChecksPass.value
    ? { ok: true,  message: 'Dry run passed — metadata valid, ready to mint. Connect wallet to proceed.' }
    : { ok: false, message: 'Validation failed — complete all required fields first.' }
}

async function executeMint() {
  if (!allChecksPass.value) return
  minting.value = true
  await new Promise(r => setTimeout(r, 1400))   // stub — replace with mint-station.ts call
  minting.value    = false
  mintSuccess.value = true
  console.info('[STATION] Mint requested — wiring to mint-station.ts in next sprint')
}

function resetWizard() {
  Object.assign(form, {
    stationName: '', stationId: '', hostname: '', planetName: '',
    modules: Object.fromEntries(moduleSlotOrder.map(s => [s, { enabled: false, name: '' }])),
  })
  currentStep.value  = 0
  mintSuccess.value  = false
  dryRunResult.value = null
}
</script>

<style scoped>
/* ── Page shell ───────────────────────────────────────────────────── */

.station-page {
  min-height: 100vh;
  background: #000408;
  font-family: 'Courier New', monospace;
}

/* ════════════════════════════════════════════════════════════════
   STATION LIST VIEW
   ════════════════════════════════════════════════════════════════ */

.sl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 120, 180, 0.20);
}

.sl-title {
  display: flex;
  align-items: center;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 240, 0.80);
}

.sl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}

.sl-card {
  background: rgba(0, 5, 18, 0.90);
  border: 1px solid rgba(0, 80, 120, 0.30);
  border-radius: 6px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s;
}

.sl-card:hover          { background: rgba(0, 20, 50, 0.85); border-color: rgba(0, 180, 220, 0.40); }
.sl-card--active        { border-color: rgba(0, 200, 240, 0.55); }

.slc-id    { font-size: 7px; letter-spacing: 0.14em; color: rgba(0, 160, 200, 0.55); margin-bottom: 3px; }
.slc-name  { font-size: 12px; color: rgba(180, 220, 245, 0.90); margin-bottom: 3px; }
.slc-loc   { font-size: 8px; color: rgba(80, 130, 160, 0.65); margin-bottom: 8px; }

.slc-modules { display: flex; gap: 4px; margin-bottom: 6px; }

.slc-slot {
  width: 8px; height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.slc-slot--filled { background: rgba(0, 200, 240, 0.70); }
.slc-slot--empty  { background: rgba(40, 60, 80, 0.45); }

.slc-mint { display: flex; align-items: center; }

/* ════════════════════════════════════════════════════════════════
   WIZARD
   ════════════════════════════════════════════════════════════════ */

.wizard {
  max-width: 780px;
  margin: 0 auto;
  padding: 28px 20px 48px;
}

/* ── Step progress ────────────────────────────────────────────── */

.wiz-progress {
  margin-bottom: 36px;
}

.wiz-step-track {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  padding: 0 20px;
}

/* Connecting line under dots */
.wiz-track-line {
  position: absolute;
  top: 14px;
  left: 20px;
  height: 2px;
  background: rgba(0, 200, 240, 0.55);
  transition: width 0.35s ease;
  pointer-events: none;
}

/* Static full-width background line */
.wiz-step-track::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: rgba(0, 80, 120, 0.30);
}

.wiz-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: default;
  position: relative;
  z-index: 1;
}

.wiz-step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0, 80, 120, 0.40);
  background: #000408;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  letter-spacing: 0;
  color: rgba(80, 130, 160, 0.60);
  transition: all 0.20s;
}

.wiz-step--active .wiz-step-dot {
  border-color: #00e5ff;
  background: rgba(0, 160, 200, 0.18);
  color: #00e5ff;
  box-shadow: 0 0 12px rgba(0, 200, 240, 0.30);
}

.wiz-step--done .wiz-step-dot {
  border-color: rgba(0, 200, 240, 0.55);
  background: rgba(0, 140, 180, 0.20);
  color: rgba(0, 200, 240, 0.80);
  cursor: pointer;
}

.wiz-step-label {
  font-size: 7px;
  letter-spacing: 0.12em;
  color: rgba(80, 130, 160, 0.55);
  white-space: nowrap;
}

.wiz-step--active .wiz-step-label { color: rgba(0, 200, 240, 0.80); }
.wiz-step--done   .wiz-step-label { color: rgba(0, 160, 200, 0.60); }

/* ── Panel ────────────────────────────────────────────────────── */

.wiz-panel {
  max-width: 560px;
  margin: 0 auto;
}

.wiz-panel--wide { max-width: 740px; }

.wiz-icon-hero {
  text-align: center;
  margin-bottom: 16px;
}

.wiz-heading {
  font-size: 22px;
  letter-spacing: 0.05em;
  color: rgba(200, 230, 255, 0.92);
  margin-bottom: 8px;
}

.wiz-sub {
  font-size: 10px;
  color: rgba(100, 150, 180, 0.70);
  line-height: 1.70;
  max-width: 480px;
}

/* ── Concept grid ─────────────────────────────────────────────── */

.concept-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.concept-card {
  background: rgba(0, 5, 18, 0.80);
  border: 1px solid rgba(0, 80, 120, 0.25);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.cc-title {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: rgba(160, 210, 235, 0.88);
  margin-bottom: 2px;
}

.cc-desc {
  font-size: 8px;
  color: rgba(80, 130, 160, 0.65);
  line-height: 1.55;
}

/* ── Form elements ────────────────────────────────────────────── */

.wiz-form { display: flex; flex-direction: column; }

.wiz-hint-box {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 11px;
  background: rgba(0, 30, 60, 0.45);
  border: 1px solid rgba(0, 120, 180, 0.22);
  border-radius: 5px;
  font-size: 8px;
  color: rgba(100, 150, 180, 0.70);
  line-height: 1.60;
}

/* ── Location preview ─────────────────────────────────────────── */

.location-preview {
  background: rgba(0, 20, 40, 0.60);
  border: 1px solid rgba(0, 160, 200, 0.28);
  border-radius: 5px;
  padding: 10px 12px;
}

.lp-label {
  font-size: 7px;
  letter-spacing: 0.16em;
  color: rgba(0, 160, 200, 0.50);
  margin-bottom: 5px;
}

.lp-address {
  font-size: 10px;
  color: #00e5ff;
  word-break: break-all;
  margin-bottom: 4px;
}

.lp-meta {
  font-size: 7px;
  color: rgba(80, 130, 160, 0.60);
  letter-spacing: 0.04em;
}

/* ── Module grid ──────────────────────────────────────────────── */

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 8px;
}

.module-slot {
  background: rgba(0, 4, 14, 0.85);
  border: 1px solid rgba(0, 60, 100, 0.35);
  border-radius: 6px;
  padding: 11px 12px;
  transition: border-color 0.14s;
}

.module-slot--filled {
  border-color: rgba(0, 180, 220, 0.38);
}

.ms-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 4px;
}

.ms-type {
  font-size: 9px;
  letter-spacing: 0.10em;
  color: rgba(160, 210, 235, 0.85);
  line-height: 1.2;
}

.ms-role {
  font-size: 7px;
  color: rgba(80, 130, 160, 0.60);
  letter-spacing: 0.04em;
}

.ms-body { margin-top: 6px; }

.ms-desc {
  font-size: 7.5px;
  color: rgba(90, 140, 170, 0.65);
  line-height: 1.55;
  margin-bottom: 6px;
}

.ms-empty-hint {
  font-size: 7px;
  color: rgba(60, 90, 120, 0.40);
  letter-spacing: 0.06em;
  margin-top: 3px;
  font-style: italic;
}

/* Expand animation */
.slot-expand-enter-active { transition: max-height 0.22s ease, opacity 0.18s; max-height: 120px; }
.slot-expand-leave-active  { transition: max-height 0.15s ease, opacity 0.12s; }
.slot-expand-enter-from,
.slot-expand-leave-to      { max-height: 0; opacity: 0; overflow: hidden; }

/* ── Review card ──────────────────────────────────────────────── */

.review-card {
  background: rgba(0, 5, 18, 0.85);
  border: 1px solid rgba(0, 80, 120, 0.28);
  border-radius: 6px;
  padding: 12px 14px;
}

.review-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 40, 70, 0.20);
  font-size: 8.5px;
}

.review-row:last-child { border-bottom: none; }

.rr-key  { color: rgba(70, 120, 155, 0.65); flex-shrink: 0; }
.rr-val  { color: rgba(160, 210, 230, 0.85); text-align: right; }
.rr-val--code   { color: #00e5ff; font-size: 7.5px; word-break: break-all; }
.rr-val--filled { color: rgba(60, 220, 120, 0.85); }
.rr-val--empty  { color: rgba(70, 100, 130, 0.45); font-style: italic; }

/* ── Fee display ──────────────────────────────────────────────── */

.fee-box {
  background: rgba(0, 4, 14, 0.80);
  border: 1px solid rgba(0, 80, 120, 0.22);
  border-radius: 5px;
  padding: 10px 12px;
  font-size: 8px;
}

.fee-free {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.fee-free-label {
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(60, 180, 100, 0.65);
}

.fee-free-value {
  font-size: 14px;
  color: rgba(60, 220, 120, 0.90);
  letter-spacing: 0.04em;
}

.fee-detail {
  display: flex;
  justify-content: space-between;
  color: rgba(80, 130, 160, 0.65);
  margin-bottom: 2px;
}

.fee-gas  { color: rgba(80, 120, 160, 0.55); }

.fee-note {
  font-size: 7px;
  color: rgba(60, 100, 140, 0.50);
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 50, 80, 0.20);
  line-height: 1.5;
}

/* ── Validation ───────────────────────────────────────────────── */

.validation-box {
  background: rgba(0, 4, 14, 0.80);
  border: 1px solid rgba(0, 80, 120, 0.22);
  border-radius: 5px;
  padding: 10px 12px;
}

.vb-label {
  font-size: 7px;
  letter-spacing: 0.16em;
  color: rgba(0, 160, 200, 0.45);
  margin-bottom: 7px;
}

.vb-item {
  display: flex;
  align-items: center;
  font-size: 8px;
  color: rgba(140, 190, 220, 0.80);
  margin-bottom: 4px;
}

.vb-note {
  font-size: 7px;
  color: rgba(80, 130, 160, 0.55);
  margin-left: 6px;
  letter-spacing: 0.04em;
}

/* ── Dry run result ───────────────────────────────────────────── */

.dry-run-result {
  display: flex;
  align-items: center;
  font-size: 8px;
  padding: 7px 10px;
  border-radius: 4px;
  border: 1px solid;
}

.dry-run--ok   { border-color: rgba(60, 220, 100, 0.40); color: rgba(60, 220, 100, 0.85); background: rgba(0, 60, 30, 0.25); }
.dry-run--warn { border-color: rgba(255, 160, 40, 0.40); color: rgba(255, 160, 40, 0.85); background: rgba(60, 30, 0, 0.25); }

/* ── Mint success ─────────────────────────────────────────────── */

.mint-success {
  text-align: center;
  padding: 24px;
  background: rgba(0, 40, 20, 0.35);
  border: 1px solid rgba(60, 220, 100, 0.25);
  border-radius: 8px;
}

.mint-success-title {
  font-size: 16px;
  color: rgba(60, 220, 120, 0.90);
  margin: 8px 0 4px;
  letter-spacing: 0.06em;
}

.mint-success-desc {
  font-size: 9px;
  color: rgba(100, 160, 130, 0.70);
  letter-spacing: 0.04em;
}

/* ── Shared actions row ───────────────────────────────────────── */

.wiz-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
