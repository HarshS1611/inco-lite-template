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
      requestDecryption: async (opts: any) =>
        wallet.writeContract({
          address,
          abi,
          functionName: "requestDecryption",
          args: [],
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
      richestParticipants: async () =>
        publicClient.readContract({
          address,
          abi,
          functionName: "richestParticipants",
          args: [],
        }),
      isResultRevealed: async () =>
        publicClient.readContract({
          address,
          abi,
          functionName: "isResultRevealed",
          args: [],
        }),
      getRichestParticipants: async () =>
        publicClient.readContract({
          address,
          abi,
          functionName: "getRichestParticipants",
          args: [],
        }),
      canRequestDecryption: async () =>
        publicClient.readContract({
          address,
          abi,
          functionName: "canRequestDecryption",
          args: [],
        }),
    },
  };
}

export default createContractInterface;