import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { dayLabel, formatMinutes, totalMinutes } from "@/lib/tasks";
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
      className={`flex flex-col rounded-lg border transition-colors ${
        isToday ? "border-zinc-900 bg-amber-50/60" : "border-zinc-200 bg-zinc-50/60"
      } ${isOver ? "ring-2 ring-blue-400/60 ring-offset-1" : ""}`}
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
          <div className="text-[10px] text-zinc-400 px-1 py-2">No tasks</div>
        )}
      </div>
    </div>
  );
}
