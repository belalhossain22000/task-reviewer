import { Role } from "@prisma/client";
import express from "express";

import auth from "../../middlewares/auth";
import { rateLimiters } from "../../middlewares/rateLimiters";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import { ProjectValidation } from "./project.validation";

const router = express.Router();

// Student
router.post(
  "/",
  auth(Role.STUDENT),
  rateLimiters.submissionLimiter,
  validateRequest(ProjectValidation.createProjectSchema),
  ProjectController.createProject
);

router.get("/mine", auth(Role.STUDENT), ProjectController.getMyProjects);

// Mentor and admin
router.get(
  "/",
  auth(Role.MENTOR, Role.ADMIN),
  ProjectController.getAllProjects
);

router.get(
  "/stats",
  auth(Role.MENTOR, Role.ADMIN),
  ProjectController.getStats
);

router.get(
  "/:id/history",
  auth(Role.MENTOR, Role.ADMIN),
  ProjectController.getProjectHistory
);

// "I'm reviewing this": take a pending project, or give it back.
router.post("/:id/claim", auth(Role.MENTOR, Role.ADMIN), ProjectController.claimProject);
router.delete("/:id/claim", auth(Role.MENTOR, Role.ADMIN), ProjectController.releaseProject);

router.patch(
  "/:id/review",
  auth(Role.MENTOR, Role.ADMIN),
  validateRequest(ProjectValidation.reviewProjectSchema),
  ProjectController.reviewProject
);

// Admin only: put an approved or rejected project back in the queue.
router.patch("/:id/reopen", auth(Role.ADMIN), ProjectController.reopenProject);

export const ProjectRoutes = router;
