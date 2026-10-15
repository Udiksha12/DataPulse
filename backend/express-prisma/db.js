/**
 * DataPulse Database Layer
 * Authors: Udiksha Agarwal (24BAI0086), Bakya (24BAI0071), Rudra (24BKT0125)
 * Course: BCSE302P Database Systems Lab | Slot: L25+L26
 *
 * Implements the 10 normalized tables, constraints, indexes,
 * stored procedure logic (recalculate_quality_score), view (dataset_quality_summary),
 * and audit trigger (audit_quality_issue_change).
 *
 * This Express demo uses an in-memory store. PostgreSQL schema assets exist,
 * but persistence is not wired into these API operations yet.
 */

import bcrypt from 'bcryptjs';
import { printUdiksha24BAI0086Identity } from '../backend/identity/udiksha24BAI0086.js';
import { printRudra24BKT0125Identity } from '../backend/identity/rudra24BKT0125.js';

printUdiksha24BAI0086Identity();
printRudra24BKT0125Identity();

// -----------------------------------------------------------------------------
// Relational In-Memory Store (Mirrors PostgreSQL 10-table 3NF schema exactly)
// -----------------------------------------------------------------------------
const defaultAdminPassHash = bcrypt.hashSync(process.env.DATAPULSE_SEED_ADMIN_PASSWORD || 'Udiksha@DataPulse2026', 10);
const defaultBakyaPassHash = bcrypt.hashSync(process.env.DATAPULSE_SEED_ANALYST_PASSWORD || 'Bakya@DataPulse2026', 10);
const defaultRudraPassHash = bcrypt.hashSync(process.env.DATAPULSE_SEED_RUDRA_PASSWORD || 'Rudra@DataPulse2026', 10);

const store = {
  // Table 1: roles
  roles: [
    { role_id: 1, role_name: 'ADMIN', description: 'Manages users and all datasets.' },
    { role_id: 2, role_name: 'ANALYST', description: 'Manages owned datasets and validation runs.' },
  ],

  // Table 2: users (Single Users table requirement with role_id)
  users: [
    {
      user_id: 1,
      role_id: 1,
      full_name: 'Udiksha Agarwal (24BAI0086)',
      email: (process.env.DATAPULSE_SEED_ADMIN_EMAIL || 'udiksha@datapulse.local').toLowerCase(),
      password_hash: defaultAdminPassHash,
      is_active: true,
      created_at: new Date('2026-09-01T10:00:00Z'),
      updated_at: new Date('2026-09-01T10:00:00Z'),
    },
    {
      user_id: 2,
      role_id: 2,
      full_name: 'Bakya (24BAI0071)',
      email: (process.env.DATAPULSE_SEED_ANALYST_EMAIL || 'bakya@datapulse.local').toLowerCase(),
      password_hash: defaultBakyaPassHash,
      is_active: true,
      created_at: new Date('2026-09-01T10:00:00Z'),
      updated_at: new Date('2026-09-01T10:00:00Z'),
    },
    {
      user_id: 3,
      role_id: 2,
      full_name: 'Rudra (24BKT0125)',
      email: (process.env.DATAPULSE_SEED_RUDRA_EMAIL || 'rudra@datapulse.local').toLowerCase(),
      password_hash: defaultRudraPassHash,
      is_active: true,
      created_at: new Date('2026-09-01T10:00:00Z'),
      updated_at: new Date('2026-09-01T10:00:00Z'),
    },
  ],

  // Table 3: datasets
  datasets: [
    {
      dataset_id: 1,
      owner_id: 2,
      dataset_name: 'Student Attendance & Performance 2026',
      description: 'Institutional registry of course attendance percentage, email validation, and student identifiers.',
      status: 'ACTIVE',
      created_at: new Date('2026-09-10T09:00:00Z'),
      updated_at: new Date('2026-09-10T09:00:00Z'),
    },
  ],

  // Table 4: dataset_fields
  dataset_fields: [
    { field_id: 1, dataset_id: 1, field_name: 'record_id', data_type: 'TEXT', is_active: true, created_at: new Date('2026-09-10T09:05:00Z') },
    { field_id: 2, dataset_id: 1, field_name: 'email', data_type: 'TEXT', is_active: true, created_at: new Date('2026-09-10T09:05:00Z') },
    { field_id: 3, dataset_id: 1, field_name: 'attendance_pct', data_type: 'DECIMAL', is_active: true, created_at: new Date('2026-09-10T09:05:00Z') },
    { field_id: 4, dataset_id: 1, field_name: 'department', data_type: 'TEXT', is_active: true, created_at: new Date('2026-09-10T09:05:00Z') },
  ],

  // Table 5: validation_rules
  validation_rules: [
    { rule_id: 1, field_id: 1, rule_type: 'REQUIRED', severity: 'HIGH', rule_config: {}, is_active: true, created_at: new Date('2026-09-10T09:10:00Z') },
    { rule_id: 2, field_id: 1, rule_type: 'UNIQUE', severity: 'HIGH', rule_config: {}, is_active: true, created_at: new Date('2026-09-10T09:10:00Z') },
    { rule_id: 3, field_id: 2, rule_type: 'REQUIRED', severity: 'HIGH', rule_config: {}, is_active: true, created_at: new Date('2026-09-10T09:10:00Z') },
    { rule_id: 4, field_id: 2, rule_type: 'EMAIL', severity: 'MEDIUM', rule_config: {}, is_active: true, created_at: new Date('2026-09-10T09:10:00Z') },
    { rule_id: 5, field_id: 3, rule_type: 'RANGE', severity: 'HIGH', rule_config: { min: 0, max: 100 }, is_active: true, created_at: new Date('2026-09-10T09:10:00Z') },
    { rule_id: 6, field_id: 4, rule_type: 'REQUIRED', severity: 'LOW', rule_config: {}, is_active: true, created_at: new Date('2026-09-10T09:10:00Z') },
  ],

  // Table 6: validation_runs
  validation_runs: [],

  // Table 7: quality_issues
  quality_issues: [],

  // Table 8: issue_resolutions
  issue_resolutions: [],

  // Table 9: quality_scores
  quality_scores: [],

  // Table 10: audit_logs (Trigger destination)
  audit_logs: [],

  // Auto-increment counters
  seq: {
    users: 3,
    datasets: 2,
    fields: 5,
    rules: 7,
    runs: 1,
    issues: 1,
    resolutions: 1,
    scores: 1,
    audit: 1,
  },
};

