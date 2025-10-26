import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm, deployments } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { EncryptedWarsGame } from "../types";

type Signers = {
  player: HardhatEthersSigner;
};

describe("EncryptedWarsGameSepolia", function () {
  let signers: Signers;
  let game: EncryptedWarsGame;
  let gameAddress: string;
  let step = 0;
  let steps = 0;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      this.skip();
    }

    const deployment = await deployments.get("EncryptedWarsGame");
    gameAddress = deployment.address;
    game = (await ethers.getContractAt("EncryptedWarsGame", gameAddress)) as EncryptedWarsGame;

    const [player] = (await ethers.getSigners()) as HardhatEthersSigner[];
    signers = { player };
  });

  beforeEach(() => {
    step = 0;
    steps = 0;
  });

  it("starts a game and plays one round", async function () {
    steps = 9;
    this.timeout(4 * 60000);

    progress("Starting a new game session...");
    const startTx = await game.connect(signers.player).startGame();
    await startTx.wait();

    progress("Decrypting player cards...");
    const playerCards: bigint[] = [];
    for (let i = 0; i < 3; i++) {
      const cardEncrypted = await game.getPlayerCard(signers.player.address, i);
      expect(cardEncrypted).to.not.eq(ethers.ZeroHash);
      const cardValue = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        cardEncrypted,
        gameAddress,
        signers.player,
      );
      expect(cardValue).to.be.gte(1n);
      expect(cardValue).to.be.lte(10n);
      playerCards.push(cardValue);
    }

    progress("Playing the first round with card index 0...");
    const playTx = await game.connect(signers.player).playRound(0);
    await playTx.wait();

    progress("Fetching encrypted score...");
    const encryptedScore = await game.getScore(signers.player.address);
    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      gameAddress,
      signers.player,
    );

    expect(clearScore === 0n || clearScore === 1n).to.eq(true);

    progress("Decrypting revealed system card for round 0...");
    const systemCardRound0 = await game.getSystemCard(signers.player.address, 0);
    const clearSystemCard = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      systemCardRound0,
      gameAddress,
      signers.player,
    );
    expect(clearSystemCard).to.be.gte(1n);
    expect(clearSystemCard).to.be.lte(10n);

    progress("Validating metadata after round 0...");
    const meta = await game.getGameMeta(signers.player.address);
    expect(Number(meta[0])).to.eq(1);
    expect(meta[1][0]).to.eq(true);
    expect(meta[2]).to.eq(true);

    progress(`Round result: player card ${playerCards[0]} vs system card ${clearSystemCard}`);
    progress(`Score after round 0: encrypted=${encryptedScore} clear=${clearScore}`);
  });
});
