const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

describe("DropForgeDistributor", function () {
  async function setup(token = ethers.ZeroAddress) {
    const [creator, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DropForgeDistributor");
    const contract = await Factory.deploy();
    const latest = await ethers.provider.getBlock("latest");
    const start = BigInt(latest.timestamp + 10);
    const end = start + 1000n;
    const values = [["1", alice.address, "60"], ["1", bob.address, "40"]];
    const tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"]);
    return { creator, alice, bob, contract, start, end, tree };
  }

  it("creates native campaign and accepts a StandardMerkleTree proof", async function () {
    const { alice, contract, start, end, tree } = await setup();
    await contract.createCampaign(ethers.ZeroAddress, tree.root, 100n, start, end, "ipfs://manifest", ethers.ZeroHash, { value: 100n });
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(start)]);
    await contract.claim(1, alice.address, 60n, tree.getProof(0));
    expect(await contract.hasClaimed(1, alice.address)).to.equal(true);
    const result = await contract.getCampaign(1);
    expect(result.totalClaimed).to.equal(60n);
    expect(result.remainingAllocation).to.equal(40n);
  });

  it("rejects a proof belonging to a different campaign", async function () {
    const { alice, contract, start, end, tree } = await setup();
    await contract.createCampaign(ethers.ZeroAddress, tree.root, 100n, start, end, "", ethers.ZeroHash, { value: 100n });
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(start)]);
    await expect(contract.claim(1, alice.address, 60n, tree.getProof(1))).to.be.reverted;
  });

  it("withdraws only unclaimed funds after expiry and rejects unauthorized withdrawal", async function () {
    const { creator, alice, contract, start, end, tree } = await setup();
    await contract.createCampaign(ethers.ZeroAddress, tree.root, 100n, start, end, "", ethers.ZeroHash, { value: 100n });
    await expect(contract.connect(alice).withdrawUnclaimed(1)).to.be.reverted;
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(end + 1n)]);
    await contract.withdrawUnclaimed(1);
    expect((await contract.getCampaign(1)).closed).to.equal(true);
    expect(creator.address).not.to.equal(ethers.ZeroAddress);
  });
});