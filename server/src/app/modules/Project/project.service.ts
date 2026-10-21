import { Prisma, ProjectStatus, Role } from "@prisma/client";
import httpStatus from "http-status";

import ApiError, { ErrorSource } from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import {
  ICreateProjectPayload,
  IMyProjectsQuery,
  IPaginatedResult,
  IProject,
  IProjectListQuery,
  IProjectStats,
  IReviewableProject,
  IReviewEntry,
  IReviewPayload,
} from "./project.interface";
import config from "../../../config";
import { normalizeLiveUrl, normalizeRepoUrl } from "./project.utils";

const projectSelect = {
  id: true,
  name: true,
  repoUrl: true,
  liveUrl: true,
  description: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
} satisfies Prisma.ProjectSelect;

const REPO_DUPLICATE: ErrorSource = {
  path: "repoUrl",
  message: "This repository has already been submitted",
};
const LIVE_DUPLICATE: ErrorSource = {
  path: "liveUrl",
  message: "This live link has already been submitted",
};

const duplicateError = (errorSources: ErrorSource[]) =>
  new ApiError(
    httpStatus.CONFLICT,
    "This project has already been submitted",
    "",
    errorSources
  );

const createProject = async (
  studentId: string,
  payload: ICreateProjectPayload
): Promise<IProject> => {
  // The schema already validated both URLs, so these can't be null here.
  const repoKey = normalizeRepoUrl(payload.repoUrl)!;
  const liveKey = normalizeLiveUrl(payload.liveUrl)!;

  const existing = await prisma.project.findMany({
    where: { OR: [{ repoKey }, { liveKey }] },
    select: { repoKey: true, liveKey: true },
  });
  if (existing.length) {
    const errorSources: ErrorSource[] = [];
    if (existing.some((p) => p.repoKey === repoKey)) errorSources.push(REPO_DUPLICATE);
    if (existing.some((p) => p.liveKey === liveKey)) errorSources.push(LIVE_DUPLICATE);
    throw duplicateError(errorSources);
  }

  try {
    return await prisma.project.create({
      data: {
        name: payload.name,
        repoUrl: payload.repoUrl,
        repoKey,
        liveUrl: payload.liveUrl,
        liveKey,
        description: payload.description,
        studentId,
      },
      select: projectSelect,
    });
  } catch (error) {
    // Two identical submissions racing past the check above: the database unique
    // index is the real guard, so translate its error the same way.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = String(error.meta?.target ?? "");
      const errorSources: ErrorSource[] = [];
      if (target.includes("repoKey")) errorSources.push(REPO_DUPLICATE);
      if (target.includes("liveKey")) errorSources.push(LIVE_DUPLICATE);
      throw duplicateError(errorSources.length ? errorSources : [REPO_DUPLICATE]);
    }
    throw error;
  }
};

// `%` and `_` act as wildcards inside a SQL LIKE, so escape them to search for the literal characters.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

