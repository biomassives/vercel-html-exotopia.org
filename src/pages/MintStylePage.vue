<template>
  <q-page class="mint-style-page">

    <!-- ── Top bar ─────────────────────────────────────────────────────────── -->
    <div class="ms-topbar">
      <div class="ms-topbar-left">
        <q-icon name="mdi-tune-variant" color="cyan-5" size="16px" class="q-mr-xs" />
        <span class="ms-title">GENERATIVE MINTING STYLE</span>
        <span class="ms-sub">compose · save · mint</span>
      </div>
      <div class="ms-topbar-right">
        <q-btn flat dense size="sm" color="cyan-7" icon="add" label="New Style"
          @click="newStyle" />
        <q-btn flat dense size="sm" color="blue-grey-5" icon="upload" label="Import"
          @click="showImportDialog = true" />
        <q-btn flat dense size="sm" color="blue-grey-5" icon="mdi-hexagon-multiple" label="Mint"
          @click="$router.push('/mint')" />
      </div>
    </div>

    <div class="ms-body">

      <!-- ── Start here: curated presets ───────────────────────────────────
           A small, hand-picked set of one-click starting points — distinct
           from the history-based "suggested today" panel below, which needs
           browsing activity to have anything to suggest. This is the
           first-visit path: pick a tile, get a real composed piece
           immediately, calibrate further in the configurator if you want. -->
      <Transition name="ms-expand">
        <div v-if="showCuratedPresets" class="ms-curated">
          <div class="ms-curated-head">
            <span>START HERE — PICK A PIECE</span>
            <button class="ms-suggested-dismiss" @click="showCuratedPresets = false" title="Dismiss">✕</button>
          </div>
          <div class="ms-curated-note">
            One click composes a real piece from live Exotopia data. Adjust anything below, or mint it as-is —
            you own what you make; Exotopia provides the tools, not a marketplace for the result.
          </div>
          <div class="ms-regime-tabs">
            <button
              v-for="r in PRESET_REGIMES" :key="r.id"
              :class="['ms-regime-tab', { 'ms-regime-tab--active': r.id === activeRegime }]"
              @click="activeRegime = r.id"
            >{{ r.label }}</button>
          </div>
          <div class="ms-regime-blurb">{{ activeRegimeInfo.blurb }}</div>
          <div class="ms-curated-grid">
            <button
              v-for="p in visiblePresets" :key="p.id"
              class="ms-curated-tile" :style="{ '--accent': p.accentColor }"
              @click="applyCuratedPreset(p)"
            >
              <span class="ms-curated-icon">{{ p.icon }}</span>
              <span class="ms-curated-label">{{ p.label }}</span>
              <span class="ms-curated-blurb">{{ p.blurb }}</span>
            </button>
          </div>
        </div>
      </Transition>

      <!-- ── Left: style library ─────────────────────────────────────────── -->
      <div class="ms-library">
        <div class="ms-library-head">
          SAVED STYLES  ·  {{ store.styles.length }}
        </div>

        <!-- ── Smart presets from session history ──────────── -->
        <Transition name="ms-expand">
          <div v-if="showSuggestions && smartPresets.length" class="ms-suggested">
            <div class="ms-suggested-head">
              <span>⟡ SUGGESTED TODAY</span>
              <button class="ms-suggested-dismiss" @click="showSuggestions = false" title="Dismiss">✕</button>
            </div>
            <div class="ms-suggested-note">Based on your session activity</div>

            <div
              v-for="preset in smartPresets"
              :key="preset.style.id"
              class="ms-preset-card"
              :class="`ms-preset-card--${preset.confidence}`"
              @click="applySmartPreset(preset)"
            >
              <!-- Confidence bar -->
              <div class="ms-preset-conf-bar" :class="`ms-conf--${preset.confidence}`" />

              <div class="ms-preset-name">{{ preset.style.name }}</div>
              <div class="ms-preset-reason">{{ preset.reason }}</div>

              <!-- Source chips -->
              <div class="ms-preset-chips">
                <span
                  v-for="src in Object.entries(preset.style.sources).filter(([,v]) => v).map(([k]) => k.replace('_',' '))"
                  :key="src"
                  class="ms-chip"
                >{{ src }}</span>
                <span class="ms-chip ms-chip--chain">{{ preset.style.targetChain }}</span>
              </div>

              <div class="ms-preset-action">Click to use this style →</div>
            </div>

            <div class="ms-suggested-footer">
              {{ smartPresets.length }} suggestion{{ smartPresets.length !== 1 ? 's' : '' }} ·
              refreshes each session
            </div>
          </div>
        </Transition>

        <div v-if="store.styles.length === 0 && (!showSuggestions || !smartPresets.length)" class="ms-empty">
          No styles yet.<br>Create one above or use a session suggestion.
        </div>

        <div
          v-for="s in store.styles"
          :key="s.id"
          :class="['ms-style-card', { 'ms-style-card--active': s.id === store.activeStyleId }]"
          @click="store.selectStyle(s.id)"
        >
          <div class="ms-sc-name">{{ s.name }}</div>
          <div class="ms-sc-meta">
            {{ activeSources(s).join(' · ') || 'no sources' }}
          </div>
          <div class="ms-sc-meta">
            {{ s.targetChain.toUpperCase() }}  ·  minted {{ s.mintCount }}×
          </div>
          <div class="ms-sc-actions">
            <q-btn flat dense round size="xs" icon="content_copy" color="blue-grey-6"
              title="Duplicate" @click.stop="store.duplicateStyle(s.id)" />
            <q-btn flat dense round size="xs" icon="download" color="blue-grey-6"
              title="Export JSON" @click.stop="exportStyle(s.id)" />
            <q-btn flat dense round size="xs" icon="delete" color="red-8"
              title="Delete" @click.stop="store.deleteStyle(s.id)" />
          </div>
        </div>
      </div>

      <!-- ── Centre: source configurator ────────────────────────────────── -->
      <div class="ms-configurator" v-if="style">

        <!-- Style name + description -->
        <div class="ms-config-head">
          <q-input
            v-model="style.name"
            dense dark borderless
            class="ms-name-input"
            @update:model-value="touch"
          />
          <q-input
            v-model="style.description"
            dense dark borderless
            placeholder="Short description…"
            class="ms-desc-input"
            @update:model-value="touch"
          />
        </div>

        <!-- Source modules -->
        <div class="ms-sources">

          <!-- ── WB1 Artist / Musician ─────────────────────────────── -->
          <div :class="['ms-source-block', { 'ms-source-block--active': style.sources.wb1_artist }]">
            <div class="ms-source-header" @click="toggle('wb1_artist')">
              <div class="ms-source-dot ms-dot--wb1" />
              <span class="ms-source-name">Worldbridger One  ·  Artist / Musician</span>
              <q-space />
              <q-toggle v-model="style.sources.wb1_artist" color="cyan-5" dense @update:model-value="touch" @click.stop />
            </div>
            <Transition name="ms-expand">
              <div v-if="style.sources.wb1_artist" class="ms-source-body">
                <div class="ms-row">
                  <q-input v-model="style.wb1Config.artistHandle" label="Artist handle" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model="style.wb1Config.community"    label="Community"     dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-input v-model="style.wb1Config.artistRole" label="Role (DJ / Musician / Visual Artist…)" dark dense outlined class="ms-field-wide" @update:model-value="touch" />
                  <q-select v-model="style.wb1Config.license" :options="LICENSES" emit-value map-options label="License" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-toggle v-model="style.wb1Config.includeMusic"  label="Include music ($SUNLIGHT)" color="amber-5" dense @update:model-value="touch" />
                  <q-toggle v-model="style.wb1Config.includeVisual" label="Include visual artwork"  color="purple-5" dense @update:model-value="touch" />
                </div>
                <div v-if="style.wb1Config.includeMusic" class="ms-row">
                  <q-input v-model="style.wb1Config.trackTitle" label="Track title" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model="style.wb1Config.audioCid"   label="Audio IPFS CID" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div v-if="style.wb1Config.includeVisual" class="ms-row">
                  <q-input v-model="style.wb1Config.artworkTitle" label="Artwork title" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model="style.wb1Config.artworkCid"   label="Artwork IPFS CID" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
              </div>
            </Transition>
          </div>

          <!-- ── Ecocity Sustainable Model ─────────────────────────── -->
          <div :class="['ms-source-block', { 'ms-source-block--active': style.sources.ecocity_model }]">
            <div class="ms-source-header" @click="toggle('ecocity_model')">
              <div class="ms-source-dot ms-dot--eco" />
              <span class="ms-source-name">Ecocity  ·  Sustainable Design Model  (exchangeable 3D)</span>
              <q-space />
              <q-toggle v-model="style.sources.ecocity_model" color="green-5" dense @update:model-value="touch" @click.stop />
            </div>
            <Transition name="ms-expand">
              <div v-if="style.sources.ecocity_model" class="ms-source-body">
                <div class="ms-row">
                  <q-select
                    v-model="ecocityCategory"
                    :options="CATEGORY_OPTIONS"
                    emit-value map-options
                    label="Category"
                    dark dense outlined class="ms-field"
                  />
                  <q-select
                    v-model="style.ecocityConfig.modelId"
                    :options="categoryModels"
                    option-label="name" option-value="id"
                    emit-value map-options
                    label="Model"
                    dark dense outlined class="ms-field-wide"
                    @update:model-value="touch"
                  />
                </div>
                <div class="ms-row">
                  <q-toggle v-model="style.ecocityConfig.includeImpactMetrics" label="Include impact metrics" color="green-5" dense @update:model-value="touch" />
                  <q-toggle v-model="style.ecocityConfig.includeGltfRef" label="Embed 3D model reference (GLTF)" color="teal-5" dense @update:model-value="touch" />
                </div>
                <div v-if="selectedModel" class="ms-model-preview">
                  <span class="ms-model-icon">⬡</span>
                  <span class="ms-model-name">{{ selectedModel.name }}</span>
                  <span class="ms-model-impact">{{ selectedModel.impact }}</span>
                  <span v-if="!selectedModel.gltfCid" class="ms-model-warn">3D not yet uploaded</span>
                </div>
                <q-input v-model="style.ecocityConfig.customImpactNote" label="Custom impact note (override default)" dark dense outlined class="ms-field-wide q-mt-xs" @update:model-value="touch" />
              </div>
            </Transition>
          </div>

          <!-- ── mule-bot Knowledge Delta ────────────────────────── -->
          <div :class="['ms-source-block', { 'ms-source-block--active': style.sources.mule_delta }]">
            <div class="ms-source-header" @click="toggle('mule_delta')">
              <div class="ms-source-dot ms-dot--mule" />
              <span class="ms-source-name">mule-bot  ·  Land Knowledge Delta</span>
              <q-space />
              <q-toggle v-model="style.sources.mule_delta" color="amber-5" dense @update:model-value="touch" @click.stop />
            </div>
            <Transition name="ms-expand">
              <div v-if="style.sources.mule_delta" class="ms-source-body">
                <div class="ms-row">
                  <q-input v-model="style.muleDeltaConfig.sphereId"       label="Sphere ID (planet name)" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model="style.muleDeltaConfig.settlementName" label="Settlement name"          dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-select v-model="style.muleDeltaConfig.tier"
                    :options="['Foal','Colt','Stallion','Sovereign']"
                    label="Mule Tier" dark dense outlined class="ms-field"
                    @update:model-value="touch" />
                  <q-input v-model.number="style.muleDeltaConfig.corpusDepth" type="number" label="Corpus depth (items)" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-toggle v-model="style.muleDeltaConfig.includeKnowledgeDelta" label="Include knowledge delta" color="amber-5" dense @update:model-value="touch" />
                  <q-toggle v-model="style.muleDeltaConfig.includeVisitorStats"   label="Include visitor stats"   color="amber-7" dense @update:model-value="touch" />
                </div>
                <q-input v-if="style.muleDeltaConfig.includeKnowledgeDelta"
                  v-model="style.muleDeltaConfig.deltaNote"
                  label="Knowledge delta note (new learning since last mint)"
                  dark dense outlined class="ms-field-wide q-mt-xs" type="textarea" rows="2"
                  @update:model-value="touch" />
                <div v-if="style.muleDeltaConfig.includeVisitorStats" class="ms-row q-mt-xs">
                  <q-input v-model.number="style.muleDeltaConfig.visitorCount" type="number" label="Visitor count" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
              </div>
            </Transition>
          </div>

          <!-- ── Gallery Show Event ─────────────────────────────────── -->
          <div :class="['ms-source-block', { 'ms-source-block--active': style.sources.gallery_event }]">
            <div class="ms-source-header" @click="toggle('gallery_event')">
              <div class="ms-source-dot ms-dot--gallery" />
              <span class="ms-source-name">Exotopia Gallery  ·  Show / Event Metadata</span>
              <q-space />
              <q-toggle v-model="style.sources.gallery_event" color="purple-5" dense @update:model-value="touch" @click.stop />
            </div>
            <Transition name="ms-expand">
              <div v-if="style.sources.gallery_event" class="ms-source-body">
                <div class="ms-row">
                  <q-input v-model="style.galleryConfig.eventTitle"    label="Event title"     dark dense outlined class="ms-field-wide" @update:model-value="touch" />
                  <q-input v-model="style.galleryConfig.eventDate"     type="date" label="Date" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-input v-model="style.galleryConfig.venuePlanet"   label="Venue (planet)"  dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model="style.galleryConfig.curatorHandle" label="Curator handle"  dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-select v-model="style.galleryConfig.eventType"
                    :options="EVENT_TYPES" emit-value map-options
                    label="Event Type" dark dense outlined class="ms-field"
                    @update:model-value="touch" />
                  <q-input v-model.number="style.galleryConfig.artworkCount" type="number" label="Artworks shown" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-toggle v-model="style.galleryConfig.includeAttendance" label="Include attendance" color="purple-5" dense @update:model-value="touch" />
                </div>
                <div v-if="style.galleryConfig.includeAttendance" class="ms-row">
                  <q-input v-model.number="style.galleryConfig.attendeeCount" type="number" label="Attendees" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
              </div>
            </Transition>
          </div>

          <!-- ── Settlement Status / History ────────────────────────── -->
          <div :class="['ms-source-block', { 'ms-source-block--active': style.sources.settlement_status }]">
            <div class="ms-source-header" @click="toggle('settlement_status')">
              <div class="ms-source-dot ms-dot--settlement" />
              <span class="ms-source-name">Exotopia Settlement  ·  Status & Eco-ops History</span>
              <q-space />
              <q-toggle v-model="style.sources.settlement_status" color="cyan-7" dense @update:model-value="touch" @click.stop />
            </div>
            <Transition name="ms-expand">
              <div v-if="style.sources.settlement_status" class="ms-source-body">
                <div class="ms-row">
                  <q-input v-model="style.settlementConfig.hostname"   label="Hostname (star system)" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model="style.settlementConfig.planetName" label="Planet name"            dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-input v-model.number="style.settlementConfig.ecoOpsCount"     type="number" label="Eco-ops check-ins" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model.number="style.settlementConfig.settlementAge"   type="number" label="Settlement age (days)" dark dense outlined class="ms-field" @update:model-value="touch" />
                  <q-input v-model.number="style.settlementConfig.objectsInstalled" type="number" label="Objects installed" dark dense outlined class="ms-field" @update:model-value="touch" />
                </div>
                <div class="ms-row">
                  <q-toggle v-model="style.settlementConfig.includeEcoOpsHistory" label="Include eco-ops history" color="cyan-7" dense @update:model-value="touch" />
                  <q-toggle v-model="style.settlementConfig.includeObjectList"    label="Include object inventory" color="cyan-9" dense @update:model-value="touch" />
                </div>
                <q-input v-model="milestonesRaw" label="Milestones (comma-separated)" dark dense outlined
                  class="ms-field-wide q-mt-xs"
                  hint="e.g. First check-in, 10 WQ readings, Module earned"
                  @update:model-value="parseMilestones" />
              </div>
            </Transition>
          </div>
        </div>

        <!-- ── Output config ────────────────────────────────────────────── -->
        <div class="ms-output-row">
          <q-select v-model="style.targetChain" :options="CHAIN_OPTIONS" emit-value map-options label="Target Chain" dark dense outlined class="ms-field" @update:model-value="touch" />
          <q-input v-model="style.nftSymbol" label="NFT Symbol" dark dense outlined class="ms-field-narrow" maxlength="12" @update:model-value="touch" />
          <q-select v-model="style.outputFormat" :options="FORMAT_OPTIONS" emit-value map-options label="Format" dark dense outlined class="ms-field" @update:model-value="touch" />
          <q-btn unelevated color="cyan-8" icon="save" label="Save" @click="saveStyle" class="q-ml-sm" />
        </div>

      </div>

      <!-- ── Right: live metadata preview ───────────────────────────────── -->
      <div class="ms-preview" v-if="style">
        <div class="ms-preview-head">
          <span>METADATA PREVIEW</span>
          <span class="ms-preview-serial">#{{ String((style.mintCount || 0) + 1).padStart(4,'0') }}</span>
          <q-btn flat dense size="xs" icon="refresh" color="cyan-6" label="Compose" @click="recompose" />
          <q-btn flat dense size="xs" icon="content_copy" color="blue-grey-5" @click="copyMeta" title="Copy JSON" />
        </div>

        <!-- Warnings -->
        <div v-for="w in composed?.warnings" :key="w" class="ms-warning">⚠ {{ w }}</div>

        <!-- Active source chips -->
        <div class="ms-source-chips" v-if="composed">
          <span v-for="src in composed.sources" :key="src" class="ms-chip">{{ src }}</span>
          <span v-if="!composed.sources.length" class="ms-chip ms-chip--none">no sources</span>
        </div>

        <!-- Generated name -->
        <div v-if="composed" class="ms-gen-name">{{ composed.meta.name }}</div>
        <div v-if="composed" class="ms-gen-desc">{{ composed.meta.description }}</div>

        <!-- Attributes table -->
        <div v-if="composed" class="ms-attr-table">
          <div v-for="a in composed.meta.attributes" :key="a.trait_type" class="ms-attr-row">
            <span class="ms-attr-key">{{ a.trait_type }}</span>
            <span class="ms-attr-val">{{ a.value }}</span>
          </div>
        </div>

        <!-- Raw JSON (collapsed) -->
        <details class="ms-json-details" v-if="composed">
          <summary class="ms-json-summary">Raw JSON ({{ metaBytes }} bytes)</summary>
          <pre class="ms-json">{{ metaJson }}</pre>
        </details>

        <!-- Mint button -->
        <div class="ms-mint-actions q-mt-md" v-if="composed">
          <q-btn
            unelevated color="cyan-8" icon="mdi-send" label="Mint with this Style"
            class="full-width q-mb-xs"
            :disable="composed.sources.length === 0"
            @click="mintWithStyle"
          />
          <div class="ms-mint-note">
            Routes to Mint page with metadata pre-loaded.
            Wallet signing + gas confirmation happens there.
          </div>
        </div>
      </div>

      <!-- No style selected -->
      <div class="ms-preview ms-empty-preview" v-else>
        <q-icon name="mdi-tune-variant" size="32px" color="blue-grey-8" />
        <div class="ms-empty-text">Create or select a minting style to begin composing.</div>
        <q-btn unelevated color="cyan-9" icon="add" label="Create first style" @click="newStyle" />
      </div>

    </div><!-- ms-body -->

    <!-- ── Import dialog ────────────────────────────────────────────────── -->
    <q-dialog v-model="showImportDialog">
      <q-card class="import-card q-pa-md">
        <div class="text-subtitle2 text-cyan-4 q-mb-sm">Import Style JSON</div>
        <q-input v-model="importJson" type="textarea" rows="8" dark outlined dense
          placeholder="Paste exported style JSON here…" class="q-mb-sm" />
        <div v-if="importError" class="ms-warning">{{ importError }}</div>
        <div class="row justify-end q-gutter-sm">
          <q-btn flat label="Cancel" color="blue-grey-5" v-close-popup />
          <q-btn unelevated label="Import" color="cyan-8" @click="doImport" />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter }                        from 'vue-router'
