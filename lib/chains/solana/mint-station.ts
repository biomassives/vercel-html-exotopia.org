/**
 * solana/mint-station.ts
 *
 * Mints Exotopia Orbital Station NFTs as Metaplex Bubblegum cNFTs on Solana.
 * Supports all three tiers:
 *
 *   mintStationCore()    — one per exolocation; must be minted before modules
 *   mintStationModule()  — one per functional zone on the station
 *   mintSolution()       — installable ecocity.com sustainable DIY solution
 *
 * Follows the same Bubblegum cNFT pattern as mintOneCNFT.ts (project root).
 *
 * Prerequisites:
 *   npm install @metaplex-foundation/mpl-bubblegum
 *               @metaplex-foundation/mpl-token-metadata
 *               @solana/spl-account-compression
 *               @solana/web3.js
 *
 * Environment / config:
 *   SOLANA_RPC_URL   — override default devnet endpoint
 *   CREATOR_KEYPAIR  — path to creator keypair JSON (default: wallet.json)
 *   MERKLE_TREE      — path to Merkle tree keypair JSON (default: tree.json)
 *   COLLECTION_MINT  — on-chain collection mint address
 *   IPFS_GATEWAY     — gateway prefix for resolving ipfs:// URIs (optional)
 *
 * Usage:
 *   # dry run (no network calls):
 *   DRY_RUN=1 npx ts-node solana/mint-station.ts core
 *   DRY_RUN=1 npx ts-node solana/mint-station.ts module gallery
 *   DRY_RUN=1 npx ts-node solana/mint-station.ts solution ibc-aquaponics
 */

'use strict';

import {
    createMintToCollectionV1Instruction,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
    TokenProgramVersion,
    MetadataArgs,
} from '@metaplex-foundation/mpl-bubblegum';
import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression';
import {
    Connection,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';

import { loadWalletKey, sendVersionedTx } from './utils';
import {
    buildStationCoreMeta,
    buildModuleMeta,
    buildSolutionMeta,
    StationCoreParams,
    StationModuleParams,
    EcocitySolutionParams,
    ModuleType,
    MetaplexMetadata,
} from './station-metadata';

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL        = process.env.SOLANA_RPC_URL   || 'https://api.devnet.solana.com';
const KEYPAIR_PATH   = process.env.CREATOR_KEYPAIR  || 'wallet.json';
const TREE_PATH      = process.env.MERKLE_TREE       || 'tree.json';
const COLLECTION_ADDR = process.env.COLLECTION_MINT  || '';
const DRY_RUN        = process.env.DRY_RUN === '1';

// Seller fee in basis points (0 = no royalty)
const SELLER_FEE_BPS = 0;

// ── PDAs ──────────────────────────────────────────────────────────────────────

function getCollectionPDAs(collectionMint: PublicKey) {
    const [collectionMetadata] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata', 'utf8'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            collectionMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
    );

    const [collectionEdition] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata', 'utf8'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            collectionMint.toBuffer(),
            Buffer.from('edition', 'utf8'),
        ],
        TOKEN_METADATA_PROGRAM_ID,
    );

    const [bgumSigner] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection_cpi', 'utf8')],
        BUBBLEGUM_PROGRAM_ID,
    );

    return { collectionMetadata, collectionEdition, bgumSigner };
}

// ── Core mint instruction builder ─────────────────────────────────────────────

/**
 * Build a Bubblegum `mintToCollectionV1` instruction for a given metadata object.
 *
 * @param meta           - Metaplex off-chain metadata (already uploaded; uri points to it)
 * @param uri            - IPFS/Arweave URI where the metadata JSON lives
 * @param ownerPubkey    - public key of the NFT recipient
 * @param creatorPubkey  - public key of the creator / payer
 * @param merkleTree     - Merkle tree public key
 * @param collectionMint - Collection mint public key
 */
function buildMintIx(
    meta:           MetaplexMetadata,
    uri:            string,
    ownerPubkey:    PublicKey,
    creatorPubkey:  PublicKey,
    merkleTree:     PublicKey,
    collectionMint: PublicKey,
): TransactionInstruction {
    const [treeAuthority] = PublicKey.findProgramAddressSync(
        [merkleTree.toBuffer()],
        BUBBLEGUM_PROGRAM_ID,
    );

    const { collectionMetadata, collectionEdition, bgumSigner } =
        getCollectionPDAs(collectionMint);

    const metadataArgs: MetadataArgs = {
        name:                  meta.name.substring(0, 32),
        symbol:                meta.symbol.substring(0, 10),
        uri,
        sellerFeeBasisPoints:  SELLER_FEE_BPS,
        primarySaleHappened:   false,
        isMutable:             true,
        editionNonce:          null,
        tokenStandard:         null,
        collection:            { key: collectionMint, verified: false },
        uses:                  null,
        tokenProgramVersion:   TokenProgramVersion.Original,
        creators:              [],
    };

    return createMintToCollectionV1Instruction(
        {
            treeAuthority,
            leafOwner:                    ownerPubkey,
            leafDelegate:                 ownerPubkey,
            merkleTree,
            payer:                        creatorPubkey,
            treeDelegate:                 creatorPubkey,
            logWrapper:                   SPL_NOOP_PROGRAM_ID,
            compressionProgram:           SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
            collectionAuthority:          creatorPubkey,
            collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
            collectionMint,
            collectionMetadata,
            editionAccount:               collectionEdition,
            bubblegumSigner:              bgumSigner,
            tokenMetadataProgram:         TOKEN_METADATA_PROGRAM_ID,
        },
        { metadataArgs },
    );
}

