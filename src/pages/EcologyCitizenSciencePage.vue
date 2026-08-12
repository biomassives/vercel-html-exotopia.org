<template>
  <q-page class="ecs-page">
    <div class="ecs-wrap">

      <div class="ecs-header">
        <div class="ecs-badge">CITIZEN SCIENCE</div>
        <h1 class="ecs-title">Ecology &amp; Biodiversity Field Work</h1>
        <p class="ecs-sub">
          Forest gardens, rain gardens, bird blinds, and biodiversity surveys — real or simulated.
          Simulated projects live in their own research-type branch settlement, a parallel instance
          for practice and study, same as the PFAS decontamination tool.
          <router-link to="/pfas-citizen-science" class="ecs-inline-link">PFAS decontamination tool →</router-link>
        </p>
      </div>

      <div class="ecs-disclaimer">
        <strong>Community-submitted, not a certified survey.</strong>
        Data on this page is self-reported by participants. Endangered-language or oral-history
        content belongs in the separate, consent-gated
        <router-link to="/knowledge-keepers" class="ecs-inline-link">Knowledge Keepers</router-link>
        path, not here.
      </div>

      <div class="ecs-tabs">
        <button class="ecs-tab" :class="{ 'ecs-tab--active': tab === 'browse' }" @click="tab = 'browse'">Browse Sites</button>
        <button class="ecs-tab" :class="{ 'ecs-tab--active': tab === 'guide' }" @click="tab = 'guide'">Field Guide</button>
        <button class="ecs-tab" :class="{ 'ecs-tab--active': tab === 'start' }" @click="tab = 'start'">Start a Site</button>
      </div>

      <!-- ── Browse ────────────────────────────────────────────────────── -->
      <div v-if="tab === 'browse'" class="ecs-section">
        <div v-if="!selectedSite">
          <div v-for="site in store.sites" :key="site.id" class="ecs-area">
            <div class="ecs-area__head">
              <span class="ecs-area__name">{{ site.name }}</span>
              <span class="ecs-area__badge" :class="{ 'ecs-area__badge--sim': site.is_simulated }">
                {{ site.is_simulated ? 'SIMULATED' : 'REAL SITE' }}
              </span>
              <span class="ecs-area__access" :class="`ecs-area__access--${site.access_status}`">{{ accessLabel(site.access_status) }}</span>
            </div>
            <p v-if="site.description" class="ecs-p">{{ site.description }}</p>
            <div class="ecs-project-list">
              <button v-for="p in projectsFor(site.id)" :key="p.id" class="ecs-project-chip" @click="openSite(site); openProject(p)">
                {{ p.title }} <span class="ecs-project-status" :class="`ecs-project-status--${p.status}`">{{ p.status }}</span>
              </button>
            </div>
            <button class="ecs-back" style="margin-top:8px" @click="openSite(site)">Open site →</button>
          </div>
          <p v-if="!store.sites.length" class="ecs-p ecs-p--dim">No sites yet — start one from the "Start a Site" tab.</p>
        </div>

        <!-- Site detail -->
        <div v-else class="ecs-detail">
          <button class="ecs-back" @click="selectedSite = null; selectedProject = null">← Back to list</button>
          <h2 class="ecs-h2">{{ selectedSite.name }}</h2>
          <div class="ecs-detail__meta">
            {{ selectedSite.is_simulated ? 'Simulated / practice site' : 'Real site' }}
            <span v-if="selectedSite.habitat_type"> · {{ selectedSite.habitat_type }}</span>
          </div>

          <!-- Access pipeline -->
          <div class="ecs-access">
            <div class="ecs-h2" style="font-size:12.5px">Securing this site</div>
            <div class="ecs-access__steps">
              <span v-for="s in ACCESS_STEPS" :key="s" class="ecs-access__step"
                :class="{ 'ecs-access__step--done': accessStepIndex(selectedSite.access_status) >= ACCESS_STEPS.indexOf(s) }">
                {{ accessLabel(s) }}
              </span>
            </div>
            <textarea v-model="contactNoteDraft" class="ecs-textarea" rows="2"
              placeholder="Contact / outreach notes (who you reached out to, what they said)" />
            <div class="ecs-access__actions">
              <button v-if="selectedSite.access_status === 'unresearched'" class="ecs-btn ecs-btn--sm"
                @click="advanceAccess('map_research_done')">Mark map research done</button>
              <button v-if="selectedSite.access_status === 'map_research_done'" class="ecs-btn ecs-btn--sm"
                @click="advanceAccess('inquiry_sent')">Log letter of inquiry sent</button>
              <button v-if="['map_research_done','inquiry_sent'].includes(selectedSite.access_status)" class="ecs-btn ecs-btn--sm"
                @click="advanceAccess('access_confirmed')">Mark access confirmed</button>
              <button v-if="selectedSite.access_status === 'unresearched'" class="ecs-btn ecs-btn--sm ecs-btn--ghost"
                @click="advanceAccess('not_required')">Mark access not required</button>
            </div>
            <p v-if="selectedSite.access_status === 'unresearched'" class="ecs-p ecs-p--dim">
              New to this? See the <button class="ecs-inline-link" @click="tab = 'guide'">Field Guide</button>
              for the map research steps and a letter-of-inquiry generator before reaching out.
            </p>
          </div>

          <!-- Projects at this site -->
          <div v-if="!selectedProject">
            <h3 class="ecs-h3">Projects at this site</h3>
            <div class="ecs-project-list">
              <button v-for="p in projectsFor(selectedSite.id)" :key="p.id" class="ecs-project-chip" @click="openProject(p)">
                {{ p.title }} <span class="ecs-project-status" :class="`ecs-project-status--${p.status}`">{{ p.status }}</span>
              </button>
            </div>
            <p v-if="!projectsFor(selectedSite.id).length" class="ecs-p ecs-p--dim">No projects yet.</p>

            <form v-if="member.isSignedIn" class="ecs-form" style="margin-top:12px" @submit.prevent="submitProjectAtSite">
              <input v-model="projTitle" class="ecs-input ecs-input--wide" placeholder="Project title" />
              <select v-model="projType" class="ecs-input">
                <option value="biodiversity_survey">Biodiversity survey</option>
                <option value="forest_garden">Forest garden</option>
                <option value="rain_garden">Rain garden</option>
                <option value="bird_blind">Bird blind</option>
                <option value="habitat_restoration">Habitat restoration</option>
                <option value="other">Other</option>
              </select>
              <label class="ecs-checkbox"><input v-model="projSimulated" type="checkbox" /> Simulated (creates a research branch settlement)</label>
              <button type="submit" class="ecs-btn" :disabled="!projTitle.trim()">Create project</button>
            </form>
          </div>

          <!-- Project detail -->
          <div v-else class="ecs-detail">
            <button class="ecs-back" @click="selectedProject = null">← Back to site</button>
            <h3 class="ecs-h3">{{ selectedProject.title }}</h3>
            <div class="ecs-detail__meta">
              {{ selectedProject.project_type.replace('_', ' ') }} · status: <strong>{{ selectedProject.status }}</strong>
              <span v-if="selectedProject.branch_settlement_id"> · simulated branch project</span>
            </div>

            <form v-if="member.isSignedIn" class="ecs-form" @submit.prevent="submitLog">
              <textarea v-model="logNotes" class="ecs-textarea" placeholder="What did you do / observe? (e.g. 'Counted 6 native pollinator species along the east hedgerow')" rows="3" />
              <button type="submit" class="ecs-btn" :disabled="!logNotes.trim() || loggingSubmit">Log progress</button>
            </form>

            <div class="ecs-log-list">
              <div v-for="entry in entriesFor(selectedProject.id)" :key="entry.id" class="ecs-log-row">
                <span class="ecs-log-date">{{ new Date(entry.logged_at).toLocaleDateString() }}</span>
                <span class="ecs-log-notes">{{ entry.notes }}</span>
              </div>
              <p v-if="!entriesFor(selectedProject.id).length" class="ecs-p ecs-p--dim">No progress logged yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Field Guide ───────────────────────────────────────────────────── -->
      <div v-if="tab === 'guide'" class="ecs-section">
        <h2 class="ecs-h2">Map Research Session</h2>
        <p class="ecs-p">The desk-based step before contacting anyone — identify the exact site and who to ask.</p>
        <div v-for="g in MAP_RESEARCH_STEPS" :key="g.title" class="ecs-guidance">
          <div class="ecs-guidance__title">{{ g.title }}</div>
          <p class="ecs-p">{{ g.body }}</p>
        </div>

        <h2 class="ecs-h2" style="margin-top:24px">Site Type → Who to Contact</h2>
        <div v-for="c in SITE_TYPE_CONTACTS" :key="c.siteType" class="ecs-contact">
          <div class="ecs-contact__type">{{ c.siteType }}</div>
          <p class="ecs-p"><strong>Contact:</strong> {{ c.contactPath }}</p>
          <p class="ecs-p ecs-p--dim"><strong>Needed:</strong> {{ c.whatsNeeded }}</p>
        </div>

        <h2 class="ecs-h2" style="margin-top:24px">Draft a Letter of Inquiry</h2>
        <p class="ecs-p">
          First contact, asking — not a formal agreement. Fill in what you found during map research;
          this generates a draft you can send as-is or edit.
        </p>
        <form class="ecs-form" @submit.prevent>
          <input v-model="loi.organizingGroup" class="ecs-input ecs-input--wide" placeholder="Your organizing group name" />
          <input v-model="loi.recipientName" class="ecs-input ecs-input--wide" placeholder="Recipient name (or role, e.g. 'Parks Department')" />
          <input v-model="loi.siteDescription" class="ecs-input ecs-input--wide" placeholder="Site — address or parcel description" />
          <input v-model="loi.proposedActivity" class="ecs-input ecs-input--wide" placeholder="Proposed activity, one sentence" />
          <input v-model="loi.requestedInfo" class="ecs-input ecs-input--wide" placeholder="What you're asking for (access, more info, a meeting)" />
          <input v-model="loi.contactName" class="ecs-input" placeholder="Your name" />
          <input v-model="loi.contactInfo" class="ecs-input" placeholder="Your email or phone" />
        </form>
        <pre v-if="letterDraft" class="ecs-letter">{{ letterDraft }}</pre>

        <h2 class="ecs-h2" style="margin-top:24px">Site Assessment Checklist</h2>
        <ul class="ecs-checklist">
          <li v-for="item in SITE_ASSESSMENT_CHECKLIST" :key="item">{{ item }}</li>
        </ul>
      </div>

      <!-- ── Start a Site ──────────────────────────────────────────────────── -->
      <div v-if="tab === 'start'" class="ecs-section">
        <div v-if="!member.isSignedIn" class="ecs-signin-gate">
          <p class="ecs-p">Sign in to start a site.</p>
          <MemberSignIn />
        </div>
        <template v-else>
          <h2 class="ecs-h2">New site</h2>
          <form class="ecs-form" @submit.prevent="submitSite">
            <input v-model="siteName" class="ecs-input" placeholder="Site name (e.g. 'Riverside schoolyard')" />
            <input v-model="siteDescription" class="ecs-input ecs-input--wide" placeholder="Short description" />
            <input v-model="siteHabitatType" class="ecs-input" placeholder="Habitat type (e.g. 'forest', 'wetland', 'schoolyard')" />
            <input v-model="siteBaseAddress" class="ecs-input" placeholder="Exolocation address (optional)" />
            <label class="ecs-checkbox"><input v-model="siteSimulated" type="checkbox" /> Simulated / practice site</label>

            <div v-if="!siteSimulated" class="ecs-waiver">
              I understand this is a real site, that field work carries inherent physical risk, and
              that Exotopia does not supervise or guarantee the safety of any site — I'm responsible
              for my own safety and for securing real access before doing any work there.
              <button type="button" class="ecs-inline-link" style="display:block;margin-top:4px" @click="tab = 'guide'">
                Read the Field Guide before your first visit →
              </button>
              <label class="ecs-checkbox" style="margin-top:6px">
                <input v-model="fieldWaiverAccepted" type="checkbox" /> I accept this
              </label>
            </div>

            <button type="submit" class="ecs-btn"
              :disabled="!siteName.trim() || (!siteSimulated && !fieldWaiverAccepted)">Create site</button>
          </form>
        </template>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import {
  useEcologyCitizenScienceStore, type EcologyProject, type EcologySite,
  type AccessStatus, type EcologyProjectType,
} from 'src/stores/ecology-citizen-science'
import {
  MAP_RESEARCH_STEPS, SITE_TYPE_CONTACTS, SITE_ASSESSMENT_CHECKLIST,
  generateLetterOfInquiry, type LetterOfInquiryInput,
} from 'src/data/ecology-fieldwork-library'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member = useMemberStore()
const store  = useEcologyCitizenScienceStore()

