import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import * as labelsApi from "@/api/labels";

type State =
  | { status: "loading" }
  | { status: "ready"; labels: labelsApi.Label[] }
  | { status: "error"; message: string };

export function useLabels() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    labelsApi
      .listLabels()
      .then((labels) => {
        if (!cancelled) setState({ status: "ready", labels });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Failed to load labels";
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createLabel = useCallback(async (input: labelsApi.CreateLabelInput) => {
    const created = await labelsApi.createLabel(input);
    setState((prev) =>
      prev.status === "ready" ? { ...prev, labels: [...prev.labels, created] } : prev,
    );
    return created;
  }, []);

  const deleteLabel = useCallback(async (id: number) => {
    await labelsApi.deleteLabel(id);
    setState((prev) =>
      prev.status === "ready" ? { ...prev, labels: prev.labels.filter((l) => l.id !== id) } : prev,
    );
  }, []);

  return { state, createLabel, deleteLabel };
}
