import { NavLink } from "react-router-dom";

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `sidebar-link ${isActive ? "active" : ""}`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ isOpen }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-boxdark border-r border-stroke z-40 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-stroke">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none tracking-wide">AuthX</h1>
          <p className="text-xs text-slate-500 mt-0.5">Web3 Banking</p>
        </div>
      </div>

      {/* Network badge */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-boxdark-2 border border-stroke flex items-center gap-2">
        <div className="status-dot" />
        <span className="text-xs text-slate-400 font-mono">Sepolia Testnet</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
          Main
        </p>
        <NavItem to="/" icon="⬡" label="Dashboard" />
        <NavItem to="/deposit" icon="↓" label="Deposit" />
        <NavItem to="/transfer" icon="⇄" label="Transfer" />
        <NavItem to="/transactions" icon="≡" label="Transactions" />
        <NavItem to="/network" icon="◈" label="Network Wallets" />

        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-6">
          Info
        </p>
        <a
          href={`https://sepolia.etherscan.io/address/0xFE7556259B388E6F82C9a4c63AA3751a4f6AcFEe`}
          target="_blank"
          rel="noreferrer"
          className="sidebar-link"
        >
          <span className="text-lg">⬡</span>
          <span>Contract on Etherscan</span>
        </a>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stroke">
        <p className="text-xs text-slate-600 font-mono">
          Contract:<br />
          <span className="text-slate-500">0xFE75...cFEe</span>
        </p>
      </div>
    </aside>
  );
}
