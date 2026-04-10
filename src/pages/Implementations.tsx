import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, Folder, X, ChevronRight } from "lucide-react";
import {
  listImplementations,
  createImplementation,
  updateImplementation,
  type Implementation,
} from "../lib/api";
import { useToast } from "../hooks/useToast";

interface FolderGroup {
  name: string;
  items: Implementation[];
}

function groupByFolder(items: Implementation[]): { folders: FolderGroup[]; ungrouped: Implementation[] } {
  const folderMap: Record<string, Implementation[]> = {};
  const ungrouped: Implementation[] = [];

  for (const item of items) {
    const folder = item.folder;
    if (folder) {
      if (!folderMap[folder]) folderMap[folder] = [];
      folderMap[folder].push(item);
    } else {
      ungrouped.push(item);
    }
  }

  const folders = Object.entries(folderMap)
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { folders, ungrouped };
}

export function Implementations() {
  const [items, setItems] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    listImplementations()
      .then((r) => {
        setItems(r.data);
        // Auto-open all folders on first load
        const folders = new Set<string>();
        for (const item of r.data) {
          const f = item.folder;
          if (f) folders.add(f);
        }
        setOpenFolders(folders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleFolder = (name: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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
      toast({ type: "error", message: "Error: " + (err instanceof Error ? err.message : String(err)) });
    }
  };

  const handleMoveToFolder = async (implId: string, folder: string) => {
    try {
      await updateImplementation(implId, { folder: folder || null });
      load();
      toast({ type: "success", message: folder ? `Movido a ${folder}` : "Movido fuera de carpeta" });
    } catch {
      toast({ type: "error", message: "Error moviendo proyecto" });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );

  const { folders, ungrouped } = groupByFolder(items);
  const allFolderNames = folders.map((f) => f.name);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen size={24} className="text-brand-500" />
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Proyectos</h2>
            <p className="text-sm text-gray-500">Clientes y configuraciones activas</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nuevo proyecto
        </button>
      </div>

      {showCreate && (
        <div className="card p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-800">Nuevo proyecto</h3>
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

      {/* Folders */}
      {folders.map((folder) => (
        <div key={folder.name} className="mb-4">
          <button
            onClick={() => toggleFolder(folder.name)}
            className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-600 hover:text-brand-500 transition-colors"
          >
            <ChevronRight
              size={16}
              className={`transition-transform ${openFolders.has(folder.name) ? "rotate-90" : ""}`}
            />
            <Folder size={16} className="text-brand-400" />
            {folder.name}
            <span className="text-xs text-gray-400 font-normal">({folder.items.length})</span>
          </button>
          {openFolders.has(folder.name) && (
            <div className="grid gap-2 ml-6">
              {folder.items.map((impl) => (
                <ProjectCard
                  key={impl.id}
                  impl={impl}
                  folders={allFolderNames}
                  onNavigate={() => navigate(`/implementations/${impl.id}`)}
                  onMoveToFolder={handleMoveToFolder}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <div className="grid gap-2">
          {folders.length > 0 && (
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-2 mb-1">Sin carpeta</p>
          )}
          {ungrouped.map((impl) => (
            <ProjectCard
              key={impl.id}
              impl={impl}
              folders={allFolderNames}
              onNavigate={() => navigate(`/implementations/${impl.id}`)}
              onMoveToFolder={handleMoveToFolder}
            />
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No hay proyectos aun.</p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  impl,
  folders,
  onNavigate,
  onMoveToFolder,
}: {
  impl: Implementation;
  folders: string[];
  onNavigate: () => void;
  onMoveToFolder: (implId: string, folder: string) => void;
}) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [newFolder, setNewFolder] = useState("");

  return (
    <div className="card p-4 flex items-center justify-between group">
      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onNavigate}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: impl.primary_color + "20" }}
        >
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: impl.primary_color }} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 group-hover:text-brand-500 transition-colors">
            {impl.name}
          </h3>
          <p className="text-xs text-gray-500">
            {impl.id} &middot; {impl.industry || "\u2014"} &middot; {impl.country}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`badge ${
            impl.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {impl.status}
        </span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowFolderMenu(!showFolderMenu); }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Mover a carpeta"
          >
            <Folder size={14} />
          </button>
          {showFolderMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
              <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Mover a carpeta</p>
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => { onMoveToFolder(impl.id, f); setShowFolderMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                >
                  {f}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <div className="flex items-center gap-1 px-3 py-1">
                  <input
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    placeholder="Nueva carpeta..."
                    className="text-sm border-0 bg-transparent focus:outline-none flex-1 placeholder:text-gray-300"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFolder.trim()) {
                        onMoveToFolder(impl.id, newFolder.trim());
                        setNewFolder("");
                        setShowFolderMenu(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newFolder.trim()) {
                        onMoveToFolder(impl.id, newFolder.trim());
                        setNewFolder("");
                        setShowFolderMenu(false);
                      }
                    }}
                    className="text-xs text-brand-500 hover:text-brand-700 font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
              {impl.folder && (
                <button
                  onClick={() => { onMoveToFolder(impl.id, ""); setShowFolderMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 border-t border-gray-100"
                >
                  Quitar de carpeta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
