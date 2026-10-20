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

const listMentorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const UserValidation = {
  createMentorSchema,
  setActiveSchema,
  mentorIdParamSchema,
  listMentorsQuerySchema,
};
