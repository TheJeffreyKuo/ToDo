import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Label } from "@/api/labels";
import type { Project } from "@/api/projects";
import type { Task, UpdateTaskInput } from "@/api/tasks";

const MAX_ESTIMATED_MINUTES = 7 * 24 * 60;

export function TaskRow({
  task,
  project,
  showProjectBadge,
  availableLabels,
  onUpdate,
  onSetLabels,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  task: Task;
  project: Project | undefined;
  showProjectBadge: boolean;
  availableLabels: Label[];
  onUpdate: (input: UpdateTaskInput) => Promise<unknown>;
  onSetLabels: (labelIds: number[]) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onMoveUp?: (() => void) | undefined;
  onMoveDown?: (() => void) | undefined;
}) {
  const [minutes, setMinutes] = useState(task.estimatedMinutes?.toString() ?? "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState(task.description ?? "");
  // Set true to skip the commit that an Escape-triggered unmount may otherwise schedule.
  const isCancellingTitleRef = useRef(false);

  useEffect(() => {
    setMinutes(task.estimatedMinutes?.toString() ?? "");
  }, [task.estimatedMinutes]);

  useEffect(() => {
    setDescription(task.description ?? "");
  }, [task.description]);

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

  function commitDescription() {
    const trimmed = description.trim();
    const next = trimmed === "" ? null : trimmed;
    if (next !== task.description) onUpdate({ description: next });
  }

  function toggleLabel(labelId: number) {
    const next = new Set(task.labels.map((l) => l.id));
    if (next.has(labelId)) next.delete(labelId);
    else next.add(labelId);
    onSetLabels([...next]);
  }

  return (
    <li className="text-sm">
      <div className="flex items-center gap-2 p-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onUpdate({ completed: e.target.checked })}
          className="h-4 w-4"
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
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={startEditingTitle}
            className={`flex-1 text-left truncate ${
              task.completed ? "line-through text-zinc-400" : ""
            }`}
            title="Click to edit"
          >
            {task.title}
          </button>
        )}
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
        <button
          type="button"
          onClick={() => onMoveUp?.()}
          disabled={!onMoveUp}
          aria-label="Move up"
          className="text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMoveDown?.()}
          disabled={!onMoveDown}
          aria-label="Move down"
          className="text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
          className="text-zinc-500 hover:text-zinc-900"
        >
          {isExpanded ? "▾" : "▸"}
        </button>
        <button
          onClick={() => {
            if (window.confirm("Delete this task?")) onDelete();
          }}
          className="text-zinc-500 hover:text-red-600"
        >
          Delete
        </button>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={commitDescription}
            placeholder="Description"
            aria-label="Description"
            rows={3}
            className="w-full rounded border px-2 py-1 text-xs"
          />
          {availableLabels.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Labels</div>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((l) => {
                  const checked = task.labels.some((tl) => tl.id === l.id);
                  return (
                    <label key={l.id} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLabel(l.id)}
                        className="h-3 w-3"
                      />
                      <span
                        className="rounded px-2 py-0.5"
                        style={{
                          background: l.color ?? "#e4e4e7",
                          color: l.color ? "#fff" : "#3f3f46",
                        }}
                      >
                        {l.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
