import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, generateReport } from "../lib/api";
import type { Session, RawFile, SegmentationData } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  accumulating: "bg-blue-100 text-blue-800",
  segmenting: "bg-yellow-100 text-yellow-800",
  processing: "bg-orange-100 text-orange-800",
  generating_outputs: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  needs_clarification: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

/** Build lookup maps from segments data: filename → transcription / description */
function buildSegmentMaps(segments: SegmentationData | null) {
  const transcriptions: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  if (!segments?.sessions) return { transcriptions, descriptions };

  for (const visit of segments.sessions) {
    // The segmenter stores transcriptions/descriptions keyed by filename
    const v = visit as unknown as Record<string, unknown>;
    const t = v.transcriptions as Record<string, string> | undefined;
    const d = v.image_descriptions as Record<string, string> | undefined;
    if (t) Object.assign(transcriptions, t);
    if (d) Object.assign(descriptions, d);
  }
  return { transcriptions, descriptions };
}

function MediaCard({
  file,
  transcription,
  description,
}: {
  file: RawFile;
  transcription?: string;
  description?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const time = file.timestamp
    ? new Date(file.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "";

  if (file.type === "image" && file.public_url) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="relative">
          <img
            src={file.public_url}
            alt={file.filename || "foto"}
            className={`w-full object-cover cursor-pointer transition-all ${expanded ? "max-h-none" : "max-h-64"}`}
            onClick={() => setExpanded(!expanded)}
          />
        </div>
        {description && (
          <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium mb-0.5">Vision AI</p>
            <p className="text-xs text-indigo-600 leading-relaxed">{description}</p>
          </div>
        )}
        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="bg-blue-50 text-blue-700 px-1.5 rounded">imagen</span>
        </div>
      </div>
    );
  }

  if (file.type === "audio" && file.public_url) {
    return (
      <div className="bg-white rounded-lg shadow p-3">
        <audio controls className="w-full" preload="none">
          <source src={file.public_url} type={file.content_type || "audio/ogg"} />
        </audio>
        {transcription && (
          <div className="mt-2 px-2 py-1.5 bg-green-50 rounded border border-green-100">
            <p className="text-xs text-green-700 font-medium mb-0.5">Transcripcion</p>
            <p className="text-xs text-green-600 leading-relaxed">{transcription}</p>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="bg-green-50 text-green-700 px-1.5 rounded">audio</span>
        </div>
      </div>
    );
  }

  if (file.type === "video" && file.public_url) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <video controls className="w-full max-h-80" preload="none">
          <source src={file.public_url} type={file.content_type || "video/mp4"} />
        </video>
        {transcription && (
          <div className="px-3 py-2 bg-green-50 border-t border-green-100">
            <p className="text-xs text-green-700 font-medium mb-0.5">Transcripcion (audio del video)</p>
            <p className="text-xs text-green-600 leading-relaxed">{transcription}</p>
          </div>
        )}
        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="bg-purple-50 text-purple-700 px-1.5 rounded">video</span>
        </div>
      </div>
    );
  }

  if (file.type === "location") {
    return (
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📍</span>
          <span className="text-sm font-medium text-gray-700">
            {file.label || file.address || "Ubicacion compartida"}
          </span>
        </div>
        {file.latitude != null && file.longitude != null && (
          <a
            href={`https://www.google.com/maps?q=${file.latitude},${file.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-500 hover:underline"
          >
            {file.latitude.toFixed(6)}, {file.longitude.toFixed(6)} — Ver en mapa
          </a>
        )}
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="bg-amber-50 text-amber-700 px-1.5 rounded">ubicacion</span>
        </div>
      </div>
    );
  }

  if (file.type === "text" || file.type === "clarification_response") {
    return (
      <div className="bg-white rounded-lg shadow p-3">
        <p className="text-sm text-gray-700 italic">"{file.body}"</p>
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="bg-yellow-50 text-yellow-700 px-1.5 rounded">
            {file.type === "clarification_response" ? "respuesta" : "texto"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 text-sm text-gray-500">
      <span>{file.filename || file.type}</span>
      <span className="text-xs ml-2">{time}</span>
    </div>
  );
}

const REPORT_TYPES = [
  { id: "tactical", label: "Tactico", desc: "Agotados, precios, promos, shelf", gradient: "from-emerald-500 to-emerald-700", icon: "📊" },
  { id: "strategic", label: "Estrategico", desc: "Babson: shopper, propuesta, ecosistema", gradient: "from-brand-500 to-indigo-600", icon: "🎯" },
  { id: "innovation", label: "Innovacion", desc: "Gaps, tendencias, oportunidades", gradient: "from-purple-500 to-purple-700", icon: "💡" },
] as const;

/** Render a markdown report with collapsible sections */
function ReportView({ markdown, title, gradient }: { markdown: string; title: string; gradient: string }) {
  const sections = markdown.split(/^## /m).filter(Boolean);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-4 py-3`}>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-4 space-y-4 max-h-[700px] overflow-y-auto">
        {sections.map((section, i) => {
          const lines = section.split("\n");
          const sectionTitle = lines[0]?.trim();
          const body = lines.slice(1).join("\n").trim();
          return (
            <details key={i} open={i === 0 || i === sections.length - 1}>
              <summary className="font-medium text-sm text-gray-800 cursor-pointer hover:text-brand-500">
                {sectionTitle || `Seccion ${i + 1}`}
              </summary>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-gray-200">
                {body}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

// VisitReportCard removed — reports now generated on-demand from backoffice
void 0; // keep TS happy

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedReports, setGeneratedReports] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSession(id)
      .then((r) => setSession(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerate = async (reportType: string) => {
    if (!id || generating[reportType]) return;
    setGenerating((g) => ({ ...g, [reportType]: true }));
    try {
      const resp = await generateReport(id, reportType);
      if (reportType === "all" && resp.data.reports) {
        const newReports: Record<string, string> = {};
        for (const [type, result] of Object.entries(resp.data.reports)) {
          if (result.markdown) newReports[type] = result.markdown;
        }
        setGeneratedReports((prev) => ({ ...prev, ...newReports }));
      } else if (resp.data.markdown) {
        setGeneratedReports((prev) => ({ ...prev, [reportType]: resp.data.markdown! }));
      }
    } catch (e) {
      console.error("Report generation failed:", e);
    } finally {
      setGenerating((g) => ({ ...g, [reportType]: false }));
    }
  };

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!session) return <p className="text-red-500">Sesion no encontrada</p>;

  const files = (session.raw_files || []).sort(
    (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
  );
  const mediaFiles = files.filter((f) => f.type === "image" || f.type === "audio" || f.type === "video");
  const hasPreprocessed = files.some((f) => f.transcription || f.image_description);

  // Build transcription/description lookup — prefer raw_files first (pre-processed), then segments
  const transcriptions: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const f of files) {
    const fname = f.filename || "";
    if (f.transcription && fname) transcriptions[fname] = f.transcription;
    if (f.image_description && fname) descriptions[fname] = f.image_description;
  }
  // Also merge from segments if available
  const segMaps = buildSegmentMaps(session.segments);
  for (const [k, v] of Object.entries(segMaps.transcriptions)) {
    if (!transcriptions[k]) transcriptions[k] = v;
  }
  for (const [k, v] of Object.entries(segMaps.descriptions)) {
    if (!descriptions[k]) descriptions[k] = v;
  }

  const isGeneratingAny = Object.values(generating).some(Boolean);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/sessions")}
          className="text-brand-500 hover:text-brand-700 text-sm"
        >
          &larr; Sesiones
        </button>
        <h2 className="text-xl font-bold">
          {session.user_name} &mdash; {session.date}
        </h2>
        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[session.status] || "bg-gray-100"}`}>
          {session.status}
        </span>
      </div>

      {/* Info bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
        <div>
          <span className="text-gray-500 block text-xs">Ejecutivo</span>
          <span className="font-medium">{session.user_name}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Telefono</span>
          <span className="font-medium">{session.user_phone}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Rol</span>
          <span className="font-medium">{session.user_role || "--"}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Pais</span>
          <span className="font-medium">{session.country || "--"}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Archivos</span>
          <span className="font-medium">{files.length}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Pre-procesados</span>
          <span className={`font-medium ${hasPreprocessed ? "text-green-600" : "text-yellow-600"}`}>
            {hasPreprocessed ? "Si" : "Pendiente"}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Media</span>
          <span className="font-medium">{mediaFiles.length} fotos/audio/video</span>
        </div>
      </div>

      {/* Report Generation Panel */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-700">Generar Reportes</h3>
          <button
            onClick={() => handleGenerate("all")}
            disabled={isGeneratingAny || mediaFiles.length === 0}
            className="bg-brand-500 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating["all"] ? "Generando los 3..." : "Generar los 3"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.id}
              onClick={() => handleGenerate(rt.id)}
              disabled={generating[rt.id] || generating["all"] || mediaFiles.length === 0}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                generatedReports[rt.id]
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-brand-300 bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{rt.icon}</span>
                <span className="font-medium text-sm">{rt.label}</span>
                {generating[rt.id] && (
                  <span className="text-xs text-brand-500 animate-pulse">Generando...</span>
                )}
                {generatedReports[rt.id] && !generating[rt.id] && (
                  <span className="text-xs text-green-600">Listo</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{rt.desc}</p>
            </button>
          ))}
        </div>
        {mediaFiles.length === 0 && (
          <p className="text-xs text-yellow-600 mt-2">No hay archivos de media para analizar.</p>
        )}
      </div>

      {/* Generated Reports */}
      {Object.keys(generatedReports).length > 0 && (
        <div className="mb-6 space-y-4">
          {REPORT_TYPES.map((rt) => {
            const md = generatedReports[rt.id];
            if (!md) return null;
            return <ReportView key={rt.id} markdown={md} title={rt.label} gradient={rt.gradient} />;
          })}
        </div>
      )}

      {/* Media Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">
            Timeline de capturas ({files.length})
          </h3>
          {files.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin archivos en esta sesion.</p>
          ) : (
            <div className="space-y-3">
              {files.map((f, i) => {
                const fname = f.filename || f.storage_path?.split("/").pop() || "";
                return (
                  <MediaCard
                    key={i}
                    file={f}
                    transcription={f.transcription || transcriptions[fname]}
                    description={f.image_description || descriptions[fname]}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: session info */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-3">
            Informacion de sesion
          </h3>
          <div className="bg-white rounded-lg shadow p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-gray-600">{session.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Creada</span>
              <span>{new Date(session.created_at).toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Actualizada</span>
              <span>{new Date(session.updated_at).toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Imagenes</span>
              <span>{files.filter((f) => f.type === "image").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Audios</span>
              <span>{files.filter((f) => f.type === "audio").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Videos</span>
              <span>{files.filter((f) => f.type === "video").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Textos</span>
              <span>{files.filter((f) => f.type === "text").length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
