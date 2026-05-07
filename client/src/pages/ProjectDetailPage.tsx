import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { TaskRow } from "@/components/TaskRow";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";

export default function ProjectDetailPage() {
  const { state: authState, logout } = useAuth();
  const { id: idParam } = useParams<{ id: string }>();
  const projectId = idParam ? Number(idParam) : NaN;
  const projectsHook = useProjects();
  const { state: tasksState, createTask, updateTask, deleteTask } = useTasks();

  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (authState.status !== "authenticated") return null;

  const projectsState = projectsHook.state;
  const project =
    projectsState.status === "ready"
      ? projectsState.projects.find((p) => p.id === projectId)
      : undefined;

  const projectTasks =
    tasksState.status === "ready"
      ? tasksState.tasks.filter((t) => t.projectId === projectId)
      : [];

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createTask({ title, projectId });
      setNewTitle("");
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

      <main className="max-w-2xl mx-auto mt-8 space-y-6">
        <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← All projects
        </Link>

        {!Number.isFinite(projectId) && (
          <div className="text-sm text-red-600">Invalid project id.</div>
        )}
        {projectsState.status === "loading" && (
          <div className="text-sm text-zinc-500">Loading…</div>
        )}
        {projectsState.status === "error" && (
          <div className="text-sm text-red-600">{projectsState.message}</div>
        )}
        {projectsState.status === "ready" && Number.isFinite(projectId) && !project && (
          <div className="text-sm text-zinc-500">Project not found.</div>
        )}
        {projectsState.status === "ready" && project && (
          <>
            <div className="flex items-center gap-2">
              {project.color && (
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: project.color }}
                />
              )}
              <h2 className="text-xl font-semibold">{project.name}</h2>
            </div>

            <section>
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

              {tasksState.status === "loading" && (
                <div className="text-sm text-zinc-500">Loading…</div>
              )}
              {tasksState.status === "error" && (
                <div className="text-sm text-red-600">{tasksState.message}</div>
              )}
              {tasksState.status === "ready" && projectTasks.length === 0 && (
                <div className="text-sm text-zinc-500">No tasks yet.</div>
              )}
              {tasksState.status === "ready" && projectTasks.length > 0 && (
                <ul className="divide-y border rounded bg-white">
                  {projectTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      project={project}
                      showProjectBadge={false}
                      onUpdate={(input) => updateTask(task.id, input)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
