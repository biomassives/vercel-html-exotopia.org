import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Planet {
  pl_name:      string
  hostname:     string
  ra:           number
  dec:          number
  sy_dist:      number | null
  pl_orbsmax?:  number | null   // semi-major axis (AU)
  pl_orbper?:   number | null   // orbital period (days)
  pl_eqt?:      number | null   // equilibrium temperature (K)
  pl_rade?:     number | null   // radius (Earth radii)
  pl_bmasse?:   number | null   // best mass estimate (Earth masses) — pscomppars composite
  pl_orbeccen?: number | null   // orbital eccentricity
  pl_insol?:    number | null   // insolation flux (S⊕)
  st_teff?:     number | null   // host star effective temperature (K)
  st_rad?:      number | null   // host star radius (Solar radii)
  st_spectype?: string | null   // host star spectral type
  sy_mnum?:     number | null   // number of moons in system
  sy_pnum?:     number | null   // number of planets in system
  sy_snum?:     number | null   // number of stars in system
  glon?:        number | null   // galactic longitude
  glat?:        number | null   // galactic latitude
  discoverymethod?: string | null
  // Tier system — undefined means 'confirmed' (backwards compatible)
  tier?:              'confirmed' | 'candidate' | 'frontier' | 'theoretical'
  tier_index?:        0 | 1 | 2 | 3
  source_catalog?:    string | null   // 'hipparcos', 'toi', 'koi', etc.
  source_id?:         string | null
  nft_address?:       string | null
  nft_eligible?:      boolean
  mission_zone?:      string | null   // 'roman-zone', 'plato-1', etc.
  prediction_method?: string | null
  pl_eqt_sigma?:      number | null   // uncertainty on predicted eqt
  pl_rade_sigma?:     number | null   // uncertainty on predicted radius
}

export interface StarSystem {
  hostname:     string
  ra:           number
  dec:          number
  sy_dist:      number | null
  st_teff?:     number | null
  st_rad?:      number | null   // host star radius (Solar radii)
  st_spectype?: string | null
  sy_pnum?:     number | null
  sy_mnum:      number          // default 0 if not in data
  sy_snum?:     number | null
  planets:      Planet[]
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGalaxyStore = defineStore('galaxy', () => {
  const planets        = ref<Planet[]>([])
  const systems        = ref<Map<string, StarSystem>>(new Map())
  const selectedSystem = ref<StarSystem | null>(null)
  const selectedPlanet = ref<Planet | null>(null)
  const isLoaded       = ref(false)
  const loadError      = ref<string | null>(null)

  const frontierPlanets    = ref<Planet[]>([])
  const candidatePlanets   = ref<Planet[]>([])
  const isFrontierLoaded   = ref(false)
  const isCandidateLoaded  = ref(false)
  const frontierLoadError  = ref<string | null>(null)
  const candidateLoadError = ref<string | null>(null)

  // ── Loaders ────────────────────────────────────────────────────────────────

  async function loadData() {
    if (isLoaded.value) return
    try {
      const res  = await fetch('/exoplanets-viz.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Planet[]

      planets.value = data

      const map = new Map<string, StarSystem>()
      for (const p of data) {
        if (!map.has(p.hostname)) {
          map.set(p.hostname, {
            hostname:     p.hostname,
            ra:           p.ra,
            dec:          p.dec,
            sy_dist:      p.sy_dist,
            st_teff:      p.st_teff,
            st_rad:       p.st_rad,
            st_spectype:  p.st_spectype,
            sy_pnum:      p.sy_pnum,
            sy_mnum:      p.sy_mnum ?? 0,
            sy_snum:      p.sy_snum,
            planets:      [],
          })
        }
        const sys = map.get(p.hostname)!
        // Keep the highest moon count seen
        if ((p.sy_mnum ?? 0) > sys.sy_mnum) sys.sy_mnum = p.sy_mnum ?? 0
        sys.planets.push(p)
      }

      systems.value  = map
      isLoaded.value = true
    } catch (e: any) {
      loadError.value = e.message
    }
  }

  async function loadFrontierData() {
    if (isFrontierLoaded.value) return
    try {
      const res = await fetch('/frontier-exoplanets.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Planet[]
      frontierPlanets.value = data.map(p => ({ ...p, tier: 'frontier' as const, tier_index: 2 as const }))
      isFrontierLoaded.value = true
    } catch (e: any) {
      frontierLoadError.value = e.message
    }
  }

  async function loadCandidateData() {
    if (isCandidateLoaded.value) return
    try {
      const res = await fetch('/candidate-exoplanets.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Planet[]
      candidatePlanets.value = data.map(p => ({ ...p, tier: 'candidate' as const, tier_index: 1 as const }))
      isCandidateLoaded.value = true
    } catch (e: any) {
      candidateLoadError.value = e.message
    }
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  const systemPlanets = computed(() =>
    selectedSystem.value
      ? [...selectedSystem.value.planets].sort(
          (a, b) => (a.pl_orbsmax ?? 999) - (b.pl_orbsmax ?? 999)
        )
      : []
  )

  const allPlanets = computed(() => [
    ...planets.value,
    ...candidatePlanets.value,
    ...frontierPlanets.value,
  ])

  function getSystem(hostname: string): StarSystem | undefined {
    return systems.value.get(hostname)
  }

  function getPlanet(plName: string): Planet | undefined {
    return planets.value.find(p => p.pl_name === plName)
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  function selectSystem(hostname: string) {
    selectedSystem.value = systems.value.get(hostname) ?? null
    selectedPlanet.value = null
  }

  function selectPlanet(plName: string) {
    const planet = planets.value.find(p => p.pl_name === plName)
    if (planet) {
      selectedPlanet.value = planet
      selectedSystem.value = systems.value.get(planet.hostname) ?? null
    }
  }

  return {
    planets,
    systems,
    selectedSystem,
    selectedPlanet,
    isLoaded,
    loadError,
    systemPlanets,
    loadData,
    getSystem,
    getPlanet,
    selectSystem,
    selectPlanet,
    frontierPlanets,
    candidatePlanets,
    isFrontierLoaded,
    isCandidateLoaded,
    frontierLoadError,
    candidateLoadError,
    allPlanets,
    loadFrontierData,
    loadCandidateData,
  }
})
