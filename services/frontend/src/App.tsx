import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './routes/Dashboard';
import PipelineBuilder from './routes/PipelineBuilder';
import AiSqlPanel from './routes/AiSqlPanel';
import MetadataPage from './routes/MetadataPage';
import EmbeddedView from './routes/EmbeddedView';
import { NavBar } from './components/NavBar';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4 text-sm">Checking session...</div>;
  if (!user) return <div className="p-4 text-sm">Please login to continue.</div>;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/pipelines" element={<Protected><PipelineBuilder /></Protected>} />
          <Route path="/ai-sql" element={<Protected><AiSqlPanel /></Protected>} />
          <Route path="/metadata" element={<Protected><MetadataPage /></Protected>} />
          <Route path="/embedded/:service" element={<Protected><EmbeddedView /></Protected>} />
          <Route path="*" element={<div className="text-sm">Not found</div>} />
        </Routes>
      </div>
    </div>
  );
}
