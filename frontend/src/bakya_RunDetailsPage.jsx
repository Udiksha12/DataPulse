import React, { useEffect, useState } from 'react';
import { bakyaApi } from './bakya_api.js';

const PAGE_SIZE = 10;

export default function BakyaRunDetailsPage({ token, runId, onBack }) {
  const [run, setRun] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [runResult, issuesResult] = await Promise.all([
        bakyaApi.run(token, runId),
        bakyaApi.issues(token, runId, { page, size: PAGE_SIZE }),
      ]);
      setRun(runResult);
      setPageData(issuesResult);
      setError('');
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, [token, runId, page]);

  async function changeStatus(issue, status) {
    const note = window.prompt(status === 'RESOLVED' ? 'Briefly describe the resolution:' : 'Why are you changing this issue?');
    if (!note?.trim()) return;
    try {
      await bakyaApi.updateIssue(token, issue.issueId, { status, note: note.trim() });
      await load();
    } catch (err) { setError(err.message); }
  }

  if (error && !run) return <div className="page-stack"><button className="button button-quiet" onClick={onBack}>← Back</button><div role="alert" className="notice notice-error">{error}</div></div>;
  if (!run || !pageData) return <div className="loading-state">Loading validation run…</div>;

  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">VALIDATION RUN / {run.runId}</p><h1>{run.datasetName}</h1><p className="muted">Started {new Date(run.startedAt).toLocaleString()} · {run.totalRows} rows · {run.issueCount} issues</p></div><button className="button button-quiet" onClick={onBack}>← Back to datasets</button></div>
    {error && <div role="alert" className="notice notice-error">{error}</div>}
    <section className="metric-grid"><article className="metric-card"><span className="metric-label">Overall quality</span><strong>{run.score ? <>{Number(run.score.overallScore).toFixed(1)}<em>/100</em></> : '—'}</strong><small>Completed {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'in progress'}</small></article><article className="metric-card"><span className="metric-label">Rows checked</span><strong>{run.totalRows}</strong><small>CSV data records</small></article><article className="metric-card"><span className="metric-label">Open issues</span><strong>{pageData.content.filter((issue) => issue.status === 'OPEN').length}</strong><small>{run.issueCount} total issues across all pages</small></article></section>
    <section className="panel"><div className="panel-heading"><div><h2>Validation issues</h2><p className="muted">Resolution actions are recorded in the audit history.</p></div><span className="count-tag">{pageData.totalElements} issues</span></div>
      {!pageData.content.length ? <div className="empty-state"><h3>No issues found</h3><p>This run passed every configured check.</p></div> : <div className="table-scroll"><table><thead><tr><th>Row</th><th>Field</th><th>Severity</th><th>Issue</th><th>Observed value</th><th>Status</th><th>Action</th></tr></thead><tbody>{pageData.content.map((issue) => <tr key={issue.issueId}>
        <td>{issue.rowNumber}</td><td>{issue.fieldName}</td><td><span className={`severity severity-${issue.severity.toLowerCase()}`}>{issue.severity}</span></td><td>{issue.message}</td><td>{issue.observedValue || '—'}</td><td><span className={`status-pill ${issue.status === 'OPEN' ? 'status-open' : 'status-done'}`}>{issue.status}</span></td><td>{issue.status === 'OPEN' ? <button className="text-button" onClick={() => changeStatus(issue, 'RESOLVED')}>Resolve</button> : <button className="text-button" onClick={() => changeStatus(issue, 'OPEN')}>Reopen</button>}</td>
      </tr>)}</tbody></table></div>}
      <div className="pagination"><span>Page {pageData.page + 1} of {Math.max(pageData.totalPages, 1)}</span><div><button className="button button-quiet" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><button className="button button-quiet" disabled={page + 1 >= pageData.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
    </section>
  </div>;
}
