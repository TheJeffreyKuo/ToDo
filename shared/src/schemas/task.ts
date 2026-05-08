import { z } from "zod";

const MAX_ESTIMATED_MINUTES = 7 * 24 * 60; // one week — sanity bound, not a UX cap

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(10000).optional(),
  scheduledFor: z.string().date().optional(),
  estimatedMinutes: z.number().int().positive().max(MAX_ESTIMATED_MINUTES).optional(),
  position: z.number().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().max(10000).nullable().optional(),
    scheduledFor: z.string().date().nullable().optional(),
    estimatedMinutes: z.number().int().positive().max(MAX_ESTIMATED_MINUTES).nullable().optional(),
    completed: z.boolean().optional(),
    position: z.number().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
