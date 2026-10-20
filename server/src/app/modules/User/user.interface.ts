import { Role } from "@prisma/client";

export interface ICreateMentorPayload {
  name: string;
  email: string;
  password: string;
}

export interface IMentor {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface IMentorListResult {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: IMentor[];
}
