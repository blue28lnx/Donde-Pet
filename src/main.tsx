import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

// AuthProvider ya envuelve con GoogleOAuthProvider si VITE_GOOGLE_CLIENT_ID está seteado.
// (Mirá src/context/AuthContext.tsx).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
