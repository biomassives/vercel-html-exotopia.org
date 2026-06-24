<template>
  <q-page class="ob-page">

    <!-- Starfield backdrop -->
    <div class="ob-stars" aria-hidden="true">
      <div v-for="s in stars" :key="s.id" class="ob-star"
        :style="{ left: s.x+'%', top: s.y+'%', width: s.r+'px', height: s.r+'px', opacity: s.o }"/>
    </div>

    <div class="ob-wrap">

      <!-- ── Logo strip ─────────────────────────────────────────────────── -->
      <div class="ob-logo-row">
        <router-link to="/" class="ob-logo">
          <span class="ob-logo-exo">EXO</span><span class="ob-logo-topia">TOPIA</span>
        </router-link>
        <span class="ob-tagline">Claim your place in the cosmos</span>
      </div>

      <!-- ── Step rail ──────────────────────────────────────────────────── -->
      <div class="ob-rail">
        <div v-for="(s, i) in STEPS" :key="i"
          class="ob-rail-item"
          :class="{
            'ob-rail-item--done':   i < step,
            'ob-rail-item--active': i === step,
            'ob-rail-item--future': i > step,
          }"
          @click="i < step && (step = i)"
        >
          <div class="ob-rail-dot">
            <span v-if="i < step">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="ob-rail-label">{{ s.label }}</span>
          <div v-if="i < STEPS.length - 1" class="ob-rail-line"/>
        </div>
      </div>

      <!-- ══ STEP 0 — Welcome ═══════════════════════════════════════════ -->
      <Transition name="ob-step" mode="out-in">
      <div v-if="step === 0" key="0" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🌌</div>
          <h1 class="ob-card-title">Welcome to Exotopia</h1>
          <p class="ob-card-sub">
            Exotopia lets you claim virtual land on confirmed exoplanets, mint
            settlement deeds as NFTs, and participate in real-world eco-ops
            through the SCD Hub network. This wizard gets you minting in under
            5 minutes.
          </p>
        </div>

        <div class="ob-what-you-get">
          <div class="ob-wg-item">
            <span class="ob-wg-icon">⬡</span>
            <div>
              <div class="ob-wg-title">40 Acres &amp; A Mule</div>
              <div class="ob-wg-desc">Claim a virtual land deed on any of 5,000+ confirmed exoplanets. Free to mint.</div>
            </div>
          </div>
          <div class="ob-wg-item">
            <span class="ob-wg-icon">🎨</span>
            <div>
              <div class="ob-wg-title">Collector Cards</div>
              <div class="ob-wg-desc">Hand-crafted SVG NFTs representing astronomical phenomena. Limited editions.</div>
            </div>
          </div>
          <div class="ob-wg-item">
            <span class="ob-wg-icon">💧</span>
            <div>
              <div class="ob-wg-title">Sponsor Real Field Work</div>
              <div class="ob-wg-desc">Fund water quality readings, eco-ops check-ins, and community science. Earn resellable Activity Reward Tokens.</div>
            </div>
          </div>
        </div>

        <q-btn unelevated rounded color="cyan-8" icon-right="arrow_forward"
          label="Start your journey" class="full-width ob-next-btn"
          @click="step = 1"/>
      </div>

      <!-- ══ STEP 1 — Choose chain ══════════════════════════════════════ -->
      <div v-else-if="step === 1" key="1" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">⛓</div>
          <h2 class="ob-card-title">Choose your blockchain</h2>
          <p class="ob-card-sub">
            Your NFTs live on a public blockchain. Both options are
            <strong>free to use on testnet</strong> — pick whichever feels
            right for you.
          </p>
        </div>

        <div class="ob-chain-grid">
          <div
            v-for="c in CHAINS" :key="c.id"
            class="ob-chain-card"
            :class="{ 'ob-chain-card--selected': selectedChain === c.id }"
            @click="selectedChain = c.id"
          >
            <div class="ob-chain-head">
              <span class="ob-chain-icon">{{ c.emoji }}</span>
              <div>
                <div class="ob-chain-name">{{ c.name }}</div>
                <div class="ob-chain-tag">{{ c.tag }}</div>
              </div>
              <div class="ob-chain-sel" v-if="selectedChain === c.id">✓</div>
            </div>
            <div class="ob-chain-facts">
              <span v-for="f in c.facts" :key="f" class="ob-chain-fact">{{ f }}</span>
            </div>
            <div class="ob-chain-mints">
              <span class="ob-chain-mints-label">Mint types:</span>
              <span v-for="m in c.mints" :key="m" class="ob-chain-mint-tag">{{ m }}</span>
            </div>
          </div>
        </div>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="cyan-8" icon-right="arrow_forward"
            label="Use this chain" :disable="!selectedChain"
            @click="step = 2"/>
        </div>
      </div>

      <!-- ══ STEP 2 — Wallet setup ══════════════════════════════════════ -->
      <div v-else-if="step === 2" key="2" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">👛</div>
          <h2 class="ob-card-title">Set up your wallet</h2>
          <p class="ob-card-sub">
            A crypto wallet is a secure key that proves you own your NFTs.
            Choose how you'd like to set one up:
          </p>
        </div>

        <!-- Option tabs -->
        <div class="ob-wallet-opts">
          <button
            v-for="opt in WALLET_OPTS" :key="opt.id"
            class="ob-wopt"
            :class="{ 'ob-wopt--active': walletOpt === opt.id }"
            @click="walletOpt = opt.id"
          >
            <span class="ob-wopt-icon">{{ opt.emoji }}</span>
            <div class="ob-wopt-body">
              <div class="ob-wopt-title">{{ opt.title }}</div>
              <div class="ob-wopt-note">{{ opt.note }}</div>
            </div>
          </button>
        </div>

        <!-- Browser wallet create/unlock -->
        <div v-if="walletOpt === 'browser'" class="ob-wopt-content">
          <BrowserWalletUnlock v-if="hasBrowserWallet"
            @unlocked="onWalletReady" @deleted="hasBrowserWallet = false"/>
          <BrowserWalletCreate v-else @done="onWalletReady"/>
        </div>

        <!-- Injected wallet connect -->
        <div v-if="walletOpt === 'injected'" class="ob-wopt-content">
          <div v-if="!hasInjectedWallet()" class="ob-inject-missing">
            <div class="ob-inject-msg">
              No wallet extension detected in this browser.
              Install one and refresh this page.
            </div>
            <div class="ob-inject-links">
              <a href="https://metamask.io/download/" target="_blank" rel="noopener" class="ob-inject-link">
                🦊 MetaMask
              </a>
              <a href="https://valoraapp.com/" target="_blank" rel="noopener" class="ob-inject-link">
                🌱 Valora (Celo)
              </a>
            </div>
          </div>
          <div v-else class="ob-inject-found">
            <q-btn unelevated rounded :color="selectedChain === 'celo' ? 'green-8' : 'purple-8'"
              icon="account_balance_wallet" label="Connect wallet"
              class="full-width" :loading="connecting" @click="doConnect"/>
            <div v-if="connectError" class="ob-error">{{ connectError }}</div>
          </div>
        </div>

        <!-- Skip for now -->
        <div v-if="walletOpt === 'skip'" class="ob-wopt-content">
          <div class="ob-skip-note">
            You can explore Exotopia without a wallet. You'll need one to mint.
            We'll remind you on the mint page.
          </div>
          <q-btn unelevated rounded color="blue-grey-7" label="Continue without wallet"
            class="full-width q-mt-sm" @click="onWalletReady(null)"/>
        </div>

        <div class="ob-nav-row" v-if="walletOpt !== 'browser' && walletOpt !== 'skip'">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
        </div>
        <div class="ob-nav-row" v-if="walletOpt === 'browser' || walletOpt === 'skip'">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
        </div>
      </div>

      <!-- ══ STEP 3 — Get testnet tokens ════════════════════════════════ -->
      <div v-else-if="step === 3" key="3" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🚰</div>
          <h2 class="ob-card-title">Get free testnet tokens</h2>
          <p class="ob-card-sub">
            Testnets use play-money tokens to pay transaction fees.
            Get some from the faucet — it's free and takes 30 seconds.
          </p>
        </div>

        <div class="ob-faucet-card">
          <div class="ob-faucet-head">
            <span class="ob-faucet-emoji">{{ activeChain.emoji }}</span>
            <div>
              <div class="ob-faucet-chain">{{ activeChain.faucetName }}</div>
              <div class="ob-faucet-desc">{{ activeChain.faucetDesc }}</div>
            </div>
          </div>

          <div class="ob-address-copy" v-if="connectedAddress">
            <span class="ob-addr-label">Your address (paste into faucet):</span>
            <div class="ob-addr-row">
              <span class="ob-addr-val">{{ connectedAddress }}</span>
              <button class="ob-copy-btn" @click="copyAddr">{{ addrCopied ? '✓' : 'copy' }}</button>
            </div>
          </div>

          <a :href="activeChain.faucetUrl" target="_blank" rel="noopener" class="ob-faucet-btn">
            Open faucet — get free {{ activeChain.symbol }}
            <q-icon name="open_in_new" size="12px" class="q-ml-xs"/>
          </a>
        </div>

        <div class="ob-faucet-steps">
          <div class="ob-fs-item">1. Click "Open faucet" above</div>
          <div class="ob-fs-item">2. Paste your address into the faucet form</div>
          <div class="ob-fs-item">3. Click "Send" — tokens arrive in ~30 s</div>
          <div class="ob-fs-item">4. Return here and click Continue</div>
        </div>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="cyan-8" icon-right="arrow_forward"
            label="I've got tokens — continue" @click="step = 4"/>
        </div>
        <div class="ob-skip-link">
          <button class="ob-skip-btn" @click="step = 4">Skip — I'll get tokens later</button>
        </div>
      </div>

      <!-- ══ STEP 4 — You're ready ══════════════════════════════════════ -->
      <div v-else-if="step === 4" key="4" class="ob-card ob-card--ready">
        <div class="ob-card-hero">
          <div class="ob-hero-icon ob-hero-icon--spin">⬡</div>
          <h2 class="ob-card-title">You're ready to mint</h2>
          <p class="ob-card-sub">
            Your wallet is set up
            <span v-if="connectedAddress">
              (<code>{{ connectedAddress.slice(0,8) }}…{{ connectedAddress.slice(-6) }}</code>)
            </span>
            and you're on the {{ activeChain.name }} testnet.
            Choose what you'd like to do first:
          </p>
        </div>

        <div class="ob-ready-grid">
          <router-link to="/galaxy" class="ob-ready-card">
            <span class="ob-ready-icon">🌌</span>
            <div class="ob-ready-title">Find a planet</div>
            <div class="ob-ready-desc">Browse 5,000+ confirmed worlds in the Milky Way map</div>
          </router-link>
          <router-link :to="mintRoute" class="ob-ready-card ob-ready-card--primary">
            <span class="ob-ready-icon">⬡</span>
            <div class="ob-ready-title">Mint your first deed</div>
            <div class="ob-ready-desc">Claim 40 acres on an exoplanet — free to mint</div>
            <div class="ob-ready-badge">START HERE</div>
          </router-link>
          <router-link to="/gallery" class="ob-ready-card">
            <span class="ob-ready-icon">🎨</span>
            <div class="ob-ready-title">Browse gallery</div>
            <div class="ob-ready-desc">View and collect limited edition astronomy cards</div>
          </router-link>
        </div>

        <div class="ob-session-note" v-if="connectedAddress">
          <q-icon name="lock_clock" size="12px" color="blue-grey-5" class="q-mr-xs"/>
          Wallet session active — auto-locks after 30 min of inactivity
        </div>
      </div>
      </Transition>

    </div><!-- /ob-wrap -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BrowserWalletCreate from 'src/components/BrowserWalletCreate.vue'
