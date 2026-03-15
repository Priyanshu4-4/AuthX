import { useWeb3 } from "../../context/Web3Context";

export default function Navbar({ onMenuToggle }) {
  const { account, connectWallet, disconnectWallet, isConnecting, txStatus } = useWeb3();

  function shortAddress(addr) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-boxdark border-b border-stroke">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-white transition p-1"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-white font-semibold text-sm">
            {txStatus === "pending" && (
              <span className="text-yellow-400">⏳ Processing transaction...</span>
            )}
            {txStatus === "success" && (
              <span className="text-green-400">✓ Transaction confirmed!</span>
            )}
            {txStatus === "error" && (
              <span className="text-red-400">✗ Transaction failed</span>
            )}
            {!txStatus && "Web3 Banking Dashboard"}
          </h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {!account ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm font-semibold transition disabled:opacity-60"
          >
            <span>🦊</span>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-boxdark-2 rounded-lg border border-stroke">
              <div className="status-dot" />
              <span className="text-sm font-mono text-slate-300">
                {shortAddress(account)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
