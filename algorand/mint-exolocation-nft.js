/**
 * algorand/mint-exolocation-nft.js
 *
 * Mints an Exotopia virtual real estate NFT on Algorand as an ARC-3 ASA.
 *
 * Depends on:
 *   npm install algosdk          (Algorand SDK v2)
 *   npm install node-fetch       (only if Node < 18; Node 18+ has fetch built-in)
 *
 * Flow:
 *   1. Build ARC-3 metadata JSON  (exolocation-metadata.js)
 *   2. Upload JSON to IPFS        (NFT.storage or Pinata — you supply the CID)
 *   3. Create Algorand ASA        (this file — makeExolocationASA)
 *   4. Optionally write ARC-69    (patchARC69Note)
 *
 * Usage:
 *   node mint-exolocation-nft.js
 *
 * Or import individual functions in your own script:
 *   const { makeExolocationASA, hashMetadata } = require('./mint-exolocation-nft');
 */

'use strict';

const algosdk  = require('algosdk');
const crypto   = require('crypto');
const fs       = require('fs');
const path     = require('path');
const em       = require('./exolocation-metadata');

// ── Configuration ─────────────────────────────────────────────────────────
// Override these via environment variables or edit directly for testing.

const ALGOD_TOKEN   = process.env.ALGOD_TOKEN   || '';          // blank for public nodes
const ALGOD_SERVER  = process.env.ALGOD_SERVER  || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT    = process.env.ALGOD_PORT    || 443;

// Mnemonic of the creator account — NEVER commit a real mnemonic to git.
// Supply via: ALGO_MNEMONIC="word1 word2 ... word25" node mint-exolocation-nft.js
const MNEMONIC = process.env.ALGO_MNEMONIC || null;

// ── SHA-256 hash helpers ───────────────────────────────────────────────────

/**
 * Compute SHA-256 of a JSON string and return a Uint8Array (32 bytes).
 * This is the value passed as `assetMetadataHash` in the ASA creation tx.
 * Per ARC-3: hash the raw bytes of the metadata file as uploaded to IPFS.
 */
function hashMetadata(metadataJSON) {
    const buf = crypto
        .createHash('sha256')
        .update(Buffer.from(metadataJSON, 'utf8'))
        .digest();
    return new Uint8Array(buf);
}

// ── IPFS upload helpers ────────────────────────────────────────────────────

/**
 * Upload metadata JSON to NFT.storage (free IPFS pinning service).
 * Requires NFT_STORAGE_API_KEY in environment.
 *
 * Returns the IPFS CID string.
 */
async function uploadToNFTStorage(metadataJSON) {
    const apiKey = process.env.NFT_STORAGE_API_KEY;
    if (!apiKey) throw new Error('NFT_STORAGE_API_KEY environment variable not set.');

    const blob = Buffer.from(metadataJSON, 'utf8');

    const response = await fetch('https://api.nft.storage/upload', {
        method:  'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type':  'application/json',
        },
        body: blob,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error('NFT.storage upload failed (' + response.status + '): ' + text);
    }

    const result = await response.json();
    return result.value.cid;
}

/**
 * Upload metadata JSON to Pinata (alternative IPFS pinning).
 * Requires PINATA_JWT in environment.
 *
 * Returns the IPFS CID string.
 */
async function uploadToPinata(metadataJSON) {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) throw new Error('PINATA_JWT environment variable not set.');

    const body = JSON.stringify({
        pinataContent:  JSON.parse(metadataJSON),
        pinataMetadata: { name: 'exotopia-exolocation.json' },
    });

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method:  'POST',
        headers: {
            'Authorization': 'Bearer ' + jwt,
            'Content-Type':  'application/json',
        },
        body,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error('Pinata upload failed (' + response.status + '): ' + text);
    }

    const result = await response.json();
    return result.IpfsHash;
}

// ── ASA creation ──────────────────────────────────────────────────────────

