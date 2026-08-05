import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type WalletChain = 'solana' | 'algorand' | null

export interface WalletState {
  address:   string | null
  chain:     WalletChain
  connected: boolean
  label?:    string
}

export const useWalletStore = defineStore('wallet', () => {
  const address   = ref<string | null>(null)
  const chain     = ref<WalletChain>(null)
  const connected = ref(false)
  const label     = ref<string | null>(null)

  const shortAddress = computed(() =>
    address.value
      ? address.value.slice(0, 6) + '…' + address.value.slice(-4)
      : null
  )

  // ── Stub connect / disconnect ─────────────────────────────────────────────
  // Replace with real wallet adapter (e.g. @solana/wallet-adapter-vue, AlgoSigner)

  async function connectSolana(walletAddress: string, walletLabel = 'Phantom') {
    address.value   = walletAddress
    chain.value     = 'solana'
    connected.value = true
    label.value     = walletLabel
  }

  async function connectAlgorand(walletAddress: string, walletLabel = 'Pera') {
    address.value   = walletAddress
    chain.value     = 'algorand'
    connected.value = true
    label.value     = walletLabel
  }

  function disconnect() {
    address.value   = null
    chain.value     = null
    connected.value = false
    label.value     = null
  }

  return { address, chain, connected, label, shortAddress, connectSolana, connectAlgorand, disconnect }
})
