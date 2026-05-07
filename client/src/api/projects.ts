import { api } from "./client";

export type Project = {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  color?: string;
};

export type UpdateProjectInput = {
  name?: string;
  color?: string | null;
};

export async function listProjects(): Promise<Project[]> {
  const { projects } = await api<{ projects: Project[] }>("/api/projects");
  return projects;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { project } = await api<{ project: Project }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return project;
}

export async function updateProject(id: number, input: UpdateProjectInput): Promise<Project> {
  const { project } = await api<{ project: Project }>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return project;
}

export async function deleteProject(id: number): Promise<void> {
  await api(`/api/projects/${id}`, { method: "DELETE" });
}
