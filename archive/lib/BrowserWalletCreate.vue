<template>
  <div class="bwc-root">

    <!-- ── Step indicator ──────────────────────────────────────────── -->
    <div class="bwc-steps">
      <div v-for="(s, i) in STEPS" :key="i"
        class="bwc-step-pip"
        :class="{ 'bwc-step-pip--done': i < step, 'bwc-step-pip--active': i === step }">
        <span>{{ i + 1 }}</span>
      </div>
    </div>

    <!-- ══ STEP 0: Security warning ══════════════════════════════════ -->
    <div v-if="step === 0" class="bwc-card">
      <div class="bwc-step-head">🔐 Understand what you're creating</div>
      <div class="bwc-body-text">
        A <strong>browser wallet</strong> stores your private key encrypted in this browser.
        It is convenient for testnet minting but has real limitations you must understand:
      </div>

      <div class="bwc-risk-list">
        <div class="bwc-risk bwc-risk--warn">
          <span class="bwc-risk-icon">⚠</span>
          <div>
            <strong>Only as secure as this device.</strong>
            Malware on your computer can potentially extract the key if you
            enter your password while infected.
          </div>
        </div>
        <div class="bwc-risk bwc-risk--warn">
          <span class="bwc-risk-icon">⚠</span>
          <div>
            <strong>No recovery if you forget your password.</strong>
            Only your 12-word seed phrase can restore the wallet.
            If you lose both, the wallet is gone forever.
          </div>
        </div>
        <div class="bwc-risk bwc-risk--ok">
          <span class="bwc-risk-icon">✓</span>
          <div>
            <strong>Safe for testnet use and small amounts.</strong>
            The key is encrypted with scrypt (128 MB RAM per guess attempt)
            and stored in IndexedDB — not localStorage or cookies.
          </div>
        </div>
        <div class="bwc-risk bwc-risk--ok">
          <span class="bwc-risk-icon">✓</span>
          <div>
            <strong>You can export to MetaMask later.</strong>
            The seed phrase works in any BIP-44 compatible wallet.
          </div>
        </div>
      </div>

      <label class="bwc-confirm-check">
        <input type="checkbox" v-model="warningAcked" class="bwc-checkbox"/>
        I understand this is a software wallet and I should not store large amounts of real funds in it
      </label>

      <q-btn unelevated rounded color="cyan-8" label="I understand — continue"
        :disable="!warningAcked" class="full-width q-mt-md" @click="step = 1"/>
    </div>

    <!-- ══ STEP 1: Anti-phishing word + password ══════════════════════ -->
    <div v-if="step === 1" class="bwc-card">
      <div class="bwc-step-head">🛡 Set your anti-phishing word</div>
      <div class="bwc-body-text">
        Choose a personal word (e.g. "mango", "Kilifi", "river77"). Every time you
        unlock your wallet, this word is shown to confirm you are on the real
        Exotopia site — not a fake.
      </div>

      <q-input v-model="antiPhishWord" label="Your anti-phishing word" dark dense outlined
        class="q-mb-md" autocomplete="off" spellcheck="false"
        :rules="[v => v.trim().length >= 3 || 'At least 3 characters']"/>

      <div class="bwc-step-head" style="margin-top:8px">🔑 Choose a strong password</div>
      <div class="bwc-body-text">
        This encrypts your private key. <strong>Write it down too</strong> — there is no
        "forgot password" reset. An attacker with your encrypted file still cannot use it
        without this password.
      </div>

      <q-input v-model="password" label="Password" :type="showPw ? 'text' : 'password'"
        dark dense outlined class="q-mb-xs" autocomplete="new-password"
        :rules="[v => checkPasswordStrength(v).ok || 'Too weak — use 8+ characters with mixed case']">
        <template #append>
          <q-icon :name="showPw ? 'visibility_off' : 'visibility'" class="cursor-pointer"
            @click="showPw = !showPw"/>
        </template>
      </q-input>

      <!-- Password strength bar -->
      <div class="bwc-pw-bar" v-if="password">
        <div class="bwc-pw-fill" :style="{ width: (pwStrength.score / 4 * 100) + '%', background: pwStrength.color }"/>
      </div>
      <div class="bwc-pw-label" v-if="password" :style="{ color: pwStrength.color }">
        {{ pwStrength.label }}
      </div>

      <q-input v-model="passwordConfirm" label="Confirm password" type="password"
        dark dense outlined class="q-mt-sm q-mb-md" autocomplete="new-password"
        :rules="[v => v === password || 'Passwords do not match']"/>

      <q-btn unelevated rounded color="cyan-8"
        :label="creating ? 'Encrypting…' : 'Generate my wallet'"
        :disable="!canCreate || creating"
        class="full-width" @click="doCreate"/>

      <!-- scrypt progress bar — visible while the key-stretching runs (~0.5–2 s) -->
      <div v-if="creating" class="bwc-scrypt-wrap">
        <div class="bwc-scrypt-bar">
          <div class="bwc-scrypt-fill" :style="{ width: Math.round(encryptProgress * 100) + '%' }"/>
        </div>
        <div class="bwc-scrypt-label">
          Encrypting with scrypt (N=131072) · {{ Math.round(encryptProgress * 100) }}%
        </div>
      </div>

      <div v-if="createError" class="bwc-error q-mt-sm">{{ createError }}</div>
    </div>

    <!-- ══ STEP 2: Display seed phrase ════════════════════════════════ -->
    <div v-if="step === 2" class="bwc-card">
      <div class="bwc-step-head">📋 Write down your 12-word seed phrase</div>
      <div class="bwc-body-text bwc-body-text--warn">
        This is the <strong>only</strong> way to recover your wallet if you forget
        your password or lose access to this browser. Write it on paper.
        Do not screenshot it. Do not store it in a notes app or email.
      </div>

      <!-- Privacy blur toggle -->
      <div class="bwc-phrase-wrap" :class="{ 'bwc-phrase-wrap--hidden': phraseHidden }">
        <div class="bwc-phrase-grid">
          <div v-for="(word, i) in mnemonicWords" :key="i" class="bwc-word">
            <span class="bwc-word-num">{{ i + 1 }}</span>
            <span class="bwc-word-text">{{ word }}</span>
          </div>
        </div>
        <div v-if="phraseHidden" class="bwc-phrase-overlay" @click="phraseHidden = false">
          Click to reveal seed phrase
        </div>
      </div>

      <div class="bwc-phrase-actions">
        <q-btn flat dense rounded size="sm" color="blue-grey-5"
          :icon="phraseHidden ? 'visibility' : 'visibility_off'"
          :label="phraseHidden ? 'Reveal' : 'Hide'"
          @click="phraseHidden = !phraseHidden"/>
      </div>

      <div class="bwc-warning-box">
        <q-icon name="warning_amber" color="amber-5" size="16px" class="q-mr-xs"/>
        Exotopia will NEVER ask you for this phrase. Anyone who does is trying to steal your wallet.
      </div>

      <label class="bwc-confirm-check q-mt-sm">
        <input type="checkbox" v-model="phraseWritten" class="bwc-checkbox"/>
        I have written down all 12 words in order and stored them safely
      </label>

      <q-btn unelevated rounded color="cyan-8" label="I've written it down — verify me"
        :disable="!phraseWritten" class="full-width q-mt-md" @click="step = 3"/>
    </div>

    <!-- ══ STEP 3: Mnemonic verification quiz ════════════════════════ -->
    <div v-if="step === 3" class="bwc-card">
      <div class="bwc-step-head">✏ Verify your seed phrase</div>
      <div class="bwc-body-text">
        Enter the words at positions {{ quizItems.map(q => q.index + 1).join(', ') }}
        from your seed phrase to confirm you have it backed up correctly.
      </div>

      <div class="bwc-quiz">
        <div v-for="(q, i) in quizItems" :key="q.index" class="bwc-quiz-item">
          <span class="bwc-quiz-num">Word #{{ q.index + 1 }}</span>
          <q-input v-model="quizAnswers[i]" dense outlined dark
            :color="quizAnswerColor(i)"
            autocomplete="off" spellcheck="false" autocorrect="off" autocapitalize="none"
            @keyup.enter="i < quizItems.length - 1 ? undefined : tryVerify()"/>
        </div>
      </div>

      <div v-if="quizError" class="bwc-error q-mt-sm">{{ quizError }}</div>

      <q-btn unelevated rounded color="cyan-8" label="Verify and finish"
        :disable="quizAnswers.some(a => !a.trim())"
        class="full-width q-mt-md" @click="tryVerify"/>
    </div>

    <!-- ══ STEP 4: Complete ══════════════════════════════════════════ -->
    <div v-if="step === 4" class="bwc-card bwc-card--success">
      <div class="bwc-success-icon">🎉</div>
      <div class="bwc-step-head">Wallet ready</div>
      <div class="bwc-address-display">
        <span class="bwc-addr-label">Your address</span>
        <span class="bwc-addr-val">{{ createdAddress }}</span>
      </div>
      <div class="bwc-body-text">
        Your wallet is unlocked for this session ({{ SESSION_TIMEOUT_MS / 60000 }} min).
        You can mint NFTs on Polygon and Celo testnets right away.
      </div>

      <div class="bwc-final-actions">
        <q-btn outline rounded size="sm" color="blue-grey-4"
          icon="download" label="Download encrypted backup"
          @click="doDownload"/>
        <q-btn unelevated rounded color="cyan-8"
          icon="check" label="Start minting"
          @click="$emit('done', createdAddress)"/>
      </div>

      <div class="bwc-tip">
        The downloaded backup file is encrypted — it is safe to store in cloud storage
        as long as your password remains secret.
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  createWallet, downloadBackup,
  generateMnemonicQuiz, verifyMnemonicQuiz,
  checkPasswordStrength, encryptProgress,
  SESSION_TIMEOUT_MS,
} from './browser-wallet'

