// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const RichestRevealerModule = buildModule("RichestRevealerModule", (m) => {
  const RichestRevealerModule = m.contract("RichestRevealer");
  return { RichestRevealerModule };
});

export default RichestRevealerModule;