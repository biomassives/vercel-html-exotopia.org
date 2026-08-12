import { route } from 'quasar/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { supabase } from 'src/lib/supabase'

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Defense-in-depth for /admin* — the real gate is is_admin() RLS on every
  // admin-only table/RPC (see supabase/migrations/002_rewards.sql), so a
  // non-admin who bypasses this guard still can't read or write anything.
  // But three of the four admin pages (AdminNodesPage/AdminVideoSuggestions/
  // AdminErrorLog) had no client-side check at all — anyone could load the
  // page shell — so this closes that at the one place it needs to live
  // rather than patching each page. admin_members is read-self only
  // (migration 007), so this checks the signed-in user's own row, same
  // query shape as rewards.ts's checkIsAdmin().
  router.beforeEach(async (to) => {
    if (!to.path.startsWith('/admin')) return true
    if (!supabase) return '/'
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return '/'
    const { data } = await supabase.from('admin_members').select('member_id')
      .eq('member_id', session.user.id).maybeSingle()
    return data ? true : '/'
  })

  return router
})
