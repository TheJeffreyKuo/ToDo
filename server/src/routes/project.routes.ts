import { Router } from "express";
import { createProjectSchema, updateProjectSchema } from "@todo/shared/schemas/project";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireOwnershipOf } from "../middleware/requireOwnership.js";
import { validate } from "../middleware/validate.js";
import * as projectService from "../services/project.service.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);

projectRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await projectService.listProjects(req.userId!);
    res.json({ projects });
  }),
);

projectRouter.post(
  "/",
  validate(createProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.userId!, req.body);
    res.status(201).json({ project });
  }),
);

projectRouter.get(
  "/:id",
  requireOwnershipOf("project"),
  asyncHandler(async (req, res) => {
    const project = await projectService.getProject(Number(req.params.id));
    res.json({ project });
  }),
);

projectRouter.patch(
  "/:id",
  requireOwnershipOf("project"),
  validate(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(Number(req.params.id), req.body);
    res.json({ project });
  }),
);

projectRouter.delete(
  "/:id",
  requireOwnershipOf("project"),
  asyncHandler(async (req, res) => {
    await projectService.deleteProject(Number(req.params.id));
    res.status(204).end();
  }),
);
