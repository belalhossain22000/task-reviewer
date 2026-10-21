import { z } from "zod";
import { emailField, nameField, passwordField } from "../Auth/auth.validation";

// The admin chooses the mentor's initial password and hands it over.
const createMentorSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
  })
  .strict();

const setActiveSchema = z
  .object({
    isActive: z.boolean({
      required_error: "isActive is required",
      invalid_type_error: "isActive must be true or false",
    }),
  })
  .strict();

const mentorIdParamSchema = z.object({
  id: z.string().uuid("Invalid mentor id"),
});

const studentIdParamSchema = z.object({
  id: z.string().uuid("Invalid student id"),
});

const listMentorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z
    .string()
    .trim()
    .max(100, "Search text is too long")
    .optional()
    .transform((value) => value || undefined),
});

export const UserValidation = {
  createMentorSchema,
  setActiveSchema,
  mentorIdParamSchema,
  studentIdParamSchema,
  listMentorsQuerySchema,
  listStudentsQuerySchema,
};