import { useMintStyleStore }                from 'src/stores/mint-style'
import {
  composeMetadata, ECOCITY_MODELS, ECOCITY_CATEGORIES,
  type MintingStyle,
} from 'src/lib/mint-style'
import {
  readNavHistory, generateSmartPresets,
  type SmartPreset,
} from 'src/lib/nav-history'
import {
  CURATED_PRESETS, PRESET_REGIMES, buildCuratedStyle,
  type CuratedPreset, type PresetRegimeId,
} from 'src/data/mint-style-presets'

const router = useRouter()
const store  = useMintStyleStore()

// ── Smart presets from session history ────────────────────────────────────────

const smartPresets = ref<SmartPreset[]>([])
const showSuggestions = ref(true)   // user can dismiss the suggestions panel

onMounted(() => {
  const history = readNavHistory()
  smartPresets.value = generateSmartPresets(history)
})

function applySmartPreset(preset: SmartPreset) {
  // Deep-clone the suggested style, add to saved styles, and open it
  const saved = store.createStyle(preset.style.name)
  Object.assign(saved, {
    ...JSON.parse(JSON.stringify(preset.style)),
    id:        saved.id,       // keep fresh UUID from createStyle
    created:   saved.created,
    updated:   saved.updated,
    mintCount: 0,
  })
  store.updateStyle(saved.id, saved)
  store.selectStyle(saved.id)
  showSuggestions.value = false
  recompose()
}

