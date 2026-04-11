import { useState, useEffect, useRef } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { ConnectPrompt } from "../../components/UI";
import { QRModal } from "../../components/QR/QRComponents";

// ── LocalStorage label store ──────────────────────────────────────────────────
const LS_KEY = "authx_wallet_labels";

function loadLabels() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}

function saveLabels(labels) {
  localStorage.setItem(LS_KEY, JSON.stringify(labels));
}

// ── Identicon ─────────────────────────────────────────────────────────────────
function Identicon({ address, size = 36 }) {
  const colors = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899"];
  const idx  = parseInt(address.slice(2,4), 16) % colors.length;
  const idx2 = parseInt(address.slice(4,6), 16) % colors.length;
  return (
    <div className="rounded-xl flex items-center justify-center font-mono font-bold text-white flex-shrink-0"
      style={{ width:size, height:size, background:`linear-gradient(135deg,${colors[idx]},${colors[idx2]})`, fontSize:size*0.32 }}>
      {address.slice(2,4).toUpperCase()}
    </div>
  );
}

// ── Auto-tags (lower priority than custom labels) ─────────────────────────────
function getAutoTag(wallet, myAddress) {
  const addr = wallet.address.toLowerCase();
  const me   = myAddress?.toLowerCase();
  if (addr === me)                            return { label:"You",           color:"bg-blue-500/20 text-blue-400" };
  if (wallet.depositCount > 5)                return { label:"Top Depositor", color:"bg-green-500/20 text-green-400" };
  if (wallet.transferCount > 5)               return { label:"Active Trader", color:"bg-purple-500/20 text-purple-400" };
  if (parseFloat(wallet.balance) > 0.01)      return { label:"Has Balance",   color:"bg-yellow-500/20 text-yellow-400" };
  if (wallet.depositCount > 0)                return { label:"Depositor",     color:"bg-slate-500/20 text-slate-400" };
  return null;
}

function shortAddr(addr) {
  return `${addr.slice(0,8)}...${addr.slice(-6)}`;
}