const getMyProjects = async (
  studentId: string,
  query: IMyProjectsQuery
): Promise<IPaginatedResult<IProject>> => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const text = query.search && escapeLike(query.search);

  // Always the student's OWN projects: the filters can only narrow the list, never widen it.
  const where: Prisma.ProjectWhereInput = {
    studentId,
    ...(query.status && { status: query.status }),
    ...(text && {
      OR: [
        { name: { contains: text, mode: "insensitive" } },
        { description: { contains: text, mode: "insensitive" } },
        { repoUrl: { contains: text, mode: "insensitive" } },
        { liveUrl: { contains: text, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

const reviewableSelect = {
  ...projectSelect,
  student: { select: { id: true, name: true, email: true } },
  reviewer: { select: { id: true, name: true } },
  claimedBy: { select: { id: true, name: true } },
  claimedAt: true,
} satisfies Prisma.ProjectSelect;

/* ---------- "I'm reviewing this" ---------- */

// A claim is a soft hint, not a lock: it only counts for CLAIM_TTL_MINUTES, so a mentor who takes
// a project and walks away doesn't block it. Nothing cleans expired claims up; they are simply
// ignored here (a time comparison), which also keeps them correct without a background job.
const claimCutoff = () => new Date(Date.now() - config.claim_ttl_minutes * 60 * 1000);

// The claim as the API shows it: only while it is still valid, with the moment it will run out
// (`claimExpiresAt`) so the UI can show how long is left without knowing the TTL itself.
const withActiveClaim = <T extends { claimedBy: unknown; claimedAt: Date | null }>(
  project: T
): T & { claimExpiresAt: Date | null } =>
  project.claimedAt && project.claimedAt > claimCutoff()
    ? {
        ...project,
        claimExpiresAt: new Date(project.claimedAt.getTime() + config.claim_ttl_minutes * 60 * 1000),
      }
    : { ...project, claimedBy: null, claimedAt: null, claimExpiresAt: null };

const findReviewable = async (projectId: string): Promise<IReviewableProject> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: reviewableSelect,
  });
  if (!project) throw new ApiError(httpStatus.NOT_FOUND, "Project not found");

  return withActiveClaim(project);
};

const getAllProjects = async (
  query: IProjectListQuery
): Promise<IPaginatedResult<IReviewableProject>> => {
  const { page, limit, status, search, reviewerId, claim, viewerId, sortBy, sortOrder } = query;
  const { skip } = paginationHelper.calculatePagination({ page, limit });

  // `contains` is a SQL LIKE under the hood, so `%` and `_` in what the mentor typed
  // would act as wildcards. Escape them to search for the literal characters.
  const text = search?.replace(/[\\%_]/g, "\\$&");

  // Several filters need an OR of their own, so they are collected as AND-ed pieces.
  const all: Prisma.ProjectWhereInput[] = [];

  if (text) {
    all.push({
      OR: [
        { name: { contains: text, mode: "insensitive" } },
        { repoUrl: { contains: text, mode: "insensitive" } },
        { student: { name: { contains: text, mode: "insensitive" } } },
        { student: { email: { contains: text, mode: "insensitive" } } },
      ],
    });
  }
  if (claim === "mine") {
    all.push({ claimedById: viewerId, claimedAt: { gte: claimCutoff() } });
  }
  if (claim === "none") {
    // The work queue: pending, and nobody currently holding it (never taken, or the claim ran out).
    all.push({ status: ProjectStatus.PENDING });
    all.push({ OR: [{ claimedById: null }, { claimedAt: { lt: claimCutoff() } }] });
  }

  const where: Prisma.ProjectWhereInput = {
    ...(status && { status }),
    ...(reviewerId && { reviewerId }),
    ...(all.length > 0 && { AND: all }),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: reviewableSelect,
      // `id` as a tie-breaker keeps pages stable when many rows share the sort value.
      orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }],
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: data.map(withActiveClaim),
  };
};

// "I'm reviewing this." Taking a pending project that nobody holds (or whose claim ran out, or
// that I already hold) succeeds. It is ONE conditional UPDATE, so if two mentors press the button
// at the same moment the database lets exactly one of them through.
const claimProject = async (projectId: string, userId: string): Promise<IReviewableProject> => {
  const { count } = await prisma.project.updateMany({
    where: {
      id: projectId,
      status: ProjectStatus.PENDING,
      OR: [{ claimedById: null }, { claimedById: userId }, { claimedAt: { lt: claimCutoff() } }],
    },
    data: { claimedById: userId, claimedAt: new Date() },
  });

  if (count === 0) {
    // It didn't go through: find out why, to give a useful answer.
    const current = await findReviewable(projectId); // 404 if there is no such project
    if (current.status !== ProjectStatus.PENDING) {
      throw new ApiError(httpStatus.CONFLICT, "Only pending projects can be taken");
    }
    throw new ApiError(
      httpStatus.CONFLICT,
      `${current.claimedBy?.name ?? "Someone else"} is already reviewing this project`
    );
  }

  return findReviewable(projectId);
};

// Give a claim back. Its owner can, an admin can release anyone's, and anyone can once it ran out.
const releaseProject = async (
  projectId: string,
  user: { id: string; role: string }
): Promise<IReviewableProject> => {
  const { count } = await prisma.project.updateMany({
    where:
      user.role === Role.ADMIN
        ? { id: projectId }
        : {
            id: projectId,
            OR: [{ claimedById: null }, { claimedById: user.id }, { claimedAt: { lt: claimCutoff() } }],
          },
    data: { claimedById: null, claimedAt: null },
  });

  if (count === 0) {
    const current = await findReviewable(projectId); // 404 if there is no such project
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Only ${current.claimedBy?.name ?? "the person who took it"} or an admin can release this project`
    );
  }

  return findReviewable(projectId);
};

// A decision on a project that somebody else is reviewing ("Take") is refused for a mentor, which
// is what makes Take mean something. An admin may still decide (the web app asks first); a claim
// that ran out, or is the caller's own, never blocks anyone.
const reviewProject = async (
  projectId: string,
  user: { id: string; role: string },
  payload: IReviewPayload
): Promise<IReviewableProject> => {
  // A decision can be changed later. The project row keeps only the LATEST one (that is what the
  // lists show), and every decision is also written to the history. Both happen together or not
  // at all, so the two can never disagree.
  return prisma.$transaction(async (tx) => {
    const reviewedAt = new Date();

    // One conditional UPDATE, like taking: the claim check and the decision cannot be separated by
    // somebody else's "Take" arriving in between.
    const { count } = await tx.project.updateMany({
      where:
        user.role === Role.ADMIN
          ? { id: projectId }
          : {
              id: projectId,
              OR: [{ claimedById: null }, { claimedById: user.id }, { claimedAt: { lt: claimCutoff() } }],
            },
      data: {
        status: payload.status,
        reviewNote: payload.note ?? null,
        reviewedAt,
        reviewerId: user.id,
        // A decision ends any claim on the project.
        claimedById: null,
        claimedAt: null,
      },
    });

    if (count === 0) {
      const current = await tx.project.findUnique({
        where: { id: projectId },
        select: reviewableSelect,
      });
      if (!current) throw new ApiError(httpStatus.NOT_FOUND, "Project not found");

      const holder = withActiveClaim(current);
      throw new ApiError(
        httpStatus.CONFLICT,
        `${holder.claimedBy?.name ?? "Someone else"} is reviewing this project. Wait until they are done or the hold runs out, or ask an admin to release it`
      );
    }

    await tx.projectReview.create({
      data: {
        projectId,
        reviewerId: user.id,
        status: payload.status,
        note: payload.note ?? null,
        createdAt: reviewedAt,
      },
    });

    const updated = await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      select: reviewableSelect,
    });
    return withActiveClaim(updated);
  });
};

// Put a decided project back in the queue (admin only). The project goes back to PENDING with its
// decision fields cleared, and the reopening is written to the history as a PENDING entry, in the
// same transaction. The earlier decisions stay in the history untouched.
const reopenProject = async (projectId: string, adminId: string): Promise<IReviewableProject> => {
  return prisma.$transaction(async (tx) => {
    const reopenedAt = new Date();

    // One conditional UPDATE: two admins pressing "Reopen" together can't both succeed.
    const { count } = await tx.project.updateMany({
      where: { id: projectId, status: { not: ProjectStatus.PENDING } },
      data: {
        status: ProjectStatus.PENDING,
        reviewNote: null,
        reviewedAt: null,
        reviewerId: null,
        claimedById: null,
        claimedAt: null,
      },
    });

    if (count === 0) {
      const exists = await tx.project.findUnique({ where: { id: projectId }, select: { id: true } });
      if (!exists) throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
      throw new ApiError(httpStatus.CONFLICT, "Project is already pending");
    }

    await tx.projectReview.create({
      data: {
        projectId,
        reviewerId: adminId,
        status: ProjectStatus.PENDING,
        createdAt: reopenedAt,
      },
    });

    const project = await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      select: reviewableSelect,
    });
    return withActiveClaim(project);
  });
};

// Every decision on one project, newest first.
const getProjectHistory = async (projectId: string): Promise<IReviewEntry[]> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) throw new ApiError(httpStatus.NOT_FOUND, "Project not found");

  return prisma.projectReview.findMany({
    where: { projectId },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      reviewer: { select: { id: true, name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
};

// Counts are global: they ignore the list's filter and search.
const getStats = async (): Promise<IProjectStats> => {
  const groups = await prisma.project.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const count = (status: ProjectStatus) =>
    groups.find((group) => group.status === status)?._count._all ?? 0;

  const pending = count(ProjectStatus.PENDING);
  const approved = count(ProjectStatus.APPROVED);
  const rejected = count(ProjectStatus.REJECTED);

  return { total: pending + approved + rejected, pending, approved, rejected };
};

export const ProjectService = {
  createProject,
  getMyProjects,
  getAllProjects,
  reviewProject,
  reopenProject,
  getProjectHistory,
  claimProject,
  releaseProject,
  getStats,
};
