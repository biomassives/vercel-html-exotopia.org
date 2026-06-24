import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'

dotenv.config()

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY
  // Safety fallback — Hardhat won't actually use this to send transactions
  ?? '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    amoy: {
      url:      'https://rpc-amoy.polygon.technology',
      accounts: [PRIVATE_KEY],
      chainId:  80002,
    },
    alfajores: {
      url:      'https://alfajores-forno.celo-testnet.org',
      accounts: [PRIVATE_KEY],
      chainId:  44787,
    },
  },
}

export default config
