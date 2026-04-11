import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { useNavigate } from "react-router-dom";

// ── CopyButton ────────────────────────────────────────────────────
export function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className={`flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition text-xs ${className}`}
    >
      {copied ? (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  );
}

// ── StatCard ──────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = "blue", delay = 0 }) {
  const colors = {
    blue:   "text-blue-400 bg-blue-400/10",
    green:  "text-green-400 bg-green-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    orange: "text-orange-400 bg-orange-400/10",
  };
  return (
    <div className="card fade-up flex items-start justify-between" style={{ animationDelay:`${delay}ms` }}>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl text-xl ${colors[color]}`}>{icon}</div>
    </div>
  );
}

// ── TxToast ───────────────────────────────────────────────────────
export function TxToast() {
  const { txStatus } = useWeb3();
  if (!txStatus) return null;
  const config = {
    pending: { bg:"bg-yellow-500/10 border-yellow-500/30", text:"text-yellow-300", msg:"⏳ Transaction pending on Sepolia..." },
    success: { bg:"bg-green-500/10 border-green-500/30",  text:"text-green-300",  msg:"✓ Transaction confirmed!" },
    error:   { bg:"bg-red-500/10 border-red-500/30",      text:"text-red-300",    msg:"✗ Transaction failed." },
  }[txStatus];
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border ${config.bg} ${config.text} text-sm font-medium slide-in shadow-lg`}>
      {config.msg}
    </div>
  );
}

// ── ConnectPrompt ─────────────────────────────────────────────────
export function ConnectPrompt({ message = "Connect your wallet to get started." }) {
  const navigate = useNavigate();
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center fade-up">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">🔑</div>
      <h3 className="text-white font-semibold text-lg mb-2">Wallet Not Connected</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">{message}</p>
      <button onClick={() => navigate("/wallet")} className="btn-primary max-w-xs">Set Up Wallet</button>
    </div>
  );
}

// ── LiveFeed ──────────────────────────────────────────────────────
export function LiveFeed() {
  const { liveNotifications, account } = useWeb3();
  if (!account) return null;
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-xs pointer-events-none">
      {liveNotifications.map(n => (
        <div key={n.id}
          style={{ animation:"slideInLeft 0.3s ease forwards" }}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-md pointer-events-auto
            ${n.color==="green" ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-blue-500/10 border-blue-500/30 text-blue-300"}`}>
          <span className="text-base mt-0.5">{n.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">Live · {n.type}</p>
            <p className="font-mono text-xs">{n.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AutoReconnectScreen ───────────────────────────────────────────
export function AutoReconnectScreen() {
  return (
    <div className="min-h-screen bg-[#0D1521] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm">Restoring session...</p>
      </div>
    </div>
  );
}
