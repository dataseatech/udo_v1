import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keycloak from './keycloak'; // Import the Keycloak instance
import './index.css'; // Assuming you have a basic CSS file

// Initialize Keycloak
keycloak.init({
  onLoad: 'login-required', // Redirect to login if not authenticated
  autoRefreshToken: true, // Automatically refresh tokens
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html' // Required for silent SSO checks
})
.then((authenticated) => {
  if (authenticated) {
    console.log('User authenticated');
    // Render the React application if authenticated
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
})
.catch((error) => {
  console.error('Keycloak initialization failed', error);
});