// -----------------------------------------------------------------------------
// Database Operations & Helper Functions
// -----------------------------------------------------------------------------

export const db = {
  databaseMode: () => 'In-Memory Relational Engine (3NF demo)',

  // --- USERS & AUTH ---
  findUserByEmail: async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = store.users.find((u) => u.email.toLowerCase() === cleanEmail && u.is_active);
    if (!user) return null;
    const role = store.roles.find((r) => r.role_id === user.role_id);
    return { ...user, role_name: role ? role.role_name : 'ANALYST' };
  },

  findUserById: async (userId) => {
    const user = store.users.find((u) => u.user_id === Number(userId));
    if (!user) return null;
    const role = store.roles.find((r) => r.role_id === user.role_id);
    return { ...user, role_name: role ? role.role_name : 'ANALYST' };
  },

  getAllUsers: async () => {
    return store.users.map((u) => {
      const role = store.roles.find((r) => r.role_id === u.role_id);
      return {
        userId: u.user_id,
        email: u.email,
        fullName: u.full_name,
        role: role ? role.role_name : 'ANALYST',
        isActive: u.is_active,
        createdAt: u.created_at,
      };
    });
  },

  // --- DATASETS (CRUD, Search, Filter) ---
  getDatasets: async ({ userId, role, search, status }) => {
    let list = store.datasets.slice();
    if (role !== 'ADMIN') {
      list = list.filter((d) => d.owner_id === Number(userId));
    }
    if (status) {
      list = list.filter((d) => d.status.toUpperCase() === status.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.dataset_name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q)));
    }

    return list.map((d) => {
      const owner = store.users.find((u) => u.user_id === d.owner_id);
      const activeFields = store.dataset_fields.filter((f) => f.dataset_id === d.dataset_id && f.is_active);
      const activeRules = store.validation_rules.filter((r) =>
        activeFields.some((f) => f.field_id === r.field_id) && r.is_active
      );

      // Latest completed run & score
      const runs = store.validation_runs
        .filter((r) => r.dataset_id === d.dataset_id && r.status === 'COMPLETED')
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      const latestRun = runs[0] || null;
      const latestScore = latestRun ? store.quality_scores.find((s) => s.run_id === latestRun.run_id) : null;
      const openIssuesCount = store.quality_issues.filter((i) =>
        runs.some((r) => r.run_id === i.run_id) && i.status === 'OPEN'
      ).length;

      return {
        datasetId: d.dataset_id,
        datasetName: d.dataset_name,
        description: d.description,
        status: d.status,
        ownerId: d.owner_id,
        ownerName: owner ? owner.full_name : 'Unknown',
        fieldCount: activeFields.length,
        ruleCount: activeRules.length,
        latestRunId: latestRun ? latestRun.run_id : null,
        latestOverallScore: latestScore ? Number(latestScore.overall_score) : null,
        openIssueCount: openIssuesCount,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      };
    });
  },

  getDatasetById: async (datasetId, userId, role) => {
    const d = store.datasets.find((item) => item.dataset_id === Number(datasetId));
    if (!d) return null;
    if (role !== 'ADMIN' && d.owner_id !== Number(userId)) {
      const err = new Error('Access denied to dataset.');
      err.status = 403;
      throw err;
    }

    const fields = store.dataset_fields
      .filter((f) => f.dataset_id === d.dataset_id && f.is_active)
      .map((f) => {
        const rules = store.validation_rules
          .filter((r) => r.field_id === f.field_id && r.is_active)
          .map((r) => ({
            ruleId: r.rule_id,
            fieldId: r.field_id,
            ruleType: r.rule_type,
            severity: r.severity,
            ruleConfig: r.rule_config,
            isActive: r.is_active,
            createdAt: r.created_at,
          }));
        return {
          fieldId: f.field_id,
          datasetId: f.dataset_id,
          fieldName: f.field_name,
          dataType: f.data_type,
          isActive: f.is_active,
          createdAt: f.created_at,
          rules,
        };
      });

    const runs = store.validation_runs
      .filter((r) => r.dataset_id === d.dataset_id)
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, 10)
      .map((r) => {
        const score = store.quality_scores.find((s) => s.run_id === r.run_id);
        return {
          runId: r.run_id,
          datasetId: r.dataset_id,
          startedBy: r.started_by,
          status: r.status,
          totalRows: r.total_rows,
          issueCount: r.issue_count,
          failureMessage: r.failure_message,
          startedAt: r.started_at,
          completedAt: r.completed_at,
          score: score
            ? {
                completenessScore: Number(score.completeness_score),
                validityScore: Number(score.validity_score),
                uniquenessScore: Number(score.uniqueness_score),
                overallScore: Number(score.overall_score),
              }
            : null,
        };
      });

    return {
      datasetId: d.dataset_id,
      datasetName: d.dataset_name,
      description: d.description,
      status: d.status,
      ownerId: d.owner_id,
      fields,
      runs,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  },

  createDataset: async ({ datasetName, description, ownerId }) => {
    if (!datasetName || !datasetName.trim()) {
      const err = new Error('Dataset name is required.');
      err.status = 400;
      throw err;
    }

    const existing = store.datasets.find(
      (d) => d.owner_id === Number(ownerId) && d.dataset_name.toLowerCase() === datasetName.trim().toLowerCase()
    );
    if (existing) {
      const err = new Error('You already have a dataset with this name.');
      err.status = 400;
      throw err;
    }

    const id = store.seq.datasets++;
    const newDataset = {
      dataset_id: id,
      owner_id: Number(ownerId),
      dataset_name: datasetName.trim(),
      description: description ? description.trim() : '',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    };
    store.datasets.push(newDataset);
    return newDataset;
  },

  updateDataset: async (datasetId, { datasetName, description }, userId, role) => {
    const d = store.datasets.find((item) => item.dataset_id === Number(datasetId));
    if (!d) return null;
    if (role !== 'ADMIN' && d.owner_id !== Number(userId)) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }
    if (datasetName) d.dataset_name = datasetName.trim();
    if (description !== undefined) d.description = description.trim();
    d.updated_at = new Date();
    return d;
  },

  archiveDataset: async (datasetId, userId, role) => {
    const d = store.datasets.find((item) => item.dataset_id === Number(datasetId));
    if (!d) return null;
    if (role !== 'ADMIN' && d.owner_id !== Number(userId)) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }
    d.status = 'ARCHIVED';
    d.updated_at = new Date();
    return d;
  },

  // --- FIELDS & RULES ---
  addField: async (datasetId, { fieldName, dataType }, userId, role) => {
    const d = store.datasets.find((item) => item.dataset_id === Number(datasetId));
    if (!d) throw new Error('Dataset not found');
    if (role !== 'ADMIN' && d.owner_id !== Number(userId)) throw new Error('Access denied');

    const cleanName = fieldName.trim();
    const existing = store.dataset_fields.find(
      (f) => f.dataset_id === Number(datasetId) && f.is_active && f.field_name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) throw new Error(`Field '${cleanName}' already exists.`);

    const fieldId = store.seq.fields++;
    const newField = {
      field_id: fieldId,
      dataset_id: Number(datasetId),
      field_name: cleanName,
      data_type: dataType || 'TEXT',
      is_active: true,
      created_at: new Date(),
    };
    store.dataset_fields.push(newField);
    return newField;
  },

  updateField: async (fieldId, { fieldName, dataType }) => {
    const field = store.dataset_fields.find((f) => f.field_id === Number(fieldId));
    if (!field) return null;
    if (fieldName) field.field_name = fieldName.trim();
    if (dataType) field.data_type = dataType;
    return field;
  },

  archiveField: async (fieldId) => {
    const field = store.dataset_fields.find((f) => f.field_id === Number(fieldId));
    if (!field) return null;
    field.is_active = false;
    return field;
  },

  addRule: async (fieldId, { ruleType, severity, ruleConfig }) => {
    const field = store.dataset_fields.find((f) => f.field_id === Number(fieldId));
    if (!field) throw new Error('Field not found');

    const ruleId = store.seq.rules++;
    const newRule = {
      rule_id: ruleId,
      field_id: Number(fieldId),
      rule_type: ruleType,
      severity: severity || 'MEDIUM',
      rule_config: ruleConfig || {},
      is_active: true,
      created_at: new Date(),
    };
    store.validation_rules.push(newRule);
    return newRule;
  },

  updateRule: async (ruleId, { ruleType, severity, ruleConfig }) => {
    const rule = store.validation_rules.find((r) => r.rule_id === Number(ruleId));
    if (!rule) return null;
    if (ruleType) rule.rule_type = ruleType;
    if (severity) rule.severity = severity;
    if (ruleConfig) rule.rule_config = ruleConfig;
    return rule;
  },

  deactivateRule: async (ruleId) => {
    const rule = store.validation_rules.find((r) => r.rule_id === Number(ruleId));
    if (!rule) return null;
    rule.is_active = false;
    return rule;
  },

  // ---------------------------------------------------------------------------
  // Advanced Database Features:
  // 1. Transactional CSV Validation
  // 2. Stored Procedure: recalculate_quality_score
  // 3. Trigger / Audit Log: audit_quality_issue_change
  // ---------------------------------------------------------------------------
  createValidationRunTransaction: async ({ datasetId, userId, totalRows, foundIssues }) => {
    const runId = store.seq.runs++;
    const now = new Date();

    const run = {
      run_id: runId,
      dataset_id: Number(datasetId),
      started_by: Number(userId),
      started_at: now,
      completed_at: now,
      status: 'COMPLETED',
      total_rows: totalRows,
      issue_count: foundIssues.length,
      failure_message: null,
    };
    store.validation_runs.push(run);

    // Save issues & invoke trigger logic
    for (const item of foundIssues) {
      const issueId = store.seq.issues++;
      const issue = {
        issue_id: issueId,
        run_id: runId,
        rule_id: item.ruleId,
        row_number: item.rowNumber,
        severity: item.severity,
        message: item.message,
        observed_value: item.observedValue || null,
        status: 'OPEN',
        created_at: now,
        resolved_at: null,
      };
      store.quality_issues.push(issue);

      // Trigger Simulation: trg_audit_quality_issue_change (INSERT)
      store.audit_logs.push({
        log_id: store.seq.audit++,
        actor_user_id: Number(userId),
        entity_type: 'QUALITY_ISSUE',
        entity_id: issueId,
        action: 'ISSUE_CREATED',
        old_values: null,
        new_values: { status: 'OPEN', run_id: runId, rule_id: item.ruleId },
        created_at: now,
      });
    }

    // Stored Procedure Simulation: recalculate_quality_score(p_run_id)
    const score = db.recalculateQualityScoreProcedure(runId);

    return {
      runId,
      datasetId: Number(datasetId),
      startedBy: Number(userId),
      status: 'COMPLETED',
      totalRows,
      issueCount: foundIssues.length,
      startedAt: now,
      completedAt: now,
      score,
    };
  },

  // Stored Procedure: recalculate_quality_score
  recalculateQualityScoreProcedure: (runId) => {
    const run = store.validation_runs.find((r) => r.run_id === Number(runId));
    if (!run) return null;

    const fields = store.dataset_fields.filter((f) => f.dataset_id === run.dataset_id && f.is_active);
    const fieldCount = fields.length;
    const totalCells = run.total_rows * fieldCount;

    const runIssues = store.quality_issues.filter((i) => i.run_id === Number(runId));
    const rules = store.validation_rules;

    let missingCells = 0;
    let duplicateCells = 0;
    let invalidCells = runIssues.length;

    for (const issue of runIssues) {
      const rule = rules.find((r) => r.rule_id === issue.rule_id);
      if (rule) {
        if (rule.rule_type === 'REQUIRED') missingCells++;
        if (rule.rule_type === 'UNIQUE') duplicateCells++;
      }
    }

    let completeness = 100;
    let validity = 100;
    let uniqueness = 100;

    if (totalCells > 0) {
      completeness = Math.max(0, Math.round((100.0 * (totalCells - Math.min(missingCells, totalCells))) / totalCells * 100) / 100);
      validity = Math.max(0, Math.round((100.0 * (totalCells - Math.min(invalidCells, totalCells))) / totalCells * 100) / 100);
      uniqueness = Math.max(0, Math.round((100.0 * (totalCells - Math.min(duplicateCells, totalCells))) / totalCells * 100) / 100);
    }

    const overall = Math.round(((completeness + validity + uniqueness) / 3.0) * 100) / 100;

    const scoreRecord = {
      score_id: store.seq.scores++,
      run_id: Number(runId),
      completeness_score: completeness,
      validity_score: validity,
      uniqueness_score: uniqueness,
      overall_score: overall,
      calculated_at: new Date(),
    };

    const existingIdx = store.quality_scores.findIndex((s) => s.run_id === Number(runId));
    if (existingIdx >= 0) {
      store.quality_scores[existingIdx] = scoreRecord;
    } else {
      store.quality_scores.push(scoreRecord);
    }

    return {
      completenessScore: completeness,
      validityScore: validity,
      uniquenessScore: uniqueness,
      overallScore: overall,
    };
  },

  getRunById: async (runId) => {
    const run = store.validation_runs.find((r) => r.run_id === Number(runId));
    if (!run) return null;
    const score = store.quality_scores.find((s) => s.run_id === run.run_id);
    return {
      runId: run.run_id,
      datasetId: run.dataset_id,
      startedBy: run.started_by,
      status: run.status,
      totalRows: run.total_rows,
      issueCount: run.issue_count,
      failureMessage: run.failure_message,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      score: score
        ? {
            completenessScore: Number(score.completeness_score),
            validityScore: Number(score.validity_score),
            uniquenessScore: Number(score.uniqueness_score),
            overallScore: Number(score.overall_score),
          }
        : null,
    };
  },

  getIssuesForRun: async (runId, { page = 0, size = 20, status, severity }) => {
    let list = store.quality_issues.filter((i) => i.run_id === Number(runId));
    if (status) list = list.filter((i) => i.status.toUpperCase() === status.toUpperCase());
    if (severity) list = list.filter((i) => i.severity.toUpperCase() === severity.toUpperCase());

    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const pageItems = list.slice(start, start + size);

    const content = pageItems.map((issue) => {
      const rule = store.validation_rules.find((r) => r.rule_id === issue.rule_id);
      const field = rule ? store.dataset_fields.find((f) => f.field_id === rule.field_id) : null;
      const resolutions = store.issue_resolutions
        .filter((res) => res.issue_id === issue.issue_id)
        .map((res) => ({
          resolutionId: res.resolution_id,
          resolvedByUserId: res.resolved_by_user_id,
          action: res.action,
          note: res.note,
          resolvedAt: res.resolved_at,
        }));

      return {
        issueId: issue.issue_id,
        runId: issue.run_id,
        ruleId: issue.rule_id,
        ruleType: rule ? rule.rule_type : 'UNKNOWN',
        fieldName: field ? field.field_name : 'Unknown',
        rowNumber: issue.row_number,
        severity: issue.severity,
        message: issue.message,
        observedValue: issue.observed_value,
        status: issue.status,
        createdAt: issue.created_at,
        resolvedAt: issue.resolved_at,
        resolutions,
      };
    });

    return {
      content,
      totalElements,
      totalPages,
      number: Number(page),
      size: Number(size),
    };
  },

  updateIssueStatus: async (issueId, { action, note }, userId) => {
    const issue = store.quality_issues.find((i) => i.issue_id === Number(issueId));
    if (!issue) return null;

    const oldStatus = issue.status;
    const newStatus = action === 'REOPENED' ? 'OPEN' : action === 'FIXED' ? 'RESOLVED' : 'WAIVED';
    const now = new Date();

    issue.status = newStatus;
    issue.resolved_at = newStatus === 'OPEN' ? null : now;

    // Record resolution
    const resolutionId = store.seq.resolutions++;
    store.issue_resolutions.push({
      resolution_id: resolutionId,
      issue_id: Number(issueId),
      resolved_by_user_id: Number(userId),
      action: action.toUpperCase(),
      note: note.trim(),
      resolved_at: now,
    });

    // Trigger Simulation: trg_audit_quality_issue_change (UPDATE)
    store.audit_logs.push({
      log_id: store.seq.audit++,
      actor_user_id: Number(userId),
      entity_type: 'QUALITY_ISSUE',
      entity_id: Number(issueId),
      action: 'ISSUE_STATUS_CHANGED',
      old_values: { status: oldStatus },
      new_values: { status: newStatus },
      created_at: now,
    });

    return issue;
  },

  // ---------------------------------------------------------------------------
  // View: dataset_quality_summary & Dashboard Aggregate Queries
  // ---------------------------------------------------------------------------
  getDashboardSummary: async (userId, role) => {
    let datasets = store.datasets.slice();
    if (role !== 'ADMIN') {
      datasets = datasets.filter((d) => d.owner_id === Number(userId));
    }

    const totalDatasets = datasets.filter((d) => d.status === 'ACTIVE').length;
    const completedRuns = store.validation_runs.filter((r) =>
      datasets.some((d) => d.dataset_id === r.dataset_id) && r.status === 'COMPLETED'
    ).length;

    // View calculation: dataset_quality_summary
    const summaryRows = datasets.map((d) => {
      const runs = store.validation_runs
        .filter((r) => r.dataset_id === d.dataset_id && r.status === 'COMPLETED')
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      const latestRun = runs[0] || null;
      const latestScore = latestRun ? store.quality_scores.find((s) => s.run_id === latestRun.run_id) : null;
      const openIssues = store.quality_issues.filter((i) =>
        runs.some((r) => r.run_id === i.run_id) && i.status === 'OPEN'
      ).length;

      return {
        datasetId: d.dataset_id,
        datasetName: d.dataset_name,
        datasetStatus: d.status,
        latestRunId: latestRun ? latestRun.run_id : null,
        latestOverallScore: latestScore ? Number(latestScore.overall_score) : null,
        openIssueCount: openIssues,
      };
    });

    const scores = summaryRows.filter((r) => r.latestOverallScore !== null).map((r) => r.latestOverallScore);
    const averageQualityScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
    const totalOpenIssues = summaryRows.reduce((acc, r) => acc + r.openIssueCount, 0);

    return {
      totalDatasets,
      completedRuns,
      averageQualityScore,
      openIssues: totalOpenIssues,
      datasets: summaryRows,
    };
  },

  getAdminOverview: async () => {
    const totalUsers = store.users.length;
    const totalRuns = store.validation_runs.length;
    const totalIssues = store.quality_issues.length;
    const recentAuditLogs = store.audit_logs.slice(-15).reverse();
    const dashboardSummary = await db.getDashboardSummary(1, 'ADMIN');

    return {
      totalUsers,
      ...dashboardSummary,
      totalRuns,
      totalIssues,
      users: await db.getAllUsers(),
      recentAuditLogs,
    };
  },
};
