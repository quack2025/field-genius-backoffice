import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  FileBarChart,
  Users,
  ClipboardCheck,
  LogOut,
  RefreshCw,
  Zap,
} from "lucide-react";
import { reloadConfig } from "../lib/api";
import { useToast } from "../hooks/useToast";

interface Props {
  onSignOut: () => void;
  onClose?: () => void;
}

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/implementations", label: "Implementaciones", icon: Building2 },
  { to: "/sessions", label: "Sesiones", icon: MessageSquare },
  { to: "/reports", label: "Reportes", icon: FileBarChart },
  { to: "/user-groups", label: "Grupos", icon: Users },
  { to: "/compliance", label: "Compliance", icon: ClipboardCheck },
];

export function Sidebar({ onSignOut, onClose }: Props) {
  const { toast } = useToast();
  const handleReload = async () => {
    try {
      await reloadConfig();
      toast({ type: "success", message: "Cache recargado" });
    } catch (e: unknown) {
      toast({ type: "error", message: "Error: " + (e instanceof Error ? e.message : String(e)) });
    }
  };

  return (
    <aside className="w-64 sidebar-gradient text-white flex flex-col min-h-screen shadow-xl">
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Zap size={20} className="text-blue-200" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold tracking-tight">Field Genius</h1>
            <p className="text-[11px] text-blue-300/80 font-medium">Backoffice Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-blue-200/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={handleReload}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200/70 hover:bg-white/10 hover:text-white w-full transition-all duration-150"
        >
          <RefreshCw size={18} strokeWidth={1.8} />
          Recargar config
        </button>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200/70 hover:bg-white/10 hover:text-white w-full transition-all duration-150"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
