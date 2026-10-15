import React, { useEffect, useState } from 'react';
import { bakyaApi } from './bakya_api.js';

export default function BakyaAdminPage({ token, onOpenDataset }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    bakyaApi.adminOverview(token).then(setSummary).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div role="alert" className="notice notice-error">{error}</div>;
  if (!summary) return <div className="loading-state">Loading administration overview…</div>;
  const supportUpdates = (summary.recentAuditLogs || [])
    .filter((log) => log.action === 'SUPPORT_TEAM_NOTIFIED')
    .map((log) => ({
      ...log,
      logId: log.logId ?? log.log_id,
      entityId: log.entityId ?? log.entity_id,
      actorUserId: log.actorUserId ?? log.actor_user_id,
      newValues: log.newValues ?? log.new_values,
      createdAt: log.createdAt ?? log.created_at,
    }));

  return (
    <div className="page-stack">
      <div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Workspace oversight</h1><p className="muted">Admin access includes every team dataset and its latest quality status.</p></div><span className="status-pill status-active">ADMIN</span></div>
      <section className="metric-grid">
        <article className="metric-card"><span className="metric-label">All datasets</span><strong>{summary.totalDatasets ?? 0}</strong><small>Across the workspace</small></article>
        <article className="metric-card"><span className="metric-label">Open issues</span><strong>{summary.openIssues ?? 0}</strong><small>Across all datasets</small></article>
        <article className="metric-card"><span className="metric-label">Average quality</span><strong>{summary.averageQualityScore == null ? '—' : Number(summary.averageQualityScore).toFixed(1)}<em>/100</em></strong><small>{summary.completedRuns ? 'Completed validation runs' : 'Run a validation to see a score'}</small></article>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>All datasets</h2><p className="muted">Open a dataset to review its fields and validation setup.</p></div><span className="count-tag">{summary.datasets?.length || 0} shown</span></div>
        <div className="table-scroll"><table><thead><tr><th>Dataset</th><th>Status</th><th>Latest score</th><th>Open issues</th><th /></tr></thead><tbody>{summary.datasets?.map((dataset) => <tr key={dataset.datasetId}>
          <td><strong>{dataset.datasetName}</strong><small className="table-sub">ID {dataset.datasetId}</small></td>
          <td><span className={`status-pill ${dataset.datasetStatus === 'ACTIVE' ? 'status-active' : 'status-archived'}`}>{dataset.datasetStatus}</span></td>
          <td>{dataset.latestOverallScore == null ? 'No run' : `${Number(dataset.latestOverallScore).toFixed(1)}%`}</td><td>{dataset.openIssueCount}</td>
          <td><button className="text-button" onClick={() => onOpenDataset(dataset.datasetId)}>Open →</button></td>
        </tr>)}</tbody></table></div>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Development & production support</h2><p className="muted">In-app notifications created when an issue is resolved or reopened.</p></div><span className="count-tag">{supportUpdates.length} recent</span></div>
        {!supportUpdates.length ? <div className="empty-state"><h3>No support updates yet</h3><p>Issue-resolution notes will appear here for the support team.</p></div> : <div className="support-update-list">{supportUpdates.map((log) => <article className="support-update" key={log.logId}><div className="support-update-head"><strong>Issue #{log.entityId} · {log.newValues?.status || 'Updated'}</strong><time>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</time></div><p>{log.newValues?.note || 'Issue status updated.'}</p><small>Notified in DataPulse · actor user #{log.actorUserId ?? 'system'}</small></article>)}</div>}
      </section>
    </div>
  );
}
