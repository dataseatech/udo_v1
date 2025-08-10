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
    const existing = sessionStorage.getItem('access_token');
    if(existing){
      setAuthToken(existing);
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    async function bootstrap(){
      try {
        setLoading(true);
        if(code && !existing){
          // Exchange code
          const r = await fetch(`${API_BASE}/api/auth/callback?code=${encodeURIComponent(code)}`);
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
    window.location.href = '/api/auth/start-login';
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
