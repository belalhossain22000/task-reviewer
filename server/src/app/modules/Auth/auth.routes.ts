import express from "express";

import auth from "../../middlewares/auth";
import { rateLimiters } from "../../middlewares/rateLimiters";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/signup",
  rateLimiters.signupLimiter,
  validateRequest(AuthValidation.signupSchema),
  AuthController.signup
);

router.post(
  "/login",
  rateLimiters.loginLimiter,
  validateRequest(AuthValidation.loginSchema),
  AuthController.login
);

router.post("/logout", AuthController.logout);

// auth() with no roles: any logged-in user.
router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
