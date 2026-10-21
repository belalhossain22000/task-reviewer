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

// The two filters every project list shares. `status=ALL` (or no status) means no status filter;
// an empty search means no search.
const statusFilter = z
  .enum(["ALL", "PENDING", "APPROVED", "REJECTED"])
  .optional()
  .transform((value) => (value === "ALL" ? undefined : value));

const searchFilter = z
  .string()
  .trim()
  .max(100, "Search text is too long")
  .optional()
  .transform((value) => value || undefined);

// A student's own list: the same paging, plus the two filters.
const myProjectsQuerySchema = paginationQuerySchema.extend({
  status: statusFilter,
  search: searchFilter,
});

// Mentor / admin list.
const listProjectsQuerySchema = paginationQuerySchema.extend({
  status: statusFilter,
  search: searchFilter,
  // "me" = the person asking; or the id of a mentor / admin. Left out = anyone.
  reviewer: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || value === "me" || z.string().uuid().safeParse(value).success, {
      message: "Invalid reviewer",
    }),
  // "mine" = projects I have taken; "none" = pending projects nobody has taken. Left out = all.
  claim: z.enum(["mine", "none"]).optional(),
  sortBy: z.enum(["createdAt", "name", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const projectIdParamSchema = z.object({
  id: z.string().uuid("Invalid project id"),
});

const reviewProjectSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"], {
      errorMap: () => ({ message: "Status must be APPROVED or REJECTED" }),
    }),
    note: z
      .string()
      .trim()
      .max(500, "Note must be at most 500 characters")
      .optional()
      .transform((value) => value || undefined),
  })
  .strict()
  .superRefine((value, ctx) => {
    // A rejection has to tell the student why.
    if (value.status === "REJECTED" && (value.note?.length ?? 0) < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Please give a reason of at least 5 characters when rejecting",
      });
    }
  });

export const ProjectValidation = {
  createProjectSchema,
  paginationQuerySchema,
  myProjectsQuerySchema,
  listProjectsQuerySchema,
  projectIdParamSchema,
  reviewProjectSchema,
};
