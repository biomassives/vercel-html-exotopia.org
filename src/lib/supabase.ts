import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON as string

if (!url || !key) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON not set — comments disabled')
}

export const supabase = createClient(url ?? '', key ?? '')

// ── Type helpers ─────────────────────────────────────────────

export interface Member {
  id:           string
  handle:       string
  display_name: string
  avatar_color: string
  bio:          string | null
  created_at:   string
}

export interface Connection {
  id:          string
  from_id:     string
  to_id:       string
  status:      'pending' | 'accepted'
  created_at:  string
  accepted_at: string | null
}

export interface Comment {
  id:         string
  post_slug:  string
  author_id:  string
  parent_id:  string | null
  body:       string
  edited_at:  string | null
  created_at: string
  // joined
  author?:    Member
  replies?:   Comment[]
  reactions?: Reaction[]
}

export interface Reaction {
  id:         string
  comment_id: string
  member_id:  string
  emoji:      '👍' | '🌱' | '✨' | '🔬' | '❤️'
}

export const EMOJIS: Reaction['emoji'][] = ['👍', '🌱', '✨', '🔬', '❤️']
