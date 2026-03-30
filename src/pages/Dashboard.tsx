import { useEffect, useState } from "react";
import { Activity, FileBarChart, TrendingUp } from "lucide-react";
import { getStats, type Stats } from "../lib/api";

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStats(undefined, days)
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  if (!stats)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        Error cargando estadisticas
      </div>
    );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Resumen de actividad del sistema</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={7}>Ultimos 7 dias</option>
          <option value={14}>Ultimos 14 dias</option>
          <option value={30}>Ultimos 30 dias</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Sesiones"
          value={stats.sessions.total}
          icon={Activity}
          color="blue"
        />
        <StatCard
          label="Reportes"
          value={stats.reports.total}
          icon={FileBarChart}
          color="emerald"
        />
        <StatCard
          label="Confianza promedio"
          value={`${(stats.reports.avg_confidence * 100).toFixed(0)}%`}
          icon={TrendingUp}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BreakdownCard
          title="Sesiones por estado"
          data={stats.sessions.by_status}
        />
        <BreakdownCard
          title="Sesiones por implementacion"
          data={stats.sessions.by_implementation}
        />
        <BreakdownCard
          title="Reportes por estado"
          data={stats.reports.by_status}
        />
      </div>
    </div>
  );
}

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
      <p className={`text-3xl font-display font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const max = entries.length > 0 ? entries[0][1] : 1;

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-gray-800 mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">Sin datos</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{key}</span>
                <span className="font-semibold text-gray-800">{val}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-400 rounded-full transition-all duration-500"
                  style={{ width: `${(val / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
