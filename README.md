# Traverse

A platform to run internship programs end to end: programs, applications, interviews, mentors, tasks, documents, notifications, dashboards and audit history.

## Features

**Interns**
- Register, log in, and manage a profile and CV
- Browse open programs and apply
- Track applications and interviews
- Dashboard with placement progress, upcoming deadlines, recent feedback, mentor and next interview
- Tasks: start, submit a file, replace it while submitted, and resubmit after changes are requested
- Documents and in-app notifications

**Staff**
- Approve staff accounts and edit permissions
- Program lifecycle, from draft to archive
- Review applications (a reason is recorded when rejecting), run an interview calendar with results, then accept or reject
- Interns list and detail, internship status changes
- Mentor assignment and workload
- Task board: create and edit tasks, review submissions, give feedback
- Internship documents, notifications and a dashboard
- Audit viewer to see who changed what and when

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node 20, NestJS (Express), TypeScript, Prisma 6.19.3 (pinned), PostgreSQL |
| Auth | JWT in an httpOnly cookie, bcryptjs (cost 12) |
| Validation and docs | class-validator, class-transformer, @nestjs/swagger |
| Events and jobs | @nestjs/event-emitter, @nestjs/schedule |
| Files | multer (memory storage) with local-disk storage |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v4 |
| Frontend data and forms | TanStack Query, react-hook-form, zod, lucide-react |

## Repository structure

```
traverse/
├─ backend/        NestJS API
│  ├─ prisma/      schema, migrations, seed
│  ├─ src/         auth, profile, staff, programs, applications, interviews,
│  │               internships, tasks, documents, notifications, dashboard, audit
│  └─ storage/     uploaded files (git-ignored)
├─ frontend/       Next.js app
│  └─ src/         app (routes), components, hooks, config, lib, providers, types
└─ docs/           project documents (requirements, notes)
```

### Frontend routes

| Area | Routes |
|---|---|
| Auth | `/login`, `/register` |
| Intern | `/intern/dashboard`, `/intern/programs`, `/intern/programs/[id]`, `/intern/applications`, `/intern/applications/[id]`, `/intern/documents`, `/intern/tasks`, `/intern/tasks/[id]` |
| Staff | `/staff/dashboard`, `/staff/team`, `/staff/programs`, `/staff/programs/new`, `/staff/programs/[id]`, `/staff/applications`, `/staff/applications/[id]`, `/staff/interviews`, `/staff/interns`, `/staff/interns/[id]`, `/staff/mentors`, `/staff/tasks`, `/staff/tasks/new`, `/staff/tasks/[id]`, `/staff/audit` |

Notifications are a popover in the top bar (there is no notifications page). Sidebar items and actions are shown according to the permissions returned by the API.

## Prerequisites

- Node.js 20
- npm (do not mix it with pnpm)
- PostgreSQL

## Quick start

### 1. Create the database

```sql
CREATE DATABASE traverse;
```

### 2. Backend

```bash
cd backend
npm install
```

Create the environment file from the example and edit it (set `DATABASE_URL` and the two secrets):

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Then apply the migrations, seed the development data and start the API:

```bash
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

The API runs on http://localhost:3000.

### 3. Frontend

```bash
cd frontend
npm install
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
# macOS / Linux
cp .env.example .env.local
```

```bash
npm run dev
```

The app runs on http://localhost:3001.

### Useful scripts

| Where | Command | Purpose |
|---|---|---|
| backend | `npm run start:dev` | run the API with reload |
| backend | `npm run build` | production build |
| backend | `npx prisma migrate dev` | apply migrations in development |
| backend | `npx prisma migrate deploy` | apply migrations in production |
| backend | `npx prisma db seed` | seed development data |
| backend | `npx prisma generate` | regenerate the Prisma client |
| frontend | `npm run dev` | run the app on port 3001 |
| frontend | `npm run build` / `npm run start` | production build and start |

## Environment variables

### Backend (`backend/.env`)

| Name | Example / default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/traverse?schema=public` | database connection (URL-encode the password) |
| `JWT_SECRET` | long random string | signs the login token |
| `JWT_EXPIRES_IN` | `1d` | token and cookie lifetime |
| `COOKIE_NAME` | `traverse_token` | cookie name |
| `COOKIE_SECURE` | `false` (`true` on HTTPS) | secure cookie flag |
| `CORS_ORIGIN` | `http://localhost:3001` | allowed frontend origins, comma separated |
| `PORT` | `3000` | API port |
| `STORAGE_LOCAL_PATH` | `./storage` | where uploaded files are stored (never served statically) |
| `MAX_FILE_MB` | `10` | upload size limit |
| `SIGNED_URL_SECRET` | long random string, different from `JWT_SECRET` | signs download links |
| `SIGNED_URL_TTL_SECONDS` | `300` | download link lifetime |
| `REQUIRE_CV_TO_APPLY` | `true` | interns need a CV to apply |
| `MAX_INTERNS_PER_MENTOR` | `10` | soft mentor capacity (shows a warning only) |
| `REMINDER_HOURS_BEFORE` | `24` | deadline reminder window |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | placeholders | first admin created by the seed |
| `SEED_SAMPLE_PASSWORD` | placeholder | password of the sample users |

