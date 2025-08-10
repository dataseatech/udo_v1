import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar(){
  const { user, login, logout, loading } = useAuth();
  return (
    <nav className="h-16 bg-gray-800 text-white flex items-center px-4 gap-6">
      <div className="font-bold">UDO</div>
      <Link to="/" className="hover:text-blue-300 text-sm">Dashboard</Link>
      <Link to="/pipelines" className="hover:text-blue-300 text-sm">Pipelines</Link>
      <Link to="/ai-sql" className="hover:text-blue-300 text-sm">AI SQL</Link>
      <Link to="/metadata" className="hover:text-blue-300 text-sm">Metadata</Link>
      <Link to="/embed" className="hover:text-blue-300 text-sm">Embed</Link>
      <div className="ml-auto flex items-center gap-3 text-sm">
        {loading && <span>...</span>}
        {!loading && !user && <button onClick={login} className="px-2 py-1 bg-blue-600 rounded">Login</button>}
        {user && (
          <>
            <span className="text-xs opacity-80">{user.preferred_username || user.name}</span>
            <button onClick={logout} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
