import { useWeb3, WALLET_TYPE } from "../../context/Web3Context";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function Navbar({ onMenuToggle }) {
  const { account, walletType, txStatus, isConnecting, disconnect } = useWeb3();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-boxdark border-b border-stroke">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden text-slate-400 hover:text-white transition p-1">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {/* Logo visible on mobile */}
        <img src={logo} alt="AuthX" className="h-8 w-8 lg:hidden rounded-lg" />

        <div>
          {txStatus === "pending" && <span className="text-yellow-400 text-sm">⏳ Processing transaction...</span>}
          {txStatus === "success" && <span className="text-green-400 text-sm">✓ Transaction confirmed!</span>}
          {txStatus === "error"   && <span className="text-red-400 text-sm">✗ Transaction failed</span>}
          {!txStatus && <span className="text-slate-400 text-sm hidden sm:block">Sepolia Testnet</span>}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {!account ? (
          <button
            onClick={() => navigate("/wallet")}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm font-semibold transition disabled:opacity-60"
          >
            🔑 {isConnecting ? "Connecting..." : "Get Started"}
          </button>
        ) : (
          <>
            {/* Wallet badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-boxdark-2 rounded-lg border border-stroke">
              <div className="status-dot" />
              <span className="text-xs font-mono text-slate-300 hidden sm:block">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                walletType === WALLET_TYPE.CUSTOM
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}>
                {walletType === WALLET_TYPE.CUSTOM ? "AuthX" : "MM"}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={() => { disconnect(); navigate("/wallet"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-red-400/70 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition"
              title="Logout"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
