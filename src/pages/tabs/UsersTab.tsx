import { useEffect, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { listUsers, assignUser, removeUser, type User } from "../../lib/api";
import { BulkImportModal } from "../../components/BulkImportModal";

const ROLES = [
  { value: "field_agent", label: "Field Agent" },
  { value: "sales", label: "Sales" },
  { value: "operator", label: "Operator" },
  { value: "marketing", label: "Marketing" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
] as const;

const ROLE_COLORS: Record<string, string> = {
  field_agent: "bg-blue-100 text-blue-700",
  sales: "bg-green-100 text-green-700",
  operator: "bg-yellow-100 text-yellow-800",
  marketing: "bg-pink-100 text-pink-700",
  supervisor: "bg-orange-100 text-orange-700",
  manager: "bg-purple-100 text-purple-700",
};

interface Props {
  implId: string;
}

export function UsersTab({ implId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const load = () => {
    setLoading(true);
    listUsers(implId)
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [implId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await assignUser(implId, {
        phone: form.get("phone") as string,
        name: form.get("name") as string,
        role: (form.get("role") as string) || "field_agent",
        country: (form.get("country") as string) || undefined,
      });
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRemove = async (phone: string, name: string) => {
    if (!confirm(`Eliminar a ${name} (${phone})?`)) return;
    try {
      await removeUser(implId, phone);
      load();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setShowBulkImport(true)}
          className="flex items-center gap-1.5 border border-brand-500 text-brand-500 px-4 py-2 rounded text-sm hover:bg-brand-50"
        >
          <Upload size={16} /> Importar CSV
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded text-sm hover:bg-brand-600"
        >
          <Plus size={16} /> Agregar usuario
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-4 rounded-lg shadow mb-4 grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          <input
            name="phone"
            placeholder="Telefono (+573...)"
            required
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            name="name"
            placeholder="Nombre"
            required
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            name="role"
            className="border rounded px-3 py-2 text-sm"
            defaultValue="field_agent"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <input
            name="country"
            placeholder="Pais (CO, CR...)"
            className="border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-brand-500 text-white px-4 py-2 rounded text-sm"
            >
              Agregar
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

      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Nombre
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Telefono
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Rol
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Pais
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.phone} className="border-b last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.country ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {u.country}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">--</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(u.phone, u.name)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No hay usuarios asignados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showBulkImport && (
        <BulkImportModal
          implId={implId}
          onClose={() => setShowBulkImport(false)}
          onImported={load}
        />
      )}
    </div>
  );
}
