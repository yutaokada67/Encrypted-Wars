import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { EncryptedWarsGame, EncryptedWarsGame__factory } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedWarsGame", function () {
  let signers: Signers;
  let game: EncryptedWarsGame;
  let gameAddress: string;

  before(async function () {
    const [alice] = (await ethers.getSigners()) as HardhatEthersSigner[];
    signers = { alice };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = (await ethers.getContractFactory("EncryptedWarsGame")) as EncryptedWarsGame__factory;
    game = (await factory.deploy()) as EncryptedWarsGame;
    gameAddress = await game.getAddress();
  });

  it("deals encrypted cards between 1 and 10", async function () {
    const tx = await game.connect(signers.alice).startGame();
    await tx.wait();

    const cards: bigint[] = [];
    for (let i = 0; i < 3; i++) {
      const encryptedCard = await game.getPlayerCard(signers.alice.address, i);
      expect(encryptedCard).to.not.eq(ethers.ZeroHash);
      const decryptedCard = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCard,
        gameAddress,
        signers.alice,
      );
      expect(decryptedCard).to.be.gte(1n);
      expect(decryptedCard).to.be.lte(10n);
      cards.push(decryptedCard);
    }

    expect(cards.length).to.eq(3);

    const meta = await game.getGameMeta(signers.alice.address);
    expect(Number(meta[0])).to.eq(0);
    expect(meta[2]).to.eq(true);
    for (let i = 0; i < meta[1].length; i++) {
      expect(meta[1][i]).to.eq(false);
    }
  });

  it("updates encrypted score after each round", async function () {
    const startTx = await game.connect(signers.alice).startGame();
    await startTx.wait();

    const playerCards: bigint[] = [];
    for (let i = 0; i < 3; i++) {
      const encryptedCard = await game.getPlayerCard(signers.alice.address, i);
      const decryptedCard = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCard,
        gameAddress,
        signers.alice,
      );
      playerCards.push(decryptedCard);
    }

    let expectedScore = 0n;

    for (let round = 0; round < 3; round++) {
      const playTx = await game.connect(signers.alice).playRound(round);
      await playTx.wait();

      const encryptedScore = await game.getScore(signers.alice.address);
      const clearScore = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedScore,
        gameAddress,
        signers.alice,
      );

      const systemCardEncrypted = await game.getSystemCard(signers.alice.address, round);
      const systemCard = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        systemCardEncrypted,
        gameAddress,
        signers.alice,
      );

      if (playerCards[round] > systemCard) {
        expectedScore += 1n;
      }

      expect(clearScore).to.eq(expectedScore);

      const meta = await game.getGameMeta(signers.alice.address);
      expect(Number(meta[0])).to.eq(round + 1);
      expect(meta[1][round]).to.eq(true);
      expect(meta[2]).to.eq(true);
    }
  });
});
