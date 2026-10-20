import { Prisma, ProjectStatus } from "@prisma/client";
import httpStatus from "http-status";

import ApiError, { ErrorSource } from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import {
  ICreateProjectPayload,
  IPaginatedResult,
  IPaginationQuery,
  IProject,
  IProjectListQuery,
  IProjectStats,
  IReviewableProject,
  IReviewPayload,
} from "./project.interface";
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

const getMyProjects = async (
  studentId: string,
  query: IPaginationQuery
): Promise<IPaginatedResult<IProject>> => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const where: Prisma.ProjectWhereInput = { studentId };

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
} satisfies Prisma.ProjectSelect;

const getAllProjects = async (
  query: IProjectListQuery
): Promise<IPaginatedResult<IReviewableProject>> => {
  const { page, limit, status, search, sortBy, sortOrder } = query;
  const { skip } = paginationHelper.calculatePagination({ page, limit });

  // `contains` is a SQL LIKE under the hood, so `%` and `_` in what the mentor typed
  // would act as wildcards. Escape them to search for the literal characters.
  const text = search?.replace(/[\\%_]/g, "\\$&");

  const where: Prisma.ProjectWhereInput = {
    ...(status && { status }),
    ...(text && {
      OR: [
        { name: { contains: text, mode: "insensitive" } },
        { repoUrl: { contains: text, mode: "insensitive" } },
        { student: { name: { contains: text, mode: "insensitive" } } },
        { student: { email: { contains: text, mode: "insensitive" } } },
      ],
    }),
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
    data,
  };
};

const reviewProject = async (
  projectId: string,
  reviewerId: string,
  payload: IReviewPayload
): Promise<IReviewableProject> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) throw new ApiError(httpStatus.NOT_FOUND, "Project not found");

  // A decision can be changed later; the latest one overwrites status, note and reviewer.
  return prisma.project.update({
    where: { id: projectId },
    data: {
      status: payload.status,
      reviewNote: payload.note ?? null,
      reviewedAt: new Date(),
      reviewerId,
    },
    select: reviewableSelect,
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
  getStats,
};
