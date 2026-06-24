# Exotopia Security Notification Bulletin — Specification
**SCD Hub · PON INK Protocol · GPL v3 · Draft v0.1**

---

## Purpose

The Exotopia Security Bulletin is a community-curated security intelligence feed filtered for relevance to NFT creators, settlement owners, and ecosystem participants. It is designed to do two things simultaneously:

1. **Public service** — deliver timely, plain-language CVE and smart contract vulnerability alerts to a non-specialist audience
2. **Disbursement mechanism test** — run ART token rewards through a real multi-party verification workflow, validating the disbursement pipeline before higher-stakes use

The CVE Program itself is undergoing significant structural change (CVE Foundation formed 2025, NVD processing backlog). This creates a gap in community intelligence that a focused, ecosystem-specific bulletin can fill.

---

## Why this community

The people Exotopia serves — field researchers, community artists, eco-ops volunteers, settlement builders — are not typically security researchers. But they hold wallets, mint NFTs, and transact on-chain. A reentrancy exploit in a widely-used ERC-721 library or a phishing campaign targeting Polygon users affects them directly. Standard CVE feeds are too noisy and too technical to be useful without curation.

The bulletin translates: "here is what changed, here is who it affects, here is what to do."

---

## What gets covered

### CVE filter criteria

A CVE is bulletin-worthy if it affects any of the following in a way relevant to NFT creation, settlement operation, or wallet security:

| Category | Examples |
|---|---|
| EVM clients | go-ethereum (geth), Nethermind, Besu, Erigon |
| Solidity compiler | any version < current stable |
| Smart contract libraries | OpenZeppelin Contracts, Solmate, PRBMath |
| JS/TS chain libraries | ethers.js, viem, wagmi, web3.js |
| Wallet software | MetaMask, WalletConnect, Coinbase Wallet SDK |
| IPFS / storage | go-ipfs / Kubo, Arweave JS, NFT.Storage client |
| Polygon infrastructure | Heimdall, Bor, Amoy testnet tooling |
| Celo infrastructure | celo-sdk, Alfajores tooling |
| Algorand infrastructure | algod, indexer, ARC-3/69 tooling |
| Solana / Metaplex | @solana/web3.js, Bubblegum cNFT program |
| NFT indexers / APIs | Alchemy, Moralis, The Graph |

### Non-CVE disclosures

The bulletin also covers:
- Disclosed smart contract exploits (reentrancy, logic errors, access control failures) even without a CVE number
- New attack patterns (e.g. address poisoning campaigns on Polygon)
- Phishing campaigns specifically targeting NFT creators or Web3 wallets
- Critical deprecations (e.g. a library version going end-of-life with unpatched CVEs)

### Explicit exclusions

- General infosec CVEs with no chain/NFT/wallet surface
- Price volatility, liquidity issues, or market manipulation (these are not security vulnerabilities)
- Theoretical vulnerabilities with no known exploit path and CVSS < 4.0

---

## Bulletin format

Each bulletin entry is a structured document with these fields:

```
BULLETIN-ID:    EXOSEC-YYYY-NNNN
DATE:           ISO 8601
CVE(S):         CVE-YYYY-NNNNN (or "Non-CVE — disclosed YYYY-MM-DD")
CVSS:           x.x (base) — category
NFT-IMPACT:     Critical / High / Medium / Low / Informational
AFFECTED:       [list of libraries, versions]
SUMMARY:        2-3 sentences plain language
WHAT TO DO:     Numbered action steps
VERIFICATION:   verified by [wallet address(es)] on [date]
CONTRIBUTOR:    [wallet address] (Submitter) · [wallet address] (Verifier) · [wallet address] (Curator)
ART-DISBURSED:  [transaction hash]
STATUS:         Open / Patched / Mitigated / No Action Required
```

### NFT Impact Rating

Separate from CVSS. Rates the real-world impact on an NFT creator or settlement owner:

| Rating | Meaning |
|---|---|
| **Critical** | Funds at risk without user action. Act immediately. |
| **High** | Likely wallet drain or NFT ownership loss if exploited. Patch or mitigate within 24h. |
| **Medium** | Limited exposure. Review and patch within 7 days. |
| **Low** | Theoretical or very limited scope. Monitor; no immediate action. |
| **Informational** | No direct risk; background awareness only. |

---

## Contributor roles and ART disbursement

The bulletin runs a four-role verification chain. Each role earns ART tokens on completion.

