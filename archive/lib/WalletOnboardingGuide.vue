<template>
  <!--
    WalletOnboardingGuide.vue
    Step-by-step wallet creation guide for first-time testnet minters.
    Shown when no injected wallet is detected on the Polygon or Celo tabs.

    Design goals:
    - Plain language — no assumed crypto knowledge
    - One action per step — never more than one thing to do at once
    - Non-custodial reminder — user holds their own keys
    - Testnet framing — no real money required for trial minting
    - Deep-links to official wallet installers and faucets
  -->
  <div class="wog-root">

    <!-- Header -->
    <div class="wog-header">
      <div class="wog-badge">
        <q-icon :name="chain.icon" :color="chain.color" size="18px" class="q-mr-xs"/>
        {{ chain.name }}
      </div>
      <div class="wog-title">Create your secure wallet</div>
      <div class="wog-sub">
        You need a crypto wallet to sign transactions on {{ chain.network }}.
        This takes about 3 minutes. <strong>You keep full control — no one else
        can access your wallet or funds.</strong>
      </div>
    </div>

    <!-- Step progress bar -->
    <div class="wog-progress">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="wog-pip"
        :class="{
          'wog-pip--done':   i < activeStep,
          'wog-pip--active': i === activeStep,
        }"
        @click="activeStep = i"
      >
        <span class="wog-pip__num">{{ i + 1 }}</span>
        <span class="wog-pip__label">{{ step.label }}</span>
      </div>
    </div>

    <!-- Active step card -->
    <Transition name="wog-slide" mode="out-in">
      <div class="wog-step-card" :key="activeStep">

        <!-- Step icon + title -->
        <div class="wog-step-head">
          <div class="wog-step-icon">{{ steps[activeStep].emoji }}</div>
          <div>
            <div class="wog-step-title">{{ steps[activeStep].title }}</div>
            <div class="wog-step-desc">{{ steps[activeStep].desc }}</div>
          </div>
        </div>

        <!-- Detail content — varies per step -->

        <!-- STEP 0: Install wallet -->
        <template v-if="activeStep === 0">
          <div class="wog-wallet-options">
            <a
              v-for="w in chain.wallets"
              :key="w.name"
              :href="w.url"
              target="_blank"
              rel="noopener noreferrer"
              class="wog-wallet-btn"
            >
              <img :src="w.logo" :alt="w.name" class="wog-wallet-logo" @error="onImgErr"/>
              <div class="wog-wallet-info">
                <div class="wog-wallet-name">{{ w.name }}</div>
                <div class="wog-wallet-note">{{ w.note }}</div>
              </div>
              <q-icon name="open_in_new" size="12px" color="blue-grey-5" class="q-ml-auto"/>
            </a>
          </div>
          <div class="wog-tip">
            <q-icon name="info_outline" size="12px" color="cyan-7" class="q-mr-xs"/>
            Install the browser extension or mobile app. Both work — browser is easier for desktop minting.
          </div>
        </template>

        <!-- STEP 1: Create account / seed phrase -->
        <template v-if="activeStep === 1">
          <div class="wog-checklist">
            <div class="wog-check-item" v-for="c in seedPhraseChecklist" :key="c">
              <q-icon name="check_circle_outline" size="14px" color="cyan-7" class="q-mr-sm flex-shrink-0"/>
              {{ c }}
            </div>
          </div>
          <div class="wog-warning">
            <q-icon name="warning_amber" size="14px" color="amber-6" class="q-mr-xs"/>
            <strong>Never share your seed phrase with anyone</strong> — not with Exotopia,
            PON INK, or any support person. Anyone who asks for it is attempting theft.
          </div>
        </template>

        <!-- STEP 2: Add testnet network -->
        <template v-if="activeStep === 2">
          <div class="wog-network-card">
            <div class="wog-net-row">
              <span class="wog-net-k">Network name</span>
              <span class="wog-net-v">{{ chain.chainData.name }}</span>
              <button class="wog-copy-btn" @click="copy(chain.chainData.name)">copy</button>
            </div>
            <div class="wog-net-row">
              <span class="wog-net-k">RPC URL</span>
              <span class="wog-net-v">{{ chain.chainData.rpcUrls[0] }}</span>
              <button class="wog-copy-btn" @click="copy(chain.chainData.rpcUrls[0])">copy</button>
            </div>
            <div class="wog-net-row">
              <span class="wog-net-k">Chain ID</span>
              <span class="wog-net-v">{{ chain.chainData.chainId }}</span>
              <button class="wog-copy-btn" @click="copy(String(chain.chainData.chainId))">copy</button>
            </div>
            <div class="wog-net-row">
              <span class="wog-net-k">Currency symbol</span>
              <span class="wog-net-v">{{ chain.chainData.nativeCurrency.symbol }}</span>
              <button class="wog-copy-btn" @click="copy(chain.chainData.nativeCurrency.symbol)">copy</button>
            </div>
            <div class="wog-net-row">
              <span class="wog-net-k">Block explorer</span>
              <span class="wog-net-v">{{ chain.chainData.blockExplorer }}</span>
              <button class="wog-copy-btn" @click="copy(chain.chainData.blockExplorer)">copy</button>
            </div>
          </div>
          <div class="wog-tip">
            <q-icon name="info_outline" size="12px" color="cyan-7" class="q-mr-xs"/>
            In MetaMask or Celo Wallet: Settings → Networks → Add network → paste each field above.
            Some wallets can detect and add the network automatically when you first mint.
          </div>
          <!-- Auto-add button if MetaMask is present -->
          <q-btn
            v-if="hasWallet"
            unelevated dense rounded
            :color="chain.btnColor"
            icon="add_circle_outline"
            :label="`Auto-add ${chain.chainData.shortName} network`"
            class="q-mt-sm"
            @click="$emit('addNetwork')"
          />
        </template>

        <!-- STEP 3: Get testnet tokens from faucet -->
        <template v-if="activeStep === 3">
          <div class="wog-faucet-card">
            <div class="wog-faucet-row">
              <div class="wog-faucet-icon">🚰</div>
              <div>
                <div class="wog-faucet-title">{{ chain.chainData.name }} Faucet</div>
                <div class="wog-faucet-desc">
                  A faucet gives you free testnet tokens so you can pay transaction fees
                  during testing. These tokens have no real-world value.
                </div>
              </div>
            </div>
            <a
              :href="chain.chainData.testFaucet"
              target="_blank"
              rel="noopener noreferrer"
              class="wog-faucet-link"
            >
              Open faucet — get free {{ chain.chainData.nativeCurrency.symbol }}
              <q-icon name="open_in_new" size="12px" class="q-ml-xs"/>
            </a>
          </div>
          <div class="wog-tip">
            <q-icon name="info_outline" size="12px" color="cyan-7" class="q-mr-xs"/>
            Paste your wallet address into the faucet. Tokens arrive in ~30 seconds.
            You only need a small amount — minting costs a few cents in test tokens.
          </div>
          <div class="wog-address-hint">
            Your address is the long <code>0x…</code> string shown at the top of your wallet app.
            It is safe to share — it only allows people to <em>send</em> to you, never to withdraw.
          </div>
        </template>

        <!-- STEP 4: Connect and mint -->
        <template v-if="activeStep === 4">
          <div class="wog-ready-card">
            <div class="wog-ready-icon">🎉</div>
            <div class="wog-ready-text">
              You're set. Click the button below to connect your wallet to this page —
              your browser will open a small confirmation pop-up from the wallet extension.
              Approve it and you're ready to mint.
            </div>
          </div>
          <div class="wog-tip" v-if="!hasWallet">
            <q-icon name="warning_amber" size="12px" color="amber-6" class="q-mr-xs"/>
            No wallet extension detected yet. Make sure you've installed it and refreshed this page.
          </div>
          <q-btn
            v-if="hasWallet"
            unelevated rounded
            :color="chain.btnColor"
            icon="account_balance_wallet"
            label="Connect wallet"
            class="full-width wog-connect-btn"
            @click="$emit('connect')"
          />
        </template>

        <!-- Step navigation -->
        <div class="wog-step-nav">
          <q-btn
            flat dense rounded size="sm" color="blue-grey-5"
            icon="chevron_left" label="Back"
            :disable="activeStep === 0"
            @click="activeStep--"
          />
          <div class="wog-step-counter">{{ activeStep + 1 }} / {{ steps.length }}</div>
          <q-btn
            v-if="activeStep < steps.length - 1"
            flat dense rounded size="sm"
            :color="chain.color"
            label="Next" icon-right="chevron_right"
            @click="activeStep++"
          />
        </div>

      </div>
    </Transition>

    <!-- Browser wallet option — create without installing anything -->
    <div class="wog-browser-wallet-row">
      <div class="wog-bw-divider">
        <span class="wog-bw-or">or</span>
      </div>
      <div class="wog-bw-card" @click="showBrowserWallet = !showBrowserWallet">
        <span class="wog-bw-icon">🔐</span>
        <div class="wog-bw-body">
          <div class="wog-bw-title">Create a wallet directly in this browser</div>
          <div class="wog-bw-note">No extension needed · encrypted with your password · best for testnet only</div>
        </div>
        <q-icon :name="showBrowserWallet ? 'expand_less' : 'expand_more'" size="16px" color="blue-grey-5"/>
      </div>

      <Transition name="wog-slide">
        <div v-if="showBrowserWallet" class="wog-bw-content">
          <!-- Show create wizard or unlock depending on stored state -->
          <BrowserWalletCreate v-if="!hasBrowserWallet" @done="onBrowserDone"/>
          <BrowserWalletUnlock v-else @unlocked="onBrowserDone" @deleted="hasBrowserWallet = false"/>
        </div>
      </Transition>
    </div>

    <!-- Already have an injected wallet? -->
    <div class="wog-existing">
      Already have MetaMask or Valora installed?
      <button class="wog-skip" @click="$emit('connect')">Connect it now →</button>
    </div>

    <!-- Copied snackbar -->
    <q-snackbar v-model="showCopied" :timeout="1500" position="bottom-right" color="dark">
      Copied to clipboard
    </q-snackbar>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { EvmChain } from '../../lib/chains/evm/chains'
