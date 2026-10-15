# DataPulse — Faculty Project Proposal

## Project title

**DataPulse: Institutional Dataset Quality and Validation Platform**

## Problem statement

University departments exchange spreadsheets for routine work, but missing values, malformed entries, duplicate identifiers, and out-of-range measurements are often discovered late. Manual review is slow and leaves no consistent history of which checks ran or how issues were handled. DataPulse provides a small, auditable workflow for defining dataset fields and validation rules, checking CSV files, reviewing data-quality results, and recording issue resolutions.

## Objectives

- Store users, roles, datasets, fields, validation rules, validation runs, quality issues, resolution history, quality scores, and audit events in a normalized relational database.
- Provide a responsive web application for managing datasets and reviewing validation results.
- Apply secure authentication, role-based access, request validation, and protected database credentials.
- Demonstrate relational database features including CRUD, joins, aggregates, indexes, a view, a stored procedure, a trigger, and a transaction.
- Preserve validation history without storing uploaded CSV rows in the first project version.

## Scope

An Analyst creates a dataset, defines its columns, attaches REQUIRED, UNIQUE, EMAIL, RANGE, or configured TYPE rules, and uploads a CSV file. DataPulse checks the configured columns, saves a run and any issues, calculates a score, and allows authorized users to resolve or reopen issues with a note. Admins can see all datasets; Analysts can manage their own. The initial version processes UTF-8 CSV files up to 5 MB and 5,000 rows. It does not ingest spreadsheets or store original records.

## Team members and responsibilities

| Member | Registration number | Responsibility |
|---|---|---|
| Bakya | 24BAI0071 | React frontend, responsive design, API integration, user walkthrough, and frontend Git push. |
| Udiksha | 24BAI0086 | Spring Boot API, JPA/Hibernate entities and repositories, authentication, authorization, and validation workflow. |
| Rudra | 24BKT0125 | PostgreSQL schema and advanced objects, ERD/data dictionary, SDG alignment, integration coordination, backup/restore, and submission packaging. |

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19.3, Vite 7, responsive CSS |
| Backend | Java 21, Spring Boot 3.5, Spring Security, REST |
| ORM | Spring Data JPA and Hibernate |
| Database | PostgreSQL 18 |
| Authentication | JWT bearer tokens, BCrypt password hashes, two roles (ADMIN and ANALYST) |
| Local packaging | Dockerfiles and Docker Compose |
| Build integration | GitHub Actions build workflow |

## Major deliverables

1. Project source under bakya/frontend and udiksha/backend, with shared root setup files.
2. PostgreSQL schema with ten related tables, constraints, indexes, a summary view, a quality-score procedure, and an issue-audit trigger.
3. ER diagram source, relational schema, data dictionary, API contract, and this proposal.
4. Responsive login, dashboard, dataset management, CSV validation, issue review, and issue-resolution screens.
5. Docker Compose local environment, safe environment-variable template, README, and CI build workflow.
6. Final submission PDFs with complete source text and genuine timestamped screenshots, plus actual GitHub/backup/deployment evidence.

## Project timeline

| Stage | Planned work | Status in this package |
|---|---|---|
| 1. Planning and design | Confirm domain, problem, team split, ERD, schema, data dictionary, and SDG link | Drafted; faculty confirmation remains a team action |
| 2. Database and API | Implement schema, ORM models, CRUD, security, validation, scoring, and audit trail | Source implemented; PostgreSQL run-through remains |
| 3. Frontend and integration | Build responsive screens and connect login, datasets, runs, and issue actions | Source implemented; browser walkthrough remains |
| 4. Verification and submission | Run the demo, capture timestamps/screenshots, back up/restore, push Git history, deploy, and assemble member PDFs | Pending real team accounts and live run evidence |

## SDG alignment

DataPulse supports **UN Sustainable Development Goal 16, Target 16.6**, which focuses on effective, accountable, and transparent institutions. The project's contribution is practical and limited: it helps a university team validate institutional datasets, review quality outcomes, and retain a traceable history of issue resolution. The team can report project measures such as datasets checked, issues resolved, and median time to resolution. These project measures are not official UN indicators and do not establish institution-wide SDG impact.

Reference: United Nations, Goal 16 — Peace, Justice and Strong Institutions: https://sdgs.un.org/goals/goal16.

## Approval and evidence status

This file is a proposal draft for faculty review. The code and design package do not prove faculty approval, GitHub collaboration, live deployment, database backup/restore, or a successful end-to-end demonstration. Add those actual records before final submission.
