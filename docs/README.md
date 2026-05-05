# PlanForge PM

Production-ready SaaS project management platform: web + mobile + API + advanced planning (Gantt, WBS, **CPM**), multi-tenant workspaces, RBAC, and SaaS pricing layer.

## Repo layout

Each app **installs its own dependencies** (`node_modules` inside that folder).

```
.
├── backend/            # NestJS API — run `npm install` here
├── frontend/           # React (Vite) — run `npm install` here
├── expo-app/           # Expo — run `npm install` here
├── docs/               # Design notes
└── package.json        # Optional root scripts (delegates to each app)
```

## Prerequisites

- Node.js >= 20
- npm (bundled with Node)
- A MongoDB instance (local Docker or Atlas)

## Quickstart

```bash
# Install deps in each app (or once from repo root: npm run install:all)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd expo-app && npm install && cd ..

# MongoDB (if using local Docker and ops/docker-compose.yml exists)
docker compose -f ops/docker-compose.yml up -d mongo

# Backend env
cp backend/.env.example backend/.env

# From repo root — convenience scripts
npm run dev:backend    # http://localhost:3000
npm run dev:frontend   # http://localhost:5173
npm run dev:mobile     # Expo

# Or from each folder: npm run dev / npm run start
```

Seed demo data:

```bash
npm run seed
# or: cd backend && npm run seed
```

## Roles

| Role            | Scope        | Capability                                    |
| --------------- | ------------ | --------------------------------------------- |
| platform_admin  | system-wide  | Internal ops only                             |
| owner           | per workspace| Full workspace control                        |
| member          | per workspace| Manage projects/tasks                         |
| client          | per workspace| Read-only access                              |

## Important docs

- `docs/01-project-plan.md`
- `docs/02-project-knowledge.md`
- `docs/03-project-workflow.md`

## Root scripts

| Script           | Effect                                      |
| ---------------- | ------------------------------------------- |
| `npm run install:all` | `npm install` in backend, frontend, expo-app |
| `npm run dev:backend` | `npm run dev` in backend                  |
| `npm run dev:frontend`| `npm run dev` in frontend                 |
| `npm run dev:mobile`  | `npm run start` in expo-app               |
| `npm run build`       | Build backend + frontend                   |
| `npm run seed`        | Run backend seed                           |

## License

Proprietary (replace as needed).
