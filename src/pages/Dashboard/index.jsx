import { useMemo } from "react";
import { useWeb3 } from "../../context/Web3Context";
import StatCard from "../../components/UI/StatCard";
import ConnectPrompt from "../../components/UI/ConnectPrompt";

// Mini sparkline SVG chart (pure SVG, no deps)
function Sparkline({ data, color = "#3B82F6", height = 40, width = 120 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 0.0001);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace("#","")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Activity bar chart
function ActivityChart({ transactions }) {
  const days = 14;
  const labels = [];
  const depositBars = [];
  const transferBars = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1));

    // Since we don't have timestamps, simulate with block spacing
    const dayDeposits = transactions.filter(
      (t) => t.type === "Deposit" && t.block % days === (days - 1 - i)
    );
    const dayTransfers = transactions.filter(
      (t) => t.type === "Transfer" && t.block % days === (days - 1 - i)
    );

    depositBars.push(dayDeposits.reduce((s, t) => s + parseFloat(t.amount), 0));
    transferBars.push(dayTransfers.reduce((s, t) => s + parseFloat(t.amount), 0));
  }

  const maxVal = Math.max(...depositBars, ...transferBars, 0.001);
  const barW = 100 / days;

  return (
    <div>
      <div className="flex items-end gap-0.5 h-20 mb-2">
        {labels.map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
            <div
              className="w-full rounded-t-sm bg-blue-500/60 transition-all duration-500"
              style={{ height: `${(depositBars[i] / maxVal) * 100}%`, minHeight: depositBars[i] > 0 ? 2 : 0 }}
              title={`Deposit: ${depositBars[i].toFixed(4)} ETH`}
            />
            <div
              className="w-full rounded-t-sm bg-purple-500/60 transition-all duration-500"
              style={{ height: `${(transferBars[i] / maxVal) * 100}%`, minHeight: transferBars[i] > 0 ? 2 : 0 }}
              title={`Transfer: ${transferBars[i].toFixed(4)} ETH`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-xs text-slate-700">{l}</div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" />
          <span className="text-xs text-slate-500">Deposits</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-purple-500/60" />
          <span className="text-xs text-slate-500">Transfers</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { account, balance, walletEthBalance, transactions, networkWallets, refreshData } = useWeb3();

  const totalDeposits = useMemo(() =>
    transactions.filter((t) => t.type === "Deposit")
      .reduce((acc, t) => acc + parseFloat(t.amount), 0).toFixed(4),
    [transactions]
  );

  const totalTransfers = useMemo(() =>
    transactions.filter((t) => t.type === "Transfer")
      .reduce((acc, t) => acc + parseFloat(t.amount), 0).toFixed(4),
    [transactions]
  );

  const myTransfers = useMemo(() =>
    transactions.filter(
      (t) => t.type === "Transfer" && t.from?.toLowerCase() === account?.toLowerCase()
    ).length,
    [transactions, account]
  );

  // Sparkline data: last 10 deposit amounts
  const depositSparkline = useMemo(() =>
    transactions.filter((t) => t.type === "Deposit").slice(-10).map((t) => parseFloat(t.amount)),
    [transactions]
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of your AuthX Web3 Banking activity on Sepolia
        </p>
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your MetaMask wallet to view your dashboard." />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard label="Contract Balance" value={`${parseFloat(balance).toFixed(4)} ETH`} sub="Deposited in contract" icon="⬡" color="blue" delay={0} />
            <StatCard label="Wallet Balance" value={`${walletEthBalance} ETH`} sub="MetaMask ETH balance" icon="🦊" color="orange" delay={100} />
            <StatCard label="Total Deposited" value={`${totalDeposits} ETH`} sub={`${transactions.filter((t) => t.type === "Deposit").length} txns`} icon="↓" color="green" delay={200} />
            <StatCard label="Network Wallets" value={networkWallets.length} sub={`${networkWallets.filter(w => parseFloat(w.balance) > 0).length} with balance`} icon="◈" color="purple" delay={300} />
          </div>

          {/* Charts + wallet row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Activity chart — glassmorphism card */}
            <div className="lg:col-span-2 fade-up-2"
              style={{
                background: "rgba(30,42,59,0.6)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(59,130,246,0.12)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white font-semibold">Activity (14 days)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Deposit & transfer volume</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="status-dot w-1.5 h-1.5" />
                  <span className="text-xs text-green-400 font-medium">Live</span>
                </div>
              </div>
              <ActivityChart transactions={transactions} />
            </div>

            {/* Wallet card */}
            <div className="card fade-up-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4">Your Wallet</p>
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl p-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <p className="text-xs text-slate-400 mb-1">Contract Balance</p>
                  <p className="text-2xl font-bold text-white">{parseFloat(balance).toFixed(6)}</p>
                  <p className="text-sm text-blue-400 font-medium">ETH on Sepolia</p>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-6xl font-black text-blue-400">⬡</div>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Address</p>
                  <p className="font-mono text-xs text-slate-400 bg-boxdark-2 rounded-lg p-2.5 border border-stroke break-all">
                    {account}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="status-dot" />
                  <span className="text-xs text-slate-400">Sepolia · Listening for events</span>
                </div>
              </div>
              <button
                onClick={refreshData}
                className="mt-5 w-full py-2 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition"
              >
                ↺ Refresh
              </button>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card fade-up-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Recent Transactions</p>
              <span className="text-xs text-slate-600">{transactions.length} total</span>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="text-3xl mb-2 opacity-20">⬡</span>
                <p className="text-slate-600 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {transactions.slice(0, 8).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke hover:border-blue-500/20 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tx.type === "Deposit" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {tx.type === "Deposit" ? "↓" : "⇄"}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{tx.type}</p>
                        {tx.type === "Transfer" && (
                          <p className="text-xs font-mono text-slate-600">→ {tx.to?.slice(0, 10)}...</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{parseFloat(tx.amount).toFixed(4)} ETH</p>
                      {tx.hash && (
                        <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400 transition">
                          View ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
