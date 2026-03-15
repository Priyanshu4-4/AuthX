import { useWeb3 } from "../../context/Web3Context";

export default function ConnectPrompt({ message = "Connect your wallet to get started." }) {
  const { connectWallet, isConnecting } = useWeb3();

  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center fade-up">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">
        🦊
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">Wallet Not Connected</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">{message}</p>
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="btn-primary max-w-xs"
      >
        {isConnecting ? "Connecting..." : "Connect MetaMask"}
      </button>
    </div>
  );
}
