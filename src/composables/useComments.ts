import { ref, computed, onUnmounted } from 'vue'
import { supabase, type Comment, type Reaction, EMOJIS } from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'

export function useComments (postSlug: string) {
  const store    = useMemberStore()
  const comments = ref<Comment[]>([])
  const loading  = ref(false)
  const sending  = ref(false)
  const error    = ref<string | null>(null)

  // Flat list → threaded tree (one level of replies)
  const threaded = computed<Comment[]>(() => {
    const roots: Comment[] = []
    const map: Record<string, Comment> = {}
    for (const c of comments.value) {
      map[c.id] = { ...c, replies: [] }
    }
    for (const c of Object.values(map)) {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(c)
      } else {
        roots.push(c)
      }
    }
    // sort roots and replies by created_at asc
    const byTime = (a: Comment, b: Comment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    roots.sort(byTime)
    roots.forEach(r => r.replies?.sort(byTime))
    return roots
  })

  async function load () {
    loading.value = true
    error.value   = null

    const { data, error: e } = await supabase
      .from('comments')
      .select(`
        *,
        author:members(id, handle, display_name, avatar_color),
        reactions(id, comment_id, member_id, emoji)
      `)
      .eq('post_slug', postSlug)
      .order('created_at', { ascending: true })

    loading.value = false
    if (e) { error.value = e.message; return }
    comments.value = (data ?? []) as Comment[]
  }

  async function post (body: string, parentId?: string) {
    if (!store.userId || !body.trim()) return null
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
    comments.value.push(data as Comment)
    return data as Comment
  }

  async function edit (commentId: string, newBody: string) {
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
    const { error: e } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    if (!e) {
      comments.value = comments.value.filter(c => c.id !== commentId && c.parent_id !== commentId)
    }
    return !e
  }

  async function react (commentId: string, emoji: Reaction['emoji']) {
    if (!store.userId) return
    const c = comments.value.find(x => x.id === commentId)
    if (!c) return

    const existing = c.reactions?.find(r => r.member_id === store.userId && r.emoji === emoji)
    if (existing) {
      // toggle off
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

  // Realtime — subscribe to new comments and reactions on this post
  const channel = supabase
    .channel(`comments:${postSlug}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_slug=eq.${postSlug}` },
      async (payload) => {
        // Skip if we already have it (optimistic insert)
        if (comments.value.find(c => c.id === payload.new.id)) return
        // Fetch full row with joins
        const { data } = await supabase
          .from('comments')
          .select('*, author:members(id,handle,display_name,avatar_color), reactions(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) comments.value.push(data as Comment)
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reactions' },
      (payload) => {
        const c = comments.value.find(x => x.id === payload.new.comment_id)
        if (c && !c.reactions?.find(r => r.id === payload.new.id)) {
          c.reactions = [...(c.reactions ?? []), payload.new as Reaction]
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'reactions' },
      (payload) => {
        const c = comments.value.find(x => x.id === payload.old.comment_id)
        if (c) c.reactions = c.reactions?.filter(r => r.id !== payload.old.id)
      }
    )
    .subscribe()

  onUnmounted(() => { supabase.removeChannel(channel) })

  return { comments, threaded, loading, sending, error, load, post, edit, remove, react, EMOJIS }
}

// Relative time helper
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
