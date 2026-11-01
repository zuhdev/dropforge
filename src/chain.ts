import { createPublicClient, defineChain, http } from "viem";

export const BOT_TESTNET = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
  blockExplorers: { default: { name: "BOTScan", url: "https://scan.bohr.life" } },
});

export const DISTRIBUTOR_ADDRESS = "0x305c6BC13F89B272da6B6a80e9d6E832043E1099" as const;
export const publicClient = createPublicClient({ chain: BOT_TESTNET, transport: http() });

export const distributorAbi = [
  { type: "function", name: "campaignCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getCampaign", stateMutability: "view", inputs: [{ name: "campaignId", type: "uint256" }], outputs: [
    { name: "creator", type: "address" }, { name: "token", type: "address" }, { name: "merkleRoot", type: "bytes32" },
    { name: "totalAllocation", type: "uint256" }, { name: "totalClaimed", type: "uint256" }, { name: "remainingAllocation", type: "uint256" },
    { name: "startTime", type: "uint64" }, { name: "endTime", type: "uint64" }, { name: "metadataURI", type: "string" }, { name: "closed", type: "bool" },
  ] },
  { type: "function", name: "hasClaimed", stateMutability: "view", inputs: [{ name: "campaignId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "createCampaign", stateMutability: "payable", inputs: [
    { name: "token", type: "address" }, { name: "merkleRoot", type: "bytes32" }, { name: "totalAllocation", type: "uint256" },
    { name: "startTime", type: "uint64" }, { name: "endTime", type: "uint64" }, { name: "metadataURI", type: "string" }, { name: "metadataHash", type: "bytes32" },
  ], outputs: [{ name: "campaignId", type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "campaignId", type: "uint256" }, { name: "recipient", type: "address" }, { name: "amount", type: "uint256" }, { name: "proof", type: "bytes32[]" }], outputs: [] },
  { type: "function", name: "withdrawUnclaimed", stateMutability: "nonpayable", inputs: [{ name: "campaignId", type: "uint256" }], outputs: [] },
  { type: "event", name: "CampaignCreated", anonymous: false, inputs: [
    { indexed: true, name: "campaignId", type: "uint256" }, { indexed: true, name: "creator", type: "address" }, { indexed: true, name: "token", type: "address" },
    { indexed: false, name: "merkleRoot", type: "bytes32" }, { indexed: false, name: "totalAllocation", type: "uint256" }, { indexed: false, name: "startTime", type: "uint64" },
    { indexed: false, name: "endTime", type: "uint64" }, { indexed: false, name: "metadataURI", type: "string" }, { indexed: false, name: "metadataHash", type: "bytes32" },
  ] },
  { type: "event", name: "TokensClaimed", anonymous: false, inputs: [
    { indexed: true, name: "campaignId", type: "uint256" }, { indexed: true, name: "recipient", type: "address" }, { indexed: false, name: "amount", type: "uint256" },
  ] },
] as const;

export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;