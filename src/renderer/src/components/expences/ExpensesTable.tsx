// src/components/expenses/ExpensesTable.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Category, Expense } from '../../types/expense';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  refreshTrigger?: number;
  onExpenseChanged?: () => void;
}

export const ExpensesTable: React.FC<Props> = ({ refreshTrigger = 0, onExpenseChanged }) => {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const canDeleteExpense = Boolean((user?.permisos as any)?.EXPENSES?.includes('delete.expenses'));

  // Datos reales del backend
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  // Estado para modal de confirmación de anulación
  const [expenseToCancel, setExpenseToCancel] = useState<Expense | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await expenseService.getCategories(true, token);
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar categorías de egresos:', err);
    }
  }, [token]);

  const loadExpenses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const isActiveParam =
        statusFilter === 'active' ? true : statusFilter === 'cancelled' ? false : undefined;

      const res = await expenseService.getExpenses(
        {
          page: currentPage,
          pageSize: 50,
          isActive: isActiveParam,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
        token
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron cargar los egresos.');
      }

      const paged = json.data;
      setExpenses(paged?.data || []);
      setTotalPages(Math.max(1, paged?.totalPages || 1));
      setTotalItems(paged?.totalItems || 0);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses, refreshTrigger]);

  // Filtrado local rápido por búsqueda y categoría
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategoryId !== 'all' && exp.categoryId !== Number(selectedCategoryId)) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchConcept = (exp.concept || '').toLowerCase().includes(term);
        const matchReceipt = (exp.receiptNumber || '').toLowerCase().includes(term);
        const matchSupplier = (exp.supplier?.name || '').toLowerCase().includes(term);
        return matchConcept || matchReceipt || matchSupplier;
      }
      return true;
    });
  }, [expenses, selectedCategoryId, searchTerm]);

  const totalActiveAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.isActive)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  const handleConfirmCancel = async () => {
    if (!expenseToCancel || !token) return;
    setIsCancelling(true);
    try {
      const res = await expenseService.cancelExpense(expenseToCancel.id, token);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudo anular el egreso.');
      }
      setExpenseToCancel(null);
      await loadExpenses();
      if (onExpenseChanged) onExpenseChanged();
    } catch (err: any) {
      setError(err.message || 'Error al anular el egreso.');
      setExpenseToCancel(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCategoryId('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getCategoryName = (exp: Expense) => {
    if (exp.category?.name) return exp.category.name;
    const found = categories.find((c) => c.id === exp.categoryId);
    return found ? found.name : `Categoría #${exp.categoryId}`;
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4">
      {/* Barra de Filtros y Resumen */}
      <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 flex flex-wrap gap-3 items-end justify-between shrink-0">
        <div className="flex flex-wrap gap-3 items-end flex-1">
          {/* Buscador */}
          <div className="flex flex-col min-w-[200px] flex-1 max-w-xs">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Buscar concepto / folio / proveedor
            </label>
            <input
              type="text"
              placeholder="Ej: CFE, Factura, Truper..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Rango de Fechas */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Desde
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

          {/* Filtro de Categoría */}
          <div className="flex flex-col min-w-[160px]">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Categoría
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-colors cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="flex flex-col min-w-[140px]">
            <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'cancelled');
                setCurrentPage(1);
              }}
              className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-colors cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="cancelled">Anulados</option>
            </select>
          </div>

          {(searchTerm || startDate || endDate || selectedCategoryId !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tarjeta resumen rápido */}
        <div className="bg-[#161616] border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted block">
              Total Egresos Activos
            </span>
            <span className="text-lg font-black text-brand-orange font-mono">
              -${totalActiveAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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

      {/* Contenedor de la Tabla con Scroll Interno */}
      <div className="flex-1 bg-[#121212] rounded-2xl border border-gray-800 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-gray-800">
              <tr className="text-brand-text-muted text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Concepto</th>
                <th className="py-3.5 px-4">Categoría / Proveedor</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4">Comprobante</th>
                <th className="py-3.5 px-4 text-right">Monto</th>
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
                      <span className="text-xs font-bold uppercase tracking-wider">Cargando historial de gastos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-brand-text-muted">
                    No se encontraron egresos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const dateToShow = expense.expenseDate || expense.createdAt;
                  return (
                    <tr
                      key={expense.id}
                      className={`hover:bg-[#1a1a1a]/80 transition-colors ${
                        !expense.isActive ? 'opacity-50 bg-red-950/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap font-mono text-xs">
                        {dateToShow ? new Date(dateToShow).toLocaleDateString('es-MX') : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{expense.concept}</div>
                        {expense.accountsPayableId && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-brand-orange">
                            Abono a Deuda #{expense.accountsPayableId}
                            {expense.scheduleId ? ` (Cuota #${expense.scheduleId})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-gray-800 text-gray-200 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-gray-700">
                          {getCategoryName(expense)}
                        </span>
                        {expense.supplier?.name && (
                          <div className="text-xs text-brand-text-muted mt-1 font-medium">
                            Prov: {expense.supplier.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">{expense.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-xs">
                        {expense.receiptNumber || 'S/N'}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-extrabold text-base whitespace-nowrap ${
                          expense.isActive ? 'text-red-400' : 'text-gray-500 line-through'
                        }`}
                      >
                        -${Number(expense.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {expense.isActive ? (
                          <span className="bg-green-900/25 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                            Activo
                          </span>
                        ) : (
                          <span className="bg-red-900/25 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                            Anulado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {expense.isActive && canDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => setExpenseToCancel(expense)}
                            title="Anular egreso y revertir saldos"
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación */}
        <div className="px-5 py-3 bg-[#161616] border-t border-gray-800 flex items-center justify-between text-xs text-brand-text-muted shrink-0">
          <span>
            Mostrando <strong className="text-white">{filteredExpenses.length}</strong> de{' '}
            <strong className="text-white">{totalItems}</strong> registros
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

      {/* Modal de Confirmación para Anular Egreso */}
      {expenseToCancel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#161616] border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-xl font-bold">
                !
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">¿Anular este egreso?</h3>
                <p className="text-xs text-brand-text-muted">Esta acción quedará registrada en auditoría</p>
              </div>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 space-y-1 text-sm">
              <div className="font-bold text-white">{expenseToCancel.concept}</div>
              <div className="text-red-400 font-mono font-extrabold">
                Monto: ${Number(expenseToCancel.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              {expenseToCancel.accountsPayableId && (
                <p className="text-xs text-brand-orange pt-1">
                  Nota: Este gasto es un abono a la Cuenta por Pagar #{expenseToCancel.accountsPayableId}. Al anularlo, el saldo de la deuda y su cuota se restaurarán automáticamente.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-extrabold cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Anulando...' : 'Sí, Anular Egreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
