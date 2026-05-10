import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useLabels } from "@/hooks/useLabels";

export default function SettingsPage() {
  const { state: authState, logout } = useAuth();
  const labelsHook = useLabels();
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
      await labelsHook.createLabel({ name });
      setNewName("");
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  const labelsState = labelsHook.state;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
            >
              ← Back
            </Link>
            <span className="hidden text-zinc-500 sm:inline">{authState.user.email}</span>
            <button
              onClick={() => logout()}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Labels</h2>
          <form onSubmit={onCreate} className="mb-4 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New label name"
              disabled={creating}
              className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {createError && <div className="mb-3 text-sm text-red-600">{createError}</div>}

          {labelsState.status === "loading" && (
            <div className="text-sm text-zinc-500">Loading…</div>
          )}
          {labelsState.status === "error" && (
            <div className="text-sm text-red-600">{labelsState.message}</div>
          )}
          {labelsState.status === "ready" && labelsState.labels.length === 0 && (
            <div className="rounded-md border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
              No labels yet.
            </div>
          )}
          {labelsState.status === "ready" && labelsState.labels.length > 0 && (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
              {labelsState.labels.map((l) => (
                <li key={l.id} className="flex items-center justify-between p-3 text-sm">
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{
                      background: l.color ?? "#e4e4e7",
                      color: l.color ? "#fff" : "#3f3f46",
                    }}
                  >
                    {l.name}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this label?")) labelsHook.deleteLabel(l.id);
                    }}
                    className="text-zinc-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
