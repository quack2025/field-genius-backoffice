import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface Props {
  onSignOut: () => void;
}

export function Layout({ onSignOut }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar onSignOut={onSignOut} />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
