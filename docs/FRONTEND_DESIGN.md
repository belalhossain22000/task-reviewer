# Frontend Design

Next.js (App Router), TailwindCSS, ShadCN. Design only; no code written yet.
Related: [PLAN.md](PLAN.md), [DATABASE.md](DATABASE.md)

## 1. Design goals
1. A student can submit a project in under a minute and always knows its status.
2. A mentor can clear the pending queue quickly: see, decide, move on.
3. Every state is designed: loading, empty, error, success. Nothing looks broken while waiting.
4. Looks clean and consistent with stock ShadCN; no custom design system.

## 2. Visual language

| Aspect | Choice |
| --- | --- |
| Components | ShadCN, `new-york` style, neutral base color |
| Accent | One brand color (indigo) for primary buttons, active tab, focus ring |
| Font | Inter via `next/font` |
| Theme | Light and dark (system default, manual toggle in the navbar) |
| Radius / spacing | ShadCN defaults (`0.5rem`), 4px spacing scale |
| Icons | `lucide-react` |
| Toasts | `sonner` |

### Status colors (always icon + text, never color alone)

| Status | Badge | Icon |
| --- | --- | --- |
| Pending | amber | clock |
| Approved | green | check-circle |
| Rejected | red | x-circle |

## 3. Sitemap and access

| Route | Access | Guest | Student | Mentor | Admin |
| --- | --- | --- | --- | --- | --- |
| `/` | all | to `/login` | to `/student` | to `/review` | to `/review` |
| `/login` | guest only | page | redirect | redirect | redirect |
| `/signup` | guest only | page | redirect | redirect | redirect |
| `/student` | STUDENT | to `/login` | page | to `/review` | to `/review` |
| `/review` | MENTOR, ADMIN | to `/login` | to `/student` | page | page |
| `/admin/mentors` | ADMIN | to `/login` | to `/student` | to `/review` | page |
| `*` | all | custom 404 page | | | |

The navbar shows a "Mentors" link only to admins.

Guard: `AuthProvider` fetches `/auth/me` once, exposes `{ user, isLoading }`. While loading, show a full-page skeleton (no flash of the wrong page).

## 4. Shared layout (app shell)

```
+--------------------------------------------------------------+
| [logo] Project Review          [theme] [Name v] (Role badge) |
+--------------------------------------------------------------+
|                                                              |
|   page content, max-w-6xl, centered, px-4 md:px-6            |
|                                                              |
+--------------------------------------------------------------+
```

- User menu: name, email, role, Logout.
- Auth pages use a simple centered card without the navbar links.

## 5. Page designs

### 5.1 Login `/login`

```
        +----------------------------+
        |  Welcome back              |
        |  Log in to continue        |
        |                            |
        |  Email    [______________] |
        |  Password [______________] [eye] |
        |  [        Log in         ] |
        |  No account? Sign up       |
        +----------------------------+
```

- Wrong credentials: one inline alert "Invalid email or password" (server message, no hint which was wrong).
- 429: alert "Too many attempts, try again in N minutes" using `Retry-After`.
- Button shows a spinner and is disabled while submitting.

### 5.2 Signup `/signup`

Fields: Full name, Email, Password (with live rule checklist: 8+ chars, a letter, a digit), Confirm password.
Success: logged in automatically, redirect to `/student`. Duplicate email: field error on Email.

### 5.3 Student page `/student`

Desktop: two columns. Mobile: form first, list below.

```
+-----------------------------------+------------------------------------+
| Submit a project                  | My submissions                (3)  |
|                                   |                                    |
| Project name   [______________]   | +--------------------------------+ |
| Repo URL       [______________]   | | Portfolio Site        [Pending]| |
|   https://github.com/owner/repo   | | github.com/x/portfolio  Live ↗ | |
| Live link      [______________]   | | Submitted 2 days ago           | |
| Description    [______________]   | +--------------------------------+ |
|                [______________]   | | Chat App             [Rejected]| |
|                 0 / 1000          | | Mentor note: "Live link 404"   | |
| [        Submit project       ]   | +--------------------------------+ |
+-----------------------------------+------------------------------------+
```

