# Project Review: API

Express 5 + TypeScript + Prisma (PostgreSQL). How to run the whole project is in the
[root README](../README.md); this file is the API reference.

Base URL: `http://localhost:5000/api/v1`. The web app reaches it through its own `/api` rewrite.

## Conventions

**Success**

```json
{ "success": true, "message": "Projects retrieved successfully", "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 23, "totalPages": 3 } }
```

`meta` appears on lists only. Dates are ISO strings.

**Error**

```json
{ "success": false, "message": "Validation Error", "errorSources": [ { "path": "repoUrl", "message": "Repo URL must look like ..." } ] }
```

`path` is the form field the message belongs to (`""` when it is not about a field). In
`NODE_ENV=development` the body also carries `err` and `stack`; never in production.

| Status | Meaning |
| --- | --- |
| 400 | validation failed (body, query or id) |
| 401 | not logged in, or the token is invalid / expired |
| 403 | wrong role, or the account is deactivated |
| 404 | not found |
| 409 | duplicate (email, repo URL or live link) |
| 413 | request body larger than 10 KB |
| 429 | rate limit hit; `Retry-After` header says how many seconds to wait |

## Authentication

`POST /auth/login` and `POST /auth/signup` set an **httpOnly cookie** named `token` (a JWT holding
`{ id, role }`, valid 7 days by default). Every protected request is authenticated from that cookie; an
`Authorization: Bearer <token>` header is accepted too, for API clients.

The user is re-read from the database on **every** request, so a deactivated account or a changed role
takes effect immediately.

## Endpoints

### Auth

| Method | Path | Access | Body | Result |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | public | `{ name, email, password }` | `201` the new user (always a `STUDENT`); sets the cookie |
| POST | `/auth/login` | public | `{ email, password }` | `200` the user; sets the cookie |
| POST | `/auth/logout` | public | | `200`; clears the cookie |
| GET | `/auth/me` | any logged-in user | | the current user |

- `name` 2–60 characters. `email` a valid address (stored lowercase). `password` 8–72 characters with at
  least one letter and one number.
- Extra fields are rejected (`400`), so `role` cannot be sent.
- A wrong email and a wrong password give the same `401 Invalid email or password`.

### Projects

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/projects` | `STUDENT` | submit a project |
| GET | `/projects/mine?page&limit` | `STUDENT` | the student's own projects, newest first |
| GET | `/projects` | `MENTOR`, `ADMIN` | all projects, with filters (below) |
| GET | `/projects/stats` | `MENTOR`, `ADMIN` | `{ total, pending, approved, rejected }` |
| GET | `/projects/:id/history` | `MENTOR`, `ADMIN` | every decision on the project, newest first: `{ status, note, createdAt, reviewer: { id, name } }` |
| POST | `/projects/:id/claim` | `MENTOR`, `ADMIN` | "I'm reviewing this": take a **pending** project. `409` if somebody else holds it (the message names them) or it is not pending |
| DELETE | `/projects/:id/claim` | `MENTOR`, `ADMIN` | give it back. The holder can, an admin can release anyone's, anyone can once it expired; otherwise `403` |
| PATCH | `/projects/:id/review` | `MENTOR`, `ADMIN` | approve or reject |
| PATCH | `/projects/:id/reopen` | `ADMIN` | put an approved or rejected project back to `PENDING` (`409` if it already is) |

**`POST /projects`** body:

| Field | Rule |
| --- | --- |
| `name` | 3–80 characters |
| `repoUrl` | `https://` GitHub, GitLab or Bitbucket `owner/repo` |
| `liveUrl` | public `http(s)` URL; no `localhost`, IP address, `.local` / `.internal`, or `user:pass@` |
| `description` | 20–1000 characters |

A project is a duplicate when its **repo URL** or **live link** matches an existing one after
normalising (lowercase, no `www.`, no `.git`, no trailing `/`, no query or hash, `http` = `https`). It then
gets `409` with `errorSources` naming `repoUrl`, `liveUrl` or both. This holds across all students and is
backed by unique database indexes. Limited to **5 successful submissions per student per 10 minutes**.

**`GET /projects`** query parameters (all optional):

| Parameter | Values | Default |
| --- | --- | --- |
| `page` | integer ≥ 1 | `1` |
| `limit` | 1–50 | `10` |
| `status` | `ALL`, `PENDING`, `APPROVED`, `REJECTED` | `ALL` |
| `search` | up to 100 characters; matches project name, repo URL, student name or email, case-insensitive (`%` and `_` are literal) | none |
| `reviewer` | `me`, or the id of a mentor / admin: only projects whose **latest** decision was theirs | none |
| `claim` | `mine` (projects I have taken) or `none` (pending and nobody holds them: the work queue) | none |
| `sortBy` | `createdAt`, `name`, `status` | `createdAt` |
| `sortOrder` | `asc`, `desc` | `desc` |

