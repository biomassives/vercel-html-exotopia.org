<template>
  <q-page class="bs-page">
    <div class="bs-wrap">

      <div class="bs-header">
        <div class="bs-badge">CREATIVE ECONOMY · V1 — ORDER REQUESTS, NOT LIVE CHECKOUT</div>
        <h1 class="bs-title">Bookstore &amp; Media Orders</h1>
        <p class="bs-sub">
          Books, zines, prints, and recordings made by people on this network — ordered
          directly from the person who made them. A share of every order also goes to
          <strong>Home Team</strong>, the small group of people who maintain this software,
          so upkeep isn't entirely unpaid volunteer time.
        </p>
        <p class="bs-sub bs-sub--dim">
          Default split on an order: <strong>{{ splitLabel }}</strong>
          (creator / Home Team maintainer support). Nothing here is required to use Exotopia —
          this is a support-the-people-behind-it page, same spirit as
          <router-link to="/rewards-guide" class="bs-inline-link">the rewards program</router-link>,
          not a paywall on anything.
        </p>
        <p class="bs-sub bs-sub--dim">
          <strong>How ordering actually works right now:</strong> there is no payment processor
          wired into this page yet. "Request to order" sends a request the creator (or, for
          Home Team-listed items, an admin) follows up on directly to arrange payment and
          delivery. Nothing is charged automatically.
        </p>
      </div>

      <!-- ── Format filter ─────────────────────────────────────────────── -->
      <div class="bs-filters">
        <button
          v-for="f in FORMAT_FILTERS" :key="f.value"
          class="bs-filter-chip" :class="{ 'bs-filter-chip--active': activeFormat === f.value }"
          @click="activeFormat = f.value"
        >{{ f.label }}</button>
      </div>

      <!-- ── Catalog ───────────────────────────────────────────────────── -->
      <div v-if="store.loading" class="bs-p bs-p--dim">Loading catalog…</div>
      <div v-else-if="!filteredItems.length" class="bs-empty">
        <p class="bs-p bs-p--dim">
          No listings {{ activeFormat === 'all' ? 'yet' : `in ${activeFormat} yet` }} —
          be the first to list something below.
        </p>
      </div>

      <div class="bs-grid">
        <div v-for="item in filteredItems" :key="item.id" class="bs-card">
          <div class="bs-card__media">
            <img v-if="item.cover_image_url" :src="item.cover_image_url" :alt="item.title" class="bs-card__img" />
            <span v-else class="bs-card__emoji">{{ FORMAT_EMOJI[item.format] }}</span>
          </div>
          <div class="bs-card__body">
            <div class="bs-card__tags">
              <span class="bs-tag">{{ item.format }}</span>
              <span v-if="item.is_home_team" class="bs-tag bs-tag--home-team">Home Team</span>
            </div>
            <h3 class="bs-card__title">{{ item.title }}</h3>
            <div class="bs-card__creator">by {{ item.is_home_team ? 'Home Team' : item.creator_name }}</div>
            <p class="bs-card__desc">{{ item.description }}</p>
            <div class="bs-card__foot">
              <span class="bs-card__price">${{ item.price_usd.toFixed(2) }}</span>
              <a v-if="item.external_url" :href="item.external_url" target="_blank" rel="noopener" class="bs-card__ext">Creator's own listing ↗</a>
            </div>

            <template v-if="member.isSignedIn">
              <button v-if="orderFormFor !== item.id" class="bs-btn bs-btn--order" @click="openOrderForm(item.id)">
                Request to order →
              </button>
              <div v-else class="bs-order-form">
                <label class="bs-field-label">Quantity</label>
                <input v-model.number="orderQty" type="number" min="1" max="50" class="bs-input bs-input--qty" />
                <label class="bs-field-label">Note to the creator (optional)</label>
                <textarea v-model="orderNote" class="bs-textarea" rows="2" placeholder="Shipping preference, format question, anything they should know" />
                <div class="bs-order-form__actions">
                  <button class="bs-btn" :disabled="submittingOrder" @click="confirmOrder(item.id)">Send request</button>
                  <button class="bs-btn bs-btn--ghost" @click="orderFormFor = null">Cancel</button>
                </div>
              </div>
            </template>
            <div v-else class="bs-p bs-p--dim bs-p--small">Sign in below to request this.</div>
          </div>
        </div>
      </div>

      <div v-if="orderSentFor" class="bs-toast">
        Request sent — the creator (or Home Team admin) will follow up directly to arrange
        payment and delivery. Track it under "My orders" below.
      </div>

      <!-- ── Sign in ───────────────────────────────────────────────────── -->
      <div v-if="!member.isSignedIn" class="bs-signin-gate">
        <p class="bs-p">Sign in to request an order or list your own work.</p>
        <MemberSignIn />
      </div>

      <template v-else>
        <!-- ── List your work ─────────────────────────────────────────── -->
        <section class="bs-section">
          <h2 class="bs-h2">List your work</h2>
          <p class="bs-p bs-p--dim">
            Submitted listings are reviewed before they go public (same review step as
            method proposals and library video suggestions) — this isn't an open,
            unmoderated marketplace.
          </p>
          <form class="bs-form" @submit.prevent="submitListing">
            <input v-model="newTitle" class="bs-input bs-input--wide" placeholder="Title" />
            <input v-model="newCreatorName" class="bs-input bs-input--wide" placeholder="Your name / handle, as shown on the listing" />
            <select v-model="newFormat" class="bs-input">
              <option value="book">Book</option>
              <option value="zine">Zine</option>
              <option value="print">Print</option>
              <option value="audio">Audio</option>
              <option value="other">Other</option>
            </select>
            <textarea v-model="newDescription" class="bs-textarea" rows="3" placeholder="What it is, what's in it, why someone would want it" />
            <input v-model.number="newPrice" type="number" min="0" step="0.01" class="bs-input" placeholder="Price (USD)" />
            <input v-model="newCoverUrl" class="bs-input bs-input--wide" placeholder="Cover image URL (optional)" />
            <input v-model="newExternalUrl" class="bs-input bs-input--wide" placeholder="Your own storefront/listing URL (optional)" />
            <button type="submit" class="bs-btn" :disabled="!canSubmitListing || submittingItem">Submit for review</button>
          </form>

          <div v-if="store.myItems.length" class="bs-my-items">
            <h3 class="bs-h3">Your listings</h3>
            <div v-for="it in store.myItems" :key="it.id" class="bs-my-item">
              <span class="bs-my-item__title">{{ it.title }}</span>
              <span class="bs-my-item__status" :class="`bs-my-item__status--${it.status}`">{{ it.status }}</span>
            </div>
          </div>
        </section>

        <!-- ── My orders ───────────────────────────────────────────────── -->
        <section v-if="store.myOrders.length" class="bs-section">
          <h2 class="bs-h2">My orders</h2>
          <div v-for="o in store.myOrders" :key="o.id" class="bs-my-item">
            <span class="bs-my-item__title">{{ itemTitle(o.item_id) }} × {{ o.quantity }}</span>
            <span class="bs-my-item__status" :class="`bs-my-item__status--${o.status}`">{{ o.status }}</span>
          </div>
        </section>
      </template>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMemberStore } from 'src/stores/member'
