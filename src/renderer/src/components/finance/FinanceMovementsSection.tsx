// src/components/finance/FinanceMovementsSection.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt,
  RotateCcw,
  Flame,
  Search,
  Eye,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  User,
  Calendar,
  Package,
  ArrowUpDown,
} from 'lucide-react';
import {
  FinancialReportData,
  FinancialSaleItem,
  SaleTicketDetail,
} from '../../types/finance';
import { saleService } from '../../services/saleService';
import { useAuth } from '../../context/AuthContext';

interface FinanceMovementsSectionProps {
  data: FinancialReportData;
}

type ActiveSubTab = 'sales' | 'returns' | 'topProducts';
type TopProductSort = 'netQuantity' | 'netSalesAmount' | 'realProfitAmount';

const FinanceMovementsSection: React.FC<FinanceMovementsSectionProps> = ({ data }) => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<ActiveSubTab>('sales');

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [topProductSort, setTopProductSort] = useState<TopProductSort>('netQuantity');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal de inspección de Ticket individual
  const [selectedSaleSummary, setSelectedSaleSummary] = useState<FinancialSaleItem | null>(null);
  const [ticketDetail, setTicketDetail] = useState<SaleTicketDetail | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketCache, setTicketCache] = useState<Record<number, SaleTicketDetail>>({});

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [subTab, data]);

  // Cerrar el modal del ticket con la tecla Escape
  useEffect(() => {
    if (!selectedSaleSummary) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSaleSummary(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSaleSummary]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatQty = (qty: number) =>
    Number(qty).toLocaleString('es-MX', { maximumFractionDigits: 3 });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const salesList = data.sales ?? [];
  const returnsList = data.returns ?? [];
  const topProductsList = data.topProducts ?? [];

  // 1. Filtrado de Ventas
  const filteredSales = useMemo(() => {
    const clean = searchTerm.trim().toLowerCase();
    return salesList.filter((s) => {
      if (paymentFilter !== 'ALL' && s.paymentMethod !== paymentFilter) return false;
      if (!clean) return true;
      return (
        s.folio.toLowerCase().includes(clean) ||
        s.cashierName.toLowerCase().includes(clean) ||
        (s.paymentReference && s.paymentReference.toLowerCase().includes(clean))
      );
    });
  }, [salesList, searchTerm, paymentFilter]);

  // 2. Filtrado de Devoluciones
  const filteredReturns = useMemo(() => {
    const clean = searchTerm.trim().toLowerCase();
    return returnsList.filter((r) => {
      if (!clean) return true;
      return (
        r.returnFolio.toLowerCase().includes(clean) ||
        r.saleFolio.toLowerCase().includes(clean) ||
        r.userName.toLowerCase().includes(clean) ||
        (r.reason && r.reason.toLowerCase().includes(clean)) ||
        r.items.some((i) => i.productName.toLowerCase().includes(clean))
      );
    });
  }, [returnsList, searchTerm]);

  // 3. Filtrado y Ordenamiento de Productos Más Vendidos
  const filteredTopProducts = useMemo(() => {
    const clean = searchTerm.trim().toLowerCase();
    const filtered = topProductsList.filter((p) => {
      if (!clean) return true;
      return (
        p.productName.toLowerCase().includes(clean) ||
        p.internalCode.toLowerCase().includes(clean) ||
        p.presentationName.toLowerCase().includes(clean) ||
        (p.brand && p.brand.toLowerCase().includes(clean))
      );
    });

    return [...filtered].sort((a, b) => b[topProductSort] - a[topProductSort]);
  }, [topProductsList, searchTerm, topProductSort]);

  // Cálculo de paginación activa
  const totalItems =
    subTab === 'sales'
      ? filteredSales.length
      : subTab === 'returns'
      ? filteredReturns.length
      : filteredTopProducts.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;

  const paginatedSales = filteredSales.slice(startIdx, startIdx + pageSize);
  const paginatedReturns = filteredReturns.slice(startIdx, startIdx + pageSize);
  const paginatedTopProducts = filteredTopProducts.slice(startIdx, startIdx + pageSize);

  const handleInspectTicket = async (saleId: number, summary?: FinancialSaleItem) => {
    const foundSummary = summary ?? salesList.find((s) => s.saleId === saleId) ?? {
      saleId,
      folio: `Ticket #${saleId}`,
      createdAt: new Date().toISOString(),
      cashierName: 'Cajero',
      paymentMethod: '',
      itemsCount: 0,
      grossAmount: 0,
      refundedAmount: 0,
      netAmount: 0,
      realProfitAmount: 0,
      isActive: true,
    };

    setSelectedSaleSummary(foundSummary);

    if (ticketCache[saleId]) {
      setTicketDetail(ticketCache[saleId]);
      return;
    }

    if (!user?.token) return;
    setLoadingTicket(true);
    setTicketDetail(null);

    const res = await saleService.getSaleById(user.token, saleId);
    if (res && res.success && res.data) {
      setTicketDetail(res.data);
      setTicketCache((prev) => ({ ...prev, [saleId]: res.data }));
    }
    setLoadingTicket(false);
  };

  const renderPaymentBadge = (method: string, reference?: string | null) => {
    if (method === 'Efectivo') {
      return (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Banknote className="w-3.5 h-3.5" />
            Efectivo
          </span>
          {reference && (
            <span className="text-[10px] text-gray-500 font-mono">Pagó con: ${reference}</span>
          )}
        </div>
      );
    }
    if (method === 'Tarjeta') {
      return (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <CreditCard className="w-3.5 h-3.5" />
            Tarjeta
          </span>
          {reference && (
            <span className="text-[10px] text-gray-500 font-mono">Ref: {reference}</span>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          {method || 'Transferencia'}
        </span>
        {reference && (
          <span className="text-[10px] text-gray-500 font-mono">Ref: {reference}</span>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
      {/* 1. CABECERA Y PESTAÑAS INTERNAS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-gray-800 pb-5">
        <div className="flex flex-wrap items-center gap-2 bg-[#121212] p-1.5 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => setSubTab('sales')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'sales'
                ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.35)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Ventas del Periodo
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                subTab === 'sales' ? 'bg-black/25 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {salesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('returns')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'returns'
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Devoluciones
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                subTab === 'returns' ? 'bg-black/25 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {returnsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('topProducts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'topProducts'
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            Productos Más Vendidos
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                subTab === 'topProducts' ? 'bg-black/25 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {topProductsList.length}
            </span>
          </button>
        </div>

        {/* Controles de Búsqueda y Filtro según pestaña activa */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {subTab === 'sales' && (
            <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-gray-800 text-xs font-bold">
              {(['ALL', 'Efectivo', 'Tarjeta', 'Transferencia'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPaymentFilter(m);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paymentFilter === m
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m === 'ALL' ? 'Todos' : m}
                </button>
              ))}
            </div>
          )}

          {subTab === 'topProducts' && (
            <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-gray-800 text-xs font-bold">
              <span className="text-gray-500 px-2 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Ordenar:
              </span>
              <button
                type="button"
                onClick={() => {
                  setTopProductSort('netQuantity');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  topProductSort === 'netQuantity'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Más Unidades
              </button>
              <button
                type="button"
                onClick={() => {
                  setTopProductSort('netSalesAmount');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  topProductSort === 'netSalesAmount'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mayor Ingreso
              </button>
              <button
                type="button"
                onClick={() => {
                  setTopProductSort('realProfitAmount');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  topProductSort === 'realProfitAmount'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mayor Ganancia
              </button>
            </div>
          )}

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                subTab === 'sales'
                  ? 'Buscar folio TKT, cajero o ref...'
                  : subTab === 'returns'
                  ? 'Buscar folio DEV, TKT o motivo...'
                  : 'Buscar producto, código o marca...'
              }
              className="w-full pl-10 pr-8 py-2 bg-[#121212] border border-gray-800 focus:border-orange-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTENIDO DE LA PESTAÑA ACTIVA */}
      {subTab === 'sales' && (
        <div className="max-h-[550px] overflow-auto custom-scrollbar">
          {paginatedSales.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl text-gray-500">
              <Receipt className="w-10 h-10 text-gray-700 mb-2" />
              <p className="font-medium">No hay ventas registradas para este criterio en el periodo.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#1a1a1a]">
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Folio</th>
                  <th className="py-3.5 px-4 font-semibold">Fecha y Hora</th>
                  <th className="py-3.5 px-4 font-semibold">Cajero</th>
                  <th className="py-3.5 px-4 font-semibold">Método de Pago</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Renglones</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Bruto</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-red-400">Devuelto</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-emerald-400">Venta Neta</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-orange-400">Ganancia Real</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {paginatedSales.map((sale) => {
                  const isFullReturn = sale.isActive && sale.refundedAmount > 0 && sale.netAmount <= 0.001;
                  const hasPartialReturn = sale.isActive && sale.refundedAmount > 0 && !isFullReturn;
                  return (
                    <tr
                      key={sale.saleId}
                      onClick={() => handleInspectTicket(sale.saleId, sale)}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                        !sale.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {sale.folio}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-400 whitespace-nowrap font-mono">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-200">
                        {sale.cashierName}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderPaymentBadge(sale.paymentMethod, sale.paymentReference)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300">
                          {sale.itemsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-300">
                        {formatCurrency(sale.grossAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {sale.refundedAmount > 0 ? (
                          <span className="text-red-400 font-bold">
                            -{formatCurrency(sale.refundedAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white">
                        {formatCurrency(sale.netAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-orange-400">
                        {sale.isActive ? `+${formatCurrency(sale.realProfitAmount)}` : '$0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {!sale.isActive ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            Cancelada
                          </span>
                        ) : isFullReturn ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            Devolución Total
                          </span>
                        ) : hasPartialReturn ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Dev. Parcial
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Completada
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectTicket(sale.saleId, sale);
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleInspectTicket(sale.saleId, sale)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-orange-500 text-gray-200 hover:text-white border border-gray-700 hover:border-orange-500 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subTab === 'returns' && (
        <div className="max-h-[550px] overflow-auto custom-scrollbar">
          {paginatedReturns.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl text-gray-500">
              <RotateCcw className="w-10 h-10 text-gray-700 mb-2" />
              <p className="font-medium">No se registraron devoluciones en este periodo.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#1a1a1a]">
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Folio Devolución</th>
                  <th className="py-3.5 px-4 font-semibold">Ticket Original</th>
                  <th className="py-3.5 px-4 font-semibold">Fecha y Hora</th>
                  <th className="py-3.5 px-4 font-semibold">Autorizó</th>
                  <th className="py-3.5 px-4 font-semibold">Motivo</th>
                  <th className="py-3.5 px-4 font-semibold">Artículos Devueltos</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Tipo</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-red-400">Reembolsado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {paginatedReturns.map((ret) => (
                  <tr key={ret.returnId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                      {ret.returnFolio}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleInspectTicket(ret.saleId)}
                        className="font-mono text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Ver ticket original"
                      >
                        {ret.saleFolio || `Ticket #${ret.saleId}`}
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {formatDateTime(ret.createdAt)}
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-200">
                      {ret.userName}
                    </td>
                    <td className="py-4 px-4 text-gray-300 text-xs max-w-xs">
                      {ret.reason || <span className="text-gray-600 italic">Sin motivo especificado</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        {ret.items.map((item, idx) => (
                          <div
                            key={`${ret.returnId}-${item.saleDetailId}-${idx}`}
                            className="inline-flex items-center gap-2 text-xs bg-[#121212] border border-gray-800 rounded-lg px-2.5 py-1 w-fit"
                          >
                            <span className="font-bold text-red-400 font-mono">
                              {formatQty(item.quantityReturned)}x
                            </span>
                            <span className="text-gray-200 font-medium">{item.productName}</span>
                            <span className="text-gray-500 font-mono">
                              ({formatCurrency(item.refundAmount)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {ret.isFullCancellation ? (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          Devolución Total
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Parcial
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-extrabold text-red-400 text-base whitespace-nowrap">
                      -{formatCurrency(ret.totalRefunded)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subTab === 'topProducts' && (
        <div className="max-h-[550px] overflow-auto custom-scrollbar">
          {paginatedTopProducts.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl text-gray-500">
              <Flame className="w-10 h-10 text-gray-700 mb-2" />
              <p className="font-medium">No hay productos vendidos en este periodo.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#1a1a1a]">
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4 font-semibold">Producto / Código</th>
                  <th className="py-3.5 px-4 font-semibold">Presentación</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Tickets</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-emerald-400">
                    Unidades Netas
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">Venta Neta</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-orange-400">
                    Ganancia Real
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {paginatedTopProducts.map((prod, idx) => {
                  const rank = startIdx + idx + 1;
                  const rankBadge =
                    rank === 1
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : rank === 2
                      ? 'bg-gray-400/20 text-gray-200 border-gray-400/40'
                      : rank === 3
                      ? 'bg-orange-700/25 text-orange-300 border-orange-600/40'
                      : 'bg-gray-800/80 text-gray-400 border-gray-700';

                  return (
                    <tr
                      key={`${prod.productId}-${prod.presentationId}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border font-black text-xs font-mono ${rankBadge}`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{prod.productName}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-orange-400 font-semibold">
                              {prod.internalCode}
                            </span>
                            {prod.brand && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold">
                                {prod.brand}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 font-bold text-xs">
                          {prod.presentationName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Receipt className="w-3 h-3" />
                          {prod.ticketsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-white text-base font-mono">
                            {formatQty(prod.netQuantity)}
                          </span>
                          {prod.quantityReturned > 0 && (
                            <span className="text-[10px] text-red-400 font-semibold">
                              ({formatQty(prod.quantitySold)} vend. / -{formatQty(prod.quantityReturned)} dev.)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-200 text-base">
                        {formatCurrency(prod.netSalesAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-orange-400 text-base">
                        +{formatCurrency(prod.realProfitAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 3. BARRA DE PAGINACIÓN INFERIOR */}
      {totalItems > 0 && (
        <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              Mostrando{' '}
              <strong className="text-white">
                {startIdx + 1} - {Math.min(startIdx + pageSize, totalItems)}
              </strong>{' '}
              de <strong className="text-white">{totalItems}</strong> registros
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#121212] border border-gray-800 rounded-xl px-2.5 py-1.5 text-white font-semibold outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-[#121212] border border-gray-800 font-bold text-gray-300">
              Pág. <strong className="text-white">{safePage}</strong> de{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. MODAL PARA INSPECCIONAR LOS PRODUCTOS DE UN TICKET (Portal en document.body para centrar siempre en pantalla) */}
      {selectedSaleSummary &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedSaleSummary(null)}
          >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-[#141414] border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Ticket */}
            <div className="px-6 py-5 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white font-mono">
                    {ticketDetail?.folio || selectedSaleSummary.folio}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateTime(ticketDetail?.createdAt || selectedSaleSummary.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {ticketDetail?.user?.name || selectedSaleSummary.cashierName}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSaleSummary(null)}
                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Renglones del Ticket */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {loadingTicket ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <span className="text-sm font-bold">Cargando productos del ticket...</span>
                </div>
              ) : ticketDetail && ticketDetail.details?.length > 0 ? (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="py-2.5 px-3">Producto / Presentación</th>
                      <th className="py-2.5 px-3 text-right">Cantidad</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {ticketDetail.details.map((line) => (
                      <tr key={line.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-2">
                            <Package className="w-4 h-4 text-orange-400 shrink-0" />
                            <span>{line.productName}</span>
                          </div>
                          {line.brand && (
                            <span className="text-[11px] text-gray-500 ml-6 block">
                              Marca: {line.brand}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatQty(line.quantity)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-300">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400/90 text-xs">
                          {formatCurrency(line.supplierPriceAtSale)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                          {formatCurrency(line.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No se encontraron detalles para este ticket.
                </div>
              )}
            </div>

            {/* Pie del Ticket */}
            <div className="px-6 py-4 bg-[#1a1a1a] border-t border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                {renderPaymentBadge(
                  ticketDetail?.paymentMethod || selectedSaleSummary.paymentMethod,
                  ticketDetail?.paymentReference ?? selectedSaleSummary.paymentReference
                )}
              </div>
              <div className="flex items-center gap-6 text-right">
                {(ticketDetail?.discountAmount || 0) > 0 && (
                  <div>
                    <span className="text-[11px] text-emerald-400 uppercase font-bold block">
                      Descuento{(ticketDetail?.discountPercent || 0) > 0 ? ` (${ticketDetail?.discountPercent}%)` : ''}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      -{formatCurrency(ticketDetail!.discountAmount!)}
                    </span>
                  </div>
                )}
                {selectedSaleSummary.refundedAmount > 0 && (
                  <div>
                    <span className="text-[11px] text-red-400 uppercase font-bold block">
                      Devuelto
                    </span>
                    <span className="font-mono font-bold text-red-400 text-sm">
                      -{formatCurrency(selectedSaleSummary.refundedAmount)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[11px] text-gray-400 uppercase font-bold block">
                    Total Ticket
                  </span>
                  <span className="font-mono font-black text-white text-xl">
                    {formatCurrency(ticketDetail?.totalAmount ?? selectedSaleSummary.grossAmount)}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FinanceMovementsSection;
