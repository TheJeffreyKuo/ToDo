import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import * as projectsApi from "@/api/projects";

type State =
  | { status: "loading" }
  | { status: "ready"; projects: projectsApi.Project[] }
  | { status: "error"; message: string };

export function useProjects() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .listProjects()
      .then((projects) => {
        if (!cancelled) setState({ status: "ready", projects });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Failed to load projects";
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createProject = useCallback(async (input: projectsApi.CreateProjectInput) => {
    const created = await projectsApi.createProject(input);
    setState((prev) =>
      prev.status === "ready" ? { ...prev, projects: [...prev.projects, created] } : prev,
    );
    return created;
  }, []);

  const updateProject = useCallback(async (id: number, input: projectsApi.UpdateProjectInput) => {
    const updated = await projectsApi.updateProject(id, input);
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, projects: prev.projects.map((p) => (p.id === id ? updated : p)) }
        : prev,
    );
    return updated;
  }, []);

  const deleteProject = useCallback(async (id: number) => {
    await projectsApi.deleteProject(id);
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, projects: prev.projects.filter((p) => p.id !== id) }
        : prev,
    );
  }, []);

  return { state, createProject, updateProject, deleteProject };
}
