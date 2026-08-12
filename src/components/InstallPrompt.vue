<template>
  <q-dialog v-model="open" position="bottom" seamless>
    <q-card class="install-card">
      <q-card-section class="install-card-top">
        <q-avatar rounded size="48px" class="q-mr-sm" :style="featured ? { border: `2px solid ${accentColor}` } : {}">
          <img src="/icons/icon-192x192.png" :alt="featured ? featured.displayName : 'Exotopia'" />
        </q-avatar>
        <div class="install-card-text">
          <div class="install-title">
            {{ featured ? `Add ${featured.displayName} to your home screen` : 'Add Exotopia to your home screen' }}
          </div>
          <div class="install-sub">
            {{ featured ? 'Your settlement, one tap away' : 'Works offline · No app store needed' }}
          </div>
        </div>
        <q-btn flat dense round icon="mdi-close" size="sm" @click="dismiss" class="q-ml-auto" />
      </q-card-section>

      <q-card-section class="install-features">
        <template v-if="isEcoOps">
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
        </template>
        <template v-else>
          <div class="install-feature">
            <q-icon name="mdi-home-circle-outline" size="16px" color="teal-4" />
            <span>Your settlement, accessible offline</span>
          </div>
          <div class="install-feature">
            <q-icon name="mdi-earth" size="16px" color="teal-4" />
            <span>Cached universe data — no re-download every visit</span>
          </div>
          <div class="install-feature">
            <q-icon name="mdi-key-outline" size="16px" color="teal-4" />
            <span>No account required — nothing to lose access to</span>
          </div>
        </template>
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
          icon="mdi-download-circle-outline"
          @click="install"
          :loading="installing"
          :style="{ backgroundColor: accentColor, color: '#fff' }"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSettlements } from 'src/lib/settlements'
import { starterLightColorHex } from 'src/lib/settlement-items'

const route    = useRoute()
const isEcoOps = computed(() => route.path.startsWith('/eco-ops'))

// Settlement branding — was eco-ops-only copy before this component moved out
// of src/components/eco/ to be mounted app-wide. Featured settlement is the
// most recently created one; falls back to generic Exotopia copy/colour for
// a settler with none yet. starterLightColorHex() is the same deterministic
// per-settlement hue already used for the settlement's own starter lantern
// (src/lib/settlement-items.ts) — reused here so "this settlement's colour"
// means the same thing everywhere it appears, not a second palette.
const { settlements } = useSettlements()
const featured = computed(() =>
  [...settlements.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
)
const accentColor = computed(() => featured.value ? starterLightColorHex(featured.value.key) : '#1a73e8')

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