defineEmits<{ (e: 'done', address: string): void }>()

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = ['Warning', 'Password', 'Phrase', 'Verify', 'Done']
const step  = ref(0)

// ── Step 0 ────────────────────────────────────────────────────────────────────

const warningAcked = ref(false)

// ── Step 1 ────────────────────────────────────────────────────────────────────

const antiPhishWord   = ref('')
const password        = ref('')
const passwordConfirm = ref('')
const showPw          = ref(false)
const creating        = ref(false)
const createError     = ref('')

const pwStrength = computed(() => checkPasswordStrength(password.value))

const canCreate = computed(() =>
  antiPhishWord.value.trim().length >= 3 &&
  pwStrength.value.ok &&
  password.value === passwordConfirm.value
)

// ── Step 2 ────────────────────────────────────────────────────────────────────

const mnemonic     = ref('')
const mnemonicWords = computed(() => mnemonic.value.trim().split(' '))
const phraseHidden = ref(true)
const phraseWritten = ref(false)
const createdAddress = ref('')

async function doCreate() {
  if (!canCreate.value) return
  creating.value  = true
  createError.value = ''
  try {
    const result  = await createWallet(password.value, antiPhishWord.value)
    mnemonic.value       = result.mnemonic
    createdAddress.value = result.address
    step.value           = 2
  } catch (e: any) {
    createError.value = e.message ?? 'Wallet creation failed'
  } finally {
    creating.value = false
  }
}

