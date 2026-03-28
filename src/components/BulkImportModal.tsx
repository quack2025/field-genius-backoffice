import { useState, useCallback } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { bulkImportUsers } from "../lib/api";
import type { BulkImportResult } from "../lib/api";

interface ParsedRow {
  phone: string;
  name: string;
  role?: string;
  country?: string;
  group_slug?: string;
}

interface Props {
  implId: string;
  onClose: () => void;
  onImported: () => void;
}

const EXAMPLE_CSV = `phone,name,role,country,group_slug
+50688001234,Carlos Mora,sales,CR,zona_san_jose
+50688005678,Ana Lopez,operator,CR,zona_heredia`;

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: ["CSV vacio"] };

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("phone") || firstLine.includes("name");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = hasHeader ? i + 2 : i + 1;
    const parts = dataLines[i].split(",").map((p) => p.trim());

    if (parts.length < 2) {
      errors.push(`Linea ${lineNum}: necesita al menos phone y name`);
      continue;
    }

    const phone = parts[0];
    const name = parts[1];

    if (!phone || !name) {
      errors.push(`Linea ${lineNum}: phone o name vacio`);
      continue;
    }

    if (!phone.startsWith("+")) {
      errors.push(`Linea ${lineNum}: phone debe empezar con + (${phone})`);
      continue;
    }

    rows.push({
      phone,
      name,
      role: parts[2] || undefined,
      country: parts[3] || undefined,
      group_slug: parts[4] || undefined,
    });
  }

  return { rows, errors };
}

export function BulkImportModal({ implId, onClose, onImported }: Props) {
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [importError, setImportError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleParse = () => {
    const p = parseCSV(csvText);
    setParsed(p);
    setResult(null);
    setImportError("");
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      const res = await bulkImportUsers(implId, parsed.rows);
      setResult(res.data);
      onImported();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv" || file.type === "text/plain")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) {
          setCsvText(text);
          setParsed(null);
          setResult(null);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        setCsvText(text);
        setParsed(null);
        setResult(null);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-brand-500" />
            <h3 className="font-semibold text-gray-800">Importar usuarios desde CSV</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium mb-1">Formato CSV esperado:</p>
            <pre className="bg-white border rounded p-2 font-mono text-xs overflow-x-auto">{EXAMPLE_CSV}</pre>
            <p className="mt-2 text-gray-500">
              Columnas obligatorias: <strong>phone, name</strong>. Opcionales: role, country, group_slug.
            </p>
          </div>

          {/* Input area */}
          <div
            className={`border-2 border-dashed rounded-lg transition-colors ${
              dragOver ? "border-brand-500 bg-brand-50" : "border-gray-300"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setParsed(null); setResult(null); }}
              placeholder="Pega tu CSV aqui o arrastra un archivo .csv..."
              className="w-full h-40 px-3 py-2 text-sm font-mono resize-none focus:outline-none bg-transparent"
            />
            <div className="px-3 pb-2 flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-700 cursor-pointer">
                <FileText size={14} />
                <span>Seleccionar archivo</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
              {csvText && (
                <button
                  onClick={handleParse}
                  className="bg-brand-500 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-brand-600"
                >
                  Previsualizar
                </button>
              )}
            </div>
          </div>

          {/* Parse errors */}
          {parsed && parsed.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-red-700 text-xs font-medium mb-1">
                <AlertCircle size={14} />
                <span>{parsed.errors.length} error(es) al parsear</span>
              </div>
              <ul className="text-xs text-red-600 space-y-0.5">
                {parsed.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          {parsed && parsed.rows.length > 0 && !result && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {parsed.rows.length} usuario(s) listos para importar
              </p>
              <div className="bg-white border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Phone</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Country</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-1.5 font-mono">{row.phone}</td>
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5">{row.role || "--"}</td>
                        <td className="px-3 py-1.5">{row.country || "--"}</td>
                        <td className="px-3 py-1.5">{row.group_slug || "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import error */}
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Error: {importError}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-2">
                <CheckCircle size={18} />
                <span>Importacion completada</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-white rounded p-2 text-center">
                  <div className="text-lg font-bold text-green-600">{result.created}</div>
                  <div className="text-xs text-gray-500">Creados</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <div className="text-lg font-bold text-blue-600">{result.updated}</div>
                  <div className="text-xs text-gray-500">Actualizados</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <div className="text-lg font-bold text-gray-600">{result.total_processed}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <div className="text-lg font-bold text-red-600">{result.errors.length}</div>
                  <div className="text-xs text-gray-500">Errores</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 space-y-0.5">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50"
          >
            {result ? "Cerrar" : "Cancelar"}
          </button>
          {parsed && parsed.rows.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-brand-500 text-white px-6 py-2 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              {importing ? "Importando..." : `Importar ${parsed.rows.length} usuario(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
