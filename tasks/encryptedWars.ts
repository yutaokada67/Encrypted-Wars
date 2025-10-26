import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "EncryptedWarsGame";

async function resolveContract(hre: any, address?: string) {
  const { ethers, deployments } = hre;
  const deployment = address ? { address } : await deployments.get(CONTRACT_NAME);
  const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
  return { contract, deploymentAddress: deployment.address };
}

task("game:address", "Prints the EncryptedWarsGame address").setAction(async function (_: TaskArguments, hre) {
  const { deploymentAddress } = await resolveContract(hre);
  console.log(`${CONTRACT_NAME} address is ${deploymentAddress}`);
});

task("game:start", "Starts or resets your encrypted game")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const { contract, deploymentAddress } = await resolveContract(hre, taskArguments.address);

    const signer = (await ethers.getSigners())[0];
    const tx = await contract.connect(signer).startGame();
    console.log(`Start game tx: ${tx.hash} (contract: ${deploymentAddress})`);
    const receipt = await tx.wait();
    console.log(`Status: ${receipt?.status}`);
  });

task("game:cards", "Decrypts your current encrypted cards")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const { contract, deploymentAddress } = await resolveContract(hre, taskArguments.address);
    const signer = (await ethers.getSigners())[0];

    console.log(`Reading cards from ${deploymentAddress} for player ${signer.address}`);

    for (let i = 0; i < 3; i++) {
      const encryptedCard = await contract.getPlayerCard(signer.address, i);
      if (encryptedCard === ethers.ZeroHash) {
        console.log(`Card ${i}: unavailable (start a game first)`);
        continue;
      }

      const clearCard = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCard,
        deploymentAddress,
        signer,
      );
      console.log(`Card ${i}: encrypted=${encryptedCard} clear=${clearCard}`);
    }
  });

task("game:score", "Decrypts your encrypted score")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const { contract, deploymentAddress } = await resolveContract(hre, taskArguments.address);
    const signer = (await ethers.getSigners())[0];

    const encryptedScore = await contract.getScore(signer.address);
    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      deploymentAddress,
      signer,
    );

    console.log(`Score: encrypted=${encryptedScore} clear=${clearScore}`);
  });

task("game:play", "Plays a round with the selected card index")
  .addParam("card", "Index of the player card (0-2)")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    const cardIndex = parseInt(taskArguments.card, 10);
    if (Number.isNaN(cardIndex) || cardIndex < 0 || cardIndex > 2) {
      throw new Error("--card must be between 0 and 2");
    }

    const { contract, deploymentAddress } = await resolveContract(hre, taskArguments.address);
    const signer = (await ethers.getSigners())[0];

    const tx = await contract.connect(signer).playRound(cardIndex);
    console.log(`Play round tx: ${tx.hash}`);
    await tx.wait();

    await fhevm.initializeCLIApi();
    const encryptedScore = await contract.getScore(signer.address);
    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      deploymentAddress,
      signer,
    );

    const meta = await contract.getGameMeta(signer.address);
    const roundsPlayed = Number(meta[0]);

    console.log(`New encrypted score=${encryptedScore} clear=${clearScore}`);
    if (roundsPlayed > 0) {
      console.log(
        `Check getSystemCard(${roundsPlayed - 1}) after this round to reveal the system card value once decrypted.`,
      );
    }
  });
