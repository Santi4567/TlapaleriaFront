// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

// Importamos todas las páginas
import HomeScreen from '../pages/HomeScreen';
import PosScreen from '../pages/PosScreen';
import WorkTasksScreen from '../pages/WorkTasksScreen';
import ProductsScreen from '../pages/ProductsScreen';
import ProductHistoryScreen from "../pages/ProductHistoryScreen";
import SuppliersScreen from '../pages/SuppliersScreen';
import PendingOrdersScreen from '../pages/PendingOrdersScreen';
import InventoryScreen from '../pages/InventoryScreen';
import FinanceScreen from '../pages/FinanceScreen';
import ExpensesScreen from "../pages/ExpensesScreen";
import UserScreen from '../pages/UserScreen';
import UserManagementScreen from '../pages/UserManagementScreen';
import RoleManagementScreen from '../pages/RoleManagementScreen';
//import ConfigurationScreen from '../pages/ConfigurationScreen';

// Debe coincidir con la duración de --animate-app-out en index.css
const LOGOUT_ANIMATION_MS = 300;

const MainLayout: React.FC = () => {
  const { logout } = useAuth();

  // La vista por defecto al iniciar sesión es el Dashboard (HOME)
  const [currentView, setCurrentView] = useState('HOME');
  const [isLeaving, setIsLeaving] = useState(false);

  // Anima la salida y cierra la sesión cuando termina
  const handleLogout = () => {
    if (isLeaving) return; // evita doble clic
    setIsLeaving(true);
    setTimeout(logout, LOGOUT_ANIMATION_MS);
  };

  const renderView = () => {
    switch (currentView) {
      case 'HOME': return <HomeScreen onNavigate={setCurrentView} />;
      case 'POS': return <PosScreen />;
      case 'WORK': return <WorkTasksScreen />;
      case 'PRODUCTS': return <ProductsScreen />;
      case 'SUPPLIERS': return <SuppliersScreen />;
      case 'PENDING': return <PendingOrdersScreen />;
      case 'INVENTORY': return <InventoryScreen />;
      case 'FINANCE': return <FinanceScreen />;
      case 'USER': return <UserScreen onLogout={handleLogout} />;
      case 'USER_MANAGEMENT': return <UserManagementScreen />;
      case 'ROL': return <RoleManagementScreen />;
      case 'EXPENSES': return <ExpensesScreen />;
      case 'PRODUCT_HISTORY': return <ProductHistoryScreen />;
      default: return <HomeScreen onNavigate={setCurrentView} />;
    }
  };

  return (
    <div
      className={`flex w-full h-screen bg-[#050505] overflow-hidden ${
        isLeaving ? 'animate-app-out motion-reduce:animate-none' : ''
      }`}
    >
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />

      <div className="flex-1 p-4 pl-0 flex flex-col relative overflow-hidden">
        {/* El key reinicia la animación cada vez que cambia la vista */}
        <div
          key={currentView}
          className="animate-view-in motion-reduce:animate-none flex-1 flex flex-col min-h-0"
        >
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