import BrowserWalletCreate from 'src/components/BrowserWalletCreate.vue'
import BrowserWalletUnlock from 'src/components/BrowserWalletUnlock.vue'
import { hasStoredWallet  } from './browser-wallet'

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  chainId:  'polygon' | 'celo'
  chainData: EvmChain
  hasWallet: boolean
}>()

const emit = defineEmits<{
  (e: 'connect'): void
  (e: 'addNetwork'): void
  (e: 'browserWalletReady', address: string): void
}>()

// ── Chain-specific display config ─────────────────────────────────────────────

const CHAIN_CONFIG = {
  polygon: {
    name:     'Polygon Amoy Testnet',
    network:  'Polygon',
    color:    'purple-4',
    btnColor: 'purple-7',
    icon:     'mdi-polygon',
    wallets: [
      {
        name: 'MetaMask',
        url:  'https://metamask.io/download/',
        logo: 'https://raw.githubusercontent.com/MetaMask/brand-resources/main/SVG/SVG_MetaMask_Icon_Color.svg',
        note: 'Most popular · browser + mobile · supports all EVM chains',
      },
      {
        name: 'Coinbase Wallet',
        url:  'https://www.coinbase.com/wallet/downloads',
        logo: 'https://raw.githubusercontent.com/coinbase/coinbase-wallet-sdk/main/assets/images/coinbase-wallet-logo.png',
        note: 'Beginner-friendly · browser + mobile',
      },
    ],
  },
  celo: {
    name:     'Celo Alfajores Testnet',
    network:  'Celo',
    color:    'green-4',
    btnColor: 'green-7',
    icon:     'mdi-circle-multiple',
    wallets: [
      {
        name: 'MetaMask',
        url:  'https://metamask.io/download/',
        logo: 'https://raw.githubusercontent.com/MetaMask/brand-resources/main/SVG/SVG_MetaMask_Icon_Color.svg',
        note: 'Works with Celo · add the network manually using the details below',
      },
      {
        name: 'Valora',
        url:  'https://valoraapp.com/',
        logo: 'https://valoraapp.com/favicon.png',
        note: 'Celo-native mobile wallet · designed for East Africa · M-Pesa integration',
      },
    ],
  },
}

