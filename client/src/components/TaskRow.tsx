import { useEffect, useState } from "react";
import type { Project } from "@/api/projects";
import type { Task, UpdateTaskInput } from "@/api/tasks";

const MAX_ESTIMATED_MINUTES = 7 * 24 * 60;

export function TaskRow({
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
