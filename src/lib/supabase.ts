import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const key  = import.meta.env.VITE_SUPABASE_ANON as string | undefined

/** null when env vars are absent — callers must guard with `if (supabase)` */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

if (!supabase) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON not set — comments and auth disabled')
}

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

export interface CommentReport {
  id:          string
  comment_id:  string
  reporter_id: string
  reason:      string
  created_at:  string
}

export interface BlockedMember {
  id:         string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export const COMMENT_MAX_LENGTH  = 2000
export const COMMENT_RATE_LIMIT  = { max: 5, windowMs: 10 * 60 * 1000 } // 5 per 10 min
