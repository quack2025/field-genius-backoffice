import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../lib/api";
import type { Session, RawFile } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  accumulating: "bg-blue-100 text-blue-800",
  segmenting: "bg-yellow-100 text-yellow-800",
  processing: "bg-orange-100 text-orange-800",
  generating_outputs: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  needs_clarification: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

function MediaCard({ file }: { file: RawFile }) {
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
        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
          <span>{time}</span>
          <span className="bg-purple-50 text-purple-700 px-1.5 rounded">video</span>
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
              {files.map((f, i) => (
                <MediaCard key={i} file={f} />
              ))}
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
                <div key={r.id} className="bg-white rounded-lg shadow p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{r.visit_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || "bg-gray-100"}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.inferred_location && (
                    <p className="text-xs text-gray-500 mb-2">{r.inferred_location}</p>
                  )}
                  {r.confidence_score != null && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                        <span>Confianza</span>
                        <span>{(r.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full"
                          style={{ width: `${r.confidence_score * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {r.extracted_data && Object.keys(r.extracted_data).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-brand-500 cursor-pointer">
                        Ver datos extraidos
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-60">
                        {JSON.stringify(r.extracted_data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {r.processing_time_ms != null && (
                    <p className="text-xs text-gray-400 mt-2">
                      Procesado en {(r.processing_time_ms / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