/**
 * Create an Algorand ASA representing one Exotopia virtual property.
 *
 * @param {object}   opts
 * @param {object}   opts.algodClient    - algosdk.Algodv2 instance
 * @param {object}   opts.creatorAccount - algosdk account object { addr, sk }
 * @param {string}   opts.metadataCID    - IPFS CID of the uploaded ARC-3 JSON
 * @param {Uint8Array} opts.metadataHash - SHA-256 of the metadata JSON (32 bytes)
 * @param {string}   opts.assetName      - max 32 chars
 * @param {string}   opts.unitName       - max 8 chars (e.g. 'EXOSURF')
 * @param {boolean}  [opts.dryRun=false] - if true, build and log the tx but do not submit
 *
 * @returns {{ txId: string, assetId: number } | { dryRun: true, txn: object }}
 */
async function makeExolocationASA(opts) {
    const {
        algodClient,
        creatorAccount,
        metadataCID,
        metadataHash,
        assetName,
        unitName,
        dryRun = false,
    } = opts;

    const suggestedParams = await algodClient.getTransactionParams().do();

    // ARC-3 URL format: ipfs://{CID}#arc3
    const assetURL = 'ipfs://' + metadataCID + '#arc3';

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from:               creatorAccount.addr,
        suggestedParams,
        defaultFrozen:      false,
        unitName:           unitName.substring(0, 8).toUpperCase(),
        assetName:          assetName.substring(0, 32),
        manager:            creatorAccount.addr,
        reserve:            creatorAccount.addr,   // reserve = metadata update authority
        freeze:             undefined,
        clawback:           undefined,
        assetURL,
        assetMetadataHash:  metadataHash,
        total:              1,                      // NFT: supply = 1
        decimals:           0,
    });

    if (dryRun) {
        console.log('[DRY RUN] Transaction built successfully.');
        console.log('  Asset name :', assetName);
        console.log('  Unit name  :', unitName);
        console.log('  URL        :', assetURL);
        console.log('  Hash (hex) :', Buffer.from(metadataHash).toString('hex'));
        return { dryRun: true, txn };
    }

    const signedTxn = txn.signTxn(creatorAccount.sk);
    const { txId }  = await algodClient.sendRawTransaction(signedTxn).do();

    console.log('Transaction submitted:', txId);
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    const ptx     = await algodClient.pendingTransactionInformation(txId).do();
    const assetId = ptx['asset-index'];

    console.log('ASA created. Asset ID:', assetId);
    return { txId, assetId };
}

/**
 * Patch an existing NFT transaction with an ARC-69 note by sending a no-op
 * asset configuration transaction.  This stores the compact on-chain record.
 *
 * @param {object} opts
 * @param {object} opts.algodClient
 * @param {object} opts.managerAccount - must be the ASA manager
 * @param {number} opts.assetId
 * @param {object} opts.noteObject     - output of em.buildARC69Note(params)
 */
async function patchARC69Note(opts) {
    const { algodClient, managerAccount, assetId, noteObject } = opts;

    const noteJSON  = JSON.stringify(noteObject);
    if (noteJSON.length > 1024) {
        throw new Error('ARC-69 note exceeds 1 KB (' + noteJSON.length + ' bytes).');
    }
    const noteBytes = new TextEncoder().encode(noteJSON);

    const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
        from:          managerAccount.addr,
        suggestedParams,
        assetIndex:    assetId,
        manager:       managerAccount.addr,
        reserve:       managerAccount.addr,
        freeze:        undefined,
        clawback:      undefined,
        strictEmptyAddressChecking: false,
        note:          noteBytes,
    });

    const signedTxn = txn.signTxn(managerAccount.sk);
    const { txId }  = await algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    console.log('ARC-69 note patched. TxID:', txId);
    return { txId };
}

// ── End-to-end mint flow ───────────────────────────────────────────────────

/**
 * Full mint pipeline for one exolocation property.
 *
 * @param {object} exoParams   - validated exolocation params (see em.EXAMPLES)
 * @param {object} [mintOpts]
 * @param {string} [mintOpts.ipfsProvider]  'nftstorage' (default) or 'pinata'
 * @param {boolean} [mintOpts.writeARC69]   also patch ARC-69 on-chain note (default true)
 * @param {boolean} [mintOpts.dryRun]       skip all network calls, log only (default false)
 * @param {string} [mintOpts.outputFile]    if set, write final metadata JSON to this path
 */