// ── Curated presets — the first-visit "start here" path ─────────────────────

const showCuratedPresets = ref(true)
const activeRegime = ref<PresetRegimeId>(PRESET_REGIMES[0]!.id)

const activeRegimeInfo = computed(() =>
  PRESET_REGIMES.find(r => r.id === activeRegime.value) ?? PRESET_REGIMES[0]!
)

const visiblePresets = computed(() =>
  CURATED_PRESETS.filter(p => p.regime === activeRegime.value)
)

function applyCuratedPreset(preset: CuratedPreset) {
  const built = buildCuratedStyle(preset)
  const saved = store.createStyle(built.name)
  Object.assign(saved, {
    ...JSON.parse(JSON.stringify(built)),
    id: saved.id, created: saved.created, updated: saved.updated, mintCount: 0,
  })
  store.updateStyle(saved.id, saved)
  store.selectStyle(saved.id)
  recompose()
}

// ── Active style (reactive proxy) ────────────────────────────────────────────

const style = computed<MintingStyle | null>(() => store.activeStyle)

function touch() {
  if (style.value) store.updateStyle(style.value.id, {})
  recompose()
}

function toggle(key: keyof MintingStyle['sources']) {
  if (!style.value) return
  style.value.sources[key] = !style.value.sources[key]
  touch()
}

