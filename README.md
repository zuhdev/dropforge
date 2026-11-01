# DropForge

DropForge creates and claims Merkle token distributions on BOT Chain. The Next.js frontend reads campaign state from the deployed distributor and asks the connected browser wallet to sign every campaign, approval, claim, and withdrawal transaction.

## Current testnet deployment

- Network: BOT Chain Testnet (chain ID `968`)
- RPC: `https://rpc.bohr.life`
- Explorer: `https://scan.bohr.life`
- Distributor: `0x305c6BC13F89B272da6B6a80e9d6E832043E1099`
- Merkle leaf encoding: OpenZeppelin `StandardMerkleTree` values `uint256,address,uint256`, with the campaign ID included.

## Local development

Requires Node.js 20+ and npm.

```bash
npm ci
npm run compile
npm test
npm run ui
```

Open `http://localhost:3000`. Connect a browser wallet, add/switch to BOT Chain Testnet, and use testnet BOT for gas. Campaign recipients need the campaign manifest URI; the frontend stores manifests locally in `data/manifests` during local development. That local directory is ignored by Git.

## Vercel deployment

Import the GitHub repository into Vercel as a Next.js project. Vercel uses `npm run vercel-build` (`next build`). Configure the following environment variable in Vercel project settings:

- `PINATA_JWT`: Pinata JWT used by the server-side manifest endpoint to pin proof manifests to IPFS. Without it, manifest upload intentionally returns an error in Vercel because serverless filesystem writes are not persistent.

The app uses the public BOT testnet RPC and fixed testnet distributor address from `src/chain.ts`; no deployer key is needed by the frontend or Vercel. Do not add `DEPLOYER_PRIVATE_KEY` to Vercel. If managing contracts separately, keep deployment credentials in a local ignored `.env` or a dedicated secrets manager, and use a dedicated testnet-only key.

After deployment, connect a wallet on BOT Chain Testnet and verify a small test campaign end to end. IPFS manifests are public: they contain recipient addresses, allocations, and proofs. Never include private or sensitive recipient data.

## Important limitations

- This MVP has no PostgreSQL/indexer. Campaign state and claims are read from the contract; per-recipient proofs come from the manifest.
- The local manifest store is for local development only. Production requires `PINATA_JWT` (or a future persistent storage provider).
- The explorer contract address is the BOT testnet deployment above; this application is not configured for mainnet.
- Review the contract independently before any use with valuable assets. Testnet compilation and unit tests do not constitute an audit.

## Contract scripts

```bash
npm run compile
npm test
npm run check:testnet
npm run deploy:testnet
```

`npm run wallet:testnet` can generate a local testnet deployer and write its key into `.env`. Never commit or share that file. Never reuse that key on mainnet.