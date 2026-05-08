import { api } from "./client";

export type Label = {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
};

export type CreateLabelInput = {
  name: string;
  color?: string;
};

export async function listLabels(): Promise<Label[]> {
  const { labels } = await api<{ labels: Label[] }>("/api/labels");
  return labels;
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  const { label } = await api<{ label: Label }>("/api/labels", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return label;
}

export async function deleteLabel(id: number): Promise<void> {
  await api(`/api/labels/${id}`, { method: "DELETE" });
}
