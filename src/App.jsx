import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Layout from "./components/Layout/Layout";
import TxToast from "./components/UI/TxToast";
import LiveFeed from "./components/UI/LiveFeed";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import Network from "./pages/Network";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="deposit" element={<Deposit />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="network" element={<Network />} />
          </Route>
        </Routes>
        <TxToast />
        <LiveFeed />
      </BrowserRouter>
    </Web3Provider>
  );
}
