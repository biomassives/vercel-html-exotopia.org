<template>
  <q-page class="sdp-page">
    <div class="sdp-wrap">
      <router-link to="/" class="sdp-back-link">← Exotopia</router-link>

      <div class="sdp-header">
        <div class="sdp-badge">SETTLEMENT DIRECTORY</div>
        <h1 class="sdp-title">Published Settlements</h1>
        <p class="sdp-sub">
          Every settlement here was published by its own settler, at their own
          exolocation address. There's no ranking or featured slot — newest first,
          optionally filtered by focus.
        </p>
      </div>

      <div class="sdp-filters">
        <button
          class="sdp-filter"
          :class="{ 'sdp-filter--active': !focus }"
          @click="setFocus(null)"
        >All</button>
        <button
          v-for="f in FOCUS_OPTIONS"
          :key="f.id"
          class="sdp-filter"
          :class="{ 'sdp-filter--active': focus === f.id }"
          @click="setFocus(f.id)"
        >{{ f.title }}</button>
      </div>

      <div v-if="loading" class="sdp-status">
        <q-spinner-orbit color="cyan-7" size="32px" />
      </div>

      <div v-else-if="!profiles.length" class="sdp-status">
        <p class="sdp-p sdp-p--dim">
          {{ focus ? 'No published settlements with this focus yet.' : 'No published settlements yet — be the first.' }}
        </p>
      </div>

      <template v-else>
        <router-link
          v-for="p in profiles"
          :key="p.id"
          :to="`/settlement/${p.public_slug}`"
          class="sdp-card"
        >
          <div class="sdp-card__head">
            <span class="sdp-card__title">{{ p.display_name }}</span>
            <span class="sdp-focus-badge">{{ focusLabel(p.focus) || p.focus }}</span>
          </div>
          <div class="sdp-card__address">{{ p.exolocation }}</div>
          <p v-if="p.description" class="sdp-p">{{ p.description }}</p>
        </router-link>

        <button v-if="canLoadMore" class="sdp-more-btn" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettlementProfilesStore, type SettlementProfile } from 'src/stores/settlement-profiles'
import { FOCUS_OPTIONS, focusLabel } from 'src/data/settlement-focus-options'

const store = useSettlementProfilesStore()

const PAGE_SIZE = 24

const profiles    = ref<SettlementProfile[]>([])
const focus       = ref<string | null>(null)
const loading     = ref(true)
const loadingMore = ref(false)
const canLoadMore = ref(false)

async function fetchPage(offset: number) {
  const page = await store.listPublishedProfiles({ limit: PAGE_SIZE, offset, focus: focus.value })
  canLoadMore.value = page.length === PAGE_SIZE
  return page
}

async function setFocus(id: string | null) {
  if (focus.value === id) return
  focus.value = id
  loading.value = true
  profiles.value = await fetchPage(0)
  loading.value = false
}

async function loadMore() {
  loadingMore.value = true
  const next = await fetchPage(profiles.value.length)
  profiles.value = [...profiles.value, ...next]
  loadingMore.value = false
}

onMounted(async () => {
  profiles.value = await fetchPage(0)
  loading.value = false
})
</script>

<style scoped>
.sdp-page { background: #050912; min-height: 100vh; color: #c8d4e8; font-family: 'Roboto', sans-serif; }
.sdp-wrap { max-width: 760px; margin: 0 auto; padding: 28px 24px 80px; }

.sdp-back-link { color: #4488cc; text-decoration: none; font-size: 13px; }
.sdp-back-link:hover { color: #66aaee; }

.sdp-header { margin: 24px 0 20px; }
.sdp-badge { font-size: 10px; letter-spacing: 0.18em; color: rgba(0,229,255,0.65); margin-bottom: 8px; }
.sdp-title { font-size: 26px; margin: 0 0 8px; color: #e8f0ff; font-weight: 300; }
.sdp-sub   { font-size: 13px; line-height: 1.7; color: #a8bcd8; max-width: 560px; }

.sdp-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.sdp-filter {
  background: rgba(0,15,35,0.55); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(160,195,220,0.75); font-family: inherit; font-size: 10.5px; letter-spacing: 0.02em;
  padding: 6px 12px; cursor: pointer;
}
.sdp-filter:hover { border-color: rgba(0,150,210,0.45); color: rgba(200,225,245,0.90); }
.sdp-filter--active { border-color: rgba(0,229,255,0.55); color: #00e5ff; background: rgba(0,100,160,0.12); }

.sdp-status { display: flex; justify-content: center; padding: 40px 0; }

.sdp-p { font-size: 12.5px; line-height: 1.65; color: #a8bcd8; margin: 6px 0 0; }
.sdp-p--dim { color: rgba(130,165,190,0.65); font-style: italic; }

.sdp-card {
  display: block; background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; padding: 16px 18px; margin-bottom: 12px; text-decoration: none;
  transition: border-color 0.15s;
}
.sdp-card:hover { border-color: rgba(0,229,255,0.35); }
.sdp-card__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.sdp-card__title { font-size: 14px; font-weight: 600; color: rgba(210,230,250,0.94); }
.sdp-focus-badge {
  flex-shrink: 0; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase;
  color: #00e5ff; border: 1px solid rgba(0,229,255,0.35); border-radius: 4px; padding: 2px 7px;
}
.sdp-card__address { font-family: 'Courier New', monospace; font-size: 11px; color: #6688aa; margin-bottom: 6px; }

.sdp-more-btn {
  display: block; margin: 8px auto 0; background: rgba(10,55,50,0.55); border: 1px solid rgba(90,200,175,0.35);
  border-radius: 5px; color: rgba(150,240,210,0.90); font-family: inherit; font-size: 10.5px; padding: 8px 20px; cursor: pointer;
}
.sdp-more-btn:hover:not(:disabled) { border-color: rgba(110,230,195,0.55); }
.sdp-more-btn:disabled { opacity: 0.5; cursor: default; }
</style>
