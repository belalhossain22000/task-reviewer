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

export const ProjectController = {
  createProject,
  getMyProjects,
};
