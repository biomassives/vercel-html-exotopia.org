<template>
  <q-page class="ledger-page">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="ledger-header">
      <div class="ledger-header-text">
        <div class="ledger-header-label">ECO OPS · FIELD LEDGER</div>
        <template v-if="!editingMeta">
          <div class="ledger-header-title">{{ data.groupName }}</div>
          <div class="ledger-header-sub">
            {{ data.coordinator }}<span class="lh-sep">·</span>{{ data.location }}<span
              v-if="data.season" class="lh-sep">·</span>{{ data.season }}
          </div>
        </template>
        <template v-else>
          <input v-model="data.groupName" class="ledger-meta-input ledger-meta-input--title"
            placeholder="Group name" />
          <div class="ledger-meta-row">
            <input v-model="data.coordinator" class="ledger-meta-input" placeholder="Coordinator" />
            <input v-model="data.location" class="ledger-meta-input" placeholder="Location" />
            <input v-model="data.season" class="ledger-meta-input" placeholder="Season / year" />
          </div>
        </template>
      </div>

      <div class="ledger-header-controls">
        <q-btn flat dense size="sm"
          :icon="editingMeta ? 'mdi-check' : 'mdi-pencil-outline'"
          :label="editingMeta ? 'Done' : 'Edit header'"
          :color="editingMeta ? 'teal-4' : 'blue-grey-4'"
          @click="toggleMeta" />
        <q-btn flat dense size="sm" icon="mdi-download-outline" label="Export"
          color="teal-5" @click="exportJson" />
        <q-btn flat dense size="sm" icon="mdi-printer-outline" label="Print"
          color="blue-grey-4" @click="() => window.print()" />
      </div>
    </div>

    <!-- ── Section 1: Member Contributions Ledger ──────────────────────────── -->
    <div class="ledger-section">
      <div class="ledger-section-head" @click="membersOpen = !membersOpen">
        <div class="ledger-section-title">
          <q-icon name="mdi-account-group-outline" size="16px" color="teal-4" class="q-mr-xs" />
          Member Contributions Ledger
          <span class="ledger-section-sub">· Daftari ya Wanachama</span>
        </div>
        <div class="ledger-section-right">
          <span class="ledger-section-count">{{ data.members.length }} members</span>
          <q-icon :name="membersOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="18px" color="blue-grey-5" />
        </div>
      </div>

      <Transition name="section-slide">
        <div v-if="membersOpen" class="ledger-section-body">

          <div class="ledger-toolbar">
            <q-btn flat dense size="sm" icon="mdi-account-plus-outline" label="Add member"
              color="teal-4" @click="addMember" />
            <span class="ledger-saved-badge" v-if="lastSaved">Saved {{ lastSaved }}</span>
          </div>

          <div class="ledger-table-wrap">
            <table class="ledger-table">
              <thead>
                <tr class="lt-head-en">
                  <th class="lt-name">Name</th>
                  <th class="lt-num" title="Species sightings or habitat events logged this season">Obs.</th>
                  <th class="lt-num" title="Environmental interventions completed">Actions</th>
                  <th class="lt-num" title="Lesson modules or workshops attended">Lessons</th>
                  <th class="lt-num" title="Times knowledge was shared with another member">Shared</th>
                  <th class="lt-num" title="Total certificates earned to date">Certs</th>
                  <th class="lt-num" title="Running platform points balance">Points</th>
                  <th class="lt-act-col"></th>
                </tr>
                <tr class="lt-head-sw">
                  <th>Jina</th>
                  <th>Uchunguzi</th>
                  <th>Kazi</th>
                  <th>Masomo</th>
                  <th>Mafunzo</th>
                  <th>Vyeti</th>
                  <th>Pointi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="m in data.members" :key="m.id">
                  <!-- Display row -->
                  <tr v-if="editingMemberId !== m.id"
                    class="lt-row" @dblclick="startEditMember(m.id)">
                    <td class="lt-name">{{ m.name || '—' }}</td>
                    <td class="lt-num">{{ m.observations }}</td>
                    <td class="lt-num">{{ m.actions }}</td>
                    <td class="lt-num">{{ m.lessons }}</td>
                    <td class="lt-num">{{ m.knowledgeShared }}</td>
                    <td class="lt-num">{{ m.certificates }}</td>
                    <td class="lt-num lt-points">{{ m.points }}</td>
                    <td class="lt-act-col">
                      <q-btn flat round dense size="xs" icon="mdi-pencil-outline"
                        color="blue-grey-5" @click.stop="startEditMember(m.id)" />
                      <q-btn flat round dense size="xs" icon="mdi-delete-outline"
                        color="red-4" @click.stop="deleteMember(m.id)" />
                    </td>
                  </tr>
                  <!-- Edit row -->
                  <tr v-else class="lt-row lt-row--editing">
                    <td class="lt-name">
                      <input v-model="m.name" class="lt-input lt-input--name"
                        placeholder="Member name" autofocus @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-num">
                      <input v-model.number="m.observations" type="number" min="0"
                        class="lt-input lt-input--num" @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-num">
                      <input v-model.number="m.actions" type="number" min="0"
                        class="lt-input lt-input--num" @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-num">
                      <input v-model.number="m.lessons" type="number" min="0"
                        class="lt-input lt-input--num" @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-num">
                      <input v-model.number="m.knowledgeShared" type="number" min="0"
                        class="lt-input lt-input--num" @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-num">
                      <input v-model.number="m.certificates" type="number" min="0"
                        class="lt-input lt-input--num" @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-num">
                      <input v-model.number="m.points" type="number" min="0"
                        class="lt-input lt-input--num" @keyup.enter="stopEditMember" />
                    </td>
                    <td class="lt-act-col">
                      <q-btn flat round dense size="xs" icon="mdi-check"
                        color="teal-4" @click.stop="stopEditMember" title="Done" />
                    </td>
                  </tr>
                </template>

                <!-- Totals row -->
                <tr class="lt-totals">
                  <td class="lt-name">Jumla / Total</td>
                  <td class="lt-num">{{ memberTotals.observations }}</td>
                  <td class="lt-num">{{ memberTotals.actions }}</td>
                  <td class="lt-num">{{ memberTotals.lessons }}</td>
                  <td class="lt-num">{{ memberTotals.knowledgeShared }}</td>
                  <td class="lt-num">{{ memberTotals.certificates }}</td>
                  <td class="lt-num lt-points">{{ memberTotals.points }}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="ledger-table-hint">
            Double-click any row to edit · Numbers are season-to-date totals
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Section 2: Species & Habitat Register ───────────────────────────── -->
    <div class="ledger-section">
      <div class="ledger-section-head" @click="speciesOpen = !speciesOpen">
        <div class="ledger-section-title">
          <q-icon name="mdi-leaf" size="16px" color="green-4" class="q-mr-xs" />
          Species &amp; Habitat Register
          <span class="ledger-section-sub">· Daftari ya Viumbe na Makazi</span>
        </div>
        <div class="ledger-section-right">
          <span class="ledger-section-count">{{ data.species.length }} entries</span>
          <q-icon :name="speciesOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="18px" color="blue-grey-5" />
        </div>
      </div>

      <Transition name="section-slide">
        <div v-if="speciesOpen" class="ledger-section-body">

          <div class="ledger-toolbar">
            <q-btn flat dense size="sm" icon="mdi-plus-circle-outline"
              label="Add species / habitat" color="green-4" @click="addSpecies" />
            <div class="ledger-search-wrap">
              <q-icon name="mdi-magnify" size="13px" color="blue-grey-5" />
              <input v-model="speciesSearch" class="ledger-search"
                placeholder="Search entries…" type="search" />
            </div>
          </div>

          <div class="species-list">
            <div
              v-for="sp in filteredSpecies"
              :key="sp.id"
              class="species-card"
              :class="{ 'species-card--open': editingSpeciesId === sp.id }"
            >
              <!-- Card header (always visible) -->
              <div class="species-card-head" @click="toggleSpeciesEdit(sp.id)">
                <div class="species-card-names">
                  <span class="sp-local">{{ sp.localName || '— new entry —' }}</span>
                  <span v-if="sp.swahiliName" class="sp-swahili">{{ sp.swahiliName }}</span>
                  <span v-if="sp.scientificName" class="sp-scientific">{{ sp.scientificName }}</span>
                </div>
                <div class="species-card-meta">
                  <span v-if="sp.status" class="sp-status"
                    :class="`sp-status--${sp.status.toLowerCase()}`">
                    {{ sp.status }}
                  </span>
                  <q-icon
                    :name="editingSpeciesId === sp.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    size="16px" color="blue-grey-5" />
                </div>
              </div>

              <!-- Collapsed role preview (when not editing) -->
              <div v-if="editingSpeciesId !== sp.id && sp.ecologicalRole"
                class="species-card-role">
                {{ sp.ecologicalRole }}
              </div>

              <!-- Edit body -->
              <Transition name="subcat-slide">
                <div v-if="editingSpeciesId === sp.id" class="species-card-body">
                  <div class="sp-field-grid">
                    <div class="sp-field">
                      <label class="sp-label">
                        <span class="sp-label-sw">Jina la Kienyeji</span>
                        Local name (exact)
                      </label>
                      <input v-model="sp.localName" class="sp-input"
                        placeholder="Name as the community uses it" />
                    </div>
                    <div class="sp-field">
                      <label class="sp-label">
                        <span class="sp-label-sw">Jina la Kiswahili</span>
                        Swahili name
                      </label>
                      <input v-model="sp.swahiliName" class="sp-input"
                        placeholder="Swahili name (all variants)" />
                    </div>
                    <div class="sp-field">
                      <label class="sp-label">
                        <span class="sp-label-sw">Jina la Kisayansi</span>
                        Scientific name
                      </label>
                      <input v-model="sp.scientificName" class="sp-input sp-input--italic"
                        placeholder="Genus species — leave blank if unknown" />
                    </div>
                    <div class="sp-field">
                      <label class="sp-label">
                        <span class="sp-label-sw">Hali</span>
                        Status
                      </label>
                      <select v-model="sp.status" class="sp-input sp-select">
                        <option value="">— select —</option>
                        <option>Common</option>
                        <option>Occasional</option>
                        <option>Rare</option>
                        <option>Threatened</option>
                        <option>Invasive</option>
                      </select>
                    </div>
                    <div class="sp-field sp-field--full">
                      <label class="sp-label">
                        <span class="sp-label-sw">Jukumu la Ikolojia</span>
                        Ecological role
                      </label>
                      <textarea v-model="sp.ecologicalRole" class="sp-input sp-textarea"
                        placeholder="What does this organism do in the ecosystem? One sentence." rows="2" />
                    </div>
                    <div class="sp-field sp-field--full">
                      <label class="sp-label">
                        <span class="sp-label-sw">Maeneo Yaliyoonekana</span>
                        Locations seen
                      </label>
                      <input v-model="sp.locationsSeen" class="sp-input"
                        placeholder="Named local places (GPS optional)" />
                    </div>
                    <div class="sp-field sp-field--full">
                      <label class="sp-label">
                        <span class="sp-label-sw">Vitendo Vilivyochukuliwa</span>
                        Actions taken
                      </label>
                      <input v-model="sp.actionsTaken" class="sp-input"
                        placeholder="Planted, removed, monitored, documented…" />
                    </div>
                  </div>

                  <div class="sp-card-foot">
                    <q-btn flat dense size="sm" icon="mdi-check" label="Done"
                      color="teal-4" @click.stop="stopEditSpecies" />
                    <q-btn flat dense size="sm" icon="mdi-delete-outline" label="Remove"
                      color="red-4" @click.stop="deleteSpecies(sp.id)" />
                  </div>
                </div>
              </Transition>
            </div>

            <div v-if="filteredSpecies.length === 0 && speciesSearch" class="ledger-empty">
              No entries match "{{ speciesSearch }}"
            </div>
            <div v-else-if="data.species.length === 0" class="ledger-empty">
              No species recorded yet — add the first entry above.
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────────── -->
    <div class="ledger-footer">
      <span>Eco Ops · SCD Hub · GPL v3</span>
      <span v-if="lastSaved" class="ledger-footer-saved">Last saved {{ lastSaved }}</span>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

