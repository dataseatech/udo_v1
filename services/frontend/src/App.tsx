import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './routes/Dashboard';
import PipelineBuilder from './routes/PipelineBuilder';
import AiSqlPanel from './routes/AiSqlPanel';
import MetadataPage from './routes/MetadataPage';
import EmbeddedView from './routes/EmbeddedView';
import DataSources from './routes/DataSources';
import Storage from './routes/Storage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import Monitoring from './routes/Monitoring';
import Costs from './routes/Costs';
import Analytics from './routes/Analytics';
import Settings from './routes/Settings';
import AIModels from './routes/AIModels';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading, login } = useAuth();
  if (loading) return <div className="p-4 text-sm">Checking session...</div>;
  if (!user) return (
    <div className="p-6 text-sm flex flex-col gap-4">
      <div>Please login to continue.</div>
      <div>
        <button onClick={login} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">Login</button>
      </div>
    </div>
  );
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">UDO</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to UDO</h1>
            <p className="text-gray-600 mb-6">Unified Data Orchestration Platform</p>
            <button 
              onClick={() => {
                const origin = window.location.origin;
                const url = `/api/auth/start-login?client_id=udo&redirect_uri=${encodeURIComponent(origin)}`;
                window.location.href = url;
              }} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipelines" element={<PipelineBuilder />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/ai-models" element={<AIModels />} />
            <Route path="/ai-playground" element={<AiSqlPanel />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/costs" element={<Costs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/metadata" element={<MetadataPage />} />
            <Route path="/embedded/:service" element={<EmbeddedView />} />
            <Route path="*" element={<div className="text-sm">Not found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
