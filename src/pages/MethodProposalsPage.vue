<template>
  <q-page class="mp-page">
    <div class="mp-wrap">

      <div class="mp-header">
        <div class="mp-badge">PUBLIC METHOD PROPOSALS</div>
        <h1 class="mp-title">Propose a proven cleanup method</h1>
        <p class="mp-sub">
          Publicly readable, no sign-in required. A proposal pairs a specific method with
          precedent citations and an economic and environmental argument for why it fits a real
          or simulated site. Anyone can endorse a proposal they find credible.
          <router-link to="/pfas-citizen-science" class="mp-inline-link">← Back to citizen science</router-link>
        </p>
      </div>

      <div v-if="member.isSignedIn" class="mp-submit">
        <h2 class="mp-h2">Submit a proposal</h2>
        <form class="mp-form" @submit.prevent="submit">
          <input v-model="title" class="mp-input mp-input--wide" placeholder="Title" />
          <textarea v-model="summary" class="mp-textarea" rows="3" placeholder="Summary — what method, applied where, and why" />
          <select v-model="methodKey" class="mp-input">
            <option value="">No specific library method</option>
            <option v-for="m in REMEDIATION_METHODS" :key="m.key" :value="m.key">{{ m.name }}</option>
          </select>
          <textarea v-model="economicArgument" class="mp-textarea" rows="2" placeholder="Economic argument (cost, ROI, funding case)" />
          <textarea v-model="environmentalArgument" class="mp-textarea" rows="2" placeholder="Environmental argument (impact, risk reduction)" />

          <div class="mp-citations-input">
            <div class="mp-citations-input__label">Precedent citations</div>
            <div v-for="(c, i) in citations" :key="i" class="mp-citation-row">
              <input v-model="c.title" class="mp-input" placeholder="Title/source" />
              <input v-model="c.url" class="mp-input" placeholder="URL (optional)" />
              <button type="button" class="mp-remove-btn" @click="citations.splice(i, 1)">×</button>
            </div>
            <button type="button" class="mp-add-btn" @click="citations.push({ title: '', url: '' })">+ Add citation</button>
          </div>

          <button type="submit" class="mp-btn" :disabled="!title.trim() || !summary.trim() || submitting">Publish proposal</button>
        </form>
      </div>
      <div v-else class="mp-signin-gate">
        <p class="mp-p">Sign in to submit a proposal or endorse one.</p>
        <MemberSignIn />
      </div>

      <h2 class="mp-h2" style="margin-top:28px">All proposals</h2>
      <div v-for="p in store.methodProposals" :key="p.id" class="mp-proposal">
        <div class="mp-proposal__head">
          <span class="mp-proposal__title">{{ p.title }}</span>
          <span class="mp-proposal__status" :class="`mp-proposal__status--${p.status}`">{{ p.status }}</span>
        </div>
        <p class="mp-p">{{ p.summary }}</p>
        <p v-if="p.economic_argument" class="mp-p mp-p--dim"><strong>Economic:</strong> {{ p.economic_argument }}</p>
        <p v-if="p.environmental_argument" class="mp-p mp-p--dim"><strong>Environmental:</strong> {{ p.environmental_argument }}</p>
        <div v-if="p.precedent_citations.length" class="mp-citations">
          <span v-for="c in p.precedent_citations" :key="c.title" class="mp-citation">
            <a v-if="c.url" :href="c.url" target="_blank" rel="noopener" class="mp-citation-link">{{ c.title }}</a>
            <template v-else>{{ c.title }}</template>
          </span>
        </div>
        <button v-if="member.isSignedIn" class="mp-endorse-btn" :disabled="hasEndorsed(p.id)" @click="endorse(p.id)">
          {{ hasEndorsed(p.id) ? '✓ Endorsed' : 'Endorse' }} · {{ endorsementCount(p.id) }}
        </button>
        <span v-else class="mp-endorse-count">{{ endorsementCount(p.id) }} endorsements</span>
      </div>
      <p v-if="!store.methodProposals.length" class="mp-p mp-p--dim">No proposals yet — be the first.</p>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { usePfasCitizenScienceStore, type Citation } from 'src/stores/pfas-citizen-science'
import { REMEDIATION_METHODS } from 'src/data/pfas-methods-library'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member = useMemberStore()
const store  = usePfasCitizenScienceStore()

onMounted(async () => {
  await store.loadMethodProposals()
  for (const p of store.methodProposals) void store.loadEndorsements(p.id)
})

