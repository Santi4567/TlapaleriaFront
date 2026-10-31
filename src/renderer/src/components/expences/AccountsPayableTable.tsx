// src/components/expenses/AccountsPayableTable.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AccountPayable, PaymentSchedule } from '../../types/expense';
import { PaymentScheduleTimeline } from './PaymentScheduleTimeline';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  refreshTrigger?: number;
  onRegisterPayment?: (debt: AccountPayable, schedule?: PaymentSchedule | null) => void;
}

export const AccountsPayableTable: React.FC<Props> = ({
  refreshTrigger = 0,
  onRegisterPayment
}) => {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const canAddExpense = Boolean((user?.permisos as any)?.EXPENSES?.includes('add.expenses'));

  // Datos reales del backend
  const [debts, setDebts] = useState<AccountPayable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar qué fila está expandida viendo sus plazos
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [loadingSchedulesId, setLoadingSchedulesId] = useState<number | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadAccountsPayable = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await expenseService.getAccountsPayable(
        {
          page: currentPage,
          pageSize: 50,
          isActive: true,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
        token
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron cargar las cuentas por pagar.');
      }

      const paged = json.data;
      const list: AccountPayable[] = paged?.data || [];
      setDebts(list);
      setTotalPages(Math.max(1, paged?.totalPages || 1));
      setTotalItems(paged?.totalItems || 0);

      // Si había una fila expandida, recargar sus cuotas actualizadas
      if (expandedRowId) {
        fetchDebtDetail(expandedRowId);
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, startDate, endDate]);

  useEffect(() => {
    loadAccountsPayable();
  }, [loadAccountsPayable, refreshTrigger]);

  const fetchDebtDetail = async (id: number) => {
    if (!token) return;
    setLoadingSchedulesId(id);
    try {
      const res = await expenseService.getAccountPayableById(id, token);
      if (res.ok) {
        const json = await res.json();
        const detail: AccountPayable | undefined = json.data;
        if (detail) {
          const sortedSchedules = [...(detail.paymentSchedules || [])].sort(
            (a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0)
          );
          setDebts((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    balance: detail.balance,
                    status: detail.status,
                    paymentSchedules: sortedSchedules
                  }
                : d
            )
          );
        }
      }
    } catch (err) {
      console.error('Error al cargar el detalle de plazos de la deuda:', err);
    } finally {
      setLoadingSchedulesId(null);
    }
  };

  const toggleExpand = (debt: AccountPayable) => {
    if (expandedRowId === debt.id) {
      setExpandedRowId(null);
      return;
    }
    setExpandedRowId(debt.id);
    if (!debt.paymentSchedules || debt.paymentSchedules.length === 0) {
      fetchDebtDetail(debt.id);
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (statusFilter !== 'all' && (d.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchConcept = (d.concept || '').toLowerCase().includes(term);
        const matchSupplier = (d.supplier?.name || '').toLowerCase().includes(term);
        return matchConcept || matchSupplier;
      }
      return true;
    });
  }, [debts, statusFilter, searchTerm]);

  const totalPendingBalance = useMemo(() => {
    return filteredDebts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
  }, [filteredDebts]);

  const renderStatusBadge = (status: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'pagado') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-green-900/25 text-green-400 border-green-500/30">
          Pagado
        </span>
      );
    }
    if (norm === 'parcial') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-blue-900/25 text-blue-400 border-blue-500/30">
          Parcial
        </span>
      );
    }
    if (norm === 'vencido') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-red-900/25 text-red-400 border-red-500/30">
          Vencido
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-brand-orange/15 text-brand-orange border-brand-orange/30">
        {status || 'Pendiente'}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4">
      {/* Barra de Filtros y Resumen */}
      <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 flex flex-wrap gap-3 items-end justify-between shrink-0">
        <div className="flex flex-wrap gap-3 items-end flex-1">
          {/* Buscador */}
          <div className="flex flex-col min-w-[200px] flex-1 max-w-xs">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Buscar proveedor o factura
            </label>
            <input
              type="text"
              placeholder="Ej: Truper, Factura #1024..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Registrada Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-col min-w-[160px]">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Estado de Deuda
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-colors cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Parcial">Abono Parcial</option>
              <option value="Pagado">Liquidadas (Pagado)</option>
            </select>
          </div>

          {(searchTerm || startDate || endDate || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Resumen de Saldo por Pagar */}
        <div className="bg-[#161616] border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted block">
              Saldo Total Pendiente
            </span>
            <span className="text-lg font-black text-brand-orange font-mono">
              ${totalPendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between shrink-0">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-xs underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Tabla de Deudas */}
      <div className="flex-1 bg-[#121212] rounded-2xl border border-gray-800 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-gray-800">
              <tr className="text-brand-text-muted text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4">Concepto / Factura</th>
                <th className="py-3.5 px-4">Vencimiento</th>
                <th className="py-3.5 px-4 text-right">Total Deuda</th>
                <th className="py-3.5 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-brand-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold uppercase tracking-wider">Cargando cuentas por pagar...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-brand-text-muted">
                    No se encontraron cuentas por pagar con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const isExpanded = expandedRowId === debt.id;
                  const hasBalance = Number(debt.balance) > 0;

                  return (
                    <React.Fragment key={debt.id}>
                      {/* Fila Principal */}
                      <tr
                        onClick={() => toggleExpand(debt)}
                        className={`hover:bg-[#1a1a1a]/90 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-[#1a1a1a]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block text-brand-orange font-bold transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          >
                            ▶
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-white">
                          {debt.supplier?.name || `Proveedor #${debt.supplierId}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-gray-200 font-semibold">{debt.concept}</div>
                          {debt.paymentFrequencyDays && (
                            <span className="text-[11px] text-brand-text-muted">
                              Plan cada {debt.paymentFrequencyDays} días
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                          {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('es-MX') : 'Sin fecha límite'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-gray-400 whitespace-nowrap">
                          ${Number(debt.totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-extrabold text-base whitespace-nowrap ${
                            hasBalance ? 'text-brand-orange' : 'text-green-400'
                          }`}
                        >
                          ${Number(debt.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">{renderStatusBadge(debt.status)}</td>
                        <td
                          className="py-3.5 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {hasBalance && canAddExpense && onRegisterPayment ? (
                            <button
                              type="button"
                              onClick={() => onRegisterPayment(debt, null)}
                              className="px-3.5 py-1.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black font-extrabold text-xs transition-all shadow-[0_0_10px_rgba(255,90,0,0.2)] cursor-pointer"
                            >
                              + Abonar
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500 font-semibold">
                              {hasBalance ? 'Sin permiso' : 'Liquidada'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Fila Expandible (Contiene la línea de tiempo de plazos) */}
                      {isExpanded && (
                        <tr className="bg-[#0e0e0e] border-b border-gray-800">
                          <td colSpan={8} className="p-5">
                            {loadingSchedulesId === debt.id ? (
                              <div className="text-xs text-brand-text-muted py-4 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                                Cargando cronograma de pagos...
                              </div>
                            ) : (
                              <PaymentScheduleTimeline
                                schedules={debt.paymentSchedules || []}
                                canPay={canAddExpense && hasBalance}
                                onPaySchedule={
                                  onRegisterPayment
                                    ? (schedule) => onRegisterPayment(debt, schedule)
                                    : undefined
                                }
                              />
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación */}
        <div className="px-5 py-3 bg-[#161616] border-t border-gray-800 flex items-center justify-between text-xs text-brand-text-muted shrink-0">
          <span>
            Mostrando <strong className="text-white">{filteredDebts.length}</strong> de{' '}
            <strong className="text-white">{totalItems}</strong> cuentas por pagar
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold disabled:opacity-40 cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-2 font-bold text-white">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold disabled:opacity-40 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
