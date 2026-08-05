// Boot file: capture uncaught Vue/window errors into public.app_error_logs
// (011_app_error_log.sql) so real runtime errors are reviewable at
// /admin/error-log instead of only ever showing up in someone's local
// devtools console.
//
// Register in quasar.config.js → boot: ['pinia', 'member', 'error-reporting']
//
// Client-side de-dupe/cap, not server-side: this is deliberately lightweight
// (a session Map, not a queue/batching library) — the goal is "a detailed
// small log to review," not a full observability product. A broken
// component stuck in a re-render error loop should bump one row's
// occurrence_count, not flood the table with thousands of identical rows,
// and a session is capped at MAX_LOGGED_PER_SESSION distinct errors so a
// truly pathological page can't spam the table either.
import { boot } from 'quasar/wrappers'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'

const MAX_LOGGED_PER_SESSION = 20
const seen = new Map<string, string>()   // signature -> row id, this session only

function signatureOf(message: string, source: string): string {
  return `${source}::${message}`.slice(0, 300)
}

async function report(message: string, stack: string | undefined, level: 'error' | 'warn', source: string) {
  if (!supabase) return   // no Supabase configured (e.g. a fully offline/local build) — nothing to report to
  try {
    const sig = signatureOf(message, source)
    const existingId = seen.get(sig)
    if (existingId) {
      await supabase.rpc('bump_error_occurrence', { p_error_id: existingId })
      return
    }
    if (seen.size >= MAX_LOGGED_PER_SESSION) return   // cap distinct errors per session, not a hard app limit

    const id = crypto.randomUUID()
    const member = useMemberStore()
    const { error: insertErr } = await supabase.from('app_error_logs').insert({
      id, message: message.slice(0, 4000), stack: stack?.slice(0, 8000) ?? null,
      level, source, url: location.href, user_agent: navigator.userAgent,
      member_id: member.userId ?? null,
    })
    if (!insertErr) seen.set(sig, id)
  } catch {
    // Reporting a reporting failure would be its own bug — swallow silently.
  }
}

export default boot(({ app, router }) => {
  app.config.errorHandler = (err, _instance, info) => {
    const e = err instanceof Error ? err : new Error(String(err))
    void report(e.message, e.stack, 'error', `vue:${info}@${router.currentRoute.value.path}`)
    console.error(err)   // still surface locally — this augments devtools, doesn't replace it
  }

  window.addEventListener('error', (ev) => {
    void report(ev.message, ev.error?.stack, 'error', `window@${location.pathname}`)
  })

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason
    const message = reason instanceof Error ? reason.message : String(reason)
    const stack   = reason instanceof Error ? reason.stack : undefined
    void report(message, stack, 'error', `promise@${location.pathname}`)
  })
})
