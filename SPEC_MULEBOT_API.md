# mule-bot API — Settlement Query Endpoint Specification
**SCD Hub · PON INK Protocol · GPL v3 · Draft v0.1**

---

## Design principles

1. **Settlement-scoped** — every endpoint is namespaced to one exolocation address
2. **Exolocation address as primary key** — the canonical `coord-system:reference-body:location` string is the resource identifier, encoded as URL path segments
3. **Local-network native, federation-ready** — runs at `localhost:PORT` on the settlement node; the URL scheme is identical whether local or federated
4. **Corpus is the primary resource** — all other resources (earnings, land-care, Approvideo) are derived from or adjacent to the corpus
5. **Query-then-act** — GET is always safe (read-only); POST/PATCH modifies state
6. **Chain-agnostic aggregation** — earnings and eco-ops can span Polygon, Celo, Algorand; the API aggregates

---

## URL structure

```
http://{node-host}:{port}/mulebot/v1/{coord-system}/{reference-body}/{location}/{resource}
```

### Exolocation address → URL encoding

| Exolocation component | URL path segment | Encoding rule |
|---|---|---|
| `exo-surface-v1`    | `exo-surface-v1`    | As-is — hyphens allowed |
| `Kepler-442b`       | `Kepler-442b`       | As-is |
| `15N,23W`           | `15N%2C23W`         | Comma → `%2C` |
| `exo-moon-lagrange-v1` | `exo-moon-lagrange-v1` | As-is |
| `Moon-I`            | `Moon-I`            | As-is |
| `L4`                | `L4`                | As-is |

**Examples:**
```
/mulebot/v1/exo-surface-v1/Kepler-442b/15N%2C23W/
/mulebot/v1/exo-moon-lagrange-v1/TRAPPIST-1e%2FMoon-I/L4/
/mulebot/v1/exo-moon-surface-v1/LHS-1140b%2FMoon-II/85S%2C0E/
```

---

## Endpoints — full resource map

### Root / Settlement overview

```
GET /mulebot/v1/{coord}/{body}/{loc}/
```

Returns: settlement identity, mule-bot status, corpus freshness, current $SUNLIGHT balance, pending ART claims, recommended next action.

```json
{
  "exoloc":          "exo-surface-v1:Kepler-442b:15N,23W",
  "settlement_name": "Lamu Waterworks Station",
  "mulebot_version": "2.0",
  "persona":         "Natural & Regenerative Land Care Specialist",
  "corpus_items":    42,
  "corpus_updated":  "2026-05-22T09:14:00Z",
  "sunlight_balance": "14.2 $SUNLIGHT",
  "art_pending":     3,
  "next_action": {
    "type":    "eco_ops",
    "label":   "Water quality check-in overdue — last reading 8 days ago",
    "reward":  "+12 ART",
    "link":    "/eco-ops?type=wqMap&settlement=exo-surface-v1:Kepler-442b:15N,23W"
  }
}
```

---

### Earnings

```
GET /mulebot/v1/{coord}/{body}/{loc}/earnings/
```

All token earnings across all chains, paginated.

Query params:
- `?since=2026-01-01` — filter by date
- `?chain=polygon|celo|algorand|all` (default: all)
- `?token=sunlight|art|all` (default: all)
- `?limit=20&offset=0`

```json
{
  "total_sunlight":  "14.2 $SUNLIGHT",
  "total_art":       87,
  "art_pending":     3,
  "art_resold":      12,
  "art_resold_value":"KES 2,400",
  "events": [
    {
      "date":    "2026-05-20",
      "type":    "art_earned",
      "amount":  12,
      "reason":  "Water quality check-in — Kilifi site",
      "chain":   "polygon",
      "tx_hash": "0x..."
    }
  ]
}
```

**Sub-resources:**
```
GET /mulebot/v1/{coord}/{body}/{loc}/earnings/sunlight/
GET /mulebot/v1/{coord}/{body}/{loc}/earnings/art/
GET /mulebot/v1/{coord}/{body}/{loc}/earnings/art/optimize/
```

`/earnings/art/optimize/` returns a ranked plan: which eco-ops types to do next, in what order, to maximise ART yield given current settlement state and regional conditions.

---

### Participation plan

```
GET /mulebot/v1/{coord}/{body}/{loc}/plan/
```

mule-bot's recommended participation sequence for the next 7/30/90 days.

Query params:
- `?horizon=7d|30d|90d` (default: 30d)
- `?focus=art|sunlight|settlement|all` (default: all)

