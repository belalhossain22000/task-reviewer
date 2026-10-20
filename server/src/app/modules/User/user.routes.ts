import { Role } from "@prisma/client";
import express from "express";

import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Mentor management is admin only.
router.post(
  "/mentors",
  auth(Role.ADMIN),
  validateRequest(UserValidation.createMentorSchema),
  UserController.createMentor
);

router.get("/mentors", auth(Role.ADMIN), UserController.getMentors);

router.patch(
  "/mentors/:id/active",
  auth(Role.ADMIN),
  validateRequest(UserValidation.setActiveSchema),
  UserController.setMentorActive
);

export const UserRoutes = router;
