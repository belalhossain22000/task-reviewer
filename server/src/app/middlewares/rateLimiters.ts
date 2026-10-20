import { rateLimit } from "express-rate-limit";
import httpStatus from "http-status";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";

// Hands the 429 to the global error handler so it has the same shape as every other error.
const tooManyRequests = (message: string) => (_req: any, _res: any, next: any) =>
  next(new ApiError(httpStatus.TOO_MANY_REQUESTS, message));

// Brute-force protection: only failed logins count, a successful one doesn't.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests("Too many login attempts. Please try again later."),
});

// Every signup counts, so one IP can't mass-create accounts.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests("Too many accounts created. Please try again later."),
});

// Per logged-in student (not per IP). Only submissions that succeed use up the quota, so a
// typo or a duplicate doesn't lock a student out. Must run after `auth()` for `req.user`.
const submissionLimiter = rateLimit({
  windowMs: config.rate_limit.submission_window_minutes * 60 * 1000,
  limit: config.rate_limit.submission_max,
  skipFailedRequests: true,
  keyGenerator: (req) => req.user.id,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests(
    "You are submitting too fast. Please wait a few minutes before submitting again."
  ),
});

export const rateLimiters = {
  loginLimiter,
  signupLimiter,
  submissionLimiter,
};