const tab = ref<'browse' | 'guide' | 'start'>('browse')

onMounted(() => {
  void store.loadSites()
  void store.loadProjects()
})

function projectsFor(siteId: string): EcologyProject[] {
  return store.projects.filter(p => p.site_id === siteId)
}
function entriesFor(projectId: string) {
  return store.logEntries.filter(e => e.project_id === projectId)
}

// ── Access pipeline labels/ordering ───────────────────────────────────────

const ACCESS_STEPS: AccessStatus[] = ['unresearched', 'map_research_done', 'inquiry_sent', 'access_confirmed']
function accessLabel(status: AccessStatus): string {
  return {
    unresearched:      'Unresearched',
    map_research_done: 'Map research done',
    inquiry_sent:       'Inquiry sent',
    access_confirmed:   'Access confirmed',
    not_required:        'Access not required',
  }[status]
}
function accessStepIndex(status: AccessStatus): number {
  return status === 'not_required' ? ACCESS_STEPS.length - 1 : ACCESS_STEPS.indexOf(status)
}

// ── Site detail ────────────────────────────────────────────────────────────

const selectedSite    = ref<EcologySite | null>(null)
const selectedProject = ref<EcologyProject | null>(null)
const contactNoteDraft = ref('')

async function openSite(s: EcologySite) {
  selectedSite.value = s
  contactNoteDraft.value = s.contact_note ?? ''
  await store.loadProjects(s.id)
}

