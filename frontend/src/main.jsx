import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProvider } from './hooks/UserProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="349373813363-rhm40kno3osc03tb8shlnovmrr7s7kqv.apps.googleusercontent.com">
      <UserProvider>
        <App />
      </UserProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)