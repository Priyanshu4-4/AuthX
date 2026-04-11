import { useState } from "react";
import { useWeb3, WALLET_TYPE } from "../../context/Web3Context";
import { ConnectPrompt } from "../../components/UI";
import { QRScanner, QRModal } from "../../components/QR/QRComponents";

export default function Transfer() {
  const { account, balance, walletEthBalance, transfer, sendRawEth, loading, walletType } = useWeb3();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount]       = useState("");
  const [mode, setMode]           = useState("contract"); // contract | raw
  const [recipientError, setRecipientError] = useState("");
  const [showScanner, setShowScanner]       = useState(false);
  const [showMyQR, setShowMyQR]             = useState(false);

  function validateAddress(addr) {
    return /^0x[0-9a-fA-F]{40}$/.test(addr);
  }

  function handleRecipientChange(val) {
    setRecipient(val);
    setRecipientError(val && !validateAddress(val) ? "Invalid Ethereum address" : "");
  }

  function handleScanned(address) {
    setRecipient(address);
    setRecipientError("");
    setShowScanner(false);
  }

  async function handleSend() {
    if (!validateAddress(recipient) || !amount || parseFloat(amount) <= 0) return;
    if (mode === "contract") {
      await transfer(recipient, amount);
    } else {
      await sendRawEth(recipient, amount);
    }
    setAmount("");
    setRecipient("");
  }

  const availableBalance = mode === "contract" ? balance : walletEthBalance;
  const isValid = validateAddress(recipient) && amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(availableBalance);

  return (
    <div>
      <div className="mb-8 fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transfer ETH</h1>
          <p className="text-slate-500 text-sm mt-1">Send ETH to any wallet on Sepolia</p>
        </div>
        {account && (
          <button onClick={() => setShowMyQR(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition">
            ⬡ My QR Code
          </button>
        )}
      </div>

      {!account ? (
        <ConnectPrompt message="Connect your wallet to transfer ETH." />
      ) : (
        <div className="max-w-lg fade-up-1">
          <div className="card space-y-6">

            {/* Transfer mode */}
            {walletType === WALLET_TYPE.CUSTOM && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Transfer Type</p>
                <div className="flex gap-2">
                  {[
                    { id: "contract", label: "Contract Transfer", sub: "Via AuthX contract" },
                    { id: "raw",      label: "Direct Transfer",   sub: "Wallet → Wallet" },
                  ].map((m) => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className={`flex-1 py-3 px-3 rounded-xl border text-left transition ${
                        mode === m.id ? "border-primary bg-primary/10" : "border-stroke hover:border-slate-500"
                      }`}>
                      <p className={`text-sm font-semibold ${mode===m.id?"text-primary":"text-white"}`}>{m.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Balance */}
            <div className="px-4 py-4 rounded-xl bg-boxdark-2 border border-stroke">
              <p className="text-xs text-slate-500 mb-1">
                {mode === "contract" ? "Contract Balance" : "Wallet ETH Balance"}
              </p>
              <p className="text-2xl font-bold text-white">
                {parseFloat(availableBalance).toFixed(6)}{" "}
                <span className="text-lg text-blue-400">ETH</span>
              </p>
            </div>

            {/* Recipient with QR scan button */}
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Recipient Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0x... or scan QR below"
                  value={recipient}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  className={`input-dark font-mono pr-12 ${recipientError ? "border-red-500/50" : ""}`}
                />
                <button
                  onClick={() => setShowScanner(true)}
                  title="Scan QR code"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition text-lg"
                >
                  ▣
                </button>
              </div>
              {recipientError && <p className="text-xs text-red-400 mt-1">{recipientError}</p>}
              <button
                onClick={() => setShowScanner(true)}
                className="mt-2 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
              >
                ▣ Scan recipient QR code with camera
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Amount</label>
              <div className="relative">
                <input type="number" placeholder="0.00" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0" step="0.001"
                  className="input-dark pr-14 text-lg font-semibold" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">ETH</span>
              </div>
              {amount && parseFloat(amount) > parseFloat(availableBalance) && (
                <p className="text-xs text-red-400 mt-1">Amount exceeds your balance</p>
              )}
            </div>

            {/* Summary */}
            {isValid && (
              <div className="px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/20 text-xs text-slate-400 space-y-1 slide-in">
                <p className="text-green-400 font-semibold mb-2">Transfer Summary</p>
                <p>To: <span className="font-mono text-slate-300">{recipient.slice(0,10)}...{recipient.slice(-6)}</span></p>
                <p>Amount: <span className="text-white font-semibold">{amount} ETH</span></p>
                <p>Method: <span className="text-white">{mode === "contract" ? "AuthX Contract" : "Direct wallet transfer"}</span></p>
              </div>
            )}

            <button onClick={handleSend} disabled={loading || !isValid} className="btn-primary">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">◌</span> Processing...</span>
                : "Transfer ETH"}
            </button>
          </div>
        </div>
      )}

      {showScanner && <QRScanner onScan={handleScanned} onClose={() => setShowScanner(false)} />}
      {showMyQR && account && <QRModal address={account} onClose={() => setShowMyQR(false)} />}
    </div>
  );
}
