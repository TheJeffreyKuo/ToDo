import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { TaskRow } from "@/components/TaskRow";
import { useLabels } from "@/hooks/useLabels";
import { useProjects } from "@/hooks/useProjects";
import { useTasks, type TasksState } from "@/hooks/useTasks";
import {
  formatMinutes,
  formatSummary,
  nextPositionForMove,
  summariesByProject,
  totalMinutes,
  type TaskSummary,
} from "@/lib/tasks";
import type { Label } from "@/api/labels";
import type { Project } from "@/api/projects";
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from "@/api/tasks";

type ProjectsState =
  | { status: "loading" }
  | { status: "ready"; projects: Project[] }
  | { status: "error"; message: string };

type LabelsState =
  | { status: "loading" }
  | { status: "ready"; labels: Label[] }
  | { status: "error"; message: string };

export default function HomePage() {
  const { state: authState, logout } = useAuth();
  const projectsHook = useProjects();
  const labelsHook = useLabels();
  const tasksHook = useTasks();

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
          tasksState={tasksHook.state}
          createProject={projectsHook.createProject}
          deleteProject={projectsHook.deleteProject}
        />
        <LabelsSection
          state={labelsHook.state}
          createLabel={labelsHook.createLabel}
          deleteLabel={labelsHook.deleteLabel}
        />
        <TasksSection
          projectsState={projectsHook.state}
          labelsState={labelsHook.state}
          tasksState={tasksHook.state}
          createTask={tasksHook.createTask}
          updateTask={tasksHook.updateTask}
          deleteTask={tasksHook.deleteTask}
          setTaskLabels={tasksHook.setTaskLabels}
        />
      </main>
    </div>
  );
}