const chain = {
  ...CHAIN_CONFIG[props.chainId],
  chainData: props.chainData,
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const steps = [
  { label: 'Install',  emoji: '📲', title: 'Install a wallet app',
    desc:  `Choose and install a browser extension or mobile wallet that supports ${chain.network}.` },
  { label: 'Account',  emoji: '🔑', title: 'Create your account & back up your seed phrase',
    desc:  'The wallet will generate a 12-word recovery phrase. This is your key — keep it offline and private.' },
  { label: 'Network',  emoji: '🌐', title: `Add the ${chain.name} network`,
    desc:  'Testnets are separate from mainnet. You need to tell your wallet which testnet to use.' },
  { label: 'Tokens',   emoji: '🚰', title: 'Get free testnet tokens from the faucet',
    desc:  'Testnet tokens pay transaction fees. They have no real-world value — this costs you nothing.' },
  { label: 'Connect',  emoji: '✅', title: "You're ready to mint",
    desc:  'Connect your wallet to this page and start minting your first Exotopia NFT.' },
]

const activeStep = ref(0)

// ── Seed phrase checklist ─────────────────────────────────────────────────────

const seedPhraseChecklist = [
  'Write your 12-word phrase on paper — do not screenshot it',
  'Store the paper somewhere physically secure (drawer, safe)',
  'Confirm the phrase when the wallet asks you to verify it',
  'If you lose this phrase and lose access to your device, your wallet cannot be recovered',
]

// ── Browser wallet state ──────────────────────────────────────────────────────

const showBrowserWallet = ref(false)
const hasBrowserWallet  = ref(false)

onMounted(async () => {
  hasBrowserWallet.value = await hasStoredWallet()
  if (hasBrowserWallet.value) showBrowserWallet.value = true
})

function onBrowserDone(address: string) {
  emit('browserWalletReady', address)
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

const showCopied = ref(false)

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showCopied.value = true
  } catch { /* ignore */ }
}

