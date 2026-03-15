import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import ConnectPrompt from "../../components/UI/ConnectPrompt";

export default function Deposit() {
  const { account, balance, deposit, loading } = useWeb3();
  const [amount, setAmount] = useState("");

  const presets = ["0.001", "0.005", "0.01", "0.05"];

  async function handleDeposit() {
    if (!amount || parseFloat(amount) <= 0) return;
    await deposit(amount);
    setAmount("");
  }

  return (
    <div>
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white tracking-tight">Deposit ETH</h1>
        <p className="text-slate-500 text-sm mt-1">
          Send ETH to your AuthX contract balance on Sepolia
        </p>
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your wallet to deposit ETH into the contract." />
      ) : (
        <div className="max-w-lg fade-up-1">
          <div className="card space-y-6">
            {/* Current balance */}
            <div className="px-4 py-4 rounded-xl bg-boxdark-2 border border-stroke">
              <p className="text-xs text-slate-500 mb-1">Current Contract Balance</p>
              <p className="text-2xl font-bold text-white">
                {parseFloat(balance).toFixed(6)}{" "}
                <span className="text-lg text-blue-400">ETH</span>
              </p>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Amount to Deposit
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.001"
                  className="input-dark pr-14 text-lg font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                  ETH
                </span>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-xs text-slate-600 mb-2">Quick amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${
                      amount === p
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-stroke bg-boxdark-2 text-slate-400 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-400 space-y-1">
              <p>• ETH will be deposited to contract <span className="font-mono text-blue-400">0xFE75...cFEe</span></p>
              <p>• MetaMask will ask you to confirm the transaction</p>
              <p>• Gas fees apply on Sepolia testnet</p>
            </div>

            <button
              onClick={handleDeposit}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">◌</span> Processing...
                </span>
              ) : (
                `Deposit ${amount || "0"} ETH`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
