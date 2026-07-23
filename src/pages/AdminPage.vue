<template>
  <q-page class="admin-page">

    <div class="adm-header">
      <div class="adm-badge">⚙ ADMIN · CONFIGURATION</div>
      <h1 class="adm-title">Deployment &amp; Airdrop Tools</h1>
      <p class="adm-sub">
        Station wizard, minting style configuration, chain matrix, and eco-ops
        check-in management. Access via <code>Shift+Alt+A</code> or this URL.
        Not linked from any public navigation.
      </p>
    </div>

    <div class="adm-grid">

      <div class="adm-card" @click="$router.push('/station')">
        <div class="adm-card__icon">🏗</div>
        <div class="adm-card__body">
          <div class="adm-card__title">Station Wizard</div>
          <div class="adm-card__desc">
            4-step wizard for deploying a new orbital station on an exoplanet.
            Configures module slots, identity, location, and governance settings.
            Produces a Solana Station Core NFT.
          </div>
          <div class="adm-card__meta">Station · Module · STA-xxxx</div>
        </div>
        <div class="adm-card__arrow">→</div>
      </div>

      <div class="adm-card" @click="$router.push('/mint-style')">
        <div class="adm-card__icon">🎨</div>
        <div class="adm-card__body">
          <div class="adm-card__title">Minting Style Builder</div>
          <div class="adm-card__desc">
            Generative style configuration for airdrop campaigns. Combines
            Worldbridger One artist layers, EcoCity object codes, Mule knowledge
            delta, event metadata, and settlement status.
          </div>
          <div class="adm-card__meta">Style · Airdrop · Theme config</div>
        </div>
        <div class="adm-card__arrow">→</div>
      </div>

      <div class="adm-card" @click="$router.push('/chains')">
        <div class="adm-card__icon">🔗</div>
        <div class="adm-card__body">
          <div class="adm-card__title">Chain Support Matrix</div>
          <div class="adm-card__desc">
            Live status of all supported chains — ALGO, MATIC, SOL, TEZ, HBAR, CELO.
            Testnet endpoints, contract addresses, gas estimates, and faucet links.
          </div>
          <div class="adm-card__meta">ALGO · MATIC · SOL · TEZ · HBAR · CELO</div>
        </div>
        <div class="adm-card__arrow">→</div>
      </div>

      <div class="adm-card" @click="$router.push('/eco-ops')">
        <div class="adm-card__icon">🌱</div>
        <div class="adm-card__body">
          <div class="adm-card__title">Eco-Ops Management</div>
          <div class="adm-card__desc">
            Field check-in protocol management. Configure activity types, review
            GPS-tagged submissions, and manage water quality certificate issuance
            on-chain.
          </div>
          <div class="adm-card__meta">WATSAN · farmMap · garbageMap · eco-ops</div>
        </div>
        <div class="adm-card__arrow">→</div>
      </div>

    </div>

    <div class="adm-env">
      <div class="adm-env__label">DEPLOYMENT ENV CONFIG</div>
      <div class="adm-env__grid">
        <div class="adm-env__row" v-for="v in envRows" :key="v.key">
          <code class="adm-env__key">{{ v.key }}</code>
          <code class="adm-env__val">{{ v.val }}</code>
          <span class="adm-env__note">{{ v.note }}</span>
        </div>
      </div>
    </div>

    <!-- Grant Reward — manual credit for things the automated ledger can't see
         yet (a verified bounty, a docs/curriculum contribution). Visible only
         to admin_members; RLS is_admin() is the real enforcement, this is just
         UI gating so non-admins don't see a form that would silently fail. -->
    <div v-if="rewards.isAdmin" class="adm-env adm-grant">
      <div class="adm-env__label">GRANT REWARD · MANUAL CREDIT</div>
      <form class="adm-grant__form" @submit.prevent="submitGrant">
        <div class="adm-grant__member">
          <input v-model="memberQuery" class="adm-grant__input" placeholder="Search member by handle or name…" @input="onMemberQuery" />
          <div v-if="memberResults.length" class="adm-grant__results">
            <button v-for="m in memberResults" :key="m.id" type="button" class="adm-grant__result"
              :class="{ 'adm-grant__result--active': m.id === selectedMemberId }"
              @click="selectMember(m)">{{ m.display_name }} <span class="adm-grant__handle">@{{ m.handle }}</span></button>
          </div>
          <div v-if="selectedMemberLabel" class="adm-grant__selected">Granting to: <strong>{{ selectedMemberLabel }}</strong></div>
        </div>
        <select v-model="grantTrack" class="adm-grant__input">
          <option value="educating_others">educating_others</option>
          <option value="volunteering">volunteering</option>
          <option value="finance_literacy">finance_literacy</option>
        </select>
        <input v-model="grantActionKey" class="adm-grant__input" placeholder="action_key (e.g. bounty_verified)" />
        <input v-model.number="grantPoints" type="number" min="0" class="adm-grant__input" placeholder="Points" style="max-width:90px" />
        <input v-model="grantNote" class="adm-grant__input" placeholder="Note (e.g. bounty issue URL)" style="flex:1;min-width:180px" />
        <button type="submit" class="adm-grant__btn" :disabled="!selectedMemberId || !grantActionKey || !grantPoints || granting">Grant</button>
      </form>
      <div v-if="grantStatus" class="adm-grant__status">{{ grantStatus }}</div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FREE_MINT, DEFAULT_CHAIN, ENABLED_PATHWAY_IDS } from 'src/lib/mint-config'
