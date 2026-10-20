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

router.patch(
  "/:id/review",
  auth(Role.MENTOR, Role.ADMIN),
  validateRequest(ProjectValidation.reviewProjectSchema),
  ProjectController.reviewProject
);

export const ProjectRoutes = router;