import { useBookstoreStore, type BookstoreFormat } from 'src/stores/bookstore'
import { BOOKSTORE_SPLIT, formatSplit } from 'src/lib/resonance-split'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member = useMemberStore()
const store  = useBookstoreStore()

const splitLabel = formatSplit(BOOKSTORE_SPLIT)

onMounted(async () => {
  await store.loadCatalog()
  if (member.isSignedIn) {
    await store.loadMyItems()
    await store.loadMyOrders()
  }
})
watch(() => member.userId, async (id) => {
  if (id) { await store.loadMyItems(); await store.loadMyOrders() }
})

// ── Catalog / filtering ──────────────────────────────────────────────────────

const FORMAT_FILTERS: Array<{ value: BookstoreFormat | 'all'; label: string }> = [
  { value: 'all',   label: 'All' },
  { value: 'book',  label: 'Books' },
  { value: 'zine',  label: 'Zines' },
  { value: 'print', label: 'Prints' },
  { value: 'audio', label: 'Audio' },
  { value: 'other', label: 'Other' },
]
const FORMAT_EMOJI: Record<BookstoreFormat, string> = {
  book: '📖', zine: '📰', print: '🖼', audio: '🎧', other: '✦',
}
const activeFormat = ref<BookstoreFormat | 'all'>('all')
const filteredItems = computed(() =>
  activeFormat.value === 'all' ? store.items : store.items.filter(i => i.format === activeFormat.value)
)

