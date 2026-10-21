# Implementation Plan

Status: **implemented.** This file is kept as the plan the build followed; the root `README.md` describes the finished project.
Source requirements: [REQUIREMENTS.md](REQUIREMENTS.md)

## 1. Decisions (all resolved)

Outcome: D1 the template was cleaned in place; D2 still on the owner (the old credentials are in the git history of the earlier template, rotate them); D3 Postgres runs on 5433 via `docker-compose.yml`; D4 one repository with `client/` and `server/`.

| # | Question | Recommendation |
| --- | --- | --- |
| D1 | `server/` currently holds an unrelated MongoDB template (Stripe, S3, Socket.io, `User`/`Image` modules, real credentials in a committed `.env`). What do we do with it? | Clean it in place: keep the helper style (`catchAsync`, `sendResponse`, `ApiError`, module layout), delete the unused modules and dependencies, replace `.env`. Alternative: leave `server/` untouched and build in a fresh `backend/`. |
| D2 | Credentials in `server/.env` are already in git history. | Rotate them (Mongo user, Gmail app password, DigitalOcean key). Not part of the code work. |
| D3 | Local PostgreSQL | Use a new Docker container on port **5433** (`docker-compose.yml`). The existing container on 5432 stays untouched. |
| D4 | Repo layout | One repo root with `server/`, `client/`, `docs/`, `docker-compose.yml`, root `README.md`. Note: `server/` currently has its own `.git`; decide whether to keep two repos or one monorepo. |

## 2. Product decisions (filling the intentional ambiguities)

| Topic | Decision | Reason |
| --- | --- | --- |
| Roles | `STUDENT`, `MENTOR`, `ADMIN` (see the permission matrix below) | Real RBAC with three levels |
| Signup | Student only; role is never read from the request body | Prevents privilege escalation |
| Admin creation | `prisma db seed`, credentials from env | Required by spec |
| Mentor creation | Only an ADMIN can create a mentor (`POST /users/mentors`); optional demo mentor in the seed | Mentors cannot sign up themselves |
| Review access | MENTOR and ADMIN can review; only ADMIN manages mentors | Admin is a superset of mentor |
| Account state | `isActive` boolean on `User` (false = deactivated, cannot log in) | Simple boolean instead of a status enum |
| Token | JWT in an httpOnly cookie, also accepted as `Authorization: Bearer` | XSS-safe for the browser, still usable from API clients |
| API calls | The browser calls `/api/*` on the Next.js origin and `rewrites` in `next.config.ts` forwards it to Express (a plain forward, no backend code in Next.js). The login cookie therefore belongs to the Next.js origin, so `proxy.ts` can read it on every page, in every deployment | No CORS and no cross-site cookie problems. Needs `TRUST_PROXY=1` on Express so per-IP rate limits see the real client IP |
| Duplicate definition | Same normalized **repo URL** or same normalized **live URL** (any student) | One repo = one submission |
| Normalization | lowercase host, drop `www.`, `.git`, trailing slash, query, hash | `GitHub.com/A/B/` equals `github.com/a/b` |
| Duplicate enforcement | App-level check for a friendly message + DB `UNIQUE` on normalized columns | Handles race conditions |
| Repo URL rule | `https://github.com/{owner}/{repo}` (also gitlab.com, bitbucket.org) | "Repo URL" should really be a repo |
| Live link rule | `http(s)` URL, not localhost or private IP | Stops junk links |
| Field limits | name 3-80, description 20-1000, trimmed | Robust validation |
| Rate limit (submit) | 5 successful submissions per user per 10 min, configurable by env, 429 + `Retry-After` | Basic spam protection |
| Rate limit (auth) | 20 failed attempts per IP per 15 min on login/signup | Brute-force protection |
| Global limit | 300 requests per IP per 15 min | Cheap safety net |
| Review | Mentor or admin sets `APPROVED` or `REJECTED`; rejection requires a note (min 5 chars); can change a decision later | Useful feedback for the student |
| Filter | `status = PENDING / APPROVED / REJECTED / ALL`, server side; plus search | Spec asks for Approved/Rejected; Pending and All are free extras |
| Pagination | `page`, `limit` (default 10, max 50), `total`, `totalPages` in `meta` | Server side |
| Stats | Global counts: total, pending, approved, rejected (do not change with the filter) | Spec example |
| Student can see | Own submissions with status and review note | Closes the feedback loop |
| Password | 8-72 chars, at least one letter and one digit, bcrypt | 72 is the bcrypt limit |

### Permission matrix

| Action | STUDENT | MENTOR | ADMIN |
| --- | :---: | :---: | :---: |
| Sign up / log in | signup + login | login only | login only |
| Submit a project | yes | no | no |
| See own submissions | yes | n/a | n/a |
| See all submissions, filter, stats | no | yes | yes |
| Approve / reject | no | yes | yes |
| Create / list mentors | no | no | yes |
| Activate / deactivate a mentor | no | no | yes |

## 3. Data model (PostgreSQL via Prisma)

```
enum Role          { STUDENT MENTOR ADMIN }
enum ProjectStatus { PENDING APPROVED REJECTED }

User
  id uuid PK, name, email UNIQUE, password (hash), role default STUDENT,
  createdAt, updatedAt

Project
  id uuid PK, name, repoUrl, repoKey UNIQUE, liveUrl, liveKey UNIQUE,
  description, status default PENDING, reviewNote?, reviewedAt?,
  reviewerId? -> User, studentId -> User, createdAt, updatedAt
  indexes: (status, createdAt), (studentId, createdAt)
```

