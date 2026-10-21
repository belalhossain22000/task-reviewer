import { Prisma, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";

import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import {
  IAccount,
  ICreateMentorPayload,
  IMentor,
  IMentorListResult,
  IStudent,
  IStudentListResult,
} from "./user.interface";

const saltRounds = Number(config.bcrypt_salt_rounds) || 12;

const accountSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// Mentors also carry how many decisions (approve / reject) they have made, counted from the
// review history.
const mentorSelect = {
  ...accountSelect,
  // Decisions only: a "reopened" entry (status PENDING) is not a review.
  _count: { select: { authoredReviews: { where: { status: { not: "PENDING" as const } } } } },
} satisfies Prisma.UserSelect;

const toMentor = ({ _count, ...account }: Prisma.UserGetPayload<{ select: typeof mentorSelect }>): IMentor => ({
  ...account,
  reviewCount: _count.authoredReviews,
});

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
    const mentor = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: Role.MENTOR,
      },
      select: mentorSelect,
    });
    return toMentor(mentor);
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

  const [rows, total] = await Promise.all([
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
    data: rows.map(toMentor),
  };
};

// Switches an account on or off, but only if it has the expected role. Each endpoint passes the
// one role it is for (mentor or student), so an admin id can never be switched off through
// either of them: an admin can't lock themselves, or another admin, out.
const setActive = async (
  userId: string,
  role: Role,
  isActive: boolean,
  label: string
): Promise<IAccount> => {
  const user = await prisma.user.findFirst({
    where: { id: userId, role },
    select: { id: true },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, `${label} not found`);

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: accountSelect,
  });
};

const setMentorActive = (mentorId: string, isActive: boolean) =>
  setActive(mentorId, Role.MENTOR, isActive, "Mentor");

const setStudentActive = (studentId: string, isActive: boolean) =>
  setActive(studentId, Role.STUDENT, isActive, "Student");

const getStudents = async (query: {
  page: number;
  limit: number;
  search?: string;
}): Promise<IStudentListResult> => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);

  // `contains` is a SQL LIKE, so `%` and `_` the admin typed would act as wildcards. Escape them
  // to search for the literal characters.
  const text = query.search?.replace(/[\\%_]/g, "\\$&");

  const where: Prisma.UserWhereInput = {
    role: Role.STUDENT,
    ...(text && {
      OR: [
        { name: { contains: text, mode: "insensitive" } },
        { email: { contains: text, mode: "insensitive" } },
      ],
    }),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { ...accountSelect, _count: { select: { projects: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const data: IStudent[] = rows.map(({ _count, ...student }) => ({
    ...student,
    projectCount: _count.projects,
  }));

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

export const UserService = {
  createMentor,
  getMentors,
  setMentorActive,
  getStudents,
  setStudentActive,
};
