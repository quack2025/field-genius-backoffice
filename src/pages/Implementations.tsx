import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, X } from "lucide-react";
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-brand-500" />
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Implementaciones</h2>
            <p className="text-sm text-gray-500">Clientes y configuraciones activas</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {showCreate && (
        <div className="card p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-800">Nueva implementacion</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input name="id" placeholder="ID (slug)" required className="input" />
            <input name="name" placeholder="Nombre" required className="input" />
            <input name="industry" placeholder="Industria" className="input" />
            <input name="country" placeholder="Pais (CO)" className="input" />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Crear</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((impl) => (
          <div
            key={impl.id}
            onClick={() => navigate(`/implementations/${impl.id}`)}
            className="card p-4 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: impl.primary_color + "20" }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: impl.primary_color }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-brand-500 transition-colors">
                  {impl.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {impl.id} &middot; {impl.industry || "—"} &middot; {impl.country}
                </p>
              </div>
            </div>
            <span
              className={`badge ${
                impl.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {impl.status}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-sm">No hay implementaciones aun.</p>
          </div>
        )}
      </div>
    </div>
  );
}
