import React, { useState } from 'react';

export default function BakyaLoginPage({ onLogin, loading, error }) {
  const [email, setEmail] = useState('bakya@datapulse.local');
  const [password, setPassword] = useState('');

  function submit(event) {
    event.preventDefault();
    onLogin({ email: email.trim(), password });
  }

  return (
    <main className="login-layout">
      <section className="login-story">
        <div className="brand-mark">DP</div>
        <p className="eyebrow">DATA QUALITY WORKSPACE</p>
        <h1>Trust the data behind every decision.</h1>
        <p className="story-copy">Define checks, run them against your datasets, and follow every issue through resolution.</p>
        <div className="story-stat"><strong>One clear view</strong><span>From data fields to quality scores</span></div>
      </section>
      <section className="login-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to DataPulse</h2>
        <p className="muted">Use the account configured by your project team.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" required minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p role="alert" className="notice notice-error">{error}</p>}
          <button className="button button-primary button-wide" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="login-footnote">Credentials are set in your local environment file. Don’t use real personal or institutional data in this demo.</p>
      </section>
    </main>
  );
}
