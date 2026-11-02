// src/components/finance/SupplierSalesDetailModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Truck,
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
  Layers,
} from 'lucide-react';
import {
  SupplierProductSalesItem,
  SupplierSalesDetailResponse,
  SupplierSalesReportItem,
} from '../../types/report';

interface SupplierSalesDetailModalProps {
  isOpen: boolean;
  supplierSummary: SupplierSalesReportItem | null;
  detail: SupplierSalesDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

type SortKey = 'supplierAmount' | 'profitAmount' | 'netQuantity' | 'totalChargedClient' | 'productName';
type SortDirection = 'asc' | 'desc';

const SupplierSalesDetailModal: React.FC<SupplierSalesDetailModalProps> = ({
  isOpen,
  supplierSummary,
  detail,
  isLoading,
  error,
  onClose,
  onRetry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyWithReturns, setOnlyWithReturns] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('supplierAmount');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Resetear filtros internos cuando se abre otro proveedor
  useEffect(() => {
    setSearchTerm('');
    setOnlyWithReturns(false);
    setSortKey('supplierAmount');
    setSortDir('desc');
    setCurrentPage(1);
  }, [supplierSummary?.supplierId, isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatQty = (qty: number) =>
    Number(qty).toLocaleString('es-MX', { maximumFractionDigits: 3 });

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

  // Filtrado y ordenamiento en memoria (instantáneo incluso con +1,000 productos)
  const filteredAndSortedProducts = useMemo(() => {
    const list = detail?.products ?? [];
    const clean = searchTerm.trim().toLowerCase();

    const filtered = list.filter((item) => {
      if (onlyWithReturns && item.quantityReturned <= 0) return false;
      if (!clean) return true;

      return (
        item.productName.toLowerCase().includes(clean) ||
        item.internalCode.toLowerCase().includes(clean) ||
        item.presentationName.toLowerCase().includes(clean) ||
        (item.brand && item.brand.toLowerCase().includes(clean))
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'productName') {
        const cmp = a.productName.localeCompare(b.productName, 'es');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const valA = a[sortKey] as number;
      const valB = b[sortKey] as number;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return sorted;
  }, [detail?.products, searchTerm, onlyWithReturns, sortKey, sortDir]);

  // Totales de la búsqueda filtrada actual
  const filteredTotals = useMemo(() => {
    return filteredAndSortedProducts.reduce(
      (acc, item) => {
        acc.netQty += item.netQuantity;
        acc.supplierAmount += item.supplierAmount;
        acc.chargedClient += item.totalChargedClient;
        acc.profitAmount += item.profitAmount;
        return acc;
      },
      { netQty: 0, supplierAmount: 0, chargedClient: 0, profitAmount: 0 }
    );
  }, [filteredAndSortedProducts]);

  // Paginación para no saturar el DOM aunque haya 1,000+ filas
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts: SupplierProductSalesItem[] = useMemo(() => {
    const startIdx = (safePage - 1) * pageSize;
    return filteredAndSortedProducts.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedProducts, safePage, pageSize]);

  const handleSortClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'productName' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  if (!isOpen || !supplierSummary) return null;

  const totalSupplierAmount = detail?.totalSupplierAmount ?? supplierSummary.supplierAmount;
  const totalChargedClient = detail?.totalChargedClient ?? supplierSummary.totalChargedClient;
  const totalProfitAmount = detail?.totalProfitAmount ?? supplierSummary.profitAmount;
  const effectiveTickets = detail?.effectiveTickets ?? supplierSummary.effectiveTickets;
  const returnsCount = (detail?.products ?? []).filter((p) => p.quantityReturned > 0).length;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl h-[90vh] bg-[#141414] border border-gray-800 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. ENCABEZADO FIJO */}
        <div className="px-6 py-5 bg-[#1a1a1a] border-b border-gray-800 flex flex-col gap-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shrink-0">
                #{supplierSummary.supplierId}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {supplierSummary.supplierName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
                    {formatDateRange(detail?.startDate, detail?.endDate)}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">
                  Desglose exacto de productos y presentaciones que integran el corte de este proveedor.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-red-500/20 hover:text-red-400 border border-gray-700 hover:border-red-500/40 text-gray-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 Tarjetas Compactas de Resumen del Proveedor */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#121212] border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 block">
                  Apartar a Proveedor
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {formatCurrency(totalSupplierAmount)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#121212] border border-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Cobrado al Cliente
                </span>
                <span className="text-xl font-extrabold text-gray-100 font-mono">
                  {formatCurrency(totalChargedClient)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#121212] border border-orange-500/25 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block">
                  Tu Ganancia Libre
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  +{formatCurrency(totalProfitAmount)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#121212] border border-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Volumen de Venta
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white">
                    {detail ? detail.products.length : '—'}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">
                    presentaciones en {effectiveTickets} tickets
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTRO Y ORDENAMIENTO */}
        <div className="px-6 py-3.5 bg-[#161616] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            {/* Buscador instantáneo */}
            <div className="relative flex-1 max-w-md min-w-[220px]">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nombre, código interno, presentación o marca..."
                className="w-full pl-10 pr-8 py-2 bg-[#101010] border border-gray-800 focus:border-orange-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
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

            {/* Filtro rápido de productos con devolución */}
            {returnsCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOnlyWithReturns((v) => !v);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyWithReturns
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-[#101010] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Con devoluciones ({returnsCount})
              </button>
            )}
          </div>

          {/* Selector de tamaño de página y contador */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              Mostrando <strong className="text-white">{paginatedProducts.length}</strong> de{' '}
              <strong className="text-white">{totalItems}</strong> productos
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#101010] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value={30}>30 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>

        {/* 3. CUERPO SCROLLABLE CON TABLA DE ALTO RENDIMIENTO */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#111111]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 py-16">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-sm font-bold text-white">
                Calculando desglose de productos vendidos...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 max-w-md">
                <p className="font-bold text-sm mb-1">Error al cargar el desglose</p>
                <p className="text-xs text-red-300/80">{error}</p>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-16">
              <Package className="w-12 h-12 text-gray-700 mb-3" />
              <p className="font-semibold text-base text-gray-400">
                No se encontraron productos con ese criterio.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#181818] border-b border-gray-800 shadow-sm">
                <tr className="text-gray-400 text-[11px] uppercase tracking-wider font-bold select-none">
                  <th
                    onClick={() => handleSortClick('productName')}
                    className="py-3.5 px-5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Producto / Código</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Presentación</th>
                  <th className="py-3.5 px-3 text-center">Tickets</th>
                  <th
                    onClick={() => handleSortClick('netQuantity')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1">
                      <span>Cant. Neta</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3 text-right">Costo Unit.</th>
                  <th className="py-3.5 px-3 text-right">Precio Púb.</th>
                  <th
                    onClick={() => handleSortClick('supplierAmount')}
                    className="py-3.5 px-4 text-right text-amber-400 cursor-pointer hover:text-amber-300 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1">
                      <span>Apartar Proveedor</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortClick('totalChargedClient')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1">
                      <span>Cobrado Cliente</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortClick('profitAmount')}
                    className="py-3.5 px-5 text-right text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1">
                      <span>Tu Ganancia</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {paginatedProducts.map((prod) => {
                  const itemMargin =
                    prod.totalChargedClient > 0
                      ? ((prod.profitAmount / prod.totalChargedClient) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr
                      key={`${prod.productId}-${prod.presentationId}`}
                      className="hover:bg-white/[0.025] transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm leading-snug">
                            {prod.productName}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-orange-400 font-semibold">
                              {prod.internalCode}
                            </span>
                            {prod.brand && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-semibold border border-gray-700/60">
                                {prod.brand}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-800/90 border border-gray-700/60 text-gray-200 font-bold text-xs">
                          {prod.presentationName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Receipt className="w-3 h-3" />
                          {prod.effectiveTickets}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-white text-sm font-mono">
                            {formatQty(prod.netQuantity)}
                          </span>
                          {prod.quantityReturned > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-semibold mt-0.5">
                              <RotateCcw className="w-2.5 h-2.5" />
                              {formatQty(prod.quantitySold)} vend. / -{formatQty(prod.quantityReturned)} dev.
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-xs text-gray-400 whitespace-nowrap">
                        {formatCurrency(prod.unitSupplierCost)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-xs text-gray-300 whitespace-nowrap">
                        {formatCurrency(prod.unitPublicPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold font-mono text-sm">
                          {formatCurrency(prod.supplierAmount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-200 font-mono text-sm whitespace-nowrap">
                        {formatCurrency(prod.totalChargedClient)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold text-emerald-400 font-mono text-sm">
                            +{formatCurrency(prod.profitAmount)}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {itemMargin}% margen
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. PIE DE MODAL FIJO: TOTALES FILTRADOS + PAGINACIÓN */}
        <div className="px-6 py-4 bg-[#1a1a1a] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Resumen de comprobación de los productos listados */}
          <div className="flex flex-wrap items-center gap-5 text-xs">
            <div>
              <span className="text-gray-400 block">Unidades Netas</span>
              <span className="font-black text-white text-sm font-mono">
                {formatQty(filteredTotals.netQty)}
              </span>
            </div>
            <div className="h-7 w-px bg-gray-800 hidden sm:block" />
            <div>
              <span className="text-amber-400/90 font-semibold block">Suma Proveedor</span>
              <span className="font-black text-amber-400 text-base font-mono">
                {formatCurrency(filteredTotals.supplierAmount)}
              </span>
            </div>
            <div className="h-7 w-px bg-gray-800 hidden sm:block" />
            <div>
              <span className="text-gray-400 block">Suma Cobrado</span>
              <span className="font-extrabold text-white text-sm font-mono">
                {formatCurrency(filteredTotals.chargedClient)}
              </span>
            </div>
            <div className="h-7 w-px bg-gray-800 hidden sm:block" />
            <div>
              <span className="text-emerald-400/90 font-semibold block">Suma Ganancia</span>
              <span className="font-black text-emerald-400 text-base font-mono">
                +{formatCurrency(filteredTotals.profitAmount)}
              </span>
            </div>
          </div>

          {/* Controles de Paginación */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-[#111111] border border-gray-800 text-xs font-bold text-gray-300">
              Pág. <strong className="text-white">{safePage}</strong> de{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SupplierSalesDetailModal;
