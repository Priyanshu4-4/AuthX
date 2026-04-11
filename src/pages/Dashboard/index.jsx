import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3, WALLET_TYPE } from "../../context/Web3Context";
import { StatCard, ConnectPrompt, CopyButton } from "../../components/UI";

export default function Dashboard() {
  const { account, balance, walletEthBalance, transactions, networkWallets, walletType, refreshData, isLoadingTx } = useWeb3();
  const navigate = useNavigate();

  const totalDeposits = useMemo(() =>
    transactions.filter(t=>t.type==="Deposit").reduce((a,t)=>a+parseFloat(t.amount),0).toFixed(4), [transactions]);
  const myTransfers = useMemo(() =>
    transactions.filter(t=>t.type==="Transfer"&&t.from?.toLowerCase()===account?.toLowerCase()).length, [transactions,account]);

  return (
    <div>
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">AuthX Web3 Banking · Sepolia Testnet</p>
      </div>

      {!account ? (
        <ConnectPrompt message="Set up your AuthX wallet or connect MetaMask to get started." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard label="Contract Balance" value={`${parseFloat(balance).toFixed(4)} ETH`}   sub="In AuthX contract"     icon="⬡" color="blue"   delay={0}   />
            <StatCard label="Wallet Balance"   value={`${walletEthBalance} ETH`}                  sub="Your actual ETH"      icon="◈" color="green"  delay={100} />
            <StatCard label="Total Deposited"  value={`${totalDeposits} ETH`}                     sub={`${transactions.filter(t=>t.type==="Deposit").length} deposits`} icon="↓" color="purple" delay={200} />
            <StatCard label="Network Wallets"  value={networkWallets.length}                       sub="Discovered on Sepolia" icon="✦" color="orange" delay={300} />
          </div>

          {/* Wallet info card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card fade-up-2" style={{ background:"rgba(30,42,59,0.6)", backdropFilter:"blur(16px)", border:"1px solid rgba(59,130,246,0.12)" }}>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4">Your Wallet</p>
              <div className="relative overflow-hidden rounded-xl p-4 mb-4"
                style={{ background:"linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.1))", border:"1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-xs text-slate-400 mb-1">Contract Balance</p>
                <p className="text-2xl font-bold text-white">{parseFloat(balance).toFixed(6)}</p>
                <p className="text-sm text-blue-400">ETH on Sepolia</p>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-6xl font-black text-blue-400">⬡</div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600">Address</p>
                <div className="flex items-center gap-2 bg-boxdark-2 rounded-lg px-3 py-2.5 border border-stroke"><p className="font-mono text-xs text-slate-400 break-all flex-1">{account}</p><CopyButton text={account} /></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="status-dot" />
                    <span className="text-xs text-slate-400">Sepolia · Live</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${walletType===WALLET_TYPE.CUSTOM?"bg-blue-500/20 text-blue-400":"bg-orange-500/20 text-orange-400"}`}>
                    {walletType===WALLET_TYPE.CUSTOM?"AuthX Wallet":"MetaMask"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate("/transfer")}
                  className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition">
                  ⇄ Transfer
                </button>
                <button onClick={refreshData}
                  className="flex-1 py-2 rounded-lg border border-stroke text-slate-400 text-xs hover:bg-stroke hover:text-white transition">
                  ↺ Refresh
                </button>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="card lg:col-span-2 fade-up-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Recent Transactions</p>
                <span className="text-xs text-slate-600">{transactions.length} total</span>
              </div>
              {isLoadingTx ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="text-3xl mb-2 opacity-20 animate-pulse">⬡</span>
                  <p className="text-slate-500 text-sm">Loading transactions…</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="text-3xl mb-2 opacity-20">⬡</span>
                  <p className="text-slate-600 text-sm">No transactions yet</p>
                  <button onClick={() => navigate("/deposit")} className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition">
                    Make your first deposit →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {transactions.slice(0,8).map((tx,i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke hover:border-blue-500/20 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tx.type==="Deposit"?"bg-green-500/10 text-green-400":"bg-blue-500/10 text-blue-400"}`}>
                          {tx.type==="Deposit"?"↓":"⇄"}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{tx.type}</p>
                          {tx.type==="Transfer" && <p className="text-xs font-mono text-slate-600">→ {tx.to?.slice(0,10)}...</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{parseFloat(tx.amount).toFixed(4)} ETH</p>
                        {tx.hash && <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400 transition">View ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
