import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ModuleType } from 'src/lib/station-modules'

export interface InstalledModule {
  moduleType:  ModuleType
  moduleName:  string
  mint:        string | null     // on-chain mint address once minted
  solutions:   string[]          // EcocitySolution mint addresses
}

export interface StationRecord {
  stationId:   string
  stationName: string
  hostname:    string            // star system (links to galaxy store)
  planetName:  string            // exolocation planet
  modules:     Partial<Record<ModuleType, InstalledModule>>
  mintAddress: string | null     // StationCore on-chain mint
}

export const useStationStore = defineStore('station', () => {
  const stations      = ref<StationRecord[]>([])
  const activeStation = ref<StationRecord | null>(null)

  // All seven module slot types — must match the ModuleType union exactly
  const moduleSlotOrder: ModuleType[] = [
    'gallery',
    'watsan',
    'energy',
    'shelter',
    'healthcare',
    'food',
    'command',
  ]

  function createStation(
    stationId:   string,
    stationName: string,
    hostname:    string,
    planetName:  string,
  ): StationRecord {
    const station: StationRecord = {
      stationId,
      stationName,
      hostname,
      planetName,
      modules: {},
      mintAddress: null,
    }
    stations.value.push(station)
    activeStation.value = station
    return station
  }

  function installModule(stationId: string, mod: InstalledModule) {
    const s = stations.value.find(s => s.stationId === stationId)
    if (!s) return
    s.modules[mod.moduleType] = mod
  }

  function installSolution(
    stationId:   string,
    moduleType:  ModuleType,
    solutionMint: string,
  ) {
    const s = stations.value.find(s => s.stationId === stationId)
    if (!s || !s.modules[moduleType]) return
    s.modules[moduleType]!.solutions.push(solutionMint)
  }

  const filledSlots = computed(() =>
    activeStation.value
      ? Object.keys(activeStation.value.modules).length
      : 0
  )

  return {
    stations,
    activeStation,
    moduleSlotOrder,
    createStation,
    installModule,
    installSolution,
    filledSlots,
  }
})
