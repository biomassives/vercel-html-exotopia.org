import { ref, computed, watch } from 'vue'

export type ParticipationMode =
  | 'adult_individual'   // solo adult, all features
  | 'group_member'       // adult joining a coordinator's group
  | 'youth_participant'  // minor or student under educator accountability

export interface GuestProfile {
  guestId:            string
  displayName:        string
  selectedRole:       string | null
  selectedCommunity:  string | null
  participationMode:  ParticipationMode | null
  groupInviteCode:    string            // optional — can be blank
  onboardingStep:     number
  onboardingComplete: boolean
  createdAt:          string
}

const STORAGE_KEY = 'scd_guest_profile'

function newGuestId (): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function load (): GuestProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as GuestProfile
  } catch { /* ignore */ }
  return {
    guestId:            newGuestId(),
    displayName:        '',
    selectedRole:       null,
    selectedCommunity:  null,
    participationMode:  null,
    groupInviteCode:    '',
    onboardingStep:     0,
    onboardingComplete: false,
    createdAt:          new Date().toISOString(),
  }
}

function save (profile: GuestProfile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch { /* quota */ }
}

// Singleton — one reactive profile shared across the app
const profile = ref<GuestProfile>(load())

watch(profile, (p) => save(p), { deep: true })

export function useGuestProfile () {
  const isYouthMode = computed(
    () => profile.value.participationMode === 'youth_participant'
  )

  function update (patch: Partial<Omit<GuestProfile, 'guestId' | 'createdAt'>>) {
    profile.value = { ...profile.value, ...patch }
  }

  function complete () {
    profile.value.onboardingComplete = true
  }

  function clear () {
    profile.value = {
      guestId:            profile.value.guestId, // keep stable identity
      displayName:        '',
      selectedRole:       null,
      selectedCommunity:  null,
      participationMode:  null,
      groupInviteCode:    '',
      onboardingStep:     0,
      onboardingComplete: false,
      createdAt:          profile.value.createdAt,
    }
  }

  // Called after Supabase account creation — write the guest profile to the DB
  // Returns the payload to upsert into eco_ops.profiles (or public.profiles)
  function accountPayload () {
    return {
      guest_id:           profile.value.guestId,
      display_name:       profile.value.displayName,
      role:               profile.value.selectedRole,
      community_id:       profile.value.selectedCommunity,
      participation_mode: profile.value.participationMode,
      group_invite_code:  profile.value.groupInviteCode || null,
      onboarding_source:  'onboard_wizard',
    }
  }

  return { profile, isYouthMode, update, complete, clear, accountPayload }
}
