export const CONTRACT_ADDRESS    = "0xFE7556259B388E6F82C9a4c63AA3751a4f6AcFEe";
export const NETWORK_NAME        = "Sepolia Testnet";
export const CHAIN_ID            = 11155111;
// Block to start scanning from — set to just before contract deployment.
// Using 0 or a very old block causes RPCs to reject (too many blocks).
// The contract at 0xFE7556259B388E6F82C9a4c63AA3751a4f6AcFEe was deployed
// on Sepolia around block 7_600_000. Set conservatively a bit before that.
export const CONTRACT_FROM_BLOCK = 7600000;
export const SEPOLIA_RPC_FALLBACKS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.drpc.org",
  "https://rpc2.sepolia.org",
  "https://rpc.sepolia.org",
];
