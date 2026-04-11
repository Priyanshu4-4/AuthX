import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../context/Web3Context";
import logo from "../../assets/logo.png";
import {
  generateWallet,
  walletFromMnemonic,
  walletFromPrivateKey,
  encryptWallet,
  saveKeystoreToStorage,
  downloadKeystore,
  hasStoredWallet,
} from "../../utils/walletCrypto";

// ── Step indicator ────────────────────────────────────────────────
function Step({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
        ${done ? "bg-green-500 text-white" : active ? "bg-primary text-white" : "bg-boxdark-2 text-slate-600 border border-stroke"}`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-xs font-medium ${active ? "text-white" : "text-slate-600"}`}>{label}</span>
    </div>
  );
}

// ── Create wallet flow ────────────────────────────────────────────
function CreateFlow({ onDone }) {
  const [step, setStep]         = useState(1); // 1=generate, 2=backup, 3=password
  const [wallet, setWallet]     = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);

  function handleGenerate() {
    setWallet(generateWallet());
    setStep(2);
  }

  async function handleSave() {
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== password2) { setError("Passwords do not match"); return; }
    setError("");
    setSaving(true);
    try {
      const keystore = await encryptWallet(wallet, password);
      saveKeystoreToStorage(keystore);
      onDone(wallet);
    } catch (e) {
      setError("Encryption failed: " + e.message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center gap-4 mb-2">
        <Step n={1} label="Generate" active={step===1} done={step>1} />
        <div className="flex-1 h-px bg-stroke" />
        <Step n={2} label="Backup"   active={step===2} done={step>2} />
        <div className="flex-1 h-px bg-stroke" />
        <Step n={3} label="Secure"   active={step===3} done={false} />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4 fade-up">
          <div className="px-4 py-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-slate-400 space-y-1">
            <p>• A new wallet will be generated in your browser</p>
            <p>• Your private key never leaves your device</p>
            <p>• You will be shown a 12-word recovery phrase</p>
          </div>
          <button onClick={handleGenerate} className="btn-primary">Generate New Wallet</button>
        </div>
      )}

      {/* Step 2 — show mnemonic */}
      {step === 2 && wallet && (
        <div className="space-y-4 fade-up">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Your Recovery Phrase</p>
            <div className="grid grid-cols-3 gap-2">
              {wallet.mnemonic.split(" ").map((word, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-boxdark-2 border border-stroke">
                  <span className="text-xs text-slate-600 w-4">{i+1}.</span>
                  <span className="text-sm text-white font-mono">{word}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-400">
            ⚠ Write these words down offline. Anyone with this phrase controls your wallet.
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="backed" onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="backed" className="text-sm text-slate-400 cursor-pointer">I have saved my recovery phrase</label>
          </div>
          <div className="flex gap-3">
            <button onClick={() => downloadKeystore({ mnemonic: wallet.mnemonic, address: wallet.address })}
              className="flex-1 py-3 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition">
              ↓ Download Phrase
            </button>
            <button onClick={() => setStep(3)} disabled={!confirmed}
              className="flex-1 btn-primary disabled:opacity-40">
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — set password */}
      {step === 3 && (
        <div className="space-y-4 fade-up">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Set Wallet Password</p>
          <input type="password" placeholder="Password (min 8 chars)" value={password}
            onChange={(e) => setPassword(e.target.value)} className="input-dark" />
          <input type="password" placeholder="Confirm password" value={password2}
            onChange={(e) => setPassword2(e.target.value)} className="input-dark" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Encrypting..." : "Create Wallet"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Import flow ───────────────────────────────────────────────────
function ImportFlow({ onDone }) {
  const [mode, setMode]         = useState("mnemonic"); // mnemonic | privatekey
  const [input, setInput]       = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);

  async function handleImport() {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== password2) { setError("Passwords do not match"); return; }
    setSaving(true);
    try {
      const wallet = mode === "mnemonic"
        ? walletFromMnemonic(input)
        : walletFromPrivateKey(input);
      const keystore = await encryptWallet(wallet, password);
      saveKeystoreToStorage(keystore);
      onDone(wallet);
    } catch (e) {
      setError("Invalid " + (mode === "mnemonic" ? "recovery phrase" : "private key"));
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex gap-2">
        {["mnemonic","privatekey"].map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition
              ${mode===m ? "border-primary bg-primary/10 text-primary" : "border-stroke text-slate-400 hover:text-white"}`}>
            {m === "mnemonic" ? "Recovery Phrase" : "Private Key"}
          </button>
        ))}
      </div>

      {mode === "mnemonic" ? (
        <textarea rows={3} placeholder="Enter your 12 or 24 word recovery phrase..."
          value={input} onChange={(e) => setInput(e.target.value)}
          className="input-dark font-mono resize-none" />
      ) : (
        <input type="password" placeholder="0x..." value={input}
          onChange={(e) => setInput(e.target.value)} className="input-dark font-mono" />
      )}

      <input type="password" placeholder="Set a password to secure this wallet"
        value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark" />
      <input type="password" placeholder="Confirm password"
        value={password2} onChange={(e) => setPassword2(e.target.value)} className="input-dark" />

      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handleImport} disabled={saving || !input || !password}
        className="btn-primary disabled:opacity-40">
        {saving ? "Importing..." : "Import Wallet"}
      </button>
    </div>
  );
}

// ── Unlock existing wallet ────────────────────────────────────────
function UnlockFlow({ onUnlock, onForget }) {
  const { unlockCustomWallet, isConnecting } = useWeb3();
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  async function handleUnlock() {
    setError("");
    const result = await unlockCustomWallet(password);
    if (!result.success) setError(result.error || "Wrong password");
    else onUnlock();
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="px-4 py-3 rounded-xl bg-boxdark-2 border border-stroke text-xs text-slate-400">
        AuthX wallet found. Enter your password to unlock.
      </div>
      <input type="password" placeholder="Wallet password" value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        className="input-dark" autoFocus />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handleUnlock} disabled={isConnecting || !password} className="btn-primary disabled:opacity-40">
        {isConnecting ? "Unlocking..." : "Unlock Wallet"}
      </button>
      <button onClick={onForget} className="w-full text-xs text-slate-600 hover:text-red-400 transition py-1">
        Forget this wallet & start over
      </button>
    </div>
  );
}

// ── Main WalletSetup page ─────────────────────────────────────────
export default function WalletSetup() {
  const { hasWallet, connectMetaMask, isConnecting, loginWithWalletData, forgetWallet } = useWeb3();
  const [tab, setTab] = useState(() => hasStoredWallet() ? "unlock" : "create");
  const navigate = useNavigate();

  async function handleDone(walletData) {
    loginWithWalletData(walletData); // sets account immediately, RPC runs in background
    navigate("/");
  }

  async function handleMetaMask() {
    const result = await connectMetaMask();
    if (result?.success) navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#0D1521] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 fade-up">
          <img src={logo} alt="AuthX" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-white font-bold text-xl leading-none">AuthX</h1>
            <p className="text-xs text-slate-500">Web3 Wallet · Sepolia</p>
          </div>
        </div>

        <div className="card fade-up-1">
          {/* Tabs */}
          {!hasWallet ? (
            <div className="flex gap-1 mb-6 p-1 bg-boxdark-2 rounded-xl border border-stroke">
              {["create","import"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition
                    ${tab===t ? "bg-primary text-white" : "text-slate-500 hover:text-white"}`}>
                  {t === "create" ? "Create Wallet" : "Import Wallet"}
                </button>
              ))}
            </div>
          ) : tab !== "unlock" ? (
            <button onClick={() => setTab("unlock")} className="text-xs text-blue-400 hover:text-blue-300 mb-4 transition">
              ← Back to unlock
            </button>
          ) : null}

          {/* Flows */}
          {tab === "unlock" && hasWallet && (
            <UnlockFlow onUnlock={() => navigate("/")} onForget={() => { forgetWallet(); setTab("create"); }} />
          )}
          {tab === "create" && <CreateFlow onDone={handleDone} />}
          {tab === "import" && <ImportFlow onDone={handleDone} />}

          {/* Divider + MetaMask */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-stroke" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-stroke" />
          </div>

          <button onClick={handleMetaMask} disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-stroke text-slate-300 text-sm font-medium hover:bg-stroke hover:text-white transition disabled:opacity-50">
            <span className="text-lg">🦊</span>
            {isConnecting ? "Connecting..." : "Continue with MetaMask"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-700 mt-4">
          Keys encrypted in your browser · Never sent to any server
        </p>
      </div>
    </div>
  );
}
