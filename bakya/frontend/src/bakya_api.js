const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.message
      ? payload.message
      : `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.code;
    throw error;
  }
  return payload;
}

export const bakyaApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: (token) => request('/auth/me', { token }),
  logout: (token) => request('/auth/logout', { token, method: 'POST' }),
  dashboard: (token) => request('/dashboard/summary', { token }),
  adminOverview: (token) => request('/admin/overview', { token }),
  datasets: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/datasets${query ? `?${query}` : ''}`, { token });
  },
  dataset: (token, id) => request(`/datasets/${id}`, { token }),
  createDataset: (token, data) => request('/datasets', { token, method: 'POST', body: JSON.stringify(data) }),
  updateDataset: (token, id, data) => request(`/datasets/${id}`, { token, method: 'PUT', body: JSON.stringify(data) }),
  archiveDataset: (token, id) => request(`/datasets/${id}`, { token, method: 'DELETE' }),
  updateField: (token, id, data) => request(`/fields/${id}`, { token, method: 'PUT', body: JSON.stringify(data) }),
  archiveField: (token, id) => request(`/fields/${id}`, { token, method: 'DELETE' }),
  addField: (token, datasetId, data) => request(`/datasets/${datasetId}/fields`, { token, method: 'POST', body: JSON.stringify(data) }),
  addRule: (token, fieldId, data) => request(`/fields/${fieldId}/rules`, { token, method: 'POST', body: JSON.stringify(data) }),
  updateRule: (token, ruleId, data) => request(`/rules/${ruleId}`, { token, method: 'PUT', body: JSON.stringify(data) }),
  deactivateRule: (token, ruleId) => request(`/rules/${ruleId}`, { token, method: 'DELETE' }),
  createRun: (token, datasetId, file) => {
    const body = new FormData();
    body.append('file', file);
    return request(`/datasets/${datasetId}/runs`, { token, method: 'POST', body });
  },
  run: (token, runId) => request(`/runs/${runId}`, { token }),
  issues: (token, runId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/runs/${runId}/issues${query ? `?${query}` : ''}`, { token });
  },
  updateIssue: (token, issueId, data) => request(`/issues/${issueId}/status`, { token, method: 'PATCH', body: JSON.stringify(data) }),
};
