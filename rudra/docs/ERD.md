# DataPulse Entity Relationship Design

DataPulse is scoped for a small, demonstrable institutional dataset workflow. An analyst registers a dataset and its fields, attaches validation rules, uploads a CSV for a run, reviews the resulting issues, and records resolution history. The CSV is processed by the backend for the run; the first version stores dataset metadata and results rather than arbitrary source rows.

```mermaid
erDiagram
    ROLES ||--o{ USERS : assigns
    USERS ||--o{ DATASETS : owns
    DATASETS ||--o{ DATASET_FIELDS : defines
    DATASET_FIELDS ||--o{ VALIDATION_RULES : has
    DATASETS ||--o{ VALIDATION_RUNS : receives
    USERS ||--o{ VALIDATION_RUNS : starts
    VALIDATION_RUNS ||--o{ QUALITY_ISSUES : produces
    VALIDATION_RULES ||--o{ QUALITY_ISSUES : identifies
    QUALITY_ISSUES ||--o{ ISSUE_RESOLUTIONS : records
    USERS ||--o{ ISSUE_RESOLUTIONS : resolves
    VALIDATION_RUNS ||--o| QUALITY_SCORES : scores
    USERS ||--o{ AUDIT_LOGS : performs

    ROLES {
      bigint role_id PK
      varchar role_name UK
    }
    USERS {
      bigint user_id PK
      bigint role_id FK
      varchar email UK
      varchar password_hash
    }
    DATASETS {
      bigint dataset_id PK
      bigint owner_id FK
      varchar dataset_name
      varchar status
    }
    DATASET_FIELDS {
      bigint field_id PK
      bigint dataset_id FK
      varchar field_name
      varchar data_type
      boolean is_active
    }
    VALIDATION_RULES {
      bigint rule_id PK
      bigint field_id FK
      varchar rule_type
      jsonb rule_config
    }
    VALIDATION_RUNS {
      bigint run_id PK
      bigint dataset_id FK
      bigint started_by FK
      varchar status
    }
    QUALITY_ISSUES {
      bigint issue_id PK
      bigint run_id FK
      bigint rule_id FK
      bigint row_number
      varchar status
    }
    ISSUE_RESOLUTIONS {
      bigint resolution_id PK
      bigint issue_id FK
      bigint resolved_by_user_id FK
      varchar action
    }
    QUALITY_SCORES {
      bigint score_id PK
      bigint run_id FK_UK
      numeric overall_score
    }
    AUDIT_LOGS {
      bigint log_id PK
      bigint actor_user_id FK
      varchar entity_type
      bigint entity_id
    }
```

## Design decisions

- There are ten tables. `Users` is the only account table; `Roles` stores role names and `Users.role_id` assigns a role. There are no separate Admin or Analyst account tables.
- Each table has a primary key. Foreign keys express ownership and history. Dataset/field/rule/run relationships are represented once; `Quality_Scores` references a run and does not duplicate its dataset ID.
- A quality issue references the validation rule that failed. Its field is obtained through `Validation_Rules.field_id`, avoiding another copy of the same relationship.
- Requiredness is represented by an active `REQUIRED` validation rule rather than duplicated as a second flag on `Dataset_Fields`.
- `Quality_Issues` also stores the CSV data-row number (header excluded), observed value, severity snapshot, message, and current status.
- The backend must verify that each run and its rules belong to the same dataset before writing results. This cross-table rule is enforced in the transactional service.
- Dataset deletion is restricted once history exists. Fields and rules are soft-archived with `is_active = false`, preserving run history and issue foreign keys.

## Cardinalities

- One role can be assigned to many users; each user has one role.
- One dataset has many fields and validation runs.
- One field can have many validation rules.
- One validation run can produce many issues; each issue is tied to one run and one rule.
- One issue can have multiple resolution-history entries.
- A completed run has at most one score record.

## Relational schema and 3NF notes

The complete relational schema is in `rudra/db/schema.sql`; the column-by-column definitions are in `rudra/docs/DATA_DICTIONARY.md`. The ten base tables are ROLES, USERS, DATASETS, DATASET_FIELDS, VALIDATION_RULES, VALIDATION_RUNS, QUALITY_ISSUES, ISSUE_RESOLUTIONS, QUALITY_SCORES, and AUDIT_LOGS. Primary and foreign keys in the ER diagram match the DDL.

The design targets Third Normal Form. Each table stores one kind of entity or event, each non-key column describes that table's key, and no non-key column is included to carry a transitive dependency from another table. Role names are stored once and referenced by USERS; datasets are referenced by fields and runs; issues reference a validation rule rather than duplicating its field; scores reference a run rather than duplicating its dataset; resolution history is kept in its own table. Severity and message on an issue are intentional run-time snapshots so later rule edits do not rewrite historical outcomes.

Integrity rules include primary/foreign keys, non-null columns, unique lowercased user email, per-owner dataset-name uniqueness, per-dataset field-name uniqueness, check constraints for statuses/rule types/scores, defaults for lifecycle columns, and indexes for common joins and filters. The backend uses ORM-based parameter binding for routine operations; raw SQL is limited to the dashboard's view/aggregate and invocation of the stored procedure.
