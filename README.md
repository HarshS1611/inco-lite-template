# **💰 RichestRevealer Smart Contract**

A privacy-preserving smart contract that allows participants to submit **confidential encrypted values** (e.g., wealth) using [Inco's Lightning SDK](https://docs.inco.org/). It determines the **richest participant** without revealing individual values and enables a secure decryption reveal process.

## Porject Links
- [Frontend Repo 🔗](https://github.com/HarshS1611/richest-revealer)
- [Smart Contract Walkthrough Video 🔗](https://www.loom.com/share/9aa614f058c94ad0bf696541270a80f6?sid=37953322-3e76-4137-95a5-19f5945426eb)
- [Walkthrough video smart contract 🔗](https://sepolia.basescan.org/address/0x6adafc3cb7255b2539f01c2387096eb3c69e47ea)
- [Frontend Walkthrough Video 🔗](https://www.loom.com/share/693d079657ac498c9f37b46a1c8ae488?sid=f2ac46df-d9af-4f8d-9a86-b67e4af33ce9)
  
---

## **Setup Instructions**

Below, we run a local node and a local covalidator (taken from [the Docker Compose file](./docker-compose.yaml)), and run Hardhat tests against it.

### **1. Clone the Repository**
```sh
git clone <your-repo-url>
cd into_your_repo
```

### **2. Install Dependencies**
```sh
pnpm install
```

### **3. Run a local node**

The current instructions will run a local node and a local covalidator. If you are using this template against another network, e.g. Base Sepolia, skip this step.

```sh
docker compose up
```

### **3. Configure Environment Variables**  

Fill in your own information in the `.env` file, you can take this as example:

```plaintext
# This should be a private key funded with native tokens.
PRIVATE_KEY_ANVIL="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PRIVATE_KEY_BASE_SEPOLIA="your_wallet_private_key"

# This should be a seed phrase used to test functionalities with different accounts.  
# You can send funds from the main wallet to this whenever needed.
SEED_PHRASE="garden cage click scene crystal fat message twice rubber club choice cool"

# This should be an RPC URL provided by a proper provider  
# that supports the eth_getLogs() and eth_getFilteredLogs() methods.
LOCAL_CHAIN_RPC_URL="http://localhost:8545"
BASE_SEPOLIA_RPC_URL="https://base-sepolia-rpc.publicnode.com"
ETHERSCAN_API_KEY="your_base_etherscan_api_key"
```

### **4. Compile Smart Contracts**
```sh
pnpm hardhat compile
```

### **5. Run Tests**
```sh
pnpm hardhat test --network anvil //run docker compose up before running this command
```

Or, if running against another network, e.g. Base Sepolia, run

```sh
pnpm hardhat test --network baseSepolia
# or 
pnpm hardhat test
```

## 🔨 Deploy the Contract

You can deploy the contract within a script or test:

```ts
 pnpm hardhat ignition deploy ignition/modules/RichestRevealer.ts --network baseSepolia
```

## ✅ Verify the Contract

You can deploy the contract within a script or test:

```ts
 pnpm hardhat verify --network baseSepolia <deployed_contract_address>
```

## ✨ Smart Contract Features

- 🔐 **Encrypted Submissions**  
  Participants submit encrypted values (e.g., wealth) using Inco's SDK.

- 👥 **Participant Management**  
  Only up to 3 unique participants can submit encrypted values.

- 🏆 **Richest Determination**  
  Once 3 values are submitted, the owner can trigger encrypted comparison on-chain to find the richest participant.

- 🔄 **One-Time Computation**  
  Richest computation can only happen once. Re-submissions or recomputations are blocked.

- 🧠 **Decryption Request & Reveal**  
  Contract owner can request off-chain decryption using Inco Re-drcyptiono, and submit the result using `decryptionCallback`.

- 🔎 **Public Read Access**  
  Anyone can query:
  - Participant count
  - List of participants
  - Current richest participant(s)
  - Whether result is revealed

---

### Test Stack

* Mocha + Chai for test assertions
* Viem for blockchain interactions
* Inco Lightning SDK for encrypted value submission
* Hardhat's `loadFixture` for isolated contract instances. This dramatically speeds up tests by avoiding redeployments and repeated setups.

---

## ✅ Test Coverage

### ✔️ Wealth Submission

* Rejects duplicate submissions
* Only allows 3 participants
* Blocks submission after computation
* Rejects 4th submission

### ✔️ Richest Computation

* Only owner can compute
* Stores encrypted richest result
* Prevents recomputation

### ✔️ Decryption Flow

* Owner can trigger decryption
* `decryptionCallback` reveals result
* Prevents unauthorized calls

---

## 🧠 Contract Interface (Helper)

Located in `utils/contractInterface.ts`

### Write Methods:

* `submitWealth([encryptedValue], { account })`
* `computeRichest({ account })`
* `requestDecryption({ account })`

### Read Methods:

* `getParticipantCount()`
* `getParticipants()`
* `getRichestParticipants()`
* `canRequestDecryption()`
* `isResultRevealed()`

---

## 📁 Folder Structure

```
.
├── contracts/
│   └── RichestRevealer.sol
├── utils/
│   ├── wallet.ts
│   └── contractInterface.ts
├── test/
│   └── richestRevealer.ts
├── artifacts/
│   └── ... (auto-generated)
├── hardhat.config.ts
├── package.json
└── README.md
```

---


## 📞 Support

* 🔗 [Inco Docs](https://docs.inco.org/)
* 💬 [Inco Discord](https://discord.gg/inco)

---

> This project is built with ❤️ using Solidity, Inco, Hardhat, and Viem.
