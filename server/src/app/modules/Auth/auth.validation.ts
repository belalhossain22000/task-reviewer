import { z } from "zod";

const email = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254, "Email is too long");

const signupSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be at most 60 characters"),
    email,
    // 72 is bcrypt's input limit.
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/\d/, "Password must contain at least one number"),
  })
  // strict: a body carrying `role` (or anything else unexpected) is rejected.
  .strict();

const loginSchema = z
  .object({
    email,
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required")
      .max(72, "Password must be at most 72 characters"),
  })
  .strict();

export const AuthValidation = {
  signupSchema,
  loginSchema,
};
