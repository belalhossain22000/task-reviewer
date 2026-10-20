import httpStatus from "http-status";

import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";
import { UserValidation } from "./user.validation";

const createMentor = catchAsync(async (req, res) => {
  const mentor = await UserService.createMentor(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Mentor created successfully",
    data: mentor,
  });
});

const getMentors = catchAsync(async (req, res) => {
  const query = UserValidation.listMentorsQuerySchema.parse(req.query);
  const result = await UserService.getMentors(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Mentors retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const setMentorActive = catchAsync(async (req, res) => {
  const { id } = UserValidation.mentorIdParamSchema.parse(req.params);
  const mentor = await UserService.setMentorActive(id, req.body.isActive);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: mentor.isActive ? "Mentor activated" : "Mentor deactivated",
    data: mentor,
  });
});

export const UserController = {
  createMentor,
  getMentors,
  setMentorActive,
};
