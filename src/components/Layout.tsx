import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface Props {
  onSignOut: () => void;
}

export function Layout({ onSignOut }: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar onSignOut={onSignOut} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
