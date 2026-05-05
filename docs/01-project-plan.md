# Project Plan — PlanForge PM

> Pointer document. The full Project Plan (scope, objectives, roadmap, timeline, risks) was produced in the architecture phase. Migrate it here verbatim before formal sign-off.

## Quick reference

- Phase 0: Foundation (monorepo, auth, tenancy)
- Phase 1: Core PM (workspaces, projects, tasks, dependencies)
- Phase 2: Planning & analytics (Gantt, CPM, resources, dashboards)
- Phase 3: SaaS hardening (plans, billing, audit)
- Phase 4: Scale & enterprise (sharding, SSO/SCIM, exports)

## Definition of Done (high level)

- API: tenant guard on every workspace route
- CPM: cycle detection on dependency creation
- Frontend: Gantt persists drag-to-reschedule
- Mobile: read flows + secure token storage
- Ops: CI green, seed script reproduces demo project
