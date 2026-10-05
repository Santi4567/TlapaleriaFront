import React from 'react';
import { PaymentSchedule } from '../../types/expense';

interface Props {
  schedules: PaymentSchedule[];
}

const PaymentScheduleTimeline: React.FC<Props> = ({ schedules }) => {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm italic">
        Esta deuda no tiene un plan de plazos (abonos libres).
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#1a1a1a] border-t border-gray-800">
      <h4 className="text-sm font-medium text-gray-400 mb-4">Plan de pagos</h4>
      
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
        {schedules.map((schedule, index) => {
          const isPaid = schedule.status === 'Pagado';
          const isOverdue = schedule.status === 'Vencido';
          
          return (
            <div 
              key={schedule.id} 
              className={`min-w-[140px] flex-1 flex flex-col items-center justify-center p-4 rounded-lg border ${
                isPaid 
                  ? 'bg-green-900/10 border-green-900/50' 
                  : isOverdue 
                    ? 'bg-red-900/10 border-red-900/50'
                    : 'bg-[#252525] border-gray-700'
              }`}
            >
              {/* Badge de status adaptado al diseño dark */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                isPaid ? 'bg-green-900/40 text-green-400' 
                : isOverdue ? 'bg-red-900/40 text-red-400'
                : 'bg-blue-900/40 text-blue-400'
              }`}>
                {schedule.status}
              </span>
              
              <span className="text-sm text-gray-400 mb-1">Cuota {index + 1}</span>
              <span className="text-lg font-mono font-bold text-gray-200">
                ${schedule.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {new Date(schedule.scheduleDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentScheduleTimeline;