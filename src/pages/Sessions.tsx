import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { listSessions, listImplementations } from "../lib/api";
import type { Session, Implementation } from "../lib/api";
import { STATUS_LABELS, STATUS_COLORS } from "../lib/constants";

const PAGE_SIZE = 25;

export function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [implFilter, setImplFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listSessions({
        impl: implFilter || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        phone: search.startsWith("+") ? search : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setSessions(res.data);
      // Extract pagination if available
      const pag = (res as unknown as Record<string, unknown>).pagination as { total?: number } | undefined;
      setTotal(pag?.total ?? res.data.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando sesiones");
    }
    setLoading(false);
  };

  useEffect(() => {
    listImplementations().then((r) => setImplementations(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(0);
  }, [implFilter, statusFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    load();
  }, [implFilter, statusFilter, dateFrom, dateTo, page]);

  // Client-side name search (server doesn't support name search)
  const filtered = search && !search.startsWith("+")
    ? sessions.filter((s) =>
        s.user_name.toLowerCase().includes(search.toLowerCase()) ||
        s.user_phone.includes(search)
      )
    : sessions;

  const totalPages = Math.ceil(total / PAGE_SIZE);

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

      {/* Search + Filters */}
      <div className="card p-4 mb-5 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o telefono..."
            className="input pl-9"
          />
        </div>
        {/* Filters row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Proyecto</label>
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
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={load} className="flex items-center gap-1 text-sm font-medium hover:underline">
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-pro">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Impl.</th>
                <th>Estado</th>
                <th className="text-center">Archivos</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
                  <td><div className="h-4 bg-gray-100 rounded animate-pulse w-32" /></td>
                  <td><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
                  <td><div className="h-5 bg-gray-100 rounded-full animate-pulse w-20" /></td>
                  <td><div className="h-4 bg-gray-100 rounded animate-pulse w-16 mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No hay sesiones con estos filtros.</p>
        </div>
      ) : (
        <>
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
                {filtered.map((s) => {
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
                          {STATUS_LABELS[s.status] || s.status}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{total} sesiones total</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
