# DataPulse Data Dictionary

All timestamps use PostgreSQL `timestamptz` in UTC. IDs are generated identity primary keys. The schema is implemented in `db/schema.sql`.

| Table | Column | Type | Meaning / rule |
|---|---|---|---|
| `roles` | `role_id` | `bigint` | Primary key. |
|  | `role_name` | `varchar(30)` | Unique; `ADMIN` or `ANALYST`. |
|  | `description` | `text` | Optional role description. |
| `users` | `user_id` | `bigint` | Primary key. |
|  | `role_id` | `bigint` | Required FK to `roles`. |
|  | `full_name` | `varchar(120)` | Required display name. |
|  | `email` | `varchar(254)` | Required; unique case-insensitively. |
|  | `password_hash` | `varchar(255)` | Required BCrypt hash; never plaintext. |
|  | `is_active` | `boolean` | Required; defaults true. |
|  | `created_at`, `updated_at` | `timestamptz` | Account timestamps. |
| `datasets` | `dataset_id` | `bigint` | Primary key. |
|  | `owner_id` | `bigint` | Required FK to `users`. |
|  | `dataset_name` | `varchar(160)` | Required; unique per owner. |
|  | `description` | `text` | Optional description. |
|  | `status` | `varchar(20)` | `ACTIVE` or `ARCHIVED`; defaults `ACTIVE`. |
|  | `created_at`, `updated_at` | `timestamptz` | Dataset timestamps. |
| `dataset_fields` | `field_id` | `bigint` | Primary key. |
|  | `dataset_id` | `bigint` | Required FK to `datasets`, cascades only before history exists. |
|  | `field_name` | `varchar(120)` | Required; unique within a dataset. |
|  | `data_type` | `varchar(20)` | `TEXT`, `INTEGER`, `DECIMAL`, `DATE`, or `BOOLEAN`. |
|  | `is_active` | `boolean` | Required; defaults true. Archived fields are excluded from new runs but retained for historical issues. |
|  | `created_at` | `timestamptz` | Field creation time. |
| `validation_rules` | `rule_id` | `bigint` | Primary key. |
|  | `field_id` | `bigint` | Required FK to `dataset_fields`. |
|  | `rule_type` | `varchar(20)` | `REQUIRED`, `UNIQUE`, `EMAIL`, `RANGE`, or `TYPE` (checks the field's configured type). |
|  | `severity` | `varchar(10)` | `LOW`, `MEDIUM`, or `HIGH`. |
|  | `rule_config` | `jsonb` | Type-specific settings; `RANGE` uses `min`/`max`. |
|  | `is_active` | `boolean` | Defaults true; deactivate historical rules rather than delete. |
|  | `created_at` | `timestamptz` | Rule creation time. |
| `validation_runs` | `run_id` | `bigint` | Primary key. |
|  | `dataset_id` | `bigint` | Required FK to `datasets`. |
|  | `started_by` | `bigint` | Required FK to `users`. |
|  | `started_at`, `completed_at` | `timestamptz` | Run lifecycle timestamps. |
|  | `status` | `varchar(20)` | `QUEUED`, `RUNNING`, `COMPLETED`, or `FAILED`. |
|  | `total_rows`, `issue_count` | `integer` | Nonnegative run counts. |
|  | `failure_message` | `text` | Optional safe error summary. |
| `quality_issues` | `issue_id` | `bigint` | Primary key. |
|  | `run_id` | `bigint` | Required FK to `validation_runs`. |
|  | `rule_id` | `bigint` | Required FK to the failed `validation_rules` row. |
|  | `row_number` | `integer` | Required 1-based CSV data row number; excludes header. |
|  | `severity` | `varchar(10)` | Severity snapshot at run time: `LOW`, `MEDIUM`, or `HIGH`. |
|  | `message` | `text` | Human-readable failure explanation. |
|  | `observed_value` | `text` | Value that failed; may be null for missing values. |
|  | `status` | `varchar(20)` | `OPEN`, `RESOLVED`, or `WAIVED`; defaults `OPEN`. |
|  | `created_at`, `resolved_at` | `timestamptz` | Issue lifecycle timestamps. |
| `issue_resolutions` | `resolution_id` | `bigint` | Primary key. |
|  | `issue_id` | `bigint` | Required FK to `quality_issues`. |
|  | `resolved_by_user_id` | `bigint` | Required FK to `users`. |
|  | `action` | `varchar(20)` | `FIXED`, `WAIVED`, or `REOPENED`. |
|  | `note` | `text` | Required resolution note. |
|  | `resolved_at` | `timestamptz` | Defaults to current time. |
| `quality_scores` | `score_id` | `bigint` | Primary key. |
|  | `run_id` | `bigint` | Required unique FK to `validation_runs`; one score per run. |
|  | `completeness_score` | `numeric(5,2)` | Score from 0 to 100. |
|  | `validity_score` | `numeric(5,2)` | Score from 0 to 100. |
|  | `uniqueness_score` | `numeric(5,2)` | Score from 0 to 100. |
|  | `overall_score` | `numeric(5,2)` | Average of the three component scores, 0 to 100. |
|  | `calculated_at` | `timestamptz` | Score calculation time. |
| `audit_logs` | `log_id` | `bigint` | Primary key. |
|  | `actor_user_id` | `bigint` | Nullable FK to `users`; set from transaction context when available. |
|  | `entity_type`, `entity_id` | `varchar(40)`, `bigint` | Entity changed. |
|  | `action` | `varchar(40)` | Action such as `ISSUE_CREATED` or `ISSUE_STATUS_CHANGED`. |
|  | `old_values`, `new_values` | `jsonb` | Before/after audit details. |
|  | `created_at` | `timestamptz` | Audit event time. |
