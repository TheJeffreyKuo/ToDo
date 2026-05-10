import { useRef, useState, type KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimePicker } from "@/components/TimePicker";
import type { Task, UpdateTaskInput } from "@/api/tasks";

export function TaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onUpdate: (input: UpdateTaskInput) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const isCancellingTitleRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  function startEditingTitle() {
    setTitleDraft(task.title);
    setIsEditingTitle(true);
  }

  function commitTitle() {
    if (isCancellingTitleRef.current) {
      isCancellingTitleRef.current = false;
      return;
    }
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(task.title);
    } else if (trimmed !== task.title) {
      onUpdate({ title: trimmed });
    }
    setIsEditingTitle(false);
  }

  function cancelTitle() {
    isCancellingTitleRef.current = true;
    setTitleDraft(task.title);
    setIsEditingTitle(false);
  }

  function onTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelTitle();
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs shadow-sm transition-colors hover:border-zinc-300"
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          className="cursor-grab select-none leading-none text-zinc-200 transition-colors group-hover:text-zinc-500 group-focus-within:text-zinc-500 active:cursor-grabbing [@media(hover:none)]:text-zinc-400"
        >
          ⋮⋮
        </button>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onUpdate({ completed: e.target.checked })}
          className="mt-0.5 h-3.5 w-3.5"
          aria-label="Completed"
        />
        {isEditingTitle ? (
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={onTitleKeyDown}
            autoFocus
            aria-label="Title"
            className="min-w-0 flex-1 rounded border px-1 py-0.5 text-xs"
          />
        ) : (
          <button
            type="button"
            onClick={startEditingTitle}
            className={`min-w-0 flex-1 break-words text-left ${
              task.completed ? "line-through text-zinc-400" : ""
            }`}
            title="Click to edit"
          >
            {task.title}
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 pl-5">
        <TimePicker
          minutes={task.estimatedMinutes}
          onChange={(next) => onUpdate({ estimatedMinutes: next })}
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this task?")) onDelete();
          }}
          aria-label="Delete task"
          className="rounded text-zinc-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
        >
          ×
        </button>
      </div>
    </li>
  );
}