| Role | Action | ART Reward |
|---|---|---|
| **Submitter** | Finds a relevant CVE or disclosure, writes the initial draft using the template | 5 ART |
| **Verifier** | Second independent community member confirms CVE accuracy, affected version range, and impact rating | 3 ART |
| **Curator** | Adds plain-language summary, action steps, and Approvideo references; finalises bulletin | 8 ART |
| **Action-taker** | Settlement owner reads bulletin and marks it as acted upon (on-chain confirmation) | 2 ART |

**Total per bulletin (full chain):** 18 ART maximum

The disbursement transaction is triggered by the Curator completing the final bulletin. ART is distributed in a single batch transaction on Polygon, with all addresses and amounts verifiable on-chain.

### Why this tests the disbursement mechanism

The bulletin chain is structurally identical to the eco-ops verification chain:
- Multiple parties contribute to a single output
- Each role can be held by different wallet addresses (not the same person)
- The output must be verifiable (the bulletin content is the proof of work)
- The reward must be proportional, traceable, and tamper-evident

Running this with real people on real bulletins validates the disbursement logic before it handles larger eco-ops ART flows.

---

## Publication and storage

### On-chain reference

Each completed bulletin is stored:
1. Full text on IPFS (CID in bulletin record)
2. Bulletin ID + IPFS CID + contributor addresses + ART disbursement tx → Polygon event log

### $SUNLIGHT minting (optional, Curator decision)

A bulletin covering a Critical or High NFT-Impact issue may be minted as a $SUNLIGHT NFT by the Curator. This records it as a community knowledge artefact — the Curator receives 100% of any secondary resale. This is an intentional use of $SUNLIGHT for non-audio knowledge recording; the token standard allows any creative/knowledge work.

### Feed endpoint (Phase 2)

```
GET /security/bulletins/
GET /security/bulletins/{BULLETIN-ID}
GET /security/bulletins/feed.json
```

The feed will be subscribable via RSS/Atom and JSON Feed. Settlement mule-bots can pull from the feed and surface relevant bulletins in the `/plan/` endpoint.

---

## Contribution process

### Phase 1 (now) — manual, community discussion

1. Post candidate CVE to community channel with `[SECURITY]` prefix
2. Submitter writes draft using template
3. Verifier reviews and confirms (separate person, separate wallet)
4. Curator finalises and submits for ART disbursement

### Phase 2 — structured form in DocsPage

A form in the Exotopia docs section will accept:
- CVE ID or disclosure URL
- Initial impact assessment
- Wallet address for Submitter reward

Submissions routed to the security bulletin queue, verifiable on-chain.

### Phase 3 — mule-bot integration

mule-bot nodes subscribed to the bulletin feed will:
- Auto-detect CVEs affecting library versions in use at that settlement
- Surface relevant bulletins in `/plan/` as high-priority items
- Prompt the settlement owner to mark bulletins as acted upon (earning 2 ART)

---

## CVE sources to monitor

| Source | URL | Notes |
|---|---|---|
| NVD (NIST) | nvd.nist.gov | Authoritative, may have delays post-2024 backlog |
| CVE Program | cve.org | Primary MITRE source |
| OpenZeppelin advisories | github.com/OpenZeppelin/openzeppelin-contracts/security | Library-specific |
| ethers.js releases | github.com/ethers-io/ethers.js/releases | Check changelogs for security fixes |
| Ethereum Foundation blog | blog.ethereum.org | Client-layer disclosures |
| Trail of Bits advisories | github.com/trailofbits | High-quality smart contract research |
| Immunefi | immunefi.com/explore | Bug bounty disclosures (post-patch) |
| Rekt News | rekt.news | Post-mortem write-ups on actual exploits |

---

## Governance

The bulletin is a community-maintained resource. Decisions about:
- New CVE filter categories
- ART disbursement amounts
- Bulletin archival / removal

…are made via the Ecommunity DAO. The bulletin can be forked under GPL v3 by any community that wants to run a similar filtered feed for a different ecosystem.

---

## Implementation path

**Phase 1 (now):** Manual contribution via community channels. Bulletin docs stored in `/docs/security/`. ART disbursement via manual batch tx tested against Polygon Amoy testnet.

**Phase 2:** Structured submission form in DocsPage. IPFS storage. Polygon mainnet disbursement.

**Phase 3:** mule-bot feed integration. RSS/Atom subscription. Per-settlement CVE relevance scoring.

---

*Draft — SCD Hub Security Working Group · discuss before public launch*
