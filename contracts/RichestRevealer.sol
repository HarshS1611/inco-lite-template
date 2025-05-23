// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint256, ebool, e} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RichestRevealer
/// Privately determines the richest participant among exactly 3 participants using encrypted wealth submissions
contract RichestRevealer is Ownable {
    using e for *;

    uint8 constant MAX_PARTICIPANTS = 3;

    // Mapping from participant address => encrypted wealth (euint256)
    mapping(address => euint256) private encryptedWealth;

    // Track who submitted
    mapping(address => bool) private hasSubmitted;

    // Exactly 3 participants
    address[3] private participants;
    uint8 private participantCount;

    // Encrypted richest index (0,1, or 2 encrypted)
    euint256[] private richestIndexEncrypted;

    // Revealed richest participant address(es)
    address[] private richestParticipants;

    // Decryption request tracking
    bool private decryptionRequested;

    // Flag to prevent recomputation
    bool public resultComputed;
    bool private resultRevealed;

    event WealthSubmitted(address indexed user);
    event RichestIndexEncrypted(euint256[] indexed richestIndex);
    event DecryptionRequested(uint256 indexed requestId);
    event RichestRevealed(address indexed richestParticipant);

    constructor() Ownable(msg.sender) {}

    /// Submit an encrypted wealth value
    function submitWealth(bytes memory encryptedValue) external {
        require(!resultComputed, "Already computed");
        require(
            participantCount < MAX_PARTICIPANTS,
            "Max 3 participants allowed"
        );
        require(!hasSubmitted[msg.sender], "Already submitted");

        euint256 value = e.newEuint256(encryptedValue, msg.sender);
        encryptedWealth[msg.sender] = value;
        hasSubmitted[msg.sender] = true;

        participants[participantCount] = msg.sender;
        participantCount++;

        e.allow(value, address(this));

        emit WealthSubmitted(msg.sender);
    }

    function computeRichest() external onlyOwner {
        require(
            participantCount == MAX_PARTICIPANTS,
            "3 participants required"
        );
        require(!resultComputed, "Already computed");

        euint256 aVal = encryptedWealth[participants[0]];
        euint256 bVal = encryptedWealth[participants[1]];
        euint256 cVal = encryptedWealth[participants[2]];

        euint256 maxVal = e.max(e.max(aVal, bVal), cVal);

        richestIndexEncrypted.push(
            e.select(e.eq(aVal, maxVal), e.asEuint256(0), e.asEuint256(255))
        );
        richestIndexEncrypted.push(
            e.select(e.eq(bVal, maxVal), e.asEuint256(1), e.asEuint256(255))
        );
        richestIndexEncrypted.push(
            e.select(e.eq(cVal, maxVal), e.asEuint256(2), e.asEuint256(255))
        );

        e.allow(richestIndexEncrypted[0], address(this));
        e.allow(richestIndexEncrypted[1], address(this));
        e.allow(richestIndexEncrypted[2], address(this));

        emit RichestIndexEncrypted(richestIndexEncrypted);
        resultComputed = true;
    }

    function requestDecryption() external onlyOwner {
        bool canCallRequest = canRequestDecryption();
        require(canCallRequest, "Cannot request decryption");
        e.allow(richestIndexEncrypted[0], address(this));
        e.allow(richestIndexEncrypted[1], address(this));
        e.allow(richestIndexEncrypted[2], address(this));
        for (uint8 i = 0; i < richestIndexEncrypted.length; i++) {
            uint256 requestId = e.requestDecryption(
                richestIndexEncrypted[i],
                this.onDecryptionCallback.selector,
                ""
            );
            emit DecryptionRequested(requestId);
        }

        decryptionRequested = true;
    }

    function onDecryptionCallback(
        uint256 requestId,
        uint256 result,
        bytes memory data
    ) public returns (bool) {
        // Ignore dummy value (255)
        if (result < MAX_PARTICIPANTS) {
            address participant = participants[result];
            richestParticipants.push(participant);
            emit RichestRevealed(participant);
        }

        // If at least one valid result was revealed, mark the result
        if (!resultRevealed && richestParticipants.length > 0) {
            resultRevealed = true;
        }

        return true;
    }

    function getParticipant(uint8 index) external view returns (address) {
        require(index < MAX_PARTICIPANTS, "Index out of range");
        return participants[index];
    }

    function hasParticipantSubmitted(
        address participant
    ) external view returns (bool) {
        return hasSubmitted[participant];
    }

    function getParticipantCount() external view returns (uint8) {
        return participantCount;
    }

    function canRequestDecryption() public view returns (bool) {
        return resultComputed && !decryptionRequested;
    }

    function isResultRevealed() external view returns (bool) {
        return resultRevealed;
    }

    function getRichestParticipants() public view returns (address[] memory) {
        require(resultRevealed, "Result not revealed yet");
        return richestParticipants;
    }
}
