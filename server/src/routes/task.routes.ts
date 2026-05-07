import { Router } from "express";
import { createTaskSchema, setTaskLabelsSchema, updateTaskSchema } from "@todo/shared/schemas/task";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireOwnershipOf } from "../middleware/requireOwnership.js";
import { validate } from "../middleware/validate.js";
import * as taskService from "../services/task.service.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tasks = await taskService.listTasks(req.userId!);
    res.json({ tasks });
  }),
);

taskRouter.post(
  "/",
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.userId!, req.body);
    res.status(201).json({ task });
  }),
);

taskRouter.get(
  "/:id",
  requireOwnershipOf("task"),
  asyncHandler(async (req, res) => {
    const task = await taskService.getTask(Number(req.params.id));
    res.json({ task });
  }),
);

taskRouter.patch(
  "/:id",
  requireOwnershipOf("task"),
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTask(req.userId!, Number(req.params.id), req.body);
    res.json({ task });
  }),
);

taskRouter.delete(
  "/:id",
  requireOwnershipOf("task"),
  asyncHandler(async (req, res) => {
    await taskService.deleteTask(Number(req.params.id));
    res.status(204).end();
  }),
);

taskRouter.put(
  "/:id/labels",
  requireOwnershipOf("task"),
  validate(setTaskLabelsSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.setTaskLabels(
      req.userId!,
      Number(req.params.id),
      req.body.labelIds,
    );
    res.json({ task });
  }),
);
