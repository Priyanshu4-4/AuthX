import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import ConnectPrompt from "../../components/UI/ConnectPrompt";

function Identicon({ address, size = 36 }) {
  // Generate a deterministic color from address
  const colors = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899"];
  const idx = parseInt(address.slice(2, 4), 16) % colors.length;
  const idx2 = parseInt(address.slice(4, 6), 16) % colors.length;
  const initials = address.slice(2, 4).toUpperCase();

  return (
    <div
      className="rounded-xl flex items-center justify-center font-mono font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors[idx]}, ${colors[idx2]})`,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  );
}

export default function Network() {
  const { account, networkWallets, isLoadingWallets, discoverNetworkWallets, transfer, loading } = useWeb3();
  const [search, setSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);

  const filtered = networkWallets.filter((w) =>
    w.address.toLowerCase().includes(search.toLowerCase())
  );

  function openSend(wallet) {
    setSelectedWallet(wallet);
    setSendAmount("");
    setShowSendModal(true);
  }

  async function handleSend() {
    if (!selectedWallet || !sendAmount) return;
    await transfer(selectedWallet.address, sendAmount);
    setShowSendModal(false);
    setSendAmount("");
  }

  const totalVolume = networkWallets
    .reduce((acc, w) => acc + parseFloat(w.balance), 0)
    .toFixed(4);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Network Wallets</h1>
          <p className="text-slate-500 text-sm mt-1">
            All wallets that have interacted with the AuthX contract
          </p>
        </div>
        {account && (
          <button
            onClick={discoverNetworkWallets}
            disabled={isLoadingWallets}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition disabled:opacity-50"
          >
            <span className={isLoadingWallets ? "animate-spin inline-block" : ""}>↺</span>
            {isLoadingWallets ? "Scanning..." : "Refresh"}
          </button>
        )}
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your wallet to discover other wallets on the network." />
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 fade-up-1">
            <div className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">⬡</div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Total Wallets</p>
                <p className="text-xl font-bold text-white">{networkWallets.length}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 text-lg">◈</div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Total Locked ETH</p>
                <p className="text-xl font-bold text-white">{totalVolume} ETH</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg">✦</div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Active Wallets</p>
                <p className="text-xl font-bold text-white">
                  {networkWallets.filter((w) => parseFloat(w.balance) > 0).length}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 fade-up-2">
            <input
              type="text"
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark max-w-md font-mono"
            />
          </div>

          {/* Wallet list */}
          {isLoadingWallets ? (
            <div className="card flex flex-col items-center py-16 fade-up-2">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Scanning blockchain events...</p>
              <p className="text-slate-600 text-xs mt-1">Discovering wallet addresses</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center fade-up-2">
              <span className="text-4xl mb-3 opacity-30">⬡</span>
              <p className="text-slate-500 text-sm">No wallets found</p>
            </div>
          ) : (
            <div className="space-y-3 fade-up-2">
              {filtered.map((wallet, i) => {
                const isMe = wallet.address.toLowerCase() === account?.toLowerCase();
                return (
                  <div
                    key={wallet.address}
                    className={`card p-4 flex items-center justify-between gap-4 hover:border-blue-500/20 transition group ${
                      isMe ? "border-blue-500/30 bg-blue-500/5" : ""
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Identicon address={wallet.address} size={42} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm text-white break-all">
                            {wallet.address.slice(0, 16)}...{wallet.address.slice(-8)}
                          </p>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-600">
                            ↓ {wallet.depositCount} deposits
                          </span>
                          <span className="text-xs text-slate-600">
                            ⇄ {wallet.transferCount} transfers
                          </span>
                          <span className="text-xs text-slate-600">
                            Block #{wallet.lastSeen}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-600 mb-0.5">Balance</p>
                        <p className={`font-semibold text-sm ${parseFloat(wallet.balance) > 0 ? "text-white" : "text-slate-600"}`}>
                          {wallet.balance} ETH
                        </p>
                      </div>

                      {!isMe && (
                        <button
                          onClick={() => openSend(wallet)}
                          className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100"
                        >
                          Send →
                        </button>
                      )}

                      <a
                        href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:text-blue-400 transition text-sm"
                        title="View on Etherscan"
                      >
                        ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Send Modal */}
      {showSendModal && selectedWallet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full space-y-5 slide-in">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Quick Send</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-slate-500 hover:text-white transition text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Recipient */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke">
              <Identicon address={selectedWallet.address} size={36} />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Sending to</p>
                <p className="font-mono text-xs text-white break-all">
                  {selectedWallet.address}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Amount (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  min="0"
                  step="0.001"
                  className="input-dark pr-14 text-lg font-semibold"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">ETH</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 py-3 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !sendAmount || parseFloat(sendAmount) <= 0}
                className="flex-1 btn-primary"
              >
                {loading ? "Sending..." : `Send ${sendAmount || "0"} ETH`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