import BrowserWalletUnlock from 'src/components/BrowserWalletUnlock.vue'
import {
  hasStoredWallet, sessionAddress,
} from 'src/lib/evm/browser-wallet'
import {
  hasInjectedWallet, requestAccount, switchToChain,
} from 'src/lib/evm/mint-evm'
import { POLYGON_AMOY, CELO_ALFAJORES } from 'src/lib/evm/chains'

const router = useRouter()

// ── Wizard state ──────────────────────────────────────────────────────────────

const step          = ref(0)
const selectedChain = ref<'polygon' | 'celo' | null>(null)
const walletOpt     = ref<'browser' | 'injected' | 'skip'>('browser')
const hasBrowserWallet = ref(false)
const connectedAddress = ref<string | null>(null)
const connecting    = ref(false)
const connectError  = ref('')
const addrCopied    = ref(false)

// ── Config ────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Welcome'  },
  { label: 'Chain'    },
  { label: 'Wallet'   },
  { label: 'Tokens'   },
  { label: 'Mint!'    },
]

const CHAINS = [
  {
    id:          'polygon' as const,
    emoji:       '🔷',
    name:        'Polygon (MATIC)',
    tag:         'Recommended for most users',
    facts:       ['Low gas fees', 'Large ecosystem', 'Browser extension wallets'],
    mints:       ['Land deeds', '$SUNLIGHT music', 'Water certs'],
    faucetName:  'Polygon Amoy Faucet',
    faucetDesc:  'Free MATIC test tokens, arrive in ~30 s',
    faucetUrl:   'https://faucet.polygon.technology',
    symbol:      'MATIC',
    chainData:   POLYGON_AMOY,
  },
  {
    id:          'celo' as const,
    emoji:       '🌱',
    name:        'Celo',
    tag:         'Mobile-first · East Africa optimised',
    facts:       ['Mobile wallet (Valora)', 'M-Pesa integration', 'cUSD stablecoin'],
    mints:       ['Community badges', 'Eco-ops tokens'],
    faucetName:  'Celo Alfajores Faucet',
    faucetDesc:  'Free CELO test tokens',
    faucetUrl:   'https://faucet.celo.org/alfajores',
    symbol:      'CELO',
    chainData:   CELO_ALFAJORES,
  },
]

