/**
 * DataPulse REST API Server & Vercel Serverless Function Entry Point
 * Authors:
 *  - Udiksha Agarwal (24BAI0086) - Lead Backend & Security
 *  - Bakya (24BAI0071) - Lead Frontend
 *  - Rudra (24BKT0125) - Lead Cloud Database
 * Course: BCSE302P Database Systems Lab | Slot: L25+L26
 * Faculty: Dr. V. SIVAKUMAR
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { db } from './db.js';
import { authService, requireAuth, requireAdmin } from './auth.js';
import { validateCsvBuffer } from './validationEngine.js';
import { printUdiksha24BAI0086Identity } from '../backend/identity/udiksha24BAI0086.js';
import { printBakya24BAI0071Identity } from '../backend/identity/bakya24BAI0071.js';
import { printRudra24BKT0125Identity } from '../backend/identity/rudra24BKT0125.js';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

app.use(cors());
app.use(express.json());

// Print Student Identities in console log per Mandatory Instruction 7
printUdiksha24BAI0086Identity();
printBakya24BAI0071Identity();
printRudra24BKT0125Identity();

// Helper router to mount on both /api and root
const router = express.Router();

// -----------------------------------------------------------------------------
// Health, Metrics & Student Identity Endpoints
// -----------------------------------------------------------------------------
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    database: db.isCloudConnected() ? 'Cloud PostgreSQL Connected' : 'In-Memory Relational Engine (3NF)',
    timestamp: new Date().toISOString(),
    course: 'BCSE302P Database Systems Lab',
    slot: 'L25+L26',
    faculty: 'Dr. V. SIVAKUMAR',
    contributors: {
      backend: 'Udiksha Agarwal (24BAI0086)',
      frontend: 'Bakya (24BAI0071)',
      database: 'Rudra (24BKT0125)',
    },
  });
});

// Prometheus Metrics Endpoint for Grafana / Prometheus (rubric requirement)
router.get('/metrics', async (req, res) => {
  const summary = await db.getDashboardSummary(1, 'ADMIN');
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(`
# HELP datapulse_total_datasets Total number of active institutional datasets
# TYPE datapulse_total_datasets gauge
datapulse_total_datasets ${summary.totalDatasets}

# HELP datapulse_completed_runs Total validation runs completed
# TYPE datapulse_completed_runs counter
datapulse_completed_runs ${summary.completedRuns}

# HELP datapulse_open_issues Total unresolved data-quality issues
# TYPE datapulse_open_issues gauge
datapulse_open_issues ${summary.openIssues}

# HELP datapulse_average_quality_score Mean quality score across active datasets
# TYPE datapulse_average_quality_score gauge
datapulse_average_quality_score ${summary.averageQualityScore || 0}
`.trim());
});

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/auth/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

// -----------------------------------------------------------------------------
// Dashboard & Admin Overview Endpoints
// -----------------------------------------------------------------------------
router.get('/dashboard/summary', requireAuth, async (req, res) => {
  try {
    const summary = await db.getDashboardSummary(req.user.userId, req.user.role);
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get('/admin/overview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const overview = await db.getAdminOverview();
    res.json(overview);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// -----------------------------------------------------------------------------
// Datasets CRUD Endpoints
// -----------------------------------------------------------------------------
router.get('/datasets', requireAuth, async (req, res) => {
  try {
    const { q, status } = req.query;
    const datasets = await db.getDatasets({
      userId: req.user.userId,
      role: req.user.role,
      search: q,
      status,
    });
    res.json(datasets);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post('/datasets', requireAuth, async (req, res) => {
  try {
    const { datasetName, description } = req.body;
    const created = await db.createDataset({
      datasetName,
      description,
      ownerId: req.user.userId,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get('/datasets/:id', requireAuth, async (req, res) => {
  try {
    const dataset = await db.getDatasetById(req.params.id, req.user.userId, req.user.role);
    if (!dataset) return res.status(404).json({ message: 'Dataset not found.' });
    res.json(dataset);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put('/datasets/:id', requireAuth, async (req, res) => {
  try {
    const updated = await db.updateDataset(req.params.id, req.body, req.user.userId, req.user.role);
    if (!updated) return res.status(404).json({ message: 'Dataset not found.' });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete('/datasets/:id', requireAuth, async (req, res) => {
  try {
    const archived = await db.archiveDataset(req.params.id, req.user.userId, req.user.role);
    if (!archived) return res.status(404).json({ message: 'Dataset not found.' });
    res.json(archived);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// -----------------------------------------------------------------------------
// Dataset Fields & Rules Endpoints
// -----------------------------------------------------------------------------
router.post('/datasets/:datasetId/fields', requireAuth, async (req, res) => {
  try {
    const { fieldName, dataType } = req.body;
    const field = await db.addField(req.params.datasetId, { fieldName, dataType }, req.user.userId, req.user.role);
    res.status(201).json(field);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put('/fields/:id', requireAuth, async (req, res) => {
  try {
    const updated = await db.updateField(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Field not found.' });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete('/fields/:id', requireAuth, async (req, res) => {
  try {
    const archived = await db.archiveField(req.params.id);
    if (!archived) return res.status(404).json({ message: 'Field not found.' });
    res.json(archived);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post('/fields/:fieldId/rules', requireAuth, async (req, res) => {
  try {
    const { ruleType, severity, ruleConfig } = req.body;
    const rule = await db.addRule(req.params.fieldId, { ruleType, severity, ruleConfig });
    res.status(201).json(rule);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put('/rules/:ruleId', requireAuth, async (req, res) => {
  try {
    const updated = await db.updateRule(req.params.ruleId, req.body);
    if (!updated) return res.status(404).json({ message: 'Rule not found.' });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete('/rules/:ruleId', requireAuth, async (req, res) => {
  try {
    const deactivated = await db.deactivateRule(req.params.ruleId);
    if (!deactivated) return res.status(404).json({ message: 'Rule not found.' });
    res.json(deactivated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// -----------------------------------------------------------------------------
// Validation Runs, CSV Execution & Scoring Endpoints
// -----------------------------------------------------------------------------
router.post('/datasets/:datasetId/runs', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Choose a CSV file to run validation.' });
    }

    const dataset = await db.getDatasetById(req.params.datasetId, req.user.userId, req.user.role);
    if (!dataset) return res.status(404).json({ message: 'Dataset not found.' });
    if (dataset.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Archived datasets cannot start new validation runs.' });
    }

    const activeFields = dataset.fields;
    if (activeFields.length === 0) {
      return res.status(400).json({ message: 'Add at least one dataset field before running validation.' });
    }

    const activeRules = [];
    for (const f of activeFields) {
      for (const r of f.rules) {
        if (r.isActive) activeRules.push(r);
      }
    }

    if (activeRules.length === 0) {
      return res.status(400).json({ message: 'Add at least one active validation rule before running validation.' });
    }

    // Run CSV Validation Engine
    const { totalRows, foundIssues } = validateCsvBuffer({
      csvBuffer: req.file.buffer,
      datasetFields: activeFields.map((f) => ({ field_id: f.fieldId, field_name: f.fieldName, data_type: f.dataType })),
      activeRules: activeRules.map((r) => ({
        rule_id: r.ruleId,
        field_id: r.fieldId,
        rule_type: r.ruleType,
        severity: r.severity,
        rule_config: r.ruleConfig,
      })),
    });

    // Execute Transaction: save run, issues, trigger audit, and execute stored procedure recalculate_quality_score
    const runResult = await db.createValidationRunTransaction({
      datasetId: dataset.datasetId,
      userId: req.user.userId,
      totalRows,
      foundIssues,
    });

    res.status(201).json(runResult);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
});

router.get('/runs/:runId', requireAuth, async (req, res) => {
  try {
    const run = await db.getRunById(req.params.runId);
    if (!run) return res.status(404).json({ message: 'Validation run not found.' });
    res.json(run);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get('/runs/:runId/issues', requireAuth, async (req, res) => {
  try {
    const { page, size, status, severity } = req.query;
    const issuesData = await db.getIssuesForRun(req.params.runId, { page, size, status, severity });
    res.json(issuesData);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.patch('/issues/:issueId/status', requireAuth, async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!action || !note || !note.trim()) {
      return res.status(400).json({ message: 'Action and resolution note are required.' });
    }
    const updated = await db.updateIssueStatus(req.params.issueId, { action, note }, req.user.userId);
    if (!updated) return res.status(404).json({ message: 'Issue not found.' });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Mount router on both /api and root / for flexible hosting
app.use('/api', router);
app.use('/', router);

export default app;
