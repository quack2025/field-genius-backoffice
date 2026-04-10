import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, TrendingUp, FileSpreadsheet, Loader2 } from "lucide-react";
import { listImplementations, getCompliance, exportSheets } from "../lib/api";
import type { Implementation, ComplianceUser } from "../lib/api";
import { useToast } from "../hooks/useToast";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Users; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function Compliance() {
  const { toast } = useToast();
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [selectedImpl, setSelectedImpl] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [users, setUsers] = useState<ComplianceUser[]>([]);
  const [summary, setSummary] = useState<{ total: number; active: number; inactive: number; compliance_rate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    listImplementations()
      .then((r) => {
        const impls = r.data || [];
        setImplementations(impls);
        if (impls.length > 0) setSelectedImpl(impls[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedImpl) return;
    setLoading(true);
    getCompliance(selectedImpl, dateFrom || undefined, dateTo || undefined)
      .then((r) => {
        setUsers(r.data.users);
        setSummary(r.data.summary);
      })
      .catch((e) => toast({ type: "error", message: e instanceof Error ? e.message : "Error cargando compliance" }))
      .finally(() => setLoading(false));
  }, [selectedImpl, dateFrom, dateTo]);

  const handleExportSheets = async () => {
    if (!selectedImpl) return;
    setExporting(true);
    try {
      const resp = await exportSheets({
        implementation_id: selectedImpl,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        include_facts: true,
        include_compliance: true,
      });
      if (resp.data.spreadsheet_url) {
        window.open(resp.data.spreadsheet_url, "_blank");
        toast({ type: "success", message: `Exportado: ${resp.data.tabs_written.join(", ")}` });
      }
    } catch (e) {
      toast({ type: "error", message: "Error exportando: " + (e instanceof Error ? e.message : "desconocido") });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold text-gray-900">Compliance de Equipos</h2>
        <button
          onClick={handleExportSheets}
          disabled={exporting || !selectedImpl}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
          Exportar a Google Sheets
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Proyecto</label>
          <select
            value={selectedImpl}
            onChange={(e) => setSelectedImpl(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[200px]"
          >
            {implementations.map((impl) => (
              <option key={impl.id} value={impl.id}>{impl.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total usuarios" value={summary.total} icon={Users} color="bg-brand-500" />
          <StatCard label="Activos" value={summary.active} icon={UserCheck} color="bg-emerald-500" />
          <StatCard label="Sin actividad" value={summary.inactive} icon={UserX} color="bg-red-500" />
          <StatCard label="Tasa de compliance" value={`${summary.compliance_rate}%`} icon={TrendingUp} color="bg-purple-500" />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">
          No hay datos de usuarios para este proyecto.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ejecutivo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefono</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Sesiones</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Completadas</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Archivos</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Dias Activos</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ultima Sesion</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.Ejecutivo}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.Telefono}</td>
                    <td className="px-4 py-3 text-center">{u.Sesiones}</td>
                    <td className="px-4 py-3 text-center">{u.Completadas}</td>
                    <td className="px-4 py-3 text-center">{u.Archivos}</td>
                    <td className="px-4 py-3 text-center">{u["Dias Activos"]}</td>
                    <td className="px-4 py-3 text-gray-500">{u["Ultima Sesion"] || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${u.Estado === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {u.Estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
