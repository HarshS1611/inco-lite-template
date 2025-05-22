import { Address } from "viem";
import { publicClient, wallet } from "./wallet";

function createContractInterface(address: Address, abi: any) {
    return {
      write: {
        submitWealth: async (args: any[], opts: any) =>
          wallet.writeContract({
            address,
            abi,
            functionName: "submitWealth",
            args,
            account: opts.account.account,
          }),
        computeRichest: async (opts: any) =>
          wallet.writeContract({
            address,
            abi,
            functionName: "computeRichest",
            args: [],
            account: opts.account.account,
          }),
          requestRevealRichest: async (opts: any) =>
          wallet.writeContract({
            address,
            abi,
            functionName: "requestRevealRichest",
            args: [],
            account: opts.account.account,
          }),
        decryptionCallback: async (args: any[], opts: any) =>
          wallet.writeContract({
            address,
            abi,
            functionName: "decryptionCallback",
            args,
            account: opts.account.account,
          }),
          
      },
      read: {
        getParticipantCount: async () =>
          publicClient.readContract({
            address,
            abi,
            functionName: "getParticipantCount",
            args: [],
          }),
        richestIndexEncrypted: async () =>
          publicClient.readContract({
            address,
            abi,
            functionName: "richestIndexEncrypted",
            args: [],
          }),
        richestParticipant: async () =>
          publicClient.readContract({
            address,
            abi,
            functionName: "richestParticipant",
            args: [],
          }),
          getParticipant: async (index: number) =>
          publicClient.readContract({
            address,
            abi,
            functionName: "getParticipant",
            args: [index],
          }),
        getParticipants: async () =>
          publicClient.readContract({
            address,
            abi,
            functionName: "getParticipants",
            args: [],
          }),
      },
    };
  }

    export default createContractInterface;