import { useRewardsStore, type RewardTrack } from 'src/stores/rewards'

const envRows = [
  { key: 'VITE_FREE_MINT',            val: String(FREE_MINT),                   note: 'No cost to mint primary deed' },
  { key: 'VITE_DEFAULT_CHAIN',        val: DEFAULT_CHAIN,                        note: 'Pre-selected chain in mint form' },
  { key: 'VITE_ENABLED_PATHWAYS',     val: ENABLED_PATHWAY_IDS.join(', '),       note: 'Visible pathway cards' },
]

// ── Grant Reward ──────────────────────────────────────────────────────────────

const rewards = useRewardsStore()
onMounted(() => { void rewards.checkIsAdmin() })

interface MemberHit { id: string; handle: string; display_name: string }

const memberQuery       = ref('')
const memberResults     = ref<MemberHit[]>([])
const selectedMemberId  = ref('')
const selectedMemberLabel = ref('')
const grantTrack        = ref<RewardTrack>('educating_others')
const grantActionKey    = ref('')
const grantPoints       = ref<number | null>(null)
const grantNote         = ref('')
const granting          = ref(false)
const grantStatus       = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onMemberQuery() {
  selectedMemberId.value = ''
  selectedMemberLabel.value = ''
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    memberResults.value = await rewards.searchMembers(memberQuery.value)
  }, 250)
}

function selectMember(m: MemberHit) {
  selectedMemberId.value = m.id
  selectedMemberLabel.value = `${m.display_name} (@${m.handle})`
  memberResults.value = []
}

async function submitGrant() {
  if (!selectedMemberId.value || !grantActionKey.value || !grantPoints.value) return
  granting.value = true
  await rewards.adminGrantReward(selectedMemberId.value, grantTrack.value, grantActionKey.value, grantPoints.value, { note: grantNote.value })
  grantStatus.value = `Granted ${grantPoints.value} pts (${grantActionKey.value}) to ${selectedMemberLabel.value}.`
  memberQuery.value = ''; selectedMemberId.value = ''; selectedMemberLabel.value = ''
  grantActionKey.value = ''; grantPoints.value = null; grantNote.value = ''
  granting.value = false
}
</script>

<style scoped>
.admin-page {
  background: #020408;
  min-height: 100vh;
  padding: 36px 28px;
  font-family: 'Courier New', monospace;
}

.adm-header {
  border-left: 3px solid rgba(0, 180, 220, 0.40);
  padding-left: 18px;
  margin-bottom: 32px;
}
.adm-badge {
  font-size: 9px;
  letter-spacing: 0.20em;
  color: rgba(0, 180, 220, 0.55);
  margin-bottom: 8px;
}
.adm-title {
  font-size: 22px;
  font-weight: 300;
  color: rgba(200, 235, 255, 0.88);
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}
.adm-sub {
  font-size: 10.5px;
  color: rgba(100, 155, 190, 0.65);
  line-height: 1.65;
  max-width: 560px;
}
.adm-sub code {
  background: rgba(0, 50, 80, 0.35);
  border: 1px solid rgba(0, 150, 200, 0.22);
  border-radius: 3px;
  padding: 1px 5px;
  color: rgba(0, 210, 255, 0.80);
}