function endorsementCount(proposalId: string): number {
  return store.endorsements.filter(e => e.proposal_id === proposalId).length
}
function hasEndorsed(proposalId: string): boolean {
  return store.endorsements.some(e => e.proposal_id === proposalId && e.member_id === member.userId)
}
async function endorse(proposalId: string) {
  await store.endorseProposal(proposalId)
  await store.loadEndorsements(proposalId)
}

// ── Submission form ──────────────────────────────────────────────────────────

const title = ref('')
const summary = ref('')
const methodKey = ref('')
const economicArgument = ref('')
const environmentalArgument = ref('')
const citations = ref<Citation[]>([{ title: '', url: '' }])
const submitting = ref(false)

async function submit() {
  if (!title.value.trim() || !summary.value.trim()) return
  submitting.value = true
  await store.submitMethodProposal({
    title: title.value, summary: summary.value,
    methodKey: methodKey.value || undefined,
    citations: citations.value.filter(c => c.title.trim()),
    economicArgument: economicArgument.value || undefined,
    environmentalArgument: environmentalArgument.value || undefined,
  })
  title.value = ''; summary.value = ''; methodKey.value = ''
  economicArgument.value = ''; environmentalArgument.value = ''
  citations.value = [{ title: '', url: '' }]
  submitting.value = false
}
</script>

<style scoped>
.mp-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.mp-wrap { max-width: 720px; margin: 0 auto; }

.mp-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.60); margin-bottom: 8px; }
.mp-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.mp-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 20px; }
.mp-inline-link { color: rgba(0,210,255,0.85); text-decoration: underline; margin-left: 10px; }

.mp-h2 { font-size: 14px; font-weight: 600; color: rgba(215,238,255,0.92); margin: 0 0 10px; }
.mp-p  { font-size: 11.5px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 8px; }
.mp-p--dim { color: rgba(130,165,190,0.65); }

.mp-signin-gate, .mp-submit {
  border: 1px solid rgba(255,255,255,0.06); background: rgba(0,8,22,0.55);
  border-radius: 8px; padding: 16px; margin-bottom: 20px; max-width: 100%;
}

.mp-form { display: flex; flex-direction: column; gap: 8px; }
.mp-input, .mp-textarea {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px;
}
.mp-textarea { resize: vertical; }
.mp-input--wide { width: 100%; box-sizing: border-box; }

.mp-citations-input__label { font-size: 9.5px; color: rgba(150,180,205,0.60); margin: 4px 0; }
.mp-citation-row { display: flex; gap: 6px; margin-bottom: 6px; }
.mp-citation-row .mp-input { flex: 1; }
.mp-remove-btn { background: none; border: 1px solid rgba(200,80,80,0.35); color: rgba(230,120,120,0.85); border-radius: 4px; width: 28px; cursor: pointer; }
.mp-add-btn { background: none; border: 1px dashed rgba(0,150,200,0.35); color: rgba(0,190,230,0.70); border-radius: 4px; padding: 5px 10px; font-family: inherit; font-size: 9.5px; cursor: pointer; align-self: flex-start; }

.mp-btn {
  background: rgba(0,40,80,0.55); border: 1px solid rgba(0,160,220,0.35); border-radius: 5px;
  color: rgba(200,235,255,0.90); font-family: inherit; font-size: 10.5px; padding: 9px 18px; cursor: pointer; align-self: flex-start;
}
.mp-btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.mp-btn:disabled { opacity: 0.4; cursor: default; }

.mp-proposal { background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.mp-proposal__head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.mp-proposal__title { font-size: 13px; font-weight: 600; color: rgba(215,238,255,0.92); flex: 1; }
.mp-proposal__status { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; background: rgba(255,255,255,0.08); }
.mp-proposal__status--endorsed { background: rgba(80,230,130,0.15); color: rgba(100,240,150,0.85); }
.mp-proposal__status--adopted  { background: rgba(0,190,230,0.15); color: rgba(0,210,255,0.85); }

.mp-citations { display: flex; flex-direction: column; gap: 3px; margin: 6px 0 10px; }
.mp-citation { font-size: 9.5px; color: rgba(120,170,205,0.60); }
.mp-citation-link { color: rgba(0,190,230,0.75); text-decoration: underline; }

.mp-endorse-btn {
  background: rgba(0,80,120,0.18); border: 1px solid rgba(0,180,220,0.25); border-radius: 4px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10px; padding: 5px 12px; cursor: pointer;
}
.mp-endorse-btn:hover:not(:disabled) { background: rgba(0,180,220,0.20); }
.mp-endorse-btn:disabled { opacity: 0.7; cursor: default; color: rgba(80,230,130,0.85); }
.mp-endorse-count { font-size: 9.5px; color: rgba(120,170,205,0.55); }
</style>
