import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listSessions, listImplementations } from "../lib/api";
import type { Session, Implementation } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  accumulating: "bg-blue-100 text-blue-800",
  segmenting: "bg-yellow-100 text-yellow-800",
  processing: "bg-orange-100 text-orange-800",
  generating_outputs: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  needs_clarification: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

export function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [implFilter, setImplFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listSessions({
        impl: implFilter || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: 100,
      });
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    listImplementations().then((r) => setImplementations(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [implFilter, statusFilter, dateFrom, dateTo]);

  const mediaCounts = (files: Session["raw_files"]) => {
    const counts = { image: 0, audio: 0, video: 0, text: 0 };
    for (const f of files || []) {
      const t = f.type as keyof typeof counts;
      if (t in counts) counts[t]++;
    }
    return counts;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sesiones</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Implementacion</label>
          <select
            value={implFilter}
            onChange={(e) => setImplFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {implementations.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="accumulating">Acumulando</option>
            <option value="processing">Procesando</option>
            <option value="completed">Completado</option>
            <option value="needs_clarification">Necesita aclaracion</option>
            <option value="failed">Fallido</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay sesiones con estos filtros.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Impl.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Archivos</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const mc = mediaCounts(s.raw_files);
                return (
                  <tr
                    key={s.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/sessions/${s.id}`)}
                  >
                    <td className="px-4 py-3">{s.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.user_name}</div>
                      <div className="text-xs text-gray-400">{s.user_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{s.implementation}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-800"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center text-xs text-gray-500">
                        {mc.image > 0 && <span title="Fotos">{mc.image} img</span>}
                        {mc.audio > 0 && <span title="Audios">{mc.audio} aud</span>}
                        {mc.video > 0 && <span title="Videos">{mc.video} vid</span>}
                        {mc.text > 0 && <span title="Textos">{mc.text} txt</span>}
                        {mc.image + mc.audio + mc.video + mc.text === 0 && <span>--</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
