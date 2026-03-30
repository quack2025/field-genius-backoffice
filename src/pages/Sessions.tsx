import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { listSessions, listImplementations } from "../lib/api";
import type { Session, Implementation } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  accumulating: "bg-blue-50 text-blue-700",
  segmenting: "bg-yellow-50 text-yellow-700",
  processing: "bg-orange-50 text-orange-700",
  generating_outputs: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  needs_clarification: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
};

export function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare size={24} className="text-brand-500" />
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Sesiones</h2>
          <p className="text-sm text-gray-500">Capturas de campo por usuario y fecha</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Implementacion</label>
          <select value={implFilter} onChange={(e) => setImplFilter(e.target.value)} className="input w-auto">
            <option value="">Todas</option>
            {implementations.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Estado</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">Todos</option>
            <option value="accumulating">Acumulando</option>
            <option value="processing">Procesando</option>
            <option value="completed">Completado</option>
            <option value="needs_clarification">Necesita aclaracion</option>
            <option value="failed">Fallido</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Desde</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Hasta</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No hay sesiones con estos filtros.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-pro">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Impl.</th>
                <th>Pais</th>
                <th>Estado</th>
                <th className="text-center">Archivos</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const mc = mediaCounts(s.raw_files);
                return (
                  <tr
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/sessions/${s.id}`)}
                  >
                    <td className="font-medium text-gray-700">{s.date}</td>
                    <td>
                      <div className="font-medium text-gray-800">{s.user_name}</div>
                      <div className="text-xs text-gray-400">{s.user_phone}</div>
                    </td>
                    <td>
                      <span className="badge bg-gray-100 text-gray-600">{s.implementation}</span>
                    </td>
                    <td>
                      {s.country ? (
                        <span className="badge bg-gray-100 text-gray-600">{s.country}</span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-center">
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
