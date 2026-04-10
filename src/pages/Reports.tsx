import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileBarChart } from "lucide-react";
import {
  listImplementations,
  listUserGroups,
  generateGroupReport,
  generateProjectReport,
} from "../lib/api";
import type {
  Implementation,
  UserGroup,
  MultiLevelReportResponse,
} from "../lib/api";

const REPORT_FRAMEWORKS = [
  { id: "tactical", label: "Tactico", icon: "\u{1F4CA}", gradient: "from-emerald-500 to-emerald-700" },
  { id: "strategic", label: "Estrategico", icon: "\u{1F3AF}", gradient: "from-brand-500 to-indigo-600" },
  { id: "innovation", label: "Innovacion", icon: "\u{1F4A1}", gradient: "from-purple-500 to-purple-700" },
  { id: "competidor", label: "C1: Competidor", icon: "\u{1F50D}", gradient: "from-red-500 to-red-700" },
  { id: "cliente", label: "C2: Cliente", icon: "\u{1F464}", gradient: "from-blue-500 to-blue-700" },
  { id: "comunicacion", label: "C3: Comunicacion", icon: "\u{1F4E2}", gradient: "from-amber-500 to-amber-700" },
];

const TABS = [
  { id: "individual", label: "Individual" },
  { id: "grupo", label: "Grupo" },
  { id: "proyecto", label: "Proyecto" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ReportView({ markdown, title, gradient }: { markdown: string; title: string; gradient: string }) {
  const sections = markdown.split(/^## /m).filter(Boolean);

  return (
    <div className="card overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-5 py-3`}>
        <h3 className="text-white font-display font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto">
        {sections.map((section, i) => {
          const lines = section.split("\n");
          const sectionTitle = lines[0]?.trim();
          const body = lines.slice(1).join("\n").trim();
          return (
            <details key={i} open={i === 0 || i === sections.length - 1}>
              <summary className="font-medium text-sm text-gray-800 cursor-pointer hover:text-brand-500 transition-colors">
                {sectionTitle || `Seccion ${i + 1}`}
              </summary>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-brand-200">
                {body}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function ReportMeta({ data }: { data: MultiLevelReportResponse }) {
  return (
    <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      {data.sessions_analyzed != null && (
        <div>
          <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">Sesiones analizadas</span>
          <span className="font-semibold text-gray-800">{data.sessions_analyzed}</span>
        </div>
      )}
      {data.total_sessions != null && (
        <div>
          <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">Total sesiones</span>
          <span className="font-semibold text-gray-800">{data.total_sessions}</span>
        </div>
      )}
      {data.groups_analyzed != null && (
        <div>
          <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">Grupos analizados</span>
          <span className="font-semibold text-gray-800">{data.groups_analyzed}</span>
        </div>
      )}
      {data.group_name && (
        <div>
          <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">Grupo</span>
          <span className="font-semibold text-gray-800">{data.group_name}</span>
        </div>
      )}
      {data.framework && (
        <div>
          <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">Framework</span>
          <span className="font-semibold text-gray-800">{data.framework}</span>
        </div>
      )}
      <div>
        <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">Caracteres</span>
        <span className="font-semibold text-gray-800">{data.chars.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("grupo");
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [selectedImpl, setSelectedImpl] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<MultiLevelReportResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listImplementations()
      .then((r) => setImplementations(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedImpl) {
      setGroups([]);
      setSelectedGroup("");
      return;
    }
    setLoadingGroups(true);
    listUserGroups(selectedImpl)
      .then((r) => {
        setGroups(r.data);
        setSelectedGroup("");
      })
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, [selectedImpl]);

  useEffect(() => {
    setReportResult(null);
    setError("");
  }, [activeTab, selectedImpl, selectedGroup, selectedFramework]);

  const handleGenerate = async () => {
    if (!selectedFramework) {
      setError("Selecciona un framework de analisis.");
      return;
    }
    if (activeTab === "grupo" && !selectedGroup) {
      setError("Selecciona un grupo.");
      return;
    }
    if (activeTab === "proyecto" && !selectedImpl) {
      setError("Selecciona un proyecto.");
      return;
    }

    setGenerating(true);
    setError("");
    setReportResult(null);

    try {
      let resp;
      if (activeTab === "grupo") {
        resp = await generateGroupReport(
          selectedGroup,
          selectedFramework,
          dateFrom || undefined,
          dateTo || undefined
        );
      } else {
        resp = await generateProjectReport(
          selectedImpl,
          selectedFramework,
          dateFrom || undefined,
          dateTo || undefined
        );
      }
      setReportResult(resp.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const frameworkMeta = REPORT_FRAMEWORKS.find((f) => f.id === selectedFramework);
  const canGenerate =
    selectedFramework &&
    ((activeTab === "grupo" && selectedGroup) || (activeTab === "proyecto" && selectedImpl));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <FileBarChart size={24} className="text-brand-500" />
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Reportes Multi-Nivel</h2>
          <p className="text-sm text-gray-500">Genera reportes por grupo o proyecto completo</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-white text-brand-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Individual Tab */}
      {activeTab === "individual" && (
        <div className="card p-6">
          <p className="text-sm text-gray-600 mb-4">
            Los reportes individuales se generan desde la vista de detalle de cada sesion.
          </p>
          <button onClick={() => navigate("/sessions")} className="btn-primary">
            Ir a Sesiones
          </button>
        </div>
      )}

      {/* Grupo / Proyecto Tabs */}
      {(activeTab === "grupo" || activeTab === "proyecto") && (
        <>
          {/* Filters */}
          <div className="card p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Proyecto
                </label>
                <select
                  value={selectedImpl}
                  onChange={(e) => setSelectedImpl(e.target.value)}
                  className="input w-auto min-w-[200px]"
                >
                  <option value="">Seleccionar...</option>
                  {implementations.map((impl) => (
                    <option key={impl.id} value={impl.id}>{impl.name}</option>
                  ))}
                </select>
              </div>

              {activeTab === "grupo" && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Grupo
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    disabled={!selectedImpl || loadingGroups}
                    className="input w-auto min-w-[200px] disabled:opacity-50"
                  >
                    <option value="">
                      {loadingGroups
                        ? "Cargando..."
                        : !selectedImpl
                          ? "Selecciona proyecto"
                          : groups.length === 0
                            ? "Sin grupos"
                            : "Seleccionar..."}
                    </option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}{g.zone ? ` (${g.zone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

          {/* Framework Selection */}
          <div className="card p-4 mb-4">
            <h3 className="font-display font-semibold text-sm text-gray-800 mb-3">
              Framework de analisis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {REPORT_FRAMEWORKS.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedFramework === fw.id
                      ? "border-brand-500 bg-brand-50 shadow-sm"
                      : "border-gray-100 hover:border-brand-200 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{fw.icon}</span>
                    <span className="font-medium text-xs">{fw.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mb-6">
            <button
              onClick={handleGenerate}
              disabled={generating || !canGenerate}
              className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? "Generando reporte..."
                : activeTab === "grupo"
                  ? "Generar Reporte de Grupo"
                  : "Generar Reporte de Proyecto"}
            </button>
            {generating && (
              <span className="ml-3 text-sm text-gray-500 animate-pulse">
                Esto puede tomar unos minutos...
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Report Result */}
          {reportResult && (
            <div className="space-y-4">
              <ReportMeta data={reportResult} />
              {reportResult.markdown ? (
                <ReportView
                  markdown={reportResult.markdown}
                  title={
                    frameworkMeta
                      ? `${frameworkMeta.icon} ${frameworkMeta.label}`
                      : selectedFramework
                  }
                  gradient={frameworkMeta?.gradient || "from-brand-500 to-brand-700"}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-700">
                    No se genero contenido. Verifica que existan sesiones procesadas en el periodo seleccionado.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
