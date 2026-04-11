import { NavLink } from "react-router-dom";
import { useWeb3, WALLET_TYPE } from "../../context/Web3Context";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const CONTRACT_ADDRESS = "0xFE7556259B388E6F82C9a4c63AA3751a4f6AcFEe";

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ isOpen }) {
  const { account, walletType, balance, disconnect } = useWeb3();
  const navigate = useNavigate();

  function handleLogout() {
    disconnect();
    navigate("/wallet");
  }

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-boxdark border-r border-stroke z-40 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stroke">
        <img src={logo} alt="AuthX" className="w-9 h-9 rounded-xl object-cover" />
        <div>
          <h1 className="text-white font-bold text-lg leading-none tracking-wide">AuthX</h1>
          <p className="text-xs text-slate-500 mt-0.5">Web3 Wallet</p>
        </div>
      </div>

      {/* Wallet type badge */}
      {account && (
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-boxdark-2 border border-stroke space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="status-dot" />
              <span className="text-xs text-slate-400">
                {walletType === WALLET_TYPE.CUSTOM ? "AuthX Wallet" : "MetaMask"}
              </span>
            </div>
            {walletType === WALLET_TYPE.CUSTOM && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-semibold">Custom</span>
            )}
          </div>
          <p className="font-mono text-xs text-slate-500">
            {account.slice(0,8)}...{account.slice(-6)}
          </p>
          <p className="text-xs text-white font-semibold">{parseFloat(balance).toFixed(4)} ETH</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Main</p>
        <NavItem to="/"            icon="⬡" label="Dashboard" />
        <NavItem to="/deposit"     icon="↓" label="Deposit" />
        <NavItem to="/transfer"    icon="⇄" label="Transfer" />
        <NavItem to="/transactions" icon="≡" label="Transactions" />
        <NavItem to="/network"     icon="◈" label="Network Wallets" />

        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-6">Wallet</p>
        <NavItem to="/wallet"      icon="🔑" label="Wallet Settings" />
        <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank" rel="noreferrer" className="sidebar-link">
          <span className="text-lg">⬡</span><span>Etherscan</span>
        </a>
      </nav>

      {/* Logout */}
      {account && (
        <div className="px-4 py-4 border-t border-stroke">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 text-red-400/70 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
