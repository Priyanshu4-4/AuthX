import { useState } from "react";
import { useWeb3, WALLET_TYPE } from "../../context/Web3Context";
import { QRModal } from "../../components/QR/QRComponents";
import { loadKeystoreFromStorage, downloadKeystore } from "../../utils/walletCrypto";
import { CopyButton } from "../../components/UI";

export default function WalletSettings() {
  const { account, walletType, balance, walletEthBalance, forgetWallet, disconnect } = useWeb3();
  const [showQR, setShowQR]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  function copyAddress() {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadKeystore() {
    const ks = loadKeystoreFromStorage();
    if (ks) downloadKeystore(ks);
  }

  if (!account) {
    return (
      <div>
        <div className="mb-8 fade-up">
          <h1 className="text-2xl font-bold text-white tracking-tight">Wallet Settings</h1>
        </div>
        <div className="card flex flex-col items-center py-16 text-center fade-up-1">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">🔑</div>
          <h3 className="text-white font-semibold text-lg mb-2">No Wallet Connected</h3>
          <p className="text-slate-500 text-sm">Go to the wallet setup page to create or import a wallet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white tracking-tight">Wallet Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your AuthX wallet</p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Wallet type badge */}
        <div className="card fade-up-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Wallet Type</p>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              walletType === WALLET_TYPE.CUSTOM
                ? "bg-blue-500/20 text-blue-400"
                : "bg-orange-500/20 text-orange-400"
            }`}>
              {walletType === WALLET_TYPE.CUSTOM ? "🔑 AuthX Custom Wallet" : "🦊 MetaMask"}
            </span>
          </div>

          {/* Address */}
          <div>
            <p className="text-xs text-slate-600 mb-1">Address</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-slate-300 bg-boxdark-2 rounded-lg p-3 border border-stroke flex-1 break-all">
                {account}
              </p>
              <button onClick={copyAddress}
                className="px-3 py-3 rounded-lg border border-stroke text-slate-400 hover:text-white hover:bg-stroke transition text-xs flex-shrink-0">
                {copied ? "✓" : "⎘"}
              </button>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke">
              <p className="text-xs text-slate-500 mb-1">Contract Balance</p>
              <p className="text-lg font-bold text-white">{parseFloat(balance).toFixed(6)} <span className="text-blue-400 text-sm">ETH</span></p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke">
              <p className="text-xs text-slate-500 mb-1">Wallet ETH</p>
              <p className="text-lg font-bold text-white">{walletEthBalance} <span className="text-green-400 text-sm">ETH</span></p>
            </div>
          </div>

          {/* QR code */}
          <button onClick={() => setShowQR(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-stroke text-slate-300 text-sm hover:bg-stroke hover:text-white transition">
            ▣ Show My QR Code
          </button>
        </div>

        {/* AuthX-only options */}
        {walletType === WALLET_TYPE.CUSTOM && (
          <div className="card fade-up-2 space-y-3">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Backup & Export</p>
            <button onClick={handleDownloadKeystore}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-stroke text-slate-300 text-sm hover:bg-stroke hover:text-white transition">
              ↓ Download Encrypted Keystore
            </button>
            <p className="text-xs text-slate-600 text-center">
              Your keystore is AES-256 encrypted. You need your password to restore it.
            </p>
          </div>
        )}

        {/* Disconnect */}
        <div className="card fade-up-3 space-y-3">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Session</p>
          <button onClick={disconnect}
            className="w-full py-3 rounded-xl border border-stroke text-slate-400 text-sm hover:border-yellow-500/50 hover:text-yellow-400 transition">
            Lock Wallet (keep stored)
          </button>

          {walletType === WALLET_TYPE.CUSTOM && (
            <>
              <button onClick={() => setShowDanger(!showDanger)}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400/60 text-sm hover:border-red-500/50 hover:text-red-400 transition">
                Forget Wallet (delete from device)
              </button>
              {showDanger && (
                <div className="px-4 py-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3 slide-in">
                  <p className="text-xs text-red-400">⚠ This will permanently delete your encrypted wallet from this browser. Make sure you have your recovery phrase backed up.</p>
                  <button onClick={forgetWallet}
                    className="w-full py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition">
                    Yes, forget this wallet
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Security info */}
        <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-500 space-y-1 fade-up-4">
          <p>🔒 Keys are AES-256-GCM encrypted in your browser's localStorage</p>
          <p>🌐 Private keys are never sent to any server</p>
          <p>⬡ Transactions broadcast directly to Sepolia RPC</p>
        </div>
      </div>

      {showQR && account && <QRModal address={account} onClose={() => setShowQR(false)} />}
    </div>
  );
}
