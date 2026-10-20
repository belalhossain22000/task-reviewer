import { z } from "zod";

import { isValidLiveUrl, isValidRepoUrl } from "@/lib/url-rules";

// Form schemas. They mirror the API's rules and messages so the user gets the same answer
// instantly in the browser that the server would give. The server still checks everything.

/* ---------- Reusable fields ---------- */

const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be at most 60 characters");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(254, "Email is too long");

// 72 is bcrypt's input limit on the server.
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

/* ---------- Auth ---------- */

export const loginSchema = z.object({
  email,
  // Login only needs "not empty": the rules above are for choosing a password.
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name,
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ---------- Student: submit a project ---------- */

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters")
    .max(80, "Project name must be at most 80 characters"),
  repoUrl: z
    .string()
    .trim()
    .min(1, "Repo URL is required")
    .max(2048, "Repo URL is too long")
    .refine(isValidRepoUrl, {
      message:
        "Repo URL must look like https://github.com/owner/repo (GitHub, GitLab or Bitbucket)",
    }),
  liveUrl: z
    .string()
    .trim()
    .min(1, "Live link is required")
    .max(2048, "Live link is too long")
    .refine(isValidLiveUrl, {
      message: "Live link must be a public http(s) URL (not localhost or an IP address)",
    }),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be at most 1000 characters"),
});

/* ---------- Mentor / admin ---------- */

// Approving needs no form (one click); only a rejection has to explain itself.
export const rejectSchema = z.object({
  note: z
    .string()
    .trim()
    .min(5, "Please give a reason of at least 5 characters when rejecting")
    .max(500, "Note must be at most 500 characters"),
});

export const mentorSchema = z.object({
  name,
  email,
  password: newPassword,
});

/* ---------- Types: what each form holds ---------- */

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ProjectValues = z.infer<typeof projectSchema>;
export type RejectValues = z.infer<typeof rejectSchema>;
export type MentorValues = z.infer<typeof mentorSchema>;
