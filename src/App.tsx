// src/App.tsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import CustomTitleBar from './components/CustomTitleBar';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';

function App() {
  const { user } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-brand-deep-dark">
      
      {/* La barra superior siempre está presente */}
      <CustomTitleBar />

      <main className="flex-1 w-full flex flex-col relative overflow-hidden">
        {/* El enrutador de nivel superior: Si no hay usuario -> Login. Si hay -> Layout del ERP */}
        {!user ? <Login /> : <MainLayout />}
      </main>
      
    </div>
  );
}

export default App;