// ── Image fallback ────────────────────────────────────────────────────────────

function onImgErr(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────────── */

.wog-root {
  font-family: 'Courier New', monospace;
  max-width: 540px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */

.wog-header { display: flex; flex-direction: column; gap: 5px; }

.wog-badge {
  display: inline-flex;
  align-items: center;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: rgba(100, 160, 200, 0.70);
  background: rgba(0, 30, 60, 0.40);
  border: 1px solid rgba(0, 140, 200, 0.22);
  border-radius: 3px;
  padding: 2px 8px;
  width: fit-content;
}

.wog-title {
  font-size: 17px;
  font-weight: 300;
  color: rgba(210, 235, 255, 0.92);
  letter-spacing: 0.05em;
}

.wog-sub {
  font-size: 10px;
  color: rgba(130, 175, 215, 0.68);
  line-height: 1.65;
}
.wog-sub strong { color: rgba(200, 230, 255, 0.82); }

/* ── Progress bar ──────────────────────────────────────────────────────────── */

.wog-progress {
  display: flex;
  gap: 0;
  border: 1px solid rgba(0, 100, 160, 0.20);
  border-radius: 5px;
  overflow: hidden;
}

.wog-pip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 7px 4px 5px;
  cursor: pointer;
  background: rgba(0, 10, 25, 0.60);
  border-right: 1px solid rgba(0, 80, 130, 0.18);
  transition: background 0.14s;
  user-select: none;
}
.wog-pip:last-child { border-right: none; }
.wog-pip:hover { background: rgba(0, 25, 50, 0.80); }
.wog-pip--done { background: rgba(0, 40, 70, 0.50); }
.wog-pip--done .wog-pip__num { background: rgba(60, 200, 130, 0.22); color: rgba(80, 230, 140, 0.85); }
.wog-pip--active { background: rgba(0, 50, 100, 0.60); }
.wog-pip--active .wog-pip__num { background: rgba(0, 120, 200, 0.35); color: rgba(0, 200, 255, 0.92); }

.wog-pip__num {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(0, 50, 90, 0.40);
  color: rgba(80, 140, 180, 0.60);
  font-size: 9px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}

.wog-pip__label {
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(80, 140, 180, 0.55);
}
.wog-pip--active .wog-pip__label { color: rgba(0, 200, 255, 0.75); }
.wog-pip--done   .wog-pip__label { color: rgba(80, 220, 140, 0.65); }

/* ── Step card ───────────────────────────────────────────────────────────────── */

.wog-step-card {
  background: rgba(0, 8, 22, 0.80);
  border: 1px solid rgba(0, 120, 180, 0.22);
  border-radius: 7px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wog-step-head { display: flex; align-items: flex-start; gap: 12px; }
.wog-step-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }

.wog-step-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(200, 235, 255, 0.90);
  letter-spacing: 0.05em;
  margin-bottom: 3px;
}

