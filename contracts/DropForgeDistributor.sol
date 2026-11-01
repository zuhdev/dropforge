// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DropForgeDistributor
/// @notice Non-upgradeable, permissionless campaign factory for native BOT and ERC-20 airdrops.
contract DropForgeDistributor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Campaign {
        address creator;
        address token; // address(0) denotes native BOT
        bytes32 merkleRoot;
        uint256 totalAllocation;
        uint256 totalClaimed;
        uint64 startTime;
        uint64 endTime;
        string metadataURI;
        bytes32 metadataHash;
        bool closed;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(address => bool)) private claimed;

    error InvalidRoot(); error InvalidAllocation(); error InvalidPeriod(); error InvalidToken();
    error IncorrectNativeFunding(); error IncorrectTokenFunding(); error CampaignNotFound();
    error ClaimPeriodClosed(); error AlreadyClaimed(); error InvalidProof(); error CampaignClosed();
    error NotCreator(); error CampaignNotExpired(); error NativeTransferFailed();

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, address indexed token,
        bytes32 merkleRoot, uint256 totalAllocation, uint64 startTime, uint64 endTime,
        string metadataURI, bytes32 metadataHash);
    event TokensClaimed(uint256 indexed campaignId, address indexed recipient, uint256 amount);
    event UnclaimedTokensWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);

    function createCampaign(
        address token, bytes32 merkleRoot, uint256 totalAllocation,
        uint64 startTime, uint64 endTime, string calldata metadataURI, bytes32 metadataHash
    ) external payable nonReentrant returns (uint256 campaignId) {
        if (merkleRoot == bytes32(0)) revert InvalidRoot();
        if (totalAllocation == 0) revert InvalidAllocation();
        if (startTime < block.timestamp || endTime <= startTime) revert InvalidPeriod();
        if (token == address(0)) {
            if (msg.value != totalAllocation) revert IncorrectNativeFunding();
        } else {
            if (msg.value != 0 || token.code.length == 0) revert InvalidToken();
            IERC20 asset = IERC20(token);
            uint256 beforeBalance = asset.balanceOf(address(this));
            asset.safeTransferFrom(msg.sender, address(this), totalAllocation);
            if (asset.balanceOf(address(this)) - beforeBalance != totalAllocation) revert IncorrectTokenFunding();
        }
        campaignId = ++campaignCount;
        campaigns[campaignId] = Campaign(msg.sender, token, merkleRoot, totalAllocation, 0,
            startTime, endTime, metadataURI, metadataHash, false);
        emit CampaignCreated(campaignId, msg.sender, token, merkleRoot, totalAllocation,
            startTime, endTime, metadataURI, metadataHash);
    }

    /// @dev Leaf encoding matches OpenZeppelin StandardMerkleTree.of(values, ["uint256","address","uint256"]).
    function claim(uint256 campaignId, address recipient, uint256 amount, bytes32[] calldata proof)
        external nonReentrant
    {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (campaign.closed || block.timestamp < campaign.startTime || block.timestamp > campaign.endTime) revert ClaimPeriodClosed();
        if (claimed[campaignId][recipient]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(campaignId, recipient, amount))));
        if (!MerkleProof.verifyCalldata(proof, campaign.merkleRoot, leaf)) revert InvalidProof();
        if (amount == 0 || amount > campaign.totalAllocation - campaign.totalClaimed) revert InvalidAllocation();
        claimed[campaignId][recipient] = true;
        campaign.totalClaimed += amount;
        if (campaign.token == address(0)) {
            (bool success,) = payable(recipient).call{value: amount}("");
            if (!success) revert NativeTransferFailed();
        } else IERC20(campaign.token).safeTransfer(recipient, amount);
        emit TokensClaimed(campaignId, recipient, amount);
    }

    function withdrawUnclaimed(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (msg.sender != campaign.creator) revert NotCreator();
        if (block.timestamp <= campaign.endTime) revert CampaignNotExpired();
        if (campaign.closed) revert CampaignClosed();
        campaign.closed = true;
        uint256 remaining = campaign.totalAllocation - campaign.totalClaimed;
        if (remaining != 0) {
            if (campaign.token == address(0)) {
                (bool success,) = payable(campaign.creator).call{value: remaining}("");
                if (!success) revert NativeTransferFailed();
            } else IERC20(campaign.token).safeTransfer(campaign.creator, remaining);
        }
        emit UnclaimedTokensWithdrawn(campaignId, campaign.creator, remaining);
    }

    function getCampaign(uint256 campaignId) external view returns (
        address creator, address token, bytes32 merkleRoot, uint256 totalAllocation,
        uint256 totalClaimed, uint256 remainingAllocation, uint64 startTime, uint64 endTime,
        string memory metadataURI, bool closed
    ) {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert CampaignNotFound();
        return (c.creator, c.token, c.merkleRoot, c.totalAllocation, c.totalClaimed,
            c.totalAllocation - c.totalClaimed, c.startTime, c.endTime, c.metadataURI, c.closed);
    }
    function hasClaimed(uint256 campaignId, address account) external view returns (bool) {
        return claimed[campaignId][account];
    }
}