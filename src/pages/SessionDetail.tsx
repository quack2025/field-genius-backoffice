import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getSession, generateReport } from "../lib/api";
import type { Session, RawFile, SegmentationData } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  accumulating: "bg-blue-50 text-blue-700",
  segmenting: "bg-yellow-50 text-yellow-700",
  processing: "bg-orange-50 text-orange-700",
  generating_outputs: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  needs_clarification: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
};

function buildSegmentMaps(segments: SegmentationData | null) {
  const transcriptions: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  if (!segments?.sessions) return { transcriptions, descriptions };

  for (const visit of segments.sessions) {
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
      <div className="card overflow-hidden">
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
            <p className="text-xs text-indigo-700 font-semibold mb-0.5">Vision AI</p>
            <p className="text-xs text-indigo-600 leading-relaxed">{description}</p>
          </div>
        )}
        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="badge bg-blue-50 text-blue-700">imagen</span>
        </div>
      </div>
    );
  }

  if (file.type === "audio" && file.public_url) {
    return (
      <div className="card p-3">
        <audio controls className="w-full" preload="none">
          <source src={file.public_url} type={file.content_type || "audio/ogg"} />
        </audio>
        {transcription && (
          <div className="mt-2 px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold mb-0.5">Transcripcion</p>
            <p className="text-xs text-emerald-600 leading-relaxed">{transcription}</p>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="badge bg-emerald-50 text-emerald-700">audio</span>
        </div>
      </div>
    );
  }

  if (file.type === "video" && file.public_url) {
    return (
      <div className="card overflow-hidden">
        <video controls className="w-full max-h-80" preload="none">
          <source src={file.public_url} type={file.content_type || "video/mp4"} />
        </video>
        {transcription && (
          <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold mb-0.5">Transcripcion (audio del video)</p>
            <p className="text-xs text-emerald-600 leading-relaxed">{transcription}</p>
          </div>
        )}
        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="badge bg-purple-50 text-purple-700">video</span>
        </div>
      </div>
    );
  }

  if (file.type === "location") {
    return (
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-base">📍</span>
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
          <span className="badge bg-amber-50 text-amber-700">ubicacion</span>
        </div>
      </div>
    );
  }

  if (file.type === "text" || file.type === "clarification_response") {
    return (
      <div className="card p-3">
        <p className="text-sm text-gray-700 italic leading-relaxed">"{file.body}"</p>
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="badge bg-yellow-50 text-yellow-700">
            {file.type === "clarification_response" ? "respuesta" : "texto"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-3 text-sm text-gray-500">
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

void 0;

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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  if (!session)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        Sesion no encontrada
      </div>
    );

  const files = (session.raw_files || []).sort(
    (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
  );
  const mediaFiles = files.filter((f) => f.type === "image" || f.type === "audio" || f.type === "video");
  const hasPreprocessed = files.some((f) => f.transcription || f.image_description);

  const transcriptions: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const f of files) {
    const fname = f.filename || "";
    if (f.transcription && fname) transcriptions[fname] = f.transcription;
    if (f.image_description && fname) descriptions[fname] = f.image_description;
  }
  const segMaps = buildSegmentMaps(session.segments);
  for (const [k, v] of Object.entries(segMaps.transcriptions)) {
    if (!transcriptions[k]) transcriptions[k] = v;
  }
  for (const [k, v] of Object.entries(segMaps.descriptions)) {
    if (!descriptions[k]) descriptions[k] = v;
  }

  const isGeneratingAny = Object.values(generating).some(Boolean);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/sessions")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft size={16} /> Sesiones
        </button>
        <span className="text-gray-300">|</span>
        <h2 className="text-xl font-display font-bold text-gray-900">
          {session.user_name} &mdash; {session.date}
        </h2>
        <span className={`badge ${STATUS_COLORS[session.status] || "bg-gray-100"}`}>
          {session.status}
        </span>
      </div>

      {/* Info bar */}
      <div className="card p-4 mb-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
        <InfoItem label="Ejecutivo" value={session.user_name} />
        <InfoItem label="Telefono" value={session.user_phone} />
        <InfoItem label="Rol" value={session.user_role || "--"} />
        <InfoItem label="Pais" value={session.country || "--"} />
        <InfoItem label="Archivos" value={String(files.length)} />
        <InfoItem
          label="Pre-procesados"
          value={hasPreprocessed ? "Si" : "Pendiente"}
          valueClass={hasPreprocessed ? "text-emerald-600" : "text-yellow-600"}
        />
        <InfoItem label="Media" value={`${mediaFiles.length} fotos/audio/video`} />
      </div>

      {/* Report Generation Panel */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-gray-800">Generar Reportes</h3>
          <button
            onClick={() => handleGenerate("all")}
            disabled={isGeneratingAny || mediaFiles.length === 0}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                generatedReports[rt.id]
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-gray-100 hover:border-brand-200 bg-gray-50/50 hover:bg-brand-50/30"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">{rt.icon}</span>
                <span className="font-semibold text-sm text-gray-800">{rt.label}</span>
                {generating[rt.id] && (
                  <span className="text-xs text-brand-500 animate-pulse font-medium">Generando...</span>
                )}
                {generatedReports[rt.id] && !generating[rt.id] && (
                  <span className="badge bg-emerald-50 text-emerald-700 text-[10px]">Listo</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{rt.desc}</p>
            </button>
          ))}
        </div>
        {mediaFiles.length === 0 && (
          <p className="text-xs text-yellow-600 mt-3 bg-yellow-50 px-3 py-2 rounded-lg">
            No hay archivos de media para analizar.
          </p>
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
          <h3 className="font-display font-semibold text-gray-700 mb-3">
            Timeline de capturas ({files.length})
          </h3>
          {files.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400 text-sm">Sin archivos en esta sesion.</p>
            </div>
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
          <h3 className="font-display font-semibold text-gray-700 mb-3">
            Informacion de sesion
          </h3>
          <div className="card p-4 text-xs space-y-3">
            <InfoRow label="ID" value={session.id.slice(0, 8)} mono />
            <InfoRow label="Creada" value={new Date(session.created_at).toLocaleString("es-CO")} />
            <InfoRow label="Actualizada" value={new Date(session.updated_at).toLocaleString("es-CO")} />
            <div className="border-t border-gray-100 pt-3" />
            <InfoRow label="Imagenes" value={String(files.filter((f) => f.type === "image").length)} />
            <InfoRow label="Audios" value={String(files.filter((f) => f.type === "audio").length)} />
            <InfoRow label="Videos" value={String(files.filter((f) => f.type === "video").length)} />
            <InfoRow label="Textos" value={String(files.filter((f) => f.type === "text").length)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <span className="text-gray-400 block text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className={`font-semibold text-gray-800 ${valueClass || ""}`}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium text-gray-700 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
