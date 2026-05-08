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
    <div className="min-h-screen p-6 text-zinc-900">
      <header className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/" className="rounded border px-3 py-1 hover:bg-zinc-50">
            ← Back
          </Link>
          <span className="text-zinc-600">{authState.user.email}</span>
          <button
            onClick={() => logout()}
            className="rounded border px-3 py-1 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-8 space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">Labels</h2>
          <form onSubmit={onCreate} className="flex gap-2 mb-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New label name"
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

          {labelsState.status === "loading" && (
            <div className="text-sm text-zinc-500">Loading…</div>
          )}
          {labelsState.status === "error" && (
            <div className="text-sm text-red-600">{labelsState.message}</div>
          )}
          {labelsState.status === "ready" && labelsState.labels.length === 0 && (
            <div className="text-sm text-zinc-500">No labels yet.</div>
          )}
          {labelsState.status === "ready" && labelsState.labels.length > 0 && (
            <ul className="divide-y border rounded bg-white">
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