// ── Upload stub ───────────────────────────────────────────────────────────────

/**
 * Upload metadata JSON to IPFS/Arweave and return the URI.
 *
 * Replace this stub with your actual upload implementation:
 *   - NFT.storage:  POST to https://api.nft.storage/upload
 *   - Pinata:       POST to https://api.pinata.cloud/pinning/pinJSONToIPFS
 *   - Arweave/Bundlr: use @bundlr-network/client
 *
 * For dry runs the function returns a placeholder URI without uploading.
 */
async function uploadMetadata(meta: MetaplexMetadata, label: string): Promise<string> {
    if (DRY_RUN) {
        console.log(`  [DRY RUN] Skipping upload for "${label}" — would upload ${JSON.stringify(meta).length} bytes`);
        return `ipfs://DRY_RUN_CID_${label.replace(/\s+/g, '_')}`;
    }

    // ── Replace below with real upload logic ──────────────────────────────
    const apiKey = process.env.NFT_STORAGE_API_KEY;
    if (!apiKey) throw new Error('NFT_STORAGE_API_KEY is required for live minting.');

    const res = await fetch('https://api.nft.storage/upload', {
        method:  'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify(meta),
    });

    if (!res.ok) throw new Error(`NFT.storage upload failed (${res.status}): ${await res.text()}`);
    const result = await res.json() as { value: { cid: string } };
    return `ipfs://${result.value.cid}`;
    // ─────────────────────────────────────────────────────────────────────
}

// ── Mint functions ────────────────────────────────────────────────────────────

/**
 * Mint a StationCore cNFT.
 *
 * @param params         - StationCoreParams
 * @param recipientAddr  - Solana address of the NFT recipient
 */
export async function mintStationCore(
    params:        StationCoreParams,
    recipientAddr: string,
): Promise<{ signature: string; uri: string } | { dryRun: true; uri: string }> {
    const meta  = buildStationCoreMeta(params);
    const label = `StationCore:${params.station_id}`;
    const uri   = await uploadMetadata(meta, label);

    if (DRY_RUN) {
        console.log(`\n[DRY RUN] Station Core mint:`);
        console.log(`  station_id : ${params.station_id}`);
        console.log(`  name       : ${meta.name}`);
        console.log(`  symbol     : ${meta.symbol}`);
        console.log(`  uri        : ${uri}`);
        console.log(`  attributes : ${meta.attributes.length} traits`);
        return { dryRun: true, uri };
    }

    const creator  = loadWalletKey(KEYPAIR_PATH);
    const tree     = loadWalletKey(TREE_PATH);
    const colMint  = new PublicKey(COLLECTION_ADDR);
    const recipient = new PublicKey(recipientAddr);
    const connection = new Connection(RPC_URL);

    const ix = buildMintIx(meta, uri, recipient, creator.publicKey, tree.publicKey, colMint);
    const sig = await sendVersionedTx(connection, [ix], creator.publicKey, [creator]);

    console.log(`Station Core minted. Signature: ${sig}`);
    return { signature: sig, uri };
}

/**
 * Mint a StationModule cNFT.
 *
 * @param params         - StationModuleParams
 * @param recipientAddr  - Solana address of the NFT recipient
 */
export async function mintStationModule(
    params:        StationModuleParams,
    recipientAddr: string,
): Promise<{ signature: string; uri: string } | { dryRun: true; uri: string }> {
    const meta  = buildModuleMeta(params);
    const label = `Module:${params.module_type}:${params.module_id}`;
    const uri   = await uploadMetadata(meta, label);

    if (DRY_RUN) {
        console.log(`\n[DRY RUN] Station Module mint:`);
        console.log(`  module_id   : ${params.module_id}`);
        console.log(`  module_type : ${params.module_type}`);
        console.log(`  name        : ${meta.name}`);
        console.log(`  symbol      : ${meta.symbol}`);
        console.log(`  uri         : ${uri}`);
        return { dryRun: true, uri };
    }

    const creator   = loadWalletKey(KEYPAIR_PATH);
    const tree      = loadWalletKey(TREE_PATH);
    const colMint   = new PublicKey(COLLECTION_ADDR);
    const recipient = new PublicKey(recipientAddr);
    const connection = new Connection(RPC_URL);

    const ix = buildMintIx(meta, uri, recipient, creator.publicKey, tree.publicKey, colMint);
    const sig = await sendVersionedTx(connection, [ix], creator.publicKey, [creator]);

    console.log(`Station Module minted. Signature: ${sig}`);
    return { signature: sig, uri };
}

