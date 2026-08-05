/**
 * src/lib/evm/mint-evm.ts
 *
 * EVM wallet interaction and ERC-721 testnet minting for PON INK.
 *
 * Uses ethers v6 with the injected window.ethereum provider (MetaMask,
 * Celo Valora web, etc.) — no custodial key handling in the browser.
 *
 * Two modes:
 *   DRY RUN  — validates metadata, estimates gas, logs call data.
 *              No on-chain transaction; safe to call without a wallet.
 *   EXECUTE  — switches chain, uploads metadata to Pinata (TODO), calls
 *              safeMint on the deployed ERC-721 contract.
 *
 * Fee isolation:
 *   Gas estimation is returned as its own field.
 *   It is NEVER added to or subtracted from community payout amounts.
 *
 * Contract ABI (minimal — safeMint only):
 *   The contract must implement OpenZeppelin ERC721URIStorage:
 *     function safeMint(address to, string memory uri) public
 */

import { BrowserProvider, Contract } from 'ethers'
import type { EvmChain } from './chains'
import type { Erc721Metadata } from './erc721-metadata'

// ── Pinata IPFS upload ────────────────────────────────────────────────────────

function pinataJwt(): string {
  return ((import.meta as any).env?.VITE_PINATA_JWT ?? '') as string
}

/**
 * Upload metadata JSON to Pinata IPFS and return `ipfs://<CID>`.
 * Throws if the JWT is missing or the upload fails.
 */
async function uploadToPinata(metadata: Erc721Metadata): Promise<string> {
  const jwt = pinataJwt()
  if (!jwt) throw new Error('VITE_PINATA_JWT is not set — add it to .env.local')

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent:  metadata,
      pinataMetadata: { name: metadata.name },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Pinata upload failed (${res.status}): ${text}`)
  }
  const data = await res.json() as { IpfsHash: string }
  return `ipfs://${data.IpfsHash}`
}

/** True if Pinata JWT is configured in this deployment. */
export function hasPinata(): boolean {
  return !!pinataJwt()
}

// ── Minimal ABI — only what MintPage needs ────────────────────────────────────

const ERC721_MINT_ABI = [
  'function safeMint(address to, string memory uri) public',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
] as const

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DryRunResult {
  valid:            boolean
  metadataJson:     string         // pretty-printed JSON
  metadataBytes:    number
  estimatedGasUnits?: bigint
  estimatedGasEth?:  string        // human-readable "0.000012 ETH/MATIC/CELO"
  callDataHex?:     string         // the raw calldata that would be sent
  errors:           string[]
  warnings:         string[]
}

export interface MintResult {
  success:     boolean
  txHash?:     string
  tokenId?:    string
  explorerUrl?: string
  error?:      string
}

// ── Wallet helpers ────────────────────────────────────────────────────────────

/** Returns true if a window.ethereum injected provider is available. */
export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && !!(window as any).ethereum
}

/** Request account access from the injected wallet. Returns the first address. */
export async function requestAccount(): Promise<string> {
  if (!hasInjectedWallet()) throw new Error('No injected EVM wallet found. Install MetaMask or Celo Valora.')
  const provider = new BrowserProvider((window as any).ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  return signer.address
}

/**
 * Switch the injected wallet to the given chain.
 * Adds the chain if the wallet doesn't know it yet (EIP-3085).
 */
export async function switchToChain(chain: EvmChain): Promise<void> {
  if (!hasInjectedWallet()) throw new Error('No injected wallet')
  const eth = (window as any).ethereum

  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.chainIdHex }],
    })
  } catch (err: any) {
    // 4902 = chain not found — add it
    if (err.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId:           chain.chainIdHex,
          chainName:         chain.name,
          rpcUrls:           chain.rpcUrls,
          nativeCurrency:    chain.nativeCurrency,
          blockExplorerUrls: [chain.blockExplorer],
        }],
      })
    } else {
      throw err
    }
  }
}

// ── Dry run ───────────────────────────────────────────────────────────────────

/**
 * Validate metadata and estimate gas without any on-chain call.
 * Safe to call without a connected wallet.
 */
