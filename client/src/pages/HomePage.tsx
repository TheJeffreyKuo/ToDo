import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useProjects } from "@/hooks/useProjects";

export default function HomePage() {
  const { state: authState, logout } = useAuth();
  const { state, createProject, deleteProject } = useProjects();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (authState.status !== "authenticated") return null;

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createProject({ name });
      setNewName("");
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen p-6 text-zinc-900">
      <header className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">ToDo</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600">{authState.user.email}</span>
          <button
            onClick={() => logout()}
            className="rounded border px-3 py-1 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-8">
        <h2 className="text-lg font-semibold mb-3">Projects</h2>

        <form onSubmit={onCreate} className="flex gap-2 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project name"
            disabled={creating}
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {createError && <div className="mb-3 text-sm text-red-600">{createError}</div>}

        {state.status === "loading" && <div className="text-sm text-zinc-500">Loading…</div>}
        {state.status === "error" && (
          <div className="text-sm text-red-600">{state.message}</div>
        )}
        {state.status === "ready" && state.projects.length === 0 && (
          <div className="text-sm text-zinc-500">No projects yet.</div>
        )}
        {state.status === "ready" && state.projects.length > 0 && (
          <ul className="divide-y border rounded bg-white">
            {state.projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span className="flex items-center gap-2">
                  {p.color && (
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: p.color }}
                    />
                  )}
                  <span>{p.name}</span>
                </span>
                <button
                  onClick={() => deleteProject(p.id)}
                  className="text-zinc-500 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
