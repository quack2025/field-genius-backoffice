import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  listImplementations,
  createImplementation,
  type Implementation,
} from "../lib/api";

export function Implementations() {
  const [items, setItems] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    listImplementations()
      .then((r) => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createImplementation({
        id: form.get("id") as string,
        name: form.get("name") as string,
        industry: (form.get("industry") as string) || undefined,
        country: (form.get("country") as string) || "CO",
        language: (form.get("language") as string) || "es",
      });
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Implementaciones</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-600"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          <input
            name="id"
            placeholder="ID (slug)"
            required
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            name="name"
            placeholder="Nombre"
            required
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            name="industry"
            placeholder="Industria"
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            name="country"
            placeholder="Pais (CO)"
            className="border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-brand-500 text-white px-4 py-2 rounded text-sm hover:bg-brand-600"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="border px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {items.map((impl) => (
          <div
            key={impl.id}
            onClick={() => navigate(`/implementations/${impl.id}`)}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: impl.primary_color }}
              />
              <div>
                <h3 className="font-semibold text-gray-800">{impl.name}</h3>
                <p className="text-xs text-gray-500">
                  {impl.id} &middot; {impl.industry || "—"} &middot;{" "}
                  {impl.country}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                impl.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {impl.status}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400 text-sm">No hay implementaciones aun.</p>
        )}
      </div>
    </div>
  );
}
