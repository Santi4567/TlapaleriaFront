import React from 'react';
import { Wallet, Wrench, ArrowLeft } from 'lucide-react';

const FinanceScreen: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col">
      
      {/* Encabezado del Módulo */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Wallet className="w-7 h-7 text-emerald-500" />
          Finanzas
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Gestión de ingresos, egresos y reportes.
        </p>
      </div>

      {/* Área de Construcción (Empty State) */}
      <div className="flex-1 border-2 border-dashed border-gray-700/50 bg-gray-800/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-colors hover:border-gray-600/50 hover:bg-gray-800/20">
        
        {/* Contenedor del ícono */}
        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-700">
          <Wrench className="w-10 h-10 text-emerald-500" />
        </div>
        
        {/* Mensaje principal */}
        <h3 className="text-xl font-semibold text-gray-200 mb-3">
          Módulo en Construcción
        </h3>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          Estamos preparando las herramientas necesarias para que puedas administrar tus finanzas de manera increíble. ¡Estará listo muy pronto!
        </p>

        {/* Botón de acción opcional */}
        <button 
          onClick={() => window.history.back()} 
          className="px-6 py-2.5 bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 rounded-xl font-medium transition-all duration-200 border border-gray-700 flex items-center gap-2 hover:border-gray-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar al inicio
        </button>

      </div>
    </div>
  );
};

export default FinanceScreen;