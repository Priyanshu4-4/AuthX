import { useWeb3 } from "../../context/Web3Context";

export default function TxToast() {
  const { txStatus } = useWeb3();

  if (!txStatus) return null;

  const config = {
    pending: { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-300", msg: "⏳ Transaction pending on Sepolia..." },
    success: { bg: "bg-green-500/10 border-green-500/30", text: "text-green-300", msg: "✓ Transaction confirmed on blockchain!" },
    error:   { bg: "bg-red-500/10 border-red-500/30",     text: "text-red-300",   msg: "✗ Transaction failed. Please try again." },
  }[txStatus];

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border ${config.bg} ${config.text} text-sm font-medium slide-in shadow-lg`}>
      {config.msg}
    </div>
  );
}
