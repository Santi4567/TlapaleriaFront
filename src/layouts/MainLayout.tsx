// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

// Definimos las vistas disponibles en el ERP
type View = 'POS' | 'PRODUCTS' | 'SUPPLIERS' | 'INVENTORY' | 'FINANCE';

const MainLayout: React.FC = () => {
  // Estado para controlar qué pantalla se está mostrando actualmente
  const [currentView, setCurrentView] = useState<View>('POS');

  return (
    <div className="flex flex-1 w-full h-full bg-[#0a0a0a]">
      
      {/* Navegación Lateral Dinámica */}
      {/* Podríamos pasarle setCurrentView al Sidebar para que cambie la vista al hacer clic */}
      <Sidebar />

      {/* Área Central Dinámica */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col relative">
        
        {/* Aquí es donde ocurrirá la magia: Dependiendo de currentView, renderizamos un componente distinto */}
        {currentView === 'POS' && (
          <div className="h-full flex flex-col">
            <header className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6 flex-shrink-0">
              <h1 className="text-2xl font-bold text-brand-text">Punto de Venta</h1>
            </header>
            <div className="flex-1 w-full border border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-gray-500">
               Componente PosScreen.tsx irá aquí
            </div>
          </div>
        )}

        {currentView === 'PRODUCTS' && (
          <div className="h-full text-white">
            <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
            {/* Componente ProductsScreen.tsx irá aquí */}
          </div>
        )}

      </div>
    </div>
  );
};

export default MainLayout;