# DropForge

### Token distribution made transparent.

DropForge is a permissionless, no-code platform for creating and claiming Merkle-verified token distributions on BOT Chain. Campaign funds are escrowed in a non-upgradeable smart contract, and every claim is proven and settled on-chain.

**Create. Distribute. Verify.**

---

## 1. The Problem

Token distributions (airdrops, rewards, grants) are a core growth primitive in crypto, but running one safely is still painful:

- **Manual transfers don't scale.** Sending tokens one-by-one from a multisig is expensive, error-prone, and unauditable.
- **Recipients can't verify fairness.** With batch sends, there is no cryptographic proof that each wallet received its promised allocation.
- **Existing tooling is heavy or custodial.** Airdrop platforms charge fees, hold funds, and often require databases, indexers, and operational trust.
- **Push-based airdrops waste money.** Teams pay gas to send tokens to wallets that may never claim, and public claim contracts invite bots and double-claim attempts.
- **Low-fee chains are underserved.** Airdrops are extremely fee-sensitive — every single recipient eventually claims, so per-claim cost is a first-order concern.

---

## 2. The Solution

DropForge turns a spreadsheet into a verifiable, self-serve distribution campaign:

1. **Upload allocations.** A CSV of `wallet_address,allocation` is validated, deduplicated, and turned into an OpenZeppelin `StandardMerkleTree` — entirely in the browser.
2. **Fund on-chain.** One transaction creates the campaign and escrows the full allocation in the distributive contract (native BOT or any ERC-20).
3. **Claim with proof.** Eligible recipients submit their Merkle proof; the contract verifies eligibility, blocks double claims, enforces the claim window, and pays out from escrow.

Unclaimed funds are reclaimable by the creator after expiry. There is no platform custody, no admin key, and no platform fee.

---

## 3. How It Works

| Step | Actor | What happens |
| --- | --- | --- |
| 01 — Allocate | Creator | Upload CSV → validation, merge duplicates → Merkle root + proofs generated and verified locally |
| 02 — Fund | Creator | Wallet signs `createCampaign`: escrows native BOT or ERC-20, records root, window, and metadata hash |
| 03 — Claim | Recipient | Wallet signs `claim`: Merkle proof verified on-chain, funds released from escrow |
| 04 — Reclaim | Creator | After expiry, `withdrawUnclaimed` returns whatever was not claimed and closes the campaign |

---

## 4. Product Highlights

- **Proof-first UX** — every Merkle proof is generated *and verified locally* before any transaction is signed. Bad data never reaches the chain.
- **Native + ERC-20** — one contract handles native BOT and any ERC-20, with exact-amount approvals.
- **No backend required to operate** — campaign state, claim progress, and eligibility are read directly from the contract.
- **Manifest integrity** — distribution manifests pin to IPFS with a keccak256 hash recorded on-chain, so proofs can't be swapped after funding.
- **Wallet-native** — MetaMask/EIP-1193 with automatic BOT Chain detection and network add/switch.
- **Live campaign explorer** — search, status filters (active/upcoming/expired), per-campaign claim progress and eligibility checks.

---

## 5. Why BOT Chain

- **Fee-sensitive product on a low-fee chain.** Claim costs fall on recipients, so cheap gas directly expands who can participate.
- **Growing ecosystem.** New BOT Chain projects need airdrop and rewards infrastructure they can trust without hiring auditors or writing one-off scripts.
- **Mainnet-ready configuration.** DropForge ships with both BOT testnet (968) and mainnet (677) network configs.

---

## 6. Architecture

```
Creator wallet ──► Next.js UI (wagmi + viem)
                     │  CSV parse → StandardMerkleTree → local proof verification
                     ▼
              IPFS manifest (Pinata)  ── keccak256 hash recorded on-chain
                     │
                     ▼
     DropForgeDistributor.sol (BOT Chain) ◄── Recipient wallet (claim + proof)
        • multi-campaign factory
        • native BOT + ERC-20 escrow
        • time-windowed claims
        • one-time expiry refund
```

**Smart contract**

- Solidity `0.8.24`, non-upgradeable, permissionless — no owner, no pause, no admin.
- OpenZeppelin `SafeERC20`, `MerkleProof`, `ReentrancyGuard`.
- Leaf encoding: `StandardMerkleTree.of(values, ["uint256","address","uint256"])` with the campaign ID bound into the leaf, so proofs cannot be replayed across campaigns.
- Custom errors, exact-funding balance checks, and per-recipient claim tracking.

