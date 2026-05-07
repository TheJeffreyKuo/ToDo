import { Router } from "express";
import { createLabelSchema, updateLabelSchema } from "@todo/shared/schemas/label";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireOwnershipOf } from "../middleware/requireOwnership.js";
import { validate } from "../middleware/validate.js";
import * as labelService from "../services/label.service.js";

export const labelRouter = Router();

labelRouter.use(requireAuth);

labelRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const labels = await labelService.listLabels(req.userId!);
    res.json({ labels });
  }),
);

labelRouter.post(
  "/",
  validate(createLabelSchema),
  asyncHandler(async (req, res) => {
    const label = await labelService.createLabel(req.userId!, req.body);
    res.status(201).json({ label });
  }),
);

labelRouter.get(
  "/:id",
  requireOwnershipOf("label"),
  asyncHandler(async (req, res) => {
    const label = await labelService.getLabel(Number(req.params.id));
    res.json({ label });
  }),
);

labelRouter.patch(
  "/:id",
  requireOwnershipOf("label"),
  validate(updateLabelSchema),
  asyncHandler(async (req, res) => {
    const label = await labelService.updateLabel(Number(req.params.id), req.body);
    res.json({ label });
  }),
);

labelRouter.delete(
  "/:id",
  requireOwnershipOf("label"),
  asyncHandler(async (req, res) => {
    await labelService.deleteLabel(Number(req.params.id));
    res.status(204).end();
  }),
);
