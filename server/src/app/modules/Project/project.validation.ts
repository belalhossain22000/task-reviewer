import { z } from "zod";
import { normalizeLiveUrl, normalizeRepoUrl } from "./project.utils";

const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: "Project name is required" })
      .trim()
      .min(3, "Project name must be at least 3 characters")
      .max(80, "Project name must be at most 80 characters"),
    repoUrl: z
      .string({ required_error: "Repo URL is required" })
      .trim()
      .max(2048, "Repo URL is too long")
      .refine((value) => normalizeRepoUrl(value) !== null, {
        message:
          "Repo URL must look like https://github.com/owner/repo (GitHub, GitLab or Bitbucket)",
      }),
    liveUrl: z
      .string({ required_error: "Live link is required" })
      .trim()
      .max(2048, "Live link is too long")
      .refine((value) => normalizeLiveUrl(value) !== null, {
        message: "Live link must be a public http(s) URL (not localhost or an IP address)",
      }),
    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(20, "Description must be at least 20 characters")
      .max(1000, "Description must be at most 1000 characters"),
  })
  .strict();

// Query strings arrive as text, so numbers are coerced.
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const ProjectValidation = {
  createProjectSchema,
  paginationQuerySchema,
};
