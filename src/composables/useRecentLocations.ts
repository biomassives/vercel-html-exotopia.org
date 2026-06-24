import { ref } from 'vue'
import { safeRead, safeWrite } from 'src/lib/storage-cipher'

const STORAGE_KEY = 'e8.3'   // opaque — was 'exo_recent_v1'
const MAX_RECENT  = 12

export interface RecentLocation {
  type:      'surface' | 'cluster-surface' | 'dome-interior'
  label:     string
  sublabel:  string
  route:     string
  icon:      string
  visitedAt: number
}

function loadRecent(): RecentLocation[] {
  return safeRead<RecentLocation[]>(STORAGE_KEY, [])
}

function saveRecent(items: RecentLocation[]) {
  safeWrite(STORAGE_KEY, items.slice(0, MAX_RECENT))
}

export function recordVisit(
  routeName: string,
  params:    Record<string, string>,
  query:     Record<string, string>,
): void {
  let entry: RecentLocation | null = null

  if (routeName === 'surface' || routeName === 'dome-interior') {
    const host   = params.hostname   ?? ''
    const planet = params.planetName ?? ''
    if (!host || !planet) return
    const path = routeName === 'dome-interior'
      ? `/surface/${encodeURIComponent(host)}/${encodeURIComponent(planet)}/interior`
      : `/surface/${encodeURIComponent(host)}/${encodeURIComponent(planet)}`
    entry = {
      type:      routeName,
      label:     planet,
      sublabel:  host,
      route:     path,
      icon:      routeName === 'dome-interior' ? 'mdi-home-circle-outline' : 'mdi-earth',
      visitedAt: Date.now(),
    }
  } else if (routeName === 'cluster-surface') {
    const slug   = params.clusterSlug ?? ''
    const gid    = params.memberId    ?? ''
    const sysIdx = params.systemIdx   ?? '0'
    if (!slug || !gid) return
    const clName  = query.cluster ?? slug
    const sysName = query.name    ?? `System-${sysIdx}`
    const path    = `/cluster-surface/${encodeURIComponent(slug)}/${encodeURIComponent(gid)}/${sysIdx}`
    entry = {
      type:      'cluster-surface',
      label:     sysName,
      sublabel:  clName,
      route:     path,
      icon:      'mdi-star-four-points',
      visitedAt: Date.now(),
    }
  }

  if (!entry) return
  const existing = loadRecent().filter(r => r.route !== entry!.route)
  saveRecent([entry, ...existing])
}

export function useRecentLocations() {
  const recent = ref<RecentLocation[]>(loadRecent())
  function refresh() { recent.value = loadRecent() }
  return { recent, refresh }
}
