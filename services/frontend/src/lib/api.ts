// API base resolution: prefer build-time VITE_API_BASE but fall back to relative paths for proxy
const rawBase = (import.meta as any).env?.VITE_API_BASE || '';
function normalizeBase(b: string){
  if(!b) return '';
  // If baked-in value references internal docker hostname, drop to relative so browser can use nginx proxy
  if(b.includes('backend:')) return '';
  return b.replace(/\/$/, '');
}
export const API_BASE = normalizeBase(rawBase);

let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(options.headers as any || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers, ...options });
  if (!res.ok) {
    throw new Error(`Request failed ${res.status}`);
  }
  return res.json();
}

export const api = {
  me: () => request('/api/auth/me'),
  pipelines: {
    list: () => request('/api/v1/pipelines'),
  },
  aiSql: (q: string) => request('/api/v1/ai-sql', { method: 'POST', body: JSON.stringify({ q }) }),
  metadata: {
    tables: (limit = 25, page = 1) => request(`/openmetadata/api/v1/tables?limit=${limit}&offset=${(page-1)*limit}`),
  }
};
