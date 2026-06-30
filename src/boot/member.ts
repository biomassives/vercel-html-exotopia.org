// Boot file: initialise member auth state on app start
// Register in quasar.config.js → boot: ['pinia', 'member']
import { boot } from 'quasar/wrappers'
import { useMemberStore } from 'src/stores/member'

export default boot(async () => {
  // Only initialise if Supabase env vars are set
  if (import.meta.env.VITE_SUPABASE_URL) {
    const store = useMemberStore()
    await store.init()
  }
})