// ── Ecocity model selection ───────────────────────────────────────────────────

const ecocityCategory = ref<typeof ECOCITY_CATEGORIES[number]>('watsan')

const categoryModels = computed(() =>
  ECOCITY_MODELS.filter(m => m.category === ecocityCategory.value)
)

const selectedModel = computed(() =>
  ECOCITY_MODELS.find(m => m.id === style.value?.ecocityConfig.modelId)
)

watch(ecocityCategory, cat => {
  // Auto-select first model in new category
  const first = ECOCITY_MODELS.find(m => m.category === cat)
  if (first && style.value) { style.value.ecocityConfig.modelId = first.id; touch() }
})

// ── Milestones helper ─────────────────────────────────────────────────────────

const milestonesRaw = ref('')

watch(() => style.value?.settlementConfig.milestones, m => {
  if (m) milestonesRaw.value = m.join(', ')
}, { immediate: true })

function parseMilestones() {
  if (!style.value) return
  style.value.settlementConfig.milestones = milestonesRaw.value
    .split(',').map(s => s.trim()).filter(Boolean)
  touch()
}

// ── Source helper ─────────────────────────────────────────────────────────────

function activeSources(s: MintingStyle): string[] {
  return Object.entries(s.sources)
    .filter(([, v]) => v)
    .map(([k]) => k.replace('_', ' '))
}