### Frontend (`frontend/.env.local`)

| Name | Example | Purpose |
|---|---|---|
| `API_URL` | `http://localhost:3000` | backend URL used by the Next.js rewrite |

## Development seed accounts

> **Development only.** The seed is idempotent and creates sample data outside production. Passwords come from `SEED_ADMIN_PASSWORD` and `SEED_SAMPLE_PASSWORD`. Use strong values, and never reuse these accounts or passwords in a shared or public environment.

| Email | Role | Permissions | Password |
|---|---|---|---|
| `admin@example.com` | Staff | all 10 permissions | `SEED_ADMIN_PASSWORD` |
| `intern1@example.com`, `intern2@example.com`, `intern3@example.com` | Intern | none | `SEED_SAMPLE_PASSWORD` |
| `staff.reviewer@example.com` | Staff | `CAN_REVIEW_APPLICATIONS`, `CAN_MANAGE_INTERVIEWS`, `CAN_REVIEW_TASKS` | `SEED_SAMPLE_PASSWORD` |
| `staff.pending@example.com` | Staff (waiting for approval) | none until approved | `SEED_SAMPLE_PASSWORD` |

Three sample programs (draft, open, closed) are created outside production.

## API overview

- Base prefix: `/api/v1` (http://localhost:3000/api/v1)
- Swagger UI: http://localhost:3000/api/docs and the OpenAPI JSON at `/api/docs-json` (both disabled when `NODE_ENV=production`)
- Authentication: a JWT in an httpOnly cookie. The browser never sees the token, and requests must send credentials. The frontend calls `/api/v1` through a Next.js rewrite, so the cookie works on the same origin.
- Errors always use this shape. Show `message` to users and branch on `code`:

```json
{ "statusCode": 400, "code": "VALIDATION_ERROR", "message": "Validation failed", "details": ["..."] }
```

- Lists are paginated with `page` and `limit` (default 20, maximum 100):

```json
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }
```

- Unknown request fields are rejected with a 400, so send only documented fields.
- Datetimes are ISO 8601. Requests must include a timezone, for example `2026-12-01T10:00:00Z`.
- Modules: auth, profile, staff, programs, applications, interviews, internships (with interns and mentors), tasks, documents, notifications, dashboard, audit.

## Roles and permissions

- Roles: `INTERN` and `STAFF`. User status: `ACTIVE`, `PENDING_APPROVAL`, `DISABLED`.
- A mentor is not a role: it is any active staff member with a current mentor assignment on an internship.
- Being staff grants nothing by itself. Each staff member holds a set of permissions, which are re-read from the database on every request.

| Permission | Allows |
|---|---|
| `CAN_MANAGE_USERS` | approve or reject staff and edit their permissions |
| `CAN_MANAGE_PROGRAMS` | create programs and move them through their lifecycle |
| `CAN_REVIEW_APPLICATIONS` | review applications, shortlist, accept or reject |
| `CAN_MANAGE_INTERVIEWS` | schedule, reschedule, complete and cancel interviews |
| `CAN_ASSIGN_MENTOR` | assign mentors to internships |
| `CAN_MANAGE_TASKS` | create and edit tasks |
| `CAN_REVIEW_TASKS` | review submissions and give feedback |
| `CAN_CHANGE_INTERNSHIP_STATUS` | change internship status and upload internship documents |
| `CAN_VIEW_ALL_INTERNS` | see every intern instead of only the ones you mentor |
| `CAN_VIEW_AUDIT` | open the audit viewer and read the change history of records |

**Scope rule.** Staff can see an intern's internship, tasks, submissions, internship documents, dashboards and audit if they hold `CAN_VIEW_ALL_INTERNS` or are that intern's current mentor, on top of the specific permission. Applications and interviews are limited by permission only.

## Status flows

- **Staff account:** `PENDING_APPROVAL` to `ACTIVE` or `DISABLED`.
- **Program:** `DRAFT` to `OPEN` to `CLOSED` to `IN_PROGRESS` to `COMPLETED`. `DRAFT`, `CLOSED` or `COMPLETED` can be `ARCHIVED`.
- **Application:** `APPLIED` to `UNDER_REVIEW` to `SHORTLISTED` or `REJECTED`. `SHORTLISTED` moves to `INTERVIEW` only by scheduling an interview. `INTERVIEW` moves to `ACCEPTED` or `REJECTED`. Accepting requires the latest interview to be `COMPLETED` with result `PASSED` and a free seat, and it creates the internship.
- **Interview:** `SCHEDULED` or `RESCHEDULED` to `COMPLETED`, `CANCELLED` or `RESCHEDULED`. There is one active interview per application.
- **Internship:** `ACCEPTED` to `ONBOARDING` to `ACTIVE` (needs a mentor) to `COMPLETED`. `ACCEPTED`, `ONBOARDING` or `ACTIVE` can be `DROPPED` with a reason.
- **Task:** `PENDING` to `IN_PROGRESS` to `SUBMITTED` to `UNDER_REVIEW`, then `APPROVED` (locked) or `CHANGES_REQUESTED`, which returns to `IN_PROGRESS`.

Illegal moves return `409 INVALID_TRANSITION`.

## Business rules

How the requirements' open questions were resolved in this implementation:

| Topic | Decision |
|---|---|
| Mentors | One current mentor per internship. Assigning a new mentor replaces the current one and keeps the history. |
| Mentor capacity | Soft limit (`MAX_INTERNS_PER_MENTOR`): the assignment succeeds with a warning. |
| Interviews | Required before acceptance. Several interviews are allowed over time, but only one active at once. |
| Rejection | Final, with no reopening. The reason is stored as an internal note that interns cannot see. |
| Program capacity | Accepting is blocked when the program is full. Applying is still allowed, and there is no waiting list. |
| Late submissions | Allowed and flagged as late. |
| Approved tasks | Locked, with no reopening. |
| Internship completion | Allowed even with unapproved tasks, with a warning (`INCOMPLETE_TASKS`). |
| Dropping an internship | Requires `CAN_CHANGE_INTERNSHIP_STATUS` and a written reason. |
| Documents | Replacing creates a new version and keeps the old ones. Nothing is hard-deleted. |
| Application withdrawal | Not supported. |
| Staff accounts | Staff register and wait for an admin (`CAN_MANAGE_USERS`) to approve them and set permissions. |
| Deadline reminders | One in-app reminder per task, `REMINDER_HOURS_BEFORE` hours before the deadline. |

## Architecture notes

- **Events.** Domain events are emitted after the database transaction commits. A notifications listener turns them into in-app notifications and never breaks the original request. An hourly job sends one deadline reminder per task.
- **Concurrency.** Row locks and advisory locks protect program capacity, mentor assignment, interview booking, task state and document versions from race conditions.
- **Files.** Files are never served statically. Downloads use short-lived (5 minute) HMAC tokens bound to the user and the document, and authorization is checked again on download. File types are checked by MIME type, extension and magic bytes.
- **History.** History tables are append-only and nothing is hard-deleted (`onDelete: Restrict`). The audit viewer reads this history.
- **Database.** The initial migration contains hand-written SQL: three partial unique indexes (one active mentor per internship, one active interview per application, one current version per document group). A later migration adds a unique index for one deadline reminder per task. Never delete or regenerate migrations: `backend/prisma/migrations` must be committed.

## Troubleshooting (Windows)

- **Project location.** Keep the project outside OneDrive and Desktop (for example `D:\dev`).
- **"Access is denied" during install.** Exclude the folder from Windows Defender, delete `node_modules` and reinstall:

```powershell
npx rimraf node_modules
npm install
```

- **Use npm, not pnpm.** Mixing them breaks `node_modules`.
- **Prisma must be 6.19.3.** If `npx prisma --version` shows 7 or 8:

```bash
npm install prisma@6.19.3 @prisma/client@6.19.3 --save-exact
```

  and rename any `prisma.config.ts`.
- **Database password.** It must be URL-encoded in `DATABASE_URL` (for example `@` becomes `%40`).
- **Environment changes.** Changes to `.env` need a server restart. In the frontend, after installing packages or changing env or fonts, stop the server, delete `.next` and run `npm run dev` again.
- **A page shows 404.** Check the folder: routes live in `src/app/(intern)/intern/...`, `src/app/(staff)/staff/...` and `src/app/(auth)/...`, and every page file must be named `page.tsx`.
- **Logged in, but every request returns 401.** The frontend must call `/api/v1` through the Next.js rewrite (same origin) and `API_URL` must be set in `frontend/.env.local`.

## Known limitations and roadmap

**Not built yet**
- Forgot password and email verification
- Refresh tokens and rate limiting
- Disabling or re-enabling staff after approval
- Cloud file storage (swap the `StorageService` for S3)
- Email or push notifications (notifications are in-app and polled every 30 seconds)
- Application withdrawal by interns
- Automated tests

**Notes**
- The interface is designed desktop-first. Small-screen layouts have not been fully tested.
- Interns cannot upload internship documents: placement documents are uploaded by staff, and interns upload their CV.

**Status:** MVP complete (backend and frontend).

## Author

`Eman Younes` 
