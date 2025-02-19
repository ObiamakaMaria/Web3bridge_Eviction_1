import { expect } from "chai";
import { ethers } from "hardhat";
import { BottleGame } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BottleGame", function () {
    let bottleGame: BottleGame;
    let owner: SignerWithAddress;
    let player: SignerWithAddress;

    beforeEach(async function () {
        [owner, player] = await ethers.getSigners();
        const BottleGame = await ethers.getContractFactory("BottleGame");
        bottleGame = await BottleGame.deploy();
        await bottleGame.deployed();
    });

    describe("Game Mechanics", function () {
        it("Should start a new game", async function () {
            await expect(bottleGame.connect(player).startNewGame())
                .to.emit(bottleGame, "GameStarted")
                .withArgs(player.address, await getBlockTimestamp());
        });

        it("Should not allow starting a game when one is in progress", async function () {
            await bottleGame.connect(player).startNewGame();
            await expect(bottleGame.connect(player).startNewGame())
                .to.be.revertedWithCustomError(bottleGame, "GameAlreadyInProgress");
        });

        it("Should not allow attempts without starting a game", async function () {
            await expect(bottleGame.connect(player).makeAttempt([1, 2, 3, 4, 5]))
                .to.be.revertedWithCustomError(bottleGame, "GameNotStarted");
        });

        it("Should validate bottle arrangement input", async function () {
            await bottleGame.connect(player).startNewGame();
            await expect(bottleGame.connect(player).makeAttempt([0, 2, 3, 4, 5]))
                .to.be.revertedWithCustomError(bottleGame, "InvalidBottleArrangement");
            await expect(bottleGame.connect(player).makeAttempt([6, 2, 3, 4, 5]))
                .to.be.revertedWithCustomError(bottleGame, "InvalidBottleArrangement");
        });

        it("Should track attempts and emit events", async function () {
            await bottleGame.connect(player).startNewGame();
            await expect(bottleGame.connect(player).makeAttempt([1, 2, 3, 4, 5]))
                .to.emit(bottleGame, "AttemptMade");

            const gameState = await bottleGame.connect(player).getGameState();
            expect(gameState.attempts).to.equal(1);
        });

        it("Should not allow more than 5 attempts", async function () {
            await bottleGame.connect(player).startNewGame();
            
            for(let i = 0; i < 5; i++) {
                await bottleGame.connect(player).makeAttempt([1, 2, 3, 4, 5]);
            }

            await expect(bottleGame.connect(player).makeAttempt([1, 2, 3, 4, 5]))
                .to.be.revertedWithCustomError(bottleGame, "MaxAttemptsReached");
        });

        it("Should automatically start new game after 5 failed attempts", async function () {
            await bottleGame.connect(player).startNewGame();
            
            for(let i = 0; i < 5; i++) {
                await bottleGame.connect(player).makeAttempt([1, 1, 1, 1, 1]);
            }

            const gameState = await bottleGame.connect(player).getGameState();
            expect(gameState.attempts).to.equal(0);
            expect(gameState.isActive).to.be.true;
        });
    });
});

async function getBlockTimestamp(): Promise<number> {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
} 