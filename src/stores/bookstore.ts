// Bookstore & Media Orders — catalog + order-request store.
// See supabase/migrations/019_bookstore.sql and SPEC_BOOKSTORE_MEDIA_ORDERS.md.
//
// v1 is order-intake, not checkout: submitOrder() records a request a human
// then fulfils out-of-band. Nothing here moves money.

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'

export type BookstoreFormat = 'book' | 'zine' | 'print' | 'audio' | 'other'
export type BookstoreItemStatus = 'pending' | 'active' | 'archived' | 'rejected'
export type BookstoreOrderStatus = 'new' | 'contacted' | 'fulfilled' | 'cancelled'

export interface BookstoreItem {
  id:              string
  creator_id:      string
  creator_name:    string
  title:           string
  format:          BookstoreFormat
  description:     string
  price_usd:       number
  cover_image_url: string | null
  external_url:    string | null
  is_home_team:     boolean
  status:          BookstoreItemStatus
  created_at:      string
}

export interface BookstoreOrder {
  id:         string
  item_id:    string
  buyer_id:   string
  quantity:   number
  note:       string | null
  status:     BookstoreOrderStatus
  created_at: string
}

export const useBookstoreStore = defineStore('bookstore', () => {
  const items       = ref<BookstoreItem[]>([])
  const myItems     = ref<BookstoreItem[]>([])
  const myOrders    = ref<BookstoreOrder[]>([])
  const loading     = ref(false)

  // ── Reads ────────────────────────────────────────────────────────────────

  /** Public catalog — active listings only, newest first. */
  async function loadCatalog() {
    if (!supabase) return
    loading.value = true
    const { data } = await supabase
      .from('bookstore_items')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    items.value = (data as BookstoreItem[]) ?? []
    loading.value = false
  }

  /** The signed-in member's own listings, any status — so they can see review state. */
  async function loadMyItems() {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const { data } = await supabase
      .from('bookstore_items')
      .select('*')
      .eq('creator_id', member.userId)
      .order('created_at', { ascending: false })
    myItems.value = (data as BookstoreItem[]) ?? []
  }

  /** The signed-in member's own order history. */
  async function loadMyOrders() {
    const member = useMemberStore()
    if (!supabase || !member.userId) return
    const { data } = await supabase
      .from('bookstore_orders')
      .select('*')
      .eq('buyer_id', member.userId)
      .order('created_at', { ascending: false })
    myOrders.value = (data as BookstoreOrder[]) ?? []
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /**
   * Self-list an item for review. Lands as status='pending' — an admin
   * approves it to 'active' before it appears in the public catalog, same
   * moderation split as video_suggestions/method_proposals.
   */
  async function submitItem(input: {
    creatorName: string; title: string; format: BookstoreFormat
    description: string; priceUsd: number
    coverImageUrl?: string; externalUrl?: string; isHomeTeam?: boolean
  }): Promise<BookstoreItem | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('bookstore_items').insert({
      creator_id:      member.userId,
      creator_name:    input.creatorName,
      title:           input.title,
      format:          input.format,
      description:     input.description,
      price_usd:       input.priceUsd,
      cover_image_url: input.coverImageUrl ?? null,
      external_url:    input.externalUrl ?? null,
      is_home_team:     input.isHomeTeam ?? false,
    }).select().single()
    if (error || !data) return null
    myItems.value = [data as BookstoreItem, ...myItems.value]
    return data as BookstoreItem
  }

  /**
   * Request to order an item. This is NOT a purchase confirmation — it
   * records interest for the creator (or an admin, for Home Team listings)
   * to follow up on and fulfil directly. See file header.
   */
  async function submitOrder(input: {
    itemId: string; quantity?: number; note?: string
  }): Promise<BookstoreOrder | null> {
    const member = useMemberStore()
    if (!supabase || !member.userId) return null
    const { data, error } = await supabase.from('bookstore_orders').insert({
      item_id:  input.itemId,
      buyer_id: member.userId,
      quantity: input.quantity ?? 1,
      note:     input.note ?? null,
    }).select().single()
    if (error || !data) return null
    myOrders.value = [data as BookstoreOrder, ...myOrders.value]
    return data as BookstoreOrder
  }

  return {
    items, myItems, myOrders, loading,
    loadCatalog, loadMyItems, loadMyOrders,
    submitItem, submitOrder,
  }
})