// ── Label Edit Modal ──────────────────────────────────────────────────────────
function LabelModal({ wallet, current, onSave, onClose }) {
  const [name, setName] = useState(current?.name || "");
  const [note, setNote] = useState(current?.note || "");
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function handleSave() {
    const trimName = name.trim();
    const trimNote = note.trim();
    if (!trimName) { onSave(wallet.address, null); }            // clear if empty
    else           { onSave(wallet.address, { name: trimName, note: trimNote }); }
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card max-w-md w-full space-y-5 scale-in" style={{ borderColor:"#3B82F6", boxShadow:"0 0 0 1px #3B82F620, 0 20px 60px #00000080" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Label Wallet</h3>
            <p className="text-xs text-slate-500 mt-0.5">Saved locally in your browser</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none transition">×</button>
        </div>

        {/* Wallet preview */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stroke" style={{ background:"#131E2E" }}>
          <Identicon address={wallet.address} size={36} />
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400 truncate">{wallet.address}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              ↓ {wallet.depositCount} dep · ⇄ {wallet.transferCount} tx · {wallet.balance} ETH
            </p>
          </div>
        </div>

        {/* Name field */}
        <div>
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
            Display Name
          </label>
          <input
            ref={nameRef}
            type="text"
            placeholder="e.g. Alice, Treasury, Team Wallet…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            className="input-dark"
          />
        </div>

        {/* Note field */}
        <div>
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
            Note <span className="text-slate-700 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            placeholder="Any notes about this wallet…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={120}
            rows={2}
            className="input-dark resize-none"
            style={{ lineHeight:"1.5" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {current && (
            <button
              onClick={() => { onSave(wallet.address, null); onClose(); }}
              className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition">
              Remove Label
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 btn-primary" style={{ padding:"10px 24px" }}>
            {name.trim() ? "Save Label" : "Clear Label"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Network Page ──────────────────────────────────────────────────────────────
export default function Network() {
  const { account, networkWallets, isLoadingWallets, discoverNetworkWallets, transfer, loading } = useWeb3();

  const [labels, setLabels]                 = useState(loadLabels);
  const [search, setSearch]                 = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null); // for send
  const [labelTarget, setLabelTarget]       = useState(null); // for label modal
  const [sendAmount, setSendAmount]         = useState("");
  const [showSendModal, setShowSendModal]   = useState(false);
  const [showQR, setShowQR]                 = useState(null);
  const [sortBy, setSortBy]                 = useState("lastSeen");

  // Persist labels whenever they change
  function handleSaveLabel(address, value) {
    setLabels(prev => {
      const next = { ...prev };
      if (value) next[address.toLowerCase()] = value;
      else delete next[address.toLowerCase()];
      saveLabels(next);
      return next;
    });
  }

  const sorted = [...networkWallets].sort((a, b) => {
    if (sortBy === "balance")  return parseFloat(b.balance) - parseFloat(a.balance);
    if (sortBy === "deposits") return b.depositCount - a.depositCount;
    if (sortBy === "labeled")  return (labels[b.address] ? 1 : 0) - (labels[a.address] ? 1 : 0);
    return b.lastSeen - a.lastSeen;
  });

  const filtered = sorted.filter(w => {
    const q = search.toLowerCase();
    const lbl = labels[w.address.toLowerCase()];
    return (
      w.address.toLowerCase().includes(q) ||
      lbl?.name?.toLowerCase().includes(q) ||
      lbl?.note?.toLowerCase().includes(q)
    );
  });

  async function handleSend() {
    if (!selectedWallet || !sendAmount) return;
    await transfer(selectedWallet.address, sendAmount);
    setShowSendModal(false);
  }

  const totalVolume = networkWallets.reduce((a,w) => a + parseFloat(w.balance), 0).toFixed(4);
  const activeCount = networkWallets.filter(w => parseFloat(w.balance) > 0).length;
  const labeledCount = Object.keys(labels).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Network Wallets</h1>
          <p className="text-slate-500 text-sm mt-1">All wallets that have interacted with the AuthX contract</p>
        </div>
        {account && (
          <button onClick={discoverNetworkWallets} disabled={isLoadingWallets}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition disabled:opacity-50">
            <span className={isLoadingWallets ? "animate-spin inline-block" : ""}>↺</span>
            {isLoadingWallets ? "Scanning..." : "Refresh"}
          </button>
        )}
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your wallet to discover other wallets on the network." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 fade-up-1">
            {[
              { icon:"⬡", color:"blue",   label:"Total Wallets",    value: networkWallets.length },
              { icon:"◈", color:"green",  label:"Total Locked ETH", value: `${totalVolume} ETH` },
              { icon:"✦", color:"purple", label:"Active Wallets",   value: activeCount },
              { icon:"⊕", color:"yellow", label:"Labeled",          value: labeledCount },
            ].map((s,i) => (
              <div key={i} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                  ${s.color==="blue"?"bg-blue-500/10 text-blue-400"
                  :s.color==="green"?"bg-green-500/10 text-green-400"
                  :s.color==="yellow"?"bg-yellow-500/10 text-yellow-400"
                  :"bg-purple-500/10 text-purple-400"}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 fade-up-2">
            <input type="text"
              placeholder="Search by address, name, or note…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-dark max-w-sm" />
            <div className="flex gap-2 flex-wrap">
              {[
                { id:"lastSeen", label:"Recent" },
                { id:"balance",  label:"Balance" },
                { id:"deposits", label:"Deposits" },
                { id:"labeled",  label:"Labeled ⊕" },
              ].map((s) => (
                <button key={s.id} onClick={() => setSortBy(s.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                    sortBy === s.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-stroke text-slate-400 hover:text-white"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {isLoadingWallets ? (
            <div className="card flex flex-col items-center py-16 fade-up-2">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Scanning blockchain events...</p>
              <p className="text-slate-600 text-xs mt-1">Fetching all historical interactions</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center fade-up-2">
              <span className="text-4xl mb-3 opacity-30">⬡</span>
              <p className="text-slate-500 text-sm">
                {search ? "No wallets match your search" : "No wallets found yet"}
              </p>
              {!search && (
                <button onClick={discoverNetworkWallets}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition">
                  Try scanning again →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 fade-up-2">
              {filtered.map((wallet) => {
                const addrKey  = wallet.address.toLowerCase();
                const isMe     = addrKey === account?.toLowerCase();
                const autoTag  = getAutoTag(wallet, account);
                const label    = labels[addrKey];
                const hasEth   = parseFloat(wallet.balance) > 0;

                return (
                  <div key={wallet.address}
                    className={`card p-4 flex items-center justify-between gap-4 transition group
                      ${isMe ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/40"
                             : label ? "border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/30"
                             : "hover:border-blue-500/20"}`}>

                    <div className="flex items-center gap-3 min-w-0">
                      <Identicon address={wallet.address} size={40} />

                      <div className="min-w-0">
                        {/* Custom label name (prominent) */}
                        {label?.name && (
                          <p className="text-sm font-semibold text-yellow-300 leading-tight truncate">
                            {label.name}
                          </p>
                        )}

                        {/* Address + auto-tag */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-mono text-sm ${label?.name ? "text-slate-500 text-xs" : "text-white"}`}>
                            {shortAddr(wallet.address)}
                          </p>
                          {autoTag && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${autoTag.color}`}>
                              {autoTag.label}
                            </span>
                          )}
                        </div>

                        {/* Custom note */}
                        {label?.note && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                            {label.note}
                          </p>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-slate-600">↓ {wallet.depositCount} dep</span>
                          <span className="text-xs text-slate-600">⇄ {wallet.transferCount} tx</span>
                          {wallet.lastSeen > 0 && (
                            <span className="text-xs text-slate-700">Block #{wallet.lastSeen}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Balance */}
                      <div className="text-right hidden sm:block min-w-[90px] mr-2">
                        <p className="text-xs text-slate-600 mb-0.5">Balance</p>
                        <p className={`font-mono font-semibold text-sm ${hasEth ? "text-green-400" : "text-slate-600"}`}>
                          {wallet.balance} ETH
                        </p>
                      </div>

                      {/* Label button — always visible, highlighted when labeled */}
                      <button
                        onClick={() => setLabelTarget(wallet)}
                        title={label ? `Labeled: ${label.name}` : "Add label"}
                        className={`p-2 rounded-lg text-sm transition ${
                          label
                            ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                            : "text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100"
                        }`}>
                        {label ? "⊕" : "⊕"}
                      </button>

                      {/* QR button */}
                      <button onClick={() => setShowQR(wallet.address)}
                        title="View QR"
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition">
                        ▣
                      </button>

                      {/* Send — only on hover, not self */}
                      {!isMe && (
                        <button
                          onClick={() => { setSelectedWallet(wallet); setSendAmount(""); setShowSendModal(true); }}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100">
                          Send →
                        </button>
                      )}

                      {/* Etherscan */}
                      <a href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                        target="_blank" rel="noreferrer"
                        className="p-2 text-slate-600 hover:text-blue-400 transition text-sm">
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

      {/* Label Modal */}
      {labelTarget && (
        <LabelModal
          wallet={labelTarget}
          current={labels[labelTarget.address.toLowerCase()]}
          onSave={handleSaveLabel}
          onClose={() => setLabelTarget(null)}
        />
      )}

      {/* Send Modal */}
      {showSendModal && selectedWallet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full space-y-5 scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Quick Send</h3>
              <button onClick={() => setShowSendModal(false)} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke">
              <Identicon address={selectedWallet.address} size={36} />
              <div className="min-w-0">
                {labels[selectedWallet.address.toLowerCase()]?.name && (
                  <p className="text-sm font-semibold text-yellow-300 leading-tight">
                    {labels[selectedWallet.address.toLowerCase()].name}
                  </p>
                )}
                <p className="text-xs text-slate-500 mb-0.5">Sending to</p>
                <p className="font-mono text-xs text-white break-all">{selectedWallet.address}</p>
                {autoTagForModal(selectedWallet, account) && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold mt-1 inline-block ${autoTagForModal(selectedWallet, account).color}`}>
                    {autoTagForModal(selectedWallet, account).label}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Amount (ETH)</label>
              <div className="relative">
                <input type="number" placeholder="0.00" value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  min="0" step="0.001" className="input-dark pr-14 text-lg font-semibold" autoFocus />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">ETH</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSendModal(false)}
                className="flex-1 py-3 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleSend} disabled={loading || !sendAmount || parseFloat(sendAmount) <= 0}
                className="flex-1 btn-primary">
                {loading ? "Sending..." : `Send ${sendAmount||"0"} ETH`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQR && <QRModal address={showQR} onClose={() => setShowQR(null)} />}
    </div>
  );
}

// helper used in send modal (outside component to avoid stale closure)
function autoTagForModal(wallet, account) {
  return getAutoTag(wallet, account);
}
