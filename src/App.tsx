// src/App.tsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import CustomTitleBar from './components/CustomTitleBar';

function App() {
  const { user } = useAuth();

  return (
    // CAMBIO PRINCIPAL: Añadimos flex y flex-col, quitamos relative y pt-10
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-brand-deep-dark">
      
      {/* 1. La barra ocupa sus 40px en la parte superior de forma natural */}
      <CustomTitleBar />

      {/* 2. El área principal ocupa el RESTO EXACTO de la pantalla con flex-1 */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        
        {/* LÓGICA DE PROTECCIÓN */}
        {!user ? (
          <Login />
        ) : (
          <div className="text-brand-text p-8 h-full overflow-auto">
            <header className="flex items-center justify-between pb-8 border-b border-gray-800 mb-8">
              <h1 className="text-2xl font-bold text-brand-orange">Tlapaleria LEO - Panel Principal</h1>
              <div className="flex items-center space-x-4">
                <span>Bienvenido, <strong>{user.usuario}</strong></span>
                <button 
                  onClick={() => {/* Lógica de Logout */}} 
                  className="text-sm bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cerrar Sesión
                </button>
              </div>
            </header>
            
            <div className="text-center py-20 bg-brand-panel rounded-2xl border border-gray-800">
              <p className="text-xl">Token cargado en memoria correctamente.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;