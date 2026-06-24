<template>
  <Transition name="wo-fade">
    <div v-if="visible" class="welcome-overlay" @click.stop>

      <button class="wo-close" aria-label="Close" @click="dismiss">✕</button>

      <!-- ── NEW VISITOR ──────────────────────────────────────────────── -->
      <template v-if="role === 'visitor'">
        <div class="wo-header">
          <div class="wo-badge">EXOTOPIA</div>
          <div class="wo-title">The navigable universe.</div>
          <div class="wo-sub">
            Every confirmed exoplanet is a settlement address.<br>
            Every eco-ops check-in earns virtual real estate.
          </div>
        </div>
        <div class="wo-scale-note">
          {{ clusterCount }} galaxy clusters · {{ planetCount }} exoplanets · HYG {{ starCount }} stars
        </div>
        <div class="wo-actions">
          <button class="wo-btn wo-btn--primary" @click="explore">
            EXPLORE UNIVERSE
          </button>
          <button class="wo-btn" @click="router.push('/onboard')">
            GET STARTED
          </button>
          <button class="wo-btn wo-btn--ghost" @click="router.push('/planet-systems')">
            SETTLEMENT GUIDE
          </button>
        </div>
        <div class="wo-footer-note">
          Scale 1 unit = 15 Mpc · XMM-Newton · NASA ExA · HYG v3
        </div>
      </template>

      <!-- ── RETURNING SETTLER ────────────────────────────────────────── -->
      <template v-else-if="role === 'settler'">
        <div class="wo-header">
          <div class="wo-badge wo-badge--teal">WELCOME BACK</div>
          <div class="wo-title">Your settlement</div>
          <div class="wo-settlement-card">
            <div class="wsc-name">{{ primarySettlement?.displayName ?? primarySettlement?.planetName }}</div>
            <div class="wsc-host">{{ primarySettlement?.hostname }}</div>
            <div class="wsc-meta">
              <span v-if="primarySettlement?.type" class="wsc-type">{{ primarySettlement.type }}</span>
            </div>
          </div>
          <div v-if="settlements.length > 1" class="wo-sub">
            +{{ settlements.length - 1 }} other settlement{{ settlements.length > 2 ? 's' : '' }}
          </div>
        </div>
        <div class="wo-actions">
          <button class="wo-btn wo-btn--primary" @click="enterSettlement">
            ENTER SETTLEMENT
          </button>
          <button class="wo-btn" @click="explore">
            EXPLORE UNIVERSE
          </button>
        </div>
      </template>

      <!-- ── ARTIST REFERRAL ──────────────────────────────────────────── -->
      <template v-else-if="role === 'artist'">
        <div class="wo-header">
          <div class="wo-badge wo-badge--violet">ORBITAL GALLERY</div>
          <div class="wo-title">Your work, in orbit.</div>
          <div class="wo-sub">
            Artists earn a gallery level above their settlement dome.<br>
            Mint an NFT — it appears in your orbital gallery.
          </div>
        </div>
        <div class="wo-tier-list">
          <div class="wo-tier">
            <span class="wt-dot wt-dot--surface" />
            <span class="wt-label">Surface</span>
            <span class="wt-desc">settlement dome · ground level</span>
          </div>
          <div class="wo-tier wo-tier--active">
            <span class="wt-dot wt-dot--orbital" />
            <span class="wt-label">Orbital</span>
            <span class="wt-desc">gallery ring · artist tier</span>
          </div>
          <div class="wo-tier">
            <span class="wt-dot wt-dot--cluster" />
            <span class="wt-label">Cluster</span>
            <span class="wt-desc">curator edition</span>
          </div>
          <div class="wo-tier">
            <span class="wt-dot wt-dot--cosmic" />
            <span class="wt-label">Cosmic</span>
            <span class="wt-desc">foundational collector</span>
          </div>
        </div>
        <div class="wo-actions">
          <button class="wo-btn wo-btn--primary" @click="router.push('/gallery')">
            BROWSE GALLERY LEVELS
          </button>
          <button class="wo-btn" @click="router.push('/mint')">
            MINT NOW
          </button>
          <button class="wo-btn wo-btn--ghost" @click="explore">
            EXPLORE FIRST
          </button>
        </div>
      </template>

      <!-- ── FACILITATOR REFERRAL ─────────────────────────────────────── -->
      <template v-else-if="role === 'facilitator'">
        <div class="wo-header">
          <div class="wo-badge wo-badge--amber">HOST A SESSION</div>
          <div class="wo-title">Your workshop dome.</div>
          <div class="wo-sub">
            Sessions held in your settlement dome issue POAPs to every attendee.
            Participants earn eco-ops credit for attendance.
          </div>
        </div>
        <div class="wo-feature-list">
          <div class="wo-feature">⬡ Virtual amphitheatre dome</div>
          <div class="wo-feature">⬡ POAP issuance for attendees</div>
          <div class="wo-feature">⬡ Session archive in settlement library</div>
          <div class="wo-feature">⬡ pon.ink stream integration</div>
        </div>
        <div class="wo-actions">
          <button class="wo-btn wo-btn--primary" @click="router.push('/planet-systems')">
            VIEW MY DOME
          </button>
          <button class="wo-btn wo-btn--ghost" @click="explore">
            EXPLORE UNIVERSE
          </button>
        </div>
      </template>

      <!-- ── ECO EDUCATOR REFERRAL ────────────────────────────────────── -->
      <template v-else-if="role === 'educator'">
        <div class="wo-header">
          <div class="wo-badge wo-badge--green">FIELD DATA NODE</div>
          <div class="wo-title">Your settlement tracks real work.</div>
          <div class="wo-sub">
            Check-ins from the field appear as activity pulses on your dome.
            Water quality, farm data, and waste maps are anchored to your exoplanet address.
          </div>
        </div>
        <div class="wo-feature-list">
          <div class="wo-feature">⬡ wqMap — water quality records</div>
          <div class="wo-feature">⬡ farmMap — climate credit activities</div>
          <div class="wo-feature">⬡ garbageMap — waste resource tracking</div>
          <div class="wo-feature">⬡ sourceMap — supply chain provenance</div>
        </div>
        <div class="wo-actions">
          <button class="wo-btn wo-btn--primary" @click="router.push('/eco-ops')">
            LOG CHECK-IN
          </button>
          <button class="wo-btn" @click="explore">
            VIEW SETTLEMENT
          </button>
        </div>
      </template>

      <!-- ── PON.INK RECRUIT ──────────────────────────────────────────── -->
      <template v-else-if="role === 'ponink'">
        <div class="wo-header">
          <div class="wo-badge wo-badge--cyan">FROM PON.INK</div>
          <div class="wo-title">Extend your address into space.</div>
          <div class="wo-sub">
            Your pon.ink account connects to an exoplanet settlement.<br>
            Every $BARS production, event attendance, and airdrop claim
            builds your virtual real estate.
          </div>
        </div>
        <div class="wo-actions">
          <button class="wo-btn wo-btn--primary" @click="router.push('/onboard')">
            CLAIM YOUR SETTLEMENT
          </button>
          <button class="wo-btn wo-btn--ghost" @click="explore">
            EXPLORE UNIVERSE FIRST
          </button>
        </div>
      </template>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { useSettlements }           from 'src/lib/settlements'
import { useGalaxyStore }           from 'src/stores/galaxy'

const SESSION_KEY = 'exo_overlay_seen'
const CLUSTERS_COUNT = 345   // Takey2013/XMM-Newton
const STARS_COUNT    = '119k'

// ── State ─────────────────────────────────────────────────────────────────────

const route   = useRoute()
const router  = useRouter()
const { settlements } = useSettlements()
const galaxyStore     = useGalaxyStore()

const visible = ref(false)

// ── Role detection ────────────────────────────────────────────────────────────

const role = computed((): string => {
  // Explicit pon.ink deep-link role param
  const q = route.query
  if (q.role === 'artist')      return 'artist'
  if (q.role === 'facilitator') return 'facilitator'
  if (q.role === 'educator' || q.role === 'health') return 'educator'
  if (q.ref  === 'ponink')      return 'ponink'

  // Has local settlements — returning settler
  if (settlements.value.length > 0) return 'settler'

  return 'visitor'
})

const primarySettlement = computed(() => settlements.value[0] ?? null)

const planetCount = computed(() =>
  galaxyStore.isLoaded ? galaxyStore.planets.length.toLocaleString() : '35k+'
)
const clusterCount = CLUSTERS_COUNT
const starCount    = STARS_COUNT

// ── Actions ───────────────────────────────────────────────────────────────────

function dismiss() {
  visible.value = false
  try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
}

function explore() {
  dismiss()
}

function enterSettlement() {
  const s = primarySettlement.value
  if (!s) { dismiss(); return }
  dismiss()
  if (s.type === 'cluster' && s.clusterSlug && s.memberId) {
    void router.push(`/cluster-surface/${s.clusterSlug}/${s.memberId}/0`)
  } else {
    void router.push(`/surface/${encodeURIComponent(s.hostname)}/${encodeURIComponent(s.planetName)}`)
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return
  } catch { /* private mode */ }

  let timer: ReturnType<typeof setTimeout> | null = null

  // Cancel if the user starts interacting with the scene (clicking, scrolling, keypresses)
  // — they want to explore, not read a welcome card
  function onInteract(e: Event) {
    const target = e.target as Element | null
    // Ignore interactions within the nav bars themselves
    if (target?.closest?.('.exo-bar, .exo-icons-bar, .settle-strip, .welcome-overlay')) return
    if (timer) { clearTimeout(timer); timer = null }
    document.removeEventListener('click',   onInteract, true)
    document.removeEventListener('wheel',   onInteract, true)
    document.removeEventListener('keydown', onInteract, true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* */ }
  }

  // Show after 12 s of idle time — long enough for anyone to start exploring freely
  timer = setTimeout(() => {
    document.removeEventListener('click',   onInteract, true)
    document.removeEventListener('wheel',   onInteract, true)
    document.removeEventListener('keydown', onInteract, true)
    visible.value = true
  }, 12000)

  document.addEventListener('click',   onInteract, true)
  document.addEventListener('wheel',   onInteract, true)
  document.addEventListener('keydown', onInteract, true)
})

// ── Exposed API (for parent to programmatically dismiss) ──────────────────────

defineExpose({ dismiss, visible })
</script>

<style scoped>

/* ── Positioning ─────────────────────────────────────────────────────────── */

.welcome-overlay {
  position:   absolute;
  top:        50%;
  left:       32px;
  transform:  translateY(-50%);
  width:      min(360px, calc(100vw - 48px));
  z-index:    80;

  background:        rgba(4, 8, 20, 0.86);
  backdrop-filter:   blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border:            1px solid rgba(0, 212, 180, 0.18);
  border-radius:     12px;
  padding:           28px 24px 20px;
  color:             #c8d8e8;
  font-family:       'Courier New', monospace;
}

/* Mobile: full-width bottom sheet */
@media (max-width: 600px) {
  .welcome-overlay {
    top:       auto;
    bottom:    72px;   /* above nav bar */
    left:      12px;
    right:     12px;
    width:     auto;
    transform: none;
    max-height: 62vh;
    overflow-y: auto;
  }
}

/* ── Close button ───────────────────────────────────────────────────────── */

