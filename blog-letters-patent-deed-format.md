# Forty Acres and a Mule in the Cosmos

**The Letters Patent deed format — how PON INK issues virtual land titles, what the metadata carries, and why the Reconstruction Era framing was the right choice**

*July 2026 · PON INK · Token Economy*

---

The first exolocation deed has been minted under PON INK v1.0. It looks like this:

> **LETTERS PATENT**
> TERRITORIAL LAND DEED · FORTY ACRES AND A MULE
>
> *Be it known that the bearer has lawfully claimed the herein described parcel of virtual land, held in perpetuity under the PON INK Protocol, GPL v3, and the customs of the Ecommunity DAO.*
>
> **Planet b · water**
> DEED NO. EXO-J133-NETB · ISSUED June 27, 2026

That's not decoration. The framing is doing real work.

---

## Why "Letters Patent"

A letter patent (from the Latin *litterae patentes* — open letters) is an open public document issued by a sovereign authority granting a right, title, or privilege. English land patents from the 16th century onward granted title to New World territory. The Homestead Act of 1862 issued patents for 160-acre parcels to settlers willing to farm them. After the Civil War, Special Field Order No. 15 — the origin of "forty acres and a mule" — temporarily redistributed approximately 400,000 acres of Confederate coastal land to formerly enslaved families. Andrew Johnson reversed it months later. The promise was never kept.

Exotopia is not claiming to redress that. But the framing is not accidental: this platform is building a settlement system where real-world community work — eco field labor, cultural production, food pantry coordination, citizen science — earns land title. The deed format is designed to look and feel like a document of consequence. "Forty acres and a mule" is the ghost in that frame, acknowledged rather than erased.

---

## The Technical Format

### Name and Description

```json
{
  "name": "Exolocation — Planet b · water",
  "description": "Virtual land deed: 40 acres on Planet b at water. Settlement pathway: water and sanitation (WATSAN). Coordinate system: exo-surface-v1. Issued under PON INK v1.0 · GPL v3."
}
```

The description should always include the pathway — this is what connects the deed to the certification and field work system. A WATSAN deed is evidence that the holder completed water and sanitation training or field work. That is different from an energy deed or a biodiversity deed.

### The Image

The deed image is an inline SVG data URI — no IPFS dependency for the visual. The SVG encodes:

- Gold gradient background (Georgia/serif typeface, matching a physical land document)
- "EXOTOPIA SETTLEMENT AUTHORITY · PON INK PROTOCOL" header
- "LETTERS PATENT" in large gold text with glow filter
- Planet name and region centered
- Dual seal circles (PON INK, left; EXOTOPIA, right)
- "FREE TO MINT · 0 USDC" — legible in the lower left corner

The image is self-contained and permanently readable without any external server.

**Known issue:** `&middot;` named entities in the SVG source should be replaced with the literal `·` character (UTF-8 U+00B7) or the numeric entity `&#183;` for maximum renderer compatibility.

### Dual Standard

```json
"standard": "ERC-721 + Algorand-ARC3-compatible"
```

ERC-721 for EVM chains (Ethereum, Polygon, Base). ARC3 for Algorand. The metadata structure satisfies both. Minting scripts exist for both in `src/lib/evm/` and `src/lib/solana/` (Solana support is in progress alongside Algorand).

### The exoloc_address

```
exo-surface-v1:cluster_id:galaxy_id:host_star:planet_name
```

This is the canonical address for any PON INK settlement. It resolves through the full navigation hierarchy: cosmic cluster → member galaxy → star system → planet surface. The prefix must match the `coord_system` field. A surface deed uses `exo-surface-v1`. An orbital station uses `exo-orbital-v1`. A lunar surface uses `exo-lunar-v1`.

### Trophic Levels

| Level | Name | Description |
|---|---|---|
| L1 | STELLAR | Orbit of the host star or stellar zone |
| L2 | PLANETARY | Surface or orbit of a planet |
| L3 | LUNAR | Surface or orbit of a moon |
| L4 | ORBITAL | Lagrange point, station, or specific orbital zone |

A deed with hostname ending in `-moon` is an L3 deed, not L2. The trophic level in the attributes must match.

### The Pathway Attribute

```json
{ "trait_type": "Pathway", "value": "watsan" }
```

Valid pathway values: `watsan`, `energy`, `food`, `shelter`, `biodiversity`, `soil`, `climate`, `restoration`, `iek`, `arts`. These correspond to the twelve domain competency axes in `SPEC_DOMAIN_COMPETENCY.md`. A deed earned through PFAS monitoring field work carries `biodiversity` or `climate`. A deed earned through biosand filter training carries `watsan`.

### Resonance Split

```json
"resonance_split": {
  "creator": 0.80,
  "community_fund": 0.15,
  "platform": 0.05
}
```

These are proportions, not basis points. 80% of any secondary market revenue routes to the creator wallet. 15% to the SCD Hub community treasury. 5% to platform operations. The `seller_fee_basis_points` field (standard OpenSea/Metaplex field) should be set to the total royalty percentage × 100 — e.g., `500` for 5% total royalty on secondary sales.

### Missing Fields to Add

Every deed should include:

```json
"animation_url": null,
"seller_fee_basis_points": 500,
"properties": {
  "files": [{ "uri": "data:image/svg+xml;...", "type": "image/svg+xml" }],
  "category": "image",
  "creators": []
}
```

Without `seller_fee_basis_points`, secondary marketplace royalties will not route correctly on OpenSea or Magic Eden.

---

## What the Deed Proves

A Letters Patent deed in the PON INK registry is on-chain evidence that:

1. A specific person or group completed activity in a named pathway
2. That activity was verified by the SCD Hub community or a designated reviewer
3. The settlement address exists in the Exotopia navigation system and is accessible at `exotopia.org/surface/:host/:planet`

The "virtual land" framing is literal: the settlement is a navigable location in a 3D visualization built on real astronomical catalog data. The deed is also a certificate of participation in whatever pathway earned it.

---

## What Comes Next

The Letters Patent format is the foundation. Coming deeds will vary the SVG aesthetic by pathway — a biodiversity deed has different ornamentation than a WATSAN deed. Orbital station deeds use `exo-orbital-v1` and carry altitude/inclination attributes instead of surface lat/lon. Black hole vicinity stations, when the scene is built, will carry a special trophic tier.

The onboarding redesign (covered in the companion post "One Thing First") now connects new users to the pathway system from their first minute on the platform.
