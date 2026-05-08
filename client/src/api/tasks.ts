import { api } from "./client";

export type TaskLabel = {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  scheduledFor: string | null;
  estimatedMinutes: number | null;
  position: number;
  labels: TaskLabel[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  scheduledFor?: string;
  estimatedMinutes?: number;
  position?: number;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  scheduledFor?: string | null;
  estimatedMinutes?: number | null;
  completed?: boolean;
  position?: number;
};

export async function listTasks(): Promise<Task[]> {
  const { tasks } = await api<{ tasks: Task[] }>("/api/tasks");
  return tasks;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { task } = await api<{ task: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return task;
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  const { task } = await api<{ task: Task }>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return task;
}

export async function deleteTask(id: number): Promise<void> {
  await api(`/api/tasks/${id}`, { method: "DELETE" });
}
