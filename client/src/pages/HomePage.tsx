import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import type { Project } from "@/api/projects";
import type { Task, UpdateTaskInput } from "@/api/tasks";

type ProjectsState =
  | { status: "loading" }
  | { status: "ready"; projects: Project[] }
  | { status: "error"; message: string };

export default function HomePage() {
  const { state: authState, logout } = useAuth();
  const projectsHook = useProjects();

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
        <ProjectsSection
          state={projectsHook.state}
          createProject={projectsHook.createProject}
          deleteProject={projectsHook.deleteProject}
        />
        <TasksSection projectsState={projectsHook.state} />
      </main>
    </div>
  );
}

function ProjectsSection({
  state,
  createProject,
  deleteProject,
}: {
  state: ProjectsState;
  createProject: (input: { name: string }) => Promise<unknown>;
  deleteProject: (id: number) => Promise<unknown>;
}) {
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

// "all" = no filter; "inbox" = projectId is null; "today"/"week" = planner views by scheduledFor; number = a specific project's id
type TaskFilter = "all" | "inbox" | "today" | "week" | number;

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayLocal(): string {
  return formatLocalDate(new Date());
}

// Monday-first 7-day window covering the current local week.
function weekDaysLocal(): string[] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const offsetToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetToMon);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(formatLocalDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
  }
  return days;
}

function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function parseFilter(v: string): TaskFilter {
  if (v === "all" || v === "inbox" || v === "today" || v === "week") return v;
  return Number(v);
}

function serializeFilter(f: TaskFilter): string {
  return typeof f === "number" ? String(f) : f;
}

function totalMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const remainder = m % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function TasksSection({ projectsState }: { projectsState: ProjectsState }) {
  const { state, createTask, updateTask, deleteTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const projects = projectsState.status === "ready" ? projectsState.projects : [];
  const projectsById = useMemo(() => {
    const map = new Map<number, Project>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  // Computed once on mount; if you keep the page open past midnight, refresh to get a new "today".
  const today = useMemo(() => todayLocal(), []);
  const weekDays = useMemo(() => weekDaysLocal(), []);

  const visibleTasks = useMemo(() => {
    if (state.status !== "ready") return [];
    if (filter === "all") return state.tasks;
    if (filter === "inbox") return state.tasks.filter((t) => t.projectId === null);
    if (filter === "today") return state.tasks.filter((t) => t.scheduledFor === today);
    if (filter === "week")
      return state.tasks.filter((t) => t.scheduledFor !== null && weekDays.includes(t.scheduledFor));
    return state.tasks.filter((t) => t.projectId === filter);
  }, [state, filter, today, weekDays]);

  const weekTotals = useMemo(() => {
    if (filter !== "week") return new Map<string, number>();
    const map = new Map<string, number>();
    for (const day of weekDays) map.set(day, 0);
    for (const t of visibleTasks) {
      if (t.scheduledFor && map.has(t.scheduledFor)) {
        map.set(t.scheduledFor, (map.get(t.scheduledFor) ?? 0) + (t.estimatedMinutes ?? 0));
      }
    }
    return map;
  }, [filter, visibleTasks, weekDays]);

  const todayTotal = filter === "today" ? totalMinutes(visibleTasks) : 0;

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createTask(newProjectId === null ? { title } : { title, projectId: newProjectId });
      setNewTitle("");
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <select
          value={serializeFilter(filter)}
          onChange={(e) => setFilter(parseFilter(e.target.value))}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="inbox">Inbox</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={onCreate} className="flex gap-2 mb-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs doing?"
          disabled={creating}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <select
          value={newProjectId === null ? "" : String(newProjectId)}
          onChange={(e) => setNewProjectId(e.target.value === "" ? null : Number(e.target.value))}
          disabled={creating}
          className="rounded border px-2 py-2 text-sm"
        >
          <option value="">Inbox</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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

      {state.status === "ready" && filter === "today" && (
        <div className="mb-3 text-sm text-zinc-600">
          {dayLabel(today)} · Today
          {todayTotal > 0 && ` · ${formatMinutes(todayTotal)} scheduled`}
        </div>
      )}

      {state.status === "ready" &&
        filter !== "week" &&
        (visibleTasks.length === 0 ? (
          <div className="text-sm text-zinc-500">
            No tasks{filter === "all" ? "" : " here"} yet.
          </div>
        ) : (
          <ul className="divide-y border rounded bg-white">
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={task.projectId !== null ? projectsById.get(task.projectId) : undefined}
                showProjectBadge={filter === "all" || filter === "today"}
                onUpdate={(input) => updateTask(task.id, input)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </ul>
        ))}

      {state.status === "ready" && filter === "week" && (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dayTasks = visibleTasks.filter((t) => t.scheduledFor === day);
            const isToday = day === today;
            const dayTotal = weekTotals.get(day) ?? 0;
            return (
              <div key={day}>
                <h3
                  className={`text-sm mb-2 ${
                    isToday ? "font-semibold text-zinc-900" : "text-zinc-600"
                  }`}
                >
                  {dayLabel(day)}
                  {isToday ? " · Today" : ""}
                  {dayTotal > 0 && (
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      {formatMinutes(dayTotal)}
                    </span>
                  )}
                </h3>
                {dayTasks.length === 0 ? (
                  <div className="text-xs text-zinc-400">No tasks</div>
                ) : (
                  <ul className="divide-y border rounded bg-white">
                    {dayTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        project={
                          task.projectId !== null ? projectsById.get(task.projectId) : undefined
                        }
                        showProjectBadge={true}
                        onUpdate={(input) => updateTask(task.id, input)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const MAX_ESTIMATED_MINUTES = 7 * 24 * 60;

function TaskRow({
  task,
  project,
  showProjectBadge,
  onUpdate,
  onDelete,
}: {
  task: Task;
  project: Project | undefined;
  showProjectBadge: boolean;
  onUpdate: (input: UpdateTaskInput) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [minutes, setMinutes] = useState(task.estimatedMinutes?.toString() ?? "");

  useEffect(() => {
    setMinutes(task.estimatedMinutes?.toString() ?? "");
  }, [task.estimatedMinutes]);

  function commitMinutes() {
    const trimmed = minutes.trim();
    if (trimmed === "") {
      if (task.estimatedMinutes !== null) onUpdate({ estimatedMinutes: null });
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 1 || n > MAX_ESTIMATED_MINUTES) {
      setMinutes(task.estimatedMinutes?.toString() ?? "");
      return;
    }
    if (n !== task.estimatedMinutes) onUpdate({ estimatedMinutes: n });
  }

  return (
    <li className="flex items-center gap-2 p-3 text-sm">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onUpdate({ completed: e.target.checked })}
        className="h-4 w-4"
      />
      <span className={task.completed ? "flex-1 line-through text-zinc-400" : "flex-1"}>
        {task.title}
      </span>
      <input
        type="date"
        value={task.scheduledFor ?? ""}
        onChange={(e) => onUpdate({ scheduledFor: e.target.value || null })}
        aria-label="Scheduled date"
        className="rounded border px-2 py-1 text-xs"
      />
      <input
        type="number"
        min={1}
        max={MAX_ESTIMATED_MINUTES}
        placeholder="min"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        onBlur={commitMinutes}
        aria-label="Estimated minutes"
        className="w-16 rounded border px-2 py-1 text-xs"
      />
      {showProjectBadge && (
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {project ? project.name : "Inbox"}
        </span>
      )}
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
