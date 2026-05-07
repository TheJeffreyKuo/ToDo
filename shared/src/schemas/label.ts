import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().max(20).optional(),
});

export const updateLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    color: z.string().max(20).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
