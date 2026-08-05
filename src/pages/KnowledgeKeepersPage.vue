<template>
  <q-page class="kk-page">
    <div class="kk-wrap">

      <div class="kk-header">
        <div class="kk-badge">WISDOM FROM ELDERS</div>
        <h1 class="kk-title">Knowledge Keeper Records</h1>
        <p class="kk-sub">
          An elder who has lived near a site for sixty years has a longitudinal dataset no
          sampling program can replicate. This is where that memory joins the technical
          record — place, plant, animal, season, practice, memory, story.
        </p>
        <router-link to="/galaxy?suggestedFocus=leadership" class="kk-cta"
          @click="setSuggestedFocus('leadership')">
          Coordinating this work? Start a settlement focused on community leadership →
        </router-link>
      </div>

      <div class="kk-notice">
        <strong>This is not the endangered-language documentation protocol.</strong>
        If what you're documenting involves a threatened language and requires
        Free, Prior and Informed Consent from a community governance body, that's a
        separate, more involved process — <a :href="issueUrl" target="_blank" rel="noopener">reach out to the team</a>
        rather than using the form below.
      </div>

      <div class="kk-tabs">
        <button class="kk-tab" :class="{ 'kk-tab--active': tab === 'browse' }" @click="tab = 'browse'">Browse Records</button>
        <button class="kk-tab" :class="{ 'kk-tab--active': tab === 'submit' }" @click="tab = 'submit'">Document a Contribution</button>
      </div>

      <!-- ── Browse ────────────────────────────────────────────────────── -->
      <div v-if="tab === 'browse'" class="kk-section">
        <div v-for="r in store.records" :key="r.id" class="kk-record">
          <div class="kk-record__head">
            <span class="kk-record__keeper">{{ r.keeper_name || 'Anonymous Knowledge Keeper' }}</span>
            <span v-if="r.site_ref" class="kk-record__site">{{ r.site_ref }}</span>
          </div>
          <div class="kk-record__tags">
            <span v-for="t in r.domain_tags" :key="t" class="kk-tag">{{ t }}</span>
          </div>
          <p class="kk-p">{{ r.summary }}</p>
          <p v-if="r.technical_link_note" class="kk-p kk-p--dim"><strong>Links to:</strong> {{ r.technical_link_note }}</p>
          <div class="kk-record__meta">{{ new Date(r.created_at).toLocaleDateString() }}</div>
        </div>
        <p v-if="!store.records.length" class="kk-p kk-p--dim">No records yet — be the first to document a contribution.</p>
      </div>

      <!-- ── Submit ────────────────────────────────────────────────────── -->
      <div v-if="tab === 'submit'" class="kk-section">
        <div v-if="!member.isSignedIn" class="kk-signin-gate">
          <p class="kk-p">Sign in to document a Knowledge Keeper contribution.</p>
          <MemberSignIn />
        </div>
        <template v-else>
          <form class="kk-form" @submit.prevent="submit">
            <div class="kk-field">
              <label class="kk-label">Knowledge Keeper attribution</label>
              <input v-model="keeperName" class="kk-input" placeholder="Full name, first name only, community affiliation, or leave blank for anonymous" />
            </div>

            <div class="kk-field">
              <label class="kk-label">Site (optional)</label>
              <input v-model="siteRef" class="kk-input" placeholder="Exolocation address or site name this connects to" />
            </div>

            <div class="kk-field">
              <label class="kk-label">Domain tags</label>
              <div class="kk-tag-picker">
                <label v-for="t in DOMAIN_TAGS" :key="t" class="kk-tag-check">
                  <input type="checkbox" :value="t" v-model="domainTags" /> {{ t }}
                </label>
              </div>
            </div>

            <div class="kk-field">
              <label class="kk-label">What they shared</label>
              <textarea v-model="summary" class="kk-textarea" rows="5"
                placeholder="Summarize the memory, observation, or knowledge — place names, historical baselines, seasonal timing, species presence, land use history, whatever they wanted recorded." />
            </div>

            <div class="kk-field">
              <label class="kk-label">Links to a technical record (optional)</label>
              <input v-model="technicalLinkNote" class="kk-input" placeholder="e.g. 'Contextualizes the site's Secchi disk record — recalls clear water to 3m in the 1970s'" />
            </div>

            <div class="kk-field">
              <label class="kk-label">Your relationship to this Knowledge Keeper</label>
              <div class="kk-relationship-picker">
                <label v-for="r in RELATIONSHIP_OPTIONS" :key="r.id" class="kk-relationship-option" :class="{ 'kk-relationship-option--selected': relationship === r.id }">
                  <input type="radio" :value="r.id" v-model="relationship" />
                  <div>
                    <div class="kk-relationship-title">{{ r.label }}</div>
                    <div class="kk-relationship-desc">{{ r.desc }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Friend tier: soft client-side nudge, not stored, not a hard gate beyond this checkbox -->
            <div v-if="relationship === 'friend'" class="kk-nudge">
              This publishes right away — just confirm first.
              <label class="kk-checkbox" style="margin-top:6px">
                <input v-model="friendConfirmed" type="checkbox" />
                I've talked with them about sharing this, and about what attribution level they're comfortable with.
              </label>
            </div>

            <!-- Student/researcher tier: required consent note, held for review -->
            <div v-if="relationship === 'student_researcher'" class="kk-field">
              <label class="kk-label">How was consent obtained? <span class="kk-required">(required — this record is held for review, not published immediately)</span></label>
              <textarea v-model="consentNote" class="kk-textarea" rows="3"
                placeholder="Describe how and when you confirmed the Knowledge Keeper was comfortable with this being recorded and shared, and at what attribution level." />
            </div>

            <button type="submit" class="kk-btn" :disabled="!canSubmit || submitting">
              {{ submitting ? 'Submitting…' : (relationship === 'student_researcher' ? 'Submit for review' : 'Publish') }}
            </button>

            <p v-if="justSubmitted" class="kk-confirm">
              {{ relationship === 'student_researcher'
                ? 'Submitted — held for review before it becomes public.'
                : 'Published — thank you for documenting this.' }}
            </p>
          </form>
        </template>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { useKnowledgeKeepersStore, DOMAIN_TAGS, type SubmitterRelationship } from 'src/stores/knowledge-keepers'
import { setSuggestedFocus } from 'src/lib/settlement-focus-intent'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member = useMemberStore()
const store  = useKnowledgeKeepersStore()

const tab = ref<'browse' | 'submit'>('browse')

const issueUrl = 'https://github.com/biomassives/vercel-html-exotopia.org/issues'

onMounted(() => { void store.loadPublished() })

const RELATIONSHIP_OPTIONS: Array<{ id: SubmitterRelationship, label: string, desc: string }> = [
  { id: 'self',               label: "This is my own knowledge or memory",        desc: 'Publishes immediately' },
  { id: 'family',             label: "I'm family of this Knowledge Keeper",       desc: 'Publishes immediately' },
  { id: 'friend',              label: "I know them personally, we can talk directly", desc: 'Publishes immediately, after a quick confirmation prompt' },
  { id: 'student_researcher', label: "I'm a student or researcher documenting this at more of a distance", desc: 'Held for review before publishing' },
]

const keeperName          = ref('')
const siteRef              = ref('')
const domainTags           = ref<string[]>([])
const summary               = ref('')
const technicalLinkNote     = ref('')
const relationship          = ref<SubmitterRelationship | null>(null)
const friendConfirmed       = ref(false)
const consentNote           = ref('')
const submitting            = ref(false)
const justSubmitted         = ref(false)

const canSubmit = computed(() => {
  if (!summary.value.trim() || !relationship.value) return false
  if (relationship.value === 'friend' && !friendConfirmed.value) return false
  if (relationship.value === 'student_researcher' && !consentNote.value.trim()) return false
  return true
})

async function submit() {
  if (!canSubmit.value || !relationship.value) return
  submitting.value = true
  try {
    const result = await store.submitRecord({
      keeperName:         keeperName.value,
      siteRef:             siteRef.value,
      domainTags:          domainTags.value,
      summary:              summary.value,
      technicalLinkNote:    technicalLinkNote.value,
      relationship:         relationship.value,
      consentNote:          consentNote.value,
    })
    if (result) {
      justSubmitted.value = true
      keeperName.value = ''; siteRef.value = ''; domainTags.value = []
      summary.value = ''; technicalLinkNote.value = ''
      relationship.value = null; friendConfirmed.value = false; consentNote.value = ''
      setTimeout(() => { justSubmitted.value = false }, 5000)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.kk-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.kk-wrap { max-width: 760px; margin: 0 auto; }

/* Clears RecordWidget.vue's mobile FAB (fixed at bottom:88px + 44px tall) so
   it doesn't sit on top of the last form field/button on a tall page. */
@media (max-width: 640px) {
  .kk-page { padding-bottom: 160px; }
}

.kk-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(220,175,90,0.65); margin-bottom: 8px; }
.kk-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.kk-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 20px; }
.kk-cta   { display: inline-block; font-size: 11px; color: rgba(0,210,255,0.85); text-decoration: none; margin-bottom: 20px; }
.kk-cta:hover { color: rgba(80,230,255,0.95); }

.kk-notice {
  font-size: 10px; line-height: 1.6; color: rgba(255,195,120,0.80);
  background: rgba(255,150,40,0.08); border: 1px solid rgba(255,150,40,0.22);
  border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;
}
.kk-notice a { color: rgba(0,210,255,0.85); }
.kk-notice strong { color: rgba(255,205,140,0.95); }

.kk-tabs { display: flex; gap: 6px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.kk-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: rgba(160,190,215,0.60); font-family: inherit; font-size: 11px; padding: 8px 4px; cursor: pointer;
  margin-right: 16px;
}
.kk-tab:hover { color: rgba(220,175,90,0.80); }
.kk-tab--active { color: rgba(220,175,90,0.95); border-bottom-color: rgba(220,175,90,0.85); }

.kk-section { margin-bottom: 20px; }
.kk-p  { font-size: 11.5px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 8px; }
.kk-p--dim { color: rgba(130,165,190,0.60); font-style: italic; }

.kk-signin-gate { border: 1px dashed rgba(0,150,210,0.25); border-radius: 6px; padding: 14px 16px; max-width: 420px; }

.kk-record { background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.kk-record__head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.kk-record__keeper { font-size: 13px; font-weight: 600; color: rgba(220,175,90,0.90); }
.kk-record__site { font-size: 9px; color: rgba(120,170,205,0.55); }
.kk-record__tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.kk-tag { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; background: rgba(220,175,90,0.12); color: rgba(220,175,90,0.80); }
.kk-record__meta { font-size: 9px; color: rgba(100,140,170,0.45); margin-top: 8px; }

.kk-form { display: flex; flex-direction: column; gap: 14px; max-width: 560px; }
.kk-field { display: flex; flex-direction: column; gap: 6px; }
.kk-label { font-size: 10px; letter-spacing: 0.08em; color: rgba(160,195,220,0.70); }
.kk-required { color: rgba(255,150,90,0.80); font-weight: normal; letter-spacing: 0; text-transform: none; }
.kk-input, .kk-textarea {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px;
}
.kk-textarea { resize: vertical; }

.kk-tag-picker { display: flex; flex-wrap: wrap; gap: 8px; }
.kk-tag-check { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(175,205,228,0.80); cursor: pointer; }

.kk-relationship-picker { display: flex; flex-direction: column; gap: 6px; }
.kk-relationship-option {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; background: rgba(0,8,16,0.50);
}
.kk-relationship-option--selected { border-color: rgba(220,175,90,0.45); background: rgba(220,175,90,0.06); }
.kk-relationship-option input { margin-top: 3px; }
.kk-relationship-title { font-size: 11px; color: rgba(210,230,250,0.90); }
.kk-relationship-desc { font-size: 9px; color: rgba(130,165,190,0.60); margin-top: 2px; }

.kk-nudge, .kk-checkbox { font-size: 10.5px; color: rgba(175,205,228,0.85); }
.kk-nudge {
  background: rgba(0,140,200,0.08); border: 1px solid rgba(0,140,200,0.22);
  border-radius: 6px; padding: 10px 14px; line-height: 1.6;
}
.kk-checkbox { display: flex; align-items: flex-start; gap: 6px; cursor: pointer; }

.kk-btn {
  align-self: flex-start;
  background: rgba(80,55,10,0.55); border: 1px solid rgba(220,175,90,0.35); border-radius: 5px;
  color: rgba(240,210,150,0.90); font-family: inherit; font-size: 10.5px; padding: 8px 18px; cursor: pointer;
}
.kk-btn:hover:not(:disabled) { border-color: rgba(240,195,110,0.55); }
.kk-btn:disabled { opacity: 0.4; cursor: default; }

.kk-confirm { font-size: 10.5px; color: rgba(100,220,150,0.85); }
</style>
