import React, { useCallback, useEffect, useState } from 'react';
import { bakyaApi } from './bakya_api.js';

const INITIAL_PAGE_SIZE = 8;

export default function BakyaDatasetsPage({ token, openDatasetId, onDatasetOpened, onSelectRun }) {
  const [pageData, setPageData] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await bakyaApi.datasets(token, { page, size: INITIAL_PAGE_SIZE, q: query, status });
      setPageData(result);
      setError('');
    } catch (err) { setError(err.message); }
  }, [token, page, query, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected || !pageData) return;
    const fresh = pageData.content.find((item) => item.datasetId === selected.datasetId);
    if (fresh && JSON.stringify(fresh) !== JSON.stringify(selected)) setSelected(fresh);
  }, [pageData, selected]);

  useEffect(() => {
    if (!openDatasetId) return;
    bakyaApi.dataset(token, openDatasetId).then((target) => {
      setSelected(target); onDatasetOpened?.();
    }).catch((err) => setError(err.message));
  }, [token, openDatasetId, onDatasetOpened]);

  async function createDataset(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const dataset = await bakyaApi.createDataset(token, { datasetName: form.get('datasetName'), description: form.get('description') });
      setCreateOpen(false);
      setSelected(dataset);
      setQuery(''); setStatus('');
      setPage(0);
      const refreshed = await bakyaApi.datasets(token, { page: 0, size: INITIAL_PAGE_SIZE });
      setPageData(refreshed);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function archive(dataset) {
    if (!window.confirm(`Archive “${dataset.datasetName}”? Its run history will stay available.`)) return;
    try { await bakyaApi.archiveDataset(token, dataset.datasetId); setSelected(null); await load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><p className="eyebrow">DATA CATALOG</p><h1>Datasets</h1><p className="muted">Define fields and validation rules, then run a CSV check.</p></div>
        <button className="button button-primary" onClick={() => setCreateOpen((value) => !value)}>＋ New dataset</button>
      </div>
      {error && <div role="alert" className="notice notice-error">{error}</div>}
      {createOpen && <section className="panel form-panel"><div className="panel-heading"><div><h2>Create dataset</h2><p className="muted">Start with a clear name; you can add fields next.</p></div><button className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close">×</button></div>
        <form className="inline-form" onSubmit={createDataset}><label>Dataset name<input name="datasetName" required maxLength="160" placeholder="e.g. Department attendance" /></label><label>Description<input name="description" maxLength="2000" placeholder="What is this dataset used for?" /></label><button className="button button-primary" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button></form>
      </section>}
      <section className="panel">
        <div className="toolbar"><label className="search-control"><span>⌕</span><input value={query} onChange={(event) => { setPage(0); setQuery(event.target.value); }} placeholder="Search datasets" aria-label="Search datasets" /></label><select value={status} onChange={(event) => { setPage(0); setStatus(event.target.value); }} aria-label="Filter by status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select><span className="count-tag">{pageData?.totalElements ?? '…'} datasets</span></div>
        {!pageData ? <div className="loading-state">Loading datasets…</div> : pageData.content.length === 0 ? <div className="empty-state"><span className="empty-icon">⌕</span><h3>No matching datasets</h3><p>Try another search or create a dataset.</p></div> : (
          <div className="table-scroll"><table><thead><tr><th>Dataset</th><th>Fields</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>
            {pageData.content.map((dataset) => <tr key={dataset.datasetId}>
              <td><button className="table-link" onClick={() => setSelected(dataset)}>{dataset.datasetName}</button><small className="table-sub">{dataset.description || `Dataset ${dataset.datasetId}`}</small></td>
              <td>{dataset.fields?.length || 0}</td><td><span className={`status-pill ${dataset.status === 'ACTIVE' ? 'status-active' : 'status-archived'}`}>{dataset.status}</span></td>
              <td>{dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : '—'}</td>
              <td className="row-actions"><button className="text-button" onClick={() => setSelected(dataset)}>Configure</button>{dataset.status === 'ACTIVE' && <button className="text-button danger-text" onClick={() => archive(dataset)}>Archive</button>}</td>
            </tr>)}
          </tbody></table></div>
        )}
        <div className="pagination"><span>Page {(pageData?.page ?? page) + 1} of {Math.max(pageData?.totalPages ?? 1, 1)}</span><div><button className="button button-quiet" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><button className="button button-quiet" disabled={!pageData || page + 1 >= pageData.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
      </section>
      {selected && <BakyaDatasetWorkspace token={token} initialDataset={selected} onClose={() => setSelected(null)} onReload={load} onSelectRun={onSelectRun} />}
    </div>
  );
}

function BakyaDatasetWorkspace({ token, initialDataset, onClose, onReload, onSelectRun }) {
  const [dataset, setDataset] = useState(initialDataset);
  const [fieldName, setFieldName] = useState('');
  const [dataType, setDataType] = useState('TEXT');
  const [fieldRule, setFieldRule] = useState({});
  const [newRuleType, setNewRuleType] = useState('REQUIRED');
  const [editName, setEditName] = useState(initialDataset.datasetName);
  const [editDescription, setEditDescription] = useState(initialDataset.description || '');
  const [ruleFieldId, setRuleFieldId] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    bakyaApi.dataset(token, initialDataset.datasetId).then((fresh) => {
      setDataset(fresh); setEditName(fresh.datasetName); setEditDescription(fresh.description || '');
    }).catch((err) => setError(err.message));
  }, [token, initialDataset.datasetId]);

  async function submitField(event) {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const created = await bakyaApi.addField(token, dataset.datasetId, { fieldName, dataType });
      const ruleType = fieldRule.type;
      if (ruleType) {
        const ruleConfig = ruleType === 'RANGE' ? { min: Number(fieldRule.min), max: Number(fieldRule.max) } : {};
        await bakyaApi.addRule(token, created.fieldId, { ruleType, severity: fieldRule.severity || 'MEDIUM', ruleConfig });
      }
      setFieldName(''); setFieldRule({});
      await refreshDataset();
      setMessage('Field saved.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function saveDataset(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      await bakyaApi.updateDataset(token, dataset.datasetId, { datasetName: editName, description: editDescription });
      await refreshDataset(); await onReload(); setMessage('Dataset details updated.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function renameField(field) {
    const fieldName = window.prompt('Field name', field.fieldName);
    if (!fieldName?.trim() || fieldName.trim() === field.fieldName) return;
    try {
      await bakyaApi.updateField(token, field.fieldId, { fieldName: fieldName.trim(), dataType: field.dataType });
      await refreshDataset(); setMessage('Field updated.');
    } catch (err) { setError(err.message); }
  }

  async function archiveField(field) {
    if (!window.confirm(`Archive field “${field.fieldName}”? Past validation history will be retained.`)) return;
    try { await bakyaApi.archiveField(token, field.fieldId); await refreshDataset(); setMessage('Field archived.'); }
    catch (err) { setError(err.message); }
  }

  async function addRuleToField(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ruleType = form.get('ruleType');
    const ruleConfig = ruleType === 'RANGE' ? { min: Number(form.get('min')), max: Number(form.get('max')) } : {};
    try {
      await bakyaApi.addRule(token, ruleFieldId, { ruleType, severity: form.get('severity'), ruleConfig });
      setRuleFieldId(null); await refreshDataset(); setMessage('Rule added.');
    } catch (err) { setError(err.message); }
  }

  async function deactivateRule(rule) {
    if (!window.confirm(`Disable the ${rule.ruleType} rule? Existing run history will remain.`)) return;
    try { await bakyaApi.deactivateRule(token, rule.ruleId); await refreshDataset(); setMessage('Rule disabled.'); }
    catch (err) { setError(err.message); }
  }

  async function submitRun(event) {
    event.preventDefault();
    const file = event.currentTarget.elements.file.files[0];
    if (!file) { setError('Choose a CSV file first.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const result = await bakyaApi.createRun(token, dataset.datasetId, file);
      setRunResult(result);
      setMessage(`Run ${result.runId} completed with ${result.issueCount} issue(s).`);
      await onReload();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function resolveIssue(issue, status) {
    const note = window.prompt(status === 'RESOLVED' ? 'Briefly describe the resolution:' : 'Why are you changing this issue?');
    if (!note?.trim()) return;
    try {
      await bakyaApi.updateIssue(token, issue.issueId, { status, note: note.trim() });
      const updated = await bakyaApi.run(token, issue.runId);
      setRunResult(updated);
      await onReload();
    } catch (err) { setError(err.message); }
  }

  async function refreshDataset() {
    const fresh = await bakyaApi.dataset(token, dataset.datasetId);
    setDataset(fresh); setEditName(fresh.datasetName); setEditDescription(fresh.description || '');
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="dataset-title">
        <div className="panel-heading modal-title"><div><p className="eyebrow">DATASET WORKSPACE</p><h2 id="dataset-title">{dataset.datasetName}</h2><p className="muted">Configure fields, rules, and validation runs.</p></div><button className="icon-button" onClick={onClose} aria-label="Close dataset workspace">×</button></div>
        {error && <div role="alert" className="notice notice-error">{error}</div>}{message && <div className="notice notice-success">{message}</div>}
        <section className="sub-panel dataset-edit-panel"><div className="panel-heading"><div><h3>Dataset details</h3><p className="muted">Edit the name or description.</p></div></div><form className="inline-form" onSubmit={saveDataset}><label>Dataset name<input required maxLength="160" value={editName} onChange={(event) => setEditName(event.target.value)} /></label><label>Description<input maxLength="2000" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label><button className="button button-quiet" disabled={saving}>Save</button></form></section>
        <div className="workspace-grid">
          <section className="sub-panel"><div className="panel-heading"><div><h3>Fields & rules</h3><p className="muted">Rules run against each uploaded row.</p></div></div>
            {!dataset.fields?.length ? <p className="small-note">Add fields that match the CSV header names.</p> : <div className="field-list">{dataset.fields.map((field) => <article className="field-card" key={field.fieldId}>
              <div><strong>{field.fieldName}</strong><span className="type-label">{field.dataType}</span><span className={`status-pill ${field.active ? 'status-active' : 'status-archived'}`}>{field.active ? 'ACTIVE' : 'ARCHIVED'}</span></div>
              {field.rules?.filter((rule) => rule.active).length > 0 && <ul>{field.rules.filter((rule) => rule.active).map((rule) => <li key={rule.ruleId}>{rule.ruleType}{rule.ruleType === 'RANGE' ? ` ${rule.ruleConfig?.min}–${rule.ruleConfig?.max}` : ''}<span>{rule.severity.toLowerCase()}</span><button className="text-button danger-text" type="button" onClick={() => deactivateRule(rule)}>Disable</button></li>)}</ul>}
              {field.active && <div className="field-actions"><button className="text-button" type="button" onClick={() => renameField(field)}>Rename</button><button className="text-button" type="button" onClick={() => setRuleFieldId(ruleFieldId === field.fieldId ? null : field.fieldId)}>Add rule</button><button className="text-button danger-text" type="button" onClick={() => archiveField(field)}>Archive field</button></div>}
              {ruleFieldId === field.fieldId && <form className="form-stack compact-form" onSubmit={addRuleToField}><label>Rule<select name="ruleType" value={newRuleType} onChange={(event) => setNewRuleType(event.target.value)}><option value="REQUIRED">Required</option><option value="UNIQUE">Unique</option><option value="EMAIL">Email format</option><option value="RANGE">Number range</option><option value="TYPE">Field data type</option></select></label>{newRuleType === 'RANGE' && <div className="two-inputs"><label>Minimum<input name="min" type="number" step="any" required /></label><label>Maximum<input name="max" type="number" step="any" required /></label></div>}<label>Severity<select name="severity"><option>MEDIUM</option><option>LOW</option><option>HIGH</option></select></label><button className="button button-quiet">Save rule</button></form>}
            </article>)}</div>}
            <form className="form-stack compact-form" onSubmit={submitField}>
              <label>Field name<input required maxLength="120" value={fieldName} onChange={(event) => setFieldName(event.target.value)} placeholder="e.g. attendance_pct" /></label>
              <label>Data type<select value={dataType} onChange={(event) => setDataType(event.target.value)}><option>TEXT</option><option>INTEGER</option><option>DECIMAL</option><option>DATE</option><option>BOOLEAN</option></select></label>
              <label>Validation rule<select value={fieldRule.type || ''} onChange={(event) => setFieldRule({ type: event.target.value, severity: 'MEDIUM' })}><option value="">No initial rule</option><option value="REQUIRED">Required</option><option value="UNIQUE">Unique</option><option value="EMAIL">Email format</option><option value="RANGE">Number range</option><option value="TYPE">Field data type</option></select></label>
              {fieldRule.type === 'RANGE' && <div className="two-inputs"><label>Minimum<input type="number" step="any" required value={fieldRule.min ?? ''} onChange={(event) => setFieldRule((value) => ({ ...value, min: event.target.value }))} /></label><label>Maximum<input type="number" step="any" required value={fieldRule.max ?? ''} onChange={(event) => setFieldRule((value) => ({ ...value, max: event.target.value }))} /></label></div>}
              {fieldRule.type && <label>Severity<select value={fieldRule.severity || 'MEDIUM'} onChange={(event) => setFieldRule((value) => ({ ...value, severity: event.target.value }))}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>}
              <button className="button button-secondary" disabled={saving}>Add field{fieldRule.type ? ' and rule' : ''}</button>
            </form>
          </section>
          <section className="sub-panel"><div className="panel-heading"><div><h3>Run validation</h3><p className="muted">CSV only, up to 5 MB and 5,000 rows.</p></div></div>
            <form className="form-stack" onSubmit={submitRun}><label>Choose CSV file<input name="file" type="file" accept=".csv,text/csv" required /></label><p className="small-note">Headers must match the configured field names. The file is processed for this run and its raw rows are not stored.</p><button className="button button-primary" disabled={saving}>{saving ? 'Validating…' : 'Run checks'}</button></form>
            {runResult && <div className="run-summary"><div className="run-score"><span>Overall score</span><strong>{runResult.score ? `${Number(runResult.score.overallScore).toFixed(1)}%` : '—'}</strong></div><div><span className="metric-label">Rows</span><strong>{runResult.totalRows}</strong></div><div><span className="metric-label">Issues</span><strong>{runResult.issueCount}</strong></div><button className="text-button" onClick={() => onSelectRun(runResult.runId)}>Open full run →</button></div>}
          </section>
        </div>
        {runResult?.issues?.length > 0 && <section className="sub-panel issue-panel"><div className="panel-heading"><div><h3>Latest issues</h3><p className="muted">First 100 issues from this run.</p></div></div><IssueTable issues={runResult.issues} onResolve={resolveIssue} /></section>}
      </section>
    </div>
  );
}

function IssueTable({ issues, onResolve }) {
  return <div className="table-scroll"><table><thead><tr><th>Row</th><th>Field</th><th>Severity</th><th>Issue</th><th>Observed</th><th>Status</th><th /></tr></thead><tbody>{issues.map((issue) => <tr key={issue.issueId}>
    <td>{issue.rowNumber}</td><td>{issue.fieldName}</td><td><span className={`severity severity-${issue.severity.toLowerCase()}`}>{issue.severity}</span></td><td>{issue.message}</td><td className="observed-value">{issue.observedValue || '—'}</td><td><span className={`status-pill ${issue.status === 'OPEN' ? 'status-open' : 'status-done'}`}>{issue.status}</span></td><td>{issue.status === 'OPEN' && <button className="text-button" onClick={() => onResolve(issue, 'RESOLVED')}>Resolve</button>}{issue.status === 'RESOLVED' && <button className="text-button" onClick={() => onResolve(issue, 'OPEN')}>Reopen</button>}</td>
  </tr>)}</tbody></table></div>;
}
