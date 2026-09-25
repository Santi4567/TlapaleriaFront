import React, { useState } from 'react';
// Ajusta las rutas según tu estructura exacta de carpetas
import CustomDatePicker from '../CustomDatePicker'; 
import ExpenseCreateModal from './ExpenseCreateModal';

const ExpensesTable: React.FC = () => {
  // Estados para los filtros de búsqueda
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Estado para controlar la apertura/cierre del modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock de datos basados en tu boceto HTML (se reemplazarán con la API)
  const mockExpenses = [
    { id: 1, date: '24 sep', concept: 'Abono factura Truper', category: 'Pago a proveedor', method: 'Efectivo', amount: 1500, status: 'Activo' },
    { id: 2, date: '23 sep', concept: 'Recibo CFE', category: 'Servicios', method: 'Transferencia', amount: 840, status: 'Activo' },
    { id: 3, date: '22 sep', concept: 'Compra tornillería', category: 'Otros', method: 'Efectivo', amount: 320, status: 'Anulado' },
  ];

  // Función que se ejecuta cuando el modal guarda exitosamente
  const handleSuccess = () => {
    // Aquí en el futuro llamarás a tu expenseService.getExpenses() 
    // para recargar los datos reales de la base de datos
    console.log("Egreso guardado. Recargando tabla...");
  };

  return (
    <div className="flex flex-col h-full w-full animate-fade-in relative">
      
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        
        {/* Filtros de Fecha */}
        <div className="w-40">
          <CustomDatePicker 
            selected={startDate} 
            onChange={setStartDate} 
            placeholder="Fecha inicio" 
          />
        </div>
        <div className="w-40">
          <CustomDatePicker 
            selected={endDate} 
            onChange={setEndDate} 
            placeholder="Fecha fin" 
          />
        </div>

        {/* Selectores con estilo dark */}
        <select className="bg-[#2a2a2a] border border-gray-700 text-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors">
          <option>Categoría...</option>
          <option>Pago a proveedor</option>
          <option>Servicios</option>
          <option>Otros</option>
        </select>

        <select className="bg-[#2a2a2a] border border-gray-700 text-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors">
          <option>Status: Activos</option>
          <option>Status: Anulados</option>
          <option>Todos</option>
        </select>

        {/* Espaciador */}
        <div className="flex-1"></div>

        {/* Botón que ABRE el modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-[0_0_10px_rgba(234,88,12,0.2)] flex items-center gap-2"
        >
          <span>+</span> Nuevo egreso
        </button>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden flex-1 shadow-inner">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap">
            
            <thead className="bg-[#222222] text-gray-400 border-b border-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Concepto</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Método</th>
                <th className="px-6 py-4 font-medium">Monto</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-800">
              {mockExpenses.map((expense) => (
                <tr 
                  key={expense.id} 
                  className={`hover:bg-[#252525] transition-colors ${expense.status === 'Anulado' ? 'opacity-50 grayscale' : ''}`}
                >
                  <td className="px-6 py-3">{expense.date}</td>
                  <td className="px-6 py-3 font-medium text-gray-200">{expense.concept}</td>
                  <td className="px-6 py-3 text-gray-400">{expense.category}</td>
                  <td className="px-6 py-3">{expense.method}</td>
                  <td className="px-6 py-3 font-mono text-gray-200">
                    ${expense.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      expense.status === 'Activo' 
                        ? 'bg-green-900/30 text-green-400 border-green-800/50' 
                        : 'bg-red-900/30 text-red-400 border-red-800/50'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {expense.status === 'Activo' && (
                      <button 
                        title="Anular egreso"
                        className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            
          </table>
        </div>
      </div>

      {/* 
        Integración del Modal: 
        Se coloca al final del componente principal. Su propiedad 'isOpen'
        define si se muestra en pantalla o permanece oculto.
      */}
      <ExpenseCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess} 
      />
      
    </div>
  );
};

export default ExpensesTable;