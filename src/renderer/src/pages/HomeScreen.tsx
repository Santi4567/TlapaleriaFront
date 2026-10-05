// src/pages/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  
  // Estado para manejar el reloj en tiempo real
  const [time, setTime] = useState(new Date());
  
  // Estado para la libreta de notas rápida
  const [nota, setNota] = useState('Revisar el pedido de herramientas que llega a las 4:00 PM. Separar el material del cliente Gómez.');

  useEffect(() => {
    // Actualizamos el reloj cada segundo
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formateadores nativos de JS para la hora y fecha (formato México)
  const formattedTime = time.toLocaleTimeString('es-MX', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
  });
  
  const formattedDate = time.toLocaleDateString('es-MX', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col overflow-y-auto">
      
      {/* HEADER: Saludo y Reloj */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-800 pb-6">
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

      {/* ÁREA DE WIDGETS OPERATIVOS (Grid de 3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* WIDGET 1: Venta Total Hoy */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Venta Total Hoy</h3>
          </div>
          <div className="mt-auto pt-4">
            <p className="text-4xl font-black text-white">$18,250.00</p>
            <p className="text-sm text-green-500 mt-2 font-medium">Corte parcial en curso</p>
          </div>
        </div>

        {/* WIDGET 2: Ventas Hoy (Tickets) */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Ventas Hoy</h3>
          </div>
          <div className="mt-auto pt-4">
            <p className="text-4xl font-black text-white">42</p>
            <p className="text-sm text-brand-text-muted mt-2 font-medium">Tickets / operaciones</p>
          </div>
        </div>

        {/* WIDGET 3: Sección de Notas */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.121l-2.857.952.952-2.857a4.5 4.5 0 011.12-1.89l12.72-12.72zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Notas Rápidas</h3>
          </div>
          <textarea
            className="w-full flex-1 bg-black/30 border border-gray-800/50 rounded-xl p-3 text-brand-text-muted resize-none focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-all text-sm min-h-[100px]"
            placeholder="Escribe un recordatorio aquí..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          ></textarea>
        </div>

        {/* WIDGET 4: Alertas del Sistema */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-brand-orange/10 rounded-xl text-brand-orange">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Alertas de Stock</h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            <div className="flex items-center text-brand-text bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <div className="w-2.5 h-2.5 min-w-[10px] rounded-full bg-red-500 mr-3 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <p className="text-sm font-medium">Inventario bajo: Cemento Cruz Azul 50kg</p>
            </div>
            <div className="flex items-center text-brand-text bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <div className="w-2.5 h-2.5 min-w-[10px] rounded-full bg-brand-orange mr-3"></div>
              <p className="text-sm font-medium">Pintura vinílica blanca próxima a caducar</p>
            </div>
          </div>
        </div>

        {/* WIDGET 5: Productos Más Vendidos */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Top Ventas Hoy</h3>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <span className="text-sm font-medium text-brand-text truncate mr-2">Cemento Cruz Azul 50kg</span>
              <span className="text-sm font-black text-brand-orange">15 un</span>
            </div>
            <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <span className="text-sm font-medium text-brand-text truncate mr-2">Pintura Vinílica 19L</span>
              <span className="text-sm font-black text-brand-orange">8 un</span>
            </div>
            <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-gray-800/50">
              <span className="text-sm font-medium text-brand-text truncate mr-2">Pala Truper Cuadrada</span>
              <span className="text-sm font-black text-brand-orange">5 un</span>
            </div>
          </div>
        </div>

        {/* WIDGET 6: Actividad Reciente */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl p-6 shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Actividad Reciente</h3>
          </div>
          <div className="space-y-4 flex-1 pt-2">
            
            <div className="relative pl-5 border-l border-gray-700 ml-2">
              <div className="absolute w-2.5 h-2.5 bg-brand-orange rounded-full -left-[5.5px] top-1"></div>
              <p className="text-xs text-brand-text-muted mb-0.5">Hace 5 min</p>
              <p className="text-sm font-medium text-white">Ticket #1042 cobrado en mostrador</p>
            </div>
            
            <div className="relative pl-5 border-l border-gray-700 ml-2">
              <div className="absolute w-2.5 h-2.5 bg-gray-500 rounded-full -left-[5.5px] top-1"></div>
              <p className="text-xs text-brand-text-muted mb-0.5">Hace 45 min</p>
              <p className="text-sm font-medium text-white">Ingreso de stock: Tornillería</p>
            </div>
            
            <div className="relative pl-5 border-l border-transparent ml-2">
              <div className="absolute w-2.5 h-2.5 bg-gray-500 rounded-full -left-[5.5px] top-1"></div>
              <p className="text-xs text-brand-text-muted mb-0.5">08:00 AM</p>
              <p className="text-sm font-medium text-white">Inicio de turno y apertura de caja</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeScreen;