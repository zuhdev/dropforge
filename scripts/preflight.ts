import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 968n) throw new Error(`Wrong chain: expected BOT testnet 968, got ${network.chainId}`);
  const signers = await ethers.getSigners();
  if (signers.length === 0) throw new Error("No deployer configured. Set DEPLOYER_PRIVATE_KEY in .env.");
  const deployer = signers[0];
  if (process.env.DEPLOYER_ADDRESS && deployer.address.toLowerCase() !== process.env.DEPLOYER_ADDRESS.toLowerCase()) {
    throw new Error("Configured deployer address does not match the private key-derived signer.");
  }
  const balance = await ethers.provider.getBalance(deployer.address);
  const block = await ethers.provider.getBlockNumber();
  console.log(`RPC: ${process.env.BOT_TESTNET_RPC ?? "https://rpc.bohr.life"}`);
  console.log(`Chain ID: ${network.chainId}; block: ${block}`);
  console.log(`Deployer: ${deployer.address}; balance: ${ethers.formatEther(balance)} BOT`);
  if (balance === 0n) throw new Error("Deployer has no BOT for gas. Fund it on the testnet before deploying.");
  console.log("Preflight passed. Review the deployer address and balance before proceeding.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });