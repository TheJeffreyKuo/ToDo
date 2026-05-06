import { useAuth } from "@/auth/AuthContext";

export default function HomePage() {
  const { state, logout } = useAuth();
  if (state.status !== "authenticated") return null;

  return (
    <div className="min-h-screen p-6 text-zinc-900">
      <header className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">ToDo</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600">{state.user.email}</span>
          <button
            onClick={() => logout()}
            className="rounded border px-3 py-1 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      </header>
    </div>
  );
}
