import { ref, computed, onUnmounted } from 'vue'
import {
  supabase,
  type Comment,
  type Reaction,
  EMOJIS,
  COMMENT_MAX_LENGTH,
  COMMENT_RATE_LIMIT,
} from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'

export { EMOJIS, COMMENT_MAX_LENGTH }

export function useComments (postSlug: string) {
  const store    = useMemberStore()
  const comments = ref<Comment[]>([])
  const loading  = ref(false)
  const sending  = ref(false)
  const error    = ref<string | null>(null)

  // Rate-limit tracking: timestamps of recent posts
  const recentPostTimes = ref<number[]>([])

  function isRateLimited (): boolean {
    const now = Date.now()
    recentPostTimes.value = recentPostTimes.value.filter(
      t => now - t < COMMENT_RATE_LIMIT.windowMs
    )
    return recentPostTimes.value.length >= COMMENT_RATE_LIMIT.max
  }

  // Visible author IDs: self + green-lit connections
  function visibleIds (): string[] {
    if (!store.userId) return []
    return [store.userId, ...store.connectedIds]
  }

  // Flat list → threaded tree (one level of replies), filtered by blocks
  const threaded = computed<Comment[]>(() => {
    const visible = comments.value.filter(
      c => !store.blockedIds.has(c.author_id)
    )
    const roots: Comment[] = []
    const map: Record<string, Comment> = {}
    for (const c of visible) {
      map[c.id] = { ...c, replies: [] }
    }
    for (const c of Object.values(map)) {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(c)
      } else {
        roots.push(c)
      }
    }
    const byTime = (a: Comment, b: Comment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    roots.sort(byTime)
    roots.forEach(r => r.replies?.sort(byTime))
    return roots
  })

  async function load () {
    if (!supabase) return
    loading.value = true
    error.value   = null

    const ids = visibleIds()
    if (!ids.length) { loading.value = false; return }

    const { data, error: e } = await supabase
      .from('comments')
      .select(`
        *,
        author:members(id, handle, display_name, avatar_color),
        reactions(id, comment_id, member_id, emoji)
      `)
      .eq('post_slug', postSlug)
      .in('author_id', ids)           // green-light gate: only see connected members' comments
      .order('created_at', { ascending: true })

    loading.value = false
    if (e) { error.value = e.message; return }
    comments.value = (data ?? []) as Comment[]
  }

  async function post (body: string, parentId?: string) {
    if (!supabase || !store.userId || !body.trim()) return null

    if (body.length > COMMENT_MAX_LENGTH) {
      error.value = `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`
      return null
    }

    if (isRateLimited()) {
      error.value = `You're posting too quickly. Please wait a few minutes.`
      return null
    }

    sending.value = true
    error.value   = null

    const { data, error: e } = await supabase
      .from('comments')
      .insert({
        post_slug: postSlug,
        author_id: store.userId,
        parent_id: parentId ?? null,
        body:      body.trim(),
      })
      .select(`
        *,
        author:members(id, handle, display_name, avatar_color),
        reactions(id, comment_id, member_id, emoji)
      `)
      .single()

    sending.value = false
    if (e) { error.value = e.message; return null }

    recentPostTimes.value.push(Date.now())
    comments.value.push(data as Comment)
    return data as Comment
  }

  async function edit (commentId: string, newBody: string) {
    if (!supabase || newBody.length > COMMENT_MAX_LENGTH) return false
    const { error: e } = await supabase
      .from('comments')
      .update({ body: newBody.trim(), edited_at: new Date().toISOString() })
      .eq('id', commentId)
    if (!e) {
      const c = comments.value.find(x => x.id === commentId)
      if (c) { c.body = newBody.trim(); c.edited_at = new Date().toISOString() }
    }
    return !e
  }

  async function remove (commentId: string) {
    if (!supabase) return false
    const { error: e } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    if (!e) {
      comments.value = comments.value.filter(
        c => c.id !== commentId && c.parent_id !== commentId
      )
    }
    return !e
  }

  async function react (commentId: string, emoji: Reaction['emoji']) {
    if (!supabase || !store.userId) return
    const c = comments.value.find(x => x.id === commentId)
    if (!c) return

    const existing = c.reactions?.find(
      r => r.member_id === store.userId && r.emoji === emoji
    )
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
      c.reactions = c.reactions?.filter(r => r.id !== existing.id)
    } else {
      const { data } = await supabase
        .from('reactions')
        .insert({ comment_id: commentId, member_id: store.userId, emoji })
        .select()
        .single()
      if (data) c.reactions = [...(c.reactions ?? []), data as Reaction]
    }
  }

  async function report (commentId: string, reason = '') {
    if (!supabase || !store.userId) return false
    const { error: e } = await supabase
      .from('comment_reports')
      .insert({ comment_id: commentId, reporter_id: store.userId, reason })
    return !e
  }

  // Realtime — only surfaces comments from green-lit connections
  const channel = supabase
    ? supabase
        .channel(`comments:${postSlug}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'comments',
            filter: `post_slug=eq.${postSlug}`,
          },
          async (payload) => {
            if (!supabase) return
            if (comments.value.find(c => c.id === payload.new['id'])) return
            // Enforce green-light gate on realtime events too
            if (!visibleIds().includes(payload.new['author_id'] as string)) return
            const { data } = await supabase
              .from('comments')
              .select('*, author:members(id,handle,display_name,avatar_color), reactions(*)')
              .eq('id', payload.new['id'])
              .single()
            if (data) comments.value.push(data as Comment)
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reactions' },
          (payload) => {
            const c = comments.value.find(x => x.id === payload.new['comment_id'])
            if (c && !c.reactions?.find(r => r.id === payload.new['id'])) {
              c.reactions = [...(c.reactions ?? []), payload.new as Reaction]
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'reactions' },
          (payload) => {
            const c = comments.value.find(x => x.id === payload.old['comment_id'])
            if (c) c.reactions = c.reactions?.filter(r => r.id !== payload.old['id'])
          }
        )
        .subscribe()
    : null

  onUnmounted(() => { if (supabase && channel) supabase.removeChannel(channel) })

  return {
    comments, threaded, loading, sending, error,
    load, post, edit, remove, react, report,
    EMOJIS, COMMENT_MAX_LENGTH,
  }
}

export function timeAgo (iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}