// ── Step 3 ────────────────────────────────────────────────────────────────────

const quizItems   = computed(() => generateMnemonicQuiz(mnemonic.value))
const quizAnswers = ref<string[]>(['', '', ''])
const quizError   = ref('')

function quizAnswerColor(i: number): string {
  const ans = quizAnswers.value[i]?.trim().toLowerCase()
  if (!ans) return 'blue-grey-5'
  return ans === quizItems.value[i]?.word ? 'green-5' : 'red-4'
}

function tryVerify() {
  quizError.value = ''
  const ok = verifyMnemonicQuiz(quizItems.value, quizAnswers.value)
  if (!ok) {
    quizError.value = 'One or more words are incorrect. Check your backup and try again.'
    return
  }
  // Clear the mnemonic from memory now that verification is done
  mnemonic.value = ''
  step.value     = 4
}

// ── Step 4 ────────────────────────────────────────────────────────────────────

async function doDownload() {
  await downloadBackup()
}
</script>

<style scoped>
.bwc-root { font-family: 'Courier New', monospace; display: flex; flex-direction: column; gap: 14px; }

.bwc-steps {
  display: flex; gap: 6px; justify-content: center;
}
.bwc-step-pip {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0,40,80,0.40); border: 1px solid rgba(0,100,160,0.22);
  color: rgba(80,140,180,0.55); font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.bwc-step-pip--done   { background: rgba(0,80,50,0.45); border-color: rgba(60,200,120,0.40); color: rgba(80,220,140,0.85); }
.bwc-step-pip--active { background: rgba(0,60,120,0.55); border-color: rgba(0,180,240,0.55); color: rgba(0,220,255,0.92); }

.bwc-card {
  background: rgba(0,8,22,0.85); border: 1px solid rgba(0,120,180,0.22);
  border-radius: 7px; padding: 18px; display: flex; flex-direction: column; gap: 12px;
}
.bwc-card--success { border-color: rgba(60,200,120,0.35); background: rgba(0,20,12,0.75); }

.bwc-step-head { font-size: 13px; font-weight: 600; color: rgba(200,235,255,0.90); letter-spacing: 0.05em; }

