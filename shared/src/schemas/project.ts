import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().max(20).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    color: z.string().max(20).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