**Stack**

- Frontend: Next.js 15, React 19, wagmi, viem.
- Contracts: Hardhat, TypeScript deploy/preflight scripts, unit tests.
- Storage: IPFS for public proof manifests; local dev fallback for testnet.

---

## 7. Why DropForge Wins

| Alternative | Weakness | DropForge |
| --- | --- | --- |
| Multisig batch transfers | Expensive, unauditable, unrecoverable mistakes | Escrow + on-chain proofs + expiry refund |
| Disperse-style pushes | Pays gas for wallets that never claim | Pull-based claims — recipients pay their own gas |
| Raw MerkleDistributor snippets | Single campaign, often ERC-20 only, no product | Multi-campaign factory, native + ERC-20, full UI |
| Airdrop SaaS platforms | Fees, custody, off-chain trust | No fees, no custody, 100% on-chain verification |

---

## 8. Traction — Live Today

- **Deployed and working on BOT Chain Testnet** — full create → approve → claim → withdraw flow demonstrated end to end.
- **Contract:** `0x305c6BC13F89B272da6B6a80e9d6E832043E1099` ([BOTScan](https://scan.bohr.life/address/0x305c6BC13F89B272da6B6a80e9d6E832043E1099))
- **Test coverage** for the critical paths: native campaign creation + valid proof claim, cross-campaign proof rejection, unauthorized withdrawal rejection, and post-expiry refund.
- **Production surface:** Vercel-ready frontend, Pinata-backed IPFS manifests, preflight/deploy scripts, testnet wallet tooling.

---

## 9. Business Model (Vision)

DropForge is free at the protocol level today. Sustainability paths being explored:

- **Optional premium services** — managed campaign setup, analytics, whitelabel claim pages.
- **Enterprise/API access** — programmatic campaign creation and reporting for DAOs, exchanges, and launchpads.
- **Ecosystem partnerships** — distribution infrastructure for launchpads and games on BOT Chain.

No custodial fees and no forced platform cut are part of the product promise.

---

## 10. Roadmap

**Now — Testnet MVP**
- Contract deployed on BOT Chain testnet; unit tests passing; Vercel deployment live.

**Next — Mainnet readiness**
- Independent contract review, mainnet (677) deployment and verification.
- Indexer for fast campaign discovery at scale.
- Scheduled / vesting-style claims, multisig-friendly campaign creation.

**Later — Distribution platform**
- Claim links and recipient notifications, analytics dashboard, SDK/API.
- Cross-chain distribution tooling.

---

## 11. Security & Honesty

- Non-upgradeable, ownerless, permissionless. No admin can move or freeze escrowed funds.
- Reentrancy-protected, `SafeERC20`, exact-funding checks, campaign-bound Merkle leaves.
- **Known limitations:** the MVP has not been audited; IPFS manifests are public (never include sensitive recipient data); currently testnet-only. Testsuite and compilation are not a substitute for an audit.

---

## 12. Team & Contact

<!-- Fill in before sharing: -->
- **Founder / Engineer** — name, background
- **Contact** — email / X / Telegram
- **Repo** — https://github.com/zuhdev/dropforge

---

## 13. The Ask

<!-- Adjust to your audience before sharing: -->
- **Pilot partners:** projects on BOT Chain ready to run a live airdrop.
- **Audit support:** funding for an independent review ahead of mainnet.
- **Ecosystem grants:** to accelerate indexer, vesting claims, and analytics.

---

## Appendix — Key Facts

| Item | Value |
| --- | --- |
| Network | BOT Chain Testnet, chain ID `968` |
| RPC / Explorer | `https://rpc.bohr.life` / `https://scan.bohr.life` |
| Distributor | `0x305c6BC13F89B272da6B6a80e9d6E832043E1099` |
| Proof standard | OpenZeppelin `StandardMerkleTree` `["uint256","address","uint256"]` |
| Token support | Native BOT + any ERC-20 |
| Platform fees | None |
| Admin keys | None — non-upgradeable, permissionless |
| Frontend | Next.js 15 · React 19 · wagmi · viem |
| Contracts | Solidity 0.8.24 · Hardhat · OpenZeppelin 5 |
