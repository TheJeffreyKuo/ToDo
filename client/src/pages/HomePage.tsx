import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { BacklogColumn } from "@/components/BacklogColumn";
import { DayColumn } from "@/components/DayColumn";
import { TaskCardPreview } from "@/components/TaskCardPreview";
import { TimePicker } from "@/components/TimePicker";
import { useTasks } from "@/hooks/useTasks";
import {
  mondayOfWeek,
  positionBetween,
  shiftWeek,
  todayLocal,
  weekDaysFromMonday,
  weekRangeLabel,
} from "@/lib/tasks";
import type { CreateTaskInput, Task } from "@/api/tasks";

const BACKLOG_COLUMN_ID = "col:backlog";
const dayColumnId = (day: string): string => `col:${day}`;

type Column = {
  id: string;
  scheduledFor: string | null;
  tasks: Task[];
};

export default function HomePage() {
  const { state: authState, logout } = useAuth();
  const tasksHook = useTasks();
  const [weekStart, setWeekStart] = useState<string>(() => mondayOfWeek());
  const today = useMemo(() => todayLocal(), []);
  const weekDays = useMemo(() => weekDaysFromMonday(weekStart), [weekStart]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newScheduledFor, setNewScheduledFor] = useState<string>("");
  const [newMinutes, setNewMinutes] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (authState.status !== "authenticated") return null;

  const tasksState = tasksHook.state;
  const tasks = tasksState.status === "ready" ? tasksState.tasks : [];

  // Server already returns tasks ordered by ascending position; preserve that when grouping.
  const columns: Column[] = [
    ...weekDays.map((day) => ({
      id: dayColumnId(day),
      scheduledFor: day as string | null,
      tasks: tasks.filter((t) => t.scheduledFor === day),
    })),
    {
      id: BACKLOG_COLUMN_ID,
      scheduledFor: null,
      tasks: tasks.filter((t) => t.scheduledFor === null),
    },
  ];

  const backlogTasks = columns[columns.length - 1]!.tasks;
  const activeTask: Task | null =
    activeId !== null ? tasks.find((t) => t.id === activeId) ?? null : null;

  function findColumnByTaskId(id: number): Column | undefined {
    return columns.find((c) => c.tasks.some((t) => t.id === id));
  }
  function findColumnById(id: string): Column | undefined {
    return columns.find((c) => c.id === id);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }
  function onDragCancel() {
    setActiveId(null);
  }
  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = Number(active.id);
    const activeT = tasks.find((t) => t.id === activeTaskId);
    if (!activeT) return;

    const sourceColumn = findColumnByTaskId(activeTaskId);
    if (!sourceColumn) return;

    let destColumn: Column | undefined;
    let destIndex: number;
    const overId = String(over.id);

    if (overId.startsWith("col:")) {
      destColumn = findColumnById(overId);
      destIndex = destColumn?.tasks.length ?? 0;
    } else {
      const overTaskId = Number(over.id);
      destColumn = findColumnByTaskId(overTaskId);
      if (!destColumn) return;
      destIndex = destColumn.tasks.findIndex((t) => t.id === overTaskId);
    }
    if (!destColumn) return;

    const sourceIndex = sourceColumn.tasks.findIndex((t) => t.id === activeTaskId);

    if (sourceColumn.id === destColumn.id) {
      if (sourceIndex === destIndex) return;
      const reordered = arrayMove(sourceColumn.tasks, sourceIndex, destIndex);
      const finalIdx = reordered.findIndex((t) => t.id === activeTaskId);
      const prev = reordered[finalIdx - 1];
      const next = reordered[finalIdx + 1];
      void tasksHook.updateTask(activeTaskId, {
        position: positionBetween(prev?.position, next?.position),
      });
    } else {
      const newDestList = [...destColumn.tasks];
      newDestList.splice(destIndex, 0, activeT);
      const finalIdx = newDestList.findIndex((t) => t.id === activeTaskId);
      const prev = newDestList[finalIdx - 1];
      const next = newDestList[finalIdx + 1];
      void tasksHook.updateTask(activeTaskId, {
        position: positionBetween(prev?.position, next?.position),
        scheduledFor: destColumn.scheduledFor,
      });
    }
  }

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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <h1 className="text-xl font-semibold tracking-tight">ToDo</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/settings"
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
            >
              Settings
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

      <main className="mx-auto max-w-7xl space-y-4 px-6 py-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50"
            aria-label="Previous week"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(mondayOfWeek())}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50"
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
            className="min-w-[16rem] flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <input
            type="date"
            value={newScheduledFor}
            onChange={(e) => setNewScheduledFor(e.target.value)}
            disabled={creating}
            aria-label="Scheduled date"
            className="rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <TimePicker minutes={newMinutes} onChange={setNewMinutes} disabled={creating} />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const col = columns.find((c) => c.scheduledFor === day)!;
                return (
                  <DayColumn
                    key={day}
                    columnId={col.id}
                    day={day}
                    isToday={day === today}
                    tasks={col.tasks}
                    onUpdate={tasksHook.updateTask}
                    onDelete={tasksHook.deleteTask}
                  />
                );
              })}
            </div>

            <BacklogColumn
              columnId={BACKLOG_COLUMN_ID}
              tasks={backlogTasks}
              onUpdate={tasksHook.updateTask}
              onDelete={tasksHook.deleteTask}
            />

            <DragOverlay>
              {activeTask ? <TaskCardPreview task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}
