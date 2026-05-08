import { z } from "zod";

const MAX_ESTIMATED_MINUTES = 7 * 24 * 60; // one week — sanity bound, not a UX cap

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(10000).optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  scheduledFor: z.string().date().optional(),
  estimatedMinutes: z.number().int().positive().max(MAX_ESTIMATED_MINUTES).optional(),
  position: z.number().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().max(10000).nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
    scheduledFor: z.string().date().nullable().optional(),
    estimatedMinutes: z.number().int().positive().max(MAX_ESTIMATED_MINUTES).nullable().optional(),
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
