import { Role } from "@prisma/client";
import express from "express";

import auth from "../../middlewares/auth";
import { rateLimiters } from "../../middlewares/rateLimiters";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import { ProjectValidation } from "./project.validation";

const router = express.Router();

router.post(
  "/",
  auth(Role.STUDENT),
  rateLimiters.submissionLimiter,
  validateRequest(ProjectValidation.createProjectSchema),
  ProjectController.createProject
);

router.get("/mine", auth(Role.STUDENT), ProjectController.getMyProjects);

export const ProjectRoutes = router;