// ── Types ──────────────────────────────────────────────────────────────────

interface Member {
  id: string
  name: string
  observations: number
  actions: number
  lessons: number
  knowledgeShared: number
  certificates: number
  points: number
}

interface SpeciesEntry {
  id: string
  localName: string
  swahiliName: string
  scientificName: string
  ecologicalRole: string
  status: 'Common' | 'Occasional' | 'Rare' | 'Threatened' | 'Invasive' | ''
  locationsSeen: string
  actionsTaken: string
}

interface LedgerData {
  groupName: string
  coordinator: string
  location: string
  season: string
  members: Member[]
  species: SpeciesEntry[]
}

// ── Seed data (Mpeketoni group + Lamu coastal species) ──────────────────────

const SEED: LedgerData = {
  groupName: 'Mpeketoni Eco Ops Group',
  coordinator: 'Muirithi Jariffe',
  location: 'Mpeketoni, Lamu County',
  season: '2026 Season 1',
  members: [
    { id: 'm1', name: 'Muirithi Jariffe', observations: 0, actions: 0, lessons: 0, knowledgeShared: 0, certificates: 0, points: 0 },
  ],
  species: [
    {
      id: 'sp1', localName: 'Mkoko', swahiliName: 'Mkoko', scientificName: 'Rhizophora mucronata',
      ecologicalRole: 'Protects coastline from erosion; nursery for juvenile fish and prawns; sequesters carbon in root mud.',
      status: 'Common', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp2', localName: 'Mchu', swahiliName: 'Mchu', scientificName: 'Avicennia marina',
      ecologicalRole: 'Colonises open mudflats; tolerates high salinity; provides habitat for mudskippers and crabs.',
      status: 'Common', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp3', localName: 'Msine', swahiliName: 'Msine', scientificName: 'Ceriops tagal',
      ecologicalRole: 'Dense stands provide shelter for waterbirds; bark used traditionally for fish traps and tanning.',
      status: 'Common', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp4', localName: 'Muia', swahiliName: 'Muia', scientificName: 'Sonneratia alba',
      ecologicalRole: 'Flowers are important nectar source for bats and insects at night; fruits eaten by monkeys.',
      status: 'Occasional', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp5', localName: 'Mkandaa', swahiliName: 'Mkandaa', scientificName: 'Xylocarpus granatum',
      ecologicalRole: 'Large buttress roots provide shelter for fish; heavy timber traditionally used for boat building.',
      status: 'Occasional', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp6', localName: 'Kasa', swahiliName: 'Kasa', scientificName: 'Chelonia mydas',
      ecologicalRole: 'Grazes seagrass; maintains seabed health; nests on beaches — highly sensitive to disturbance.',
      status: 'Threatened', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp7', localName: 'Pomboo', swahiliName: 'Pomboo', scientificName: 'Tursiops aduncus',
      ecologicalRole: 'Apex predator in coastal waters; indicator of fish stock health.',
      status: 'Occasional', locationsSeen: '', actionsTaken: '',
    },
    {
      id: 'sp8', localName: 'Nyasi ya bahari', swahiliName: 'Nyasi ya bahari', scientificName: 'Thalassia hemprichii',
      ecologicalRole: 'Nursery and feeding ground for sea turtles, dugongs, and juvenile fish; stabilises seabed.',
      status: 'Common', locationsSeen: '', actionsTaken: '',
    },
  ],
}

