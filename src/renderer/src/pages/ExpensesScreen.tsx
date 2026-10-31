import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpensesTable } from '../components/expences/ExpensesTable';
import { AccountsPayableTable } from '../components/expences/AccountsPayableTable';
import { RemindersTable, getReadReminderIds } from '../components/expences/RemindersTable';
import { ExpenseCreateModal } from '../components/expences/ExpenseCreateModal';
import { AccountPayableCreateModal } from '../components/expences/AccountPayableCreateModal';
import { AccountPayable, PaymentReminder, PaymentSchedule } from '../types/expense';
import { expenseService } from '../services/expenseService';

type TabType = 'expenses' | 'debts' | 'reminders';

export const ExpensesScreen: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const canAddExpense = Boolean((user?.permisos as any)?.EXPENSES?.includes('add.expenses'));

  const [activeTab, setActiveTab] = useState<TabType>('expenses');

  // Estados para controlar la apertura de los modales
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  // Deuda y cuota preseleccionadas cuando se abre el modal desde "Abonar" o "Pagar Cuota"
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<AccountPayable | null>(null);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState<PaymentSchedule | null>(null);

  // Contador real de recordatorios pendientes y disparador de recarga
  const [pendingRemindersCount, setPendingRemindersCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Cargar el número real de recordatorios pendientes para el badge de la pestaña
  const loadPendingRemindersCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await expenseService.getPendingReminders(token);
      if (res.ok) {
        const json = await res.json();
        const readIds = getReadReminderIds();
        const list: PaymentReminder[] = json.data || [];
        const activeCount = list.filter((rem) => {
          if (readIds.includes(rem.id)) return false;
          const st = (rem.schedule?.status || '').toLowerCase();
          return st !== 'pagado' && st !== 'cancelada';
        }).length;
        setPendingRemindersCount(activeCount);
      }
    } catch (err) {
      console.error('Error al consultar contador de recordatorios:', err);
    }
  }, [token]);

  useEffect(() => {
    loadPendingRemindersCount();
  }, [loadPendingRemindersCount, refreshTrigger]);

  const handleOpenNewExpense = () => {
    setSelectedDebtForPayment(null);
    setSelectedScheduleForPayment(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenDebtPayment = (debt: AccountPayable, schedule?: PaymentSchedule | null) => {
    setSelectedDebtForPayment(debt);
    setSelectedScheduleForPayment(schedule || null);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-800 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Gestión de Egresos y Deudas
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            Controla tus gastos operativos, cuentas por pagar a proveedores y alertas de vencimiento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Pestañas (Tabs) */}
          <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-brand-orange text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Historial de Gastos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('debts')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'debts'
                  ? 'bg-brand-orange text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cuentas por Pagar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-brand-orange text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Recordatorios
              {pendingRemindersCount > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                    activeTab === 'reminders'
                      ? 'bg-black text-brand-orange'
                      : 'bg-red-500 text-white animate-pulse'
                  }`}
                >
                  {pendingRemindersCount}
                </span>
              )}
            </button>
          </div>

          {/* Botones de Acción Dinámicos */}
          {canAddExpense && activeTab === 'expenses' && (
            <button
              type="button"
              onClick={handleOpenNewExpense}
              className="bg-brand-orange hover:bg-orange-500 text-black px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer"
            >
              <span>+</span> Registrar Gasto
            </button>
          )}

          {canAddExpense && activeTab === 'debts' && (
            <button
              type="button"
              onClick={() => setIsDebtModalOpen(true)}
              className="bg-brand-orange hover:bg-orange-500 text-black px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer"
            >
              <span>+</span> Nueva Deuda
            </button>
          )}
        </div>
      </div>

      {/* Contenedor Dinámico de la Vista */}
      <div className="flex-1 min-h-0 pt-6 flex flex-col overflow-hidden">
        {activeTab === 'expenses' && (
          <ExpensesTable
            refreshTrigger={refreshTrigger}
            onExpenseChanged={triggerRefresh}
          />
        )}
        {activeTab === 'debts' && (
          <AccountsPayableTable
            refreshTrigger={refreshTrigger}
            onRegisterPayment={handleOpenDebtPayment}
          />
        )}
        {activeTab === 'reminders' && (
          <RemindersTable
            refreshTrigger={refreshTrigger}
            onCountChange={setPendingRemindersCount}
            onPayReminder={(debt, schedule) => handleOpenDebtPayment(debt, schedule)}
          />
        )}
      </div>

      {/* Modales */}
      <ExpenseCreateModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedDebtForPayment(null);
          setSelectedScheduleForPayment(null);
        }}
        onSuccess={triggerRefresh}
        initialDebt={selectedDebtForPayment}
        initialSchedule={selectedScheduleForPayment}
      />

      <AccountPayableCreateModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSuccess={triggerRefresh}
      />
    </div>
  );
};

export default ExpensesScreen;
