import { useWeb3 } from "../../context/Web3Context";

export default function LiveFeed() {
  const { liveNotifications, account } = useWeb3();

  if (!account) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-xs">
      {liveNotifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg
            backdrop-blur-md animate-slide-in
            ${n.color === "green"
              ? "bg-green-500/10 border-green-500/30 text-green-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
            }`}
          style={{ animation: "slideInLeft 0.3s ease forwards" }}
        >
          <span className="text-base mt-0.5">{n.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">
              Live · {n.type}
            </p>
            <p className="font-mono text-xs leading-relaxed">{n.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
