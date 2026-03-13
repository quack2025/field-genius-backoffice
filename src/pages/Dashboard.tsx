import { useEffect, useState } from "react";
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

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!stats) return <p className="text-red-500">Error cargando stats</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value={7}>Ultimos 7 dias</option>
          <option value={14}>Ultimos 14 dias</option>
          <option value={30}>Ultimos 30 dias</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Sesiones" value={stats.sessions.total} />
        <StatCard label="Reportes" value={stats.reports.total} />
        <StatCard
          label="Confianza promedio"
          value={`${(stats.reports.avg_confidence * 100).toFixed(0)}%`}
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-brand-500 mt-1">{value}</p>
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
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">Sin datos</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([key, val]) => (
            <li
              key={key}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600">{key}</span>
              <span className="font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                {val}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
