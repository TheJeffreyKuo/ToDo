import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { SortableTaskList } from "@/components/SortableTaskList";
import { TaskRow } from "@/components/TaskRow";
import { TimePicker } from "@/components/TimePicker";
import { useLabels } from "@/hooks/useLabels";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { formatSummary, summarizeTasks } from "@/lib/tasks";

export default function ProjectDetailPage() {
  const { state: authState, logout } = useAuth();
  const { id: idParam } = useParams<{ id: string }>();
  const projectId = idParam ? Number(idParam) : NaN;
  const projectsHook = useProjects();
  const labelsHook = useLabels();
  const { state: tasksState, createTask, updateTask, deleteTask, setTaskLabels } = useTasks();

  const [newTitle, setNewTitle] = useState("");
  const [newScheduledFor, setNewScheduledFor] = useState<string>("");
  const [newMinutes, setNewMinutes] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const isCancellingNameRef = useRef(false);

  const projectsState = projectsHook.state;
  const project =
    projectsState.status === "ready"
      ? projectsState.projects.find((p) => p.id === projectId)
      : undefined;

  const projectTasks = useMemo(
    () =>
      tasksState.status === "ready"
        ? tasksState.tasks.filter((t) => t.projectId === projectId)
        : [],
    [tasksState, projectId],
  );
  const summary = useMemo(() => summarizeTasks(projectTasks), [projectTasks]);

  if (authState.status !== "authenticated") return null;

  const availableLabels = labelsHook.state.status === "ready" ? labelsHook.state.labels : [];

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      const input: { title: string; projectId: number; scheduledFor?: string; estimatedMinutes?: number } = {
        title,
        projectId,
      };
      if (newScheduledFor) input.scheduledFor = newScheduledFor;
      if (newMinutes !== null) input.estimatedMinutes = newMinutes;
      await createTask(input);
      setNewTitle("");
      setNewScheduledFor("");
      setNewMinutes(null);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  function startEditingName() {
    if (!project) return;
    setNameDraft(project.name);
    setIsEditingName(true);
  }

  function commitName() {
    if (!project) return;
    if (isCancellingNameRef.current) {
      isCancellingNameRef.current = false;
      return;
    }
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(project.name);
    } else if (trimmed !== project.name) {
      projectsHook.updateProject(project.id, { name: trimmed });
    }
    setIsEditingName(false);
  }

  function cancelName() {
    if (!project) return;
    isCancellingNameRef.current = true;
    setNameDraft(project.name);
    setIsEditingName(false);
  }

  function onNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelName();
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
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={project.color ?? "#71717a"}
                  onChange={(e) =>
                    projectsHook.updateProject(project.id, { color: e.target.value })
                  }
                  aria-label="Project color"
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                {isEditingName ? (
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={onNameKeyDown}
                    autoFocus
                    aria-label="Project name"
                    className="flex-1 rounded border px-2 py-1 text-xl font-semibold"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startEditingName}
                    className="text-xl font-semibold text-left"
                    title="Click to rename"
                  >
                    {project.name}
                  </button>
                )}
                {project.color && (
                  <button
                    type="button"
                    onClick={() => projectsHook.updateProject(project.id, { color: null })}
                    className="text-xs text-zinc-500 hover:text-zinc-900"
                  >
                    Clear color
                  </button>
                )}
              </div>
              {summary.total > 0 && (
                <div className="mt-1 text-sm text-zinc-500">{formatSummary(summary)}</div>
              )}
            </div>

            <section>
              <form onSubmit={onCreate} className="flex flex-wrap gap-2 mb-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What needs doing?"
                  disabled={creating}
                  className="flex-1 min-w-[12rem] rounded border px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={newScheduledFor}
                  onChange={(e) => setNewScheduledFor(e.target.value)}
                  disabled={creating}
                  aria-label="Scheduled date"
                  className="rounded border px-2 py-2 text-sm"
                />
                <TimePicker
                  minutes={newMinutes}
                  onChange={setNewMinutes}
                  disabled={creating}
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
                <SortableTaskList tasks={projectTasks} onUpdateTask={updateTask}>
                  <ul className="divide-y border rounded bg-white">
                    {projectTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        project={project}
                        showProjectBadge={false}
                        availableLabels={availableLabels}
                        onUpdate={(input) => updateTask(task.id, input)}
                        onSetLabels={(labelIds) => setTaskLabels(task.id, labelIds)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                  </ul>
                </SortableTaskList>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
