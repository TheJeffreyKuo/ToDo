import { formatMinutes } from "@/lib/tasks";
import type { Task } from "@/api/tasks";

export function TaskCardPreview({ task }: { task: Task }) {
  return (
    <div className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs shadow-lg">
      <div className="flex items-start gap-1.5">
        <span className="select-none leading-none text-zinc-300">⋮⋮</span>
        <input
          type="checkbox"
          checked={task.completed}
          readOnly
          className="mt-0.5 h-3.5 w-3.5"
          aria-hidden
        />
        <span
          className={`min-w-0 flex-1 break-words ${
            task.completed ? "line-through text-zinc-400" : ""
          }`}
        >
          {task.title}
        </span>
      </div>
      <div className="mt-1.5 pl-5 text-xs tabular-nums text-zinc-600">
        {task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : "—"}
      </div>
    </div>
  );
}
