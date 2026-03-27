import { useEffect, useState, useMemo } from "react";
import {
  listImplementations,
  listUserGroups,
  listUsers,
  createUserGroup,
  addGroupMember,
  removeGroupMember,
} from "../lib/api";
import type { Implementation, UserGroup, User } from "../lib/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function UserGroups() {
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Filters
  const [implFilter, setImplFilter] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createZone, setCreateZone] = useState("");
  const [createTags, setCreateTags] = useState("");
  const [creating, setCreating] = useState(false);

  // Selected group detail
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add member form
  const [addPhone, setAddPhone] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [removingPhone, setRemovingPhone] = useState("");

  useEffect(() => {
    listImplementations()
      .then((r) => setImplementations(r.data))
      .catch(console.error);
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await listUserGroups(implFilter || undefined);
      setGroups(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, [implFilter]);

  // Load users for selected implementation (for member addition reference)
  useEffect(() => {
    if (!implFilter) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    listUsers(implFilter)
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, [implFilter]);

  // Load members when a group is selected
  useEffect(() => {
    if (!selectedGroup) {
      setGroupMembers([]);
      return;
    }
    setLoadingMembers(true);
    // The members are loaded from the implementation's user list
    // and cross-referenced with the group. For now, list all users
    // from the implementation and let the backend handle group membership.
    listUsers(selectedGroup.implementation_id)
      .then((r) => setGroupMembers(r.data))
      .catch(console.error)
      .finally(() => setLoadingMembers(false));
  }, [selectedGroup]);

  // Auto-generate slug from name
  const autoSlug = useMemo(() => slugify(createName), [createName]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!implFilter || !createName.trim()) return;

    setCreating(true);
    try {
      const tags = createTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createUserGroup(implFilter, {
        name: createName.trim(),
        slug: createSlug.trim() || autoSlug,
        zone: createZone.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setCreateName("");
      setCreateSlug("");
      setCreateZone("");
      setCreateTags("");
      setShowCreate(false);
      await loadGroups();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !addPhone.trim()) return;

    setAddingMember(true);
    try {
      await addGroupMember(selectedGroup.id, addPhone.trim());
      setAddPhone("");
      // Reload members
      const res = await listUsers(selectedGroup.implementation_id);
      setGroupMembers(res.data);
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (phone: string) => {
    if (!selectedGroup) return;
    if (!confirm(`Remover ${phone} del grupo ${selectedGroup.name}?`)) return;

    setRemovingPhone(phone);
    try {
      await removeGroupMember(selectedGroup.id, phone);
      // Reload members
      const res = await listUsers(selectedGroup.implementation_id);
      setGroupMembers(res.data);
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRemovingPhone("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Grupos de Usuarios</h2>
        {implFilter && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-brand-500 text-white px-4 py-2 rounded text-sm hover:bg-brand-600"
          >
            {showCreate ? "Cancelar" : "Crear Grupo"}
          </button>
        )}
      </div>

      {/* Implementation filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <label className="text-xs font-medium text-gray-500 block mb-1">
          Implementacion
        </label>
        <select
          value={implFilter}
          onChange={(e) => {
            setImplFilter(e.target.value);
            setSelectedGroup(null);
            setShowCreate(false);
          }}
          className="border rounded px-3 py-1.5 text-sm min-w-[250px]"
        >
          <option value="">Todas</option>
          {implementations.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {showCreate && implFilter && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">
            Nuevo Grupo
          </h3>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Zona Norte"
                className="border rounded px-3 py-1.5 text-sm w-48"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Slug
              </label>
              <input
                type="text"
                value={createSlug || autoSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                placeholder="zona_norte"
                className="border rounded px-3 py-1.5 text-sm w-40 text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Zona
              </label>
              <input
                type="text"
                value={createZone}
                onChange={(e) => setCreateZone(e.target.value)}
                placeholder="Norte"
                className="border rounded px-3 py-1.5 text-sm w-32"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Tags (separados por coma)
              </label>
              <input
                type="text"
                value={createTags}
                onChange={(e) => setCreateTags(e.target.value)}
                placeholder="cemento, ferreteria"
                className="border rounded px-3 py-1.5 text-sm w-56"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !createName.trim()}
              className="bg-brand-500 text-white px-4 py-1.5 rounded text-sm hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-400 text-sm">
                {implFilter
                  ? "No hay grupos para esta implementacion."
                  : "Selecciona una implementacion para ver sus grupos."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Nombre
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Slug
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Zona
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Tags
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Creado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr
                      key={g.id}
                      className={`border-b hover:bg-gray-50 cursor-pointer ${
                        selectedGroup?.id === g.id ? "bg-brand-50" : ""
                      }`}
                      onClick={() =>
                        setSelectedGroup(selectedGroup?.id === g.id ? null : g)
                      }
                    >
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">
                          {g.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {g.zone ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {g.zone}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {g.tags.length > 0
                            ? g.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))
                            : <span className="text-xs text-gray-400">--</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(g.created_at).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Group Detail Panel */}
        <div>
          {selectedGroup ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-1">
                {selectedGroup.name}
              </h3>
              {selectedGroup.zone && (
                <p className="text-xs text-gray-500 mb-3">
                  Zona: {selectedGroup.zone}
                </p>
              )}

              {/* Add member form */}
              <form
                onSubmit={handleAddMember}
                className="flex gap-2 mb-4"
              >
                <input
                  type="text"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="Telefono (+57...)"
                  className="border rounded px-3 py-1.5 text-sm flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={addingMember || !addPhone.trim()}
                  className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600 disabled:opacity-50 whitespace-nowrap"
                >
                  {addingMember ? "..." : "Agregar"}
                </button>
              </form>

              {/* Available users hint */}
              {!loadingUsers && users.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">
                    Usuarios disponibles:
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {users.map((u) => (
                      <button
                        key={u.phone}
                        type="button"
                        onClick={() => setAddPhone(u.phone)}
                        className="block text-xs text-brand-500 hover:text-brand-700 hover:underline"
                      >
                        {u.name} ({u.phone})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Members list */}
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Miembros
              </h4>
              {loadingMembers ? (
                <p className="text-xs text-gray-400">Cargando...</p>
              ) : groupMembers.length === 0 ? (
                <p className="text-xs text-gray-400">Sin miembros.</p>
              ) : (
                <ul className="space-y-1">
                  {groupMembers.map((m) => (
                    <li
                      key={m.phone}
                      className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-gray-700">
                          {m.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {m.phone}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(m.phone)}
                        disabled={removingPhone === m.phone}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Remover del grupo"
                      >
                        {removingPhone === m.phone ? "..." : "Remover"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-400">
                Selecciona un grupo para ver sus miembros.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
