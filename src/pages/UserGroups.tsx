import { useEffect, useState, useMemo } from "react";
import { Users, Plus, X } from "lucide-react";
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

  const [implFilter, setImplFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createZone, setCreateZone] = useState("");
  const [createTags, setCreateTags] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  useEffect(() => {
    if (!selectedGroup) {
      setGroupMembers([]);
      return;
    }
    setLoadingMembers(true);
    listUsers(selectedGroup.implementation_id)
      .then((r) => setGroupMembers(r.data))
      .catch(console.error)
      .finally(() => setLoadingMembers(false));
  }, [selectedGroup]);

  const autoSlug = useMemo(() => slugify(createName), [createName]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!implFilter || !createName.trim()) return;

    setCreating(true);
    try {
      const tags = createTags.split(",").map((t) => t.trim()).filter(Boolean);
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
      const res = await listUsers(selectedGroup.implementation_id);
      setGroupMembers(res.data);
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRemovingPhone("");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-brand-500" />
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Grupos de Usuarios</h2>
            <p className="text-sm text-gray-500">Organiza usuarios por zona y segmento</p>
          </div>
        </div>
        {implFilter && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={showCreate ? "btn-secondary flex items-center gap-1.5" : "btn-primary flex items-center gap-1.5"}
          >
            {showCreate ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Crear Grupo</>}
          </button>
        )}
      </div>

      {/* Implementation filter */}
      <div className="card p-4 mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          Proyecto
        </label>
        <select
          value={implFilter}
          onChange={(e) => {
            setImplFilter(e.target.value);
            setSelectedGroup(null);
            setShowCreate(false);
          }}
          className="input w-auto min-w-[250px]"
        >
          <option value="">Todas</option>
          {implementations.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {showCreate && implFilter && (
        <div className="card p-5 mb-4 animate-fade-in">
          <h3 className="font-display font-semibold text-sm text-gray-800 mb-3">Nuevo Grupo</h3>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Nombre *</label>
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Zona Norte" className="input w-48" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Slug</label>
              <input type="text" value={createSlug || autoSlug} onChange={(e) => setCreateSlug(e.target.value)} placeholder="zona_norte" className="input w-40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Zona</label>
              <input type="text" value={createZone} onChange={(e) => setCreateZone(e.target.value)} placeholder="Norte" className="input w-32" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Tags (coma)</label>
              <input type="text" value={createTags} onChange={(e) => setCreateTags(e.target.value)} placeholder="cemento, ferreteria" className="input w-56" />
            </div>
            <button type="submit" disabled={creating || !createName.trim()} className="btn-primary disabled:opacity-50">
              {creating ? "Creando..." : "Crear"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400 text-sm">
                {implFilter
                  ? "No hay grupos para este proyecto."
                  : "Selecciona un proyecto para ver sus grupos."}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm table-pro">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Slug</th>
                    <th>Zona</th>
                    <th>Tags</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr
                      key={g.id}
                      className={`cursor-pointer ${selectedGroup?.id === g.id ? "!bg-brand-50" : ""}`}
                      onClick={() => setSelectedGroup(selectedGroup?.id === g.id ? null : g)}
                    >
                      <td className="font-semibold text-gray-800">{g.name}</td>
                      <td>
                        <span className="font-mono text-xs text-gray-500">{g.slug}</span>
                      </td>
                      <td>
                        {g.zone ? (
                          <span className="badge bg-blue-50 text-blue-700">{g.zone}</span>
                        ) : (
                          <span className="text-xs text-gray-400">--</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {g.tags.length > 0
                            ? g.tags.map((tag) => (
                                <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
                              ))
                            : <span className="text-xs text-gray-400">--</span>}
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">
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
            <div className="card p-4">
              <h3 className="font-display font-semibold text-gray-800 mb-1">{selectedGroup.name}</h3>
              {selectedGroup.zone && (
                <p className="text-xs text-gray-500 mb-3">Zona: {selectedGroup.zone}</p>
              )}

              {/* Add member form */}
              <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="Telefono (+57...)"
                  className="input flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={addingMember || !addPhone.trim()}
                  className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  {addingMember ? "..." : "Agregar"}
                </button>
              </form>

              {/* Available users hint */}
              {!loadingUsers && users.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Usuarios disponibles:</p>
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {users.map((u) => (
                      <button
                        key={u.phone}
                        type="button"
                        onClick={() => setAddPhone(u.phone)}
                        className="block text-xs text-brand-500 hover:text-brand-700 hover:underline transition-colors"
                      >
                        {u.name} ({u.phone})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Members list */}
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Miembros
              </h4>
              {loadingMembers ? (
                <div className="flex items-center justify-center h-16">
                  <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : groupMembers.length === 0 ? (
                <p className="text-xs text-gray-400">Sin miembros.</p>
              ) : (
                <ul className="space-y-1">
                  {groupMembers.map((m) => (
                    <li
                      key={m.phone}
                      className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">{m.name}</span>
                          {m.role && (
                            <span className="badge bg-blue-50 text-blue-700 text-[10px]">{m.role}</span>
                          )}
                          {m.country && (
                            <span className="badge bg-gray-100 text-gray-600 text-[10px]">{m.country}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{m.phone}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(m.phone)}
                        disabled={removingPhone === m.phone}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
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
            <div className="card p-6 text-center">
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
