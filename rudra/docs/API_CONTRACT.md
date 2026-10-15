# DataPulse API Contract

Backend: Spring Boot REST API. Frontend: React in `bakya/frontend/`. Use JSON for API bodies except the CSV run upload. Unless stated otherwise, all endpoints are under `/api` and require a bearer JWT after login.

## Authentication

| Method and path | Request | Response / behavior |
|---|---|---|
| `POST /auth/login` | `{ "email": "...", "password": "..." }` | `{ "token": "...", "user": { "userId": 1, "fullName": "...", "email": "...", "role": "ANALYST" } }` |
| `GET /auth/me` | Bearer token | Returns the authenticated user's safe profile and role. |
| `POST /auth/logout` | Bearer token | Stateless JWT clients clear the token; backend may revoke it if a denylist is implemented. |

Never return `password_hash` from an endpoint. Seed development users with BCrypt hashes and document their local-only setup without committing secrets.

## Main resources

| Method and path | Purpose |
|---|---|
| `GET /datasets?page=&size=&q=&status=` | List the user's permitted datasets with pagination and filters. Admin may view all. |
| `POST /datasets` | Create a dataset. Owner is taken from the authenticated user, not trusted from the request body. |
| `GET /datasets/{datasetId}` | Dataset details including fields and rules. |
| `PUT /datasets/{datasetId}` | Update dataset metadata. |
| `DELETE /datasets/{datasetId}` | Archive the dataset; preserve historical runs. |
| `POST /datasets/{datasetId}/fields` | Add a field with `fieldName` and `dataType`; requiredness is a `REQUIRED` validation rule. |
| `PUT /fields/{fieldId}` / `DELETE /fields/{fieldId}` | Update a field or disable it if it has history. |
| `POST /fields/{fieldId}/rules` | Add a rule with `ruleType`, `severity`, and `ruleConfig`. Types: `REQUIRED`, `UNIQUE`, `EMAIL`, `RANGE`, `TYPE`; `TYPE` checks the field's configured data type. |
| `PUT /rules/{ruleId}` / `DELETE /rules/{ruleId}` | Update or deactivate a rule. |
| `POST /datasets/{datasetId}/runs` | Multipart upload with part name `file`; validate CSV columns against dataset fields and persist run/issues/score in one transaction. |
| `GET /runs/{runId}` | Run status, counts, score, and paginated issues. |
| `PATCH /issues/{issueId}/status` | `{ "status": "RESOLVED", "note": "..." }`; append an `Issue_Resolutions` history row. |
| `GET /dashboard/summary` | Summary counts and latest quality scores using the database view/query. |
| `GET /admin/overview` | Admin-only workspace overview across every dataset; an Analyst receives HTTP 403. |

## Roles and error shape

- `ADMIN`: view and manage all datasets; access the admin overview.
- `ANALYST`: manage owned datasets, fields, rules, runs, and issue resolutions.
- Enforce ownership and roles on the API, not only by hiding frontend buttons.
- Return standard HTTP statuses and a consistent error body, for example `{ "code": "VALIDATION_ERROR", "message": "...", "details": [] }`.
- Validate page sizes, CSV headers, rule configuration, and all user-provided IDs. Never build SQL by concatenating user input.

## End-to-end acceptance workflow

1. Log in as an Analyst and create a dataset with fields `record_id`, `email`, `attendance_pct`, and `department`.
2. Add rules: `record_id` unique and required, `email` required and email-formatted, `attendance_pct` in the range 0 to 100.
3. Upload `rudra/db/sample_validation.csv` to start a run.
4. See the run summary, issues, and score; resolve at least one issue and see the updated status/history.
5. Log in as Admin and verify the admin-only page/API behavior.
