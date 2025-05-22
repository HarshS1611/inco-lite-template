import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { Address } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// @ts-ignore
import { Lightning  } from "@inco/js/lite";
import { HexString } from "@inco/js/dist/binary";
import richestRevealerAbi from "../artifacts/contracts/RichestOne.sol/RichestRevealer.json";
import createContractInterface from "../utils/contractInterface";

describe("RichestRevealer", function () {
  let reEncryptor: any;
  async function deployFixture() {
    const chainId = publicClient.chain.id;
    console.log("Chain ID:", chainId);
    const incoConfig = Lightning.latest("testnet", chainId);

    reEncryptor = await incoConfig.getReencryptor(wallet);
    const reEncryptorAlice = await incoConfig.getReencryptor(namedWallets.alice);
    const reEncryptorBob = await incoConfig.getReencryptor(namedWallets.bob);
    const reEncryptoreve = await incoConfig.getReencryptor(namedWallets.eve);

    const deploymentTxHash = await wallet.deployContract({
      abi: richestRevealerAbi.abi,
      bytecode: richestRevealerAbi.bytecode as HexString,
      args: [],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deploymentTxHash,
    });
    const contractAddress = receipt.contractAddress as Address;
    console.log("Contract deployed at:", contractAddress);

    const contract = createContractInterface(contractAddress, richestRevealerAbi.abi);

    const val1 = await incoConfig.encrypt(10, {
      accountAddress: namedWallets.alice.account!.address,
      dappAddress: contractAddress,
    });
    const val2 = await incoConfig.encrypt(50, {
      accountAddress: namedWallets.bob.account!.address,
      dappAddress: contractAddress,
    });
    const val3 = await incoConfig.encrypt(30, {
      accountAddress: namedWallets.eve.account!.address,
      dappAddress: contractAddress,
    });
    const val4 = await incoConfig.encrypt(42, {
      accountAddress: wallet.account!.address,
      dappAddress: contractAddress,
    });

    return {
      contract,
      contractAddress,
      incoConfig,
      val1,
      val2,
      val3,
      val4,
    };
  }

  describe("Wealth Submission", () => {
    it("prevents duplicate wealth submissions", async () => {
      const { contract, val1 } = await loadFixture(deployFixture);
      await contract.write.submitWealth([val1], { account: namedWallets.alice });
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await expect(
        contract.write.submitWealth([val1], { account: namedWallets.alice })
      ).to.be.rejectedWith("Already submitted");
    });

    it("prevents computing richest before 3 submissions", async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(
        contract.write.computeRichest({ account: wallet })
      ).to.be.rejectedWith("3 participants required");
    });


    it("submits encrypted wealth from 3 participants", async () => {
      const { contract, val2, val3 } = await loadFixture(deployFixture);

      await contract.write.submitWealth([val2], { account: namedWallets.bob });
      await contract.write.submitWealth([val3], { account: namedWallets.eve });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const count = await contract.read.getParticipantCount();
      expect(Number(count)).to.equal(3);
    });

    it("prevents a fourth participant from submitting", async () => {
      const { contract, val4 } = await loadFixture(deployFixture);

      await expect(
        contract.write.submitWealth([val4], { account: wallet })
      ).to.be.rejectedWith("Max 3 participants allowed");
    });

  });

  describe("Richest Computation", () => {
    it("prevents non-owner from computing the richest", async () => {
      const { contract, } = await loadFixture(deployFixture);

      await expect(
        contract.write.computeRichest({ account: namedWallets.alice })
      ).to.be.rejected;
    });

    it("computes the richest encrypted participant", async () => {
      const { contract } = await loadFixture(deployFixture);

      const txHash = await contract.write.computeRichest({ account: wallet });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      expect(receipt.status).to.equal("success");

      const encryptedIndex = await contract.read.richestIndexEncrypted();
      expect(encryptedIndex).to.be.a("string");
    });

   

    it("prevents re-computation after result is already computed", async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(
        contract.write.computeRichest({ account: wallet })
      ).to.be.rejectedWith("Already computed");
    });
  });

  // describe("Reveal Request and Decryption", () => {
  //   it("prevents non-owner from requesting reveal", async () => {
  //     const { contract } = await loadFixture(deployFixture);

  //     await expect(
  //       contract.write.requestRevealRichest({ account: namedWallets.alice })
  //     ).to.be.rejected;
  //   });
    
  //   it("should determine the richest participant directly after computeRichest", async () => {
  //     const { contract, contractAddress } = await loadFixture(deployFixture);


  //     // Decrypt the richest index
  //     const encryptedIndex = await contract.read.richestIndexEncrypted();
  //     console.log("Encrypted index:", encryptedIndex);
  //     // const richestIndex = await incoConfig.getUint256Value(encryptedIndex);
  //     const richestIndex =  await reEncryptor({
  //       handle : encryptedIndex.toString(),
  //     });

  //      console.log("Richest index:", richestIndex.value.toString());


  //     // Get participants list
  //     const participants = await contract.read.getParticipants();
  //     const richestAddress = participants[richestIndex];

  //     // Bob submitted 50, which is the highest
  //     expect(richestAddress).to.equal(namedWallets.bob.account!.address);
  //   });
    
  // });

});
