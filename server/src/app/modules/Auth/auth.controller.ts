import { CookieOptions, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";

import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.env === "production",
};

// The cookie lives exactly as long as the token does.
const setAuthCookie = (res: Response, token: string) => {
  const { exp } = jwt.decode(token) as JwtPayload;
  res.cookie(config.auth_cookie_name, token, {
    ...baseCookieOptions,
    maxAge: exp! * 1000 - Date.now(),
  });
};

const signup = catchAsync(async (req, res) => {
  const { user, token } = await AuthService.signup(req.body);
  setAuthCookie(res, token);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Account created successfully",
    data: user,
  });
});

const login = catchAsync(async (req, res) => {
  const { user, token } = await AuthService.login(req.body);
  setAuthCookie(res, token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: user,
  });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie(config.auth_cookie_name, baseCookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = await AuthService.getMe(req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
});

export const AuthController = {
  signup,
  login,
  logout,
  getMe,
};
