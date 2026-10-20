# Project Submission & Review Dashboard — Requirements

## Overview

Build a simple project submission and review dashboard.

> **Repository visibility:** Initially the GitHub repo may be kept **private**. After the submission deadline it **must be made public**. If the repository is not reachable, the submission will be **disqualified**.

## Technical Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Frontend | Next.js, TailwindCSS, ShadCN |
| Backend | Express.js |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT-based Role-Based Access Control (RBAC) |

## Feature Requirements

### 1. Submission Portal (Student View)

- **a.** A form to submit project details:
  - Project name
  - Repo URL
  - Live Link
  - Description
- **b.** Implement robust validation and prevent duplicate submission.
- **c.** Implement a basic rate limit to prevent spam.

### 2. Review Dashboard (Mentor View)

- **a.** Paginated data table.
- **b.** Approval and rejection actions.
- **c.** Filter to show "Approved" and "Rejected" projects — filters must be implemented **server side**.
- **d.** Aggregated statistics (e.g. Total Pending, Total Approved).

### 3. Authentication Page

- **a.** Login page.
- **b.** Signup page for students.
- **c.** For now the admin can be seeded directly in the database.

## Notes

- Some ambiguities are left in the feature requirements **intentionally**. Use your best judgment to fill them in.

## Checklist

- [ ] Student signup & login
- [ ] Admin/mentor seeded in DB; login
- [ ] JWT auth + role-based access (student vs. mentor)
- [ ] Submission form with validation
- [ ] Duplicate submission prevention
- [ ] Rate limiting on submissions
- [ ] Mentor dashboard: paginated table
- [ ] Approve / reject actions
- [ ] Server-side status filter (Approved / Rejected)
- [ ] Aggregated stats (Pending / Approved / Rejected totals)
- [ ] Repo made public after the deadline