```json
{
  "horizon":   "30d",
  "generated": "2026-05-22T09:15:00Z",
  "plan": [
    {
      "priority": 1,
      "action":   "Water quality check-in",
      "eco_ops_type": "wqMap",
      "reward":   "+12 ART",
      "rationale":"Last reading 8 days ago — Kilifi site flagged as high-value",
      "due_by":   "2026-05-24"
    },
    {
      "priority": 2,
      "action":   "Record and mint a $SUNLIGHT track",
      "reward":   "100% of resale",
      "rationale":"$SUNLIGHT volume low this week — good time for visibility",
      "approvideo_ref": "track/how-to-record-field-audio"
    },
    {
      "priority": 3,
      "action":   "Add farm map check-in",
      "eco_ops_type": "farmMap",
      "reward":   "+8 ART",
      "rationale":"Settlement has no farmMap history — unlocks food system upgrade"
    }
  ]
}
```

---

### Corpus

```
GET  /mulebot/v1/{coord}/{body}/{loc}/corpus/
POST /mulebot/v1/{coord}/{body}/{loc}/corpus/
GET  /mulebot/v1/{coord}/{body}/{loc}/corpus/query?q={search-text}
GET  /mulebot/v1/{coord}/{body}/{loc}/corpus/{item-id}/
DELETE /mulebot/v1/{coord}/{body}/{loc}/corpus/{item-id}/
```

The corpus is the knowledge base. Items can be: eco-ops readings, field recordings, Hub Approvideo notes, land care protocols, eco-ops plans.