.wog-step-desc {
  font-size: 9px;
  color: rgba(120, 170, 210, 0.65);
  line-height: 1.60;
}

/* ── Wallet options ──────────────────────────────────────────────────────────── */

.wog-wallet-options { display: flex; flex-direction: column; gap: 8px; }

.wog-wallet-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0, 15, 35, 0.70);
  border: 1px solid rgba(0, 100, 160, 0.22);
  border-radius: 5px;
  text-decoration: none;
  transition: border-color 0.13s, background 0.13s;
  cursor: pointer;
}
.wog-wallet-btn:hover {
  border-color: rgba(0, 180, 240, 0.40);
  background: rgba(0, 25, 55, 0.85);
}

.wog-wallet-logo {
  width: 32px; height: 32px;
  border-radius: 6px;
  object-fit: contain;
  flex-shrink: 0;
  background: rgba(255,255,255,0.08);
}

.wog-wallet-name {
  font-size: 11px;
  font-weight: 600;
  color: rgba(200, 230, 255, 0.88);
  margin-bottom: 2px;
}
.wog-wallet-note {
  font-size: 8.5px;
  color: rgba(100, 155, 195, 0.60);
  line-height: 1.45;
}

/* ── Tip / warning ───────────────────────────────────────────────────────────── */

.wog-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0, 30, 60, 0.40);
  border-left: 2px solid rgba(0, 180, 220, 0.35);
  border-radius: 0 4px 4px 0;
  font-size: 9px;
  color: rgba(130, 185, 220, 0.75);
  line-height: 1.55;
}

.wog-warning {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(60, 30, 0, 0.40);
  border-left: 2px solid rgba(220, 160, 40, 0.55);
  border-radius: 0 4px 4px 0;
  font-size: 9px;
  color: rgba(220, 185, 100, 0.80);
  line-height: 1.55;
}
.wog-warning strong { color: rgba(240, 200, 80, 0.90); }

.wog-checklist { display: flex; flex-direction: column; gap: 6px; }

.wog-check-item {
  display: flex;
  align-items: flex-start;
  font-size: 9.5px;
  color: rgba(160, 210, 240, 0.80);
  line-height: 1.55;
}

/* ── Network card ─────────────────────────────────────────────────────────── */

.wog-network-card {
  background: rgba(0, 12, 28, 0.70);
  border: 1px solid rgba(0, 100, 160, 0.22);
  border-radius: 5px;
  overflow: hidden;
}

.wog-net-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 60, 100, 0.20);
  font-size: 9px;
}
.wog-net-row:last-child { border-bottom: none; }
.wog-net-k { color: rgba(70, 130, 170, 0.60); flex-shrink: 0; min-width: 100px; }
.wog-net-v { color: rgba(180, 220, 245, 0.85); flex: 1; word-break: break-all; }

.wog-copy-btn {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(0, 180, 220, 0.60);
  background: none;
  border: 1px solid rgba(0, 140, 190, 0.22);
  border-radius: 3px;
  padding: 1px 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.12s, border-color 0.12s;
}
.wog-copy-btn:hover { color: rgba(0, 220, 255, 0.85); border-color: rgba(0, 200, 240, 0.45); }

/* ── Faucet card ─────────────────────────────────────────────────────────── */

