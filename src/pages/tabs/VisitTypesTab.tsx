import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  listVisitTypes,
  createVisitType,
  updateVisitType,
  deleteVisitType,
  type VisitType,
} from "../../lib/api";

interface Props {
  implId: string;
}

export function VisitTypesTab({ implId }: Props) {
  const [items, setItems] = useState<VisitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSchema, setEditSchema] = useState("");
  const [expandedSchema, setExpandedSchema] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listVisitTypes(implId)
      .then((r) => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [implId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(form.get("schema_json") as string);
    } catch {
      alert("JSON invalido");
      return;
    }

    try {
      await createVisitType(implId, {
        slug: form.get("slug") as string,
        display_name: form.get("display_name") as string,
        schema_json: schema,
        sheets_tab: (form.get("sheets_tab") as string) || undefined,
        confidence_threshold: Number(form.get("confidence_threshold")) || 0.7,
      });
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveSchema = async (vtId: string) => {
    try {
      const parsed = JSON.parse(editSchema);
      await updateVisitType(vtId, { schema_json: parsed });
      setEditing(null);
      load();
    } catch (err: unknown) {
      alert(
        err instanceof SyntaxError
          ? "JSON invalido"
          : "Error: " + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleDelete = async (vtId: string) => {
    if (!confirm("Desactivar este tipo de visita?")) return;
    await deleteVisitType(vtId);
    load();
  };

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded text-sm hover:bg-brand-600"
        >
          <Plus size={16} /> Nuevo tipo
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-4 rounded-lg shadow mb-4 space-y-3"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              name="slug"
              placeholder="Slug (ej: ferreteria)"
              required
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              name="display_name"
              placeholder="Nombre"
              required
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              name="sheets_tab"
              placeholder="Tab en Sheets"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              name="confidence_threshold"
              placeholder="Umbral (0.7)"
              type="number"
              step="0.05"
              min="0"
              max="1"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="schema_json"
            placeholder='{"implementation":"...","visit_type":"...","categories":[...]}'
            required
            rows={6}
            className="w-full border rounded px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-brand-500 text-white px-4 py-2 rounded text-sm"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="border px-4 py-2 rounded text-sm text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.map((vt) => (
          <div key={vt.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-800">
                  {vt.display_name}
                </h4>
                <p className="text-xs text-gray-500">
                  slug: {vt.slug} &middot; tab: {vt.sheets_tab || "—"}{" "}
                  &middot; umbral: {vt.confidence_threshold}
                </p>
              </div>
              <div className="flex gap-2">
                {editing === vt.id ? (
                  <>
                    <button
                      onClick={() => handleSaveSchema(vt.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Guardar"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditing(vt.id);
                        setEditSchema(
                          JSON.stringify(vt.schema_json, null, 2)
                        );
                      }}
                      className="text-blue-500 hover:text-blue-700"
                      title="Editar schema"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(vt.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Desactivar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing === vt.id ? (
              <textarea
                value={editSchema}
                onChange={(e) => setEditSchema(e.target.value)}
                rows={12}
                className="w-full border rounded px-3 py-2 text-xs font-mono"
              />
            ) : (
              <button
                onClick={() =>
                  setExpandedSchema(
                    expandedSchema === vt.id ? null : vt.id
                  )
                }
                className="text-xs text-blue-500 hover:underline"
              >
                {expandedSchema === vt.id ? "Ocultar schema" : "Ver schema"}
              </button>
            )}

            {expandedSchema === vt.id && editing !== vt.id && (
              <pre className="mt-2 bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-64">
                {JSON.stringify(vt.schema_json, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400 text-sm">No hay tipos de visita.</p>
        )}
      </div>
    </div>
  );
}
