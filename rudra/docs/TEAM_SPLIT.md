# DataPulse Team Work Split

## Ownership

| Member / registration number | Owns | Deliverables |
|---|---|---|
| **Bakya — 24BAI0071** | React frontend and frontend push | Responsive login, dashboard, admin view, dataset/field/rule screens, paginated validation-run issues, issue-resolution UI, search/filter/pagination, client-side validation, API integration, and frontend screenshots. Frontend files are under `bakya/frontend/`; authored source/assets use the `bakya_` prefix where practical. Tool-required filenames such as `package.json` stay unchanged. |
| **Udiksha — 24BAI0086** | Spring Boot backend and application security | JPA/Hibernate entities and repositories, REST endpoints, CRUD, JWT login/logout flow, BCrypt password hashing, role checks for Admin and Analyst, request validation, exception responses, CSV validation endpoint, and backend setup instructions. Backend files are under `udiksha/backend/`. |
| **Rudra — 24BKT0125** | Database design, advanced PostgreSQL work, and integration/release coordination | ER diagram, schema and data dictionary, constraints and indexes, summary view, score procedure, audit trigger, sample CSV, SDG alignment, README/report updates, end-to-end integration coordination, database backup/restore evidence, and deployment checklist. Database/docs are under `rudra/`. |

## Shared handoff rules

1. Treat `rudra/docs/API_CONTRACT.md` and `rudra/db/schema.sql` as the interface contract. Propose changes there before changing endpoint or column names.
2. Bakya owns files inside `bakya/frontend/`; Udiksha owns files inside `udiksha/backend/`; Rudra owns `rudra/db/` and `rudra/docs/`. Root setup files are shared integration files.
3. Use the repository's required `main` and `dev` branches, along with dedicated component branches: `backend` (Spring Boot & Express API), `frontend` (React UI), and `clouddatabase` (PostgreSQL & schema). Work on these branches, merge to `dev`, and promote verified versions to `main`.
4. Make meaningful commits under each person's own Git identity. Do not fabricate commit history. The brief requires at least 10 meaningful commits and a private repository with all team members added.
5. Keep credentials in local environment variables. Commit only a safe `.env.example`, never a real `.env`.
6. Registration numbers are supplied: Bakya 24BAI0071, Udiksha 24BAI0086, Rudra 24BKT0125. Each member should check their own name and ID on the cover page and in their source identifier/output before submission.

## Today's order

1. The shared package contains the ERD source, schema, dictionary, proposal/SDG draft, API contract, Spring Boot API, React UI, Docker Compose setup, and CI workflow.
2. Udiksha should run the backend and database together, resolve laptop-specific setup issues, and commit the backend under her GitHub identity.
3. Bakya should run the UI against that API, check each screen, and push the frontend files from `bakya/frontend/` under her GitHub identity.
4. Rudra should apply the schema, verify backup/restore, coordinate the private repository and `main`/`dev` branches, and assemble final evidence.
5. All three should do one live walkthrough with `rudra/db/sample_validation.csv`. Capture genuine timestamped screenshots after the application is running; the package contains no fabricated evidence.
