<template>
  <q-page class="cn-page">
    <div class="cn-wrap">

      <div class="cn-header">
        <div class="cn-badge">COMMUNITY NODES</div>
        <h1 class="cn-title">My Listings</h1>
        <p class="cn-sub">
          A business you run, a place people can find you, or a page for your creative work —
          each becomes a node in the shared universe, visible to visitors once published.
          This is a directory, not a marketplace: describe what you offer and how to reach you,
          not a price or checkout.
        </p>
      </div>

      <div v-if="!member.isSignedIn" class="cn-signin-gate">
        <p class="cn-p">Sign in to create or manage your listings.</p>
        <MemberSignIn />
      </div>

      <template v-else>
        <div class="cn-tabs">
          <button class="cn-tab" :class="{ 'cn-tab--active': tab === 'browse' }" @click="tab = 'browse'">My Listings ({{ store.myNodes.length }})</button>
          <button class="cn-tab" :class="{ 'cn-tab--active': tab === 'create' }" @click="startCreate">New Listing</button>
        </div>

        <!-- ── Browse / manage ─────────────────────────────────────────── -->
        <div v-if="tab === 'browse'" class="cn-section">
          <div v-if="store.pendingCount || store.failed.length" class="cn-sync-note">
            <span v-if="!store.online">Offline — changes are saved and will sync automatically.</span>
            <span v-else-if="store.pendingCount">Syncing {{ store.pendingCount }} change(s)…</span>
            <span v-if="store.failed.length" class="cn-sync-note--err">
              {{ store.failed.length }} change(s) failed to sync.
              <button class="cn-retry" @click="retryAll">Retry</button>
            </span>
          </div>

          <div v-for="n in store.myNodes" :key="n.id" class="cn-node">
            <div class="cn-node__head">
              <span class="cn-node__title">{{ n.title }}</span>
              <span class="cn-status" :class="`cn-status--${n.status}`">{{ n.status }}</span>
            </div>
            <div class="cn-node__type">{{ NODE_TYPE_LABELS[n.node_type] }}</div>
            <p v-if="n.description" class="cn-p">{{ n.description }}</p>
            <div class="cn-node__actions">
              <button class="cn-link-btn" @click="startEdit(n)">Edit</button>
              <button v-if="n.status !== 'archived'" class="cn-link-btn cn-link-btn--danger" @click="archive(n.id)">Archive</button>
            </div>
          </div>
          <p v-if="!store.myNodes.length" class="cn-p cn-p--dim">No listings yet — create your first one.</p>

          <button class="cn-btn" style="margin-top:16px" @click="exportData">Download my listings (JSON)</button>
        </div>

        <!-- ── Create / edit ────────────────────────────────────────────── -->
        <div v-if="tab === 'create'" class="cn-section">
          <form class="cn-form" @submit.prevent="submit">
            <div class="cn-field">
              <label class="cn-label">What kind of listing is this?</label>
              <div class="cn-type-picker">
                <label v-for="t in NODE_TYPES" :key="t.id" class="cn-type-option" :class="{ 'cn-type-option--selected': nodeType === t.id }">
                  <input type="radio" :value="t.id" v-model="nodeType" :disabled="!!editingId" />
                  <div>
                    <div class="cn-type-title">{{ t.label }}</div>
                    <div class="cn-type-desc">{{ t.desc }}</div>
                  </div>
                </label>
              </div>
            </div>

            <div class="cn-field">
              <label class="cn-label">Title</label>
              <input v-model="title" class="cn-input" placeholder="Name of your business, place, or creative page" />
            </div>

            <div class="cn-field">
              <label class="cn-label">Description</label>
              <textarea v-model="description" class="cn-textarea" rows="4"
                placeholder="What you offer and how people can reach you — no prices, no checkout." />
            </div>

            <div class="cn-field">
              <label class="cn-label">Star system (optional)</label>
              <input v-model="hostname" class="cn-input" placeholder="e.g. Kepler-442 — leave blank to not appear in any system's gallery yet" />
            </div>

            <div class="cn-field">
              <label class="cn-label">Attach to one of your settlements (optional)</label>
              <select v-model="exolocAddress" class="cn-input" @change="onSettlementPick">
                <option value="">— not attached to a settlement —</option>
                <option v-for="s in settlements" :key="s.key" :value="s.key">{{ s.displayName }}</option>
              </select>
            </div>

            <!-- business_listing fields -->
            <template v-if="nodeType === 'business_listing'">
              <div class="cn-field">
                <label class="cn-label">Items or services offered (comma-separated)</label>
                <input v-model="metaItems" class="cn-input" placeholder="e.g. woven baskets, honey, repair services" />
              </div>
              <div class="cn-field">
                <label class="cn-label">Contact</label>
                <input v-model="metaContact" class="cn-input" placeholder="Phone, M-Pesa till, email, or social handle" />
              </div>
            </template>

            <!-- business_location fields -->
            <template v-if="nodeType === 'business_location'">
              <div class="cn-field">
                <label class="cn-label">Address or landmark</label>
                <input v-model="metaAddress" class="cn-input" placeholder="Street address, or a landmark description" />
              </div>
              <div class="cn-field">
                <label class="cn-label">Hours</label>
                <input v-model="metaHours" class="cn-input" placeholder="e.g. Mon–Sat 8am–6pm" />
              </div>
            </template>

            <!-- creative_page fields -->
            <template v-if="nodeType === 'creative_page'">
              <div class="cn-field">
                <label class="cn-label">pon.ink link (optional)</label>
                <input v-model="metaPonInkUrl" class="cn-input" placeholder="https://pon.ink/..." />
              </div>
              <div class="cn-field">
                <label class="cn-label">Media links (comma-separated)</label>
                <input v-model="metaMediaLinks" class="cn-input" placeholder="Links to tracks, videos, or galleries" />
              </div>
            </template>

            <button type="submit" class="cn-btn" :disabled="!canSubmit || submitting">
              {{ submitting ? 'Saving…' : (editingId ? 'Save changes' : 'Publish listing') }}
            </button>
            <button v-if="editingId" type="button" class="cn-link-btn" @click="resetForm">Cancel edit</button>

            <p v-if="justSubmitted" class="cn-confirm">Saved — it may take a moment to sync.</p>
          </form>
        </div>
      </template>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { useCommunityNodesStore, type CommunityNode, type CommunityNodeType } from 'src/stores/community-nodes'
