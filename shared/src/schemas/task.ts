import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(10000).optional(),
  projectId: z.number().int().positive().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  position: z.number().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().max(10000).nullable().optional(),
    projectId: z.number().int().positive().nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
    completed: z.boolean().optional(),
    position: z.number().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const setTaskLabelsSchema = z.object({
  labelIds: z.array(z.number().int().positive()).max(50),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type SetTaskLabelsInput = z.infer<typeof setTaskLabelsSchema>;
