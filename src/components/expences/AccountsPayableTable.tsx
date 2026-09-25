import React, { useState } from 'react';
import CustomDatePicker from '../CustomDatePicker';
import PaymentScheduleTimeline from './PaymentScheduleTimeline';
// 1. Descomentamos la importación del modal
import AccountPayableCreateModal from './AccountPayableCreateModal';

const AccountsPayableTable: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  
  // 2. Agregamos el estado para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockDebts = [
    { 
      id: 1, 
      supplier: 'Truper', 
      concept: 'Factura #1024', 
      total: 10000, 
      balance: 6000, 
      status: 'Parcial', 
      dueDate: '2026-10-15',
      schedules: [
        { id: 101, accountsPayableId: 1, scheduleDate: '2026-09-24', amount: 2500, status: 'Pagado' },
        { id: 102, accountsPayableId: 1, scheduleDate: '2026-10-01', amount: 1500, status: 'Pagado' },
        { id: 103, accountsPayableId: 1, scheduleDate: '2026-10-08', amount: 5000, status: 'Pendiente' },
        { id: 104, accountsPayableId: 1, scheduleDate: '2026-10-15', amount: 1000, status: 'Pendiente' },
      ]
    },
    { 
      id: 2, 
      supplier: 'Ferre Mayorero', 
      concept: 'Herramienta variada', 
      total: 4200, 
      balance: 0, 
      status: 'Pagado', 
      dueDate: '2026-10-01',
      schedules: [] 
    },
  ];

  const toggleRow = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pagado': return 'bg-green-900/30 text-green-400 border-green-800/50';
      case 'Parcial': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50';
      case 'Pendiente': return 'bg-blue-900/30 text-blue-400 border-blue-800/50';
      case 'Vencido': return 'bg-red-900/30 text-red-400 border-red-800/50';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  // Función para recargar la tabla después de guardar
  const handleSuccess = () => {
    console.log("Deuda guardada. Recargando tabla...");
  };

  return (
    <div className="flex flex-col h-full w-full animate-fade-in relative">
      
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="w-40"><CustomDatePicker selected={startDate} onChange={setStartDate} placeholder="Fecha inicio" /></div>
        <div className="w-40"><CustomDatePicker selected={endDate} onChange={setEndDate} placeholder="Fecha fin" /></div>

        <select className="bg-[#2a2a2a] border border-gray-700 text-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
          <option>Status: Todos</option>
          <option>Pendiente</option>
          <option>Parcial</option>
          <option>Pagado</option>
        </select>

        <div className="flex-1"></div>

        {/* 3. Agregamos el evento onClick al botón para abrir el modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-[0_0_10px_rgba(234,88,12,0.2)] flex items-center gap-2"
        >
          <span>+</span> Nueva deuda
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden flex-1 shadow-inner">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#222222] text-gray-400 border-b border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-4 py-4"></th> 
                <th className="px-6 py-4 font-medium">Proveedor</th>
                <th className="px-6 py-4 font-medium">Concepto</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Balance</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Vence</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-800">
              {mockDebts.map((debt) => (
                <React.Fragment key={debt.id}>
                  <tr 
                    onClick={() => toggleRow(debt.id)}
                    className="hover:bg-[#252525] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 text-center">
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expandedRowId === debt.id ? 'rotate-90 text-orange-500' : 'group-hover:text-gray-300'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-200">{debt.supplier}</td>
                    <td className="px-6 py-4 text-gray-400">{debt.concept}</td>
                    <td className="px-6 py-4 font-mono text-gray-200">${debt.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 font-mono font-bold text-orange-400">${debt.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(debt.status)}`}>
                        {debt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(debt.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>

                  {expandedRowId === debt.id && (
                    <tr className="bg-[#1e1e1e]">
                      <td colSpan={7} className="p-0 border-b-2 border-gray-700">
                        <PaymentScheduleTimeline schedules={debt.schedules} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Renderizamos el Modal al final del componente, pasando el estado y funciones */}
      <AccountPayableCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess} 
      />

    </div>
  );
};

export default AccountsPayableTable;