const WALLET_OPTS = [
  { id: 'browser'  as const, emoji: '🔐', title: 'Create wallet in this browser',
    note: 'No extension needed · encrypted with your password · good for testnet' },
  { id: 'injected' as const, emoji: '🦊', title: 'Connect MetaMask or Valora',
    note: 'Already have a wallet extension installed?' },
  { id: 'skip'     as const, emoji: '👀', title: 'Explore without a wallet first',
    note: 'You can always set one up later when you\'re ready to mint' },
]

const activeChain = computed(() =>
  CHAINS.find(c => c.id === selectedChain.value) ?? CHAINS[0]!
)

const mintRoute = computed(() =>
  selectedChain.value === 'celo'
    ? '/mint?tab=celo'
    : '/mint?tab=polygon'
)

// ── Stars backdrop ────────────────────────────────────────────────────────────

const stars = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: 0.5 + Math.random() * 1.5,
  o: 0.15 + Math.random() * 0.45,
}))

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  hasBrowserWallet.value = await hasStoredWallet()
  // If a session is already active, pre-fill the address
  if (sessionAddress.value) connectedAddress.value = sessionAddress.value
})

// ── Handlers ──────────────────────────────────────────────────────────────────

function onWalletReady(addr: string | null) {
  connectedAddress.value = addr
  step.value = addr ? 3 : 4   // skip faucet if no wallet
}

