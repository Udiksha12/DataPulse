# DataPulse Assessment Completion Checklist

Use this as the team's live checklist. “Implemented in source” means the files are present in this package; it does not mean the feature has been run against a live PostgreSQL instance or captured as evidence. External account actions and screenshots must be genuine.

## Project planning and design

| Requirement | Current state | Owner / evidence needed |
|---|---|---|
| Faculty-approved real-world domain | Pending confirmation | Rudra: confirm DataPulse with faculty. |
| Title, problem statement, objectives, scope, responsibilities, stack, deliverables, simple Gantt | Drafted in `PROJECT_PROPOSAL.md` with all three names and supplied IDs | Rudra: obtain faculty approval if not already recorded. |
| SDG alignment requested by team | Included in `PROJECT_PROPOSAL.md` and `SDG_ALIGNMENT.md` (SDG 16, Target 16.6) | Team: confirm proposal wording with faculty. |
| ER diagram | Mermaid source is in `rudra/docs/ERD.md`; a rendered ten-table diagram is included in each member-specific draft PDF | Rudra: verify the final image against the SQL schema during the live database run. |
| Relational schema and data dictionary | Implemented in `rudra/db/schema.sql` and `rudra/docs/DATA_DICTIONARY.md`; aligned to ten JPA entities in source | Team: apply to PostgreSQL and confirm Hibernate schema validation succeeds. |
| At least 4 primary entities, 3 relationships, and 8–10 related tables | Design has 10 tables and multiple relationships | Rudra: verify final ERD and implementation match. |
| PK, FK, NOT NULL, UNIQUE, CHECK, DEFAULT; 3NF | DDL and 3NF explanation prepared; not executed against PostgreSQL here | Team: apply and verify constraints with sample inserts. |
| Indexes | Indexes cover owner/status, dataset fields, active rules, run history, issues, resolution history, and audit filters | Rudra: demonstrate an indexed query with `EXPLAIN`. |

## Database and application

| Requirement | Current state | Owner / evidence needed |
|---|---|---|
| Free relational RDBMS | PostgreSQL selected | Udiksha: connect and run the backend against it. |
| ORM for routine database interaction | Spring Data JPA/Hibernate selected | Udiksha: use ORM in the app; reserve SQL for the procedure, trigger, view, and other advanced features. |
| CRUD, joins, aggregates | REST CRUD, JPA repositories, ownership-aware list queries, dashboard joins/aggregates are implemented in source | Team: build, run, and capture database/application evidence. |
| View, transaction, stored procedure, trigger | SQL objects are present; validation runs call the scoring procedure in a transaction; issue audit trigger is implemented | Team: apply schema and show the view, procedure, trigger, and transaction running. |
| Responsive UI, login, dashboard, CRUD, search, filtering, pagination, validation, exception handling | React screens and API wiring are implemented in `bakya/frontend/` | Bakya: build and walk through on desktop and mobile widths. |
| Authentication: login, logout, secure token/session, authenticated user info | JWT login, stateless logout contract, session-storage token, and `/auth/me` are implemented in source | Team: demonstrate login/logout and expired/invalid session handling. |
| Two or more roles enforced in menu, page, and API | One `users` table plus `roles`; Analyst owns datasets; Admin has all-dataset view and `/api/admin/overview` role guard | Team: demonstrate Analyst restriction and Admin access with two accounts. |
| BCrypt or Argon2; SQL injection prevention; secrets not hardcoded | BCrypt, parameterized JPA/JDBC, environment-only secrets, `.env.example`, `.gitignore` are implemented | Team: replace local placeholders; verify `.env` is untracked before pushing. |

## Professional practices and submission

| Requirement | Current state | Owner / evidence needed |
|---|---|---|
| Native database backup and restore | Commands documented in `README.md`; no real dump/restore has been run | Rudra: make a dump and restore it into a fresh database; capture both commands/results. |
| Private GitHub repo, all members added, `main` and `dev`, at least 10 meaningful commits | No remote/history is fabricated in this zip; a CI workflow is prepared | Rudra: create private repo and branches, invite Bakya/Udiksha, then all three make real commits (10 minimum). |
| README with description, install steps, stack, execution steps | Completed at repository root | Team: follow it on a clean laptop and note any setup correction. |
| `.gitignore` excludes `.env` and other secrets | Implemented at repository root with safe `.env.example` | Rudra: verify `.env` stays untracked in the real repository. |
| Cloud deployment and live URL | Not deployed; no provider account/credentials are available in this package | Udiksha + Bakya: deploy UI/API and add the live URL to the final PDF. |
| Docker / Docker Hub | Dockerfiles and Docker Compose are prepared; images are not published | Team: run Compose locally; optionally publish images using a real Docker Hub account if required. |
| CI/CD, custom domain, one additional best practice | GitHub Actions build workflow and PostgreSQL audit logging are prepared; custom domain and hosted pipeline are not demonstrated | Team: push to GitHub and show workflow success; optionally configure a domain; demonstrate audit logs. |
| Complete source code as text and screenshots of input/output with timestamps | Complete source text and individual draft PDFs are prepared; genuine timestamped screenshots still need the final live run | Bakya/Udiksha: capture real UI/API output with visible timestamps; Rudra: insert into member-specific PDFs. |
| Cover information and required filename / upload format | Member-specific draft PDFs use the required names/IDs/course/slot and suggested filenames | Each member: confirm accepted filename spelling, complete evidence, then upload final PDF to VTOP and relevant PDF/DOC files to Moodle. |
| Registration number/name in code identifiers and printed output per brief | IDs are present in Bakya, Udiksha, and Rudra identifier classes/methods/variables and printed output | Each member: verify exact ID and output on their own run. |

## Minimum end-to-end demo

- [ ] Log in as Admin and Analyst; show role-based access.
- [ ] Create a dataset, its fields, and validation rules.
- [ ] Upload `rudra/db/sample_validation.csv` and complete a validation run.
- [ ] Show persisted issues, score, dashboard summary, and issue-resolution history.
- [ ] Demonstrate the database view, stored procedure, trigger, transaction, constraints, and indexes.
- [ ] Capture real screenshots with timestamps and make a restorable database backup.

## Work that remains external to this package

- Faculty approval, private GitHub repository setup/collaborators/real commit history, and pushing the three folders.
- Run the project against PostgreSQL, resolve any local environment issue, and execute the end-to-end demo.
- Capture genuine timestamped screenshots; no screenshots or results in this package are fabricated.
- Perform and record backup/restore; deploy the app and record its live URL; upload the final member PDFs to VTOP and supporting files to Moodle.
