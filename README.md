# AuthX — Web3 Banking Dashboard

A decentralized banking dashboard built with React + Vite + TailwindCSS, connected to a Solidity smart contract on Ethereum Sepolia testnet.

## Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Web3**: ethers.js v6
- **Wallet**: MetaMask
- **Network**: Ethereum Sepolia Testnet
- **Contract**: `0xFE7556259B388E6F82C9a4c63AA3751a4f6AcFEe`

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── contracts/
│   ├── BankABI.json          # Contract ABI
│   └── contractConfig.js     # Contract address + chain ID
├── context/
│   └── Web3Context.jsx       # Global wallet + contract state
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx        # Main layout wrapper
│   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   └── Navbar.jsx        # Top navbar + wallet connect
│   └── UI/
│       ├── StatCard.jsx      # Dashboard stat cards
│       ├── TxToast.jsx       # Transaction status toast
│       └── ConnectPrompt.jsx # Wallet connect prompt
├── pages/
│   ├── Dashboard/            # Overview + stats
│   ├── Deposit/              # Deposit ETH
│   ├── Transfer/             # Transfer ETH
│   └── Transactions/         # Full tx history
├── App.jsx                   # Routes
├── main.jsx                  # Entry point
└── index.css                 # Global styles + Tailwind
```

## Features

- 🦊 MetaMask wallet connection with auto Sepolia network switch
- ⬡ Live contract balance display
- ↓ Deposit ETH with quick-amount presets
- ⇄ Transfer ETH with address validation and balance checks
- ≡ Full transaction history with Etherscan links
- 🌙 Dark mode by default
- 📱 Responsive layout with mobile sidebar

## Deployment

Push to GitHub and connect to [Vercel](https://vercel.com) for instant deployment.
