# Project Review

A small web app where **students submit their projects** and **mentors review them**.

- Students sign up, submit a project (name, repo URL, live link, description) and follow its status.
- Mentors see every submission in a paginated table, filter and search it, and approve or reject it
  (a rejection needs a written reason, which the student sees). The table shows who made each decision,
  can be filtered by reviewer, and every project keeps the full history of decisions made on it.
- A mentor can **take** a pending project ("I'm reviewing this") so the others see it is being looked at
  and don't do the same work twice.
- An admin can also review, sees every student, adds mentors, and switches student and mentor accounts off or on.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI, Redux Toolkit + RTK Query, react-hook-form + zod |
| Backend | Express 5, TypeScript, zod |
| Database | PostgreSQL 17 via Prisma 6 |
| Auth | JWT in an httpOnly cookie, role-based access control (`STUDENT`, `MENTOR`, `ADMIN`) |

## Repository layout

```
client/   Next.js app (UI only, no backend code)
server/   Express API + Prisma schema, migrations, seed
docs/     Requirements, plan, database and frontend design notes
docker-compose.yml   PostgreSQL for local development
```

## Run it locally

You need **Node.js 22 or newer** and **Docker** (for PostgreSQL). Start from the repository root.

```bash
# 1. Database (PostgreSQL on localhost:5433)
docker compose up -d db

# 2. API  ->  http://localhost:5000
cd server
cp .env.example .env
npm install
npm run db:deploy        # creates the tables
npm run db:seed          # creates the admin and a demo mentor
npm run dev

# 3. Web app  ->  http://localhost:3000
#    (open a second terminal at the repository root)
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

| Role | Email | Password | Lands on |
| --- | --- | --- | --- |
| Admin | `admin@example.com` | `Admin@12345` | `/review` (+ `/admin/students`, `/admin/mentors`) |
| Mentor | `mentor@example.com` | `Mentor@12345` | `/review` |
| Student | sign up on `/signup` | your choice | `/student` |

These come from `server/.env` (`ADMIN_*`, `MENTOR_*`). Change them before deploying anywhere public.

### Scripts

| Where | Command | What it does |
| --- | --- | --- |
| `server` | `npm run dev` | API with auto-restart |
| `server` | `npm run build` / `npm start` | compile to `dist/` and run it |
| `server` | `npm run typecheck` | TypeScript check |
| `server` | `npm run db:migrate` | create a new migration after editing `schema.prisma` |
| `server` | `npm run db:deploy` | apply existing migrations |
| `server` | `npm run db:seed` | create / refresh the admin and demo mentor |
| `server` | `npm run db:studio` | browse the database |
| `client` | `npm run dev` | Next.js dev server |
| `client` | `npm run build` / `npm start` | production build and server |
| `client` | `npm run lint`, `npm run typecheck` | ESLint, TypeScript |

## How it fits together

```
Browser ──► Next.js :3000 ──/api/*──► Express :5000 ──► PostgreSQL :5433
              │ (rewrite in next.config.ts)
              └─ proxy.ts guards the pages
```

- **Next.js is only the frontend.** It has no API routes or server actions. `next.config.ts` forwards
  `/api/*` to Express, so the browser only ever talks to one origin. That keeps the login cookie on the
  app's own origin, which is what lets `src/proxy.ts` (Next 16's name for middleware) read it, and it
  removes CORS and cross-site cookie problems.
- **Login** sets an httpOnly JWT cookie (JavaScript cannot read it). `proxy.ts` verifies it (with the
  same `JWT_SECRET` as the API) *before a page renders* and redirects: no login goes to `/login`, the
  wrong role goes to its own area.
- **The API re-checks everything.** Roles are enforced on every endpoint from the database, not from the
  token alone, so deactivating a mentor takes effect on their next request. The browser-side guards are
  only for a nicer experience.
- **Server data** lives in RTK Query. Mutations invalidate tags, so lists and the stat counts refresh by
  themselves after a submit or a review.
- **Filters live in the URL** (`/review?status=PENDING&q=chat&page=2`): refresh, back button and shared
  links all work. Filtering, searching and paging happen on the server.

### Roles

| | Student | Mentor | Admin |
| --- | :---: | :---: | :---: |
| Sign up | yes | no | no |
| Submit projects, see their own | yes | no | no |
| See all projects, filter, search, stats | no | yes | yes |
| Approve / reject | no | yes | yes |
| See who decided, the history of decisions, filter by reviewer | no | yes | yes |
| Take a pending project, release one's own | no | yes | yes |
| Release a project somebody else took | no | no | yes |
| Reopen a decided project (back to pending) | no | no | yes |
| See all students and how many projects each has | no | no | yes |
| Add mentors; switch student and mentor accounts off / on | no | no | yes |

Students sign up themselves; the role is never taken from the request. Mentors are created by an admin,
and the admin is created by the seed.

## Requirements and where they are met

| Requirement | How |
| --- | --- |
| Submission form: name, repo URL, live link, description | `client/src/components/student/project-form.tsx` |
| Robust validation | zod on both sides: same rules and messages in the browser (`client/src/lib/validations.ts`) and the API (`server/.../project.validation.ts`) |
| No duplicate submissions | the repo URL **and** the live link are each unique across all students, compared after normalising (case, `www.`, `.git`, trailing `/`, `http`/`https`, query string). Enforced in the service *and* by unique database indexes, so two simultaneous requests cannot both succeed |
| Rate limit | 5 successful submissions per student per 10 minutes (`429` + `Retry-After`, the form shows a countdown); also login (20 failures / 15 min / IP), signup (10 / hour / IP) and a global limit |
| Paginated table | `/review`, 10 per page, `meta` with totals from the API |
| Approve and reject | one click to approve; a reject dialog requires a reason (min. 5 characters) |
| Server-side filter for Approved / Rejected | `GET /projects?status=APPROVED\|REJECTED\|PENDING\|ALL`, plus server-side search and sort |
| Aggregated statistics | total / pending / approved / rejected cards (`GET /projects/stats`), clickable as filters |
| Login, student signup | `/login`, `/signup` |
| Admin seeded in the database | `npm run db:seed` |
| JWT-based RBAC | JWT cookie + role guards on the API, `proxy.ts` on the pages |

## Decisions where the brief left room

| Question | Decision |
| --- | --- |
| What counts as a duplicate? | Same normalised repo URL **or** same normalised live link, across all students |
| Which repo URLs are valid? | `https://` GitHub / GitLab / Bitbucket `owner/repo` |
| Which live links are valid? | public `http(s)` domains only: no `localhost`, IP addresses, `.local`, or `user:pass@` |
| Can a decision be changed? | Yes. The project shows the latest decision (an approval clears an earlier rejection note), and **every** decision (who, when, why) is kept in a history table, shown in the project's detail panel |
| Can a decided project go back to pending? | Yes, an **admin** can "Reopen" it (asks first). The decision fields are cleared and the reopening is added to the history as a Pending entry (earlier decisions are kept), so it stays auditable. No migration was needed: the history's `status` column already allows `PENDING` |
| Two mentors on the same project? | "Take" is a **hold**: others see who has it, with a "28 min left" countdown, and a **mentor cannot approve or reject it** (the buttons are disabled and the API answers `409`). It cannot stall a project for long: the hold ends after 30 minutes (`CLAIM_TTL_MINUTES`) on its own, and an **admin** can release it, or decide anyway after a "decide anyway?" question. The claim ends when a decision is made or when it is released. Taking is one conditional database update, so when two people press Take at the same instant exactly one gets it. An admin can release anyone's claim. Not built: an admin assigning a project to a named mentor |
| Who reviewed what? | The table has a "Reviewed by" column and a reviewer filter ("anyone", "me", or, for an admin, any mentor); the Mentors page shows how many decisions each mentor has made, linking to them |
| Why must a rejection have a reason? | The student needs to know what to fix; they see it on their project |
| Is "Pending" a filter? | Yes, plus "All". The brief asked for Approved and Rejected |
| Mentors vs. admin | Three roles. The brief mentions a "mentor view" and a seeded admin; admin can do everything a mentor can and also manages mentors |
| How does a mentor get an account? | An admin creates it and chooses the first password |
| Managing accounts | An admin can switch a student or a mentor off (`isActive = false`): they cannot log in and an open session ends on its next request. Reversible; their projects stay. An admin account can't be switched off through the API |
| Where do tokens live? | httpOnly cookie, not `localStorage` |

## Deploying

- Set the **same `JWT_SECRET`** (a long random string) for the API *and* the Next.js app.
- Next.js needs `API_URL` (the API's `/api/v1` address) **at build and start time**; it is used by the
  rewrite.
- API: `NODE_ENV=production`, `DATABASE_URL`, `CLIENT_ORIGIN`, and `TRUST_PROXY=1` (the Next.js app sits in
  front of it, so per-IP rate limits need the forwarded client address).
- `server/Dockerfile` builds the API; the container applies pending migrations, then starts. Run
  `db:seed` once to create the admin, and change the demo passwords.
- **Neon (PostgreSQL):** `DATABASE_URL` is the pooled host (`-pooler`) plus `&pgbouncer=true`; `DIRECT_URL` is
  the same database without the pooler, used only by `prisma migrate` (a pooler can't take its lock). Run
  `npm run db:deploy` and `npm run db:seed` once against it from your machine.
- **Vercel, two projects:** `server/` (the API) and `client/` (the Next.js app). `server/api/index.ts` and
  `server/vercel.json` run Express as one serverless function. Deploy the API first, then give the client
  its address as `API_URL` (`https://<api>.vercel.app/api/v1`) *before* building it. Both projects need the
  same `JWT_SECRET`. On Vercel the API's rate limiters are per function instance (in memory), so they are
  best-effort there.
- Production responses never include error internals (`err`, `stack`); only `NODE_ENV=development` does.

## Limitations and what I would do next

- **No automated test suite is committed.** The behaviour was checked by hand and with throw-away scripts
  driving the API and a real browser; turning those into committed API tests (Vitest + Supertest) and
  Playwright end-to-end tests is the first thing to add.
- The rate limiter keeps its counters in memory. With more than one API instance it needs a shared store
  such as Redis.
- Repository and live-link URLs are validated for shape, not fetched, so a link can be well-formed and
  still broken.
- No email flows (verification, password reset) and no way to change a password yet.
- A mentor's first password is chosen by the admin and handed over out of band.
- Projects are not *assigned* to mentors by an admin, and nothing records who merely opened a project: only
  decisions and "Take" claims (which expire) are tracked. The hold ends by itself after 30 minutes, so a mentor
  who takes a project and disappears blocks the other mentors for at most that long (an admin can release it sooner).
- The review table refreshes every minute while it is open (so other mentors' claims show up); the
  per-IP API limit is shared by everyone behind one address, so a large office would need a higher
  `GLOBAL_RATE_LIMIT_MAX`.

More detail: [`docs/`](docs) (requirements, plan, database model, frontend design) and
[`server/README.md`](server/README.md) (API reference).