## 4. API (base `/api/v1`)

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/auth/signup` | public | creates STUDENT, sets cookie |
| POST | `/auth/login` | public | generic error message, sets cookie |
| POST | `/auth/logout` | any | clears cookie |
| GET | `/auth/me` | authenticated | current user |
| POST | `/projects` | STUDENT | validate, duplicate check, rate limit |
| GET | `/projects/mine` | STUDENT | own submissions, paginated |
| GET | `/projects` | MENTOR, ADMIN | `page, limit, status, search, sortBy, sortOrder` |
| GET | `/projects/stats` | MENTOR, ADMIN | counts per status |
| PATCH | `/projects/:id/review` | MENTOR, ADMIN | `{ status, note? }`; also appends to the decision history |
| GET | `/projects/:id/history` | MENTOR, ADMIN | every decision on a project, newest first (added after the first plan) |
| PATCH | `/projects/:id/reopen` | ADMIN | back to `PENDING`; recorded in the history as a `PENDING` entry |
| POST / DELETE | `/projects/:id/claim` | MENTOR, ADMIN | "I'm reviewing this": take / release a pending project (a 30 min hold: other mentors cannot decide meanwhile, an admin can; added after the first plan) |
| POST | `/users/mentors` | ADMIN | create a mentor (name, email, initial password) |
| GET | `/users/mentors` | ADMIN | list mentors |
| PATCH | `/users/mentors/:id/active` | ADMIN | `{ isActive }` activate / deactivate |
| GET | `/users/students?page&limit&search` | ADMIN | students with their project count (added after the first plan: an admin has to be able to see and manage students) |
| PATCH | `/users/students/:id/active` | ADMIN | `{ isActive }` activate / deactivate a student |

Response shape: `{ success, message, meta?, data }`.
Error shape: `{ success: false, message, errorSources: [{ path, message }] }`.
Status codes: 400 validation, 401 unauthenticated, 403 wrong role, 404, 409 duplicate, 429 rate limited.

## 5. Server structure

```
server/
  prisma/ schema.prisma, migrations/, seed.ts
  src/
    app.ts, server.ts
    config/            env validated with zod
    shared/            catchAsync, sendResponse, prisma
    errors/            ApiErrors, handleZodError
    helpars/           jwtHelpers, paginationHelper
    app/middlewares/   auth(roles), validateRequest, rateLimiters, globalErrorHandler
    app/modules/Auth/     route, controller, service, validation
    app/modules/Project/  route, controller, service, validation, utils (normalizeUrl)
    app/modules/User/     admin-only mentor create / list
    app/routes/index.ts
```

## 6. Client structure (Next.js App Router, Tailwind, ShadCN)

| Route | Who | Content |
| --- | --- | --- |
| `/` | all | redirect by role, or to `/login` |
| `/login` | guest | form, redirects by role |
| `/signup` | guest | student signup |
| `/student` | STUDENT | submission form + "My submissions" with status and note |
| `/review` | MENTOR, ADMIN | stat cards, status tabs, search, paginated table, approve / reject dialog |
| `/admin/mentors` | ADMIN | mentor list + "Add mentor" form |

Libraries: Redux Toolkit + RTK Query (server data and cache), react-hook-form + zod, sonner toasts.
ShadCN components: button, input, textarea, label, card, table, badge, tabs, dialog, select, skeleton, sonner.
Filter and page live in the URL query string (refresh and share safe).
Route guards: `src/proxy.ts` (Next.js 16 name for middleware) verifies the cookie's JWT with `jose` and redirects before the page renders; `AuthProvider` calls `/auth/me` for the user's name / role in the UI.
Every form shows field-level server errors (duplicate, rate limit).

## 7. Todo

### Phase 0: Setup
- [x] Answer D1-D4
- [x] `docker-compose.yml` with Postgres on 5433
- [x] Clean or replace `server/` template, fresh `.env` + `.env.example`

### Phase 1: Backend
- [x] Prisma schema, first migration, seed script (admin)
- [x] Config with env validation
- [x] Error handler, `validateRequest` (body / query / params)
- [x] Auth module: signup, login, logout, me, auth middleware with role guard
- [x] URL normalization util + Project validation schemas
- [x] `POST /projects` with duplicate check and rate limiter
- [x] `GET /projects/mine`
- [x] `GET /projects` (server-side filter, search, pagination, sort)
- [x] `PATCH /projects/:id/review`
- [x] `GET /projects/stats`
- [x] Admin-only mentor create / list (`/users/mentors`)
- [x] `isActive` toggle for mentors
- [x] Login refuses inactive users
- [x] Security basics: helmet, cors, body size limit, auth rate limiter

### Phase 2: Backend verification
- [x] `tsc` build passes
- [x] curl checks: signup/login, role denial (student on admin routes), validation errors, duplicate (same URL, different casing), rate limit 429, filter, pagination, stats, review

### Phase 3: Frontend
- [x] Scaffold Next.js, Tailwind, ShadCN, `/api` rewrite + env (`API_URL`, `JWT_SECRET`)
- [x] RTK Query store, `AuthProvider`, `proxy.ts` route guard
- [x] Login and signup pages
- [x] Student page: form, "My submissions"
- [x] Review page: stats, tabs, search, table, pagination, approve / reject dialog
- [x] Admin mentors page: list + add mentor form
- [x] Loading, empty and error states, responsive layout
- [x] `next build` and `lint` pass

### Phase 4: Wrap-up
- [x] Root `README.md`: setup, env vars, seed credentials, API list, decisions, trade-offs
- [x] End-to-end manual run of both roles
- [ ] Reminder: make the repo **public** after the deadline (not done yet: it is a manual step)

## 8. Known trade-offs (to mention in README)
- Rate limiter uses an in-memory store; a multi-instance deployment needs a Redis store.
- Repo existence is not verified against the GitHub API (avoids network flakiness and rate limits).
- No email verification or password reset (out of scope).
