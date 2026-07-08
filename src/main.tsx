import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Envolvemos TODA la aplicación con el proveedor de autenticación en memoria */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)