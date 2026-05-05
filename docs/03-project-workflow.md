# Project Workflow — PlanForge PM

> User & system flows, role-based scenarios, lifecycles.

## User flows

1. Register → onboarding → create first workspace.
2. Owner invites members; member accepts (after registering with that email).
3. Member creates a project, builds WBS, links dependencies.
4. CPM runs (Pro+) → critical path highlighted on Gantt and listed on the CPM tab.
5. Client opens shared workspace → read-only views (no mutating buttons).

## System flows

- Request lifecycle: JWT validate → workspace role guard → controller → service → Mongo.
- Dependency create: cycle check via reverse-DFS on the adjacency built from existing edges.
- CPM compute: triggered on demand by `GET .../planning/cpm` (uses cached snapshot when present, recomputes via `POST .../cpm/recompute`).

## Task lifecycle

`not_started → in_progress → (blocked ↔ in_progress) → done | cancelled`

## Workspace lifecycle

`free (active) → upgrade to pro/enterprise → suspended (billing failure) → soft-delete`

## Mobile flow (Expo)

1. Login → token in SecureStore → fetch `/me`.
2. Workspaces list → projects list → tasks list (read-only v1).
3. 401 triggers refresh; failed refresh signs the user out.