// ── Option catalogs ───────────────────────────────────────────────────────────

const LICENSES = [
  { label: 'Personal use',     value: 'personal_use' },
  { label: 'Commercial',       value: 'commercial'   },
  { label: 'Sync',             value: 'sync'         },
  { label: 'Exclusive',        value: 'exclusive'    },
]

const CATEGORY_OPTIONS = ECOCITY_CATEGORIES.map(c => ({
  label: c.toUpperCase(), value: c,
}))

const EVENT_TYPES = [
  { label: 'Exhibition',    value: 'exhibition'    },
  { label: 'Live Session',  value: 'live_session'  },
  { label: 'Workshop',      value: 'workshop'      },
  { label: 'Rap Battle',    value: 'rap_battle'    },
  { label: 'Showcase',      value: 'showcase'      },
]

const CHAIN_OPTIONS = [
  { label: 'Celo',       value: 'celo'      },
  { label: 'Polygon',    value: 'polygon'   },
  { label: 'Algorand',   value: 'algorand'  },
  { label: 'Solana',     value: 'solana'    },
]

const FORMAT_OPTIONS = [
  { label: 'ERC-721',    value: 'erc721'    },
  { label: 'ARC-3',      value: 'arc3'      },
  { label: 'Metaplex',   value: 'metaplex'  },
]

