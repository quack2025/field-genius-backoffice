import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Implementations } from "./pages/Implementations";
import { ImplementationDetail } from "./pages/ImplementationDetail";
import { Sessions } from "./pages/Sessions";
import { SessionDetail } from "./pages/SessionDetail";

export default function App() {
  const { session, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return <Login onSignIn={signIn} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onSignOut={signOut} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/implementations" element={<Implementations />} />
          <Route
            path="/implementations/:id"
            element={<ImplementationDetail />}
          />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
