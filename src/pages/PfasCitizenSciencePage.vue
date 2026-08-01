<template>
  <q-page class="pcs-page">
    <div class="pcs-wrap">

      <div class="pcs-header">
        <div class="pcs-badge">CITIZEN SCIENCE</div>
        <h1 class="pcs-title">PFAS / PFOA Decontamination Research</h1>
        <p class="pcs-sub">
          Real remediation science, public method proposals, and a place to log progress on a
          decontamination project — real or simulated. Simulated projects live in their own
          research-type branch settlement, a parallel instance for practice and study.
          <router-link to="/method-proposals" class="pcs-inline-link">Browse method proposals →</router-link>
        </p>
      </div>

      <div class="pcs-disclaimer">
        <strong>Community-submitted, not certified laboratory results.</strong>
        Data on this page is self-reported by participants, not a certified lab
        analysis — it is not a substitute for professional environmental testing
        or medical advice. If a submitted value concerns you, consult a
        qualified environmental testing service or your local health authority
        rather than acting on it directly.
      </div>

      <div class="pcs-tabs">
        <button class="pcs-tab" :class="{ 'pcs-tab--active': tab === 'browse' }" @click="tab = 'browse'">Browse Projects</button>
        <button class="pcs-tab" :class="{ 'pcs-tab--active': tab === 'library' }" @click="tab = 'library'">Methods Library</button>
        <button class="pcs-tab" :class="{ 'pcs-tab--active': tab === 'start' }" @click="tab = 'start'">Start a Project</button>
      </div>

      <!-- ── Browse ────────────────────────────────────────────────────── -->
      <div v-if="tab === 'browse'" class="pcs-section">
        <div v-if="!selectedProject">
          <div v-for="area in store.focusAreas" :key="area.id" class="pcs-area">
            <div class="pcs-area__head">
              <span class="pcs-area__name">{{ area.name }}</span>
              <span class="pcs-area__badge" :class="{ 'pcs-area__badge--sim': area.is_simulated }">
                {{ area.is_simulated ? 'SIMULATED' : 'REAL SITE' }}
              </span>
              <span class="pcs-area__type">{{ area.contamination_type }}</span>
            </div>
            <p v-if="area.description" class="pcs-p">{{ area.description }}</p>
            <div class="pcs-project-list">
              <button v-for="p in projectsFor(area.id)" :key="p.id" class="pcs-project-chip" @click="openProject(p)">
                {{ p.title }} <span class="pcs-project-status" :class="`pcs-project-status--${p.status}`">{{ p.status }}</span>
              </button>
            </div>
            <button class="pcs-dispute" @click="disputeListing(area)">
              Dispute this listing
            </button>
          </div>
          <p v-if="!store.focusAreas.length" class="pcs-p pcs-p--dim">No focus areas yet — start one from the "Start a Project" tab.</p>
        </div>

        <!-- Project detail -->
        <div v-else class="pcs-detail">
          <button class="pcs-back" @click="selectedProject = null">← Back to list</button>
          <h2 class="pcs-h2">{{ selectedProject.title }}</h2>
          <div class="pcs-detail__meta">
            Status: <strong>{{ selectedProject.status }}</strong>
            <span v-if="selectedProject.branch_settlement_id"> · simulated branch project</span>
          </div>

          <div class="pcs-progress">
            <div class="pcs-progress__label">
              <span>Logging streak</span>
              <span>{{ currentStreakWeeks }} / {{ streakTarget }} weeks</span>
            </div>
            <div class="pcs-progress__track">
              <div class="pcs-progress__fill" :style="{ width: Math.min(100, currentStreakWeeks / streakTarget * 100) + '%' }" />
            </div>
          </div>

          <form v-if="member.isSignedIn" class="pcs-form" @submit.prevent="submitLog">
            <textarea v-model="logNotes" class="pcs-textarea" placeholder="What did you do / observe? (e.g. 'Installed GAC filter stage 1, sampled inflow')" rows="3" />
            <input v-model.number="logConcentration" type="number" step="0.1" class="pcs-input" placeholder="Concentration (ppt), optional" style="max-width:200px" />
            <button type="submit" class="pcs-btn" :disabled="!logNotes.trim() || loggingSubmit">Log progress</button>
          </form>

          <div class="pcs-log-list">
            <div v-for="entry in entriesFor(selectedProject.id)" :key="entry.id" class="pcs-log-row">
              <span class="pcs-log-date">{{ new Date(entry.logged_at).toLocaleDateString() }}</span>
              <span class="pcs-log-notes">{{ entry.notes }}</span>
              <span v-if="entry.metrics.concentration_ppt != null" class="pcs-log-metric">{{ entry.metrics.concentration_ppt }} ppt</span>
            </div>
            <p v-if="!entriesFor(selectedProject.id).length" class="pcs-p pcs-p--dim">No progress logged yet.</p>
          </div>

          <div class="pcs-attach">
            <div class="pcs-h2" style="font-size:12.5px">Attach a site marker to my settlement</div>
            <template v-if="settlements.length">
              <div class="pcs-form">
                <select v-model="attachSettlementKey" class="pcs-input">
                  <option value="" disabled>Choose a settlement…</option>
                  <option v-for="s in settlements" :key="s.key" :value="s.key">{{ s.displayName }}</option>
                </select>
                <button class="pcs-btn" :disabled="!attachSettlementKey" @click="attachMarker">Attach marker</button>
              </div>
              <p v-if="markerJustAttached" class="pcs-p pcs-p--dim">Marker attached — visible next time you enter that dome.</p>
            </template>
            <p v-else class="pcs-p pcs-p--dim">Start a settlement first to attach a decon-site marker to your dome.</p>
          </div>
        </div>
      </div>

      <!-- ── Methods Library ──────────────────────────────────────────────── -->
      <div v-if="tab === 'library'" class="pcs-section">
        <p class="pcs-p">
          Curated reference on real remediation methods — the precedent a method proposal's
          arguments should draw from. Marked honestly: established methods vs. emerging ones still
          being proven out.
        </p>
        <div v-for="m in REMEDIATION_METHODS" :key="m.key" class="pcs-method">
          <div class="pcs-method__head">
            <span class="pcs-method__name">{{ m.name }}</span>
            <span class="pcs-method__maturity" :class="`pcs-method__maturity--${m.maturity}`">{{ m.maturity }}</span>
            <span class="pcs-method__media">{{ m.media }}</span>
          </div>
          <p class="pcs-p">{{ m.mechanism }}</p>
          <p class="pcs-p pcs-p--dim"><strong>Chain length:</strong> {{ m.chainLengthNote }}</p>
          <p class="pcs-p pcs-p--dim"><strong>Cost:</strong> {{ m.costNote }}</p>
          <p class="pcs-p pcs-p--dim"><strong>Limitations:</strong> {{ m.limitations }}</p>
          <div class="pcs-citations">
            <span v-for="c in m.citations" :key="c.title" class="pcs-citation">{{ c.title }} — {{ c.org }}</span>
          </div>
        </div>

        <h2 class="pcs-h2" style="margin-top:24px">Keeping Sampling Costs Low — Without Losing Credibility</h2>
        <p class="pcs-p">
          PFAS has no validated cheap field test the way chlorine or pH does — reliable detection
          needs lab-based LC-MS/MS. A "not certified, ~$40" product is usually one of two very
          different things, and it matters which:
        </p>
        <div v-for="t in SAMPLING_COST_TIERS" :key="t.tier" class="pcs-tier">
          <div class="pcs-tier__head">
            <span class="pcs-tier__name">{{ t.tier }}</span>
            <span class="pcs-tier__cost">{{ t.costRange }}</span>
          </div>
          <p class="pcs-p">{{ t.whatItIs }}</p>
          <p class="pcs-p pcs-p--dim"><strong>Can support:</strong> {{ t.whatItCanSupport }}</p>
          <p class="pcs-p pcs-p--dim"><strong>Caveat:</strong> {{ t.caveat }}</p>
        </div>
        <p class="pcs-p" style="margin-top:8px"><strong>Lowering real cost:</strong> {{ POOLED_SAMPLING_NOTE }}</p>

        <h2 class="pcs-h2" style="margin-top:24px">Regulatory Context — What "Actionable" Actually Means</h2>
        <p class="pcs-p">
          US-specific, since concentration entries in this tool are logged in ppt. This is a live,
          currently-shifting regulatory picture, not a settled fact — each item below is dated and
          should be re-verified, not assumed current.
        </p>
        <div v-for="r in REGULATORY_CONTEXT" :key="r.title" class="pcs-reg">
          <div class="pcs-reg__head">
            <span class="pcs-reg__title">{{ r.title }}</span>
            <span class="pcs-reg__status" :class="`pcs-reg__status--${r.status}`">{{ r.status.replace('-', ' ') }}</span>
          </div>
          <p class="pcs-p">{{ r.body }}</p>
          <p class="pcs-p pcs-p--dim">Verified as of {{ r.asOf }}</p>
        </div>

        <h2 class="pcs-h2" style="margin-top:24px">Personal Safety in the Field</h2>
        <p class="pcs-p">
          Separate from the legal/evidentiary guidance below: how to avoid exposing or
          contaminating yourself while you sample. General field-safety practice, not a
          site-specific risk assessment — see the last item for what that would actually require.
        </p>
        <div v-for="g in FIELD_SAFETY_GUIDANCE" :key="g.title" class="pcs-guidance">
          <div class="pcs-guidance__title">{{ g.title }}</div>
          <p class="pcs-p">{{ g.body }}</p>
        </div>

        <h2 class="pcs-h2" style="margin-top:24px">Legal &amp; Chain of Custody</h2>
        <div v-for="g in LEGAL_SAMPLING_GUIDANCE" :key="g.title" class="pcs-guidance">
          <div class="pcs-guidance__title">{{ g.title }}</div>
          <p class="pcs-p">{{ g.body }}</p>
        </div>
      </div>

      <!-- ── Start a Project ──────────────────────────────────────────────── -->
      <div v-if="tab === 'start'" class="pcs-section">
        <div v-if="!member.isSignedIn" class="pcs-signin-gate">
          <p class="pcs-p">Sign in to start a focus area or project.</p>
          <MemberSignIn />
        </div>
        <template v-else>
          <h2 class="pcs-h2">1. Focus area</h2>
          <form class="pcs-form" @submit.prevent="submitFocusArea">
            <input v-model="faName" class="pcs-input" placeholder="Site name (e.g. 'Riverside compost facility')" />
            <input v-model="faDescription" class="pcs-input pcs-input--wide" placeholder="Short description" />
            <input v-model="faBaseAddress" class="pcs-input" placeholder="Exolocation address (optional)" />
            <label class="pcs-checkbox"><input v-model="faSimulated" type="checkbox" /> Simulated / practice site</label>

            <!-- Real-site field-safety waiver — only shown once "simulated" is
                 unchecked, i.e. this is about to become a real physical site. -->
            <div v-if="!faSimulated" class="pcs-waiver">
              I understand this is a real site, that field data collection carries
              inherent physical risk, and that Exotopia does not supervise or
              guarantee the safety of any site — I'm responsible for my own safety
              and compliance with local law while collecting data here.
              <button type="button" class="pcs-inline-link" style="display:block;margin-top:4px" @click="tab = 'library'">
                Read Personal Safety in the Field before your first visit →
              </button>
              <label class="pcs-checkbox" style="margin-top:6px">
                <input v-model="fieldWaiverAccepted" type="checkbox" /> I accept this
              </label>
            </div>

            <button type="submit" class="pcs-btn"
              :disabled="!faName.trim() || (!faSimulated && !fieldWaiverAccepted)">Create focus area</button>
          </form>

          <h2 class="pcs-h2" style="margin-top:24px">2. Project</h2>
          <form class="pcs-form" @submit.prevent="submitProject">
            <select v-model="projFocusAreaId" class="pcs-input">
              <option value="" disabled>Choose a focus area…</option>
              <option v-for="a in store.focusAreas" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
            <input v-model="projTitle" class="pcs-input pcs-input--wide" placeholder="Project title" />
            <label class="pcs-checkbox"><input v-model="projSimulated" type="checkbox" /> Simulated (creates a research branch settlement)</label>
            <button type="submit" class="pcs-btn" :disabled="!projFocusAreaId || !projTitle.trim()">Create project</button>
          </form>
        </template>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { usePfasCitizenScienceStore, type DeconProject, type FocusArea } from 'src/stores/pfas-citizen-science'
import { REMEDIATION_METHODS, LEGAL_SAMPLING_GUIDANCE, FIELD_SAFETY_GUIDANCE, SAMPLING_COST_TIERS, POOLED_SAMPLING_NOTE, REGULATORY_CONTEXT } from 'src/data/pfas-methods-library'
import { LOGGING_STREAK_THRESHOLD_WEEKS } from 'src/data/rewards-catalog'
import { useLoggingStreak } from 'src/composables/useLoggingStreak'
import { useSettlements } from 'src/lib/settlements'
import { useSettlementItems } from 'src/lib/settlement-items'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member = useMemberStore()
const store  = usePfasCitizenScienceStore()

const tab = ref<'browse' | 'library' | 'start'>('browse')

onMounted(() => {
  void store.loadFocusAreas()
  void store.loadProjects()
})

// Correction-request path for named sites — see RISK_REDUCTION_RECOMMENDATIONS.md
// §5. Data here is self-reported (see the standing disclaimer above), so a
// named site/brand needs a real due-process step to dispute a report. This
// opens the project's public issue tracker rather than silently accepting
// or rejecting the dispute client-side.
function disputeListing(_area: FocusArea) {
  window.open('https://github.com/biomassives/vercel-html-exotopia.org/issues', '_blank', 'noopener')
}

function projectsFor(focusAreaId: string): DeconProject[] {
  return store.projects.filter(p => p.focus_area_id === focusAreaId)
}
function entriesFor(projectId: string) {
  return store.logEntries.filter(e => e.project_id === projectId)
}

// ── Project detail ───────────────────────────────────────────────────────────

const selectedProject = ref<DeconProject | null>(null)
const streakTarget = LOGGING_STREAK_THRESHOLD_WEEKS

async function openProject(p: DeconProject) {
  selectedProject.value = p
  await store.loadProjectLogEntries(p.id)
}

const myLogEntries = computed(() => {
  if (!selectedProject.value || !member.userId) return []
  return entriesFor(selectedProject.value.id).filter(e => e.author_id === member.userId)
})
const { currentStreakWeeks } = useLoggingStreak(myLogEntries)

const logNotes = ref('')
const logConcentration = ref<number | null>(null)
const loggingSubmit = ref(false)

async function submitLog() {
  if (!selectedProject.value || !logNotes.value.trim()) return
  loggingSubmit.value = true
  const metrics: Record<string, unknown> = {}
  if (logConcentration.value != null) metrics.concentration_ppt = logConcentration.value
  await store.logProgress(selectedProject.value.id, logNotes.value, metrics)
  await store.loadProjectLogEntries(selectedProject.value.id)
  logNotes.value = ''; logConcentration.value = null
  loggingSubmit.value = false
}

// ── Attach a decon-site marker to one of my settlements ───────────────────────
// A direct settlement-items.ts addItem() call — distinct from the reward-catalog
// unlockable-object gate on SettlementRecord.objects[] used by RewardsPage.vue's
// Impact Profile picker.

const { settlements } = useSettlements()
const attachSettlementKey = ref('')
const { addItem: addSettlementItem } = useSettlementItems(attachSettlementKey)
const markerJustAttached = ref(false)

function statusMarkerColor(status: DeconProject['status']): string {
  if (status === 'monitoring') return '#00e5ff'
  if (status === 'complete')   return '#55e88a'
  return '#ffaa33'   // planning / active
}

function attachMarker() {
  if (!selectedProject.value || !attachSettlementKey.value) return
  const area = store.focusAreas.find(a => a.id === selectedProject.value?.focus_area_id)
  addSettlementItem({
    type:       'eco-ops',
    meshPreset: 'decon-site-marker',
    zone:       'water-edge',
    color:      statusMarkerColor(selectedProject.value.status),
    community:  area?.name ?? selectedProject.value.title,
  })
  markerJustAttached.value = true
}

// ── Start a project ──────────────────────────────────────────────────────────

const faName = ref('')
const faDescription = ref('')
const faBaseAddress = ref('')
const faSimulated = ref(true)
const fieldWaiverAccepted = ref(false)

// Logged the same way as MintPage.vue's mint-disclaimer acceptance — see
// RISK_REDUCTION_RECOMMENDATIONS.md §3/§7. Only fires for real (non-simulated)
// sites, since that's the only case with actual field-safety exposure.
function logFieldWaiverAcceptance(siteName: string) {
  try {
    const key = 'exo.field-waiver-log'
    const log = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
    log.push({ siteName, acceptedAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(log))
  } catch { /* private mode / quota */ }
}

async function submitFocusArea() {
  if (!faName.value.trim()) return
  if (!faSimulated.value) {
    if (!fieldWaiverAccepted.value) return
    logFieldWaiverAcceptance(faName.value)
  }
  await store.createFocusArea({
    name: faName.value, description: faDescription.value || undefined,
    baseAddress: faBaseAddress.value || undefined, isSimulated: faSimulated.value,
  })
  faName.value = ''; faDescription.value = ''; faBaseAddress.value = ''
  fieldWaiverAccepted.value = false
}

const projFocusAreaId = ref('')
const projTitle = ref('')
const projSimulated = ref(true)

async function submitProject() {
  if (!projFocusAreaId.value || !projTitle.value.trim()) return
  const area = store.focusAreas.find(a => a.id === projFocusAreaId.value)
  await store.createProject({
    focusAreaId: projFocusAreaId.value, title: projTitle.value, simulated: projSimulated.value,
    baseAddress: area?.base_address ?? undefined,
  })
  projTitle.value = ''
  tab.value = 'browse'
}
</script>

<style scoped>
.pcs-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.pcs-wrap { max-width: 760px; margin: 0 auto; }

/* Clears RecordWidget.vue's mobile FAB (fixed at bottom:88px + 44px tall) so
   it doesn't sit on top of the last form field/button on a tall page. */
@media (max-width: 640px) {
  .pcs-page { padding-bottom: 160px; }
}

.pcs-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.60); margin-bottom: 8px; }
.pcs-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.pcs-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 24px; }
.pcs-inline-link {
  color: rgba(0,210,255,0.85); text-decoration: underline;
  background: none; border: none; padding: 0; font: inherit; cursor: pointer; text-align: left;
}

.pcs-disclaimer {
  font-size: 10px; line-height: 1.6; color: rgba(255,195,120,0.80);
  background: rgba(255,150,40,0.08); border: 1px solid rgba(255,150,40,0.22);
  border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;
}
.pcs-disclaimer strong { color: rgba(255,205,140,0.95); }

