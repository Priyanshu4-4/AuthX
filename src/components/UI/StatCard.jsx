export default function StatCard({ label, value, sub, icon, color = "blue", delay = 0 }) {
  const colors = {
    blue: "text-blue-400 bg-blue-400/10",
    green: "text-green-400 bg-green-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    orange: "text-orange-400 bg-orange-400/10",
  };

  return (
    <div
      className="card fade-up flex items-start justify-between"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl text-xl ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
}
