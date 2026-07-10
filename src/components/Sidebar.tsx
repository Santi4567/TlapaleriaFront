// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const checkPermission = (categoria: string, permiso: string) => {
    const userPerms = (user as any)?.permisos;
    if (!userPerms) return true; 
    return userPerms[categoria]?.includes(permiso) || false;
  };

  const menuItems = [
    // NUEVO: Botón de Inicio (Siempre visible)
    { id: 'HOME', label: 'Inicio', show: true, icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
      ) },
    { id: 'POS', label: 'Venta', show: checkPermission('SALES', 'add.sales'), icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
      ) },
    { id: 'PRODUCTS', label: 'Productos', show: checkPermission('PRODUCTS', 'view.products'), icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
      ) },
    { id: 'SUPPLIERS', label: 'Proveedores', show: checkPermission('SUPPLIERS', 'view.suppliers'), icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
      ) },
    { id: 'PENDING', label: 'Pendientes', show: checkPermission('PENDINGORDERS', 'view.pendingorders'), icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
      ) },
    { id: 'INVENTORY', label: 'Inventario', show: checkPermission('INVENTORYMOVEMENTS', 'view.inventorymovements'), icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
      ) },
    { id: 'FINANCE', label: 'Finanzas', show: checkPermission('SALES', 'view.sales'), icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
      ) }
  ];

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`bg-[#121212] m-4 rounded-3xl shadow-2xl flex flex-col justify-between py-6 transition-all duration-300 ease-in-out relative z-40 border border-gray-800/50
        ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      <div className="flex flex-col space-y-3 px-3">
        {menuItems.map((item) => 
          item.show && (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center p-3 rounded-2xl transition-all duration-200 group relative overflow-hidden
                ${currentView === item.id 
                  ? 'bg-brand-orange text-brand-deep-dark shadow-[0_0_15px_rgba(255,90,0,0.3)]' 
                  : 'text-brand-text-muted hover:text-white hover:bg-gray-800/80'}`}
            >
              <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </div>
              <span className={`font-bold tracking-wide whitespace-nowrap transition-all duration-300 ml-4 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}>
                {item.label}
              </span>
            </button>
          )
        )}
      </div>

      <div className="px-3 border-t border-gray-800/50 pt-4 mt-auto">
         <button 
            onClick={logout}
            className="flex items-center p-3 w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group overflow-hidden mb-4"
          >
            <div className="flex-shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            </div>
            <span className={`font-bold whitespace-nowrap transition-all duration-300 ml-4 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
              Cerrar Sesión
            </span>
         </button>

         {/* NUEVO: El área de perfil ahora es un botón que navega a 'USER' */}
         <button 
            onClick={() => onNavigate('USER')}
            className={`w-full flex items-center p-2 bg-black/40 rounded-2xl overflow-hidden border transition-all duration-200 group
              ${currentView === 'USER' 
                ? 'border-brand-orange bg-gray-800/80 shadow-[0_0_10px_rgba(255,90,0,0.1)]' 
                : 'border-gray-800/50 hover:bg-gray-800/80 hover:border-gray-600'}`}
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-brand-orange font-bold rounded-xl flex items-center justify-center border border-gray-700 group-hover:scale-105 transition-transform">
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className={`ml-3 whitespace-nowrap transition-all duration-300 flex flex-col items-start ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
              <span className="text-sm font-bold truncate max-w-[140px] text-white group-hover:text-brand-orange transition-colors">{user?.name || 'Usuario'}</span>
              <span className="text-xs text-brand-text-muted">{user?.rol || 'Admin'}</span>
            </div>
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;