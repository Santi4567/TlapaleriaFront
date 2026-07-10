// src/pages/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  
  // Estado para manejar el reloj en tiempo real
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Actualizamos el reloj cada segundo
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formateadores nativos de JS para la hora y fecha (formato México)
  const formattedTime = time.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true
  });
  
  const formattedDate = time.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col overflow-y-auto">
      
      {/* HEADER: Saludo y Reloj */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            Bienvenido, <span className="text-brand-orange">{user?.name || 'Usuario'}</span>
          </h1>
          <p className="text-brand-text-muted text-lg capitalize font-medium">{formattedDate}</p>
        </div>
        <div className="mt-4 md:mt-0 bg-black/40 px-6 py-3 rounded-2xl border border-gray-800/50 shadow-inner">
          <span className="text-4xl font-black text-brand-orange tracking-wider font-mono">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* ÁREA DE TARJETAS (WIDGETS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Alertas del Sistema */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-brand-orange/10 rounded-xl text-brand-orange">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Alertas Activas</h3>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center text-brand-text bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-3 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <p className="text-sm font-medium">Inventario bajo: Cemento Cruz Azul 50kg</p>
            </div>
            <div className="flex items-center text-brand-text bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-orange mr-3"></div>
              <p className="text-sm font-medium">Hay 3 pedidos pendientes de entrega.</p>
            </div>
          </div>
        </div>

        {/* Widget 2: Resumen Rápido (Placeholder) */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Resumen de Hoy</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-4 border-2 border-dashed border-gray-700/50 rounded-2xl">
             <span className="text-gray-500 text-sm text-center font-medium">Los gráficos de caja se conectarán aquí próximamente.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeScreen;