<template>
  <q-page class="gn-page">
    <div class="gn-wrap">

      <div v-if="loading" class="gn-state">
        <q-spinner-orbit color="cyan" size="30px" />
      </div>

      <div v-else-if="!node" class="gn-state">
        <div class="gn-badge">COMMUNITY LISTING</div>
        <h1 class="gn-title">Not available</h1>
        <p class="gn-p gn-p--dim">
          This listing doesn't exist, isn't published, or has been taken down.
        </p>
      </div>

      <template v-else>
        <div class="gn-badge">{{ NODE_TYPE_LABELS[node.node_type] }}</div>
        <h1 class="gn-title">{{ node.title }}</h1>
        <p v-if="node.description" class="gn-p">{{ node.description }}</p>

        <!-- creative_page -->
        <div v-if="node.node_type === 'creative_page'" class="gn-section">
          <a v-if="ponInkUrl" :href="ponInkUrl" target="_blank" rel="noopener" class="gn-link">
            <q-icon name="link" size="12px" class="q-mr-xs" />pon.ink
          </a>
          <div v-if="mediaLinks.length" class="gn-media-list">
            <a v-for="(m, i) in mediaLinks" :key="i" :href="m" target="_blank" rel="noopener" class="gn-link">
              <q-icon name="open_in_new" size="12px" class="q-mr-xs" />{{ m }}
            </a>
          </div>
        </div>

        <!-- business_listing -->
        <div v-else-if="node.node_type === 'business_listing'" class="gn-section">
          <div v-if="items.length" class="gn-items">
            <span v-for="(it, i) in items" :key="i" class="gn-chip">{{ it }}</span>
          </div>
          <p v-if="contact" class="gn-p"><q-icon name="call" size="12px" class="q-mr-xs" />{{ contact }}</p>
        </div>

        <!-- business_location -->
        <div v-else-if="node.node_type === 'business_location'" class="gn-section">
          <p v-if="address" class="gn-p"><q-icon name="place" size="12px" class="q-mr-xs" />{{ address }}</p>
          <p v-if="hours" class="gn-p"><q-icon name="schedule" size="12px" class="q-mr-xs" />{{ hours }}</p>
        </div>

        <!-- Attached settlement -->
        <div v-if="node.exoloc_address" class="gn-visit">
          <router-link v-if="visitRoute" :to="visitRoute.path" class="gn-link gn-link--visit">
            <q-icon name="mdi-home-circle-outline" size="13px" class="q-mr-xs" />Visit this settlement
          </router-link>
          <span v-else class="gn-address" :title="node.exoloc_address">{{ node.exoloc_address }}</span>
        </div>
      </template>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCommunityNodesStore, type CommunityNode, type CommunityNodeType } from 'src/stores/community-nodes'
import { useGalaxyStore } from 'src/stores/galaxy'
import { resolveExolocRoute, type ExolocRoute } from 'src/lib/settlements'

const route = useRoute()
const store = useCommunityNodesStore()
const galaxyStore = useGalaxyStore()

const NODE_TYPE_LABELS: Record<CommunityNodeType, string> = {
  business_listing:  'Business listing',
  business_location: 'Business location',
  creative_page:     'Creative / music page',
}

const loading = ref(true)
const node    = ref<CommunityNode | null>(null)
const visitRoute = ref<ExolocRoute | null>(null)

const ponInkUrl  = computed(() => typeof node.value?.metadata?.ponInkUrl === 'string' ? node.value.metadata.ponInkUrl : '')
const mediaLinks = computed(() => Array.isArray(node.value?.metadata?.mediaLinks) ? node.value!.metadata.mediaLinks as string[] : [])
const items      = computed(() => Array.isArray(node.value?.metadata?.items) ? node.value!.metadata.items as string[] : [])
const contact    = computed(() => typeof node.value?.metadata?.contact === 'string' ? node.value.metadata.contact : '')
const address    = computed(() => typeof node.value?.metadata?.address === 'string' ? node.value.metadata.address : '')
const hours      = computed(() => typeof node.value?.metadata?.hours === 'string' ? node.value.metadata.hours : '')

onMounted(async () => {
  const id = String(route.params.galleryId ?? '')
  if (id) node.value = await store.fetchPublicNode(id)
  loading.value = false

  if (node.value?.exoloc_address) {
    await galaxyStore.loadData()
    visitRoute.value = resolveExolocRoute(
      node.value.exoloc_address,
      (planetName) => galaxyStore.getPlanet(planetName)?.hostname,
    )
  }
})
</script>

<style scoped>
.gn-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.gn-wrap { max-width: 640px; margin: 0 auto; }

.gn-state { padding: 60px 0; text-align: center; }

.gn-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(90,200,175,0.65); margin-bottom: 8px; }
.gn-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.gn-p  { font-size: 11.5px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 8px; display: flex; align-items: center; }
.gn-p--dim { color: rgba(130,165,190,0.60); font-style: italic; }

.gn-section { margin-top: 14px; }

.gn-link {
  display: flex; align-items: center; width: fit-content;
  font-size: 11px; color: rgba(0,180,220,0.85); text-decoration: none; margin-bottom: 8px;
}
.gn-link:hover { color: rgba(0,210,255,0.95); }
.gn-media-list { display: flex; flex-direction: column; }

.gn-items { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.gn-chip {
  font-size: 9.5px; padding: 3px 8px; border-radius: 4px;
  background: rgba(0,60,100,0.25); color: rgba(150,200,230,0.85);
}

.gn-visit { margin-top: 22px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); }
.gn-link--visit { font-size: 11.5px; }
.gn-address { font-size: 10px; color: rgba(120,160,190,0.65); word-break: break-all; }
</style>