Form behavior:
- Validation runs on blur and on submit (react-hook-form + zod; the same rules as the server).
- Helper text under Repo URL shows the expected format.
- Live character counter on Description.
- Server errors map onto fields using `errorSources[].path`. A `409` shows "This repository was already submitted" under Repo URL (or Live link).
- A `429` disables the submit button and shows a countdown from `Retry-After`.
- Success: toast, form resets, new item appears at the top of the list (query invalidation).

My submissions list:
- Cards, newest first, with a Load more button (or simple pagination; decide at build time).
- Rejected cards show the mentor's note in a highlighted block. Approved cards may show an optional note.
- Empty state: "You haven't submitted anything yet" with an arrow towards the form.

### 5.4 Review page `/review` (mentor and admin)

```
+--------------------------------------------------------------------------+
| Review dashboard                                                         |
|                                                                          |
| +-----------+ +-----------+ +-----------+ +-----------+                  |
| | Total     | | Pending   | | Approved  | | Rejected  |                  |
| |   42      | |   12      | |   25      | |    5      |                  |
| +-----------+ +-----------+ +-----------+ +-----------+                  |
|                                                                          |
| [ All ] [ Pending 12 ] [ Approved 25 ] [ Rejected 5 ]   [ Search...  ]   |
|                                                                          |
| Project        Student        Links      Submitted   Status    Actions   |
| ---------------------------------------------------------------------    |
| Portfolio      Rahim          Repo Live  2d ago      Pending   [✓] [✕]   |
| Chat App       Karim          Repo Live  3d ago      Rejected  [✓]       |
| ...                                                                      |
|                                                                          |
| Showing 1-10 of 42        Rows [10 v]        [< Prev]  1 2 3 4  [Next >] |
+--------------------------------------------------------------------------+
```

Behavior:
- Stat cards are clickable and set the same filter as the tabs. Counts are global and do not change with the filter or search.
- Tabs, search, page and page size live in the URL (`?status=PENDING&page=2&q=chat`) so refresh, back button and sharing work. Changing a filter resets page to 1. Search is debounced 300 ms.
- Filtering, searching and pagination are all server side; the table keeps the previous data dimmed while the next page loads (no layout jump).
- Row click opens a **side sheet** with the full description, repo and live links, student name and email, current status and review note.
- **Approve**: one click, optimistic update, toast "Approved", stats refresh.
- **Reject**: opens a dialog with a required note (min 5 chars), Cancel / Reject buttons. Server error shown inside the dialog.
- Already-decided rows still allow the opposite action (decision can be changed).
- Mobile (< 768px): the table becomes a stack of cards; actions sit at the bottom of each card; tabs scroll horizontally.

Empty states:
- No projects at all: "No submissions yet".
- Filter returns nothing: "No rejected projects" with a Clear filters button.

### 5.5 Mentors page `/admin/mentors` (admin only)

```
+--------------------------------------------------------------+
| Mentors                                        [ + Add mentor ] |
|                                                              |
| Name          Email                  Added                   |
| ----------------------------------------------------------   |
| Rahim Uddin   rahim@example.com      3 days ago              |
| ...                                                          |
+--------------------------------------------------------------+
```

- "Add mentor" opens a dialog: Name, Email, Initial password. Duplicate email shows a field error.
- Simple list, no pagination needed at this scale. Empty state: "No mentors yet".
- No edit or delete in scope.

## 6. Component inventory

### ShadCN primitives
`button`, `input`, `textarea`, `label`, `card`, `table`, `badge`, `tabs`, `dialog`, `sheet`, `select`, `skeleton`, `dropdown-menu`, `alert`, `sonner`, `form`, `pagination` (or custom), `tooltip`.

### App components

| Component | Responsibility |
| --- | --- |
| `AppShell` / `Navbar` | layout, user menu, theme toggle |
| `AuthProvider`, `useAuth` | current user, login / logout / signup helpers |
| `RoleGuard` | redirects by role and auth state |
| `LoginForm`, `SignupForm` | auth forms |
| `PasswordInput` | show/hide toggle |
| `ProjectForm` | student submission form |
| `MyProjectsList`, `ProjectCard` | student list |
| `StatusBadge` | the single place that maps status to color and icon |
| `StatsCards` | four clickable cards |
| `StatusTabs` | filter tabs with counts |
| `ProjectsTable` | desktop table, mobile card fallback |
| `TablePagination` | page info, page size, prev/next |
| `ProjectDetailSheet` | full project info |
| `RejectDialog` | rejection note form |
| `EmptyState`, `ErrorState`, `TableSkeleton` | shared states |

