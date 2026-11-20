// src/components/finance/UserSalesDetailModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Search,
  Package,
  Receipt,
  DollarSign,
  Award,
  RotateCcw,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  CreditCard,
  Banknote,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  UserProductSalesItem,
  UserSalesDetailResponse,
  UserSalesReportItem,
} from '../../types/report';
import { FinancialSaleItem } from '../../types/finance';

interface UserSalesDetailModalProps {
  isOpen: boolean;
  userSummary: UserSalesReportItem | null;
  detail: UserSalesDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

type ModalTab = 'products' | 'tickets';
type SortKey = 'netAmount' | 'realProfitAmount' | 'netQuantity' | 'ticketsCount' | 'productName';
type SortDirection = 'asc' | 'desc';

const UserSalesDetailModal: React.FC<UserSalesDetailModalProps> = ({
  isOpen,
  userSummary,
  detail,
  isLoading,
  error,
  onClose,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyWithReturns, setOnlyWithReturns] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('netAmount');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset al cambiar de usuario
  useEffect(() => {
    setActiveTab('products');
    setSearchTerm('');
    setOnlyWithReturns(false);
    setSortKey('netAmount');
    setSortDir('desc');
    setCurrentPage(1);
  }, [userSummary?.userId, isOpen]);

  // Tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatCurrency = (amount?: number | null) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  const formatQty = (qty?: number | null) =>
    Number(qty || 0).toLocaleString('es-MX', { maximumFractionDigits: 3 });

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return 'Todo el historial';
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    if (start && end) {
      const s = fmt(start);
      const e = fmt(end);
      return s === e ? s : `${s} — ${e}`;
    }
    return start ? `Desde ${fmt(start)}` : `Hasta ${fmt(end!)}`;
  };

  // Filtrado y ordenamiento de productos
  const filteredAndSortedProducts = useMemo(() => {
    const list = detail?.products ?? userSummary?.products ?? [];
    const clean = searchTerm.trim().toLowerCase();

    const filtered = list.filter((item) => {
      if (onlyWithReturns && item.quantityReturned <= 0) return false;
      if (!clean) return true;
      return (
        (item.productName || '').toLowerCase().includes(clean) ||
        (item.internalCode || '').toLowerCase().includes(clean) ||
        (item.presentationName || '').toLowerCase().includes(clean) ||
        (item.brand && item.brand.toLowerCase().includes(clean))
      );
    });

    filtered.sort((a, b) => {
      let valA: string | number = a[sortKey] ?? 0;
      let valB: string | number = b[sortKey] ?? 0;

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB as string);
        return sortDir === 'asc' ? comp : -comp;
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return filtered;
  }, [detail?.products, userSummary?.products, searchTerm, onlyWithReturns, sortKey, sortDir]);

  // Filtrado de tickets
  const filteredTickets = useMemo(() => {
    const list = detail?.sales ?? [];
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return list;

    return list.filter(
      (t) =>
        (t.folio || '').toLowerCase().includes(clean) ||
        (t.customerName && t.customerName.toLowerCase().includes(clean)) ||
        (t.paymentMethod || '').toLowerCase().includes(clean)
    );
  }, [detail?.sales, searchTerm]);

  // Paginación
  const currentListLength = activeTab === 'products' ? filteredAndSortedProducts.length : filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(currentListLength / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedProducts.slice(start, start + pageSize);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  if (!isOpen || !userSummary) return null;

  const currentSummary = detail ?? userSummary;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-6xl max-h-[92vh] bg-[#141414] border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-800 bg-[#181818]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-white">{currentSummary.fullName || currentSummary.userName || currentSummary.username}</h2>
                <span className="text-sm font-semibold text-gray-400">@{currentSummary.username}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Shield className="w-3 h-3" />
                  {currentSummary.roleName || 'Usuario'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>ID #{currentSummary.userId}</span>
                <span>•</span>
                <span className="text-orange-400 font-medium">
                  Periodo: {formatDateRange(detail?.startDate, detail?.endDate)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Pestañas dentro del modal: Productos vs Tickets */}
            <div className="flex items-center bg-[#1a1a1a] p-1 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('products');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'products'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Productos ({filteredAndSortedProducts.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tickets');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'tickets'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Tickets ({filteredTickets.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 4 Tarjetas de Métricas del Usuario */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6 pb-2 bg-[#121212]/50">
          <div className="bg-[#181818] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Venta Neta
            </span>
            <p className="text-2xl font-black text-white mt-1">
              {formatCurrency(currentSummary.netSalesAmount)}
            </p>
            <span className="text-[11px] text-gray-500 mt-0.5">
              Bruto: {formatCurrency(currentSummary.grossSalesAmount)} | Dev: -{formatCurrency(currentSummary.totalRefundedAmount)}
            </span>
          </div>

          <div className="bg-[#181818] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-orange-400" /> Ganancia Real
            </span>
            <p className="text-2xl font-black text-orange-400 mt-1">
              +{formatCurrency(currentSummary.realProfitAmount)}
            </p>
            <span className="text-[11px] text-orange-500/80 mt-0.5">
              Margen: {currentSummary.profitMarginPercent}% sobre venta neta
            </span>
          </div>

          <div className="bg-[#181818] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-purple-400" /> Tickets / Operaciones
            </span>
            <p className="text-2xl font-black text-white mt-1">
              {currentSummary.ticketsCount}
            </p>
            <span className="text-[11px] text-purple-400/80 mt-0.5">
              {formatQty(currentSummary.netQuantitySold)} piezas netas vendidas
            </span>
          </div>

          {/* Desglose de Pagos */}
          <div className="bg-[#181818] border border-gray-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-blue-400" /> Métodos de Pago
            </span>
            <div className="flex flex-col gap-1 mt-1 text-xs">
              {currentSummary.paymentMethodsSummary && currentSummary.paymentMethodsSummary.length > 0 ? (
                currentSummary.paymentMethodsSummary.slice(0, 3).map((pm) => (
                  <div key={pm.method} className="flex justify-between items-center text-gray-300">
                    <span className="text-gray-400">{pm.method}:</span>
                    <span className="font-bold text-white">{formatCurrency(pm.totalAmount)}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-500 text-xs">Sin pagos registrados</span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-6 pt-3 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'products' ? 'Buscar producto, código, presentación...' : 'Buscar ticket por folio o cliente...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-gray-800 focus:border-orange-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeTab === 'products' && (
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={onlyWithReturns}
                  onChange={(e) => {
                    setOnlyWithReturns(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded border-gray-700 bg-gray-900 text-orange-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                Solo con devoluciones
              </label>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#121212] border border-gray-800 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-orange-500"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="h-72 w-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-gray-400 font-medium text-sm">Cargando desglose de ventas...</p>
            </div>
          ) : error ? (
            <div className="h-72 w-full flex flex-col items-center justify-center gap-3">
              <p className="text-red-400 font-medium text-sm">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs"
              >
                Reintentar
              </button>
            </div>
          ) : activeTab === 'products' ? (
            /* TAB 1: PRODUCTOS QUE VENDIÓ */
            paginatedProducts.length === 0 ? (
              <div className="h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl">
                <Package className="w-10 h-10 text-gray-600 mb-2" />
                <p className="text-gray-500 font-medium text-sm">
                  No hay productos que coincidan con la búsqueda.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('productName')}>
                      <div className="flex items-center gap-1.5">
                        Producto / Presentación
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3 px-3 font-semibold text-center cursor-pointer hover:text-white" onClick={() => handleSort('ticketsCount')}>
                      <div className="flex items-center justify-center gap-1">
                        Tickets
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('netQuantity')}>
                      <div className="flex items-center justify-end gap-1">
                        Piezas Netas
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3 px-3 font-semibold text-right">Precio Púb.</th>
                    <th className="py-3 px-3 font-semibold text-right">Costo Prov.</th>
                    <th className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('netAmount')}>
                      <div className="flex items-center justify-end gap-1">
                        Venta Neta
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white text-orange-400" onClick={() => handleSort('realProfitAmount')}>
                      <div className="flex items-center justify-end gap-1">
                        Ganancia
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {paginatedProducts.map((p) => {
                    const hasReturn = p.quantityReturned > 0;
                    return (
                      <tr key={`${p.productId}-${p.presentationId}`} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">{p.productName}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                              <span className="font-mono text-gray-500">[{p.internalCode}]</span>
                              <span>•</span>
                              <span className="text-orange-400/90 font-medium">{p.presentationName}</span>
                              {p.brand && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-500">{p.brand}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {p.ticketsCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-extrabold text-white text-sm">{formatQty(p.netQuantity)}</span>
                            {hasReturn && (
                              <span className="text-[11px] text-amber-400">
                                (Vend: {formatQty(p.quantitySold)} | Dev: -{formatQty(p.quantityReturned)})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right text-gray-300 font-medium">
                          {formatCurrency(p.unitPrice)}
                        </td>

                        <td className="py-3.5 px-3 text-right text-gray-400 font-mono text-xs">
                          {formatCurrency(p.unitSupplierCost)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-extrabold text-white">
                          {formatCurrency(p.netAmount)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-extrabold text-emerald-400">
                          +{formatCurrency(p.realProfitAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            /* TAB 2: TICKETS / HISTORIAL DE VENTAS EMITIDAS */
            paginatedTickets.length === 0 ? (
              <div className="h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl">
                <Receipt className="w-10 h-10 text-gray-600 mb-2" />
                <p className="text-gray-500 font-medium text-sm">
                  No hay tickets que coincidan con la búsqueda.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 font-semibold">Folio</th>
                    <th className="py-3 px-3 font-semibold">Fecha y Hora</th>
                    <th className="py-3 px-3 font-semibold">Cliente</th>
                    <th className="py-3 px-3 font-semibold">Método Pago</th>
                    <th className="py-3 px-3 font-semibold text-center">Arts.</th>
                    <th className="py-3 px-3 font-semibold text-right">Bruto</th>
                    <th className="py-3 px-3 font-semibold text-right text-amber-400">Devolución</th>
                    <th className="py-3 px-3 font-semibold text-right">Neto</th>
                    <th className="py-3 px-3 font-semibold text-right text-orange-400">Ganancia</th>
                    <th className="py-3 px-3 font-semibold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {paginatedTickets.map((t) => (
                    <tr key={t.saleId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-orange-400">{t.folio}</span>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-gray-300">
                        {new Date(t.createdAt).toLocaleString('es-MX', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      <td className="py-3.5 px-3 text-sm text-gray-200">
                        {t.customerName || <span className="text-gray-500 italic">Público General</span>}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300">
                          {t.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center text-xs font-bold text-gray-400">
                        {t.itemsCount}
                      </td>

                      <td className="py-3.5 px-3 text-right font-medium text-gray-300">
                        {formatCurrency(t.grossAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-medium text-amber-400">
                        {t.refundedAmount > 0 ? `-${formatCurrency(t.refundedAmount)}` : '-'}
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-white">
                        {formatCurrency(t.netAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-emerald-400">
                        +{formatCurrency(t.realProfitAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Cancelado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Paginación en pie de modal */}
        <div className="p-4 px-6 border-t border-gray-800 bg-[#161616] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Mostrando {currentListLength === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{' '}
            {Math.min(currentPage * pageSize, currentListLength)} de {currentListLength} registros
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-300 font-bold px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserSalesDetailModal;