**GET /corpus/**
```json
{
  "item_count":    42,
  "updated":       "2026-05-22T09:00:00Z",
  "topics":        ["water quality", "soil health", "seed saving", "solar installation"],
  "corpus_seed":   "7C4E2B8F",
  "integrity_hash": "sha256:..."
}
```

**POST /corpus/** — add item
```json
{
  "type":    "eco_ops_reading",
  "source":  "wqMap",
  "content": "pH 7.1, turbidity 0.3 NTU, Kilifi borehole",
  "date":    "2026-05-22",
  "gps":     { "lat": -3.63, "lon": 39.85 },
  "cert_id": "WQC-LAMU-2026-0047"
}
```

**GET /corpus/query?q=water+pH**
```json
{
  "query":   "water pH",
  "results": [
    {
      "id":       "item-0047",
      "type":     "eco_ops_reading",
      "excerpt":  "pH 7.1, turbidity 0.3 NTU, Kilifi borehole — 2026-05-22",
      "relevance": 0.94
    }
  ]
}
```

---

### Land care

```
GET /mulebot/v1/{coord}/{body}/{loc}/land-care/
GET /mulebot/v1/{coord}/{body}/{loc}/land-care/water/
GET /mulebot/v1/{coord}/{body}/{loc}/land-care/soil/
GET /mulebot/v1/{coord}/{body}/{loc}/land-care/climate/
GET /mulebot/v1/{coord}/{body}/{loc}/land-care/regenerative/
```

mule-bot's land care advice, derived from the corpus, the settlement's eco-ops history, and the Hub Approvideo library.

**GET /land-care/**
```json
{
  "zone":       "Tropical coastal, humid",
  "planet":     "Kepler-442b (analogue)",
  "surface_conditions": {
    "eqt_K":      282,
    "zone_type":  "temperate",
    "atmosphere": "thin_n2_co2"
  },
  "real_world_location": "Lamu County, Kenya",
  "health_summary": {
    "water": { "status": "good", "last_ph": 7.1, "trend": "stable" },
    "soil":  { "status": "needs_attention", "notes": "No farmMap data — recommend soil test" },
    "air":   { "status": "unknown" }
  },
  "top_recommendation": "Add soil organic matter measurement to next farm visit"
}
```

**GET /land-care/water/**
```json
{
  "readings": [
    { "date": "2026-05-22", "ph": 7.1, "turbidity_ntu": 0.3, "potable": true }
  ],
  "trend":    "stable",
  "approvideo_refs": [
    { "id": "wq/biosand-filter", "title": "Biosand filter maintenance — 10 min", "url": "..." }
  ]
}
```

---

### Hub Approvideo feed

```
GET /mulebot/v1/{coord}/{body}/{loc}/approvideo/
GET /mulebot/v1/{coord}/{body}/{loc}/approvideo/{category}/
```

mule-bot's curated Hub Approvideo feed, personalised to the settlement's eco-ops history and land care status.

Query params:
- `?category=water|soil|food|energy|shelter|community|$SUNLIGHT`
- `?limit=10`
- `?language=en|sw|fr|pt|ar` (Swahili, French, Portuguese, Arabic)

```json
{
  "personalised_for": "exo-surface-v1:Kepler-442b:15N,23W",
  "items": [
    {
      "id":       "wq/biosand-002",
      "title":    "Testing water pH in the field",
      "duration": "8:32",
      "language": "sw",
      "category": "water",
      "relevance_reason": "Settlement has active wqMap eco-ops",
      "url":    "https://hub.scd.org/approvideo/wq/biosand-002",
      "thumbnail": "..."
    }
  ]
}
```

---

### Eco-ops submission

```
POST /mulebot/v1/{coord}/{body}/{loc}/eco-ops/
```

Submit an eco-ops check-in. mule-bot validates, adds to corpus, and queues for on-chain submission.

```json
{
  "type":     "wqMap",
  "readings": {
    "ph":             7.1,
    "turbidity_ntu":  0.3,
    "nitrate_mg_l":   2.1,
    "potable":        true
  },
  "gps":      { "lat": -3.63, "lon": 39.85 },
  "date_utc": "2026-05-22T09:00:00Z",
  "photo_cid": "ipfs://QmXxxx"
}
```

Response:
```json
{
  "status":       "queued",
  "corpus_item":  "item-0048",
  "art_earned":   12,
  "cert_preview": { "cert_id": "WQC-LAMU-2026-0048", "chain": "polygon" },
  "queue_position": 1
}
```

---

## Authentication

All endpoints require a signed challenge proving settlement ownership:

```
Header: X-Settlement-Auth: {wallet_address}.{timestamp}.{signature}
```

Where `signature = sign(wallet, "{exoloc_address}:{timestamp}")`.

For local-network nodes (localhost), auth can be relaxed to a session token issued at node startup.

---

## Error responses

All errors follow:
```json
{
  "error":   "not_found",
  "message": "Settlement exo-surface-v1:Kepler-442b:15N,23W has no registered corpus",
  "code":    404
}
```

Standard codes:
| Code | Meaning |
|---|---|
| 400 | Bad exolocation format |
| 401 | Missing or invalid auth |
| 403 | Wallet doesn't own this settlement deed |
| 404 | Settlement not found or corpus empty |
| 409 | Eco-ops submission conflicts with recent duplicate |
| 429 | Rate limited (eco-ops submissions: max 10/hour) |

---

## Node discovery

Multiple settlement nodes can federate. Discovery uses a simple DNS-like record:

```
GET /mulebot/.well-known/node
```

Returns:
```json
{
  "node_id":    "node-lamu-001",
  "settlements": ["exo-surface-v1:Kepler-442b:15N,23W"],
  "version":    "2.0",
  "federation": true,
  "pubkey":     "0x..."
}
```

---

## Implementation path (for us as engineers)

**Phase 1 — local stub (now)**
- Mock responses in `src/lib/mulebot-client.ts`
- Vue composable `useMuleBot(exoloc)` wrapping fetch calls
- Runs against `localhost:8888` (or a Quasar dev-server mock)

**Phase 2 — local node (next)**
- Node.js/Express server bundled with the settlement app
- IndexedDB-backed corpus
- Real eco-ops queuing to Polygon/Celo

**Phase 3 — federation**
- Settlement nodes discover each other via `.well-known/node`
- Cross-settlement corpus queries (aggregated, privacy-preserving)
- DAO governance of federation rules

---

## Vue composable (stub)

```typescript
// src/lib/mulebot-client.ts

const BASE = (exoloc: string) => {
  const [coord, body, loc] = exoloc.split(':')
  return `/mulebot/v1/${coord}/${body}/${encodeURIComponent(loc!)}`
}

export async function getMulebotStatus(exoloc: string) {
  return fetch(`${BASE(exoloc)}/`).then(r => r.json())
}

export async function getMulebotPlan(exoloc: string, horizon = '30d') {
  return fetch(`${BASE(exoloc)}/plan/?horizon=${horizon}`).then(r => r.json())
}

export async function getMulebotEarnings(exoloc: string, opts?: { chain?: string; since?: string }) {
  const params = new URLSearchParams(opts as Record<string, string>)
  return fetch(`${BASE(exoloc)}/earnings/?${params}`).then(r => r.json())
}

export async function queryCorpus(exoloc: string, q: string) {
  return fetch(`${BASE(exoloc)}/corpus/query?q=${encodeURIComponent(q)}`).then(r => r.json())
}

export async function submitEcoOps(exoloc: string, data: Record<string, unknown>) {
  return fetch(`${BASE(exoloc)}/eco-ops/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}

export async function getLandCare(exoloc: string, domain?: string) {
  const path = domain ? `/land-care/${domain}/` : '/land-care/'
  return fetch(`${BASE(exoloc)}${path}`).then(r => r.json())
}

export async function getApprovideo(exoloc: string, opts?: { category?: string; language?: string }) {
  const params = new URLSearchParams(opts as Record<string, string>)
  return fetch(`${BASE(exoloc)}/approvideo/?${params}`).then(r => r.json())
}
```
