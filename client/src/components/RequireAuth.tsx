import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">loading…</div>;
  }
  if (state.status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  if (state.status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">loading…</div>;
  }
  if (state.status === "authenticated") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
