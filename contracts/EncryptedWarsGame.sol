// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Wars Game
/// @notice Turn-based encrypted card game using Zama FHEVM
contract EncryptedWarsGame is SepoliaConfig {
    uint8 private constant CARD_COUNT = 3;
    uint32 private constant MAX_CARD_VALUE = 10;

    struct GameState {
        euint32[CARD_COUNT] playerCards;
        euint32[CARD_COUNT] systemCards;
        bool[CARD_COUNT] playerCardUsed;
        uint8 roundsPlayed;
        euint32 score;
        bool initialized;
    }

    mapping(address => GameState) private games;

    event GameStarted(address indexed player);
    event RoundPlayed(address indexed player, uint8 roundIndex);

    /// @notice Initializes or resets a player's game session with fresh encrypted cards
    function startGame() external {
        GameState storage game = games[msg.sender];

        for (uint8 i = 0; i < CARD_COUNT; i++) {
            euint32 playerDraw = _drawCard();
            game.playerCards[i] = playerDraw;
            FHE.allowThis(game.playerCards[i]);
            FHE.allow(game.playerCards[i], msg.sender);

            euint32 systemDraw = _drawCard();
            game.systemCards[i] = systemDraw;
            FHE.allowThis(game.systemCards[i]);
        }

        for (uint8 j = 0; j < CARD_COUNT; j++) {
            game.playerCardUsed[j] = false;
        }

        game.roundsPlayed = 0;
        game.score = FHE.asEuint32(0);
        FHE.allowThis(game.score);
        FHE.allow(game.score, msg.sender);
        game.initialized = true;

        emit GameStarted(msg.sender);
    }

    /// @notice Plays a round by selecting one of the player's encrypted cards
    /// @param playerCardIndex Index of the player's card to play (0-2)
    function playRound(uint8 playerCardIndex) external {
        require(playerCardIndex < CARD_COUNT, "Invalid card index");

        GameState storage game = games[msg.sender];
        require(game.initialized, "Game not started");
        require(!game.playerCardUsed[playerCardIndex], "Card already used");
        require(game.roundsPlayed < CARD_COUNT, "All rounds completed");

        uint8 roundIndex = game.roundsPlayed;

        euint32 playerCard = game.playerCards[playerCardIndex];
        euint32 systemCard = game.systemCards[roundIndex];

        ebool playerWins = FHE.gt(playerCard, systemCard);
        euint32 winIncrement = FHE.select(playerWins, FHE.asEuint32(1), FHE.asEuint32(0));
        euint32 updatedScore = FHE.add(game.score, winIncrement);

        game.score = updatedScore;
        FHE.allowThis(game.score);
        FHE.allow(game.score, msg.sender);

        game.playerCardUsed[playerCardIndex] = true;
        game.roundsPlayed = roundIndex + 1;

        FHE.allow(game.systemCards[roundIndex], msg.sender);

        emit RoundPlayed(msg.sender, roundIndex);
    }

    /// @notice Retrieves a player's encrypted card at a given index
    function getPlayerCard(address player, uint8 index) external view returns (euint32) {
        require(index < CARD_COUNT, "Invalid index");
        GameState storage game = games[player];
        require(game.initialized, "Game not available");
        return game.playerCards[index];
    }

    /// @notice Retrieves the system's encrypted card for a specific index
    function getSystemCard(address player, uint8 index) external view returns (euint32) {
        require(index < CARD_COUNT, "Invalid index");
        GameState storage game = games[player];
        require(game.initialized, "Game not available");
        return game.systemCards[index];
    }

    /// @notice Returns the encrypted score for a player
    function getScore(address player) external view returns (euint32) {
        GameState storage game = games[player];
        require(game.initialized, "Game not available");
        return game.score;
    }

    /// @notice Returns metadata about a game session without revealing card values
    function getGameMeta(address player)
        external
        view
        returns (uint8 roundsPlayed, bool[3] memory usedCards, bool initialized)
    {
        GameState storage game = games[player];
        roundsPlayed = game.roundsPlayed;
        usedCards = game.playerCardUsed;
        initialized = game.initialized;
    }

    function _drawCard() private returns (euint32) {
        euint32 randomValue = FHE.randEuint32();
        euint32 bounded = FHE.rem(randomValue, MAX_CARD_VALUE);
        euint32 offset = FHE.asEuint32(1);
        return FHE.add(bounded, offset);
    }
}
