import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import * as tasksApi from "@/api/tasks";

export type TasksState =
  | { status: "loading" }
  | { status: "ready"; tasks: tasksApi.Task[] }
  | { status: "error"; message: string };

// Invariant: tasks in state are always sorted by ascending position. The week-grid renderer
// groups tasks by day in array order rather than re-sorting per column, so this hook owns it.
function sortTasks(tasks: tasksApi.Task[]): tasksApi.Task[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

export function useTasks() {
  const [state, setState] = useState<TasksState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    tasksApi
      .listTasks()
      .then((tasks) => {
        if (!cancelled) setState({ status: "ready", tasks: sortTasks(tasks) });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Failed to load tasks";
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createTask = useCallback(async (input: tasksApi.CreateTaskInput) => {
    const created = await tasksApi.createTask(input);
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, tasks: sortTasks([...prev.tasks, created]) }
        : prev,
    );
    return created;
  }, []);

  const updateTask = useCallback(async (id: number, input: tasksApi.UpdateTaskInput) => {
    let previous: tasksApi.Task | undefined;
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const found = prev.tasks.find((t) => t.id === id);
      if (!found) return prev;
      previous = found;
      const optimistic = { ...found, ...input } as tasksApi.Task;
      return {
        ...prev,
        tasks: sortTasks(prev.tasks.map((t) => (t.id === id ? optimistic : t))),
      };
    });
    try {
      const updated = await tasksApi.updateTask(id, input);
      setState((prev) =>
        prev.status === "ready"
          ? { ...prev, tasks: sortTasks(prev.tasks.map((t) => (t.id === id ? updated : t))) }
          : prev,
      );
      return updated;
    } catch (err) {
      if (previous) {
        const reverted = previous;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, tasks: sortTasks(prev.tasks.map((t) => (t.id === id ? reverted : t))) }
            : prev,
        );
      }
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await tasksApi.deleteTask(id);
    setState((prev) =>
      prev.status === "ready" ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) } : prev,
    );
  }, []);

  return { state, createTask, updateTask, deleteTask };
}