import { useSettlements } from 'src/lib/settlements'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member = useMemberStore()
const store  = useCommunityNodesStore()
const { settlements, getSettlement } = useSettlements()

const tab = ref<'browse' | 'create'>('browse')

onMounted(() => { void store.init() })

const NODE_TYPES: Array<{ id: CommunityNodeType, label: string, desc: string }> = [
  { id: 'business_listing',  label: 'Business listing',  desc: 'What you sell or offer, and how to reach you' },
  { id: 'business_location', label: 'Business location',  desc: 'A physical place people can visit' },
  { id: 'creative_page',     label: 'Creative / music page', desc: 'Your work, linked to pon.ink if you use it' },
]

const NODE_TYPE_LABELS: Record<CommunityNodeType, string> = {
  business_listing:  'Business listing',
  business_location: 'Business location',
  creative_page:     'Creative / music page',
}

const editingId   = ref<string | null>(null)
const nodeType    = ref<CommunityNodeType>('business_listing')
const title       = ref('')
const description = ref('')
const hostname    = ref('')
const exolocAddress = ref('')
const metaItems       = ref('')
const metaContact     = ref('')
const metaAddress     = ref('')
const metaHours       = ref('')
const metaPonInkUrl   = ref('')
const metaMediaLinks  = ref('')
const submitting    = ref(false)
const justSubmitted = ref(false)

const canSubmit = computed(() => title.value.trim().length > 0)

function startCreate() {
  resetForm()
  tab.value = 'create'
}

/** Auto-fill the star-system field from the picked settlement, without
 *  clobbering a hostname the user already typed in by hand. */
function onSettlementPick() {
  if (hostname.value.trim()) return
  const s = getSettlement(exolocAddress.value)
  if (s?.hostname) hostname.value = s.hostname
}

function startEdit(n: CommunityNode) {
  editingId.value = n.id
  nodeType.value  = n.node_type
  title.value     = n.title
  description.value = n.description ?? ''
  hostname.value  = n.hostname ?? ''
  exolocAddress.value = n.exoloc_address ?? ''
  const md = n.metadata ?? {}
  metaItems.value      = Array.isArray(md.items) ? md.items.join(', ') : ''
  metaContact.value    = typeof md.contact === 'string' ? md.contact : ''
  metaAddress.value    = typeof md.address === 'string' ? md.address : ''
  metaHours.value      = typeof md.hours === 'string' ? md.hours : ''
  metaPonInkUrl.value  = typeof md.ponInkUrl === 'string' ? md.ponInkUrl : ''
  metaMediaLinks.value = Array.isArray(md.mediaLinks) ? md.mediaLinks.join(', ') : ''
  tab.value = 'create'
}

function resetForm() {
  editingId.value = null
  nodeType.value  = 'business_listing'
  title.value = ''; description.value = ''; hostname.value = ''; exolocAddress.value = ''
  metaItems.value = ''; metaContact.value = ''
  metaAddress.value = ''; metaHours.value = ''
  metaPonInkUrl.value = ''; metaMediaLinks.value = ''
}