async function mintExolocationProperty(exoParams, mintOpts) {
    mintOpts = mintOpts || {};
    const dryRun       = mintOpts.dryRun       !== false ? true : false; // default: dryRun
    const writeARC69   = mintOpts.writeARC69   !== false;
    const ipfsProvider = mintOpts.ipfsProvider || 'nftstorage';
    const outputFile   = mintOpts.outputFile   || null;

    // 1. Build + validate metadata
    console.log('\n[1/4] Building ARC-3 metadata…');
    const arc3Meta   = em.buildARC3(exoParams);
    const arc3JSON   = JSON.stringify(arc3Meta, null, 2);
    const metaHash   = hashMetadata(arc3JSON);

    console.log('      Region     :', arc3Meta.name);
    console.log('      System     :', exoParams.coordinate_system);
    console.log('      Hash (hex) :', Buffer.from(metaHash).toString('hex'));

    if (outputFile) {
        fs.writeFileSync(outputFile, arc3JSON, 'utf8');
        console.log('      Saved to   :', outputFile);
    }

    // 2. Upload to IPFS
    let cid;
    if (dryRun) {
        cid = 'DRY_RUN_CID_PLACEHOLDER';
        console.log('\n[2/4] IPFS upload skipped (dry run).');
    } else {
        console.log('\n[2/4] Uploading to IPFS (' + ipfsProvider + ')…');
        cid = ipfsProvider === 'pinata'
            ? await uploadToPinata(arc3JSON)
            : await uploadToNFTStorage(arc3JSON);
        console.log('      CID:', cid);
    }

    // 3. Mint ASA
    console.log('\n[3/4] Minting Algorand ASA…');
    if (!MNEMONIC && !dryRun) {
        throw new Error('ALGO_MNEMONIC environment variable is required for live minting.');
    }

    const algodClient = new algosdk.Algodv2(
        { 'X-API-Key': ALGOD_TOKEN },
        ALGOD_SERVER,
        ALGOD_PORT
    );

    const account = MNEMONIC
        ? algosdk.mnemonicToSecretKey(MNEMONIC)
        : { addr: 'DRY_RUN_ADDRESS', sk: new Uint8Array(64) };

    const asaResult = await makeExolocationASA({
        algodClient,
        creatorAccount: account,
        metadataCID:    cid,
        metadataHash:   metaHash,
        assetName:      em.assetNameFor(exoParams.region_name),
        unitName:       em.unitNameFor(exoParams.coordinate_system),
        dryRun,
    });

    // 4. Patch ARC-69 note
    if (writeARC69 && !dryRun) {
        console.log('\n[4/4] Writing ARC-69 on-chain note…');
        const arc69Note = em.buildARC69Note(exoParams);
        await patchARC69Note({
            algodClient,
            managerAccount: account,
            assetId:        asaResult.assetId,
            noteObject:     arc69Note,
        });
    } else {
        console.log('\n[4/4] ARC-69 note' + (dryRun ? ' skipped (dry run).' : ' skipped (writeARC69=false).'));
        const arc69Note = em.buildARC69Note(exoParams);
        console.log('      Note JSON :', JSON.stringify(arc69Note));
    }

    console.log('\nDone.');
    return { cid, arc3Meta, asaResult };
}

// ── CLI entry point ───────────────────────────────────────────────────────

if (require.main === module) {
    // Default: dry-run with the exo-surface-v1 example
    const exoType = process.argv[2] || 'exo-surface-v1';
    const params  = em.EXAMPLES[exoType];

    if (!params) {
        console.error('Unknown type "' + exoType + '". Available: ' + Object.keys(em.EXAMPLES).join(', '));
        process.exit(1);
    }

    mintExolocationProperty(params, {
        dryRun:     true,
        writeARC69: true,
        outputFile: path.join(__dirname, '..', 'public', 'last-mint-metadata.json'),
    }).catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
}

// ── Exports ───────────────────────────────────────────────────────────────

module.exports = {
    hashMetadata,
    uploadToNFTStorage,
    uploadToPinata,
    makeExolocationASA,
    patchARC69Note,
    mintExolocationProperty,
};
