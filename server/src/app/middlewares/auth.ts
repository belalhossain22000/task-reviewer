import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import httpStatus from "http-status";

import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../helpars/jwtHelpers";
import prisma from "../../shared/prisma";

// Browser clients send the httpOnly cookie, API clients can send a Bearer token.
const extractToken = (req: Request): string | undefined => {
  const cookieToken = req.cookies?.[config.auth_cookie_name];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();

  return undefined;
};

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authenticated!");
      }

      let payload;
      try {
        payload = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);
      } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token!");
      }

      // Re-read the user so a deleted account or changed role takes effect immediately.
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true, isActive: true },
      });
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists!");
      }

      if (!user.isActive) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your account is deactivated!");
      }

      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to do this!");
      }

      req.user = { id: user.id, role: user.role };
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
