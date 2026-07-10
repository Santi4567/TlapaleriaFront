// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

// Importamos todas las páginas
import HomeScreen from '../pages/HomeScreen';
import PosScreen from '../pages/PosScreen';
import ProductsScreen from '../pages/ProductsScreen';
import SuppliersScreen from '../pages/SuppliersScreen';
import PendingOrdersScreen from '../pages/PendingOrdersScreen';
import InventoryScreen from '../pages/InventoryScreen';
import FinanceScreen from '../pages/FinanceScreen';
import UserScreen from '../pages/UserScreen';

const MainLayout: React.FC = () => {
  // Ahora la vista por defecto al iniciar sesión es el Dashboard (HOME)
  const [currentView, setCurrentView] = useState('HOME');

  const renderView = () => {
    switch (currentView) {
      case 'HOME': return <HomeScreen />;
      case 'POS': return <PosScreen />;
      case 'PRODUCTS': return <ProductsScreen />;
      case 'SUPPLIERS': return <SuppliersScreen />;
      case 'PENDING': return <PendingOrdersScreen />;
      case 'INVENTORY': return <InventoryScreen />;
      case 'FINANCE': return <FinanceScreen />;
      case 'USER': return <UserScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-1 w-full h-full bg-[#050505] overflow-hidden"> 
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 p-4 pl-0 flex flex-col relative overflow-hidden">
         {renderView()}
      </div>
    </div>
  );
};

export default MainLayout;