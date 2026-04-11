import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import Layout from "./components/Layout/Layout";
import { TxToast, LiveFeed, AutoReconnectScreen } from "./components/UI";

import Dashboard      from "./pages/Dashboard";
import Deposit        from "./pages/Deposit";
import Transfer       from "./pages/Transfer";
import Transactions   from "./pages/Transactions";
import Network        from "./pages/Network";
import WalletSetup    from "./pages/Wallet";
import WalletSettings from "./pages/Wallet/Settings";

function AppRoutes() {
  const { isAutoReconnecting } = useWeb3();
  if (isAutoReconnecting) return <AutoReconnectScreen />;

  return (
    <Routes>
      <Route path="/wallet" element={<WalletSetup />} />
      <Route path="/" element={<Layout />}>
        <Route index                  element={<Dashboard />} />
        <Route path="deposit"         element={<Deposit />} />
        <Route path="transfer"        element={<Transfer />} />
        <Route path="transactions"    element={<Transactions />} />
        <Route path="network"         element={<Network />} />
        <Route path="wallet/settings" element={<WalletSettings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <AppRoutes />
        <TxToast />
        <LiveFeed />
      </BrowserRouter>
    </Web3Provider>
  );
}
