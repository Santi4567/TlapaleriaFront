import React, { useState } from 'react';
// import { expenseService } from '../../services/expenseService';

// Interfaz temporal para el componente (debería ir en types/expense.ts)
interface Reminder {
  id: number;
  supplier: string;
  installmentDetails: string;
  dueDate: string;
  amount: number;
  channel: string;
  isOverdue: boolean;
}

const RemindersTable: React.FC = () => {
  // Estado para simular la carga y marcado de lectura
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Mock data basado en el boceto HTML
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 1,
      supplier: 'Truper',
      installmentDetails: 'Cuota 3',
      amount: 5000,
      dueDate: '2026-09-28',
      channel: 'InApp',
      isOverdue: false
    },
    {
      id: 2,
      supplier: 'Materiales del Norte',
      installmentDetails: 'Cuota 1',
      amount: 1200,
      dueDate: '2026-09-24', // Fecha en el pasado simulando vencimiento
      channel: 'InApp',
      isOverdue: true
    }
  ]);

  const handleMarkAsRead = async (id: number) => {
    setLoadingId(id);
    
    // Aquí iría la llamada real a tu API:
    // await expenseService.markReminderAsRead(id);
    
    // Simulamos el delay de red y removemos el elemento de la lista
    setTimeout(() => {
      setReminders(reminders.filter(r => r.id !== id));
      setLoadingId(null);
    }, 600);
  };

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full animate-fade-in text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <p className="text-lg font-medium text-gray-400">Todo al día</p>
        <p className="text-sm">No tienes recordatorios de pago pendientes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full animate-fade-in">
      
      {/* Encabezado descriptivo de la sección */}
      <div className="mb-4 flex justify-between items-end">
        <p className="text-sm text-gray-400">
          Mostrando las cuotas próximas a vencer (próximos 3 días) o ya vencidas.
        </p>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden flex-1 shadow-inner">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap">
            
            <thead className="bg-[#222222] text-gray-400 border-b border-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-medium">Proveedor</th>
                <th className="px-6 py-4 font-medium">Detalle</th>
                <th className="px-6 py-4 font-medium">Vence</th>
                <th className="px-6 py-4 font-medium">Canal</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-800">
              {reminders.map((reminder) => (
                <tr key={reminder.id} className="hover:bg-[#252525] transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-200">
                    {reminder.supplier}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-300">{reminder.installmentDetails}</span>
                      <span className="font-mono text-orange-400 font-bold">
                        ${reminder.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`${reminder.isOverdue ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                        {new Date(reminder.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </span>
                      {reminder.isOverdue && (
                         <span className="px-2 py-0.5 bg-red-900/40 border border-red-900/50 text-red-400 rounded-full text-[10px] uppercase font-bold tracking-wider">
                           Vencido
                         </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[#2a2a2a] border border-gray-700 rounded text-xs text-gray-400">
                      {reminder.channel}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleMarkAsRead(reminder.id)}
                      disabled={loadingId === reminder.id}
                      className="bg-transparent border border-gray-600 hover:border-orange-500 text-gray-300 hover:text-orange-400 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ml-auto"
                    >
                      {loadingId === reminder.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Marcar leído
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            
          </table>
        </div>
      </div>
    </div>
  );
};

export default RemindersTable;