async function openProject(p: EcologyProject) {
  selectedProject.value = p
  await store.loadProjectLogEntries(p.id)
}

async function advanceAccess(status: AccessStatus) {
  if (!selectedSite.value) return
  const ok = await store.updateSiteAccessStatus(selectedSite.value.id, status, contactNoteDraft.value || undefined)
  if (ok) selectedSite.value = store.sites.find(s => s.id === selectedSite.value?.id) ?? selectedSite.value
}

const logNotes      = ref('')
const loggingSubmit  = ref(false)

async function submitLog() {
  if (!selectedProject.value || !logNotes.value.trim()) return
  loggingSubmit.value = true
  await store.logProgress(selectedProject.value.id, logNotes.value)
  await store.loadProjectLogEntries(selectedProject.value.id)
  logNotes.value = ''
  loggingSubmit.value = false
}

// ── Project creation (within a site) ────────────────────────────────────────

const projTitle      = ref('')
const projType        = ref<EcologyProjectType>('biodiversity_survey')
const projSimulated   = ref(true)

async function submitProjectAtSite() {
  if (!selectedSite.value || !projTitle.value.trim()) return
  await store.createProject({
    siteId: selectedSite.value.id, title: projTitle.value, projectType: projType.value,
    simulated: projSimulated.value, baseAddress: selectedSite.value.base_address ?? undefined,
  })
  projTitle.value = ''
}

// ── Site creation ────────────────────────────────────────────────────────────

const siteName          = ref('')
const siteDescription    = ref('')
const siteHabitatType    = ref('')
const siteBaseAddress    = ref('')
const siteSimulated      = ref(true)
const fieldWaiverAccepted = ref(false)

async function submitSite() {
  if (!siteName.value.trim()) return
  if (!siteSimulated.value && !fieldWaiverAccepted.value) return
  await store.createSite({
    name: siteName.value, description: siteDescription.value || undefined,
    habitatType: siteHabitatType.value || undefined,
    baseAddress: siteBaseAddress.value || undefined, isSimulated: siteSimulated.value,
  })
  siteName.value = ''; siteDescription.value = ''; siteHabitatType.value = ''; siteBaseAddress.value = ''
  fieldWaiverAccepted.value = false
  tab.value = 'browse'
}

// ── Letter of inquiry generator ─────────────────────────────────────────────

const loi = ref<LetterOfInquiryInput>({
  organizingGroup: '', recipientName: '', siteDescription: '',
  proposedActivity: '', requestedInfo: '', contactName: '', contactInfo: '',
})
const letterDraft = computed(() => {
  if (!loi.value.organizingGroup || !loi.value.recipientName || !loi.value.contactName) return ''
  return generateLetterOfInquiry(loi.value)
})
</script>

<style scoped>
.ecs-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.ecs-wrap { max-width: 760px; margin: 0 auto; }

@media (max-width: 640px) {
  .ecs-page { padding-bottom: 160px; }
}

.ecs-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(120,200,140,0.65); margin-bottom: 8px; }
.ecs-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.ecs-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 24px; }
.ecs-inline-link {
  color: rgba(80,220,140,0.85); text-decoration: underline;
  background: none; border: none; padding: 0; font: inherit; cursor: pointer; text-align: left;
}

.ecs-disclaimer {
  font-size: 10px; line-height: 1.6; color: rgba(180,220,190,0.80);
  background: rgba(60,180,90,0.08); border: 1px solid rgba(60,180,90,0.22);
  border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;
}
.ecs-disclaimer strong { color: rgba(200,235,205,0.95); }

.ecs-tabs { display: flex; gap: 6px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.ecs-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: rgba(160,190,215,0.60); font-family: inherit; font-size: 11px; padding: 8px 4px; cursor: pointer;
  margin-right: 16px;
}
.ecs-tab:hover { color: rgba(80,220,140,0.80); }
.ecs-tab--active { color: #55e88a; border-bottom-color: #55e88a; }

.ecs-h2 { font-size: 15px; font-weight: 400; color: rgba(215,238,255,0.92); margin: 0 0 10px; }
.ecs-h3 { font-size: 12.5px; font-weight: 400; color: rgba(200,225,245,0.85); margin: 16px 0 8px; }
.ecs-p  { font-size: 11.5px; line-height: 1.65; color: rgba(190,210,225,0.85); margin: 0 0 8px; }
.ecs-p--dim { color: rgba(140,165,185,0.65); font-size: 10.5px; }

.ecs-area {
  border: 1px solid rgba(80,220,140,0.16); border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;
  background: rgba(20,40,28,0.35);
}
.ecs-area__head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.ecs-area__name { font-size: 13px; color: rgba(215,238,255,0.94); }
.ecs-area__badge { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; background: rgba(80,220,140,0.16); color: #55e88a; }
.ecs-area__badge--sim { background: rgba(255,180,60,0.16); color: #ffb43c; }
.ecs-area__access { font-size: 8px; letter-spacing: 0.06em; padding: 2px 6px; border-radius: 3px; background: rgba(80,150,220,0.16); color: #7ab8ff; }
.ecs-area__access--access_confirmed, .ecs-area__access--not_required { background: rgba(80,220,140,0.16); color: #55e88a; }

.ecs-project-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.ecs-project-chip {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.10); border-radius: 5px;
  color: rgba(200,225,245,0.85); font-family: inherit; font-size: 10.5px; padding: 5px 10px; cursor: pointer;
}
.ecs-project-chip:hover { border-color: rgba(80,220,140,0.4); }
.ecs-project-status { margin-left: 6px; font-size: 8.5px; opacity: 0.7; }
.ecs-project-status--complete { color: #55e88a; }
.ecs-project-status--monitoring { color: #00e5ff; }

.ecs-back {
  background: none; border: none; color: rgba(80,220,140,0.75); font-family: inherit;
  font-size: 10.5px; cursor: pointer; padding: 0; margin-bottom: 12px; display: block;
}

.ecs-detail__meta { font-size: 10.5px; color: rgba(150,180,200,0.70); margin-bottom: 14px; }

.ecs-access { border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 14px; margin: 14px 0; background: rgba(0,0,0,0.2); }
.ecs-access__steps { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.ecs-access__step { font-size: 9px; padding: 3px 8px; border-radius: 3px; background: rgba(255,255,255,0.06); color: rgba(150,175,195,0.6); }
.ecs-access__step--done { background: rgba(80,220,140,0.18); color: #55e88a; }
.ecs-access__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }

.ecs-form { display: flex; flex-direction: column; gap: 8px; max-width: 420px; }
.ecs-input, .ecs-textarea {
  background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.14); border-radius: 5px;
  color: rgba(215,235,250,0.92); font-family: inherit; font-size: 11.5px; padding: 8px 10px;
}
.ecs-input--wide { max-width: none; }
.ecs-textarea { resize: vertical; }
.ecs-checkbox { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: rgba(180,205,220,0.8); }
.ecs-btn {
  background: rgba(80,220,140,0.16); border: 1px solid rgba(80,220,140,0.4); border-radius: 5px;
  color: #55e88a; font-family: inherit; font-size: 11px; padding: 8px 14px; cursor: pointer; align-self: flex-start;
}
.ecs-btn:disabled { opacity: 0.35; cursor: default; }
.ecs-btn--sm { padding: 5px 10px; font-size: 10px; }
.ecs-btn--ghost { background: none; color: rgba(150,180,200,0.7); border-color: rgba(255,255,255,0.14); }

.ecs-waiver {
  font-size: 10px; line-height: 1.6; color: rgba(255,195,120,0.80);
  background: rgba(255,150,40,0.08); border: 1px solid rgba(255,150,40,0.22);
  border-radius: 6px; padding: 10px 12px;
}

.ecs-log-list { margin-top: 14px; }
.ecs-log-row { display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 10.5px; }
.ecs-log-date { color: rgba(140,165,185,0.6); flex-shrink: 0; }
.ecs-log-notes { color: rgba(200,220,235,0.85); }

.ecs-guidance { margin-bottom: 14px; }
.ecs-guidance__title { font-size: 11.5px; color: rgba(80,220,140,0.85); margin-bottom: 3px; }

.ecs-contact { border-left: 2px solid rgba(80,220,140,0.3); padding-left: 12px; margin-bottom: 14px; }
.ecs-contact__type { font-size: 12px; color: rgba(215,238,255,0.92); margin-bottom: 4px; }

.ecs-letter {
  white-space: pre-wrap; font-family: inherit; font-size: 10.5px; line-height: 1.6;
  background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.10); border-radius: 6px;
  padding: 14px; margin: 10px 0 20px; color: rgba(210,230,240,0.88);
}

.ecs-checklist { font-size: 11px; line-height: 1.9; color: rgba(190,210,225,0.85); padding-left: 20px; }

.ecs-signin-gate { padding: 20px 0; }
</style>
