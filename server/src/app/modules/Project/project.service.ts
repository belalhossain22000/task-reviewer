import { Prisma } from "@prisma/client";
import httpStatus from "http-status";

import ApiError, { ErrorSource } from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import {
  ICreateProjectPayload,
  IPaginatedResult,
  IPaginationQuery,
  IProject,
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

export const ProjectService = {
  createProject,
  getMyProjects,
};
