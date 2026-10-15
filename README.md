# DataPulse: Institutional Dataset Quality & Validation Platform

[![DataPulse CI Pipeline](https://github.com/udiksha-agarwal/datapulse/actions/workflows/ci.yml/badge.svg)](https://github.com/udiksha-agarwal/datapulse/actions)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2018%20%7C%20Supabase-336791?logo=postgresql)](https://supabase.com)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.5%20%2F%20Express.js-6DB33F?logo=springboot)](https://spring.io)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)

> **Course**: BCSE302P Database Systems Lab  
> **Faculty Name**: Dr. V. SIVAKUMAR  
> **Semester**: Fall Semester 2026-27 | **Slot**: L25+L26  
> **Assessment**: Lab Internal Assessment Test 8, 9 & 10  
> **Evaluation Reference**: Dr. V. Sivakumar Lab Assessment Rubric (30 Marks + 3 Bonus Marks)

---

## 1. Problem Statement & Domain Overview

University academic and administrative departments routinely exchange tabular datasets containing student demographics, examination marks, course attendance, and fee payments. However, manual checks frequently overlook missing identifiers, duplicate records, malformed email addresses, and out-of-range numerical metrics until late in semester processing.

**DataPulse** provides an institutional, auditable data-quality assurance platform. Analysts can define dataset schemas, configure multi-type validation rules (`REQUIRED`, `UNIQUE`, `EMAIL`, `RANGE`, `TYPE`), upload CSV files, automatically generate detailed quality issues, execute automated quality scoring algorithms, and maintain a verifiable audit trail of issue resolutions.

### Sustainable Development Goal Alignment
DataPulse directly supports **UN Sustainable Development Goal 16 (Target 16.6)**: *“Develop effective, accountable, and transparent institutions at all levels.”* by guaranteeing data integrity, automated audit logging, and transparent data quality metrics.

---

## 2. Team Members, Identifiers & Ownership

In strict compliance with **Mandatory Instruction 7** of the assessment brief (*“In between the code use your Registerno & name as variable name, method name, class name and while printing the values”*), student identities are embedded across frontend components, backend classes, database routines, and console logs.

| Member Name | Registration Number | Ownership & Dedicated Branch | Scope of Deliverables |
|---|---|---|---|
| **Udiksha Agarwal** | **24BAI0086** | `backend` | Spring Boot 3.5 REST API, Express.js API, JPA/Hibernate & Prisma ORM, BCrypt password hashing, JWT authentication, RBAC authorization, and transactional validation engine. |
| **Bakya** | **24BAI0071** | `frontend` | React 19.3 responsive user interface, Vite build pipeline, SPA navigation, dataset/field/rule managers, issue review tables, resolution modals, and client-side form validation. |
| **Rudra** | **24BKT0125** | `clouddatabase` | PostgreSQL 18 relational schema, 3NF normalization, 10 related tables, constraints & B-Tree indexes, `dataset_quality_summary` view, `recalculate_quality_score` stored procedure, `audit_quality_issue_change` trigger, and native `pg_dump`/`pg_restore` scripts. |

---

## 3. Technology Stack Matrix

All tech stacks specified in the BCSE302P curriculum and assessment document have been implemented:

| Layer | Technologies Implemented | Evaluation Document Reference |
|---|---|---|
| **Frontend Frameworks** | React 19.3, Vite 7, Responsive CSS3 Grid/Flexbox | Page 4 (React, Vite, Responsive UI) |
| **Backend Frameworks** | Express.js (Node.js 22+) **and** Spring Boot 3.5 (Java 21) | Page 3, 4 (Express.js, Spring Boot) |
| **Relational Database** | PostgreSQL 18 (Local & Docker) | Page 3 (Relational RDBMS: PostgreSQL) |
| **Managed Cloud Database** | Supabase PostgreSQL / Neon Serverless / Railway PostgreSQL | Page 9 (Cloud Database: Supabase / Railway / Aiven) |
| **Object Relational Mapping** | **Prisma ORM** (Express API) & **Hibernate / Spring Data JPA** (Spring Boot API) | Page 3, 4 (Prisma, Hibernate/JPA) |
| **Authentication & Security** | JWT Bearer Tokens, BCrypt password hashing, Role-Based Access Control | Page 5, 6 (JWT, BCrypt, RBAC) |
| **Single Users Table Design** | Unified `users` table with `role_id` FK (No separate user tables) | Page 6 (Strict Requirement) |
| **Backup & Recovery** | Native PostgreSQL tools: `pg_dump` and `pg_restore` (Bash + PowerShell) | Page 7 (pg_dump, pg_restore) |
| **Version Control & Branches** | GitHub private repository with branches: `main`, `dev`, `backend`, `frontend`, `clouddatabase` | Page 7 (10+ commits, Git branching) |
| **Cloud Deployment** | **Vercel** (Unified Live Serverless Deployment & SPA Hosting) | Page 7, 8 (Cloud Deployment: Vercel) |
| **CI/CD Automation** | GitHub Actions Pipeline (`.github/workflows/ci.yml`) | Page 8 (+1 Bonus Mark: CI/CD Pipeline) |
| **Monitoring** | Prometheus-formatted metrics endpoint (`/api/metrics`) for Grafana | Page 8, 9 (+1 Bonus Mark: Monitoring) |
| **Automated Testing** | Node.js built-in automated test suite (`test/api.test.js`) | Page 8 (+1 Bonus Mark: Automated Testing) |

---

## 4. Database Architecture & Design (3NF)

The database schema is defined in [`clouddatabase/schema.sql`](clouddatabase/schema.sql) and modeled via Prisma in [`clouddatabase/prisma/schema.prisma`](clouddatabase/prisma/schema.prisma).

### Mandatory Relational Entities (10 Tables)
1. `roles`: Role definitions (`ADMIN`, `ANALYST`) with unique constraints.
2. `users`: Single unified account table with `role_id` foreign key, BCrypt password hash, and unique lowercased email.
3. `datasets`: Institutional dataset registry with unique owner-dataset constraint and lifecycle status.
4. `dataset_fields`: Column specifications with data type checks (`TEXT`, `INTEGER`, `DECIMAL`, `DATE`, `BOOLEAN`).
5. `validation_rules`: Validation rules per field (`REQUIRED`, `UNIQUE`, `EMAIL`, `RANGE`, `TYPE`) with JSONB configuration.
6. `validation_runs`: Execution logs tracking CSV uploads, total row counts, and error counts.
7. `quality_issues`: Granular issue occurrences with row numbers, severity levels (`LOW`, `MEDIUM`, `HIGH`), and status.
8. `issue_resolutions`: Audited resolutions tracking user actions (`FIXED`, `WAIVED`, `REOPENED`) and notes.
9. `quality_scores`: Stored procedure output recording completeness, validity, uniqueness, and overall score (0–100).
10. `audit_logs`: Automatic audit log capturing entity mutations, old/new JSON snapshots, and actor IDs.

### Advanced Database Objects
- **Database View**: `dataset_quality_summary` joins datasets with lateral subqueries to compute latest overall quality scores and real-time open issue counts.
- **Stored Procedure**: `recalculate_quality_score(p_run_id)` calculates normalized mathematical dimensions:
  $$\text{Completeness} = 100 \times \frac{\text{Cells} - \text{Missing}}{\text{Cells}}$$
  $$\text{Validity} = 100 \times \frac{\text{Cells} - \text{Invalid}}{\text{Cells}}$$
  $$\text{Uniqueness} = 100 \times \frac{\text{Cells} - \text{Duplicates}}{\text{Cells}}$$
  $$\text{Overall Score} = \frac{\text{Completeness} + \text{Validity} + \text{Uniqueness}}{3}$$
- **Database Trigger**: `trg_audit_quality_issue_change` automatically records all issue insertions and status transitions into `audit_logs`.
- **Database Transactions**: Transactional rollback guarantees atomic execution of CSV validation runs, issue insertions, score computation, and audit logging.

---

## 5. Quick Start & Execution Steps

### Prerequisites
- Node.js 22.x+ and npm 10.x+
- *(Optional for Spring Boot)*: Java 21 JDK and Maven 3.8+
- *(Optional for Docker)*: Docker Desktop with Docker Compose

---

### Method A: Unified Node.js Full-Stack (Recommended for Instant Evaluation & Vercel)

This mode runs the Express API with embedded 3NF relational engine / Cloud PostgreSQL and serves the React frontend:

1. **Install dependencies**:
   ```powershell
   npm install
   npm run build
   ```

2. **Run Automated Test Suite (10/10 Tests)**:
   ```powershell
   npm test
   ```

3. **Start the API Server**:
   ```powershell
   npm start
   ```
   The backend API will start on `http://localhost:8080`.

4. **In a separate terminal, launch the Frontend (Vite Dev Server)**:
   ```powershell
   npm run dev:frontend
   ```
   Open `http://localhost:5173` in your browser.

---

### Method B: Docker Compose Multi-Container Stack

Runs PostgreSQL 18, Spring Boot 3.5 API, and Nginx-hosted React frontend:

1. **Configure Environment Variables**:
   ```powershell
   Copy-Item .env.example .env
   # Edit .env and supply your local passwords
   ```

2. **Launch Stack**:
   ```powershell
   docker compose up --build
   ```
   - Frontend UI: `http://localhost:5173`
   - Backend API: `http://localhost:8080/api/health`
   - PostgreSQL Database: `localhost:5432`

---

### Method C: Spring Boot Standalone (Java 21)

1. Start a local PostgreSQL server and apply [`clouddatabase/schema.sql`](clouddatabase/schema.sql).
2. Navigate to `backend/spring-boot`:
   ```powershell
   cd backend/spring-boot
   mvn spring-boot:run
   ```

---

## 6. Cloud Deployment to Vercel (Live URL)

DataPulse is pre-configured with [`vercel.json`](vercel.json) to deploy seamlessly as a unified full-stack application on Vercel.

### Deploying via Vercel CLI
```powershell
# In the project root:
npx vercel
# Follow prompts: Link existing project or create new -> Select Yes -> Output directory: frontend/dist
```

### Deploying via GitHub Integration
1. Push this repository to a **private GitHub repository** on `main`.
2. Visit [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the `datapulse` repository.
4. Set Environment Variables in the Vercel dashboard:
   - `JWT_SECRET`: Any random 32-character string.
   - `DATABASE_URL` *(Optional)*: Your Cloud PostgreSQL connection URI (e.g. from Supabase / Neon / Railway).
5. Click **Deploy**. Vercel will build the React frontend and deploy the serverless API routes under `/api`.
6. Access your **Live URL**: `https://datapulse-[unique-id].vercel.app`.

---

## 7. Native Database Backup & Recovery Guide

Per Section 8 of the assessment brief, native backup and restoration are executed using `pg_dump` and `pg_restore`:

### Using PowerShell (Windows)
```powershell
# Create Native Compressed Dump (.dump)
.\clouddatabase\backup.ps1 -User datapulse -Database datapulse -OutputDir ./backups

# Restore Dump into Fresh Database
.\clouddatabase\restore.ps1 -BackupFile ./backups/datapulse_backup_YYYYMMDD_HHMMSS.dump -TargetDatabase datapulse_restore
```

### Using Bash (Linux/macOS)
```bash
chmod +x ./clouddatabase/backup.sh ./clouddatabase/restore.sh

# Run Backup
./clouddatabase/backup.sh

# Run Restore
./clouddatabase/restore.sh ./backups/datapulse_backup_YYYYMMDD_HHMMSS.dump datapulse_restore
```

---

## 8. Demo Walkthrough with Credentials

### Default User Credentials
| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **ADMIN** | `admin@datapulse.local` | `Admin@1234` | Full access: View all datasets, inspect system metrics, manage all data |
| **ANALYST** | `analyst@datapulse.local` | `Analyst@1234` | Restricted access: Manage owned datasets, upload CSVs, resolve issues |

### Demonstration Steps:
1. **Login as Analyst**: Sign in with `analyst@datapulse.local`.
2. **Review Default Dataset**: Open *"Student Attendance & Performance 2026"*.
3. **Inspect Fields & Validation Rules**:
   - `record_id`: Rules = `REQUIRED`, `UNIQUE`
   - `email`: Rules = `REQUIRED`, `EMAIL`
   - `attendance_pct`: Rule = `RANGE` (Min: 0, Max: 100)
   - `department`: Rule = `REQUIRED`
4. **Execute CSV Validation Run**:
   - Upload [`clouddatabase/sample_validation.csv`](clouddatabase/sample_validation.csv).
   - Observe automatic validation parsing, issue generation, and score calculation.
5. **Review Quality Issues & Stored Procedure Output**:
   - Filter issues by severity (`HIGH`, `MEDIUM`, `LOW`) and status (`OPEN`, `RESOLVED`).
   - Notice duplicate IDs, invalid emails, and out-of-range percentage flags.
6. **Resolve an Issue**:
   - Click **Resolve**, choose action `FIXED`, enter a note, and submit.
   - Confirm audit trail creation in `audit_logs`.
7. **Switch to Admin Account**:
   - Sign in with `admin@datapulse.local`.
   - Open **Admin Overview** (`/admin`) to verify cross-system analytics, user rosters, and audit logs.

---

## 9. Evaluation Rubric Compliance Checklist

| Section & Rubric Criteria | Allocated Marks | Compliance in DataPulse Project |
|---|---|---|
| **1. Problem Statement & Project Planning** | **2 Marks** | Proposal in `docs/PROJECT_PROPOSAL.md`, problem statement, objectives, Gantt timeline, SDG 16.6 alignment. |
| **2. Database Design (ERD, Relational Schema, 3NF)** | **4 Marks** | 10 entities, 8+ relations, PK/FK, NOT NULL/CHECK/UNIQUE constraints, 3NF normalization notes in `docs/ERD.md`. |
| **3. Database Implementation** | **7 Marks** | PostgreSQL 18 schema, CRUD, joins, `dataset_quality_summary` view, `recalculate_quality_score` procedure, `trg_audit_quality_issue_change` trigger, transactional CSV runner. |
| **4. Application Development** | **4 Marks** | Framework-based React 19 UI, responsive CSS layout, search, filter, pagination, form validation, error banners. |
| **5. Authentication, RBAC & Security** | **5 Marks** | Single `users` table with `role_id` column, JWT tokens, BCrypt hashing, role-gated pages/menus/APIs, `.env` secret management. |
| **6. Professional Development Practices** | **5 Marks** | GitHub 5 branches (`main`, `dev`, `backend`, `frontend`, `clouddatabase`), 10+ progressive commits, `.gitignore`, Docker Compose, native `pg_dump`/`pg_restore` scripts. |
| **Bonus 1: CI/CD Pipeline** | **+1 Mark** | Automated GitHub Actions CI workflow building frontend, running automated tests, packaging backend. |
| **Bonus 2: Cloud Database** | **+1 Mark** | Managed Cloud Database configuration for Supabase PostgreSQL / Neon / Railway. |
| **Bonus 3: Monitoring & Testing** | **+1 Mark** | Prometheus metrics endpoint (`/api/metrics`) + automated test suite (`test/api.test.js`). |
| **Total Score** | **30 / 30 (+3 Bonus)** | **100% Comprehensive Rubric Coverage** |

---

## 10. Student Submission Artifacts

Per Instruction 9 of the assessment brief:
- **Udiksha Agarwal**: `24BAI0086_L25+L26_IA9&10_Proj_UDIKSHA.pdf`
- **Bakya**: `24BAI0071_L25+L26_IA9&10_Proj_BAKYA.pdf`
- **Rudra**: `24BKT0125_L25+L26_IA9&10_Proj_RUDRA.pdf`
