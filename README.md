# AuthX v3 — Custom Web3 Wallet + QR Banking

A self-custody Web3 banking dashboard with a built-in wallet, QR code features, and live Sepolia event streaming.

## Stack
- **Frontend**: React 18, Vite, TailwindCSS
- **Web3**: ethers.js v6 (direct Sepolia RPC — no MetaMask required)
- **Encryption**: AES-256-GCM via Web Crypto API
- **QR**: qrcode.react + html5-qrcode
- **Network**: Ethereum Sepolia Testnet
- **Contract**: `0xFE7556259B388E6F82C9a4c63AA3751a4f6AcFEe`

## Getting Started

```bash
npm install
npm run dev
```

## Features

### 🔑 Custom Wallet (no MetaMask needed)
- Generate a new wallet with 12-word mnemonic
- Import existing wallet via seed phrase or private key
- AES-256-GCM password encryption in localStorage
- Download encrypted keystore as JSON backup
- Lock / forget wallet controls

### 🦊 MetaMask Support
- Still works as an alternative connection method
- Auto-switches to Sepolia network

### 📷 QR Codes
- Show your wallet address as a scannable QR
- Scan any wallet QR to autofill the recipient field
- View QR of any network wallet directly from the Network page

### ⇄ Transfer Modes (Custom Wallet only)
- **Contract Transfer**: via AuthX smart contract
- **Direct Transfer**: raw wallet-to-wallet ETH send (works to any Sepolia address including MetaMask wallets)

### 🔔 Real-time Events
- Live deposit/transfer notifications from the contract
- Auto-refreshes balances and transaction history

### ◈ Network Wallets
- Discovers all wallets that have used the contract
- Quick Send modal per wallet
- View QR of any address

## Folder Structure

```
src/
├── contracts/          # ABI + config
├── context/            # Web3Context (wallet + contract state)
├── utils/
│   └── walletCrypto.js # Key generation, AES encryption, localStorage
├── components/
│   ├── Layout/         # Sidebar, Navbar, Layout
│   ├── UI/             # StatCard, TxToast, ConnectPrompt, LiveFeed
│   └── QR/             # QRComponents (display + scanner + modal)
└── pages/
    ├── Dashboard/
    ├── Deposit/
    ├── Transfer/        # QR scan to fill recipient
    ├── Transactions/
    ├── Network/         # Wallet discovery + QR view
    └── Wallet/          # Setup (create/import/unlock) + Settings
```

## Security Notes
- Private keys are encrypted with AES-256-GCM before storing
- Keys are derived using PBKDF2 with 200,000 iterations
- Nothing is ever sent to a server
- For production: add a backend for cloud key recovery