// ── Composed metadata ─────────────────────────────────────────────────────────

const composed = ref<ReturnType<typeof composeMetadata> | null>(null)

function recompose() {
  if (!style.value) { composed.value = null; return }
  composed.value = composeMetadata(style.value)
}

// Recompose when style changes
watch(() => store.activeStyleId, () => { recompose() }, { immediate: true })

const metaJson = computed(() =>
  composed.value ? JSON.stringify(composed.value.meta, null, 2) : ''
)
const metaBytes = computed(() =>
  new TextEncoder().encode(metaJson.value).length
)

function copyMeta() {
  if (metaJson.value) void navigator.clipboard.writeText(metaJson.value)
}

// ── Actions ───────────────────────────────────────────────────────────────────

function newStyle() {
  store.createStyle('New Style')
  recompose()
}

function saveStyle() {
  if (style.value) {
    store.updateStyle(style.value.id, { updated: new Date().toISOString() })
  }
}

function exportStyle(id: string) {
  const json = store.exportStyle(id)
  if (!json) return
  const blob = new Blob([json], { type: 'application/json' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `ponink-style-${id.slice(0, 8)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function mintWithStyle() {
  if (!composed.value || !style.value) return
  // Increment mint count and pass metadata via sessionStorage to MintPage
  store.incrementMintCount(style.value.id)
  try {
    sessionStorage.setItem('exo_pending_mint_meta', JSON.stringify({
      styleId:  style.value.id,
      styleName: style.value.name,
      chain:    style.value.targetChain,
      format:   style.value.outputFormat,
      meta:     composed.value.meta,
    }))
  } catch { /* quota */ }
  void router.push('/mint')
}

// ── Import dialog ─────────────────────────────────────────────────────────────

const showImportDialog = ref(false)
const importJson       = ref('')
const importError      = ref('')

function doImport() {
  importError.value = ''
  const result = store.importStyle(importJson.value)
  if (!result) {
    importError.value = 'Invalid JSON or missing required fields (name, id, sources).'
    return
  }
  showImportDialog.value = false
  importJson.value = ''
  recompose()
}
</script>

<style scoped>
/* ── Page shell ───────────────────────────────────────────────── */

.mint-style-page {
  min-height: 100vh;
  background: #000408;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', monospace;
}

/* ── Top bar ──────────────────────────────────────────────────── */

.ms-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 130, 180, 0.25);
  background: rgba(0, 6, 20, 0.85);
  flex-shrink: 0;
}

.ms-topbar-left  { display: flex; align-items: center; gap: 10px; }
.ms-topbar-right { display: flex; align-items: center; gap: 6px; }

.ms-title {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 240, 0.80);
}

.ms-sub {
  font-size: 8px;
  color: rgba(0, 130, 160, 0.50);
  letter-spacing: 0.08em;
}

/* ── Body (3-column) ──────────────────────────────────────────── */

.ms-body {
  display: grid;
  grid-template-columns: 200px 1fr 320px;
  grid-template-rows: auto 1fr;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 48px);
}

/* Curated presets sits in its own full-width row above the 3-column
   layout — the three columns below (each already overflow-y: auto) end up
   in row 2, sized by whatever the 1fr leaves after this row's natural
   height, instead of the old implicit single-row grid. */
.ms-curated { grid-column: 1 / -1; grid-row: 1; }
.ms-library, .ms-configurator, .ms-preview, .ms-empty-preview { grid-row: 2; }

/* ── Curated presets ("start here") ──────────────────────────── */

.ms-curated {
  background: rgba(0, 14, 26, 0.85);
  border-bottom: 1px solid rgba(0, 160, 200, 0.25);
  padding: 10px 16px 12px;
}

.ms-curated-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: rgba(0, 210, 250, 0.70);
  margin-bottom: 3px;
}

.ms-curated-note {
  font-size: 8px;
  color: rgba(80, 140, 170, 0.65);
  letter-spacing: 0.03em;
  line-height: 1.5;
  max-width: 620px;
  margin-bottom: 10px;
}

.ms-regime-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 6px;
}

.ms-regime-tab {
  background: rgba(0, 10, 22, 0.55);
  border: 1px solid rgba(0, 100, 140, 0.30);
  border-radius: 999px;
  color: rgba(120, 175, 200, 0.75);
  font-family: inherit;
  font-size: 8px;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.ms-regime-tab:hover { border-color: rgba(0, 160, 200, 0.55); color: rgba(180, 220, 240, 0.90); }

.ms-regime-tab--active {
  background: rgba(0, 90, 130, 0.40);
  border-color: rgba(0, 200, 240, 0.65);
  color: rgba(200, 235, 250, 0.95);
}

.ms-regime-blurb {
  font-size: 7.5px;
  color: rgba(90, 145, 175, 0.70);
  letter-spacing: 0.03em;
  margin-bottom: 8px;
}

.ms-curated-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  max-width: 900px;
}

.ms-curated-tile {
  --accent: rgba(0, 200, 240, 0.85);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  background: rgba(0, 10, 22, 0.70);
  border: 1px solid rgba(0, 100, 140, 0.30);
  border-top: 2px solid var(--accent);
  border-radius: 4px;
  padding: 9px 10px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.12s, border-color 0.12s, transform 0.12s;
}
.ms-curated-tile:hover {
  background: rgba(0, 30, 50, 0.65);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.ms-curated-icon  { font-size: 16px; }
.ms-curated-label {
  font-size: 9.5px;
  color: rgba(190, 225, 245, 0.92);
  letter-spacing: 0.02em;
}
.ms-curated-blurb {
  font-size: 7.5px;
  color: rgba(100, 150, 180, 0.70);
  line-height: 1.45;
}

/* ── Smart preset suggestion panel ───────────────────────────── */

.ms-suggested {
  background: rgba(0, 12, 30, 0.70);
  border-bottom: 1px solid rgba(0, 160, 200, 0.20);
  padding: 8px 0 4px;
}

.ms-suggested-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 3px;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 240, 0.55);
}

.ms-suggested-note {
  font-size: 7px;
  color: rgba(60, 110, 150, 0.55);
  letter-spacing: 0.04em;
  padding: 0 12px 6px;
}

.ms-suggested-dismiss {
  background: none; border: none;
  color: rgba(0, 140, 180, 0.45);
  cursor: pointer; font-size: 9px; padding: 0 2px;
  transition: color 0.1s;
}
.ms-suggested-dismiss:hover { color: rgba(0, 200, 240, 0.80); }

.ms-preset-card {
  position: relative;
  overflow: hidden;
  padding: 7px 12px 6px 16px;
  border-bottom: 1px solid rgba(0, 50, 80, 0.25);
  cursor: pointer;
  transition: background 0.12s;
}
.ms-preset-card:hover { background: rgba(0, 60, 100, 0.22); }

.ms-preset-conf-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 3px;
}
.ms-conf--high   { background: rgba(0, 200, 240, 0.75); }
.ms-conf--medium { background: rgba(200, 160, 50, 0.60); }
.ms-conf--low    { background: rgba(80, 120, 160, 0.40); }

.ms-preset-name {
  font-size: 10px;
  color: rgba(140, 200, 230, 0.88);
  letter-spacing: 0.03em;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-preset-reason {
  font-size: 7px;
  color: rgba(70, 120, 150, 0.65);
  letter-spacing: 0.03em;
  line-height: 1.45;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-preset-chips { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 4px; }

.ms-chip--chain {
  background: rgba(0, 60, 100, 0.45);
  border-color: rgba(0, 150, 200, 0.35);
  color: rgba(0, 180, 220, 0.70);
  text-transform: uppercase;
}

.ms-preset-action {
  font-size: 7px;
  color: rgba(0, 160, 200, 0.50);
  letter-spacing: 0.05em;
}

.ms-suggested-footer {
  font-size: 6px;
  color: rgba(50, 90, 120, 0.45);
  letter-spacing: 0.08em;
  padding: 5px 12px 3px;
}

/* ── Style library (left) ─────────────────────────────────────── */

.ms-library {
  border-right: 1px solid rgba(0, 100, 140, 0.25);
  overflow-y: auto;
  padding: 8px 0;
  background: rgba(0, 4, 14, 0.70);
  scrollbar-width: thin;
}

.ms-library-head {
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(0, 130, 160, 0.55);
  padding: 4px 12px 8px;
}

.ms-empty {
  font-size: 9px;
  color: rgba(60, 100, 130, 0.65);
  padding: 12px;
  text-align: center;
  line-height: 1.6;
}

.ms-style-card {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 50, 80, 0.30);
  cursor: pointer;
  transition: background 0.1s;
}

.ms-style-card:hover { background: rgba(0, 60, 100, 0.18); }

.ms-style-card--active {
  background: rgba(0, 80, 130, 0.25);
  border-left: 2px solid rgba(0, 180, 220, 0.65);
}

.ms-sc-name {
  font-size: 10px;
  color: rgba(160, 210, 235, 0.88);
  letter-spacing: 0.03em;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-sc-meta {
  font-size: 7px;
  color: rgba(70, 120, 150, 0.65);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-sc-actions {
  display: flex;
  gap: 2px;
  margin-top: 4px;
}

/* ── Configurator (centre) ────────────────────────────────────── */

.ms-configurator {
  overflow-y: auto;
  padding: 12px 16px;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ms-config-head {
  border-bottom: 1px solid rgba(0, 80, 120, 0.25);
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.ms-name-input :deep(.q-field__control) {
  font-size: 16px;
  font-family: 'Courier New', monospace;
  color: rgba(0, 200, 240, 0.85) !important;
}

.ms-desc-input :deep(.q-field__control) {
  font-size: 9px;
  font-family: 'Courier New', monospace;
  color: rgba(80, 130, 160, 0.70) !important;
}

/* Source blocks */

.ms-source-block {
  border: 1px solid rgba(0, 60, 100, 0.35);
  border-radius: 5px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.ms-source-block--active {
  border-color: rgba(0, 160, 200, 0.45);
}

.ms-source-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  background: rgba(0, 6, 20, 0.60);
  transition: background 0.1s;
  user-select: none;
}

.ms-source-header:hover { background: rgba(0, 20, 40, 0.80); }

.ms-source-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ms-dot--wb1        { background: rgba(255, 180, 40, 0.85); }
.ms-dot--eco        { background: rgba(60, 200, 100, 0.85); }
.ms-dot--mule       { background: rgba(255, 180, 40, 0.85); box-shadow: 0 0 6px rgba(255,180,40,0.5); }
.ms-dot--gallery    { background: rgba(180, 80, 255, 0.85); }
.ms-dot--settlement { background: rgba(0, 200, 240, 0.85); }

.ms-source-name {
  font-size: 9px;
  letter-spacing: 0.07em;
  color: rgba(160, 200, 225, 0.80);
}

.ms-source-body {
  padding: 10px 12px;
  background: rgba(0, 4, 16, 0.50);
  border-top: 1px solid rgba(0, 60, 100, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ms-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.ms-field       { flex: 1; min-width: 120px; }
.ms-field-wide  { flex: 2; min-width: 200px; }
.ms-field-narrow { flex: 0 0 90px; }

.ms-model-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: rgba(0, 80, 50, 0.20);
  border: 1px solid rgba(60, 200, 100, 0.25);
  border-radius: 3px;
  font-size: 8px;
}

.ms-model-icon   { color: rgba(60, 200, 100, 0.80); font-size: 12px; }
.ms-model-name   { color: rgba(140, 210, 170, 0.85); flex: 1; }
.ms-model-impact { color: rgba(80, 160, 100, 0.65); font-size: 7px; }
.ms-model-warn   { color: rgba(200, 160, 40, 0.75); font-size: 7px; }

/* Output row */

.ms-output-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 0 4px;
  border-top: 1px solid rgba(0, 80, 120, 0.25);
  margin-top: 4px;
}

/* Expand animation */

.ms-expand-enter-active { transition: max-height 0.20s ease, opacity 0.16s; max-height: 500px; }
.ms-expand-leave-active { transition: max-height 0.15s ease, opacity 0.12s; }
.ms-expand-enter-from, .ms-expand-leave-to { max-height: 0; opacity: 0; }

/* ── Preview panel (right) ────────────────────────────────────── */

.ms-preview {
  border-left: 1px solid rgba(0, 100, 140, 0.25);
  overflow-y: auto;
  padding: 12px;
  background: rgba(0, 4, 14, 0.70);
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ms-empty-preview {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
}

.ms-empty-text {
  font-size: 9px;
  color: rgba(70, 120, 150, 0.65);
  max-width: 220px;
}

.ms-preview-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(0, 180, 220, 0.65);
  border-bottom: 1px solid rgba(0, 80, 120, 0.25);
  padding-bottom: 6px;
}

.ms-preview-serial {
  color: rgba(0, 200, 240, 0.45);
  font-size: 8px;
  margin-left: auto;
}

.ms-warning {
  font-size: 8px;
  color: rgba(255, 160, 40, 0.88);
  padding: 2px 6px;
  border-left: 2px solid rgba(255, 160, 40, 0.45);
}

.ms-source-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ms-chip {
  font-size: 7px;
  padding: 1px 6px;
  border-radius: 2px;
  background: rgba(0, 80, 120, 0.40);
  border: 1px solid rgba(0, 140, 180, 0.35);
  color: rgba(0, 180, 220, 0.75);
  letter-spacing: 0.06em;
}

.ms-chip--none { background: rgba(60, 60, 80, 0.35); color: rgba(100, 120, 140, 0.65); }

.ms-gen-name {
  font-size: 11px;
  color: rgba(0, 200, 240, 0.85);
  letter-spacing: 0.04em;
  font-weight: 600;
}

.ms-gen-desc {
  font-size: 8px;
  color: rgba(100, 150, 175, 0.70);
  line-height: 1.55;
}

.ms-attr-table {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 8px;
  font-size: 8px;
  max-height: 250px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.ms-attr-row { display: contents; }

.ms-attr-key {
  color: rgba(70, 120, 155, 0.65);
  padding: 2px 0;
  white-space: nowrap;
}

.ms-attr-val {
  color: rgba(160, 210, 232, 0.85);
  padding: 2px 0;
  word-break: break-all;
}

.ms-json-details { margin-top: 4px; }

.ms-json-summary {
  font-size: 8px;
  color: rgba(60, 100, 140, 0.65);
  cursor: pointer;
  letter-spacing: 0.06em;
  list-style: none;
}

.ms-json {
  font-size: 7px;
  color: rgba(100, 160, 190, 0.75);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 6, 18, 0.60);
  border: 1px solid rgba(0, 60, 100, 0.25);
  border-radius: 3px;
  padding: 6px;
  margin-top: 4px;
  scrollbar-width: thin;
}

.ms-mint-note {
  font-size: 7px;
  color: rgba(70, 110, 140, 0.60);
  letter-spacing: 0.04em;
  text-align: center;
  margin-top: 4px;
}

/* ── Import dialog ────────────────────────────────────────────── */

.import-card {
  background: rgba(1, 6, 22, 0.97);
  border: 1px solid rgba(0, 180, 220, 0.25);
  border-radius: 8px;
  min-width: 420px;
  max-width: 600px;
}
</style>