// ── Storage ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'eco_ledger_v1'

function loadData (): LedgerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LedgerData
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(SEED))
}

function saveData (d: LedgerData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
  lastSaved.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── State ──────────────────────────────────────────────────────────────────

const data = reactive<LedgerData>(loadData())
const lastSaved = ref('')
const editingMeta = ref(false)
const membersOpen = ref(true)
const speciesOpen = ref(true)
const editingMemberId = ref<string | null>(null)
const editingSpeciesId = ref<string | null>(null)
const speciesSearch = ref('')

// Auto-save whenever data changes
watch(data, (d) => saveData(d), { deep: true })

// ── Computed ───────────────────────────────────────────────────────────────

const memberTotals = computed(() => data.members.reduce(
  (acc, m) => ({
    observations: acc.observations + (m.observations || 0),
    actions:      acc.actions      + (m.actions      || 0),
    lessons:      acc.lessons      + (m.lessons      || 0),
    knowledgeShared: acc.knowledgeShared + (m.knowledgeShared || 0),
    certificates: acc.certificates + (m.certificates || 0),
    points:       acc.points       + (m.points       || 0),
  }),
  { observations: 0, actions: 0, lessons: 0, knowledgeShared: 0, certificates: 0, points: 0 }
))

const filteredSpecies = computed(() => {
  const q = speciesSearch.value.trim().toLowerCase()
  if (!q) return data.species
  return data.species.filter(sp =>
    sp.localName.toLowerCase().includes(q) ||
    sp.swahiliName.toLowerCase().includes(q) ||
    sp.scientificName.toLowerCase().includes(q) ||
    sp.ecologicalRole.toLowerCase().includes(q)
  )
})

// ── Member actions ─────────────────────────────────────────────────────────

function uid () {
  return Math.random().toString(36).slice(2, 9)
}

function addMember () {
  const id = uid()
  data.members.push({ id, name: '', observations: 0, actions: 0, lessons: 0, knowledgeShared: 0, certificates: 0, points: 0 })
  editingMemberId.value = id
}

function startEditMember (id: string) {
  editingMemberId.value = id
}

function stopEditMember () {
  editingMemberId.value = null
}

function deleteMember (id: string) {
  data.members = data.members.filter(m => m.id !== id)
  if (editingMemberId.value === id) editingMemberId.value = null
}

// ── Species actions ────────────────────────────────────────────────────────

function addSpecies () {
  const id = uid()
  data.species.push({
    id, localName: '', swahiliName: '', scientificName: '',
    ecologicalRole: '', status: '', locationsSeen: '', actionsTaken: '',
  })
  editingSpeciesId.value = id
  speciesSearch.value = ''
}

function toggleSpeciesEdit (id: string) {
  editingSpeciesId.value = editingSpeciesId.value === id ? null : id
}

function stopEditSpecies () {
  editingSpeciesId.value = null
}

function deleteSpecies (id: string) {
  data.species = data.species.filter(s => s.id !== id)
  if (editingSpeciesId.value === id) editingSpeciesId.value = null
}

// ── Header meta ────────────────────────────────────────────────────────────

function toggleMeta () {
  editingMeta.value = !editingMeta.value
}

// ── Export ─────────────────────────────────────────────────────────────────

function exportJson () {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eco-ledger-${data.groupName.toLowerCase().replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// expose window for print call in template
const window = globalThis.window
</script>

<style scoped lang="scss">
// ── Page ────────────────────────────────────────────────────────────────────
.ledger-page {
  background: #060c0a;
  min-height: 100vh;
  color: rgba(210, 230, 220, 0.88);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  padding-bottom: 48px;
}

// ── Header ──────────────────────────────────────────────────────────────────
.ledger-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 28px 22px;
  border-bottom: 1px solid rgba(60, 180, 100, 0.12);
  background: linear-gradient(180deg, rgba(0, 20, 10, 0.60) 0%, transparent 100%);
  flex-wrap: wrap;
}

.ledger-header-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(80, 200, 120, 0.55);
  font-weight: 600;
  margin-bottom: 5px;
}

.ledger-header-title {
  font-size: 22px;
  font-weight: 600;
  color: rgba(160, 240, 180, 0.92);
  line-height: 1.2;
  margin-bottom: 4px;
}

.ledger-header-sub {
  font-size: 12px;
  color: rgba(140, 200, 160, 0.60);
}

.lh-sep {
  margin: 0 6px;
  opacity: 0.40;
}

.ledger-header-controls {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
  margin-top: 2px;
}

.ledger-meta-input {
  background: rgba(0, 40, 20, 0.55);
  border: 1px solid rgba(60, 180, 100, 0.28);
  border-radius: 4px;
  color: rgba(180, 240, 200, 0.90);
  font-size: 12px;
  padding: 4px 8px;
  outline: none;
  margin-bottom: 4px;
  width: 160px;

  &--title {
    font-size: 18px;
    font-weight: 600;
    width: 280px;
    color: rgba(160, 240, 180, 0.92);
  }

  &:focus {
    border-color: rgba(60, 200, 100, 0.55);
    background: rgba(0, 50, 25, 0.65);
  }
}

.ledger-meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// ── Sections ────────────────────────────────────────────────────────────────
.ledger-section {
  margin: 0 16px 12px;
  border: 1px solid rgba(60, 120, 80, 0.18);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 14, 8, 0.45);

  &:first-of-type {
    margin-top: 20px;
  }
}

