/**
 * DataPulse Automated Test Suite
 * Industry Best Practice: Automated Integration & Unit Testing
 * Contributors: Udiksha Agarwal (24BAI0086), Bakya (24BAI0071), Rudra (24BKT0125)
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../api/index.js';

describe('DataPulse API Integration Test Suite', () => {
  let server;
  let baseUrl;
  let adminToken;
  let analystToken;
  let createdDatasetId;
  let sampleFieldId;
  let sampleRuleId;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  test('1. Health check returns 200 and mandatory student identities', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'UP');
    assert.equal(data.course, 'BCSE302P Database Systems Lab');
    assert.match(data.contributors.backend, /24BAI0086/);
    assert.match(data.contributors.frontend, /24BAI0071/);
    assert.match(data.contributors.database, /24BKT0125/);
  });

  test('2. Prometheus metrics endpoint returns scrapeable metrics', async () => {
    const res = await fetch(`${baseUrl}/metrics`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /datapulse_total_datasets/);
    assert.match(text, /datapulse_completed_runs/);
    assert.match(text, /datapulse_open_issues/);
  });

  test('3. Login with invalid password returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'udiksha@datapulse.local', password: 'WrongPassword' }),
    });
    assert.equal(res.status, 401);
  });

  test('4. Login as Admin returns valid JWT and ADMIN role', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'udiksha@datapulse.local', password: 'Udiksha@DataPulse2026' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'ADMIN');
    adminToken = data.token;
  });

  test('5. Login as Analyst returns valid JWT and ANALYST role', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bakya@datapulse.local', password: 'Bakya@DataPulse2026' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'ANALYST');
    analystToken = data.token;
  });

  test('6. Login as Rudra returns valid JWT and ANALYST role', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rudra@datapulse.local', password: 'Rudra@DataPulse2026' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'ANALYST');
  });

  test('7. RBAC Verification: Analyst cannot access Admin Overview (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert.equal(res.status, 403);
  });

  test('8. RBAC Verification: Admin can access Admin Overview', async () => {
    const res = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.totalUsers >= 3);
    assert.ok(Array.isArray(data.users));
  });

  test('9. Analyst creates a new dataset', async () => {
    const res = await fetch(`${baseUrl}/datasets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify({
        datasetName: 'Automated Lab Test Dataset 2026',
        description: 'Test dataset created during integration tests',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.dataset_name, 'Automated Lab Test Dataset 2026');
    createdDatasetId = data.dataset_id;
  });

  test('10. Analyst adds a field and validation rule to the dataset', async () => {
    const fieldRes = await fetch(`${baseUrl}/datasets/${createdDatasetId}/fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify({
        fieldName: 'student_id',
        dataType: 'TEXT',
      }),
    });
    assert.equal(fieldRes.status, 201);
    const fieldData = await fieldRes.json();
    sampleFieldId = fieldData.field_id;

    const ruleRes = await fetch(`${baseUrl}/fields/${sampleFieldId}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify({
        ruleType: 'REQUIRED',
        severity: 'HIGH',
      }),
    });
    assert.equal(ruleRes.status, 201);
    const ruleData = await ruleRes.json();
    sampleRuleId = ruleData.rule_id;
  });

  test('11. CSV Validation Run executes transaction, procedure and trigger', async () => {
    const csvContent = 'record_id,email,attendance_pct,department\nREC-001,alice@vit.ac.in,95,CSE\nREC-002,bademail,150,ECE';
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="test.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${csvContent}\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${baseUrl}/datasets/1/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analystToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    assert.equal(res.status, 201);
    const run = await res.json();
    assert.equal(run.status, 'COMPLETED');
    assert.equal(run.totalRows, 2);
    assert.ok(run.score !== null);
    assert.ok(run.score.overallScore <= 100);
    assert.ok(run.score.completenessScore <= 100);

    // Fetch issues for this run
    const issuesRes = await fetch(`${baseUrl}/runs/${run.runId}/issues`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert.equal(issuesRes.status, 200);
    const issues = await issuesRes.json();
    assert.ok(issues.totalElements > 0);
  });
});