function ProjectsSection({
  state,
  tasksState,
  createProject,
  deleteProject,
}: {
  state: ProjectsState;
  tasksState: TasksState;
  createProject: (input: { name: string }) => Promise<unknown>;
  deleteProject: (id: number) => Promise<unknown>;
}) {
  const summaries = useMemo<Map<number, TaskSummary>>(
    () =>
      tasksState.status === "ready" ? summariesByProject(tasksState.tasks) : new Map(),
    [tasksState],
  );
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
          {state.projects.map((p) => {
            const summary = summaries.get(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                <Link
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  {p.color && (
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: p.color }}
                    />
                  )}
                  <span>{p.name}</span>
                </Link>
                <div className="flex items-center gap-3">
                  {summary && (
                    <span className="text-xs text-zinc-500">{formatSummary(summary)}</span>
                  )}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete this project? All tasks in it will be deleted too.",
                        )
                      ) {
                        deleteProject(p.id);
                      }
                    }}
                    className="text-zinc-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function LabelsSection({
  state,
  createLabel,
  deleteLabel,
}: {
  state: LabelsState;
  createLabel: (input: { name: string }) => Promise<unknown>;
  deleteLabel: (id: number) => Promise<unknown>;
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
      await createLabel({ name });
      setNewName("");
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
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

      {state.status === "loading" && <div className="text-sm text-zinc-500">Loading…</div>}
      {state.status === "error" && <div className="text-sm text-red-600">{state.message}</div>}
      {state.status === "ready" && state.labels.length === 0 && (
        <div className="text-sm text-zinc-500">No labels yet.</div>
      )}
      {state.status === "ready" && state.labels.length > 0 && (
        <ul className="divide-y border rounded bg-white">
          {state.labels.map((l) => (
            <li key={l.id} className="flex items-center justify-between p-3 text-sm">
              <span
                className="rounded px-2 py-0.5 text-xs"
                style={{ background: l.color ?? "#e4e4e7", color: l.color ? "#fff" : "#3f3f46" }}
              >
                {l.name}
              </span>
              <button
                onClick={() => {
                  if (window.confirm("Delete this label?")) deleteLabel(l.id);
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

function TasksSection({
  projectsState,
  labelsState,
  tasksState,
  createTask,
  updateTask,
  deleteTask,
  setTaskLabels,
}: {
  projectsState: ProjectsState;
  labelsState: LabelsState;
  tasksState: TasksState;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: number, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  setTaskLabels: (id: number, labelIds: number[]) => Promise<Task>;
}) {
  const state = tasksState;
  const availableLabels = labelsState.status === "ready" ? labelsState.labels : [];
  const [newTitle, setNewTitle] = useState("");
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const [newScheduledFor, setNewScheduledFor] = useState<string>("");
  const [newMinutes, setNewMinutes] = useState<string>("");
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

  const weekBacklog = useMemo(() => {
    if (filter !== "week" || state.status !== "ready") return [];
    return state.tasks.filter((t) => t.scheduledFor === null);
  }, [filter, state]);

  const todayTotal = filter === "today" ? totalMinutes(visibleTasks) : 0;
  const backlogTotal = totalMinutes(weekBacklog);

  function moveHandlers(list: Task[], idx: number) {
    const target = list[idx];
    if (!target) return { onMoveUp: undefined, onMoveDown: undefined };
    const upPos = nextPositionForMove(list, idx, "up");
    const downPos = nextPositionForMove(list, idx, "down");
    return {
      onMoveUp: upPos !== null ? () => void updateTask(target.id, { position: upPos }) : undefined,
      onMoveDown:
        downPos !== null ? () => void updateTask(target.id, { position: downPos }) : undefined,
    };
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      const input: CreateTaskInput = { title };
      if (newProjectId !== null) input.projectId = newProjectId;
      if (newScheduledFor) input.scheduledFor = newScheduledFor;
      if (newMinutes.trim()) {
        const n = Number(newMinutes.trim());
        if (Number.isInteger(n) && n >= 1 && n <= 7 * 24 * 60) input.estimatedMinutes = n;
      }
      await createTask(input);
      setNewTitle("");
      setNewScheduledFor("");
      setNewMinutes("");
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

      <form onSubmit={onCreate} className="flex flex-wrap gap-2 mb-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs doing?"
          disabled={creating}
          className="flex-1 min-w-[12rem] rounded border px-3 py-2 text-sm"
        />
        <select
          value={newProjectId === null ? "" : String(newProjectId)}
          onChange={(e) => setNewProjectId(e.target.value === "" ? null : Number(e.target.value))}
          disabled={creating}
          aria-label="Project"
          className="rounded border px-2 py-2 text-sm"
        >
          <option value="">Inbox</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={newScheduledFor}
          onChange={(e) => setNewScheduledFor(e.target.value)}
          disabled={creating}
          aria-label="Scheduled date"
          className="rounded border px-2 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          max={7 * 24 * 60}
          placeholder="min"
          value={newMinutes}
          onChange={(e) => setNewMinutes(e.target.value)}
          disabled={creating}
          aria-label="Estimated minutes"
          className="w-20 rounded border px-2 py-2 text-sm"
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
            {visibleTasks.map((task, idx) => (
              <TaskRow
                key={task.id}
                task={task}
                project={task.projectId !== null ? projectsById.get(task.projectId) : undefined}
                showProjectBadge={filter === "all" || filter === "today"}
                availableLabels={availableLabels}
                onUpdate={(input) => updateTask(task.id, input)}
                onSetLabels={(labelIds) => setTaskLabels(task.id, labelIds)}
                onDelete={() => deleteTask(task.id)}
                {...moveHandlers(visibleTasks, idx)}
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
                    {dayTasks.map((task, idx) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        project={
                          task.projectId !== null ? projectsById.get(task.projectId) : undefined
                        }
                        showProjectBadge={true}
                        availableLabels={availableLabels}
                        onUpdate={(input) => updateTask(task.id, input)}
                        onSetLabels={(labelIds) => setTaskLabels(task.id, labelIds)}
                        onDelete={() => deleteTask(task.id)}
                        {...moveHandlers(dayTasks, idx)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {weekBacklog.length > 0 && (
            <div>
              <h3 className="text-sm text-zinc-600 mb-2">
                Unscheduled
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  {weekBacklog.length} task{weekBacklog.length === 1 ? "" : "s"}
                  {backlogTotal > 0 ? ` · ${formatMinutes(backlogTotal)}` : ""}
                </span>
              </h3>
              <ul className="divide-y border rounded bg-white">
                {weekBacklog.map((task, idx) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={
                      task.projectId !== null ? projectsById.get(task.projectId) : undefined
                    }
                    showProjectBadge={true}
                    availableLabels={availableLabels}
                    onUpdate={(input) => updateTask(task.id, input)}
                    onSetLabels={(labelIds) => setTaskLabels(task.id, labelIds)}
                    onDelete={() => deleteTask(task.id)}
                    {...moveHandlers(weekBacklog, idx)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

