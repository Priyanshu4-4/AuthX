import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import BankABI from "../contracts/BankABI.json";
import { CONTRACT_ADDRESS, CHAIN_ID, SEPOLIA_RPC_FALLBACKS, CONTRACT_FROM_BLOCK } from "../contracts/contractConfig";
import {
  loadKeystoreFromStorage,
  decryptWallet,
  hasStoredWallet,
  deleteKeystoreFromStorage,
} from "../utils/walletCrypto";

const Web3Context = createContext(null);

export const WALLET_TYPE = {
  NONE:     "none",
  CUSTOM:   "custom",
  METAMASK: "metamask",
};

const SESSION_KEY_TYPE    = "authx_session_type";
const SESSION_KEY_ACCOUNT = "authx_session_account";

// ── Provider helpers ─────────────────────────────────────────────────────────
let _cachedProvider = null;

async function getWorkingProvider() {
  if (_cachedProvider) {
    try {
      await _cachedProvider.getBlockNumber();
      return _cachedProvider;
    } catch {
      _cachedProvider = null;
    }
  }
  for (const rpc of SEPOLIA_RPC_FALLBACKS) {
    try {
      const p = new ethers.JsonRpcProvider(rpc);
      await p.getBlockNumber();
      _cachedProvider = p;
      return p;
    } catch {
      continue;
    }
  }
  throw new Error("All Sepolia RPC endpoints failed.");
}

// ── OPTIMIZATION 1: Parallel chunk fetching with concurrency cap ─────────────
// Old: sequential while-loop (one chunk awaited at a time)
// New: all chunks fired in parallel batches — same number of requests, fraction of the time
const CHUNK_SIZE  = 50_000;
const CONCURRENCY = 5; // max simultaneous RPC calls per event type

async function queryFilterParallel(contract, eventName, fromBlock, toBlock) {
  const chunks = [];
  for (let from = fromBlock; from <= toBlock; from += CHUNK_SIZE) {
    chunks.push([from, Math.min(from + CHUNK_SIZE - 1, toBlock)]);
  }

  const results = [];
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(([from, to]) =>
        contract.queryFilter(eventName, from, to).catch(e => {
          console.warn(`queryFilter failed ${eventName} ${from}-${to}:`, e.message);
          return [];
        })
      )
    );
    results.push(...batchResults.flat());
  }
  return results;
}

// ── OPTIMIZATION 2: Shared incremental event cache ──────────────────────────
// Old: fetchTransactions and discoverNetworkWallets each fetched ALL events
//      independently — always from block 7.6M — and were always called together.
//      That's 4 full sequential RPC call chains on every single update.
// New: one shared cache keyed by latestBlock. Subsequent calls only fetch the
//      delta (new blocks since last fetch). First load is the same work; every
//      update after that is a tiny slice.
let _eventCache = {
  latestBlock: 0,
  deposits:    [],
  transfers:   [],
};

async function fetchAllEventsCached(contract, provider) {
  const latestBlock = await provider.getBlockNumber();

  if (_eventCache.latestBlock > 0 && _eventCache.latestBlock >= latestBlock) {
    return _eventCache; // nothing new on-chain
  }

  const fromBlock = _eventCache.latestBlock > 0
    ? _eventCache.latestBlock + 1
    : CONTRACT_FROM_BLOCK;

  const [newDeposits, newTransfers] = await Promise.all([
    queryFilterParallel(contract, "Deposit(address,uint256)",          fromBlock, latestBlock),
    queryFilterParallel(contract, "Transfer(address,address,uint256)", fromBlock, latestBlock),
  ]);

  _eventCache = {
    latestBlock,
    deposits:  [..._eventCache.deposits,  ...newDeposits],
    transfers: [..._eventCache.transfers, ...newTransfers],
  };

  return _eventCache;
}

function invalidateEventCache() {
  _eventCache = { latestBlock: 0, deposits: [], transfers: [] };
}

