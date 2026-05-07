import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/api/tasks";

export default function HomePage() {
  const { state: authState, logout } = useAuth();

  if (authState.status !== "authenticated") return null;

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

      <main className="max-w-2xl mx-auto mt-8 space-y-10">
        <ProjectsSection />
        <TasksSection />
      </main>
    </div>
  );
}

function ProjectsSection() {
  const { state, createProject, deleteProject } = useProjects();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    <section>
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
      {state.status === "error" && <div className="text-sm text-red-600">{state.message}</div>}
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
    </section>
  );
}

function TasksSection() {
  const { state, createTask, updateTask, deleteTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createTask({ title });
      setNewTitle("");
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Tasks</h2>
      <form onSubmit={onCreate} className="flex gap-2 mb-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs doing?"
          disabled={creating}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          className="rounded bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {createError && <div className="mb-3 text-sm text-red-600">{createError}</div>}

      {state.status === "loading" && <div className="text-sm text-zinc-500">Loading…</div>}
      {state.status === "error" && <div className="text-sm text-red-600">{state.message}</div>}
      {state.status === "ready" && state.tasks.length === 0 && (
        <div className="text-sm text-zinc-500">No tasks yet.</div>
      )}
      {state.status === "ready" && state.tasks.length > 0 && (
        <ul className="divide-y border rounded bg-white">
          {state.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={(completed) => updateTask(task.id, { completed })}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (completed: boolean) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  return (
    <li className="flex items-center gap-3 p-3 text-sm">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-4 w-4"
      />
      <span className={task.completed ? "flex-1 line-through text-zinc-400" : "flex-1"}>
        {task.title}
      </span>
      {task.labels.length > 0 && (
        <span className="flex gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="rounded px-2 py-0.5 text-xs"
              style={{ background: l.color ?? "#e4e4e7", color: l.color ? "#fff" : "#3f3f46" }}
            >
              {l.name}
            </span>
          ))}
        </span>
      )}
      <button onClick={() => onDelete()} className="text-zinc-500 hover:text-red-600">
        Delete
      </button>
    </li>
  );
}
