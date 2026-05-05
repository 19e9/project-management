# Project Knowledge — PlanForge PM

> Architecture, tech decisions, database design, API structure, and auth flows.

## Stack

- Backend: NestJS 10, Mongoose 8, JWT (access + rotating refresh), Passport (Google OAuth), Zod-validated env
- Frontend: React 18 + Vite, TypeScript, Tailwind, React Query, React Router, react-hook-form, gantt-task-react
- Mobile: Expo Router 4, React Native 0.76, Axios, expo-secure-store, React Query
- DB: MongoDB (Atlas in production)

## Tenancy & RBAC

- `WorkspaceMember` is the source of truth for a user's role inside a workspace.
- `WorkspaceRoleGuard` resolves the role on every request and attaches `req.workspaceMember`.
- Roles: `owner | member | client`. Platform-wide: `platform_admin`.

## Data model (high level)

`User → WorkspaceMember ← Workspace → Project → Task ← TaskDependency`

`ResourceAllocation` joins `Task ↔ User` over a date range.

`PlanningSnapshot` caches CPM output per project (one-to-one).

## API conventions

- Base path: `/api/v1`
- Errors: `{ statusCode, error, message, code, details, path, timestamp }`
- Tenant routes always include `:workspaceId`.
- CPM is gated by `entitlements.cpmEnabled` (Pro plan or above).

## Auth flows

- `POST /auth/register | /auth/login` → `{ accessToken, refreshToken, expiresIn }`
- `POST /auth/refresh` → rotates refresh token (DB-backed, hashed) and revokes the old one.
- `GET /auth/google` (web) → redirect → callback → token fragment in `/auth/callback#access=…&refresh=…`.

## CPM (Critical Path Method)

- Build adjacency from `TaskDependency` (FS in v1).
- Topological sort (Kahn). Cycle detected => 400 `TASK_DEPENDENCY_CYCLE`.
- Forward pass → ES/EF; backward pass → LS/LF; `slack = LF - EF`. `isCritical = slack === 0`.
- Snapshot persisted in `PlanningSnapshot`.
