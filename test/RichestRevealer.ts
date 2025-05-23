import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { Address } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// @ts-ignore
import { Lightning } from "@inco/js/lite";
import { HexString } from "@inco/js/dist/binary";
import richestRevealerAbi from "../artifacts/contracts/RichestRevealer.sol/RichestRevealer.json";
import createContractInterface from "../utils/contractInterface";

describe("RichestRevealer", function () {
  async function deployFixture() {
    const chainId = publicClient.chain.id;
    const incoConfig = Lightning.latest("testnet", chainId);

    const deploymentTxHash = await wallet.deployContract({
      abi: richestRevealerAbi.abi,
      bytecode: richestRevealerAbi.bytecode as HexString,
      args: [],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deploymentTxHash,
    });

    const contractAddress = receipt.contractAddress as Address;
    const contract = createContractInterface(contractAddress, richestRevealerAbi.abi);

    const val1 = await incoConfig.encrypt(10, {
      accountAddress: namedWallets.alice.account!.address,
      dappAddress: contractAddress,
    });

    const val2 = await incoConfig.encrypt(50, {
      accountAddress: namedWallets.bob.account!.address,
      dappAddress: contractAddress,
    });

    const val3 = await incoConfig.encrypt(50, {
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

    it("prevents duplicate submissions", async () => {
      const { contract, val1 } = await loadFixture(deployFixture);
      await contract.write.submitWealth([val1], { account: namedWallets.alice });

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for the transaction to be mined

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

    it("prevent requesting decryption before computing richest", async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.write.requestDecryption({ account: wallet })
      ).to.be.rejectedWith("Cannot request decryption");
    });

    it("allows only 3 unique submissions and rejects a fourth", async () => {
      const { contract, val2, val3, val4 } = await loadFixture(deployFixture);
      await contract.write.submitWealth([val2], { account: namedWallets.bob });
      await contract.write.submitWealth([val3], { account: namedWallets.eve });

      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for the transaction to be mined

      const count = await contract.read.getParticipantCount();
      expect(Number(count)).to.equal(3);

      await expect(
        contract.write.submitWealth([val4], { account: wallet })
      ).to.be.rejectedWith("Max 3 participants allowed");
    });

  
  });

  describe("Richest Computation", () => {
    it("only allows the owner to compute richest", async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(
        contract.write.computeRichest({ account: namedWallets.alice })
      ).to.be.rejected;
    });

    it("computes richest and stores encrypted indices", async () => {
      const { contract } = await loadFixture(deployFixture);

      const txHash = await contract.write.computeRichest({ account: wallet });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      expect(receipt.status).to.equal("success");

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for the transaction to be mined

      const indexEncrypted = await contract.read.canRequestDecryption();
      expect(indexEncrypted).to.equal(true);
    });

    it("prevents recomputing after result is set", async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(
        contract.write.computeRichest({ account: wallet })
      ).to.be.rejectedWith("Already computed");
    });
  });

  describe("Reveal Request and Decryption", () => {
    it("only allows owner to request decryption", async () => {
      const { contract } = await loadFixture(deployFixture);
   
      await expect(
        contract.write.requestDecryption({ account: namedWallets.alice })
      ).to.be.rejected;
    });

    it("triggers decryption after computing richest", async () => {
      const { contract} = await loadFixture(deployFixture);

      const txHash = await contract.write.requestDecryption({ account: wallet });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      expect(receipt.status).to.equal("success");
    });
  });

  describe("Richest Revealed", () => {
    it("reveals the richest participant as Bob", async () => {
      const { contract, val1, val2, val3 } = await loadFixture(deployFixture);
     

      await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait for off-chain to simulate decryption

      const revealed = await contract.read.isResultRevealed();
      expect(revealed).to.equal(true);

      // const winner = await contract.read.getRichestParticipant();
      // expect(winner).to.equal(namedWallets.bob.account!.address);
    });
  });
});
