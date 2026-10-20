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
  const query = ProjectValidation.listProjectsQuerySchema.parse(req.query);
  const result = await ProjectService.getAllProjects(query);

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
  const project = await ProjectService.reviewProject(id, req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Project ${project.status.toLowerCase()} successfully`,
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
  getStats,
};