**`PATCH /projects/:id/review`** body: `{ "status": "APPROVED" | "REJECTED", "note"?: string }`. A rejection
needs a `note` of at least 5 characters (max 500). A decision can be changed later; the latest one wins
and replaces the earlier note and reviewer on the project row. Every decision is also written to
`project_reviews` (the history) in the same database transaction as the update, so the two cannot disagree
and a failed review leaves no trace.

**`PATCH /projects/:id/reopen`** (admin only, no body) sets the project back to `PENDING` and clears its
`reviewNote`, `reviewedAt`, `reviewer` and any claim. It writes a history entry with `status: "PENDING"` (the
admin who reopened it), in the same transaction; earlier decisions stay in the history. The student sees the
project as pending again. A "reopened" entry is not counted in a mentor's `reviewCount`.

### Taking a project

A claim is a **hold** on a pending project. Each project in the mentor/admin list carries `claimedBy` (`{ id, name }`)
`claimedAt` and `claimExpiresAt` (`claimedAt` + the TTL, so the web app can show "28 min left"), all `null` unless somebody holds it. A claim counts for `CLAIM_TTL_MINUTES` (default 30)
and is simply ignored after that, so nothing has to clean it up. Deciding a project (approve / reject) ends
the claim. While somebody else holds a project, `PATCH /projects/:id/review` from a **mentor** is refused
with `409` (the message names the holder); an **admin** may still decide, and the web app asks first. The
check is part of the same `UPDATE` that records the decision. Taking is one conditional `UPDATE`, so two simultaneous requests cannot both succeed. Students never
see claims.

### Students and mentors (admin only)

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| POST | `/users/mentors` | `{ name, email, password }` | `201` the new mentor (the admin chooses the first password) |
| GET | `/users/mentors?page&limit` | | the mentors, each with `reviewCount` (how many decisions they have made) |
| PATCH | `/users/mentors/:id/active` | `{ "isActive": true \| false }` | switch a mentor on or off |

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| GET | `/users/students?page&limit&search` | | the students, newest first, each with `projectCount`; `search` matches name or email (case-insensitive, `%` and `_` literal) |
| PATCH | `/users/students/:id/active` | `{ "isActive": true \| false }` | switch a student on or off |

Each `:id` must belong to the role the path is for (mentor or student). An admin's id, or an id of the other
role, answers `404`, so these endpoints can never lock an admin out. A switched-off account cannot log in,
and a session that is already open is refused on its next request (`403`).

## Rate limits

| What | Limit | Counted per |
| --- | --- | --- |
| Project submission | 5 successful per 10 min (`SUBMISSION_RATE_LIMIT_*`) | student |
| Login | 20 failed per 15 min | IP |
| Signup | 10 per hour | IP |
| Everything under `/api/v1` | 300 per 15 min (`GLOBAL_RATE_LIMIT_MAX`) | IP |

Counters are in memory. Per-IP limits use the real client address, which needs `TRUST_PROXY` set to the
number of proxies in front of the API.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | default `5000` |
| `NODE_ENV` | `development` shows error internals; anything else hides them; `production` makes the cookie `Secure` |
| `JWT_SECRET` | signs the login token (required). The Next.js app needs the same value |
| `EXPIRES_IN` | token lifetime, default `7d` |
| `BCRYPT_SALT_ROUNDS` | default `12` |
| `CLIENT_ORIGIN` | browser origins allowed by CORS, comma separated |
| `TRUST_PROXY` | number of proxies in front of the API |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the admin created by `npm run db:seed` |
| `MENTOR_EMAIL`, `MENTOR_PASSWORD` | optional demo mentor, created by the same seed |
| `SUBMISSION_RATE_LIMIT_MAX`, `SUBMISSION_RATE_LIMIT_WINDOW_MINUTES`, `GLOBAL_RATE_LIMIT_MAX` | optional overrides |
| `CLAIM_TTL_MINUTES` | how long "I'm reviewing this" holds a project, default `30` |

The seed creates a user if it is missing and otherwise only makes sure the role is right and the account is
active. It never overwrites an existing password.

## Code layout

```
prisma/              schema.prisma, migrations/, seed.ts
src/
  app.ts, server.ts
  config/            environment
  app/
    middlewares/     auth (roles), validateRequest, rateLimiters, globalErrorHandler
    modules/
      Auth/          routes, controller, service, validation, interface
      Project/       ... plus project.utils.ts (URL normalisation)
      User/          mentor management
    routes/          mounts the modules
  errors/, helpars/, shared/, interfaces/
```

Each module follows `routes → controller → service`; the service holds the logic and talks to Prisma.

## Docker

```bash
docker build -t project-review-api server
docker run --env-file server/.env -p 5000:5000 project-review-api
```

The container applies pending migrations (`prisma migrate deploy`), then starts the API. When the database
runs on your own machine, add `--network host` (and keep `localhost` in `DATABASE_URL`).
