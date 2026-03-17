import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../lib/api";
import type { Session, RawFile, VisitReport, SegmentationData } from "../lib/api";

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

/** Render strategic analysis markdown as formatted sections */
function StrategicAnalysis({ markdown }: { markdown: string }) {
  // Split by ## headings for visual structure
  const sections = markdown.split(/^## /m).filter(Boolean);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-brand-500 to-indigo-600 px-4 py-3">
        <h3 className="text-white font-semibold text-sm">Analisis Estrategico — Pentagono de Babson</h3>
      </div>
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {sections.map((section, i) => {
          const lines = section.split("\n");
          const title = lines[0]?.trim();
          const body = lines.slice(1).join("\n").trim();
          return (
            <details key={i} open={i === 0 || i === sections.length - 1}>
              <summary className="font-medium text-sm text-brand-700 cursor-pointer hover:text-brand-500">
                {title || `Seccion ${i + 1}`}
              </summary>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-brand-100">
                {body}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function VisitReportCard({ report }: { report: VisitReport }) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{report.visit_type}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[report.status] || "bg-gray-100"}`}>
          {report.status}
        </span>
      </div>
      {report.inferred_location && (
        <p className="text-xs text-gray-500 mb-2">{report.inferred_location}</p>
      )}
      {report.confidence_score != null && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
            <span>Confianza</span>
            <span>{(report.confidence_score * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full"
              style={{ width: `${report.confidence_score * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Output links */}
      {(report.sheets_row_id || report.gamma_url) && (
        <div className="flex gap-2 mb-2">
          {report.sheets_row_id && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
              Sheets
            </span>
          )}
          {report.gamma_url && (
            <a
              href={report.gamma_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded hover:underline"
            >
              Ver Gamma
            </a>
          )}
        </div>
      )}

      {report.extracted_data && Object.keys(report.extracted_data).length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-brand-500 cursor-pointer">
            Ver datos extraidos
          </summary>
          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(report.extracted_data, null, 2)}
          </pre>
        </details>
      )}
      {report.processing_time_ms != null && (
        <p className="text-xs text-gray-400 mt-2">
          Procesado en {(report.processing_time_ms / 1000).toFixed(1)}s
        </p>
      )}
    </div>
  );
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSession(id)
      .then((r) => setSession(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!session) return <p className="text-red-500">Sesion no encontrada</p>;

  const files = (session.raw_files || []).sort(
    (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
  );
  const reports = session.visit_reports || [];

  // Build transcription/description lookup from segments
  const { transcriptions, descriptions } = buildSegmentMaps(session.segments);

  // Find reports with strategic analysis
  const analysisReports = reports.filter((r) => r.strategic_analysis);

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
      <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500 block text-xs">Telefono</span>
          <span className="font-medium">{session.user_phone}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Implementacion</span>
          <span className="font-medium">{session.implementation}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Archivos</span>
          <span className="font-medium">{files.length}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Reportes</span>
          <span className="font-medium">{reports.length}</span>
        </div>
      </div>

      {/* Strategic Analysis (full width, above the grid) */}
      {analysisReports.length > 0 && (
        <div className="mb-6 space-y-4">
          {analysisReports.map((r) => (
            <StrategicAnalysis key={r.id} markdown={r.strategic_analysis!} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: media timeline */}
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
                    transcription={transcriptions[fname]}
                    description={descriptions[fname]}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: visit reports */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-3">
            Reportes de visita ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin reportes generados.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <VisitReportCard key={r.id} report={r} />
              ))}
            </div>
          )}

          {/* Segmentation info */}
          {session.segments?.sessions && session.segments.sessions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-600 mb-3">
                Segmentacion (Fase 1)
              </h3>
              <div className="space-y-2">
                {session.segments.sessions.map((seg) => (
                  <div key={seg.id} className="bg-gray-50 rounded p-2 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{seg.visit_type}</span>
                      <span className="text-gray-500">{seg.time_range}</span>
                    </div>
                    <p className="text-gray-600">{seg.inferred_location}</p>
                    <p className="text-gray-400 mt-1">{seg.files.length} archivos — {(seg.confidence * 100).toFixed(0)}% confianza</p>
                    {seg.reasoning && (
                      <p className="text-gray-400 mt-1 italic">{seg.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
