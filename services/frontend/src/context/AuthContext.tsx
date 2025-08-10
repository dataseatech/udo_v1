import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAuthToken, API_BASE } from '../lib/api';

interface User { id?: string; name?: string; email?: string; preferred_username?: string; }
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  setToken: (t: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let existing = sessionStorage.getItem('access_token');
    if(existing){
      setAuthToken(existing);
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    async function bootstrap(){
      try {
        setLoading(true);
        if(code){
          // If a code is present, prefer exchanging it and overwrite any stale token
          if(existing){
            sessionStorage.removeItem('access_token');
            setAuthToken(null);
            existing = null;
          }
          // Exchange code
          const redirectUri = window.location.origin;
          const r = await fetch(`${API_BASE}/api/auth/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`);
            if(r.ok){
              const data = await r.json();
              if(data.access_token){
                sessionStorage.setItem('access_token', data.access_token);
                setAuthToken(data.access_token);
                // Replace URL to remove code param
                const url = new URL(window.location.href);
                url.searchParams.delete('code');
                window.history.replaceState({}, '', url.toString());
              }
            }
        }
        // Attempt to fetch user if we have token
        if(sessionStorage.getItem('access_token')){
          try {
            const me = await api.me() as any as User;
            setUser(me);
          } catch {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  function login(){
    const base = API_BASE || '';
    const redirect = window.location.origin;
    // Force correct client id and redirect for reliability
    window.location.href = `${base}/api/auth/start-login?client_id=udo&redirect_uri=${encodeURIComponent(redirect)}`;
  }
  function logout() {
    window.location.href = '/api/auth/logout';
  }
  function setToken(t: string | null){ setAuthToken(t); if(t){ sessionStorage.setItem('access_token', t);} else { sessionStorage.removeItem('access_token'); } }

  return <AuthContext.Provider value={{ user, loading, error, login, logout, setToken }}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const ctx = useContext(AuthContext);
  if(!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
