import React from 'react';
import keycloak from './keycloak';

import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

const Dashboard: React.FC = () => <div><h2>Dashboard Page</h2><p>Placeholder for Dashboard content.</p></div>;
const DataIngestion: React.FC = () => <div><h2>Data Ingestion Page</h2><p>Placeholder for Data Ingestion content.</p></div>;
const Metadata: React.FC = () => <div><h2>Metadata Page</h2><p>Placeholder for Metadata content.</p></div>;
const MLExperiments: React.FC = () => <div><h2>ML Experiments Page</h2><p>Placeholder for ML Experiments content.</p></div>;
const Monitoring: React.FC = () => <div><h2>Monitoring Page</h2><p>Placeholder for Monitoring content.</p></div>;
const Admin: React.FC = () => <div><h2>Admin Page</h2><p>Placeholder for Admin content.</p></div>;

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/data-ingestion">Data Ingestion</Link></li>
            <li><Link to="/metadata">Metadata</Link></li>
            <li><Link to="/ml-experiments">ML Experiments</Link></li>
            <li><Link to="/monitoring">Monitoring</Link></li>
            <li><Link to="/admin">Admin</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/data-ingestion" element={<DataIngestion />} />
          <Route path="/metadata" element={<Metadata />} />
          <Route path="/ml-experiments" element={<MLExperiments />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  // ... existing code ...

  if (keycloak.authenticated) {
    // User is authenticated
    const user = keycloak.idTokenParsed;
    const username = user ? user.preferred_username : 'Unknown User';

    return (
      <Router>
        <div>
          <nav>
            {/* ... existing navigation ... */}
          </nav>
          <div>
            <p>Welcome, {username}!</p>
            <button onClick={() => keycloak.logout()}>Logout</button>
          </div>
          <Routes>
            {/* ... existing routes ... */}
          </Routes>
        </div>
      </Router>
    );
  } else {
    // User is not authenticated, Keycloak will handle the redirect
    return <div>Loading...</div>;
  }
}

const fetchData = async () => {
  if (keycloak.authenticated) {
    const response = await fetch('/api/datasets', {
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    });
    const data = await response.json();
    console.log(data);
  }
};


export default App;