.wo-close {
  position:    absolute;
  top:         12px;
  right:       14px;
  background:  none;
  border:      none;
  color:       #556677;
  font-size:   14px;
  cursor:      pointer;
  line-height: 1;
  padding:     4px 6px;
  transition:  color 0.2s;
}
.wo-close:hover { color: #aabbcc; }

/* ── Badge ──────────────────────────────────────────────────────────────── */

.wo-badge {
  display:        inline-block;
  font-size:      9px;
  letter-spacing: 0.14em;
  color:          #00d4b4;
  border:         1px solid rgba(0, 212, 180, 0.35);
  border-radius:  3px;
  padding:        2px 8px;
  margin-bottom:  10px;
}
.wo-badge--teal   { color: #00c9c0; border-color: rgba(0, 201, 192, 0.35); }
.wo-badge--violet { color: #a07cf0; border-color: rgba(160, 124, 240, 0.35); }
.wo-badge--amber  { color: #f0a030; border-color: rgba(240, 160, 48, 0.35); }
.wo-badge--green  { color: #50d090; border-color: rgba(80, 208, 144, 0.35); }
.wo-badge--cyan   { color: #40c8ff; border-color: rgba(64, 200, 255, 0.35); }

/* ── Typography ─────────────────────────────────────────────────────────── */

.wo-title {
  font-size:      18px;
  font-weight:    600;
  color:          #ddeeff;
  margin-bottom:  8px;
  line-height:    1.2;
}
.wo-sub {
  font-size:   11px;
  line-height: 1.65;
  color:       #8899aa;
  margin-bottom: 14px;
}
.wo-scale-note {
  font-size:      9px;
  letter-spacing: 0.08em;
  color:          #445566;
  margin-bottom:  16px;
}

/* ── Settlement card ────────────────────────────────────────────────────── */

.wo-settlement-card {
  background:    rgba(0, 200, 190, 0.07);
  border:        1px solid rgba(0, 200, 190, 0.18);
  border-radius: 6px;
  padding:       10px 14px;
  margin-bottom: 12px;
}
.wsc-name { font-size: 13px; color: #c0e8e4; font-weight: 600; }
.wsc-host { font-size: 10px; color: #6699aa; margin-top: 2px; }
.wsc-meta { margin-top: 4px; }
.wsc-type {
  font-size:      8px;
  letter-spacing: 0.1em;
  color:          #00b8aa;
  border:         1px solid rgba(0, 184, 170, 0.3);
  border-radius:  2px;
  padding:        1px 5px;
  text-transform: uppercase;
}

/* ── Tier list (artist) ─────────────────────────────────────────────────── */

.wo-tier-list { margin-bottom: 16px; }
.wo-tier {
  display:       flex;
  align-items:   center;
  gap:           8px;
  padding:       5px 0;
  font-size:     10px;
  color:         #556677;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.wo-tier:last-child { border-bottom: none; }
.wo-tier--active { color: #a07cf0; }
.wt-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.wt-dot--surface  { background: #50c0a0; }
.wt-dot--orbital  { background: #a07cf0; }
.wt-dot--cluster  { background: #4090e0; }
.wt-dot--cosmic   { background: #f0a030; }
.wt-label { font-weight: 600; font-size: 10px; width: 52px; }
.wt-desc  { color: #445566; font-size: 9px; }

/* ── Feature list (facilitator / educator) ──────────────────────────────── */

.wo-feature-list { margin-bottom: 16px; }
.wo-feature {
  font-size:   10px;
  color:       #6688aa;
  padding:     4px 0;
  line-height: 1.4;
}

/* ── Action buttons ─────────────────────────────────────────────────────── */

.wo-actions {
  display:        flex;
  flex-direction: column;
  gap:            8px;
  margin-bottom:  12px;
}
.wo-btn {
  display:        block;
  width:          100%;
  padding:        9px 16px;
  border:         1px solid rgba(0, 212, 180, 0.35);
  border-radius:  6px;
  background:     rgba(0, 212, 180, 0.08);
  color:          #00d4b4;
  font-family:    inherit;
  font-size:      10px;
  letter-spacing: 0.1em;
  cursor:         pointer;
  text-align:     center;
  transition:     background 0.2s, border-color 0.2s;
}
.wo-btn:hover {
  background:   rgba(0, 212, 180, 0.16);
  border-color: rgba(0, 212, 180, 0.55);
}
.wo-btn--primary {
  background:   rgba(0, 212, 180, 0.18);
  border-color: rgba(0, 212, 180, 0.55);
  color:        #00ffdd;
  font-weight:  600;
}
.wo-btn--primary:hover {
  background: rgba(0, 212, 180, 0.28);
}
.wo-btn--ghost {
  background:   transparent;
  border-color: rgba(255, 255, 255, 0.08);
  color:        #445566;
}
.wo-btn--ghost:hover {
  background:   rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.14);
  color:        #6688aa;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

.wo-footer-note {
  font-size:      8px;
  letter-spacing: 0.06em;
  color:          #2a3a4a;
  text-align:     center;
}

/* ── Transition ─────────────────────────────────────────────────────────── */

.wo-fade-enter-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.wo-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.wo-fade-enter-from  { opacity: 0; transform: translateY(calc(-50% + 12px)); }
.wo-fade-leave-to    { opacity: 0; transform: translateY(calc(-50% + 8px)); }

/* Mobile transition */
@media (max-width: 600px) {
  .wo-fade-enter-from { opacity: 0; transform: translateY(12px); }
  .wo-fade-leave-to   { opacity: 0; transform: translateY(8px); }
}
</style>