function itemTitle(itemId: string): string {
  return store.items.find(i => i.id === itemId)?.title
    ?? store.myItems.find(i => i.id === itemId)?.title
    ?? 'Item'
}

// ── Ordering ─────────────────────────────────────────────────────────────────

const orderFormFor   = ref<string | null>(null)
const orderQty        = ref(1)
const orderNote       = ref('')
const submittingOrder = ref(false)
const orderSentFor    = ref<string | null>(null)

function openOrderForm(itemId: string) {
  orderFormFor.value = itemId
  orderQty.value = 1
  orderNote.value = ''
}

async function confirmOrder(itemId: string) {
  submittingOrder.value = true
  const result = await store.submitOrder({ itemId, quantity: orderQty.value, note: orderNote.value || undefined })
  submittingOrder.value = false
  orderFormFor.value = null
  if (result) {
    orderSentFor.value = itemId
    setTimeout(() => { orderSentFor.value = null }, 6000)
  }
}

// ── Listing submission ────────────────────────────────────────────────────────

const newTitle       = ref('')
const newCreatorName = ref('')
const newFormat       = ref<BookstoreFormat>('book')
const newDescription  = ref('')
const newPrice        = ref<number | null>(null)
const newCoverUrl     = ref('')
const newExternalUrl  = ref('')
const submittingItem  = ref(false)

const canSubmitListing = computed(() =>
  newTitle.value.trim() && newCreatorName.value.trim() && newDescription.value.trim()
  && newPrice.value !== null && newPrice.value >= 0
)

async function submitListing() {
  if (!canSubmitListing.value) return
  submittingItem.value = true
  await store.submitItem({
    creatorName: newCreatorName.value.trim(),
    title:       newTitle.value.trim(),
    format:      newFormat.value,
    description: newDescription.value.trim(),
    priceUsd:    newPrice.value ?? 0,
    coverImageUrl: newCoverUrl.value.trim() || undefined,
    externalUrl:   newExternalUrl.value.trim() || undefined,
  })
  newTitle.value = ''; newCreatorName.value = ''; newFormat.value = 'book'
  newDescription.value = ''; newPrice.value = null; newCoverUrl.value = ''; newExternalUrl.value = ''
  submittingItem.value = false
}
</script>

<style scoped>
.bs-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.bs-wrap { max-width: 920px; margin: 0 auto; }

.bs-badge { font-size: 8.5px; letter-spacing: 0.18em; color: rgba(220,175,90,0.75); margin-bottom: 8px; }
.bs-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.bs-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 10px; max-width: 720px; }
.bs-sub--dim { color: rgba(130,165,190,0.68); }
.bs-inline-link { color: rgba(0,210,255,0.85); text-decoration: underline; }

.bs-filters { display: flex; flex-wrap: wrap; gap: 6px; margin: 20px 0 16px; }
.bs-filter-chip {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.10);
  color: rgba(170,195,215,0.75); font-family: inherit; font-size: 10.5px;
  padding: 5px 12px; border-radius: 999px; cursor: pointer;
}
.bs-filter-chip--active { background: rgba(220,175,90,0.14); border-color: rgba(220,175,90,0.45); color: rgba(240,210,150,0.95); }

