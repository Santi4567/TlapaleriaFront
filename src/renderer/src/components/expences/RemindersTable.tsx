// src/components/expenses/RemindersTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AccountPayable, PaymentReminder, PaymentSchedule } from '../../types/expense';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';

const READ_REMINDERS_STORAGE_KEY = 'tlapaleria_read_reminders';

export const getReadReminderIds = (): number[] => {
  try {
    const raw = localStorage.getItem(READ_REMINDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveReadReminderId = (id: number) => {
  try {
    const current = getReadReminderIds();
    if (!current.includes(id)) {
      localStorage.setItem(READ_REMINDERS_STORAGE_KEY, JSON.stringify([...current, id]));
    }
  } catch {
    // ignore storage errors
  }
};

interface Props {
  refreshTrigger?: number;
  onCountChange?: (count: number) => void;
  onPayReminder?: (debt: AccountPayable, schedule: PaymentSchedule) => void;
}

export const RemindersTable: React.FC<Props> = ({
  refreshTrigger = 0,
  onCountChange,
  onPayReminder
}) => {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const canAddExpense = Boolean((user?.permisos as any)?.EXPENSES?.includes('add.expenses'));

  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await expenseService.getPendingReminders(token);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron obtener los recordatorios pendientes.');
      }

      const readIds = getReadReminderIds();
      const rawList: PaymentReminder[] = json.data || [];

      // Filtramos los que ya fueron marcados como leídos o cuya cuota ya fue pagada
      const activeList = rawList.filter((rem) => {
        if (readIds.includes(rem.id)) return false;
        const scheduleStatus = (rem.schedule?.status || '').toLowerCase();
        if (scheduleStatus === 'pagado' || scheduleStatus === 'cancelada') return false;
        return true;
      });

      setReminders(activeList);
      if (onCountChange) onCountChange(activeList.length);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los recordatorios.');
    } finally {
      setIsLoading(false);
    }
  }, [token, onCountChange]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders, refreshTrigger]);

  // Función para marcar como leído y actualizar la vista
  const handleMarkAsRead = async (id: number) => {
    saveReadReminderId(id);
    setReminders((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (onCountChange) onCountChange(next.length);
      return next;
    });

    try {
      await expenseService.markReminderAsRead(id, token);
    } catch {
      // Si el endpoint opcional aún no está desplegado en el servidor, se mantiene guardado localmente
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#121212] rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">
          Revisando alertas de pagos próximos...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/40 text-red-400 p-4 rounded-2xl text-sm font-medium">
        ⚠️ {error}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="flex-1 bg-[#121212] rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl mb-4">
          🎉
        </div>
        <h3 className="text-xl font-extrabold text-white">¡Todo al día!</h3>
        <p className="text-brand-text-muted text-sm mt-1 max-w-md">
          No tienes recordatorios de pagos pendientes ni cuotas por vencer en los próximos días.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4">
      <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-orange text-black flex items-center justify-center font-extrabold">
            🔔
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">
              Alertas de Vencimiento Activas ({reminders.length})
            </h4>
            <p className="text-xs text-gray-300">
              Se muestran los compromisos de pago que vencen en los próximos 3 días o que ya vencieron.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de tarjetas de notificación */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {reminders.map((reminder) => {
          const schedule = reminder.schedule;
          const debt = schedule?.accountsPayable;
          const supplierName = debt?.supplier?.name || (debt ? `Proveedor #${debt.supplierId}` : 'Proveedor');
          const dueDateStr = schedule?.dueDate || schedule?.scheduleDate || reminder.remindAt;
          const isOverdue = dueDateStr
            ? new Date(dueDateStr) < new Date(new Date().setHours(0, 0, 0, 0))
            : false;

          return (
            <div
              key={reminder.id}
              className={`bg-[#121212] border-l-4 ${
                isOverdue ? 'border-l-red-500' : 'border-l-brand-orange'
              } border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1a1a1a] transition-colors shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl border ${
                    isOverdue
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-white text-base">{supplierName}</span>
                    {schedule?.installmentNumber && (
                      <span className="bg-gray-800 text-gray-300 border border-gray-700 text-xs px-2.5 py-0.5 rounded-lg font-bold">
                        Cuota #{schedule.installmentNumber}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                        isOverdue
                          ? 'bg-red-900/30 text-red-400 border-red-500/30'
                          : 'bg-brand-orange/15 text-brand-orange border-brand-orange/30'
                      }`}
                    >
                      {isOverdue ? 'Vencida' : 'Próxima a vencer'}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm font-medium mt-1">
                    {debt?.concept || `Cuota programada #${reminder.scheduleId}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                    <span className={isOverdue ? 'text-red-400 font-bold' : 'text-brand-orange font-bold'}>
                      📅 Fecha límite de cuota:{' '}
                      {dueDateStr ? new Date(dueDateStr).toLocaleDateString('es-MX') : 'Sin fecha'}
                    </span>
                    {debt && (
                      <span className="text-brand-text-muted">
                        Saldo total de la deuda:{' '}
                        <strong className="text-gray-200 font-mono">
                          ${Number(debt.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-800 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider block">
                    Monto de Cuota
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    ${Number(schedule?.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canAddExpense && debt && schedule && onPayReminder && (
                    <button
                      type="button"
                      onClick={() => onPayReminder(debt, schedule)}
                      className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-500 text-black font-extrabold text-xs transition-all shadow-[0_0_12px_rgba(255,90,0,0.25)] cursor-pointer"
                    >
                      Pagar Cuota
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(reminder.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-colors border border-gray-700 cursor-pointer"
                    title="Ocultar esta alerta"
                  >
                    <span>✓</span> Leído
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
