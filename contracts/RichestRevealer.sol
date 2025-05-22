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
    euint256 public richestIndexEncrypted;

    // Revealed richest participant address
    address public richestParticipant;

    // Decryption request tracking
    bool private decryptionRequested;

    // Flag to prevent recomputation
    bool public resultComputed;
    bool public resultRevealed;

    event WealthSubmitted(address indexed user);
    event RichestIndexEncrypted(euint256 indexed richestIndex);
    event DecryptionRequested(uint256 indexed requestId);
    event RichestRevealed(address indexed richestParticipant);

    /// Constructor
    constructor() Ownable(msg.sender) {}

    /// Submit an encrypted wealth value
    /// @param encryptedValue Encrypted euint256 ciphertext of user's wealth
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

        // Allow contract to access encrypted value
        e.allow(value, address(this));
        e.allow(value, owner());

        emit WealthSubmitted(msg.sender);
    }

    /// Compute the richest participant from encrypted wealths (only owner)
    function computeRichest() external onlyOwner {
        require(
            participantCount == MAX_PARTICIPANTS,
            "3 participants required"
        );
        require(!resultComputed, "Already computed");

        euint256 aVal = encryptedWealth[participants[0]];
        euint256 bVal = encryptedWealth[participants[1]];
        euint256 cVal = encryptedWealth[participants[2]];

        // Find the maximum value using the max function
        euint256 maxAB = e.max(aVal, bVal);
        euint256 richestVal = e.max(maxAB, cVal);

        // Determine who has the richest value
        ebool aIsRichest = e.eq(aVal, richestVal);
        ebool bIsRichest = e.eq(bVal, richestVal);
        // If neither A nor B is richest, then C must be richest

        // Encrypted indices for participants
        euint256 zero = e.asEuint256(0);
        euint256 one = e.asEuint256(1);
        euint256 two = e.asEuint256(2);

        // Select encrypted richest index based on conditions
        // Priority: if A richest -> 0, else if B richest -> 1, else -> 2 (C)
        richestIndexEncrypted = e.select(
            aIsRichest,
            zero,
            e.select(bIsRichest, one, two)
        );

        resultComputed = true;

        emit RichestIndexEncrypted(richestIndexEncrypted);
    }

    /// Request decryption of the richest index (only owner)
    function requestDecryption() external onlyOwner returns (uint256) {
        euint256 encryptedIndex = richestIndexEncrypted;
        e.allow(encryptedIndex, address(this));

        uint256 requestId = e.requestDecryption(
            encryptedIndex,
            this.onDecryptionCallback.selector,
            ""
        );
        decryptionRequested = true;
        emit DecryptionRequested(requestId);
        return requestId;
    }

    /// Callback function for decryption result
    function onDecryptionCallback(
        uint256 requestId,
        uint256 result,
        bytes memory data
    ) public returns (bool) {
        richestParticipant = participants[result];
        resultRevealed = true;

        emit RichestRevealed(richestParticipant);
        return true;
    }

    /// Return participant address by index (0, 1, or 2)
    function getParticipant(uint8 index) external view returns (address) {
        require(index < MAX_PARTICIPANTS, "Index out of range");
        return participants[index];
    }

    /// Return all participants
    function getParticipants() external view returns (address[3] memory) {
        return participants;
    }

    /// Check if a specific address has submitted their wealth
    function hasParticipantSubmitted(
        address participant
    ) external view returns (bool) {
        return hasSubmitted[participant];
    }

    /// Get the current number of participants
    function getParticipantCount() external view returns (uint8) {
        return participantCount;
    }

    /// Check if we're ready to request decryption
    function canRequestDecryption() external view returns (bool) {
        return resultComputed && !decryptionRequested;
    }

    /// Check if result has been revealed
    function isResultRevealed() external view returns (bool) {
        return resultRevealed;
    }
}
