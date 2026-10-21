import httpStatus from "http-status";

import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ProjectService } from "./project.service";
import { ProjectValidation } from "./project.validation";

const createProject = catchAsync(async (req, res) => {
  const project = await ProjectService.createProject(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Project submitted successfully",
    data: project,
  });
});

const getMyProjects = catchAsync(async (req, res) => {
  const query = ProjectValidation.paginationQuerySchema.parse(req.query);
  const result = await ProjectService.getMyProjects(req.user.id, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your projects retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllProjects = catchAsync(async (req, res) => {
  const { reviewer, ...query } = ProjectValidation.listProjectsQuerySchema.parse(req.query);
  // "me" is the person asking; anything else is already a checked id.
  const reviewerId = reviewer === "me" ? req.user.id : reviewer;
  const result = await ProjectService.getAllProjects({ ...query, reviewerId, viewerId: req.user.id });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Projects retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const reviewProject = catchAsync(async (req, res) => {
  const { id } = ProjectValidation.projectIdParamSchema.parse(req.params);
  const project = await ProjectService.reviewProject(id, req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Project ${project.status.toLowerCase()} successfully`,
    data: project,
  });
});

const reopenProject = catchAsync(async (req, res) => {
  const { id } = ProjectValidation.projectIdParamSchema.parse(req.params);
  const project = await ProjectService.reopenProject(id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project moved back to pending",
    data: project,
  });
});

const getProjectHistory = catchAsync(async (req, res) => {
  const { id } = ProjectValidation.projectIdParamSchema.parse(req.params);
  const history = await ProjectService.getProjectHistory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project history retrieved successfully",
    data: history,
  });
});

const claimProject = catchAsync(async (req, res) => {
  const { id } = ProjectValidation.projectIdParamSchema.parse(req.params);
  const project = await ProjectService.claimProject(id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "You are now reviewing this project",
    data: project,
  });
});

const releaseProject = catchAsync(async (req, res) => {
  const { id } = ProjectValidation.projectIdParamSchema.parse(req.params);
  const project = await ProjectService.releaseProject(id, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project released",
    data: project,
  });
});

const getStats = catchAsync(async (req, res) => {
  const stats = await ProjectService.getStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project stats retrieved successfully",
    data: stats,
  });
});

export const ProjectController = {
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
