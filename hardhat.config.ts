import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    botTestnet: { url: process.env.BOT_TESTNET_RPC ?? "https://rpc.bohr.life", chainId: 968,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [] },
    botMainnet: { url: process.env.BOT_MAINNET_RPC ?? "https://rpc.botchain.ai", chainId: 677,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [] }
  },
  etherscan: { apiKey: { botTestnet: process.env.BOTSCAN_API_KEY ?? "", botMainnet: process.env.BOTSCAN_API_KEY ?? "" },
    customChains: [
      { network: "botTestnet", chainId: 968, urls: { apiURL: "https://scan.bohr.life/api", browserURL: "https://scan.bohr.life" } },
      { network: "botMainnet", chainId: 677, urls: { apiURL: "https://scan.botchain.ai/api", browserURL: "https://scan.botchain.ai" } }
    ] }
};
export default config;