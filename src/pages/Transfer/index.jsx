import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import ConnectPrompt from "../../components/UI/ConnectPrompt";

export default function Transfer() {
  const { account, balance, transfer, loading } = useWeb3();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientError, setRecipientError] = useState("");

  function validateAddress(addr) {
    return /^0x[0-9a-fA-F]{40}$/.test(addr);
  }

  function handleRecipientChange(val) {
    setRecipient(val);
    if (val && !validateAddress(val)) {
      setRecipientError("Invalid Ethereum address");
    } else {
      setRecipientError("");
    }
  }

  async function handleTransfer() {
    if (!validateAddress(recipient)) return;
    if (!amount || parseFloat(amount) <= 0) return;
    await transfer(recipient, amount);
    setAmount("");
    setRecipient("");
  }

  const isValid =
    validateAddress(recipient) &&
    amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= parseFloat(balance);

  return (
    <div>
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white tracking-tight">Transfer ETH</h1>
        <p className="text-slate-500 text-sm mt-1">
          Transfer ETH from your contract balance to another wallet
        </p>
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your wallet to transfer ETH." />
      ) : (
        <div className="max-w-lg fade-up-1">
          <div className="card space-y-6">
            {/* Balance */}
            <div className="px-4 py-4 rounded-xl bg-boxdark-2 border border-stroke">
              <p className="text-xs text-slate-500 mb-1">Available to Transfer</p>
              <p className="text-2xl font-bold text-white">
                {parseFloat(balance).toFixed(6)}{" "}
                <span className="text-lg text-blue-400">ETH</span>
              </p>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={`input-dark font-mono ${recipientError ? "border-red-500/50" : ""}`}
              />
              {recipientError && (
                <p className="text-xs text-red-400 mt-1">{recipientError}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Amount
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  ETH
                </span>
              </div>
              {amount && parseFloat(amount) > parseFloat(balance) && (
                <p className="text-xs text-red-400 mt-1">
                  Amount exceeds your contract balance
                </p>
              )}
            </div>

            {/* Summary */}
            {recipient && amount && isValid && (
              <div className="px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/20 text-xs text-slate-400 space-y-1 slide-in">
                <p className="text-green-400 font-semibold mb-2">Transfer Summary</p>
                <p>To: <span className="font-mono text-slate-300">{recipient.slice(0,10)}...{recipient.slice(-6)}</span></p>
                <p>Amount: <span className="text-white font-semibold">{amount} ETH</span></p>
                <p>Remaining: <span className="text-white">{(parseFloat(balance) - parseFloat(amount)).toFixed(6)} ETH</span></p>
              </div>
            )}

            {/* Info */}
            <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-400 space-y-1">
              <p>• This transfers from your contract balance (not MetaMask directly)</p>
              <p>• Transaction will be broadcast on Sepolia testnet</p>
              <p>• MetaMask confirmation required</p>
            </div>

            <button
              onClick={handleTransfer}
              disabled={loading || !isValid}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">◌</span> Processing...
                </span>
              ) : (
                "Transfer ETH"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