## 7. Data and state

| Concern | Approach |
| --- | --- |
| Server data | TanStack Query: `["me"]`, `["projects", filters]`, `["projects","mine"]`, `["stats"]` |
| Mutations | `submitProject`, `reviewProject`; on success invalidate `projects` and `stats` |
| Filter state | URL search params (single source of truth) |
| Forms | react-hook-form + zod resolver |
| HTTP | thin `api.ts` wrapper around `fetch` with `credentials: "include"`; throws a typed `ApiError` carrying `status`, `message`, `errorSources`, `retryAfter` |
| Auth transport | httpOnly cookie. Browser calls `/api/*` on the Next origin and Next rewrites to Express (no CORS issues) |
| Global 401 | clear cached user, redirect to `/login` with a "session expired" toast |

## 8. Suggested folder structure

```
client/src/
  app/
    layout.tsx, globals.css, not-found.tsx
    page.tsx                      redirect by role
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (app)/layout.tsx              AppShell + guard
    (app)/student/page.tsx
    (app)/review/page.tsx
    (app)/admin/mentors/page.tsx
  components/
    ui/                           ShadCN generated
    layout/                       Navbar, AppShell, ThemeToggle
    auth/                         LoginForm, SignupForm, PasswordInput
    student/                      ProjectForm, MyProjectsList, ProjectCard
    admin/                        StatsCards, StatusTabs, ProjectsTable, ...
    common/                       StatusBadge, EmptyState, ErrorState
  lib/                            api.ts, query-client.ts, utils.ts, validations.ts
  hooks/                          use-auth.ts, use-projects.ts, use-debounce.ts
  providers/                      AuthProvider, QueryProvider, ThemeProvider
  types/                          api.ts (User, Project, Meta, ApiResponse)
```

## 9. UX, accessibility, responsiveness
- Every input has a visible label and a linked error message (`aria-describedby`); focus moves to the first invalid field on submit.
- Buttons that mutate show a pending state and are disabled to prevent double submit.
- Status is never conveyed by color alone.
- Dialogs and sheets trap focus and close on Escape (ShadCN/Radix default).
- Tables have proper `<th scope>`; icon-only buttons have `aria-label` and a tooltip.
- Breakpoints: mobile-first, `md` (768px) switches table to full table and the student page to two columns.
- Dates shown relative ("2 days ago") with the exact timestamp in a tooltip.
- External links open with `target="_blank" rel="noopener noreferrer"`.

## 10. Frontend todo (maps to PLAN.md Phase 3)
- [ ] Scaffold Next.js + Tailwind + ShadCN; theme tokens, Inter, dark mode
- [ ] `api.ts`, typed `ApiError`, Next rewrite `/api/*` to Express
- [ ] `QueryProvider`, `AuthProvider`, `RoleGuard`
- [ ] `AppShell`, `Navbar`, theme toggle, 404 page
- [ ] Login and signup pages
- [ ] `StatusBadge`, `EmptyState`, `ErrorState`, skeletons
- [ ] Student: `ProjectForm` with server error mapping and 429 countdown
- [ ] Student: `MyProjectsList`
- [ ] Admin: `StatsCards`, `StatusTabs`, search, URL-synced filters
- [ ] Admin: `ProjectsTable` with server pagination, mobile card layout
- [ ] Admin: approve action (optimistic), `RejectDialog`, `ProjectDetailSheet`
- [ ] Responsive and keyboard pass; `next build` and lint clean

## 11. Questions to settle before building
1. Brand: indigo accent and the neutral ShadCN look, or a different color?
2. Product name shown in the navbar (placeholder: "Project Review")?
3. Student list: "Load more" button or numbered pagination?
4. Admin row detail: side sheet (proposed) or a separate `/admin/projects/[id]` page?
5. Dark mode: keep it (small cost with ShadCN) or skip?