.adm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  margin-bottom: 36px;
}

.adm-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: rgba(0, 8, 20, 0.75);
  border: 1px solid rgba(0, 120, 180, 0.18);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s;
}
.adm-card:hover {
  border-color: rgba(0, 190, 240, 0.38);
  background: rgba(0, 14, 32, 0.90);
}

.adm-card__icon { font-size: 24px; flex-shrink: 0; padding-top: 2px; }
.adm-card__body { flex: 1; }
.adm-card__title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(200, 235, 255, 0.88);
  letter-spacing: 0.06em;
  margin-bottom: 5px;
}
.adm-card__desc {
  font-size: 9px;
  color: rgba(120, 175, 210, 0.65);
  line-height: 1.60;
  margin-bottom: 6px;
}
.adm-card__meta {
  font-size: 7.5px;
  color: rgba(0, 160, 200, 0.45);
  letter-spacing: 0.12em;
}
.adm-card__arrow {
  color: rgba(0, 180, 220, 0.35);
  font-size: 14px;
  flex-shrink: 0;
  align-self: center;
}

/* Env table */
.adm-env { margin-top: 8px; }
.adm-env__label {
  font-size: 8px;
  letter-spacing: 0.18em;
  color: rgba(0, 160, 200, 0.40);
  margin-bottom: 10px;
}
.adm-env__grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 700px;
}
.adm-env__row {
  display: grid;
  grid-template-columns: 260px 160px 1fr;
  gap: 12px;
  align-items: baseline;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 50, 80, 0.20);
  font-size: 9px;
}
@media (max-width: 480px) {
  /* Fixed-px columns forced horizontal overflow on narrow phones (confirmed:
     scrollWidth 521 vs clientWidth 360) — stack instead below this width. */
  .adm-env__row { grid-template-columns: 1fr; gap: 2px; }
}
.adm-env__key { color: rgba(0, 200, 240, 0.70); }
.adm-env__val { color: rgba(200, 240, 200, 0.75); }
.adm-env__note { color: rgba(80, 130, 160, 0.50); font-style: italic; }

/* Grant Reward */
.adm-grant { margin-top: 28px; max-width: 700px; }
.adm-grant__form { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
.adm-grant__member { position: relative; flex: 1; min-width: 220px; }
.adm-grant__input {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 4px;
  color: rgba(200,230,255,0.85); font-family: 'Courier New', monospace; font-size: 10px;
  padding: 7px 9px; width: 100%; box-sizing: border-box;
}
.adm-grant__results {
  position: absolute; z-index: 5; top: 100%; left: 0; right: 0; margin-top: 2px;
  background: #030a16; border: 1px solid rgba(0,150,200,0.30); border-radius: 4px;
  max-height: 160px; overflow-y: auto;
}
.adm-grant__result {
  display: block; width: 100%; text-align: left; background: none; border: none;
  color: rgba(180,210,235,0.80); font-family: 'Courier New', monospace; font-size: 9.5px;
  padding: 6px 9px; cursor: pointer;
}
.adm-grant__result:hover, .adm-grant__result--active { background: rgba(0,180,220,0.15); color: #00e5ff; }
.adm-grant__handle { color: rgba(0,160,200,0.45); }
.adm-grant__selected { font-size: 9px; color: rgba(80,230,130,0.75); margin-top: 4px; }
.adm-grant__btn {
  background: rgba(0,40,80,0.55); border: 1px solid rgba(0,160,220,0.35); border-radius: 4px;
  color: rgba(200,235,255,0.90); font-family: 'Courier New', monospace; font-size: 10px;
  padding: 7px 16px; cursor: pointer;
}
.adm-grant__btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.adm-grant__btn:disabled { opacity: 0.4; cursor: default; }
.adm-grant__status { font-size: 9px; color: rgba(80,230,130,0.80); margin-top: 10px; }
</style>
