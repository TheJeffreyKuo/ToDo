import { useState, type KeyboardEvent } from "react";
import { ApiError } from "@/api/client";
import type { CreateTaskInput } from "@/api/tasks";

export function QuickAdd({
  scheduledFor,
  onCreate,
}: {
  scheduledFor: string | null;
  onCreate: (input: CreateTaskInput) => Promise<unknown>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit({ close }: { close: boolean }) {
    const trimmed = title.trim();
    if (!trimmed) {
      if (close) setIsOpen(false);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const input: CreateTaskInput = { title: trimmed };
      if (scheduledFor) input.scheduledFor = scheduledFor;
      await onCreate(input);
      setTitle("");
      if (close) setIsOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add task");
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit({ close: false });
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTitle("");
      setError(null);
      setIsOpen(false);
    }
  }

  function onBlur() {
    if (!creating) void submit({ close: true });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-md border border-dashed border-zinc-200 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-600"
      >
        + Add task
      </button>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoFocus
        placeholder="Task title"
        disabled={creating}
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50"
      />
      {error && <div className="mt-0.5 text-[10px] text-red-600">{error}</div>}
    </div>
  );
}
