<template>
  <q-dialog v-model="open" position="bottom" seamless>
    <q-card class="install-card">
      <q-card-section class="install-card-top">
        <q-avatar rounded size="48px" class="q-mr-sm">
          <img src="/icons/icon-192x192.png" alt="Eco Ops" />
        </q-avatar>
        <div class="install-card-text">
          <div class="install-title">Add Eco Ops to your home screen</div>
          <div class="install-sub">Works offline · No app store needed</div>
        </div>
        <q-btn flat dense round icon="mdi-close" size="sm" @click="dismiss" class="q-ml-auto" />
      </q-card-section>

      <q-card-section class="install-features">
        <div class="install-feature">
          <q-icon name="mdi-wifi-off" size="16px" color="teal-4" />
          <span>Submit monitoring records with no signal</span>
        </div>
        <div class="install-feature">
          <q-icon name="mdi-camera-outline" size="16px" color="teal-4" />
          <span>Attach photos, queued until you're back online</span>
        </div>
        <div class="install-feature">
          <q-icon name="mdi-map-outline" size="16px" color="teal-4" />
          <span>Offline map tiles for your monitored sites</span>
        </div>
      </q-card-section>

      <q-card-actions class="install-actions">
        <q-btn
          outline dense
          label="Not now"
          color="grey-5"
          @click="dismiss"
          class="q-mr-sm"
        />
        <q-btn
          unelevated
          label="Add to home screen"
          color="primary"
          icon="mdi-download-circle-outline"
          @click="install"
          :loading="installing"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const open      = ref(false)
const installing = ref(false)

let deferredPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt (): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'eco-ops:install-prompt-dismissed'

function handleBeforeInstallPrompt (e: Event) {
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
  const dismissed = sessionStorage.getItem(DISMISSED_KEY)
  if (!dismissed) {
    // Small delay so the user lands on the page before the prompt appears
    setTimeout(() => { open.value = true }, 3000)
  }
}

function handleAppInstalled () {
  open.value = false
  deferredPrompt = null
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})

function dismiss () {
  open.value = false
  sessionStorage.setItem(DISMISSED_KEY, '1')
}

async function install () {
  if (!deferredPrompt) return
  installing.value = true
  try {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      open.value = false
      deferredPrompt = null
    }
  } finally {
    installing.value = false
  }
}
</script>

<style scoped>
.install-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  border-radius: 16px 16px 0 0;
  background: #111827;
  border-top: 1px solid #1e3a5f;
}

.install-card-top {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.install-card-text { flex: 1; }
.install-title { font-size: 14px; font-weight: 600; color: #e8f4fd; }
.install-sub   { font-size: 11px; color: #7aadcc; margin-top: 1px; }

.install-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.install-feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #b0c8d8;
}

.install-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
</style>