.ledger-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  cursor: pointer;
  background: rgba(0, 30, 15, 0.55);
  user-select: none;

  &:hover {
    background: rgba(0, 40, 20, 0.65);
  }
}

.ledger-section-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(160, 240, 180, 0.88);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.ledger-section-sub {
  font-size: 11px;
  color: rgba(100, 180, 130, 0.50);
  font-weight: 400;
}

.ledger-section-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ledger-section-count {
  font-size: 11px;
  color: rgba(100, 180, 130, 0.50);
}

.ledger-section-body {
  padding: 14px 16px 18px;
}

// ── Toolbar ─────────────────────────────────────────────────────────────────
.ledger-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.ledger-saved-badge {
  font-size: 11px;
  color: rgba(80, 200, 120, 0.45);
  margin-left: auto;
}

.ledger-search-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 25, 15, 0.55);
  border: 1px solid rgba(60, 120, 80, 0.22);
  border-radius: 5px;
  padding: 3px 8px;
  margin-left: auto;
}

.ledger-search {
  background: transparent;
  border: none;
  outline: none;
  color: rgba(180, 230, 200, 0.80);
  font-size: 12px;
  width: 160px;

  &::placeholder {
    color: rgba(100, 160, 120, 0.35);
  }
}

// ── Member table ─────────────────────────────────────────────────────────────
.ledger-table-wrap {
  overflow-x: auto;
  border-radius: 5px;
  border: 1px solid rgba(40, 100, 60, 0.18);
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th, td {
    padding: 7px 10px;
    text-align: left;
    border-bottom: 1px solid rgba(40, 80, 55, 0.15);
    white-space: nowrap;
  }

  .lt-head-en th {
    font-size: 11px;
    font-weight: 600;
    color: rgba(120, 200, 150, 0.70);
    background: rgba(0, 22, 12, 0.70);
    letter-spacing: 0.04em;
    cursor: default;
  }

  .lt-head-sw th {
    font-size: 10px;
    font-weight: 400;
    color: rgba(80, 150, 100, 0.42);
    background: rgba(0, 18, 10, 0.60);
    padding-top: 3px;
    padding-bottom: 4px;
    font-style: italic;
  }

  .lt-name {
    min-width: 140px;
  }

  .lt-num {
    text-align: center;
    min-width: 64px;
    color: rgba(180, 230, 200, 0.80);
  }

  .lt-points {
    color: rgba(80, 220, 140, 0.80);
    font-weight: 600;
  }

  .lt-act-col {
    width: 56px;
    text-align: right;
    white-space: nowrap;
  }
}

