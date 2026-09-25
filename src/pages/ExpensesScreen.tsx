import React, { useState } from 'react';

// Importamos los 3 componentes principales del módulo
import ExpensesTable from '../components/expences/ExpensesTable';
import AccountsPayableTable from '../components/expences/AccountsPayableTable';
import RemindersTable from '../components/expences/RemindersTable';

type Tab = 'egresos' | 'deudas' | 'recordatorios';

const ExpensesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('egresos');

  return (
    <div className="h-full w-full bg-[#121212] p-6 text-white flex flex-col animate-fade-in">
      
      {/* Contenedor principal estilo Tarjeta Oscura */}
      <div className="bg-[#1e1e1e] rounded-2xl flex-1 flex flex-col border border-gray-800 shadow-xl overflow-hidden p-6">
        
        {/* Header de la pantalla */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Módulo de Egresos</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Gestiona salidas de dinero, deudas a proveedores y recordatorios de pago.
            </p>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex bg-[#2a2a2a] p-1 rounded-lg border border-gray-700 shadow-inner">
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'egresos' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Egresos
            </button>
            
            <button
              onClick={() => setActiveTab('deudas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'deudas' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Cuentas por Pagar
            </button>
            
            <button
              onClick={() => setActiveTab('recordatorios')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'recordatorios' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Recordatorios
              {/* Badge indicativo de notificaciones pendientes (puedes volverlo dinámico después) */}
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                2
              </span>
            </button>
          </div>
        </div>

        {/* Área de contenido dinámico (Renderizado de Tablas) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'egresos' && <ExpensesTable />}
          
          {activeTab === 'deudas' && <AccountsPayableTable />}

          {activeTab === 'recordatorios' && <RemindersTable />}
        </div>

      </div>
    </div>
  );
};

export default ExpensesScreen;