import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { dayMonthDay, dayShortName, formatMinutes, totalMinutes } from "@/lib/tasks";
import type { Task, UpdateTaskInput } from "@/api/tasks";

export function DayColumn({
  columnId,
  day,
  isToday,
  tasks,
  onUpdate,
  onDelete,
}: {
  columnId: string;
  day: string;
  isToday: boolean;
  tasks: Task[];
  onUpdate: (id: number, input: UpdateTaskInput) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const dayTotal = totalMinutes(tasks);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
        isToday ? "border-zinc-300 ring-1 ring-zinc-200" : "border-zinc-200"
      } ${isOver ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
    >
      <div
        className={`h-1 ${isToday ? "bg-zinc-900" : "bg-transparent"}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 px-2.5 py-2">
        <div className="min-w-0">
          <div
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              isToday ? "text-zinc-900" : "text-zinc-500"
            }`}
          >
            {dayShortName(day)}
          </div>
          <div className="text-[11px] tabular-nums text-zinc-500">{dayMonthDay(day)}</div>
        </div>
        {dayTotal > 0 && (
          <div className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-600">
            {formatMinutes(dayTotal)}
          </div>
        )}
      </div>
      <div className="flex-1 p-1.5 min-h-[16rem]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1.5">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={(input) => onUpdate(task.id, input)}
                onDelete={() => onDelete(task.id)}
              />
            ))}
          </ul>
        </SortableContext>
        {tasks.length === 0 && (
          <div className="px-1 py-3 text-center text-[10px] text-zinc-400">
            Drop or add a task
          </div>
        )}
      </div>
    </div>
  );
}