export async function dryRunMint(
  metadata:        Erc721Metadata,
  chain:           EvmChain,
  contractAddress: string,
  recipientAddress?: string,
): Promise<DryRunResult> {
  const errors:   string[] = []
  const warnings: string[] = []

  // ── Metadata validation ────────────────────────────────────────────────────
  if (!metadata.name?.trim())              errors.push('name is empty')
  if (!metadata.description?.trim())       errors.push('description is empty')
  if (!metadata.image)                     warnings.push('image URI is empty — token will have no cover art')
  if (!metadata.attributes?.length)        warnings.push('no attributes — token will lack trait data')
  if (contractAddress.startsWith('PLACE')) warnings.push('contract address is a placeholder — cannot execute on-chain')

  const metadataJson  = JSON.stringify(metadata, null, 2)
  const metadataBytes = new TextEncoder().encode(metadataJson).length

  if (metadataBytes > 30_000) {
    warnings.push(`Metadata is large (${metadataBytes} bytes) — prefer IPFS URI pointer over on-chain storage`)
  }

  // ── Gas estimation (only if wallet available and address not placeholder) ──
  let estimatedGasUnits: bigint | undefined
  let estimatedGasEth:   string | undefined
  let callDataHex:       string | undefined

  if (hasInjectedWallet() && !contractAddress.startsWith('PLACE') && recipientAddress) {
    try {
      const provider  = new BrowserProvider((window as any).ethereum)
      const contract  = new Contract(contractAddress, ERC721_MINT_ABI, provider)

      // Encode the calldata
      const iface     = contract.interface
      callDataHex     = iface.encodeFunctionData('safeMint', [
        recipientAddress,
        metadataBytes < 512 ? metadataJson : `ipfs://PREVIEW_CID_PLACEHOLDER`,
      ])

      // Estimate gas units
      estimatedGasUnits = await provider.estimateGas({
        to:   contractAddress,
        data: callDataHex,
        from: recipientAddress,
      })

      const feeData = await provider.getFeeData()
      if (feeData.gasPrice && estimatedGasUnits) {
        const gasCost = feeData.gasPrice * estimatedGasUnits
        estimatedGasEth = `~${(Number(gasCost) / 1e18).toFixed(6)} ${chain.nativeCurrency.symbol}`
      }
    } catch (e: any) {
      warnings.push(`Gas estimation failed (${e.message}) — wallet may need to be connected to ${chain.name}`)
    }
  } else {
    warnings.push('Gas estimation skipped — connect wallet for live estimate')
  }

  return {
    valid: errors.length === 0,
    metadataJson,
    metadataBytes,
    estimatedGasUnits,
    estimatedGasEth,
    callDataHex,
    errors,
    warnings,
  }
}

// ── Execute mint ──────────────────────────────────────────────────────────────

/**
 * Execute an ERC-721 safeMint on the target chain.
 *
 * Steps:
 *   1. Switch wallet to chain
 *   2. TODO: Upload metadata to Pinata → get IPFS CID
 *   3. Call safeMint(recipient, tokenURI) on contract
 *   4. Return tx hash and explorer URL
 *
 * TESTNET ONLY until contract addresses are live on mainnet.
 *
 * Fee isolation: gas cost is passed through from the wallet signing dialog —
 * it is never deducted from community payout in this function.
 */
export async function executeMint(
  metadata:          Erc721Metadata,
  chain:             EvmChain,
  contractAddress:   string,
  recipientAddress?: string,
): Promise<MintResult> {
  if (contractAddress.startsWith('PLACE')) {
    return {
      success: false,
      error:   `Contract not yet deployed on ${chain.name}. Run the Hardhat deploy script first.`,
    }
  }

  if (!hasInjectedWallet()) {
    return { success: false, error: 'No injected EVM wallet. Install MetaMask or Celo Valora.' }
  }

  try {
    await switchToChain(chain)

    const provider = new BrowserProvider((window as any).ethereum)
    const signer   = await provider.getSigner()
    const to       = recipientAddress ?? signer.address

    // Upload metadata: use Pinata when JWT is configured, else fall back to
    // base64 data URI (fine for testnet; too large for mainnet).
    let tokenURI: string
    if (hasPinata()) {
      tokenURI = await uploadToPinata(metadata)
    } else {
      tokenURI = `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(metadata))))}`
    }

    const contract = new Contract(contractAddress, ERC721_MINT_ABI, signer)
    const tx       = await contract.safeMint(to, tokenURI)
    const receipt  = await tx.wait()

    return {
      success:    true,
      txHash:     receipt.hash,
      explorerUrl: `${chain.blockExplorer}/tx/${receipt.hash}`,
    }
  } catch (e: any) {
    return { success: false, error: e.message ?? String(e) }
  }
}
