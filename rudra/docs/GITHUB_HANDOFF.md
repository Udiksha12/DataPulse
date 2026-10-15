# GitHub Handoff & Version Control Strategy

DataPulse repository structure and branching strategy strictly conform to the **BCSE302P Database Systems Lab** requirements.

## Branching Architecture

In accordance with team requirements and evaluation guidelines, the repository uses 5 dedicated branches:

| Branch Name | Role & Ownership | Primary Scope |
|---|---|---|
| `main` | Production & Vercel Live Deployment | Release-ready codebase, verified build, live deployment link |
| `dev` | Integration & Staging | Pre-release testing, merge point for feature branches |
| `backend` | Spring Boot & Express.js REST API | Led by **Udiksha Agarwal (24BAI0086)**: JPA/Hibernate, Prisma, BCrypt, JWT, RBAC |
| `frontend` | React 19 + Vite Responsive UI | Led by **Bakya (24BAI0071)**: Dashboard, datasets, CSV runner, issue resolution UI |
| `clouddatabase` | PostgreSQL Schema, Stored Proc & Cloud DB | Led by **Rudra (24BKT0125)**: 10 tables, view, procedure, trigger, backup/restore |

## Progressive Commit History

Per Section 9 of the assessment brief:
- Repository is private with all team members added as collaborators.
- Minimum 10 meaningful commits tracking real development progress.
- Clean `.gitignore` strictly excluding secrets, `.env`, credentials, node_modules, and dumps.
- CI/CD automated via GitHub Actions workflow (`.github/workflows/ci.yml`).

## Deployment on Vercel

The production `main` branch connects directly to Vercel for continuous deployment:
- Live URL provides full interactive access to the application.
- Serverless API routes under `/api` handle backend endpoints seamlessly.
- Cloud PostgreSQL (Supabase / Neon / Railway) provides persistent database storage.
