# 🌟 CMBraga-Backend

Backend for the CMBraga platform: manages users, activities, routes, stations and related services for the MoveKids project.

🚀 Quick summary

- Tech: Node.js + TypeScript, Express, TypeORM, PostgreSQL, Redis, Docker, Swagger
- Swagger docs (when server running): `http://localhost:PORT/api/docs`

🌐 Currently running

- Production API: [https://movekids.cm-braga.pt/api](https://movekids.cm-braga.pt/api)
- Production Swagger docs: [https://movekids.cm-braga.pt/api-docs](https://movekids.cm-braga.pt/api-docs)

❓ What is this?

- A full-featured backend service for managing municipal activity programs (MoveKids / CMBraga).
- Implements user roles (admin, instructor, parent, health professional), route & station management, activity sessions, chat/notifications, badges, surveys, medical reports and hydration scripts to seed data.

🎯 What you can do with this project

- Manage routes and stations (import from KML / JSON, compute bounds & distances)
- Create, schedule and run activity sessions (pedibus / ciclo_expresso)
- Register children for activities and track check-in/check-out
- Manage users and roles (admins, instructors, parents, health professionals)
- Send emails (password setup / reset) and generate secure tokens
- Real-time chat (group/individual/general) with WebSocket events
- Seed database and upload default images to cloud storage using hydration scripts
- Generate and view API documentation via Swagger

🧭 Features (high level)

- Authentication & role-based authorization (JWT)
- TypeORM entities + migrations for robust schema management
- Hydration scripts (local and production) to bootstrap database and cloud images
- Swagger auto-generated from inline JSDoc in `src/server/docs/*.ts`
- Dockerfile + Makefile targets to simplify local / container workflows

⚙️ Prerequisites

- Node.js (v16+), npm (v8+)
- Docker & docker-compose (optional, recommended)
- PostgreSQL and Redis (if not using Docker)

🛠️ Quick start

1.  Install dependencies

    ```bash
    npm install
    ```

2.  Environment variables

    Create `.env` at project root with the minimum required variables, check `.env.example`.

3.  Local development

    ```bash
    npm run dev:server 
    ```

4.  Docker (recommended)

    - First run (build + start):

      ```bash
      make init
      ```

    - Start (already built):

      ```bash
      make du
      ```

    - Stop & remove:

      ```bash
      make dd
      ```

5.  Migrations (Makefile shortcuts)

    - Create migration (interactive):

      ```bash
      make mig-gen
      ```

    - Run migrations:

      ```bash
      make mig-run
      ```

    - Revert migrations:

      ```bash
      make mig-revert
      ```

    - Schema log:

      ```bash
      make schema-log
      ```

6.  Hydration / seeding

    - Local seeding:

      ```bash
      npm run hydration
      ```

    - Production-style (cloud images + DB):

      ```bash
      npm run prod:hydration
      ```

    - Data used by hydration lives under `src/scripts/data/` and `src/scripts/data.json`

📚 Swagger API docs

- Generated from `src/server/docs/*.ts`. View at:

```
http://localhost:3001/api-docs
```

🔎 Useful paths

- Source: `src/`
- DB config & entities: `src/db/`
- Hydration & utility scripts: `src/scripts/`
- Swagger docs: `src/server/docs/`
- Services: `src/server/services/`
- Routers: `src/server/routers/`

🧰 Tips & troubleshooting

- Ensure `.env` is available to the running process or container.
- If migrations are not reflected, check `initializeDatabase()` logs and verify `migrationsRun` in `src/db/data-source.ts`.
- If hydration fails uploading images, verify cloud credentials and presence of `src/scripts/data/images`.
- Use Makefile shortcuts to speed up common tasks.
