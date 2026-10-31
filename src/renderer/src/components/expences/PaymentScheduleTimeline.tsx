// src/components/expenses/PaymentScheduleTimeline.tsx
import React from 'react';
import { PaymentSchedule } from '../../types/expense';

interface Props {
  schedules: PaymentSchedule[];
  onPaySchedule?: (schedule: PaymentSchedule) => void;
  canPay?: boolean;
}

export const PaymentScheduleTimeline: React.FC<Props> = ({ schedules, onPaySchedule, canPay = true }) => {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-[#111] border border-gray-800 rounded-xl p-4 text-sm text-brand-text-muted italic flex items-center gap-3">
        <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Esta deuda es de abonos libres (no tiene un plan de pagos o plazos fijos programados).
      </div>
    );
  }

  const getStatusStyle = (status: string, dateStr?: string) => {
    const normalized = (status || '').toLowerCase();
    const isPastDue = dateStr ? new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0)) : false;

    if (normalized === 'pagado' || normalized === 'paid') {
      return {
        card: 'border-green-500/40 bg-green-950/15',
        badge: 'bg-green-900/30 text-green-400 border-green-500/30',
        dot: 'bg-green-400',
        label: 'Pagado'
      };
    }
    if (normalized === 'cancelada' || normalized === 'cancelled') {
      return {
        card: 'border-gray-700 bg-black/40 opacity-60',
        badge: 'bg-gray-800 text-gray-400 border-gray-700',
        dot: 'bg-gray-500',
        label: 'Cancelada'
      };
    }
    if (normalized === 'vencido' || isPastDue) {
      return {
        card: 'border-red-500/40 bg-red-950/15',
        badge: 'bg-red-900/30 text-red-400 border-red-500/30',
        dot: 'bg-red-500 animate-pulse',
        label: 'Vencido'
      };
    }
    return {
      card: 'border-gray-800 bg-[#111] hover:border-brand-orange/40',
      badge: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
      dot: 'bg-brand-orange',
      label: status || 'Pendiente'
    };
  };

  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-extrabold text-brand-text-muted uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
          Cronograma de Pagos ({schedules.length} {schedules.length === 1 ? 'cuota' : 'cuotas'})
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {schedules.map((schedule, index) => {
          const rawDate = schedule.dueDate || schedule.scheduleDate;
          const style = getStatusStyle(schedule.status, rawDate);
          const installmentNum = schedule.installmentNumber ?? index + 1;
          const isPaidOrCancelled =
            ['pagado', 'paid', 'cancelada', 'cancelled'].includes((schedule.status || '').toLowerCase());

          return (
            <div
              key={schedule.id || index}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${style.card}`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    Cuota #{installmentNum}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                    {style.label}
                  </span>
                </div>

                <div className="text-xl font-black text-white font-mono">
                  ${Number(schedule.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>

                <div className="text-xs text-brand-text-muted mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Vence: {rawDate ? new Date(rawDate).toLocaleDateString('es-MX') : 'Sin fecha'}
                </div>
              </div>

              {!isPaidOrCancelled && canPay && onPaySchedule && (
                <button
                  type="button"
                  onClick={() => onPaySchedule(schedule)}
                  className="w-full py-1.5 px-3 rounded-lg bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-black border border-brand-orange/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Pagar Cuota
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
