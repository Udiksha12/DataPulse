# Database Rubric Map

| Assessment feature | DataPulse implementation | How to demonstrate it |
|---|---|---|
| Relational database and 8–10 tables | PostgreSQL schema creates ten tables in `rudra/db/schema.sql` | Apply the schema, then query `information_schema.tables` for the ten application tables. |
| Primary/foreign keys and constraints | Identity PKs, ownership/history FKs, NOT NULL, UNIQUE, CHECK, and DEFAULT definitions in the schema | Show table definitions and try one invalid status or duplicate key in a disposable database. |
| Normalization | ERD and 3NF notes in `rudra/docs/ERD.md`; data dictionary in `rudra/docs/DATA_DICTIONARY.md` | Explain why roles, fields, rules, runs, issues, scores, and resolutions are separate. |
| Indexes | Owner/status, field, active rule, run history, issue, resolution history, audit indexes | Use `EXPLAIN` on dataset search/run history queries and identify the matching index. |
| ORM | Spring Data JPA/Hibernate for routine entity reads and writes | Show repository/service classes in `udiksha/backend/`. |
| CRUD and relationships | Dataset, field, and rule REST endpoints; run/issues endpoints | Use the UI to create/update/archive datasets and fields/rules; inspect persisted rows. |
| Joins and aggregate queries | Ownership-aware JPA dataset queries; dashboard query joins the summary view to datasets and aggregates counts/average score | Open dashboard/admin view and show the corresponding query in `DashboardService`. |
| View | `dataset_quality_summary` combines each dataset with its latest score and open issues | Run `SELECT * FROM dataset_quality_summary;`. |
| Stored procedure | `recalculate_quality_score(p_run_id)` calculates completeness, validity, uniqueness, and overall scores | Run a validation; show the procedure call and resulting `quality_scores` row. |
| Transaction | CSV validation service writes a run, issue rows, final counts, and procedure-generated score under one transaction | Show `@Transactional` on the run service and verify partial writes roll back if an error is induced in a local test database. |
| Trigger / audit | `trg_audit_quality_issue_change` records issue creation and status changes into `audit_logs` | Create/resolve an issue, then query audit log entries for that issue. |
| Backup and restore | Native PostgreSQL `pg_dump` / `pg_restore` commands are in the root README | Make a custom-format dump and restore it into a fresh database; capture command output and restored table counts. |

These are implementation references, not evidence that a database has already been run. The team must capture the real database output from its own demo environment.
