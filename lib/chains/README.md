# lib/chains

Standalone blockchain-interaction code, relocated out of the Exotopia app
tree (`src/`) so it can be reused in other projects without depending on
anything app-specific (Vue, Quasar, Pinia, or this repo's own `src/lib/*`
modules). Exotopia itself no longer uses any of this — the settlement/mint
journey now runs on IPFS pinning instead (see `src/lib/ipfs-pinning.ts`).
Kept here as working reference/reusable code, not deleted.

## `evm/`

Ethers-based minting for EVM chains (Polygon, Celo) — `mint-evm.ts` (wallet
connect via `window.ethereum`, contract `safeMint(to, uri)` call, a Pinata
IPFS upload helper) and `erc721-metadata.ts` (ERC-721/OpenSea-compatible
metadata builders — $SUNLIGHT NFTs, water-quality certs, community badges).
`erc721-metadata.ts` has its contribution-split shape inlined locally
(originally imported from the app's `src/lib/resonance-split.ts`) so this
folder has zero dependency outside itself.

## `solana/`

Compressed-NFT (cNFT) tooling via Metaplex Bubblegum — tree creation
(`createTree.ts`), minting (`mintOneCNFT.ts`, `mint-station.ts`), transfer
(`transferCNFT.ts`), a plain NFT/collection variant (`createCollectionNFT.ts`),
DAS API reads (`readAPI.ts`), metadata builders (`station-metadata.ts` +
`station-schema.json`), and shared helpers (`utils.ts`). These were
previously split between `src/lib/solana/` (an app-adapted copy with an
already-broken `../utils` import — the app copy was never actually run) and
loose files at the repo root; consolidated here into one working set, using
whichever version of each file was more complete.

## `algorand/`

ARC-3/ARC-69 asset minting (`mint-exolocation-nft.js`), metadata builders
(`exolocation-metadata.js`, `exolocation-types.json` — includes the
moon-relative trophic-level coordinate systems L4-L6). Same story as
`solana/`: consolidated from a duplicated root-level copy.

## Using this elsewhere

Each subdirectory is self-contained — copy the whole `lib/chains/` folder,
or just one chain's subfolder, into another project. No path back into this
repo's `src/` tree exists in any of these files.
