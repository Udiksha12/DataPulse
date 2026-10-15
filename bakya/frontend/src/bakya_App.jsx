import React, { useEffect, useState } from 'react';
import { bakyaApi } from './bakya_api.js';
import BakyaDashboardPage from './bakya_DashboardPage.jsx';
import BakyaDatasetsPage from './bakya_DatasetsPage.jsx';
import BakyaLoginPage from './bakya_LoginPage.jsx';
import BakyaAdminPage from './bakya_AdminPage.jsx';
import BakyaRunDetailsPage from './bakya_RunDetailsPage.jsx';
import { Bakya24BAI0071ProjectIdentity } from './bakya_Identity.jsx';

export default function BakyaApp() {
  const [session, setSession] = useState(() => {
    const token = sessionStorage.getItem('datapulse_token');
    const user = sessionStorage.getItem('datapulse_user');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });
  const [page, setPage] = useState('dashboard');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState(null);
  const [openDatasetId, setOpenDatasetId] = useState(null);

  useEffect(() => {
    if (!session?.token) return;
    bakyaApi.me(session.token).then((user) => {
      sessionStorage.setItem('datapulse_user', JSON.stringify(user));
      setSession((current) => current ? { ...current, user } : current);
    }).catch(() => logout());
  }, []);

  async function login(credentials) {
    setLoading(true); setLoginError('');
    try {
      const result = await bakyaApi.login(credentials);
      sessionStorage.setItem('datapulse_token', result.token);
      sessionStorage.setItem('datapulse_user', JSON.stringify(result.user));
      setSession({ token: result.token, user: result.user });
      setPage('dashboard');
    } catch (error) { setLoginError(error.message); }
    finally { setLoading(false); }
  }

  async function logout() {
    if (session?.token) bakyaApi.logout(session.token).catch(() => {});
    sessionStorage.removeItem('datapulse_token');
    sessionStorage.removeItem('datapulse_user');
    setSession(null);
    setPage('dashboard');
  }

  if (!session) return <BakyaLoginPage onLogin={login} loading={loading} error={loginError} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark small-mark">DP</span><div><strong>DataPulse</strong><small>DATA QUALITY</small></div></div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={page === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => { setPage('dashboard'); setRunId(null); setOpenDatasetId(null); }}><span>◫</span>Overview</button>
          <button className={page === 'datasets' || page === 'run' ? 'nav-item active' : 'nav-item'} onClick={() => { setPage('datasets'); setRunId(null); }}><span>▤</span>Datasets</button>
          {session.user.role === 'ADMIN' && <button className={page === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('admin')}><span>⚙</span>Admin view</button>}
        </nav>
        <div className="sidebar-bottom"><div className="user-card"><div className="avatar">{session.user.fullName?.slice(0, 1) || 'U'}</div><div className="user-meta"><strong>{session.user.fullName}</strong><small>{session.user.role}</small></div><button className="logout-button" onClick={logout} title="Sign out" aria-label="Sign out">↗</button></div><Bakya24BAI0071ProjectIdentity /></div>
      </aside>
      <main className="main-content">
        {page === 'dashboard' && <BakyaDashboardPage token={session.token} onOpenDataset={(id) => { setOpenDatasetId(id); setPage('datasets'); setRunId(null); }} />}
        {page === 'datasets' && <BakyaDatasetsPage token={session.token} openDatasetId={openDatasetId} onDatasetOpened={() => setOpenDatasetId(null)} onSelectRun={(id) => { setRunId(id); setPage('run'); }} />}
        {page === 'admin' && session.user.role === 'ADMIN' && <BakyaAdminPage token={session.token} onOpenDataset={(id) => { setOpenDatasetId(id); setPage('datasets'); }} />}
        {page === 'run' && runId && <BakyaRunDetailsPage token={session.token} runId={runId} onBack={() => setPage('datasets')} />}
      </main>
    </div>
  );
}
