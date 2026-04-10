import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface Props {
  onSignOut: () => void;
}

export function Layout({ onSignOut }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar onSignOut={onSignOut} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 animate-slide-left">
            <Sidebar onSignOut={onSignOut} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
          <span className="font-display font-bold text-gray-900">Radar Xponencial</span>
        </div>

        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