.lt-row {
  &:hover {
    background: rgba(0, 40, 22, 0.38);
  }

  &--editing {
    background: rgba(0, 45, 25, 0.55) !important;
  }
}

.lt-totals {
  background: rgba(0, 25, 14, 0.70);

  td {
    font-weight: 600;
    font-size: 12px;
    color: rgba(140, 220, 170, 0.72);
    border-top: 1px solid rgba(60, 140, 90, 0.25);
    border-bottom: none;
  }

  .lt-points {
    color: rgba(80, 240, 150, 0.80);
  }
}

.lt-input {
  background: rgba(0, 55, 30, 0.60);
  border: 1px solid rgba(60, 180, 100, 0.30);
  border-radius: 3px;
  color: rgba(200, 245, 220, 0.92);
  font-size: 12px;
  padding: 3px 6px;
  outline: none;

  &:focus {
    border-color: rgba(60, 210, 110, 0.55);
    background: rgba(0, 65, 35, 0.70);
  }

  &--name {
    width: 140px;
  }

  &--num {
    width: 52px;
    text-align: center;
  }
}

.ledger-table-hint {
  margin-top: 8px;
  font-size: 10px;
  color: rgba(80, 140, 100, 0.38);
  letter-spacing: 0.03em;
}

// ── Species cards ────────────────────────────────────────────────────────────
.species-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.species-card {
  border: 1px solid rgba(40, 100, 60, 0.20);
  border-radius: 6px;
  background: rgba(0, 18, 10, 0.50);
  overflow: hidden;
  transition: border-color 0.2s ease;

  &--open {
    border-color: rgba(60, 180, 100, 0.35);
    background: rgba(0, 25, 14, 0.65);
  }
}

