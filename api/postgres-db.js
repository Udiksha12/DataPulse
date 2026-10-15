import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = connectionString ? new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
}) : null;

const demoDatasetName = 'Student Attendance & Performance 2026';
let initialization;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function buildIssueStatusUpdateQuery(issueId, newStatus) {
  return {
    text: `UPDATE quality_issues
      SET status = $2,
          resolved_at = CASE WHEN $3 THEN NULL ELSE now() END
      WHERE issue_id = $1
      RETURNING *`,
    values: [Number(issueId), newStatus, newStatus === 'OPEN'],
  };
}

async function initialize() {
  if (!pool) throw new Error('DATABASE_URL is required for the PostgreSQL adapter.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('datapulse_demo_seed_v1'))");
    await client.query(`
      INSERT INTO roles (role_name, description) VALUES
        ('ADMIN', 'Manages users and all datasets.'),
        ('ANALYST', 'Manages owned datasets and validation runs.')
      ON CONFLICT (role_name) DO NOTHING
    `);
    const roleRows = await client.query('SELECT role_id, role_name FROM roles WHERE role_name IN ($1, $2)', ['ADMIN', 'ANALYST']);
    const roles = Object.fromEntries(roleRows.rows.map((row) => [row.role_name, Number(row.role_id)]));
    const seeds = [
      { name: 'Udiksha Agarwal (24BAI0086)', email: process.env.DATAPULSE_SEED_ADMIN_EMAIL || 'udiksha@datapulse.local', password: process.env.DATAPULSE_SEED_ADMIN_PASSWORD || 'Udiksha@DataPulse2026', role: 'ADMIN' },
      { name: 'Bakya (24BAI0071)', email: process.env.DATAPULSE_SEED_ANALYST_EMAIL || 'bakya@datapulse.local', password: process.env.DATAPULSE_SEED_ANALYST_PASSWORD || 'Bakya@DataPulse2026', role: 'ANALYST' },
      { name: 'Rudra (24BKT0125)', email: process.env.DATAPULSE_SEED_RUDRA_EMAIL || 'rudra@datapulse.local', password: process.env.DATAPULSE_SEED_RUDRA_PASSWORD || 'Rudra@DataPulse2026', role: 'ANALYST' },
    ];
    const userIds = {};
    for (const seed of seeds) {
      const email = seed.email.trim().toLowerCase();
      let result = await client.query('SELECT user_id FROM users WHERE lower(email) = $1', [email]);
      if (!result.rowCount) {
        const passwordHash = await bcrypt.hash(seed.password, 10);
        await client.query(
          'INSERT INTO users (role_id, full_name, email, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [roles[seed.role], seed.name, email, passwordHash],
        );
        result = await client.query('SELECT user_id FROM users WHERE lower(email) = $1', [email]);
      }
      if (!result.rowCount) throw new Error(`Unable to create or find demo account ${email}.`);
      userIds[email] = Number(result.rows[0].user_id);
    }

    const bakyaEmail = (process.env.DATAPULSE_SEED_ANALYST_EMAIL || 'bakya@datapulse.local').trim().toLowerCase();
    const ownerId = userIds[bakyaEmail];
    let datasetResult = await client.query(
      'SELECT dataset_id FROM datasets WHERE owner_id = $1 AND lower(dataset_name) = lower($2)',
      [ownerId, demoDatasetName],
    );
    if (!datasetResult.rowCount) {
      datasetResult = await client.query(
        `INSERT INTO datasets (owner_id, dataset_name, description)
         VALUES ($1, $2, $3) ON CONFLICT (owner_id, dataset_name) DO NOTHING RETURNING dataset_id`,
        [ownerId, demoDatasetName, 'Institutional registry of course attendance percentage, email validation, and student identifiers.'],
      );
      if (!datasetResult.rowCount) datasetResult = await client.query('SELECT dataset_id FROM datasets WHERE owner_id = $1 AND lower(dataset_name) = lower($2)', [ownerId, demoDatasetName]);
    }
    const datasetId = Number(datasetResult.rows[0].dataset_id);
    const fields = [
      { name: 'record_id', type: 'TEXT', rules: [['REQUIRED', 'HIGH', {}], ['UNIQUE', 'HIGH', {}]] },
      { name: 'email', type: 'TEXT', rules: [['REQUIRED', 'HIGH', {}], ['EMAIL', 'MEDIUM', {}]] },
      { name: 'attendance_pct', type: 'DECIMAL', rules: [['RANGE', 'HIGH', { min: 0, max: 100 }]] },
      { name: 'department', type: 'TEXT', rules: [['REQUIRED', 'LOW', {}]] },
    ];
    for (const field of fields) {
      let fieldResult = await client.query(
        'SELECT field_id FROM dataset_fields WHERE dataset_id = $1 AND field_name = $2',
        [datasetId, field.name],
      );
      if (!fieldResult.rowCount) {
        fieldResult = await client.query(
          'INSERT INTO dataset_fields (dataset_id, field_name, data_type) VALUES ($1, $2, $3) ON CONFLICT (dataset_id, field_name) DO NOTHING RETURNING field_id',
          [datasetId, field.name, field.type],
        );
        if (!fieldResult.rowCount) fieldResult = await client.query('SELECT field_id FROM dataset_fields WHERE dataset_id = $1 AND field_name = $2', [datasetId, field.name]);
      }
      const fieldId = Number(fieldResult.rows[0].field_id);
      for (const [ruleType, severity, ruleConfig] of field.rules) {
        const exists = await client.query('SELECT 1 FROM validation_rules WHERE field_id = $1 AND rule_type = $2 LIMIT 1', [fieldId, ruleType]);
        if (!exists.rowCount) {
          await client.query(
            'INSERT INTO validation_rules (field_id, rule_type, severity, rule_config) VALUES ($1, $2, $3, $4::jsonb)',
            [fieldId, ruleType, severity, JSON.stringify(ruleConfig)],
          );
        }
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function ready() {
  if (!initialization) initialization = initialize();
  return initialization;
}

async function query(text, params = []) {
  await ready();
  return pool.query(text, params);
}

function mapRun(row, score, datasetName) {
  return {
    runId: Number(row.run_id), datasetId: Number(row.dataset_id), datasetName,
    startedBy: Number(row.started_by), status: row.status, totalRows: Number(row.total_rows),
    issueCount: Number(row.issue_count), failureMessage: row.failure_message,
    startedAt: row.started_at, completedAt: row.completed_at,
    score: score ? {
      completenessScore: Number(score.completeness_score), validityScore: Number(score.validity_score),
      uniquenessScore: Number(score.uniqueness_score), overallScore: Number(score.overall_score),
    } : null,
  };
}

async function dashboardSummary(userId, role) {
  const { rows } = await query(`
    SELECT d.dataset_id, d.dataset_name, d.status AS dataset_status,
           v.latest_run_id, v.latest_overall_score, v.open_issue_count,
           (SELECT count(*) FROM validation_runs r WHERE r.dataset_id = d.dataset_id AND r.status = 'COMPLETED') AS completed_runs
      FROM datasets d
      JOIN dataset_quality_summary v ON v.dataset_id = d.dataset_id
     WHERE ($2 = 'ADMIN' OR d.owner_id = $1)
     ORDER BY d.dataset_id
  `, [Number(userId), role]);
  const scores = rows.filter((row) => row.latest_overall_score !== null).map((row) => Number(row.latest_overall_score));
  return {
    totalDatasets: rows.filter((row) => row.dataset_status === 'ACTIVE').length,
    completedRuns: rows.reduce((sum, row) => sum + Number(row.completed_runs), 0),
    averageQualityScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 10) / 10 : null,
    openIssues: rows.reduce((sum, row) => sum + Number(row.open_issue_count), 0),
    datasets: rows.map((row) => ({
      datasetId: Number(row.dataset_id), datasetName: row.dataset_name, datasetStatus: row.dataset_status,
      latestRunId: row.latest_run_id == null ? null : Number(row.latest_run_id),
      latestOverallScore: row.latest_overall_score == null ? null : Number(row.latest_overall_score),
      openIssueCount: Number(row.open_issue_count),
    })),
  };
}

export const postgresDb = {
  databaseMode: () => 'Supabase PostgreSQL',
  healthCheck: async () => { await query('SELECT 1'); return true; },

  findUserByEmail: async (email) => {
    const { rows } = await query(`SELECT u.*, r.role_name FROM users u JOIN roles r USING (role_id) WHERE lower(u.email) = lower($1) AND u.is_active`, [email.trim()]);
    return rows[0] || null;
  },
  findUserById: async (userId) => {
    const { rows } = await query('SELECT u.*, r.role_name FROM users u JOIN roles r USING (role_id) WHERE u.user_id = $1', [Number(userId)]);
    return rows[0] || null;
  },
  getAllUsers: async () => {
    const { rows } = await query(`SELECT u.user_id, u.email, u.full_name, r.role_name, u.is_active, u.created_at FROM users u JOIN roles r USING (role_id) ORDER BY u.user_id`);
    return rows.map((row) => ({ userId: Number(row.user_id), email: row.email, fullName: row.full_name, role: row.role_name, isActive: row.is_active, createdAt: row.created_at }));
  },

  getDatasets: async ({ userId, role, search, status }) => {
    const { rows } = await query(`
      SELECT d.dataset_id, d.dataset_name, d.description, d.status, d.owner_id,
             u.full_name AS owner_name, d.created_at, d.updated_at,
             (SELECT count(*) FROM dataset_fields f WHERE f.dataset_id = d.dataset_id AND f.is_active) AS field_count,
             (SELECT count(*) FROM validation_rules r JOIN dataset_fields f USING (field_id) WHERE f.dataset_id = d.dataset_id AND f.is_active AND r.is_active) AS rule_count,
             v.latest_run_id, v.latest_overall_score, v.open_issue_count
        FROM datasets d JOIN users u ON u.user_id = d.owner_id
        JOIN dataset_quality_summary v USING (dataset_id)
       WHERE ($2 = 'ADMIN' OR d.owner_id = $1)
         AND ($3::text IS NULL OR d.status = upper($3))
         AND ($4::text IS NULL OR d.dataset_name ILIKE '%' || $4 || '%' OR coalesce(d.description, '') ILIKE '%' || $4 || '%')
       ORDER BY d.updated_at DESC, d.dataset_id DESC
    `, [Number(userId), role, status || null, search || null]);
    return rows.map((row) => ({
      datasetId: Number(row.dataset_id), datasetName: row.dataset_name, description: row.description,
      status: row.status, ownerId: Number(row.owner_id), ownerName: row.owner_name,
      fieldCount: Number(row.field_count), ruleCount: Number(row.rule_count),
      latestRunId: row.latest_run_id == null ? null : Number(row.latest_run_id),
      latestOverallScore: row.latest_overall_score == null ? null : Number(row.latest_overall_score),
      openIssueCount: Number(row.open_issue_count), createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  },

  getDatasetById: async (datasetId, userId, role) => {
    const result = await query('SELECT * FROM datasets WHERE dataset_id = $1', [Number(datasetId)]);
    const dataset = result.rows[0];
    if (!dataset) return null;
    if (role !== 'ADMIN' && Number(dataset.owner_id) !== Number(userId)) throw fail('Access denied to dataset.', 403);
    const [fieldResult, runResult] = await Promise.all([
      query(`SELECT f.*, coalesce(json_agg(json_build_object('ruleId', r.rule_id, 'fieldId', r.field_id, 'ruleType', r.rule_type, 'severity', r.severity, 'ruleConfig', r.rule_config, 'isActive', r.is_active, 'createdAt', r.created_at)) FILTER (WHERE r.rule_id IS NOT NULL), '[]') AS rules
        FROM dataset_fields f LEFT JOIN validation_rules r ON r.field_id = f.field_id AND r.is_active
       WHERE f.dataset_id = $1 AND f.is_active GROUP BY f.field_id ORDER BY f.field_id`, [Number(datasetId)]),
      query(`SELECT r.*, s.completeness_score, s.validity_score, s.uniqueness_score, s.overall_score
        FROM validation_runs r LEFT JOIN quality_scores s USING (run_id)
       WHERE r.dataset_id = $1 ORDER BY r.started_at DESC, r.run_id DESC`, [Number(datasetId)]),
    ]);
    return {
      datasetId: Number(dataset.dataset_id), datasetName: dataset.dataset_name, description: dataset.description,
      status: dataset.status, ownerId: Number(dataset.owner_id), createdAt: dataset.created_at, updatedAt: dataset.updated_at,
      fields: fieldResult.rows.map((field) => ({
        fieldId: Number(field.field_id), datasetId: Number(field.dataset_id), fieldName: field.field_name,
        dataType: field.data_type, isActive: field.is_active, active: field.is_active, createdAt: field.created_at,
        rules: field.rules.map((rule) => ({ ...rule, ruleId: Number(rule.ruleId), fieldId: Number(rule.fieldId), isActive: rule.isActive, active: rule.isActive })),
      })),
      runs: runResult.rows.map((run) => mapRun(run,
        run.overall_score == null ? null : {
          completeness_score: run.completeness_score, validity_score: run.validity_score,
          uniqueness_score: run.uniqueness_score, overall_score: run.overall_score,
        }, dataset.dataset_name)),
    };
  },

  createDataset: async ({ datasetName, description, ownerId }) => {
    if (!datasetName?.trim()) throw fail('Dataset name is required.');
    try {
      const { rows } = await query('INSERT INTO datasets (owner_id, dataset_name, description) VALUES ($1, $2, $3) RETURNING *', [Number(ownerId), datasetName.trim(), description?.trim() || '']);
      return rows[0];
    } catch (error) {
      if (error.code === '23505') throw fail('You already have a dataset with this name.');
      throw error;
    }
  },
  updateDataset: async (datasetId, { datasetName, description, status }, userId, role) => {
    const current = await query('SELECT * FROM datasets WHERE dataset_id = $1', [Number(datasetId)]);
    if (!current.rowCount) return null;
    if (role !== 'ADMIN' && Number(current.rows[0].owner_id) !== Number(userId)) throw fail('Access denied.', 403);
    const nextStatus = status && ['ACTIVE', 'ARCHIVED'].includes(status.toUpperCase()) ? status.toUpperCase() : current.rows[0].status;
    const { rows } = await query(`UPDATE datasets SET dataset_name = $2, description = $3, status = $4, updated_at = now() WHERE dataset_id = $1 RETURNING *`, [Number(datasetId), datasetName?.trim() || current.rows[0].dataset_name, description === undefined ? current.rows[0].description : description.trim(), nextStatus]);
    return rows[0];
  },
  archiveDataset: async (datasetId, userId, role) => postgresDb.updateDataset(datasetId, { status: 'ARCHIVED' }, userId, role),

  addField: async (datasetId, { fieldName, dataType }, userId, role) => {
    const dataset = await query('SELECT owner_id FROM datasets WHERE dataset_id = $1', [Number(datasetId)]);
    if (!dataset.rowCount) throw fail('Dataset not found.', 404);
    if (role !== 'ADMIN' && Number(dataset.rows[0].owner_id) !== Number(userId)) throw fail('Access denied.', 403);
    try {
      const { rows } = await query('INSERT INTO dataset_fields (dataset_id, field_name, data_type) VALUES ($1, $2, $3) RETURNING *', [Number(datasetId), fieldName.trim(), dataType || 'TEXT']);
      return rows[0];
    } catch (error) {
      if (error.code === '23505') throw fail(`Field '${fieldName.trim()}' already exists.`);
      throw error;
    }
  },
  updateField: async (fieldId, { fieldName, dataType }) => {
    const { rows } = await query('UPDATE dataset_fields SET field_name = coalesce($2, field_name), data_type = coalesce($3, data_type) WHERE field_id = $1 RETURNING *', [Number(fieldId), fieldName?.trim() || null, dataType || null]);
    return rows[0] || null;
  },
  archiveField: async (fieldId) => {
    const { rows } = await query('UPDATE dataset_fields SET is_active = false WHERE field_id = $1 RETURNING *', [Number(fieldId)]);
    return rows[0] || null;
  },
  addRule: async (fieldId, { ruleType, severity, ruleConfig }) => {
    const { rows } = await query('INSERT INTO validation_rules (field_id, rule_type, severity, rule_config) VALUES ($1, $2, $3, $4::jsonb) RETURNING *', [Number(fieldId), ruleType, severity || 'MEDIUM', JSON.stringify(ruleConfig || {})]);
    return rows[0];
  },
  updateRule: async (ruleId, { ruleType, severity, ruleConfig }) => {
    const { rows } = await query('UPDATE validation_rules SET rule_type = coalesce($2, rule_type), severity = coalesce($3, severity), rule_config = coalesce($4::jsonb, rule_config) WHERE rule_id = $1 RETURNING *', [Number(ruleId), ruleType || null, severity || null, ruleConfig ? JSON.stringify(ruleConfig) : null]);
    return rows[0] || null;
  },
  deactivateRule: async (ruleId) => {
    const { rows } = await query('UPDATE validation_rules SET is_active = false WHERE rule_id = $1 RETURNING *', [Number(ruleId)]);
    return rows[0] || null;
  },

  createValidationRunTransaction: async ({ datasetId, userId, totalRows, foundIssues }) => {
    await ready();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.user_id', $1, true)", [String(Number(userId))]);
      const runResult = await client.query(`INSERT INTO validation_runs (dataset_id, started_by, status, total_rows, issue_count, completed_at)
        VALUES ($1, $2, 'COMPLETED', $3, $4, now()) RETURNING *`, [Number(datasetId), Number(userId), totalRows, foundIssues.length]);
      const run = runResult.rows[0];
      for (const item of foundIssues) {
        await client.query(`INSERT INTO quality_issues (run_id, rule_id, row_number, severity, message, observed_value)
          VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (run_id, rule_id, row_number) DO NOTHING`,
        [Number(run.run_id), Number(item.ruleId), Number(item.rowNumber), item.severity, item.message, item.observedValue || null]);
      }
      await client.query('CALL recalculate_quality_score($1)', [Number(run.run_id)]);
      const scoreResult = await client.query('SELECT * FROM quality_scores WHERE run_id = $1', [Number(run.run_id)]);
      await client.query('COMMIT');
      return mapRun(run, scoreResult.rows[0], null);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
  recalculateQualityScoreProcedure: async (runId) => {
    await query('CALL recalculate_quality_score($1)', [Number(runId)]);
    const { rows } = await query('SELECT * FROM quality_scores WHERE run_id = $1', [Number(runId)]);
    const score = rows[0];
    return score ? { completenessScore: Number(score.completeness_score), validityScore: Number(score.validity_score), uniquenessScore: Number(score.uniqueness_score), overallScore: Number(score.overall_score) } : null;
  },
  getRunById: async (runId) => {
    const { rows } = await query(`SELECT r.*, d.dataset_name, s.completeness_score, s.validity_score, s.uniqueness_score, s.overall_score
      FROM validation_runs r JOIN datasets d USING (dataset_id) LEFT JOIN quality_scores s USING (run_id) WHERE r.run_id = $1`, [Number(runId)]);
    const row = rows[0];
    return row ? { ...mapRun(row, row.overall_score == null ? null : row, row.dataset_name), datasetName: row.dataset_name } : null;
  },
  getIssuesForRun: async (runId, { page = 0, size = 20, status, severity }) => {
    const pageNumber = Math.max(0, Number(page) || 0);
    const pageSize = Math.min(100, Math.max(1, Number(size) || 20));
    const params = [Number(runId), status || null, severity || null];
    const countResult = await query(`SELECT count(*) FROM quality_issues q WHERE q.run_id = $1 AND ($2::text IS NULL OR q.status = upper($2)) AND ($3::text IS NULL OR q.severity = upper($3))`, params);
    const totalElements = Number(countResult.rows[0].count);
    const { rows } = await query(`SELECT q.*, r.rule_type, f.field_name FROM quality_issues q
      JOIN validation_rules r USING (rule_id) JOIN dataset_fields f USING (field_id)
      WHERE q.run_id = $1 AND ($2::text IS NULL OR q.status = upper($2)) AND ($3::text IS NULL OR q.severity = upper($3))
      ORDER BY q.row_number, q.issue_id LIMIT $4 OFFSET $5`, [...params, pageSize, pageNumber * pageSize]);
    const ids = rows.map((row) => Number(row.issue_id));
    const resolutionResult = ids.length ? await query('SELECT * FROM issue_resolutions WHERE issue_id = ANY($1::bigint[]) ORDER BY resolved_at', [ids]) : { rows: [] };
    const resolutionsByIssue = new Map();
    for (const resolution of resolutionResult.rows) {
      const list = resolutionsByIssue.get(Number(resolution.issue_id)) || [];
      list.push({ resolutionId: Number(resolution.resolution_id), resolvedByUserId: Number(resolution.resolved_by_user_id), action: resolution.action, note: resolution.note, resolvedAt: resolution.resolved_at });
      resolutionsByIssue.set(Number(resolution.issue_id), list);
    }
    return {
      content: rows.map((row) => ({ issueId: Number(row.issue_id), runId: Number(row.run_id), ruleId: Number(row.rule_id), ruleType: row.rule_type, fieldName: row.field_name, rowNumber: Number(row.row_number), severity: row.severity, message: row.message, observedValue: row.observed_value, status: row.status, createdAt: row.created_at, resolvedAt: row.resolved_at, resolutions: resolutionsByIssue.get(Number(row.issue_id)) || [] })),
      totalElements, totalPages: Math.ceil(totalElements / pageSize), number: pageNumber, page: pageNumber, size: pageSize,
    };
  },
  updateIssueStatus: async (issueId, { action, note }, userId) => {
    const newStatus = action === 'REOPENED' ? 'OPEN' : action === 'FIXED' ? 'RESOLVED' : action === 'WAIVED' ? 'WAIVED' : null;
    if (!newStatus) throw fail('Action must be FIXED, WAIVED, or REOPENED.');
    await ready();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.user_id', $1, true)", [String(Number(userId))]);
      const current = await client.query('SELECT * FROM quality_issues WHERE issue_id = $1 FOR UPDATE', [Number(issueId)]);
      if (!current.rowCount) { await client.query('ROLLBACK'); return null; }
      const statusUpdate = buildIssueStatusUpdateQuery(issueId, newStatus);
      const updated = await client.query(statusUpdate.text, statusUpdate.values);
      await client.query('INSERT INTO issue_resolutions (issue_id, resolved_by_user_id, action, note) VALUES ($1, $2, $3, $4)', [Number(issueId), Number(userId), action, note.trim()]);
      await client.query(`INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, old_values, new_values)
        VALUES ($1, 'QUALITY_ISSUE', $2, 'SUPPORT_TEAM_NOTIFIED', $3::jsonb, $4::jsonb)`, [
        Number(userId), Number(issueId),
        JSON.stringify({ status: current.rows[0].status }),
        JSON.stringify({ status: newStatus, note: note.trim(), recipientTeam: 'DEV_PRODUCTION_SUPPORT' }),
      ]);
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  },

  getDashboardSummary: dashboardSummary,
  getAdminOverview: async () => {
    const [summary, users, runs, issues, logs] = await Promise.all([
      dashboardSummary(1, 'ADMIN'),
      postgresDb.getAllUsers(),
      query('SELECT count(*) FROM validation_runs'),
      query('SELECT count(*) FROM quality_issues'),
      query('SELECT * FROM audit_logs ORDER BY created_at DESC, log_id DESC LIMIT 15'),
    ]);
    return {
      ...summary,
      totalUsers: users.length,
      totalRuns: Number(runs.rows[0].count),
      totalIssues: Number(issues.rows[0].count),
      users,
      recentAuditLogs: logs.rows.map((row) => ({ logId: Number(row.log_id), actorUserId: row.actor_user_id == null ? null : Number(row.actor_user_id), entityType: row.entity_type, entityId: Number(row.entity_id), action: row.action, oldValues: row.old_values, newValues: row.new_values, createdAt: row.created_at })),
    };
  },
};
