<template>
  <div class="bwu-root">

    <!-- Anti-phishing confirmation -->
    <div class="bwu-phish-row" v-if="antiPhishWord">
      <q-icon name="verified_user" size="14px" color="green-5" class="q-mr-xs"/>
      <span class="bwu-phish-label">Your anti-phishing word:</span>
      <span class="bwu-phish-word">{{ antiPhishWord }}</span>
    </div>

    <div class="bwu-address-row" v-if="storedAddress">
      <q-icon name="account_balance_wallet" size="12px" color="cyan-6" class="q-mr-xs"/>
      <span class="bwu-addr">{{ storedAddress.slice(0,8) }}…{{ storedAddress.slice(-6) }}</span>
    </div>

    <q-input
      v-model="password"
      label="Wallet password"
      :type="showPw ? 'text' : 'password'"
      dark dense outlined
      autocomplete="current-password"
      :error="!!error"
      :error-message="error"
      @keyup.enter="doUnlock"
    >
      <template #append>
        <q-icon :name="showPw ? 'visibility_off' : 'visibility'"
          class="cursor-pointer" @click="showPw = !showPw"/>
      </template>
    </q-input>

    <div class="bwu-actions">
      <q-btn unelevated rounded color="cyan-8"
        icon="lock_open" label="Unlock wallet"
        :loading="unlocking" :disable="!password"
        class="col" @click="doUnlock"/>
      <q-btn flat dense rounded size="sm" color="red-4"
        icon="delete_outline" label="Delete wallet"
        @click="confirmDelete = true" class="q-ml-xs"/>
    </div>

    <div class="bwu-timeout-note">
      Session expires after {{ timeoutMin }} min of inactivity
    </div>

    <!-- Delete confirmation dialog -->
    <q-dialog v-model="confirmDelete">
      <q-card class="glass-card" style="min-width:300px">
        <q-card-section>
          <div class="text-subtitle2 text-red-4">⚠ Delete wallet permanently?</div>
          <div class="text-caption text-blue-grey-4 q-mt-sm">
            This removes the encrypted key from this browser.
            Only do this if you have your seed phrase safely backed up.
            There is NO recovery path without the seed phrase.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" v-close-popup/>
          <q-btn unelevated color="red-7" label="Delete forever" @click="doDelete"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  unlockWallet, WrongPasswordError,
  getStoredAddress, getAntiPhishWord,
  deleteStoredWallet,
  SESSION_TIMEOUT_MS,
  unlocking,
} from './browser-wallet'

const emit = defineEmits<{
  (e: 'unlocked', address: string): void
  (e: 'deleted'): void
}>()

const password      = ref('')
const showPw        = ref(false)
const error         = ref('')
const storedAddress = ref<string | null>(null)
const antiPhishWord = ref<string | null>(null)
const confirmDelete = ref(false)

const timeoutMin = computed(() => Math.round(SESSION_TIMEOUT_MS / 60000))

onMounted(async () => {
  storedAddress.value = await getStoredAddress()
  antiPhishWord.value = await getAntiPhishWord()
})

async function doUnlock() {
  if (!password.value) return
  error.value = ''
  try {
    const addr = await unlockWallet(password.value)
    password.value = ''   // clear from memory
    emit('unlocked', addr)
  } catch (e) {
    if (e instanceof WrongPasswordError) {
      error.value = 'Incorrect password'
    } else {
      error.value = (e as Error).message
    }
  }
}

async function doDelete() {
  confirmDelete.value = false
  await deleteStoredWallet()
  emit('deleted')
}
</script>

<style scoped>
.bwu-root { display: flex; flex-direction: column; gap: 10px; font-family: 'Courier New', monospace; }

.bwu-phish-row {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: rgba(0,40,20,0.40); border: 1px solid rgba(60,200,110,0.25); border-radius: 4px;
  font-size: 9px;
}
.bwu-phish-label { color: rgba(80,190,130,0.60); }
.bwu-phish-word  { color: rgba(100,230,150,0.90); font-weight: 600; letter-spacing: 0.06em; }

.bwu-address-row { display: flex; align-items: center; font-size: 8.5px; color: rgba(80,160,200,0.60); }
.bwu-addr { font-family: 'Courier New', monospace; color: rgba(0,200,240,0.75); }

.bwu-actions { display: flex; align-items: center; }

.bwu-timeout-note {
  font-size: 7.5px; color: rgba(60,110,150,0.50); letter-spacing: 0.08em; text-align: center;
}
</style>
