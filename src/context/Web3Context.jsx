import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import BankABI from "../contracts/BankABI.json";
import { CONTRACT_ADDRESS, CHAIN_ID } from "../contracts/contractConfig";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [walletEthBalance, setWalletEthBalance] = useState("0");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [networkWallets, setNetworkWallets] = useState([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const listenerRef = useRef(null);
  const notifIdRef = useRef(0);

  function getContract(signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, BankABI, signer);
  }

  async function getSigner() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }

  function pushNotification(notif) {
    const id = ++notifIdRef.current;
    setLiveNotifications((prev) => [{ ...notif, id }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setLiveNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }

  function startListeners(contract) {
    if (listenerRef.current) {
      listenerRef.current.removeAllListeners("Deposit");
      listenerRef.current.removeAllListeners("Transfer");
    }
    listenerRef.current = contract;

    contract.on("Deposit", (user, amount) => {
      const eth = parseFloat(ethers.formatEther(amount)).toFixed(4);
      pushNotification({
        type: "Deposit",
        msg: `${user.slice(0, 8)}... deposited ${eth} ETH`,
        color: "green",
        icon: "↓",
      });
      getSigner().then((s) => {
        fetchBalance(s);
        fetchTransactions(s);
        discoverNetworkWallets();
      });
    });

    contract.on("Transfer", (from, to, amount) => {
      const eth = parseFloat(ethers.formatEther(amount)).toFixed(4);
      pushNotification({
        type: "Transfer",
        msg: `${from.slice(0, 8)}... sent ${eth} ETH to ${to.slice(0, 8)}...`,
        color: "blue",
        icon: "⇄",
      });
      getSigner().then((s) => {
        fetchBalance(s);
        fetchTransactions(s);
        discoverNetworkWallets();
      });
    });
  }

  const fetchBalance = useCallback(async (signer) => {
    try {
      const contract = getContract(signer);
      const result = await contract.getBalance();
      setBalance(ethers.formatEther(result));
      const provider = new ethers.BrowserProvider(window.ethereum);
      const addr = await signer.getAddress();
      const ethBal = await provider.getBalance(addr);
      setWalletEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));
    } catch (e) {
      console.error("fetchBalance error:", e);
    }
  }, []);

  const fetchTransactions = useCallback(async (signer) => {
    try {
      const contract = getContract(signer);
      const depositEvents = await contract.queryFilter("Deposit");
      const transferEvents = await contract.queryFilter("Transfer");
      const deposits = depositEvents.map((e) => ({
        type: "Deposit",
        amount: ethers.formatEther(e.args.amount),
        user: e.args.user,
        hash: e.transactionHash,
        block: e.blockNumber,
      }));
      const transfers = transferEvents.map((e) => ({
        type: "Transfer",
        amount: ethers.formatEther(e.args.amount),
        from: e.args.from,
        to: e.args.to,
        hash: e.transactionHash,
        block: e.blockNumber,
      }));
      const all = [...deposits, ...transfers].sort((a, b) => b.block - a.block);
      setTransactions(all);
    } catch (e) {
      console.error("fetchTransactions error:", e);
    }
  }, []);

  const discoverNetworkWallets = useCallback(async () => {
    try {
      setIsLoadingWallets(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BankABI, provider);
      const depositEvents = await contract.queryFilter("Deposit");
      const transferEvents = await contract.queryFilter("Transfer");

      const addressSet = new Set();
      depositEvents.forEach((e) => addressSet.add(e.args.user.toLowerCase()));
      transferEvents.forEach((e) => {
        addressSet.add(e.args.from.toLowerCase());
        addressSet.add(e.args.to.toLowerCase());
      });

      const walletList = await Promise.all(
        [...addressSet].map(async (addr) => {
          try {
            const bal = await contract.balances(addr);
            const depositCount = depositEvents.filter(
              (e) => e.args.user.toLowerCase() === addr
            ).length;
            const transferCount = transferEvents.filter(
              (e) =>
                e.args.from.toLowerCase() === addr ||
                e.args.to.toLowerCase() === addr
            ).length;
            const blockNums = [
              ...depositEvents
                .filter((e) => e.args.user.toLowerCase() === addr)
                .map((e) => e.blockNumber),
              ...transferEvents
                .filter(
                  (e) =>
                    e.args.from.toLowerCase() === addr ||
                    e.args.to.toLowerCase() === addr
                )
                .map((e) => e.blockNumber),
            ];
            return {
              address: addr,
              balance: parseFloat(ethers.formatEther(bal)).toFixed(6),
              depositCount,
              transferCount,
              lastSeen: blockNums.length ? Math.max(...blockNums) : 0,
            };
          } catch {
            return null;
          }
        })
      );

      setNetworkWallets(
        walletList.filter(Boolean).sort((a, b) => b.lastSeen - a.lastSeen)
      );
    } catch (e) {
      console.error("discoverNetworkWallets error:", e);
    } finally {
      setIsLoadingWallets(false);
    }
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }
    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });
      } catch (e) {
        console.warn("Network switch failed:", e);
      }
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      await fetchBalance(signer);
      await fetchTransactions(signer);
      await discoverNetworkWallets();
      const contract = getContract(signer);
      startListeners(contract);
    } catch (e) {
      console.error("connectWallet error:", e);
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnectWallet() {
    if (listenerRef.current) {
      listenerRef.current.removeAllListeners();
      listenerRef.current = null;
    }
    setAccount(null);
    setBalance("0");
    setWalletEthBalance("0");
    setTransactions([]);
    setNetworkWallets([]);
  }

  async function deposit(amount) {
    try {
      setLoading(true);
      setTxStatus("pending");
      const signer = await getSigner();
      const contract = getContract(signer);
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      await fetchBalance(signer);
      await fetchTransactions(signer);
      await discoverNetworkWallets();
      setTxStatus("success");
      setTimeout(() => setTxStatus(null), 4000);
    } catch (e) {
      console.error(e);
      setTxStatus("error");
      setTimeout(() => setTxStatus(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  async function transfer(recipient, amount) {
    try {
      setLoading(true);
      setTxStatus("pending");
      const signer = await getSigner();
      const contract = getContract(signer);
      const tx = await contract.transfer(recipient, ethers.parseEther(amount));
      await tx.wait();
      await fetchBalance(signer);
      await fetchTransactions(signer);
      await discoverNetworkWallets();
      setTxStatus("success");
      setTimeout(() => setTxStatus(null), 4000);
    } catch (e) {
      console.error(e);
      setTxStatus("error");
      setTimeout(() => setTxStatus(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    if (!account) return;
    const signer = await getSigner();
    await fetchBalance(signer);
    await fetchTransactions(signer);
    await discoverNetworkWallets();
  }

  useEffect(() => {
    return () => {
      if (listenerRef.current) listenerRef.current.removeAllListeners();
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        walletEthBalance,
        transactions,
        loading,
        txStatus,
        isConnecting,
        liveNotifications,
        networkWallets,
        isLoadingWallets,
        connectWallet,
        disconnectWallet,
        deposit,
        transfer,
        refreshData,
        discoverNetworkWallets,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
