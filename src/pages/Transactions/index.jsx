import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { ConnectPrompt, CopyButton } from "../../components/UI";

export default function Transactions() {
  const { account, transactions, refreshData, isLoadingTx, txFetchError } = useWeb3();
  const [filter, setFilter] = useState("all");

  const filtered = transactions.filter(tx =>
    filter === "all" ? true : tx.type.toLowerCase() === filter
  );

  return (
    <div>
      <div className="mb-8 fade-up flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Full on-chain history · Sepolia</p>
        </div>
        {account && (
          <button onClick={refreshData}
            className="px-4 py-2 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition">
            ↺ Refresh
          </button>
        )}
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your wallet to view transaction history." />
      ) : (
        <div className="fade-up-1">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {["all","deposit","transfer"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filter===f ? "bg-primary text-white" : "bg-boxdark border border-stroke text-slate-400 hover:text-white"
                }`}>
                {f==="all" ? `All (${transactions.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)}s (${transactions.filter(t=>t.type.toLowerCase()===f).length})`}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {txFetchError && (
            <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
              <span>⚠ {txFetchError}</span>
              <button onClick={refreshData} className="ml-4 underline text-red-300 hover:text-red-200 text-xs">Retry</button>
            </div>
          )}

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-stroke bg-boxdark-2">
              <div className="col-span-2 text-xs text-slate-600 font-semibold uppercase tracking-widest">Type</div>
              <div className="col-span-2 text-xs text-slate-600 font-semibold uppercase tracking-widest">Amount</div>
              <div className="col-span-6 text-xs text-slate-600 font-semibold uppercase tracking-widest">Address</div>
              <div className="col-span-2 text-xs text-slate-600 font-semibold uppercase tracking-widest text-right">Tx</div>
            </div>

            {isLoadingTx ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-4xl mb-3 opacity-30 animate-pulse">⬡</span>
                <p className="text-slate-500 text-sm">Fetching on-chain history…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-4xl mb-3 opacity-30">⬡</span>
                <p className="text-slate-600 text-sm">No transactions found</p>
              </div>
            ) : (
              <div className="divide-y divide-stroke">
                {filtered.map((tx, i) => (
                  <div key={i} className="grid grid-cols-12 px-6 py-4 hover:bg-boxdark-2 transition items-center">
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        tx.type==="Deposit" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {tx.type==="Deposit" ? "↓" : "⇄"} {tx.type}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white font-semibold text-sm">{parseFloat(tx.amount).toFixed(6)} ETH</p>
                    </div>
                    <div className="col-span-6">
                      {tx.type === "Deposit" ? (
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-xs text-slate-500 truncate">{tx.user ? `${tx.user.slice(0,14)}...${tx.user.slice(-6)}` : "—"}</p>
                          {tx.user && <CopyButton text={tx.user} />}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <p className="font-mono text-xs text-slate-500">From: {tx.from ? `${tx.from.slice(0,10)}...${tx.from.slice(-4)}` : "—"}</p>
                            {tx.from && <CopyButton text={tx.from} />}
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="font-mono text-xs text-slate-500">To: {tx.to ? `${tx.to.slice(0,10)}...${tx.to.slice(-4)}` : "—"}</p>
                            {tx.to && <CopyButton text={tx.to} />}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      {tx.hash ? (
                        <div className="flex items-center justify-end gap-1">
                          <CopyButton text={tx.hash} />
                          <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-400 transition font-mono">
                            {tx.hash.slice(0,6)}... ↗
                          </a>
                        </div>
                      ) : <span className="text-slate-700 text-xs">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
