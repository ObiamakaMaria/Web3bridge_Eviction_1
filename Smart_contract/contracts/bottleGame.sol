//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BottleGame {
    
    error GameAlreadyInProgress();
    error GameNotStarted();
    error InvalidBottleArrangement();
    error GameAlreadyWon();
    error MaxAttemptsReached();

    struct Game {

        uint256[5] correctArrangement;
        uint256 attempts;
        bool isActive;
        bool isWon;
    }

    mapping(address => Game) public games;
    
    event GameStarted(address player, uint256 timestamp);
    event AttemptMade(address player, uint256 correctPositions);
    event GameWon(address player, uint256 attempts);
    
    function startNewGame() external {
        if (games[msg.sender].isActive && !games[msg.sender].isWon) {
            revert GameAlreadyInProgress();
        }
        
    
        uint256[5] memory arrangement;
        bytes32 hash = keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao));
        
        for (uint i = 0; i < 5; i++) {
            arrangement[i] = (uint256(hash) >> (i * 8)) % 5 + 1;
        }
        
        games[msg.sender] = Game({
            correctArrangement: arrangement,
            attempts: 0,
            isActive: true,
            isWon: false
        });
        
        emit GameStarted(msg.sender, block.timestamp);
    }
    
    function makeAttempt(uint256[5] calldata attempt) external returns (uint256) {
        Game storage game = games[msg.sender];
        
        if (!game.isActive) {
            revert GameNotStarted();
        }
        
        if (game.isWon) {
            revert GameAlreadyWon();
        }
        
        if (game.attempts >= 5) {
            revert MaxAttemptsReached();
        }
        
        
        for (uint i = 0; i < 5; i++) {
            if (attempt[i] < 1 || attempt[i] > 5) {
                revert InvalidBottleArrangement();
            }
        }
        
        
        uint256 correctPositions = 0;
        for (uint i = 0; i < 5; i++) {
            if (attempt[i] == game.correctArrangement[i]) {
                correctPositions++;
            }
        }
        
        game.attempts++;
        
        if (correctPositions == 5) {
            game.isWon = true;
            emit GameWon(msg.sender, game.attempts);
        } else if (game.attempts == 5) {
            
            games[msg.sender] = Game({
                correctArrangement: _generateNewArrangement(),
                attempts: 0,
                isActive: true,
                isWon: false
            });
        }
        
        emit AttemptMade(msg.sender, correctPositions);
        return correctPositions;
    }
    
    function getGameState() external view returns (
        bool isActive,
        bool isWon,
        uint256 attempts
    ) {
        Game storage game = games[msg.sender];
        return (game.isActive, game.isWon, game.attempts);
    }

    function _generateNewArrangement() private view returns (uint256[5] memory) {
        uint256[5] memory arrangement;
        bytes32 hash = keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao));
        
        for (uint i = 0; i < 5; i++) {
            arrangement[i] = (uint256(hash) >> (i * 8)) % 5 + 1;
        }
        return arrangement;
    }
}