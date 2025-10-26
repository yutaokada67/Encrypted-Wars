# Encrypted Wars

<div align="center">

**A privacy-preserving blockchain card game powered by Fully Homomorphic Encryption**

[![License](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)

[Live Demo](https://your-demo-url.com) • [Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues)

</div>

---

## 🎮 Overview

**Encrypted Wars** is an innovative turn-based card game that leverages **Zama's FHEVM (Fully Homomorphic Encryption for the Ethereum Virtual Machine)** to enable truly private gaming on a public blockchain. Players compete against the system using encrypted cards whose values remain hidden on-chain, ensuring fair gameplay without revealing strategic information until players choose to decrypt locally.

### What Makes It Unique?

- **🔐 Complete Privacy**: All card values and scores are encrypted on-chain using FHE
- **⛓️ Blockchain Verified**: Game logic executed transparently on Ethereum smart contracts
- **🎲 Provably Fair**: System cards are generated using on-chain randomness
- **👁️ Client-Side Decryption**: Players decrypt their data locally without revealing to others
- **🎯 Strategic Gameplay**: Choose which encrypted card to play each round
- **💎 NFT-Ready Architecture**: Built with extensibility for tokenized cards and rewards

---

## 🎯 The Problem We Solve

Traditional blockchain games face a critical dilemma: **how do you maintain fairness and transparency while preserving player privacy?**

### Challenges in Blockchain Gaming:

1. **Public State Problem**: All blockchain data is publicly visible, making hidden information games (poker, strategy games) nearly impossible
2. **Trusted Third Parties**: Current solutions rely on centralized servers or trusted execution environments
3. **Front-Running**: Visible transactions allow others to see and exploit player moves
4. **MEV Exploitation**: Miners can manipulate game outcomes by reordering transactions
5. **Cheating Prevention**: Players can inspect contract state to gain unfair advantages

### Our FHE-Powered Solution:

**Encrypted Wars** demonstrates how **Fully Homomorphic Encryption (FHE)** eliminates these problems:

- ✅ **Zero-Knowledge Gameplay**: Cards remain encrypted even during computation
- ✅ **No Trusted Third Parties**: All encryption happens on-chain via FHEVM
- ✅ **MEV-Resistant**: Encrypted values cannot be read or manipulated
- ✅ **Front-Running Proof**: Encrypted moves hide player strategy
- ✅ **Cheat-Proof**: Even contract code cannot access plaintext values
- ✅ **Selective Disclosure**: Players control when and what they decrypt

This is not just a game—it's a **proof of concept** for the future of privacy-preserving blockchain applications including:
- Private DeFi (encrypted balances, hidden trading)
- Confidential voting systems
- Sealed-bid auctions
- Private identity verification
- Encrypted healthcare records on-chain

---

## 🎲 How It Works

### Game Flow

```
┌─────────────────┐
│  Start Game     │  Player initiates game
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deal Cards      │  3 encrypted cards for player
│ (FHE Encrypted) │  3 encrypted cards for system
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Round 1-3      │  Player selects one card
│  Play Card      │  Compare with system card (encrypted)
└────────┬────────┘  Update score (encrypted)
         │
         ▼
┌─────────────────┐
│  Decrypt        │  Player decrypts locally:
│  (Client-Side)  │  - Own cards
└─────────────────┘  - System cards (after played)
                     - Final score
```

### Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ RainbowKit │  │   Wagmi    │  │   Zama Relayer SDK   │  │
│  │  (Wallet)  │  │ (Blockchain│  │    (Decryption)      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   Ethereum Network (Sepolia)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         EncryptedWarsGame Smart Contract             │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │     FHEVM Library (@fhevm/solidity)         │    │   │
│  │  │  • euint32 encrypted integers               │    │   │
│  │  │  • FHE arithmetic (add, gt, select)         │    │   │
│  │  │  • Random number generation (FHE.rand)      │    │   │
│  │  │  • Access control (FHE.allow)               │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│              Zama Coprocessor Network                        │
│         (Handles FHE computation & key management)           │
└──────────────────────────────────────────────────────────────┘
```

### Smart Contract Design

The `EncryptedWarsGame` contract implements:

1. **Encrypted Card Generation**: Cards (1-10) generated using `FHE.randEuint32()`
2. **Private Hand Management**: Each player's 3 cards stored as `euint32[]`
3. **Encrypted Comparisons**: `FHE.gt()` compares cards without revealing values
4. **Encrypted Score Tracking**: Score accumulated using `FHE.add()` and `FHE.select()`
5. **Selective Decryption**: Players can decrypt their data client-side via Zama SDK

---

## 🚀 Key Features

### Core Gameplay

- **3-Round Card Battles**: Each player gets 3 encrypted cards (values 1-10)
- **Strategic Card Selection**: Choose which card to play each round
- **Encrypted Scoring**: Win by having higher card value than system
- **Provable Fairness**: System cards generated on-chain using FHE randomness

### Privacy Features

- **Fully Encrypted State**: All game data encrypted on-chain
- **No Trusted Setup**: Pure on-chain FHE via FHEVM
- **Client-Side Decryption**: Players decrypt locally using Zama Relayer SDK
- **Granular Access Control**: Only authorized addresses can decrypt specific values
- **Front-Running Resistant**: Moves cannot be observed before commitment

### Technical Features

- **Gas-Optimized FHE**: Efficient encrypted operations using FHEVM
- **Multi-Network Support**: Deployed on Sepolia testnet, ready for mainnet
- **Wallet Integration**: Seamless connection via RainbowKit
- **Real-Time Updates**: Instant UI updates using Wagmi hooks
- **Type-Safe**: Full TypeScript coverage for contracts and frontend
- **Comprehensive Testing**: Hardhat test suite for contract validation

---

## 🛠️ Technology Stack

### Blockchain & Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | ^0.8.24 | Smart contract language |
| **FHEVM** | ^0.8.0 | Fully Homomorphic Encryption library |
| **Hardhat** | ^2.26.0 | Development framework |
| **Hardhat Deploy** | ^0.11.45 | Deployment management |
| **TypeChain** | ^8.3.2 | TypeScript bindings for contracts |
| **Ethers.js** | ^6.15.0 | Ethereum library |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.1.1 | UI framework |
| **TypeScript** | ^5.8.3 | Type safety |
| **Vite** | ^7.1.6 | Build tool & dev server |
| **Wagmi** | ^2.17.0 | React hooks for Ethereum |
| **RainbowKit** | ^2.2.8 | Wallet connection UI |
| **TanStack Query** | ^5.89.0 | Data fetching & caching |
| **Zama Relayer SDK** | ^0.2.0 | FHE decryption client |

### Development Tools

- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Solhint**: Solidity linting
- **Mocha & Chai**: Testing framework
- **Hardhat Gas Reporter**: Gas optimization
- **Solidity Coverage**: Test coverage analysis

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v7.0.0 or higher
- **Git**: For cloning repository
- **MetaMask**: Or another Web3 wallet

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/encrypted-wars.git
cd encrypted-wars
```

### 2. Install Dependencies

```bash
# Install smart contract dependencies
npm install

# Install frontend dependencies
cd home
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
# Set your wallet mnemonic (for deployment)
npx hardhat vars set MNEMONIC

# Set Infura API key for Sepolia access
npx hardhat vars set INFURA_API_KEY

# Optional: Etherscan API key for contract verification
npx hardhat vars set ETHERSCAN_API_KEY
```

### 4. Compile Smart Contracts

```bash
npm run compile
```

This will:
- Compile Solidity contracts
- Generate TypeChain types
- Create artifacts for deployment

### 5. Run Tests

```bash
# Run local tests
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia

# Generate coverage report
npm run coverage
```

### 6. Deploy Contracts

#### Local Development

```bash
# Start local FHEVM node
npm run chain

# In another terminal, deploy
npm run deploy:localhost
```

#### Sepolia Testnet

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Verify contract on Etherscan
npm run verify:sepolia <CONTRACT_ADDRESS>
```

### 7. Run Frontend

```bash
cd home

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend will be available at `http://localhost:5173`

---

## 🎮 How to Play

### Step 1: Connect Wallet

1. Open the application in your browser
2. Click "Connect Wallet" button
3. Select your wallet (MetaMask, WalletConnect, etc.)
4. Approve the connection

### Step 2: Start Game

1. Click "Start Game" button
2. Confirm the transaction in your wallet
3. Wait for transaction confirmation
4. Your 3 encrypted cards will be dealt

### Step 3: Decrypt Your Hand (Optional)

1. Click "Decrypt My Hand" to see your card values locally
2. Sign the decryption request
3. View your card values (1-10)

### Step 4: Play Rounds

1. For each round, click "Play Card" on the card you want to use
2. Confirm the transaction
3. The card is compared with the system's card (encrypted)
4. Your score is updated (encrypted)

### Step 5: Check Results

1. After playing all 3 rounds, click "Decrypt Score"
2. View your final score (0-3 wins)
3. Optionally decrypt system cards to see what you played against

### Step 6: Play Again

Click "Restart Game" to start a new session with fresh cards!

---

## 🏗️ Project Structure

```
encrypted-wars/
├── contracts/                  # Solidity smart contracts
│   └── EncryptedWarsGame.sol  # Main game contract
├── deploy/                     # Deployment scripts
│   └── deploy.ts              # Hardhat deploy script
├── test/                       # Contract tests
│   ├── EncryptedWarsGame.ts   # Local tests
│   └── EncryptedWarsGameSepolia.ts  # Sepolia tests
├── tasks/                      # Custom Hardhat tasks
│   ├── accounts.ts            # Account management
│   └── encryptedWars.ts       # Game interaction tasks
├── home/                       # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameApp.tsx    # Main game UI
│   │   │   └── Header.tsx     # App header
│   │   ├── config/
│   │   │   ├── wagmi.ts       # Wagmi configuration
│   │   │   └── contracts.ts   # Contract ABI & address
│   │   ├── hooks/
│   │   │   ├── useEthersSigner.ts  # Ethers.js signer
│   │   │   └── useZamaInstance.ts  # Zama SDK instance
│   │   ├── styles/
│   │   │   └── GameApp.css    # Component styles
│   │   ├── App.tsx            # App entry point
│   │   └── main.tsx           # React DOM entry
│   ├── public/                # Static assets
│   ├── package.json
│   └── vite.config.ts
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Root dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

---

## 🔍 Smart Contract Deep Dive

### Contract: `EncryptedWarsGame`

**Location**: `contracts/EncryptedWarsGame.sol`

#### State Variables

```solidity
struct GameState {
    euint32[3] playerCards;      // Player's encrypted cards
    euint32[3] systemCards;      // System's encrypted cards
    bool[3] playerCardUsed;      // Track which cards are played
    uint8 roundsPlayed;          // Number of rounds completed
    euint32 score;               // Encrypted score (wins)
    bool initialized;            // Game session status
}

mapping(address => GameState) private games;
```

#### Key Functions

##### `startGame()`
- Generates 3 random encrypted cards for player (1-10 range)
- Generates 3 random encrypted cards for system
- Resets game state
- Grants decryption permissions to player

##### `playRound(uint8 playerCardIndex)`
- Validates card selection and game state
- Compares player's card with system's card (encrypted)
- Updates encrypted score if player wins
- Marks card as used
- Reveals system card to player after round

##### `getPlayerCard(address, uint8)` / `getSystemCard(address, uint8)`
- Returns encrypted card handles
- Used by frontend for decryption

##### `getScore(address)`
- Returns encrypted score handle
- Can be decrypted client-side

##### `getGameMeta(address)`
- Returns non-sensitive game metadata
- Rounds played, cards used, initialization status

#### FHE Operations Used

- `FHE.randEuint32()`: Generate random encrypted values
- `FHE.rem()`: Modulo operation (bound random to 1-10)
- `FHE.add()`: Addition (score accumulation)
- `FHE.gt()`: Greater than comparison (card battle)
- `FHE.select()`: Conditional selection (ternary operator)
- `FHE.allow()`: Grant decryption permission
- `FHE.asEuint32()`: Convert plaintext to encrypted

---

## 🧪 Testing

### Local Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/EncryptedWarsGame.ts
```

### Sepolia Testnet Testing

```bash
# Run tests on live Sepolia network
npm run test:sepolia
```

### Test Coverage

```bash
# Generate coverage report
npm run coverage
```

Coverage report will be in `coverage/index.html`

### Test Structure

```typescript
describe("EncryptedWarsGame", () => {
  it("Should start a new game")
  it("Should play rounds correctly")
  it("Should track scores properly")
  it("Should prevent invalid moves")
  it("Should handle decryption permissions")
})
```

---

## 🌐 Deployment

### Network Configuration

The project supports:
- **Local**: Hardhat network with FHEVM
- **Sepolia**: Ethereum testnet with Zama FHEVM

### Deployment Steps

1. **Configure network in `hardhat.config.ts`**:
```typescript
networks: {
  sepolia: {
    url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    accounts: { mnemonic: MNEMONIC },
    chainId: 11155111,
  }
}
```

2. **Deploy contract**:
```bash
npx hardhat deploy --network sepolia
```

3. **Verify on Etherscan**:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

4. **Update frontend config**:
```typescript
// home/src/config/contracts.ts
export const CONTRACT_ADDRESS = '0x...'; // Your deployed address
```

### Current Deployment

- **Network**: Sepolia Testnet
- **Contract Address**: `0x...` (see deployments/sepolia/EncryptedWarsGame.json)
- **Frontend**: [Live Demo URL]

---

## 🛡️ Security Considerations

### Smart Contract Security

- ✅ **ReentrancyGuard**: Not needed (no external calls)
- ✅ **Access Control**: FHE permissions properly managed
- ✅ **Integer Overflow**: Solidity 0.8+ automatic checks
- ✅ **Input Validation**: Card indices and game state validated
- ⚠️ **Randomness**: Uses FHE.rand (sufficient for game, not for high-stakes)

### Privacy Guarantees

- **On-Chain Privacy**: All card values and scores encrypted via FHE
- **MEV Protection**: Encrypted state prevents MEV extraction
- **Front-Running Protection**: Cannot observe card values before commitment
- **Client-Side Decryption**: Player data never exposed on-chain

### Known Limitations

1. **Gas Costs**: FHE operations are more expensive than regular EVM ops
2. **Decryption Latency**: Client-side decryption requires Zama coprocessor
3. **Testnet Only**: Currently deployed on Sepolia (not production-ready)
4. **No Multiplayer**: Current version is player vs. system only

### Security Audits

⚠️ **This project is experimental and has not been audited. Do not use in production with real funds.**

For production deployment:
- Conduct professional security audit
- Implement comprehensive access controls
- Add circuit breakers and pause mechanisms
- Consider insurance/bug bounty programs

---

## 🔮 Future Roadmap

### Phase 1: Enhanced Gameplay (Q2 2025)
- [ ] Multiplayer PvP battles
- [ ] Multiple card decks with different themes
- [ ] Power-up cards and special abilities
- [ ] Tournament mode with leaderboards
- [ ] Betting/wagering system

### Phase 2: NFT Integration (Q3 2025)
- [ ] NFT card collections
- [ ] Unique card attributes (rarity, power)
- [ ] Card marketplace
- [ ] Breeding/combining mechanics
- [ ] Achievement NFTs

### Phase 3: Advanced Features (Q4 2025)
- [ ] DAO governance for game rules
- [ ] Staking rewards for players
- [ ] Cross-chain deployment (Polygon, Arbitrum)
- [ ] Mobile app (React Native)
- [ ] AI-powered opponents

### Phase 4: Platform Expansion (2026)
- [ ] SDK for third-party game developers
- [ ] Multiple game modes (Poker, Blackjack, etc.)
- [ ] Social features (friends, guilds)
- [ ] Esports integration
- [ ] Virtual tournaments with prize pools

### Technical Improvements
- [ ] Gas optimization for FHE operations
- [ ] Batch decryption for multiple values
- [ ] L2 integration for lower costs
- [ ] Improved UI/UX with animations
- [ ] Mobile-responsive design
- [ ] Multi-language support

---

## 💡 Use Cases & Applications

### Beyond Gaming

The technology demonstrated in Encrypted Wars can enable:

#### 1. **Private DeFi**
- Encrypted token balances
- Hidden order books for DEXs
- Anonymous lending protocols
- Confidential yield farming

#### 2. **Governance & Voting**
- Secret ballot voting on-chain
- Privacy-preserving DAO decisions
- Anonymous proposal submissions
- Anti-bribery voting systems

#### 3. **Auctions**
- Sealed-bid auctions
- NFT bidding without revealing price
- Procurement without collusion
- Fair price discovery

#### 4. **Identity & Compliance**
- Zero-knowledge KYC
- Private credit scores on-chain
- Encrypted health records
- Anonymous reputation systems

#### 5. **Supply Chain**
- Encrypted pricing information
- Confidential inventory levels
- Private supplier relationships
- Protected trade secrets

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

1. **🐛 Report Bugs**: Open issues for any bugs you find
2. **💡 Suggest Features**: Share ideas for improvements
3. **📝 Documentation**: Improve docs and tutorials
4. **🧪 Testing**: Write tests and improve coverage
5. **💻 Code**: Submit pull requests for new features
6. **🎨 Design**: Improve UI/UX and create assets

### Development Workflow

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/encrypted-wars.git

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes
# 5. Run tests
npm run test
npm run lint

# 6. Commit changes
git commit -m "Add amazing feature"

# 7. Push to your fork
git push origin feature/amazing-feature

# 8. Open a Pull Request
```

### Code Standards

- Follow existing code style (enforced by ESLint/Prettier)
- Write tests for new features
- Update documentation
- Keep commits atomic and well-described
- Follow Solidity best practices

---

## 📚 Resources & Learning

### FHEVM Documentation
- [FHEVM Official Docs](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

### Tutorials & Guides
- [Getting Started with FHEVM](https://docs.zama.ai/protocol/solidity-guides/getting-started)
- [Building Private DApps](https://docs.zama.ai/fhevm/tutorials)
- [Understanding FHE](https://www.zama.ai/post/what-is-fully-homomorphic-encryption)

### Community
- [Zama Discord](https://discord.gg/zama)
- [Zama Twitter](https://twitter.com/zama_fhe)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)

### Papers & Research
- [TFHE: Fast Fully Homomorphic Encryption](https://eprint.iacr.org/2018/421)
- [CONCRETE: TFHE Compiler](https://github.com/zama-ai/concrete)

---

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**.

See [LICENSE](LICENSE) file for details.

### What This Means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ❌ No patent grant
- ⚠️ Must include license and copyright notice

---

## 🆘 Support & Contact

### Get Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/encrypted-wars/issues)
- **Documentation**: [Full project docs](https://github.com/your-repo/encrypted-wars/wiki)
- **Discord**: [Join our community](https://discord.gg/your-discord)
- **Email**: support@encrypted-wars.io

### FAQ

**Q: Why are transactions taking so long?**
A: FHE operations require additional computation by Zama's coprocessor network. Expect 10-30 second delays.

**Q: Why can't I see card values on-chain?**
A: That's the point! FHE keeps values encrypted. You must decrypt client-side using your private key.

**Q: Is this safe to use with real money?**
A: No. This is an experimental proof of concept. Do not use in production without professional audit.

**Q: Can I fork this for my own game?**
A: Yes! This is open source. Follow the BSD-3-Clause-Clear license terms.

**Q: How much gas do FHE operations cost?**
A: More than regular operations. Expect ~500k-1M gas per game start, ~300k per round played.

---

## 🌟 Acknowledgments

- **Zama** - For pioneering FHEVM technology
- **Ethereum Foundation** - For the blockchain infrastructure
- **Hardhat Team** - For the excellent development framework
- **RainbowKit** - For beautiful wallet connection UI
- **OpenZeppelin** - For security best practices

---

## 🎯 Vision

**Encrypted Wars** is more than a game—it's a glimpse into the future of blockchain technology where **privacy and transparency coexist**. By leveraging Fully Homomorphic Encryption, we're demonstrating how blockchain can finally support applications that require confidential state while maintaining the trustless, verifiable properties we value.

Our vision is to create a **privacy-first gaming ecosystem** that proves FHE is production-ready for mainstream adoption. Whether you're a developer, gamer, or blockchain enthusiast, we invite you to join us in building the future of private computation on public blockchains.

---

<div align="center">

**Built with ❤️ using Zama FHEVM**

[Website](https://encrypted-wars.io) • [Twitter](https://twitter.com/encryptedwars) • [Discord](https://discord.gg/encryptedwars)

⭐ **Star this repo if you find it useful!** ⭐

</div>
