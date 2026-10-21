import { Role } from "@prisma/client";

export interface ICreateMentorPayload {
  name: string;
  email: string;
  password: string;
}

// The fields every account shows.
export interface IAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

// A mentor as the admin sees them: the account plus how many decisions they have made.
export interface IMentor extends IAccount {
  reviewCount: number;
}

// A student as the admin sees them: the account plus how many projects they have submitted.
export interface IStudent extends IAccount {
  projectCount: number;
}

export interface IStudentListResult {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: IStudent[];
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
