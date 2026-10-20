import { Prisma, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";

import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import {
  ICreateMentorPayload,
  IMentor,
  IMentorListResult,
} from "./user.interface";

const saltRounds = Number(config.bcrypt_salt_rounds) || 12;

const mentorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const emailTaken = () =>
  new ApiError(
    httpStatus.CONFLICT,
    "An account with this email already exists",
    "",
    [{ path: "email", message: "An account with this email already exists" }]
  );

const createMentor = async (payload: ICreateMentorPayload): Promise<IMentor> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });
  if (existing) throw emailTaken();

  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  try {
    return await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: Role.MENTOR,
      },
      select: mentorSelect,
    });
  } catch (error) {
    // Two requests with the same email racing past the check above.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw emailTaken();
    }
    throw error;
  }
};

const getMentors = async (query: {
  page: number;
  limit: number;
}): Promise<IMentorListResult> => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const where: Prisma.UserWhereInput = { role: Role.MENTOR };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: mentorSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// Only mentors can be switched here. Admins and students are not touched by this endpoint,
// so an admin can't lock themselves (or a student) out through it.
const setMentorActive = async (
  mentorId: string,
  isActive: boolean
): Promise<IMentor> => {
  const mentor = await prisma.user.findFirst({
    where: { id: mentorId, role: Role.MENTOR },
    select: { id: true },
  });
  if (!mentor) throw new ApiError(httpStatus.NOT_FOUND, "Mentor not found");

  return prisma.user.update({
    where: { id: mentorId },
    data: { isActive },
    select: mentorSelect,
  });
};

export const UserService = {
  createMentor,
  getMentors,
  setMentorActive,
};
