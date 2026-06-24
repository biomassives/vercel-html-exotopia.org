/**
 * src/data/events.ts
 *
 * Virtual event and settlement registry for Exotopia cosmic locations.
 *
 * Events are tied to an X-ray cluster or named cluster by `clusterName`.
 * Each event may carry a pon.ink URL for ticketing / airdrop claiming.
 *
 * Settlement entries mark clusters where a community group has virtual
 * property — these show a persistent gold beacon regardless of event timing.
 */

export type EventType =
  | 'live-event'       // hybrid physical + virtual streamed event
  | 'workshop'         // educational / vocational session
  | 'gallery'          // visual art exhibition
  | 'sound-session'    // DJ / production session via pon.ink
  | 'settlement'       // permanent virtual property marker
  | 'science-outreach' // international education / research collaboration session

export interface CosmicEvent {
  id:           string
  clusterName:  string          // matches XRayCluster.name or CosmicCluster.name
  title:        string
  community:    string          // SCD Hub community group name
  type:         EventType
  description:  string
  eventTimeUtc: string | null   // ISO-8601; null = ongoing settlement
  durationMin:  number | null   // event length in minutes; null = permanent
  ponInkUrl?:   string          // pon.ink event or airdrop page
  airdropId?:   string          // pon.ink airdrop token / campaign ID
  hostName?:    string          // facilitator / artist name
  maxGuests?:   number          // soft cap for settlement capacity display
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const COSMIC_EVENTS: CosmicEvent[] = [
  {
    id:           'ot-kulcha-001',
    clusterName:  'J001817.2+161740',
    title:        'Pain in the Ghetto — Studio Session LIVE',
    community:    'OT Kulcha',
    type:         'sound-session',
    description:  'Live hybrid reggae production session. Streaming via pon.ink with real-time virtual attendance at the cluster settlement dome. Airdrop of $SUNLIGHT soundbank NFT to attendees.',
    eventTimeUtc: '2026-05-03T18:00:00Z',
    durationMin:  120,
    ponInkUrl:    'https://pon.ink/events/ot-kulcha-001',
    airdropId:    'bars-ot-001',
    hostName:     'OT Kulcha',
    maxGuests:    200,
  },
  {
    id:           'fana-ka-001',
    clusterName:  'J003318.4-212447',
    title:        'Fana Ka Rap Battle — Spatial Sound Arena',
    community:    'Fana Ka',
    type:         'live-event',
    description:  'Rap battle event with street media broadcast. Participants compete from their virtual settlement domes. Judges vote via pon.ink. $SUNLIGHT airdrop to top 3.',
    eventTimeUtc: '2026-05-10T20:00:00Z',
    durationMin:  180,
    ponInkUrl:    'https://pon.ink/events/fana-ka-001',
    airdropId:    'bars-fana-001',
    hostName:     'Fana Ka',
    maxGuests:    400,
  },
  {
    id:           'kibaoni-workshop-001',
    clusterName:  'J003917.9+004200',
    title:        'Mpeketoni Recycling Centre — Community Workshop',
    community:    'Uni-Kibaoni-Peace-Youth-SHG',
    type:         'workshop',
    description:  'Virtual field workshop for Mkunumbi, Hongwe & Bahari ward. Covers recycling centre design using ecocity.com modules. Attendance earns a Water Quality Certificate NFT and settlement upgrade.',
    eventTimeUtc: '2026-05-17T14:00:00Z',
    durationMin:  90,
    ponInkUrl:    'https://pon.ink/events/kibaoni-001',
    airdropId:    'wqc-kibaoni-001',
    hostName:     'Uni-Kibaoni-Peace-Youth-SHG',
    maxGuests:    80,
  },
  {
    id:           'scd-gallery-001',
    clusterName:  'J004156.8+253151',
    title:        'SCD Hub — Visual Arts Settlement Gallery',
    community:    'SCD Hub',
    type:         'gallery',
    description:  'Permanent orbital gallery node for SCD Hub visual artists. $ART collectibles minted here. Visitors can browse, purchase, and claim exhibition-attendance POAPs.',
    eventTimeUtc: null,
    durationMin:  null,
    ponInkUrl:    'https://pon.ink/gallery/scd-hub',
    hostName:     'SCD Hub',
    maxGuests:    500,
  },
  {
    id:           'scd-settlement-main',
    clusterName:  'J004231.2+005114',
    title:        'SCD Hub — Main Settlement Node',
    community:    'SCD Hub',
    type:         'settlement',
    description:  'Primary SCD Hub community settlement. Facilitators, mentors, and administrators operate from this node. Houses the DAO council chamber and treasury room.',
    eventTimeUtc: null,
    durationMin:  null,
    ponInkUrl:    'https://pon.ink/scd-hub',
    maxGuests:    1000,
  },

  // ── Science & education outreach ───────────────────────────────────────────
  // These sessions use the cosmic map as a shared teaching/research surface —
  // the goal is to connect classroom and citizen-science audiences directly
  // to the same procedurally-generated + real-catalog data the platform runs on.
  {
    id:           'sci-outreach-001',
    clusterName:  'J004039.2+253106',
    title:        'Open Cosmic Web Session — Galaxy Cluster Tour',
    community:    'International Astronomy Education Network',
    type:         'science-outreach',
    description:  'A guided live tour of the cosmic web visualization for classrooms and astronomy clubs worldwide — the great voids, Laniakea flow lines, and a galaxy-cluster zoom-in showing the LOD reveal from cluster sprite down to individual member galaxies and their generated star systems. Recordings are archived for asynchronous use across time zones.',
    eventTimeUtc: '2026-06-24T16:00:00Z',
    durationMin:  60,
    ponInkUrl:    'https://pon.ink/events/sci-outreach-001',
    hostName:     'SCD Hub Education Team',
    maxGuests:    300,
  },
  {
    id:           'sci-outreach-002',
    clusterName:  'J004324.2-094449',
    title:        'Citizen Data Verification Sprint — Cluster Member Catalog Review',
    community:    'Citizen Science Network',
    type:         'science-outreach',
    description:  'Volunteers use the Cluster Interior zoom-in reveal to compare procedurally generated galaxy members against real RC3 / VCC / FCC catalog entries. Galaxies flagged as missing real data — surfaced in-app via the "[LOD] DATA REQUEST" notes — are queued for the next data-pipeline enrichment pass. Open to students, amateur astronomers, and research partners; a participation badge is issued via pon.ink.',
    eventTimeUtc: '2026-07-08T15:00:00Z',
    durationMin:  90,
    ponInkUrl:    'https://pon.ink/events/sci-outreach-002',
    airdropId:    'verify-sprint-001',
    hostName:     'SCD Hub Data Team',
    maxGuests:    150,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Index events by clusterName for O(1) lookup. */
export const EVENTS_BY_CLUSTER: Map<string, CosmicEvent> = new Map(
  COSMIC_EVENTS.map(e => [e.clusterName, e])
)

/** Return the event for a given cluster, if any. */
export function eventForCluster(clusterName: string): CosmicEvent | undefined {
  return EVENTS_BY_CLUSTER.get(clusterName)
}

/** Format UTC ISO time to human-readable local string. */
export function formatEventTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

/** Return ms until event start (negative if already started). */
export function msUntilEvent(iso: string): number {
  return new Date(iso).getTime() - Date.now()
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  'live-event':       'LIVE EVENT',
  'workshop':         'WORKSHOP',
  'gallery':          'GALLERY',
  'sound-session':    'SOUND SESSION',
  'settlement':       'SETTLEMENT',
  'science-outreach': 'SCIENCE OUTREACH',
}

export const EVENT_TYPE_COLOR: Record<EventType, string> = {
  'live-event':       '#ff6644',
  'workshop':         '#44ccaa',
  'gallery':          '#cc88ff',
  'sound-session':    '#ffcc44',
  'settlement':       '#ffd480',
  'science-outreach': '#5599ff',
}
