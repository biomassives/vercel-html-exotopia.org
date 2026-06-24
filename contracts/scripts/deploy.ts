import { ethers, network } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const [deployer] = await ethers.getSigners()
  const balance    = await ethers.provider.getBalance(deployer.address)

  console.log(`\nNetwork:   ${network.name}`)
  console.log(`Deployer:  ${deployer.address}`)
  console.log(`Balance:   ${ethers.formatEther(balance)} ${network.name === 'amoy' ? 'MATIC' : 'CELO'}\n`)

  if (balance === 0n) {
    console.error('Deployer has zero balance. Fund from faucet first:')
    if (network.name === 'amoy')     console.error('  https://faucet.polygon.technology')
    if (network.name === 'alfajores') console.error('  https://faucet.celo.org/alfajores')
    process.exit(1)
  }

  const Factory = await ethers.getContractFactory('ExolocNFT')
  console.log('Deploying ExolocNFT…')
  const nft  = await Factory.deploy()
  await nft.waitForDeployment()

  const address = await nft.getAddress()
  console.log(`\n✓ ExolocNFT deployed: ${address}`)

  // Print the env var line ready to paste
  const envKey = network.name === 'amoy' ? 'VITE_AMOY_EXOLOC_CONTRACT' : 'VITE_ALFAJORES_EXOLOC_CONTRACT'
  console.log(`\nPaste into ../.env.local:`)
  console.log(`  ${envKey}=${address}\n`)

  // Also write an artifact for reference
  const out = {
    network:   network.name,
    contract:  'ExolocNFT',
    address,
    deployer:  deployer.address,
    timestamp: new Date().toISOString(),
  }
  const outPath = path.join(__dirname, '..', `deployed-${network.name}.json`)
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`Artifact saved: ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
