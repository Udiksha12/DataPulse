import React, { useState } from 'react';

export default function BakyaResolutionDialog({ issue, status, busy, error, onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const isResolve = status === 'RESOLVED';

  async function submit(event) {
    event.preventDefault();
    if (!note.trim()) return;
    const success = await onSubmit(note.trim());
    if (success) setSaved(true);
  }

  return (
    <div className="modal-backdrop resolution-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="resolution-dialog" role="dialog" aria-modal="true" aria-labelledby="resolution-title">
        {saved ? (
          <div className="resolution-success" role="status">
            <span className="resolution-success-icon" aria-hidden="true">✓</span>
            <p className="eyebrow">SUPPORT UPDATE</p>
            <h2 id="resolution-title">Issue {isResolve ? 'resolved' : 'reopened'}</h2>
            <p>Your note was saved. The development/production support team has been notified in the DataPulse Admin support feed.</p>
            <button className="button button-primary" type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="resolution-form" onSubmit={submit}>
            <div className="panel-heading">
              <div><p className="eyebrow">QUALITY ISSUE #{issue.issueId}</p><h2 id="resolution-title">{isResolve ? 'Resolve this issue' : 'Reopen this issue'}</h2></div>
              <button className="icon-button" type="button" onClick={onClose} aria-label="Close resolution dialog" disabled={busy}>×</button>
            </div>
            <div className="resolution-issue-summary"><strong>{issue.fieldName || 'Dataset field'} · Row {issue.rowNumber}</strong><span>{issue.message}</span></div>
            <label htmlFor="resolution-note">{isResolve ? 'Resolution note' : 'Reason for reopening'}</label>
            <textarea id="resolution-note" value={note} onChange={(event) => setNote(event.target.value)} required maxLength={2000} rows={4} placeholder={isResolve ? 'Describe what was corrected or why this issue is resolved…' : 'Explain why this issue needs another review…'} autoFocus />
            <p className="resolution-help">This note is saved to the issue history and included in the Admin support feed.</p>
            {error && <div role="alert" className="notice notice-error">{error}</div>}
            <div className="resolution-actions"><button className="button button-quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" type="submit" disabled={busy || !note.trim()}>{busy ? 'Saving…' : isResolve ? 'Save resolution' : 'Reopen issue'}</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