.pcs-tabs { display: flex; gap: 6px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.pcs-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: rgba(160,190,215,0.60); font-family: inherit; font-size: 11px; padding: 8px 4px; cursor: pointer;
  margin-right: 16px;
}
.pcs-tab:hover { color: rgba(0,210,255,0.80); }
.pcs-tab--active { color: #00e5ff; border-bottom-color: #00e5ff; }

.pcs-section { margin-bottom: 20px; }
.pcs-h2 { font-size: 14px; font-weight: 600; color: rgba(215,238,255,0.92); margin: 0 0 10px; }
.pcs-p  { font-size: 11.5px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 10px; }
.pcs-p--dim { color: rgba(130,165,190,0.60); font-style: italic; }

.pcs-signin-gate { border: 1px dashed rgba(0,150,210,0.25); border-radius: 6px; padding: 14px 16px; max-width: 420px; }

/* Focus areas / projects */
.pcs-area { background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.pcs-area__head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.pcs-area__name { font-size: 13px; font-weight: 600; color: rgba(215,238,255,0.92); }
.pcs-area__badge { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; background: rgba(255,170,50,0.15); color: rgba(255,190,80,0.85); }
.pcs-area__badge--sim { background: rgba(140,120,255,0.15); color: rgba(180,150,255,0.85); }
.pcs-area__type { font-size: 9px; color: rgba(120,170,205,0.55); }

.pcs-project-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.pcs-project-chip {
  background: rgba(0,80,120,0.18); border: 1px solid rgba(0,180,220,0.25); border-radius: 4px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 6px 10px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.pcs-project-chip:hover { background: rgba(0,180,220,0.20); }
.pcs-project-status { font-size: 8px; padding: 1px 5px; border-radius: 3px; background: rgba(255,255,255,0.08); }
.pcs-project-status--active { color: #00e5ff; }
.pcs-project-status--complete { color: #55e88a; }
.pcs-project-status--monitoring { color: #ffcc66; }

.pcs-dispute {
  background: none; border: none; color: rgba(150,180,205,0.50);
  font-family: inherit; font-size: 9px; text-decoration: underline;
  cursor: pointer; padding: 8px 0 0; display: block;
}
.pcs-dispute:hover { color: rgba(255,195,120,0.80); }

/* Project detail */
.pcs-back { background: none; border: none; color: rgba(0,190,230,0.65); font-family: inherit; font-size: 10px; cursor: pointer; padding: 0; margin-bottom: 12px; }
.pcs-back:hover { text-decoration: underline; }
.pcs-detail__meta { font-size: 10.5px; color: rgba(150,180,205,0.65); margin-bottom: 14px; }

.pcs-progress { margin-bottom: 16px; max-width: 340px; }
.pcs-progress__label { display: flex; justify-content: space-between; font-size: 9.5px; color: rgba(150,180,205,0.65); margin-bottom: 5px; }
.pcs-progress__track { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; }
.pcs-progress__fill { height: 100%; border-radius: 3px; background: rgba(255,204,68,0.75); transition: width 0.3s ease; }

.pcs-log-list { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.pcs-log-row { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(100,140,200,0.06); font-size: 10px; }
.pcs-log-date { color: rgba(120,170,205,0.55); min-width: 80px; }
.pcs-log-notes { flex: 1; color: rgba(190,215,235,0.85); }
.pcs-log-metric { color: rgba(80,230,130,0.80); }

.pcs-attach { margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }

/* Methods library */
.pcs-method { background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 12px; }

.pcs-tier { background: rgba(0,8,22,0.45); border-left: 3px solid rgba(255,204,68,0.45); border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 10px; }
.pcs-tier__head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.pcs-tier__name { font-size: 12px; font-weight: 600; color: rgba(215,238,255,0.92); }
.pcs-tier__cost { font-size: 10px; color: rgba(255,204,68,0.80); font-weight: 600; }
.pcs-method__head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.pcs-method__name { font-size: 12.5px; font-weight: 600; color: rgba(215,238,255,0.92); }
.pcs-method__maturity { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; }
.pcs-method__maturity--established { background: rgba(80,230,130,0.15); color: rgba(100,240,150,0.85); }
.pcs-method__maturity--emerging    { background: rgba(255,180,60,0.15); color: rgba(255,195,90,0.85); }
.pcs-method__media { font-size: 9px; color: rgba(120,170,205,0.55); }
.pcs-citations { display: flex; flex-direction: column; gap: 3px; margin-top: 8px; }
.pcs-citation { font-size: 9px; color: rgba(120,170,205,0.55); }

.pcs-reg { background: rgba(0,8,22,0.45); border-left: 3px solid rgba(0,190,230,0.35); border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 10px; }
.pcs-reg__head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.pcs-reg__title { font-size: 12px; font-weight: 600; color: rgba(215,238,255,0.92); }
.pcs-reg__status { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
.pcs-reg__status--enforceable { background: rgba(80,230,130,0.15); color: rgba(100,240,150,0.85); }
.pcs-reg__status--proposed-change { background: rgba(255,180,60,0.15); color: rgba(255,195,90,0.85); }
.pcs-reg__status--rescission-proposed { background: rgba(255,90,90,0.15); color: rgba(255,140,140,0.85); }

.pcs-guidance { margin-bottom: 12px; }
.pcs-guidance__title { font-size: 11.5px; font-weight: 600; color: rgba(210,235,255,0.90); margin-bottom: 4px; }

/* Forms */
.pcs-form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
.pcs-input, .pcs-textarea {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px;
}
.pcs-textarea { width: 100%; resize: vertical; }
.pcs-input--wide { flex: 1; min-width: 200px; }
.pcs-checkbox { font-size: 10.5px; color: rgba(175,205,228,0.85); display: flex; align-items: center; gap: 6px; }
.pcs-waiver {
  width: 100%; font-size: 10px; line-height: 1.6; color: rgba(255,195,120,0.80);
  background: rgba(255,150,40,0.08); border: 1px solid rgba(255,150,40,0.22);
  border-radius: 6px; padding: 10px 14px;
}
.pcs-btn {
  background: rgba(0,40,80,0.55); border: 1px solid rgba(0,160,220,0.35); border-radius: 5px;
  color: rgba(200,235,255,0.90); font-family: inherit; font-size: 10.5px; padding: 8px 16px; cursor: pointer;
}
.pcs-btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.pcs-btn:disabled { opacity: 0.4; cursor: default; }
</style>