.species-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  gap: 12px;

  &:hover {
    background: rgba(0, 35, 18, 0.45);
  }
}

.species-card-names {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.sp-local {
  font-size: 13px;
  font-weight: 600;
  color: rgba(160, 240, 180, 0.88);
}

.sp-swahili {
  font-size: 12px;
  color: rgba(120, 200, 150, 0.55);
}

.sp-scientific {
  font-size: 11px;
  font-style: italic;
  color: rgba(100, 170, 130, 0.45);
}

.species-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sp-status {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  border-radius: 3px;
  padding: 2px 7px;
  text-transform: uppercase;

  &--common      { background: rgba(40, 160, 80, 0.18);  color: rgba(80, 220, 120, 0.80); }
  &--occasional  { background: rgba(20, 140, 160, 0.18); color: rgba(60, 200, 200, 0.75); }
  &--rare        { background: rgba(160, 140, 20, 0.18); color: rgba(230, 200, 60, 0.80); }
  &--threatened  { background: rgba(200, 80, 20, 0.18);  color: rgba(255, 130, 60, 0.80); }
  &--invasive    { background: rgba(180, 20, 20, 0.18);  color: rgba(240, 80, 80, 0.80); }
}

.species-card-role {
  padding: 0 14px 10px;
  font-size: 11px;
  color: rgba(130, 190, 150, 0.52);
  line-height: 1.5;
}

.species-card-body {
  padding: 14px 14px 10px;
  border-top: 1px solid rgba(40, 100, 60, 0.18);
}

.sp-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.sp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--full {
    grid-column: 1 / -1;
  }
}

