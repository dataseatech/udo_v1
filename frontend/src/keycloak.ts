import Keycloak from 'keycloak-js';

// Initialize Keycloak instance
// Replace the placeholder configuration with your actual Keycloak server details
const keycloak = new Keycloak({
  url: 'YOUR_KEYCLOAK_URL', // e.g., 'http://localhost:8080'
  realm: 'YOUR_REALM_NAME', // e.g., 'myrealm'
  clientId: 'YOUR_CLIENT_ID', // e.g., 'my-react-client'
});

export default keycloak;