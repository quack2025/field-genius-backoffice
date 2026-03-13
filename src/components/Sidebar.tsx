import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { reloadConfig } from "../lib/api";

interface Props {
  onSignOut: () => void;
}

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/implementations", label: "Implementaciones", icon: Building2 },
];

export function Sidebar({ onSignOut }: Props) {
  const handleReload = async () => {
    try {
      await reloadConfig();
      alert("Cache recargado");
    } catch (e: unknown) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <aside className="w-60 bg-brand-500 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-brand-600">
        <h1 className="text-lg font-bold">Field Genius</h1>
        <p className="text-xs text-blue-200">Backoffice</p>
      </div>

      <nav className="flex-1 p-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded text-sm ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-blue-200 hover:bg-brand-600 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-brand-600 space-y-1">
        <button
          onClick={handleReload}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-blue-200 hover:bg-brand-600 hover:text-white w-full"
        >
          <RefreshCw size={18} />
          Recargar config
        </button>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-blue-200 hover:bg-brand-600 hover:text-white w-full"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
