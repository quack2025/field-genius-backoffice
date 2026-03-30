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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  if (!impl)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        Implementacion no encontrada
      </div>
    );

  const tabs: { key: Tab; label: string }[] = [
    { key: "config", label: "Configuracion" },
    { key: "visit-types", label: "Tipos de Visita" },
    { key: "prompts", label: "Prompts" },
    { key: "users", label: "Usuarios" },
  ];

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate("/implementations")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: impl.primary_color + "20" }}
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: impl.primary_color }} />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900">{impl.name}</h2>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} /> Desactivar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab ${tab === t.key ? "tab-active" : "tab-inactive"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "config" && (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre" value={name} onChange={setName} />
            <Field label="Industria" value={industry} onChange={setIndustry} />
            <Field label="Pais" value={country} onChange={setCountry} />
            <Field label="Idioma" value={language} onChange={setLanguage} />
            <Field label="Color primario" value={primaryColor} onChange={setPrimaryColor} />
            <Field label="Google Spreadsheet ID" value={spreadsheetId} onChange={setSpreadsheetId} />
            <Field
              label="Trigger words (separadas por coma)"
              value={triggerWords}
              onChange={setTriggerWords}
              className="md:col-span-2"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  );
}
