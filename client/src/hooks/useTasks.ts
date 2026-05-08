import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import * as tasksApi from "@/api/tasks";

export type TasksState =
  | { status: "loading" }
  | { status: "ready"; tasks: tasksApi.Task[] }
  | { status: "error"; message: string };

export function useTasks() {
  const [state, setState] = useState<TasksState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    tasksApi
      .listTasks()
      .then((tasks) => {
        if (!cancelled) setState({ status: "ready", tasks });
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
      prev.status === "ready" ? { ...prev, tasks: [...prev.tasks, created] } : prev,
    );
    return created;
  }, []);

  const updateTask = useCallback(async (id: number, input: tasksApi.UpdateTaskInput) => {
    const updated = await tasksApi.updateTask(id, input);
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, tasks: prev.tasks.map((t) => (t.id === id ? updated : t)) }
        : prev,
    );
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await tasksApi.deleteTask(id);
    setState((prev) =>
      prev.status === "ready" ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) } : prev,
    );
  }, []);

  return { state, createTask, updateTask, deleteTask };
}