// ── Context ──────────────────────────────────────────────────────────────────
export function Web3Provider({ children }) {
  const [walletType, setWalletType]             = useState(WALLET_TYPE.NONE);
  const [account, setAccount]                   = useState(null);
  const [balance, setBalance]                   = useState("0");
  const [walletEthBalance, setWalletEthBalance] = useState("0");
  const [transactions, setTransactions]         = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [txStatus, setTxStatus]                 = useState(null);
  const [isConnecting, setIsConnecting]         = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [networkWallets, setNetworkWallets]     = useState([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingTx, setIsLoadingTx]           = useState(false);
  const [txFetchError, setTxFetchError]         = useState(null);
  const [hasWallet, setHasWallet]               = useState(hasStoredWallet);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(true);

  const signerRef   = useRef(null);
  const listenerRef = useRef(null);
  const notifIdRef  = useRef(0);

  // ── Notifications ──────────────────────────────────────────────────────────
  function pushNotification(notif) {
    const id = ++notifIdRef.current;
    setLiveNotifications(p => [{ ...notif, id }, ...p.slice(0, 4)]);
    setTimeout(() => setLiveNotifications(p => p.filter(n => n.id !== id)), 6000);
  }

  function setStatus(s) {
    setTxStatus(s);
    if (s !== "pending") setTimeout(() => setTxStatus(null), 4000);
  }

  // ── Signer ─────────────────────────────────────────────────────────────────
  async function getSigner() {
    if (signerRef.current) return signerRef.current;
    if (walletType === WALLET_TYPE.METAMASK && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return await provider.getSigner();
    }
    throw new Error("No signer. Please unlock your wallet.");
  }

  function getContract(signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, BankABI, signer);
  }

  async function getReadContract() {
    const provider = await getWorkingProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, BankABI, provider);
  }

  // ── Balance ────────────────────────────────────────────────────────────────
  async function refreshBalancesForAddress(addr) {
    try {
      const provider = await getWorkingProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BankABI, provider);
      const [contractBal, ethBal] = await Promise.all([
        contract.balances(addr),
        provider.getBalance(addr),
      ]);
      setBalance(ethers.formatEther(contractBal));
      setWalletEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));
    } catch (e) {
      console.error("refreshBalancesForAddress:", e);
    }
  }

  const refreshBalances = useCallback(async () => {
    if (!account) return;
    await refreshBalancesForAddress(account);
  }, [account]);

  useEffect(() => {
    if (account) refreshBalances();
  }, [account, refreshBalances]);

  // ── OPTIMIZATION 3: One fetch, two outputs (transactions + wallets) ─────────
  // OPTIMIZATION 4: O(n) wallet stats via Maps instead of O(addr × events) filtering
  //
  // Old: fetchTransactions filtered events → tx list
  //      discoverNetworkWallets re-fetched same events → for each address, .filter()
  //      over the full array for depositCount, transferCount, lastSeen → very slow
  // New: single fetch, build address Maps in one pass, O(1) lookup per wallet
  const fetchAllData = useCallback(async ({ invalidate = false } = {}) => {
    try {
      setIsLoadingTx(true);
      setIsLoadingWallets(true);
      setTxFetchError(null);

      if (invalidate) invalidateEventCache();

      const provider = await getWorkingProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BankABI, provider);
      const { deposits: depositEvents, transfers: transferEvents } =
        await fetchAllEventsCached(contract, provider);

      // Transactions list
      const deposits  = depositEvents.map(e => ({
        type:   "Deposit",
        amount: ethers.formatEther(e.args.amount),
        user:   e.args.user,
        hash:   e.transactionHash,
        block:  e.blockNumber,
      }));
      const transfers = transferEvents.map(e => ({
        type:   "Transfer",
        amount: ethers.formatEther(e.args.amount),
        from:   e.args.from,
        to:     e.args.to,
        hash:   e.transactionHash,
        block:  e.blockNumber,
      }));
      setTransactions([...deposits, ...transfers].sort((a, b) => b.block - a.block));
      setIsLoadingTx(false);

      // Build per-address Maps in O(events) — one pass each
      const depositsByAddr  = new Map();
      const transfersByAddr = new Map();

      depositEvents.forEach(e => {
        const addr = e.args?.user?.toLowerCase();
        if (!addr) return;
        if (!depositsByAddr.has(addr)) depositsByAddr.set(addr, []);
        depositsByAddr.get(addr).push(e);
      });

      transferEvents.forEach(e => {
        const from = e.args?.from?.toLowerCase();
        const to   = e.args?.to?.toLowerCase();
        for (const addr of [from, to]) {
          if (!addr) continue;
          if (!transfersByAddr.has(addr)) transfersByAddr.set(addr, []);
          transfersByAddr.get(addr).push(e);
        }
      });

      const addressSet = new Set([...depositsByAddr.keys(), ...transfersByAddr.keys()]);
      if (addressSet.size === 0) { setNetworkWallets([]); return; }

      // OPTIMIZATION 5: Rate-limited balance fetches
      // Old: Promise.all over all addresses at once — can overwhelm the RPC
      // New: batches of BAL_CONCURRENCY
      const BAL_CONCURRENCY = 10;
      const addresses  = [...addressSet];
      const walletList = [];

      for (let i = 0; i < addresses.length; i += BAL_CONCURRENCY) {
        const batch = addresses.slice(i, i + BAL_CONCURRENCY);
        const results = await Promise.all(
          batch.map(async addr => {
            const myDeposits  = depositsByAddr.get(addr)  || [];
            const myTransfers = transfersByAddr.get(addr) || [];
            const blockNums   = [...myDeposits, ...myTransfers].map(e => e.blockNumber);

            let balStr = "0.000000";
            try {
              const bal = await contract.balances(addr);
              balStr = parseFloat(ethers.formatEther(bal)).toFixed(6);
            } catch { /* leave as 0 */ }

            return {
              address:       addr,
              balance:       balStr,
              depositCount:  myDeposits.length,
              transferCount: myTransfers.length,
              lastSeen:      blockNums.length ? Math.max(...blockNums) : 0,
            };
          })
        );
        walletList.push(...results);
      }

      setNetworkWallets(walletList.sort((a, b) => b.lastSeen - a.lastSeen));
    } catch (e) {
      console.error("fetchAllData:", e);
      setTxFetchError("Failed to load data. Check your connection and try refreshing.");
    } finally {
      setIsLoadingTx(false);
      setIsLoadingWallets(false);
    }
  }, []);

  // Preserve original API surface so pages that call these directly still work
  const fetchTransactions      = useCallback(() => fetchAllData(), [fetchAllData]);
  const discoverNetworkWallets = useCallback(() => fetchAllData(), [fetchAllData]);

  // ── Listeners ──────────────────────────────────────────────────────────────
  async function startListeners() {
    try {
      const contract = await getReadContract();
      if (listenerRef.current) listenerRef.current.removeAllListeners?.();
      listenerRef.current = contract;
      contract.on("Deposit",  (user, amount) => {
        pushNotification({ type:"Deposit",  msg:`${user.slice(0,8)}... deposited ${parseFloat(ethers.formatEther(amount)).toFixed(4)} ETH`, color:"green", icon:"↓" });
        refreshBalances();
        fetchAllData({ invalidate: true });
      });
      contract.on("Transfer", (from, to, amount) => {
        pushNotification({ type:"Transfer", msg:`${from.slice(0,8)}... sent ${parseFloat(ethers.formatEther(amount)).toFixed(4)} ETH to ${to.slice(0,8)}...`, color:"blue", icon:"⇄" });
        refreshBalances();
        fetchAllData({ invalidate: true });
      });
    } catch (e) { console.error("startListeners:", e); }
  }

  // ── Session persistence ────────────────────────────────────────────────────
  function saveSession(type, address) {
    sessionStorage.setItem(SESSION_KEY_TYPE,    type);
    sessionStorage.setItem(SESSION_KEY_ACCOUNT, address);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY_TYPE);
    sessionStorage.removeItem(SESSION_KEY_ACCOUNT);
  }

  useEffect(() => {
    async function tryAutoReconnect() {
      const savedType    = sessionStorage.getItem(SESSION_KEY_TYPE);
      const savedAccount = sessionStorage.getItem(SESSION_KEY_ACCOUNT);
      if (!savedType || !savedAccount) { setIsAutoReconnecting(false); return; }

      try {
        if (savedType === WALLET_TYPE.METAMASK && window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer   = await provider.getSigner();
            signerRef.current = signer;
            setAccount(accounts[0]);
            setWalletType(WALLET_TYPE.METAMASK);
            refreshBalancesForAddress(accounts[0]);
            fetchAllData();
            startListeners();
          } else {
            clearSession();
          }
        } else if (savedType === WALLET_TYPE.CUSTOM && hasStoredWallet()) {
          setHasWallet(true);
        }
      } catch (e) {
        console.error("Auto-reconnect failed:", e);
        clearSession();
      } finally {
        setIsAutoReconnecting(false);
      }
    }

    tryAutoReconnect();
  }, []);

  // ── Connect MetaMask ───────────────────────────────────────────────────────
  async function connectMetaMask() {
    if (!window.ethereum) { alert("MetaMask is not installed."); return { success: false }; }
    try {
      setIsConnecting(true);
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}`, chainName: "Sepolia Testnet", nativeCurrency: { name:"ETH", symbol:"ETH", decimals:18 }, rpcUrls:["https://rpc.sepolia.org"], blockExplorerUrls:["https://sepolia.etherscan.io"] }],
          });
        }
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer  = await provider.getSigner();
      const address = await signer.getAddress();
      signerRef.current = signer;
      setAccount(address);
      setWalletType(WALLET_TYPE.METAMASK);
      saveSession(WALLET_TYPE.METAMASK, address);
      refreshBalancesForAddress(address);
      fetchAllData();
      startListeners();
      return { success: true };
    } catch (e) {
      console.error("connectMetaMask:", e);
      return { success: false, error: e.message };
    } finally {
      setIsConnecting(false);
    }
  }

  // ── Unlock custom wallet ───────────────────────────────────────────────────
  async function unlockCustomWallet(password) {
    try {
      setIsConnecting(true);
      const keystore   = loadKeystoreFromStorage();
      if (!keystore) throw new Error("No wallet found in storage");
      const walletData = await decryptWallet(keystore, password);
      const provider   = await getWorkingProvider();
      const wallet     = new ethers.Wallet(walletData.privateKey, provider);
      signerRef.current = wallet;
      setAccount(wallet.address);
      setWalletType(WALLET_TYPE.CUSTOM);
      saveSession(WALLET_TYPE.CUSTOM, wallet.address);
      refreshBalancesForAddress(wallet.address);
      fetchAllData();
      startListeners();
      return { success: true };
    } catch (e) {
      console.error("unlockCustomWallet:", e);
      return { success: false, error: e.message.includes("operation failed") ? "Wrong password" : e.message };
    } finally {
      setIsConnecting(false);
    }
  }

  // ── Login after create/import ──────────────────────────────────────────────
  async function loginWithWalletData(walletData) {
    const provider = await getWorkingProvider();
    const wallet   = new ethers.Wallet(walletData.privateKey, provider);
    signerRef.current = wallet;
    setAccount(wallet.address);
    setWalletType(WALLET_TYPE.CUSTOM);
    setHasWallet(true);
    saveSession(WALLET_TYPE.CUSTOM, wallet.address);
    refreshBalancesForAddress(wallet.address);
    fetchAllData();
    startListeners();
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────
  function disconnect() {
    signerRef.current = null;
    if (listenerRef.current) { listenerRef.current.removeAllListeners?.(); listenerRef.current = null; }
    clearSession();
    setAccount(null);
    setWalletType(WALLET_TYPE.NONE);
    setBalance("0");
    setWalletEthBalance("0");
    setTransactions([]);
    setNetworkWallets([]);
  }

  function forgetWallet() {
    disconnect();
    deleteKeystoreFromStorage();
    setHasWallet(false);
  }

  // ── Transactions ───────────────────────────────────────────────────────────
  async function deposit(amount) {
    try {
      setLoading(true); setStatus("pending");
      const signer = await getSigner();
      const tx = await getContract(signer).deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      await refreshBalances();
      await fetchAllData({ invalidate: true });
      setStatus("success");
    } catch (e) { console.error("deposit:", e); setStatus("error"); }
    finally { setLoading(false); }
  }

  async function transfer(recipient, amount) {
    try {
      setLoading(true); setStatus("pending");
      const signer = await getSigner();
      const tx = await getContract(signer).transfer(recipient, ethers.parseEther(amount));
      await tx.wait();
      await refreshBalances();
      await fetchAllData({ invalidate: true });
      setStatus("success");
    } catch (e) { console.error("transfer:", e); setStatus("error"); }
    finally { setLoading(false); }
  }

  async function sendRawEth(toAddress, amount) {
    try {
      setLoading(true); setStatus("pending");
      const signer = await getSigner();
      const tx = await signer.sendTransaction({ to: toAddress, value: ethers.parseEther(amount) });
      await tx.wait();
      await refreshBalances();
      setStatus("success");
      return { success: true, hash: tx.hash };
    } catch (e) { console.error("sendRawEth:", e); setStatus("error"); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }

  async function refreshData() {
    await refreshBalances();
    await fetchAllData({ invalidate: true });
  }

  useEffect(() => {
    return () => { if (listenerRef.current) listenerRef.current.removeAllListeners?.(); };
  }, []);

  return (
    <Web3Context.Provider value={{
      walletType, account, balance, walletEthBalance,
      transactions, loading, txStatus, isConnecting,
      liveNotifications, networkWallets, isLoadingWallets,
      isLoadingTx, txFetchError,
      hasWallet, isAutoReconnecting,
      unlockCustomWallet, connectMetaMask, loginWithWalletData,
      disconnect, forgetWallet,
      deposit, transfer, sendRawEth,
      refreshData, discoverNetworkWallets, fetchTransactions,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() { return useContext(Web3Context); }