/**
 * Mint an EcocitySolution cNFT.
 *
 * @param params         - EcocitySolutionParams
 * @param recipientAddr  - Solana address of the NFT recipient
 */
export async function mintSolution(
    params:        EcocitySolutionParams,
    recipientAddr: string,
): Promise<{ signature: string; uri: string } | { dryRun: true; uri: string }> {
    const meta  = buildSolutionMeta(params);
    const label = `Solution:${params.solution_id}`;
    const uri   = await uploadMetadata(meta, label);

    if (DRY_RUN) {
        console.log(`\n[DRY RUN] Ecocity Solution mint:`);
        console.log(`  solution_id : ${params.solution_id}`);
        console.log(`  category    : ${params.category}`);
        console.log(`  name        : ${meta.name}`);
        console.log(`  symbol      : ${meta.symbol}`);
        console.log(`  uri         : ${uri}`);
        console.log(`  attributes  : ${meta.attributes.length} traits`);
        return { dryRun: true, uri };
    }

    const creator   = loadWalletKey(KEYPAIR_PATH);
    const tree      = loadWalletKey(TREE_PATH);
    const colMint   = new PublicKey(COLLECTION_ADDR);
    const recipient = new PublicKey(recipientAddr);
    const connection = new Connection(RPC_URL);

    const ix = buildMintIx(meta, uri, recipient, creator.publicKey, tree.publicKey, colMint);
    const sig = await sendVersionedTx(connection, [ix], creator.publicKey, [creator]);

    console.log(`Ecocity Solution minted. Signature: ${sig}`);
    return { signature: sig, uri };
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
    const tier = process.argv[2] || 'core';

    // Example recipient — replace or pass via env
    const recipient = process.env.RECIPIENT_ADDR || 'DRY_RUN_RECIPIENT';

    // ── Example params for each tier ──────────────────────────────────────

    const coreParams: StationCoreParams = {
        station_id:        'STA-0001',
        station_name:      'Proxima Outpost Alpha',
        owner:             'NatureProtectors',
        commissioned_date: '2026-04-13',
        capacity:          { crew: 12, volume_m3: 2400 },
        exolocation: {
            coordinate_system: 'exo-orbital-v1',
            region_name:       'Sector 4 Low Orbit Band',
            reference_body: {
                type:            'exoplanet',
                pl_name:         'Proxima Cen b',
                host_star:       'Proxima Centauri',
                ra_deg:          217.4289,
                dec_deg:         -62.6796,
                sy_dist_pc:      1.3,
                nasa_archive_id: 'Proxima Cen b',
            },
            boundary: {
                type:            'orbital_zone',
                altitude_km_min: 200,
                altitude_km_max: 500,
                inclination_deg: 30,
                longitude_of_ascending_node_deg: 120,
            },
        },
    };

    const moduleTypeArg = (process.argv[3] || 'gallery') as ModuleType;
    const moduleParams: StationModuleParams = {
        module_id:    `MOD-${moduleTypeArg.toUpperCase()}-0001`,
        module_type:  moduleTypeArg,
        module_name:  `Aurora ${moduleTypeArg.charAt(0).toUpperCase() + moduleTypeArg.slice(1)}`,
        station_mint: 'STA-0001-MINT-PLACEHOLDER',
        owner:        'NatureProtectors',
    };

    const solutionIdArg = process.argv[3] || 'ibc-aquaponics';
    const solutionParams: EcocitySolutionParams = {
        solution_id:     solutionIdArg,
        solution_name:   'IBC Tote Aquaponics System',
        category:        'food',
        description:     '1000 L IBC tote split into fish tank + grow bed. Tilapia fertilise leafy greens through a gravel media bed.',
        difficulty:      3,
        build_time_days: 7,
        materials: [
            { item: '1000 L IBC tote',          qty: '1' },
            { item: 'gravel grow media 20 mm',   qty: '100 L' },
            { item: 'submersible pump 2000 L/h', qty: '1' },
            { item: 'air pump + airstone',       qty: '1' },
            { item: 'fingerlings (tilapia)',      qty: '20' },
        ],
        impact: {
            beneficiaries:   4,
            food_kg_month:   12,
            water_L_day:     5,
            co2_kg_saved_day: 0.3,
        },
        compatible_modules: ['food', 'watsan'],
        ecocity_url:  'https://ecocity.com/solutions/ibc-aquaponics',
    };

    // ── Dispatch ──────────────────────────────────────────────────────────

    async function run() {
        switch (tier) {
            case 'core':
                await mintStationCore(coreParams, recipient);
                break;
            case 'module':
                await mintStationModule(moduleParams, recipient);
                break;
            case 'solution':
                await mintSolution(solutionParams, recipient);
                break;
            default:
                console.error(`Unknown tier "${tier}". Use: core | module | solution`);
                process.exit(1);
        }
    }

    run().catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
}