function buildMetadata(): Record<string, unknown> {
  switch (nodeType.value) {
    case 'business_listing':
      return {
        items:   metaItems.value.split(',').map(s => s.trim()).filter(Boolean),
        contact: metaContact.value.trim(),
      }
    case 'business_location':
      return { address: metaAddress.value.trim(), hours: metaHours.value.trim() }
    case 'creative_page':
      return {
        ponInkUrl:   metaPonInkUrl.value.trim() || undefined,
        mediaLinks:  metaMediaLinks.value.split(',').map(s => s.trim()).filter(Boolean),
      }
  }
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      node_type:   nodeType.value,
      title:       title.value.trim(),
      description: description.value.trim() || null,
      hostname:    hostname.value.trim() || null,
      exoloc_address: exolocAddress.value || null,
      metadata:    buildMetadata(),
      status:      'published' as const,
    }
    if (editingId.value) {
      await store.updateNode(editingId.value, payload)
    } else {
      await store.createNode(payload)
    }
    justSubmitted.value = true
    resetForm()
    tab.value = 'browse'
    setTimeout(() => { justSubmitted.value = false }, 5000)
  } finally {
    submitting.value = false
  }
}

async function archive(id: string) {
  await store.archiveNode(id)
}

async function retryAll() {
  for (const item of store.failed) await store.retryItem(item.id)
}

function exportData() {
  const blob = new Blob([store.exportForSelfHost()], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `exotopia-my-listings-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.cn-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.cn-wrap { max-width: 760px; margin: 0 auto; }

@media (max-width: 640px) {
  .cn-page { padding-bottom: 160px; }
}

.cn-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(90,200,175,0.65); margin-bottom: 8px; }
.cn-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.cn-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 20px; }

.cn-signin-gate { border: 1px dashed rgba(0,150,210,0.25); border-radius: 6px; padding: 14px 16px; max-width: 420px; }

.cn-tabs { display: flex; gap: 6px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.cn-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: rgba(160,190,215,0.60); font-family: inherit; font-size: 11px; padding: 8px 4px; cursor: pointer;
  margin-right: 16px;
}
.cn-tab:hover { color: rgba(90,200,175,0.80); }
.cn-tab--active { color: rgba(90,200,175,0.95); border-bottom-color: rgba(90,200,175,0.85); }

.cn-section { margin-bottom: 20px; }
.cn-p  { font-size: 11.5px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 8px; }
.cn-p--dim { color: rgba(130,165,190,0.60); font-style: italic; }

.cn-sync-note {
  font-size: 10px; color: rgba(160,195,220,0.75); background: rgba(0,100,160,0.08);
  border: 1px solid rgba(0,100,160,0.22); border-radius: 6px; padding: 8px 12px; margin-bottom: 14px;
}
.cn-sync-note--err { display: block; margin-top: 4px; color: rgba(255,140,100,0.85); }
.cn-retry { background: none; border: 1px solid rgba(255,140,100,0.4); color: inherit; border-radius: 4px; font-size: 9px; padding: 2px 8px; cursor: pointer; margin-left: 6px; }

.cn-node { background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.cn-node__head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.cn-node__title { font-size: 13px; font-weight: 600; color: rgba(90,200,175,0.90); }
.cn-node__type { font-size: 9px; color: rgba(120,170,205,0.55); margin-bottom: 8px; }
.cn-status { font-size: 8px; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
.cn-status--draft { background: rgba(255,190,60,0.12); color: rgba(255,190,60,0.85); }
.cn-status--published { background: rgba(70,220,140,0.12); color: rgba(70,220,140,0.85); }
.cn-status--archived { background: rgba(150,150,150,0.12); color: rgba(150,150,150,0.75); }
.cn-node__actions { display: flex; gap: 12px; margin-top: 8px; }

.cn-link-btn { background: none; border: none; color: rgba(0,180,220,0.80); font-family: inherit; font-size: 10px; cursor: pointer; padding: 0; }
.cn-link-btn:hover { color: rgba(0,210,255,0.95); }
.cn-link-btn--danger { color: rgba(255,140,100,0.80); }
.cn-link-btn--danger:hover { color: rgba(255,170,130,0.95); }

.cn-form { display: flex; flex-direction: column; gap: 14px; max-width: 560px; }
.cn-field { display: flex; flex-direction: column; gap: 6px; }
.cn-label { font-size: 10px; letter-spacing: 0.08em; color: rgba(160,195,220,0.70); }
.cn-input, .cn-textarea {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px;
}
.cn-textarea { resize: vertical; }

.cn-type-picker { display: flex; flex-direction: column; gap: 6px; }
.cn-type-option {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; background: rgba(0,8,16,0.50);
}
.cn-type-option--selected { border-color: rgba(90,200,175,0.45); background: rgba(90,200,175,0.06); }
.cn-type-option input { margin-top: 3px; }
.cn-type-title { font-size: 11px; color: rgba(210,230,250,0.90); }
.cn-type-desc { font-size: 9px; color: rgba(130,165,190,0.60); margin-top: 2px; }

.cn-btn {
  align-self: flex-start;
  background: rgba(10,55,50,0.55); border: 1px solid rgba(90,200,175,0.35); border-radius: 5px;
  color: rgba(150,240,210,0.90); font-family: inherit; font-size: 10.5px; padding: 8px 18px; cursor: pointer;
}
.cn-btn:hover:not(:disabled) { border-color: rgba(110,230,195,0.55); }
.cn-btn:disabled { opacity: 0.4; cursor: default; }

.cn-confirm { font-size: 10.5px; color: rgba(100,220,150,0.85); }
</style>
