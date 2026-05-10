import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { QuickAdd } from "@/components/QuickAdd";
import { TaskCard } from "@/components/TaskCard";
import { formatMinutes, totalMinutes } from "@/lib/tasks";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/api/tasks";

export function BacklogColumn({
  columnId,
  tasks,
  onCreate,
  onUpdate,
  onDelete,
}: {
  columnId: string;
  tasks: Task[];
  onCreate: (input: CreateTaskInput) => Promise<unknown>;
  onUpdate: (id: number, input: UpdateTaskInput) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const total = totalMinutes(tasks);

  return (
    <div
      ref={setNodeRef}
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
        isOver
          ? "border-blue-300 ring-2 ring-blue-400 ring-offset-1"
          : "border-zinc-200"
      }`}
    >
      <div className="flex items-baseline justify-between border-b border-zinc-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
          Unscheduled
        </h3>
        <span className="text-xs tabular-nums text-zinc-500">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
          {total > 0 ? ` · ${formatMinutes(total)}` : ""}
        </span>
      </div>
      <div className="space-y-2 p-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={rectSortingStrategy}
        >
          {tasks.length > 0 && (
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
          )}
        </SortableContext>
        <div className="max-w-xs">
          <QuickAdd scheduledFor={null} onCreate={onCreate} />
        </div>
        {tasks.length === 0 && (
          <div className="px-1 pb-1 text-center text-xs text-zinc-400">
            Drop tasks here to unschedule
          </div>
        )}
      </div>
    </div>
  );
}
