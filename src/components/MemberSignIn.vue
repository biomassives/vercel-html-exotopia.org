<template>
  <div class="ms-wrap">
    <!-- Already signed in: show profile pill -->
    <div v-if="store.isSignedIn && store.profile" class="ms-pill">
      <span class="ms-avatar" :style="`background:${store.profile.avatar_color}22;border-color:${store.profile.avatar_color}`">
        <span :style="`color:${store.profile.avatar_color}`">{{ initials(store.profile.display_name) }}</span>
      </span>
      <span class="ms-handle">{{ store.profile.display_name }}</span>
      <button class="ms-signout" @click="store.signOut()">sign out</button>
    </div>

    <!-- Signed in but no profile yet: create handle -->
    <div v-else-if="store.isSignedIn && !store.profile" class="ms-form">
      <p class="ms-label">One more step — choose your display name</p>
      <div class="ms-row">
        <input v-model="handle"      class="ms-input" placeholder="handle (e.g. rank)" maxlength="20" />
        <input v-model="displayName" class="ms-input" placeholder="Display name" maxlength="40" />
        <button class="ms-btn" :disabled="!handle || !displayName" @click="createProfile">Save</button>
      </div>
      <p v-if="profileError" class="ms-err">{{ profileError }}</p>
    </div>

    <!-- Not signed in: magic link form -->
    <div v-else class="ms-form">
      <template v-if="!sent">
        <p class="ms-label">Sign in with a magic link — no password needed</p>
        <div class="ms-row">
          <input
            v-model="email"
            class="ms-input"
            type="email"
            placeholder="your@email.com"
            @keyup.enter="send"
          />
          <button class="ms-btn" :disabled="!email || store.loading" @click="send">
            {{ store.loading ? 'Sending…' : 'Send link' }}
          </button>
        </div>
        <p v-if="store.error" class="ms-err">{{ store.error }}</p>
      </template>
      <p v-else class="ms-sent">
        Check your inbox — a sign-in link was sent to <strong>{{ email }}</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore, initials } from 'src/stores/member'
import { useGuestProfile } from 'src/composables/useGuestProfile'

const store       = useMemberStore()
const guestProfile = useGuestProfile()
const email       = ref('')
const sent        = ref(false)
const handle      = ref('')
const displayName = ref('')
const profileError = ref('')

async function send () {
  if (!email.value) return
  const ok = await store.sendMagicLink(email.value)
  if (ok) sent.value = true
}

async function createProfile () {
  // If this browser went through the onboarding wizard's age-attestation
  // step first, carry that bracket over into the real account instead of
  // leaving it stranded in guest-only localStorage (see 018_member_
  // participation_mode.sql's header for why that gap mattered).
  const ok = await store.createProfile(handle.value, displayName.value, guestProfile.profile.value.participationMode)
  if (!ok) profileError.value = 'Handle may already be taken — try another.'
}
</script>

<style scoped lang="scss">
.ms-wrap { font-family: 'Roboto', sans-serif; }

.ms-form { display: flex; flex-direction: column; gap: 10px; }
.ms-label { font-size: 13px; color: #5a6a8a; margin: 0; }
.ms-row   { display: flex; gap: 8px; flex-wrap: wrap; }

.ms-input {
  flex: 1;
  min-width: 180px;
  background: #0a1020;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 8px 12px;
  color: #c8d4e8;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  &::placeholder { color: #3a4a6a; }
  &:focus { border-color: rgba(0,229,255,0.35); }
}

.ms-btn {
  padding: 8px 18px;
  background: rgba(0,229,255,0.08);
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 6px;
  color: #00e5ff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: rgba(0,229,255,0.14); }
  &:disabled { opacity: 0.4; cursor: default; }
}

.ms-err  { font-size: 12px; color: #ff6644; margin: 0; }
.ms-sent { font-size: 13px; color: #44ff88; margin: 0; strong { color: #88ffbb; } }

/* signed-in pill */
.ms-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
}
.ms-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
}
.ms-handle { font-size: 13px; color: #c8d4e8; }
.ms-signout {
  background: none; border: none;
  font-size: 11px; color: #3a4a6a;
  cursor: pointer;
  &:hover { color: #ff6644; }
}
</style>
