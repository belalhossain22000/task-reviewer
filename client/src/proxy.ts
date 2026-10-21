import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { HOME_BY_ROLE as HOME } from "@/lib/routes";
import { ROLES, type Role } from "@/types/api";

// Runs on the server before a page is rendered. It reads the login cookie that Express set
// (it reaches this origin because /api/* is forwarded by next.config.ts) and sends the visitor
// to the right place. It protects PAGES; the data itself is protected by the API.

const AUTH_COOKIE = "token";

// Who may open which part of the site. Anything not listed here (404s etc.) is not guarded.
const PROTECTED: { prefix: string; roles: Role[] }[] = [
  { prefix: "/student", roles: ["STUDENT"] },
  { prefix: "/review", roles: ["MENTOR", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

const GUEST_ONLY = ["/login", "/signup"];

const startsWithPath = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Returns the role inside a valid, unexpired token, or null for a missing / forged / expired one.
async function getRole(token: string | undefined): Promise<Role | null> {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set for the Next.js app (see .env.example)");

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    const role = payload.role as Role;
    return ROLES.includes(role) ? role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getRole(request.cookies.get(AUTH_COOKIE)?.value);
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  // "/" has no page of its own: it just forwards to the right place.
  if (pathname === "/") return redirectTo(role ? HOME[role] : "/login");

  // Logged-in people have no business on the login / signup pages.
  if (GUEST_ONLY.some((path) => startsWithPath(pathname, path))) {
    return role ? redirectTo(HOME[role]) : NextResponse.next();
  }

  const rule = PROTECTED.find(({ prefix }) => startsWithPath(pathname, prefix));
  if (!rule) return NextResponse.next();

  if (!role) return redirectTo("/login");
  if (!rule.roles.includes(role)) return redirectTo(HOME[role]);

  return NextResponse.next();
}

export const config = {
  // Skip the API forward, Next.js internals and files with an extension (images, favicon...).
  // Without this, the redirects above would also catch requests for CSS / JS / images.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