.sp-label {
  font-size: 10px;
  color: rgba(100, 180, 130, 0.55);
  line-height: 1.3;
  display: flex;
  flex-direction: column;

  .sp-label-sw {
    font-style: italic;
    color: rgba(80, 150, 105, 0.45);
    font-size: 10px;
  }
}

.sp-input {
  background: rgba(0, 35, 20, 0.60);
  border: 1px solid rgba(50, 120, 75, 0.28);
  border-radius: 4px;
  color: rgba(200, 240, 215, 0.88);
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;

  &:focus {
    border-color: rgba(60, 200, 100, 0.45);
    background: rgba(0, 45, 25, 0.70);
  }

  &--italic {
    font-style: italic;
  }
}

.sp-textarea {
  resize: vertical;
  min-height: 52px;
  line-height: 1.5;
}

.sp-select {
  appearance: none;
  cursor: pointer;

  option {
    background: #071409;
    color: rgba(200, 240, 215, 0.88);
  }
}

.sp-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(40, 80, 55, 0.18);
}

// ── Empty state ──────────────────────────────────────────────────────────────
.ledger-empty {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: rgba(80, 140, 100, 0.38);
}

// ── Footer ───────────────────────────────────────────────────────────────────
.ledger-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32px 28px 0;
  padding-top: 14px;
  border-top: 1px solid rgba(40, 80, 55, 0.12);
  font-size: 10px;
  color: rgba(80, 130, 100, 0.35);
  letter-spacing: 0.05em;
}

.ledger-footer-saved {
  color: rgba(60, 180, 90, 0.35);
}

// ── Transitions ──────────────────────────────────────────────────────────────
.section-slide-enter-active,
.section-slide-leave-active {
  transition: max-height 0.28s ease, opacity 0.22s ease;
  overflow: hidden;
  max-height: 1200px;
}

.section-slide-enter-from,
.section-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.subcat-slide-enter-active,
.subcat-slide-leave-active {
  transition: max-height 0.22s ease, opacity 0.18s ease;
  overflow: hidden;
  max-height: 800px;
}

.subcat-slide-enter-from,
.subcat-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

// ── Print ────────────────────────────────────────────────────────────────────
@media print {
  .ledger-header-controls,
  .ledger-toolbar .q-btn,
  .lt-act-col { display: none !important; }

  .ledger-page { background: white; color: #111; }
  .ledger-header { background: none; border-bottom: 1px solid #ccc; }
  .ledger-header-title { color: #111; }
  .ledger-header-sub, .ledger-section-sub { color: #555; }
  .ledger-section { border: 1px solid #ccc; background: none; }
  .ledger-section-head { background: #f5f5f5; }
  .ledger-section-title { color: #222; }
  .lt-head-en th { background: #eee; color: #333; }
  .lt-head-sw th { background: #f5f5f5; color: #777; }
  .lt-totals { background: #f0f0f0; }
  .lt-totals td { color: #333; }
  .species-card { border: 1px solid #ddd; background: none; }
  .sp-local { color: #111; }
  .sp-swahili { color: #444; }
  .sp-scientific { color: #666; }
  .species-card-role { color: #555; }
}
</style>
