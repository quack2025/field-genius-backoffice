import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  getImplementation,
  updateImplementation,
  deleteImplementation,
  type Implementation,
} from "../lib/api";
import { VisitTypesTab } from "./tabs/VisitTypesTab";
import { PromptsTab } from "./tabs/PromptsTab";
import { UsersTab } from "./tabs/UsersTab";

type Tab = "config" | "visit-types" | "prompts" | "users";

export function ImplementationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [impl, setImpl] = useState<Implementation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("config");

  // Editable fields
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [triggerWords, setTriggerWords] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getImplementation(id)
      .then((r) => {
        const d = r.data;
        setImpl(d);
        setName(d.name);
        setIndustry(d.industry || "");
        setCountry(d.country);
        setLanguage(d.language);
        setPrimaryColor(d.primary_color);
        setSpreadsheetId(d.google_spreadsheet_id || "");
        setTriggerWords(d.trigger_words.join(", "));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateImplementation(id, {
        name,
        industry: industry || null,
        country,
        language,
        primary_color: primaryColor,
        google_spreadsheet_id: spreadsheetId || null,
        trigger_words: triggerWords.split(",").map((w) => w.trim()).filter(Boolean),
      });
      alert("Guardado");
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Desactivar esta implementacion?")) return;
    await deleteImplementation(id);
    navigate("/implementations");
  };

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!impl) return <p className="text-red-500">No encontrada</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "config", label: "Configuracion" },
    { key: "visit-types", label: "Tipos de Visita" },
    { key: "prompts", label: "Prompts" },
    { key: "users", label: "Usuarios" },
  ];

  return (
    <div>
      <button
        onClick={() => navigate("/implementations")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{impl.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
          >
            <Trash2 size={14} /> Desactivar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "config" && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre" value={name} onChange={setName} />
            <Field label="Industria" value={industry} onChange={setIndustry} />
            <Field label="Pais" value={country} onChange={setCountry} />
            <Field label="Idioma" value={language} onChange={setLanguage} />
            <Field
              label="Color primario"
              value={primaryColor}
              onChange={setPrimaryColor}
            />
            <Field
              label="Google Spreadsheet ID"
              value={spreadsheetId}
              onChange={setSpreadsheetId}
            />
            <Field
              label="Trigger words (separadas por coma)"
              value={triggerWords}
              onChange={setTriggerWords}
              className="md:col-span-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-brand-500 text-white px-5 py-2 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {tab === "visit-types" && <VisitTypesTab implId={id!} />}
      {tab === "prompts" && <PromptsTab implId={id!} impl={impl} />}
      {tab === "users" && <UsersTab implId={id!} />}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