async function doConnect() {
  connecting.value   = true
  connectError.value = ''
  try {
    const chain = selectedChain.value === 'celo' ? CELO_ALFAJORES : POLYGON_AMOY
    await switchToChain(chain)
    const addr = await requestAccount()
    connectedAddress.value = addr
    step.value = 3
  } catch (e: any) {
    connectError.value = e.message ?? 'Connection failed'
  } finally {
    connecting.value = false
  }
}

async function copyAddr() {
  if (!connectedAddress.value) return
  await navigator.clipboard.writeText(connectedAddress.value)
  addrCopied.value = true
  setTimeout(() => { addrCopied.value = false }, 2000)
}
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */

.ob-page {
  background: #020610;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
}

.ob-stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.ob-star  { position: absolute; border-radius: 50%; background: #ffffff; }

.ob-wrap {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 28px 20px 60px;
  display: flex; flex-direction: column; gap: 24px;
}

/* ── Logo ─────────────────────────────────────────────────────────────────── */

.ob-logo-row { display: flex; align-items: baseline; gap: 12px; }
.ob-logo { text-decoration: none; font-size: 14px; font-weight: 300; letter-spacing: 0.18em; }
.ob-logo-exo   { color: #4dd0e1; }
.ob-logo-topia { color: #90a4ae; }
.ob-tagline { font-size: 9px; letter-spacing: 0.12em; color: rgba(80,140,180,0.50); }

/* ── Step rail ────────────────────────────────────────────────────────────── */

.ob-rail {
  display: flex; align-items: center; gap: 0;
  padding: 10px 14px;
  background: rgba(0,8,22,0.70);
  border: 1px solid rgba(0,80,130,0.18);
  border-radius: 7px;
}

.ob-rail-item {
  display: flex; align-items: center; gap: 6px; flex: 1;
  cursor: default;
  opacity: 0.40;
  transition: opacity 0.16s;
}
.ob-rail-item--done   { opacity: 0.75; cursor: pointer; }
.ob-rail-item--active { opacity: 1.00; }

.ob-rail-dot {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  background: rgba(0,30,70,0.70); border: 1px solid rgba(0,100,160,0.30);
  color: rgba(80,150,200,0.60); font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.ob-rail-item--done   .ob-rail-dot { background: rgba(0,60,40,0.60); border-color: rgba(60,200,120,0.45); color: rgba(80,230,140,0.90); }
.ob-rail-item--active .ob-rail-dot { background: rgba(0,60,130,0.60); border-color: rgba(0,200,255,0.55); color: rgba(0,230,255,0.95); }

.ob-rail-label {
  font-size: 8px; letter-spacing: 0.10em;
  color: rgba(80,140,180,0.60);
  white-space: nowrap; overflow: hidden;
}
.ob-rail-item--active .ob-rail-label { color: rgba(0,210,255,0.80); }

.ob-rail-line {
  flex: 1; height: 1px; background: rgba(0,80,130,0.22); margin: 0 4px;
}

/* ── Card ─────────────────────────────────────────────────────────────────── */

.ob-card {
  background: rgba(0,8,22,0.88);
  border: 1px solid rgba(0,120,180,0.22);
  border-radius: 10px;
  padding: 24px;
  display: flex; flex-direction: column; gap: 18px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.65);
}
.ob-card--ready { border-color: rgba(0,180,220,0.35); }

/* ── Card hero ────────────────────────────────────────────────────────────── */

.ob-card-hero { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.ob-hero-icon { font-size: 44px; line-height: 1; }
.ob-hero-icon--spin { animation: ob-pulse 2.5s ease-in-out infinite; }
@keyframes ob-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }

.ob-card-title {
  font-size: 22px; font-weight: 300; margin: 0;
  color: rgba(210,240,255,0.92); letter-spacing: 0.05em;
}
.ob-card-sub {
  font-size: 11px; color: rgba(120,175,215,0.72);
  line-height: 1.70; max-width: 480px; margin: 0;
}
.ob-card-sub strong { color: rgba(200,230,255,0.85); }

/* ── What you get ─────────────────────────────────────────────────────────── */

.ob-what-you-get { display: flex; flex-direction: column; gap: 10px; }
.ob-wg-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 12px;
  background: rgba(0,15,35,0.60);
  border: 1px solid rgba(0,80,130,0.18);
  border-radius: 6px;
}
.ob-wg-icon   { font-size: 20px; flex-shrink: 0; }
.ob-wg-title  { font-size: 11px; font-weight: 600; color: rgba(200,230,255,0.88); margin-bottom: 3px; }
.ob-wg-desc   { font-size: 9px; color: rgba(110,165,205,0.65); line-height: 1.55; }

/* ── Chain cards ──────────────────────────────────────────────────────────── */

.ob-chain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.ob-chain-card {
  padding: 14px;
  background: rgba(0,12,30,0.70);
  border: 1px solid rgba(0,80,130,0.22);
  border-radius: 7px; cursor: pointer;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.14s, background 0.14s;
}
.ob-chain-card:hover { border-color: rgba(0,180,220,0.35); background: rgba(0,22,50,0.85); }
.ob-chain-card--selected { border-color: rgba(0,210,255,0.60); background: rgba(0,35,80,0.55); }

.ob-chain-head { display: flex; align-items: flex-start; gap: 8px; }
.ob-chain-icon { font-size: 22px; flex-shrink: 0; }
.ob-chain-name { font-size: 12px; font-weight: 600; color: rgba(200,230,255,0.90); }
.ob-chain-tag  { font-size: 7.5px; letter-spacing: 0.08em; color: rgba(80,150,190,0.55); margin-top: 2px; }
.ob-chain-sel  { margin-left: auto; font-size: 14px; color: rgba(0,230,255,0.90); }

.ob-chain-facts { display: flex; flex-wrap: wrap; gap: 4px; }
.ob-chain-fact  {
  font-size: 7.5px; padding: 2px 6px;
  background: rgba(0,40,80,0.45); border: 1px solid rgba(0,100,160,0.22);
  border-radius: 3px; color: rgba(100,165,210,0.70);
}

.ob-chain-mints-label { font-size: 7px; letter-spacing: 0.12em; color: rgba(60,120,160,0.50); }
.ob-chain-mints { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.ob-chain-mint-tag {
  font-size: 7.5px; padding: 1px 6px;
  background: rgba(0,60,30,0.40); border: 1px solid rgba(60,180,100,0.22);
  border-radius: 3px; color: rgba(80,200,130,0.72);
}

/* ── Wallet options ───────────────────────────────────────────────────────── */

.ob-wallet-opts { display: flex; flex-direction: column; gap: 6px; }
.ob-wopt {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px;
  background: rgba(0,12,30,0.65); border: 1px solid rgba(0,80,130,0.20);
  border-radius: 6px; cursor: pointer; text-align: left;
  transition: border-color 0.13s, background 0.13s;
}
.ob-wopt:hover { border-color: rgba(0,160,220,0.35); background: rgba(0,20,48,0.82); }
.ob-wopt--active { border-color: rgba(0,210,255,0.55); background: rgba(0,35,80,0.55); }
.ob-wopt-icon   { font-size: 18px; flex-shrink: 0; padding-top: 1px; }
.ob-wopt-title  { font-size: 11px; font-weight: 600; color: rgba(200,230,255,0.88); margin-bottom: 2px; }
.ob-wopt-note   { font-size: 8.5px; color: rgba(100,155,195,0.60); line-height: 1.45; }

.ob-wopt-content {
  padding: 14px;
  background: rgba(0,8,22,0.75);
  border: 1px solid rgba(0,100,160,0.18);
  border-radius: 6px;
}

/* Injected wallet */
.ob-inject-missing { display: flex; flex-direction: column; gap: 10px; }
.ob-inject-msg { font-size: 9.5px; color: rgba(130,180,215,0.72); line-height: 1.60; }
.ob-inject-links { display: flex; gap: 8px; }
.ob-inject-link {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 8px 12px; text-decoration: none;
  background: rgba(0,25,55,0.60); border: 1px solid rgba(0,120,180,0.25);
  border-radius: 5px; font-size: 10px; color: rgba(160,210,240,0.82);
  transition: border-color 0.13s;
}
.ob-inject-link:hover { border-color: rgba(0,190,240,0.45); }

.ob-inject-found { display: flex; flex-direction: column; gap: 8px; }
.ob-error { font-size: 9px; color: rgba(255,100,80,0.85); }

/* Skip */
.ob-skip-note { font-size: 9.5px; color: rgba(110,165,205,0.68); line-height: 1.65; }

/* ── Faucet ───────────────────────────────────────────────────────────────── */

.ob-faucet-card {
  background: rgba(0,15,35,0.65); border: 1px solid rgba(0,100,160,0.22);
  border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 10px;
}
.ob-faucet-head { display: flex; align-items: flex-start; gap: 10px; }
.ob-faucet-emoji { font-size: 22px; flex-shrink: 0; }
.ob-faucet-chain { font-size: 11px; font-weight: 600; color: rgba(200,230,255,0.88); margin-bottom: 3px; }
.ob-faucet-desc  { font-size: 9px; color: rgba(100,155,195,0.60); }

.ob-address-copy { display: flex; flex-direction: column; gap: 4px; }
.ob-addr-label   { font-size: 7.5px; letter-spacing: 0.10em; color: rgba(0,180,220,0.50); }
.ob-addr-row     { display: flex; align-items: center; gap: 8px; }
.ob-addr-val     { font-size: 9px; color: rgba(0,220,255,0.82); flex: 1; word-break: break-all; }
.ob-copy-btn {
  font-family: 'Courier New', monospace; font-size: 7.5px; letter-spacing: 0.10em;
  color: rgba(0,180,220,0.65); background: none;
  border: 1px solid rgba(0,140,190,0.25); border-radius: 3px;
  padding: 2px 8px; cursor: pointer; flex-shrink: 0;
  transition: color 0.12s, border-color 0.12s;
}
.ob-copy-btn:hover { color: rgba(0,230,255,0.88); border-color: rgba(0,210,240,0.50); }

.ob-faucet-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 10px 16px; text-decoration: none;
  background: rgba(0,55,110,0.45); border: 1px solid rgba(0,160,220,0.38);
  border-radius: 5px; font-size: 10px; color: rgba(0,220,255,0.88); letter-spacing: 0.06em;
  transition: background 0.13s, border-color 0.13s;
}
.ob-faucet-btn:hover { background: rgba(0,80,150,0.60); border-color: rgba(0,230,255,0.55); }

.ob-faucet-steps { display: flex; flex-direction: column; gap: 6px; }
.ob-fs-item { font-size: 9.5px; color: rgba(130,185,220,0.72); padding-left: 8px; }

/* ── Ready ────────────────────────────────────────────────────────────────── */

.ob-ready-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
}
@media (max-width: 520px) {
  .ob-ready-grid { grid-template-columns: 1fr; }
}

.ob-ready-card {
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  padding: 16px 12px; text-decoration: none;
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.22);
  border-radius: 8px; text-align: center;
  transition: border-color 0.14s, background 0.14s, transform 0.12s;
}
.ob-ready-card:hover { border-color: rgba(0,190,240,0.40); background: rgba(0,25,55,0.85); transform: translateY(-2px); }
.ob-ready-card--primary { border-color: rgba(0,180,220,0.40); background: rgba(0,30,70,0.55); }
.ob-ready-card--primary:hover { border-color: rgba(0,230,255,0.65); }

