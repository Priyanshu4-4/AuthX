import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#0D1521]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        <Navbar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
