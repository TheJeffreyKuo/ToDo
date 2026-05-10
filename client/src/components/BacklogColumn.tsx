import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { formatMinutes, totalMinutes } from "@/lib/tasks";
import type { Task, UpdateTaskInput } from "@/api/tasks";

export function BacklogColumn({
  columnId,
  tasks,
  onUpdate,
  onDelete,
}: {
  columnId: string;
  tasks: Task[];
  onUpdate: (id: number, input: UpdateTaskInput) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const total = totalMinutes(tasks);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-zinc-50/60 transition-colors ${
        isOver
          ? "ring-2 ring-blue-400/60 ring-offset-1 border-blue-300"
          : "border-zinc-200"
      }`}
    >
      <div className="flex items-baseline justify-between border-b border-zinc-200 px-3 py-2">
        <h3 className="text-sm font-medium text-zinc-700">Unscheduled</h3>
        <span className="text-xs text-zinc-500 tabular-nums">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
          {total > 0 ? ` · ${formatMinutes(total)}` : ""}
        </span>
      </div>
      <div className="p-2 min-h-[5rem]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={rectSortingStrategy}
        >
          <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          <div className="px-1 py-3 text-center text-xs text-zinc-400">
            Drop tasks here to unschedule
          </div>
        )}
      </div>
    </div>
  );
}