.ob-ready-icon  { font-size: 26px; }
.ob-ready-title { font-size: 11px; font-weight: 600; color: rgba(200,230,255,0.90); }
.ob-ready-desc  { font-size: 8.5px; color: rgba(100,155,195,0.62); line-height: 1.50; }
.ob-ready-badge {
  font-size: 7px; letter-spacing: 0.14em; padding: 2px 8px;
  background: rgba(0,130,200,0.30); border: 1px solid rgba(0,190,240,0.35);
  border-radius: 3px; color: rgba(0,220,255,0.85);
}

.ob-session-note {
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; letter-spacing: 0.08em; color: rgba(60,120,160,0.50);
}

/* ── Nav row ──────────────────────────────────────────────────────────────── */

.ob-nav-row {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(0,60,100,0.20); padding-top: 12px;
}

.ob-skip-link { text-align: center; }
.ob-skip-btn {
  background: none; border: none; cursor: pointer;
  font-family: 'Courier New', monospace; font-size: 8.5px;
  letter-spacing: 0.08em; color: rgba(60,120,160,0.50);
  text-decoration: underline; text-underline-offset: 2px;
}
.ob-skip-btn:hover { color: rgba(0,170,220,0.70); }

.ob-next-btn { font-size: 12px; letter-spacing: 0.08em; padding: 10px 24px; }

/* ── Step transition ──────────────────────────────────────────────────────── */

.ob-step-enter-active { transition: opacity 0.24s ease, transform 0.24s ease; }
.ob-step-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.ob-step-enter-from   { opacity: 0; transform: translateX(18px); }
.ob-step-leave-to     { opacity: 0; transform: translateX(-14px); }
</style>
