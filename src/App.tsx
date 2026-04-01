import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./components/Toast";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Implementations } from "./pages/Implementations";
import { ImplementationDetail } from "./pages/ImplementationDetail";
import { Sessions } from "./pages/Sessions";
import { SessionDetail } from "./pages/SessionDetail";
import { Reports } from "./pages/Reports";
import { UserGroups } from "./pages/UserGroups";
import { Compliance } from "./pages/Compliance";

export default function App() {
  const { session, loading, signIn, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <ToastProvider>
        <Login onSignIn={signIn} onSignInWithGoogle={signInWithGoogle} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
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
          <Route path="/reports" element={<Reports />} />
          <Route path="/user-groups" element={<UserGroups />} />
          <Route path="/compliance" element={<Compliance />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}
