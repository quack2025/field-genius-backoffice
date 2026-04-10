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
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [accessMode, setAccessMode] = useState("open");
  const [visionStrategy, setVisionStrategy] = useState("tiered");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [termsAcceptedMessage, setTermsAcceptedMessage] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [firstPhotoHint, setFirstPhotoHint] = useState("");
  const [requireTerms, setRequireTerms] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestEmails, setDigestEmails] = useState("");
  const [digestFrequency, setDigestFrequency] = useState("daily");

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
        setWhatsappNumber(d.whatsapp_number || "");
        setAccessMode(d.access_mode || "open");
        setVisionStrategy(d.vision_strategy || "tiered");
        const ob = (d.onboarding_config || {}) as Record<string, string | boolean>;
        setWelcomeMessage(String(ob.welcome_message || ""));
        setTermsAcceptedMessage(String(ob.terms_accepted_message || ""));
        setRejectionMessage(String(ob.rejection_message || ""));
        setFirstPhotoHint(String(ob.first_photo_hint || ""));
        setRequireTerms(Boolean(ob.require_terms));
        const dg = (ob.digest || {}) as Record<string, unknown>;
        setDigestEnabled(Boolean(dg.enabled));
        setDigestEmails(Array.isArray(dg.emails) ? (dg.emails as string[]).join(", ") : String(dg.emails || ""));
        setDigestFrequency(String(dg.frequency || "daily"));
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
        whatsapp_number: whatsappNumber || null,
        access_mode: accessMode,
        vision_strategy: visionStrategy,
        onboarding_config: {
          welcome_message: welcomeMessage || undefined,
          terms_accepted_message: termsAcceptedMessage || undefined,
          rejection_message: rejectionMessage || undefined,
          first_photo_hint: firstPhotoHint || undefined,
          require_terms: requireTerms,
          digest: {
            enabled: digestEnabled,
            emails: digestEmails.split(",").map((e: string) => e.trim()).filter(Boolean),
            frequency: digestFrequency,
          },
        },
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
        <div className="space-y-5">
          {/* General */}
          <div className="card p-6 space-y-5">
            <h3 className="font-display font-semibold text-gray-800 text-sm">General</h3>
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
          </div>

          {/* WhatsApp & Access Control */}
          <div className="card p-6 space-y-5">
            <h3 className="font-display font-semibold text-gray-800 text-sm">WhatsApp y Control de Acceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Numero WhatsApp (formato: whatsapp:+1XXXXXXXXXX)"
                value={whatsappNumber}
                onChange={setWhatsappNumber}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Modo de acceso</label>
                <select
                  value={accessMode}
                  onChange={(e) => setAccessMode(e.target.value)}
                  className="input"
                >
                  <option value="open">Abierto (cualquiera puede usar)</option>
                  <option value="whitelist">Whitelist (solo usuarios registrados)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {accessMode === "whitelist"
                    ? "Solo usuarios en la lista pueden enviar mensajes. Otros reciben aviso de rechazo."
                    : "Cualquier numero puede enviar mensajes y seran procesados."}
                </p>
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="card p-6 space-y-5">
            <h3 className="font-display font-semibold text-gray-800 text-sm">Configuracion AI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vision Strategy</label>
                <select
                  value={visionStrategy}
                  onChange={(e) => setVisionStrategy(e.target.value)}
                  className="input"
                >
                  <option value="tiered">Tiered (Haiku primero, Sonnet si necesario)</option>
                  <option value="sonnet_only">Solo Sonnet (maxima calidad, mayor costo)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {visionStrategy === "tiered"
                    ? "Haiku analiza primero (~$0.006/foto). Solo escala a Sonnet si la descripcion es insuficiente."
                    : "Todas las fotos se analizan con Sonnet (~$0.02/foto). Mejor calidad, ~3x mas costo."}
                </p>
              </div>
            </div>
          </div>

          {/* Onboarding WhatsApp */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-800 text-sm">Mensajes de Onboarding (WhatsApp)</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requireTerms}
                  onChange={(e) => setRequireTerms(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Requerir aceptacion de terminos
              </label>
            </div>
            <div className="space-y-4">
              <TextArea
                label="Mensaje de bienvenida (primera vez)"
                value={welcomeMessage}
                onChange={setWelcomeMessage}
                placeholder="Bienvenido a Field Genius! Soy tu asistente..."
                hint="Se envia la primera vez que un usuario escribe. Usa *bold* para negritas en WhatsApp."
              />
              {requireTerms && (
                <TextArea
                  label="Mensaje al aceptar terminos"
                  value={termsAcceptedMessage}
                  onChange={setTermsAcceptedMessage}
                  placeholder="Perfecto! Ya puedes empezar..."
                  hint="Se envia cuando el usuario responde 'acepto'."
                />
              )}
              <TextArea
                label="Mensaje de rechazo (usuario no registrado)"
                value={rejectionMessage}
                onChange={setRejectionMessage}
                placeholder="Este servicio es exclusivo para el equipo de..."
                hint="Solo aplica en modo whitelist. Se envia a numeros no registrados."
              />
              <TextArea
                label="Confirmacion de archivo recibido"
                value={firstPhotoHint}
                onChange={setFirstPhotoHint}
                placeholder="Recibido ({count} archivo(s) hoy). Escribe *reporte* cuando termines."
                hint="Usa {count} para el numero de archivos. Se envia cada vez que recibe una foto/audio."
              />
            </div>
          </div>

          {/* Digest Email */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-800 text-sm">Resumen por Email (Digest)</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={digestEnabled}
                  onChange={(e) => setDigestEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Activar digest
              </label>
            </div>
            {digestEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Correos destinatarios (separados por coma)"
                  value={digestEmails}
                  onChange={setDigestEmails}
                  className="md:col-span-2"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Frecuencia</label>
                  <select
                    value={digestFrequency}
                    onChange={(e) => setDigestFrequency(e.target.value)}
                    className="input"
                  >
                    <option value="daily">Diario (7pm)</option>
                    <option value="weekly">Semanal (viernes 7pm)</option>
                  </select>
                </div>
              </div>
            )}
            {!digestEnabled && (
              <p className="text-xs text-gray-400">Activa el digest para enviar un resumen periodico por email con la actividad de campo.</p>
            )}
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

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  hint = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="input resize-y min-h-[80px]"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
