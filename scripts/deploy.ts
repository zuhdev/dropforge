import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 968n) throw new Error(`Refusing deployment: expected BOT testnet chain 968, got ${network.chainId}`);
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer configured. Run npm run wallet:testnet, fund it, then retry.");
  if (process.env.DEPLOYER_ADDRESS && deployer.address.toLowerCase() !== process.env.DEPLOYER_ADDRESS.toLowerCase()) {
    throw new Error("Configured deployer address does not match the private key-derived signer.");
  }
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance === 0n) throw new Error(`Deployer ${deployer.address} has no testnet BOT. Fund this address and retry.`);
  console.log(`Deploying with ${deployer.address}; balance ${ethers.formatEther(balance)} BOT`);
  const factory = await ethers.getContractFactory("DropForgeDistributor");
  const distributor = await factory.deploy();
  await distributor.waitForDeployment();
  const address = await distributor.getAddress();
  const deploymentTx = distributor.deploymentTransaction();
  console.log(`DropForgeDistributor deployed to ${address} on chain ${network.chainId}`);
  console.log(`Deployment transaction: ${deploymentTx?.hash ?? "unavailable"}`);
  console.log(`Explorer: https://scan.bohr.life/address/${address}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });