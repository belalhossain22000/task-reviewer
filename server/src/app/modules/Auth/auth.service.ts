import { Prisma, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";

import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import {
  IAuthResult,
  IAuthUser,
  ILoginPayload,
  ISignupPayload,
  ITokenPayload,
} from "./auth.interface";

const saltRounds = Number(config.bcrypt_salt_rounds) || 12;

// Compared against when the email is unknown, so a missing account and a wrong
// password take about the same time and can't be told apart by timing.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", saltRounds);

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const createToken = (payload: ITokenPayload) =>
  jwtHelpers.generateToken(
    payload,
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in
  );

const emailTaken = () =>
  new ApiError(
    httpStatus.CONFLICT,
    "An account with this email already exists",
    "",
    [{ path: "email", message: "An account with this email already exists" }]
  );

const signup = async (payload: ISignupPayload): Promise<IAuthResult> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });
  if (existing) throw emailTaken();

  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  try {
    // The role is fixed here, never read from the request.
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: Role.STUDENT,
      },
      select: publicUserSelect,
    });

    return { user, token: createToken({ id: user.id, role: user.role }) };
  } catch (error) {
    // Two signups with the same email racing past the check above.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw emailTaken();
    }
    throw error;
  }
};

const login = async (payload: ILoginPayload): Promise<IAuthResult> => {
  const found = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { ...publicUserSelect, password: true },
  });

  const passwordMatches = await bcrypt.compare(
    payload.password,
    found?.password ?? DUMMY_HASH
  );
  if (!found || !passwordMatches) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (!found.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is deactivated");
  }

  const { password: _password, ...user } = found;
  return { user, token: createToken({ id: user.id, role: user.role }) };
};

const getMe = async (userId: string): Promise<IAuthUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  return user;
};

export const AuthService = {
  signup,
  login,
  getMe,
};
