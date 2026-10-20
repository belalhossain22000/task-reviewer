import { Role } from "@prisma/client";

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

// What goes inside the JWT.
export interface ITokenPayload {
  id: string;
  role: Role;
}

// User as the API returns it: never includes the password hash.
export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

// Returned by the service on signup and login.
export interface IAuthResult {
  user: IAuthUser;
  token: string;
}
