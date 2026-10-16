import React, { useEffect, useState } from 'react';
import { bakyaApi } from './bakya_api.js';

function scoreTone(score) {
  if (score == null) return 'score-neutral';
  if (score >= 90) return 'score-good';
  if (score >= 70) return 'score-warn';
  return 'score-low';
}

export default function BakyaDashboardPage({ token, onOpenDataset }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    bakyaApi.dashboard(token).then(setSummary).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div role="alert" className="notice notice-error">{error}</div>;
  if (!summary) return <div className="loading-state">Loading your workspace…</div>;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><p className="eyebrow">OVERVIEW</p><h1>Your data at a glance</h1><p className="muted">Review the latest quality results and open issues.</p></div>
        <span className="live-pill"><i /> Workspace ready</span>
      </div>
      <section className="metric-grid">
        <article className="metric-card"><span className="metric-label">Datasets</span><strong>{summary.datasetCount}</strong><small>Registered in your workspace</small></article>
        <article className="metric-card"><span className="metric-label">Open issues</span><strong>{summary.openIssueCount}</strong><small>Need review or resolution</small></article>
        <article className="metric-card"><span className="metric-label">Average quality</span><strong>{Number(summary.averageScore || 0).toFixed(1)}<em>/100</em></strong><small>Across completed runs</small></article>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h2>Dataset health</h2><p className="muted">Most recent completed run for each dataset</p></div><span className="count-tag">{summary.datasets?.length || 0} total</span></div>
        {!summary.datasets?.length ? <div className="empty-state"><span className="empty-icon">＋</span><h3>No datasets yet</h3><p>Create a dataset and add field rules to start your first validation run.</p></div> : (
          <div className="table-scroll"><table><thead><tr><th>Dataset</th><th>Status</th><th>Latest score</th><th>Open issues</th><th /></tr></thead>
            <tbody>{summary.datasets.map((dataset) => <tr key={dataset.datasetId}>
              <td><strong>{dataset.datasetName}</strong><small className="table-sub">ID {dataset.datasetId}</small></td>
              <td><span className={`status-pill ${dataset.status === 'ACTIVE' ? 'status-active' : 'status-archived'}`}>{dataset.status}</span></td>
              <td><span className={`score-chip ${scoreTone(dataset.latestOverallScore)}`}>{dataset.latestOverallScore == null ? 'No run' : `${Number(dataset.latestOverallScore).toFixed(1)}%`}</span></td>
              <td>{dataset.openIssueCount}</td>
              <td><button className="text-button" onClick={() => onOpenDataset(dataset.datasetId)}>Open →</button></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
      <p className="small-note">Scores summarize explicit validation rules. Review the issue list before relying on a dataset.</p>
    </div>
  );
}