.wog-faucet-card {
  background: rgba(0, 18, 35, 0.65);
  border: 1px solid rgba(0, 100, 160, 0.20);
  border-radius: 5px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wog-faucet-row { display: flex; align-items: flex-start; gap: 10px; }
.wog-faucet-icon { font-size: 22px; flex-shrink: 0; line-height: 1; }
.wog-faucet-title { font-size: 11px; font-weight: 600; color: rgba(200, 230, 255, 0.88); margin-bottom: 3px; }
.wog-faucet-desc  { font-size: 9px; color: rgba(110, 165, 205, 0.65); line-height: 1.55; }

.wog-faucet-link {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 50, 100, 0.40);
  border: 1px solid rgba(0, 160, 220, 0.35);
  border-radius: 4px;
  text-decoration: none;
  font-size: 9.5px;
  color: rgba(0, 210, 255, 0.85);
  letter-spacing: 0.06em;
  transition: background 0.13s, border-color 0.13s;
}
.wog-faucet-link:hover { background: rgba(0, 80, 140, 0.55); border-color: rgba(0, 230, 255, 0.55); }

.wog-address-hint {
  font-size: 8.5px;
  color: rgba(100, 155, 190, 0.60);
  line-height: 1.60;
}
.wog-address-hint code {
  background: rgba(0, 30, 60, 0.50);
  border-radius: 3px;
  padding: 1px 4px;
  color: rgba(0, 200, 255, 0.75);
}
.wog-address-hint em { color: rgba(80, 220, 140, 0.75); font-style: normal; }

/* ── Ready card ──────────────────────────────────────────────────────────── */

.wog-ready-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  background: rgba(0, 40, 20, 0.35);
  border: 1px solid rgba(60, 200, 110, 0.28);
  border-radius: 5px;
}
.wog-ready-icon { font-size: 28px; flex-shrink: 0; }
.wog-ready-text { font-size: 10px; color: rgba(160, 220, 190, 0.82); line-height: 1.65; }

.wog-connect-btn { font-size: 11px; letter-spacing: 0.08em; margin-top: 4px; }

/* ── Step nav ──────────────────────────────────────────────────────────────── */

.wog-step-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(0, 60, 100, 0.20);
  padding-top: 10px;
}

.wog-step-counter {
  font-size: 8px;
  color: rgba(60, 110, 150, 0.55);
  letter-spacing: 0.10em;
}

/* ── Browser wallet inline section ──────────────────────────────────────── */

.wog-browser-wallet-row { display: flex; flex-direction: column; gap: 6px; }

.wog-bw-divider {
  display: flex; align-items: center; gap: 10px;
}
.wog-bw-divider::before, .wog-bw-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(0,80,130,0.22);
}
.wog-bw-or {
  font-family: 'Courier New', monospace;
  font-size: 8px; letter-spacing: 0.12em; color: rgba(60,110,150,0.50);
}

.wog-bw-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: rgba(0,12,30,0.65);
  border: 1px solid rgba(0,100,160,0.20); border-radius: 5px;
  cursor: pointer; transition: border-color 0.13s, background 0.13s;
  user-select: none;
}
.wog-bw-card:hover { border-color: rgba(0,180,220,0.35); background: rgba(0,20,50,0.78); }

.wog-bw-icon  { font-size: 20px; flex-shrink: 0; }
.wog-bw-body  { flex: 1; }
.wog-bw-title { font-size: 10.5px; color: rgba(200,230,255,0.88); margin-bottom: 2px; }
.wog-bw-note  { font-size: 8px; color: rgba(100,155,195,0.58); letter-spacing: 0.04em; }

.wog-bw-content {
  padding: 14px;
  background: rgba(0,8,22,0.80);
  border: 1px solid rgba(0,100,160,0.18);
  border-radius: 5px;
}

/* ── Existing wallet ─────────────────────────────────────────────────────── */

.wog-existing {
  font-size: 9px;
  color: rgba(80, 130, 170, 0.55);
  text-align: center;
  letter-spacing: 0.06em;
}

.wog-skip {
  background: none;
  border: none;
  color: rgba(0, 180, 220, 0.70);
  font-family: 'Courier New', monospace;
  font-size: 9px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.12s;
}
.wog-skip:hover { color: rgba(0, 230, 255, 0.88); }

/* ── Transition ──────────────────────────────────────────────────────────── */

.wog-slide-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.wog-slide-leave-active { transition: opacity 0.14s ease, transform 0.14s ease; }
.wog-slide-enter-from   { opacity: 0; transform: translateX(12px); }
.wog-slide-leave-to     { opacity: 0; transform: translateX(-8px); }
</style>
