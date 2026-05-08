import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { SortableTaskList } from "@/components/SortableTaskList";
import { TaskCard } from "@/components/TaskCard";
import { TimePicker } from "@/components/TimePicker";
import { useTasks } from "@/hooks/useTasks";
import {
  dayLabel,
  formatMinutes,
  mondayOfWeek,
  shiftWeek,
  todayLocal,
  totalMinutes,
  weekDaysFromMonday,
  weekRangeLabel,
} from "@/lib/tasks";
import type { CreateTaskInput } from "@/api/tasks";

export default function HomePage() {
  const { state: authState, logout } = useAuth();
  const tasksHook = useTasks();
  const [weekStart, setWeekStart] = useState<string>(() => mondayOfWeek());
  const today = useMemo(() => todayLocal(), []);
  const weekDays = useMemo(() => weekDaysFromMonday(weekStart), [weekStart]);

  const [newTitle, setNewTitle] = useState("");
  const [newScheduledFor, setNewScheduledFor] = useState<string>("");
  const [newMinutes, setNewMinutes] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (authState.status !== "authenticated") return null;

  const tasksState = tasksHook.state;
  const tasks = tasksState.status === "ready" ? tasksState.tasks : [];

  const tasksByDay = new Map<string, typeof tasks>();
  for (const day of weekDays) tasksByDay.set(day, []);
  for (const t of tasks) {
    if (t.scheduledFor && tasksByDay.has(t.scheduledFor)) {
      tasksByDay.get(t.scheduledFor)!.push(t);
    }
  }

  const backlog = tasks.filter((t) => t.scheduledFor === null);
  const backlogTotal = totalMinutes(backlog);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      const input: CreateTaskInput = { title };
      if (newScheduledFor) input.scheduledFor = newScheduledFor;
      if (newMinutes !== null) input.estimatedMinutes = newMinutes;
      await tasksHook.createTask(input);
      setNewTitle("");
      setNewScheduledFor("");
      setNewMinutes(null);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen p-6 text-zinc-900">
      <header className="flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold">ToDo</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/settings" className="rounded border px-3 py-1 hover:bg-zinc-50">
            Settings
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

      <main className="max-w-7xl mx-auto mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
            className="rounded border px-2 py-1 text-sm hover:bg-zinc-50"
            aria-label="Previous week"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(mondayOfWeek())}
            className="rounded border px-3 py-1 text-sm hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            className="rounded border px-2 py-1 text-sm hover:bg-zinc-50"
            aria-label="Next week"
          >
            →
          </button>
          <h2 className="ml-2 text-lg font-medium tabular-nums">{weekRangeLabel(weekStart)}</h2>
        </div>

        <form onSubmit={onCreate} className="flex flex-wrap gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs doing?"
            disabled={creating}
            className="flex-1 min-w-[16rem] rounded border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={newScheduledFor}
            onChange={(e) => setNewScheduledFor(e.target.value)}
            disabled={creating}
            aria-label="Scheduled date"
            className="rounded border px-2 py-2 text-sm"
          />
          <TimePicker minutes={newMinutes} onChange={setNewMinutes} disabled={creating} />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="rounded bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {createError && <div className="text-sm text-red-600">{createError}</div>}

        {tasksState.status === "loading" && (
          <div className="text-sm text-zinc-500">Loading…</div>
        )}
        {tasksState.status === "error" && (
          <div className="text-sm text-red-600">{tasksState.message}</div>
        )}

        {tasksState.status === "ready" && (
          <>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayTasks = tasksByDay.get(day) ?? [];
                const isToday = day === today;
                const dayTotal = totalMinutes(dayTasks);
                return (
                  <div
                    key={day}
                    className={`flex flex-col rounded-lg border ${
                      isToday
                        ? "border-zinc-900 bg-amber-50/60"
                        : "border-zinc-200 bg-zinc-50/60"
                    }`}
                  >
                    <div
                      className={`border-b px-2 py-1.5 ${
                        isToday ? "border-zinc-900/20" : "border-zinc-200"
                      }`}
                    >
                      <div
                        className={`text-xs ${
                          isToday ? "font-semibold text-zinc-900" : "text-zinc-600"
                        }`}
                      >
                        {dayLabel(day)}
                      </div>
                      <div className="text-[10px] text-zinc-500 tabular-nums">
                        {dayTotal > 0 ? formatMinutes(dayTotal) : "—"}
                      </div>
                    </div>
                    <div className="flex-1 p-1.5 min-h-[16rem]">
                      {dayTasks.length === 0 ? (
                        <div className="text-[10px] text-zinc-400 px-1 py-2">No tasks</div>
                      ) : (
                        <SortableTaskList tasks={dayTasks} onUpdateTask={tasksHook.updateTask}>
                          <ul className="space-y-1.5">
                            {dayTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onUpdate={(input) => tasksHook.updateTask(task.id, input)}
                                onDelete={() => tasksHook.deleteTask(task.id)}
                              />
                            ))}
                          </ul>
                        </SortableTaskList>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {backlog.length > 0 && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/60">
                <div className="flex items-baseline justify-between border-b border-zinc-200 px-3 py-2">
                  <h3 className="text-sm font-medium text-zinc-700">Unscheduled</h3>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {backlog.length} task{backlog.length === 1 ? "" : "s"}
                    {backlogTotal > 0 ? ` · ${formatMinutes(backlogTotal)}` : ""}
                  </span>
                </div>
                <div className="p-2">
                  <SortableTaskList tasks={backlog} onUpdateTask={tasksHook.updateTask}>
                    <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {backlog.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdate={(input) => tasksHook.updateTask(task.id, input)}
                          onDelete={() => tasksHook.deleteTask(task.id)}
                        />
                      ))}
                    </ul>
                  </SortableTaskList>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