.bwc-body-text { font-size: 9.5px; color: rgba(130,180,215,0.72); line-height: 1.65; }
.bwc-body-text strong { color: rgba(200,230,255,0.85); }
.bwc-body-text--warn strong { color: rgba(240,200,80,0.90); }

.bwc-risk-list { display: flex; flex-direction: column; gap: 8px; }
.bwc-risk { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 4px; font-size: 9px; line-height: 1.55; }
.bwc-risk--warn { background: rgba(60,25,0,0.35); border-left: 2px solid rgba(220,150,40,0.50); color: rgba(210,180,100,0.80); }
.bwc-risk--warn strong { color: rgba(240,200,60,0.90); }
.bwc-risk--ok   { background: rgba(0,40,20,0.35); border-left: 2px solid rgba(60,200,110,0.45); color: rgba(140,210,175,0.80); }
.bwc-risk--ok strong { color: rgba(100,230,150,0.90); }
.bwc-risk-icon  { font-size: 13px; flex-shrink: 0; }

.bwc-confirm-check {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 9px; color: rgba(130,175,210,0.72); line-height: 1.55; cursor: pointer;
}
.bwc-checkbox { flex-shrink: 0; margin-top: 2px; accent-color: #00e5ff; }

.bwc-pw-bar  { height: 3px; background: rgba(0,40,80,0.50); border-radius: 2px; overflow: hidden; margin-top: 2px; }
.bwc-pw-fill { height: 100%; border-radius: 2px; transition: width 0.18s, background 0.18s; }
.bwc-pw-label { font-size: 8px; letter-spacing: 0.10em; margin-top: 3px; }

/* scrypt progress */
.bwc-scrypt-wrap { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.bwc-scrypt-bar  { height: 4px; background: rgba(0,40,80,0.50); border-radius: 2px; overflow: hidden; }
.bwc-scrypt-fill { height: 100%; background: linear-gradient(90deg, #00aacc, #00e5ff); border-radius: 2px; transition: width 0.20s linear; }
.bwc-scrypt-label { font-size: 7.5px; letter-spacing: 0.08em; color: rgba(0,180,220,0.55); }

/* Seed phrase grid */
.bwc-phrase-wrap {
  position: relative; border: 1px solid rgba(0,120,180,0.25); border-radius: 5px; overflow: hidden;
}
.bwc-phrase-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 10px;
}
.bwc-word {
  display: flex; align-items: center; gap: 6px;
  background: rgba(0,20,45,0.60); border-radius: 3px; padding: 5px 8px;
}
.bwc-word-num { font-size: 7.5px; color: rgba(60,120,170,0.55); min-width: 14px; }
.bwc-word-text { font-size: 10px; color: rgba(200,230,255,0.88); letter-spacing: 0.03em; }

.bwc-phrase-wrap--hidden .bwc-phrase-grid { filter: blur(8px); pointer-events: none; }
.bwc-phrase-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,8,22,0.55); cursor: pointer;
  font-size: 10px; color: rgba(0,200,240,0.80); letter-spacing: 0.10em;
}

.bwc-phrase-actions { display: flex; justify-content: flex-end; }

.bwc-warning-box {
  display: flex; align-items: flex-start; gap: 6px; padding: 8px 10px;
  background: rgba(60,30,0,0.35); border: 1px solid rgba(220,150,40,0.28); border-radius: 4px;
  font-size: 8.5px; color: rgba(220,185,100,0.78); line-height: 1.55;
}

/* Quiz */
.bwc-quiz { display: flex; flex-direction: column; gap: 8px; }
.bwc-quiz-item { display: flex; align-items: center; gap: 10px; }
.bwc-quiz-num { font-size: 9px; color: rgba(70,130,170,0.65); min-width: 55px; }

.bwc-error { font-size: 9px; color: rgba(255,100,80,0.85); padding: 6px 10px; background: rgba(60,0,0,0.40); border-radius: 4px; }

/* Done */
.bwc-success-icon { font-size: 36px; text-align: center; }
.bwc-address-display {
  display: flex; flex-direction: column; gap: 2px;
  background: rgba(0,20,45,0.60); border-radius: 4px; padding: 8px 10px;
}
.bwc-addr-label { font-size: 7.5px; letter-spacing: 0.14em; color: rgba(0,180,220,0.50); }
.bwc-addr-val   { font-size: 9.5px; color: rgba(0,230,255,0.85); word-break: break-all; }
.bwc-final-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.bwc-tip { font-size: 8.5px; color: rgba(80,140,180,0.55); line-height: 1.55; }
</style>