.bs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-bottom: 24px; }
.bs-card {
  border: 1px solid rgba(255,255,255,0.08); background: rgba(0,8,22,0.55);
  border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;
}
.bs-card__media { height: 130px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); }
.bs-card__img   { width: 100%; height: 100%; object-fit: cover; }
.bs-card__emoji { font-size: 38px; opacity: 0.7; }
.bs-card__body  { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; }
.bs-card__tags  { display: flex; gap: 6px; }
.bs-tag {
  font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(170,195,215,0.75); border: 1px solid rgba(255,255,255,0.14);
  border-radius: 4px; padding: 2px 6px;
}
.bs-tag--home-team { color: rgba(240,210,150,0.95); border-color: rgba(220,175,90,0.45); background: rgba(220,175,90,0.10); }
.bs-card__title   { font-size: 13.5px; font-weight: 600; color: rgba(220,238,255,0.95); margin: 0; }
.bs-card__creator { font-size: 10px; color: rgba(150,180,205,0.70); }
.bs-card__desc    { font-size: 10.5px; line-height: 1.55; color: rgba(160,190,212,0.80); margin: 2px 0 4px; }
.bs-card__foot { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.bs-card__price { font-size: 13px; font-weight: 700; color: rgba(120,230,180,0.92); }
.bs-card__ext   { font-size: 9.5px; color: rgba(0,190,255,0.80); text-decoration: none; }

.bs-btn {
  font-family: inherit; font-size: 10.5px; font-weight: 600; letter-spacing: 0.03em;
  background: rgba(0,212,180,0.14); border: 1px solid rgba(0,212,180,0.40);
  color: rgba(0,255,221,0.95); border-radius: 5px; padding: 7px 12px; cursor: pointer;
}
.bs-btn:disabled { opacity: 0.4; cursor: default; }
.bs-btn--ghost { background: transparent; border-color: rgba(255,255,255,0.16); color: rgba(180,200,220,0.75); }
.bs-btn--order { align-self: flex-start; }

.bs-order-form { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.bs-field-label { font-size: 9px; letter-spacing: 0.08em; color: rgba(140,170,195,0.70); }
.bs-order-form__actions { display: flex; gap: 8px; margin-top: 4px; }

.bs-input, .bs-textarea, select.bs-input {
  font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.14); border-radius: 5px; padding: 7px 9px;
  color: rgba(210,230,245,0.92); width: 100%;
}
.bs-input--qty { max-width: 90px; }
.bs-input--wide { width: 100%; }
.bs-textarea { resize: vertical; }

.bs-toast {
  border: 1px solid rgba(0,212,180,0.35); background: rgba(0,212,180,0.08);
  color: rgba(150,240,220,0.92); font-size: 11px; line-height: 1.6;
  border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;
}

.bs-empty { padding: 20px 0; }

.bs-signin-gate {
  border: 1px solid rgba(255,255,255,0.06); background: rgba(0,8,22,0.55);
  border-radius: 8px; padding: 16px; margin-bottom: 20px;
}

.bs-section { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px; margin-top: 8px; }
.bs-h2 { font-size: 14px; font-weight: 600; color: rgba(215,238,255,0.92); margin: 0 0 6px; }
.bs-h3 { font-size: 11.5px; font-weight: 600; color: rgba(200,220,240,0.85); margin: 14px 0 6px; }
.bs-p  { font-size: 11.5px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 8px; }
.bs-p--dim { color: rgba(130,165,190,0.65); }
.bs-p--small { font-size: 10px; }

.bs-form { display: flex; flex-direction: column; gap: 8px; max-width: 520px; }

.bs-my-items { margin-top: 14px; }
.bs-my-item {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10.5px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.bs-my-item__title { color: rgba(190,215,235,0.85); }
.bs-my-item__status {
  font-size: 8.5px; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.14); color: rgba(170,195,215,0.75);
}
.bs-my-item__status--active, .bs-my-item__status--fulfilled { color: rgba(120,230,180,0.92); border-color: rgba(0,212,180,0.40); }
.bs-my-item__status--pending, .bs-my-item__status--new { color: rgba(240,200,120,0.92); border-color: rgba(220,175,90,0.40); }
.bs-my-item__status--rejected, .bs-my-item__status--cancelled { color: rgba(230,120,120,0.85); border-color: rgba(220,90,90,0.40); }

@media (max-width: 640px) {
  .bs-page { padding: 24px 14px 48px; }
  .bs-grid { grid-template-columns: 1fr; }
}
</style>
