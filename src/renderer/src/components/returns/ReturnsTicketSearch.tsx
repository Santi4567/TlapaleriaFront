// src/components/returns/ReturnsTicketSearch.tsx
import React from 'react';
import {
  Search,
  Receipt,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  List,
  ChevronDown,
  ChevronUp,
  ScanLine,
} from 'lucide-react';
import { SaleTicketDetail } from '../../types/finance';
import { formatCurrency, formatDateTime } from './returnsUtils';

interface ReturnsTicketSearchProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchFolio: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  salesResults: SaleTicketDetail[];
  loadingSales: boolean;
  selectedSaleId?: number;
  onSelectTicket: (saleId: number) => void;
  salesTotalItems: number;
  salesPage: number;
  salesTotalPages: number;
  onPageChange: (newPage: number) => void;
  showList: boolean;
  onToggleShowList: () => void;
}

export const ReturnsTicketSearch: React.FC<ReturnsTicketSearchProps> = ({
  searchInputRef,
  searchFolio,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  salesResults,
  loadingSales,
  selectedSaleId,
  onSelectTicket,
  salesTotalItems,
  salesPage,
  salesTotalPages,
  onPageChange,
  showList,
  onToggleShowList,
}) => {
  const isListVisible = showList || searchFolio.trim().length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-6">
      {/* TARJETA PRINCIPAL DEL BUSCADOR */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2 mb-1">
              <ScanLine className="w-4 h-4" />
              1. Buscar Ticket de Venta
            </label>
            <p className="text-gray-400 text-xs md:text-sm">
              Escanea el código de barras del ticket con la pistola o escribe el número de folio.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleShowList}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm border transition-all cursor-pointer self-start sm:self-auto ${
              showList
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-lg shadow-orange-500/10'
                : 'bg-[#121212] hover:bg-gray-800 text-gray-300 border-gray-700 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span>{showList ? 'Ocultar lista de ventas' : 'Mostrar lista de ventas'}</span>
            {showList ? (
              <ChevronUp className="w-4 h-4 ml-0.5" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>

        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchFolio}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Escanea el código o escribe el folio (ej. 8492 o TKT-...)"
            className="w-full bg-[#111111] border-2 border-gray-800 focus:border-orange-500 rounded-2xl pl-12 pr-12 py-3.5 text-base md:text-lg text-white placeholder-gray-500 outline-none font-mono transition-colors shadow-inner"
          />
          {searchFolio && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </form>

        {!isListVisible && (
          <div className="mt-6 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-orange-400" />
              Lectura automática por código de barras lista para recibir folios.
            </span>
            <span className="text-gray-500">
              ¿No tienes el folio a mano? Haz clic en <strong className="text-gray-300">Mostrar lista de ventas</strong> para ver los tickets recientes.
            </span>
          </div>
        )}
      </div>

      {/* SECCIÓN DESPLEGABLE: LISTA DE VENTAS / RESULTADOS */}
      {isListVisible && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col shadow-xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-3 border-b border-gray-800">
            <span className="font-semibold">
              {searchFolio.trim()
                ? `Resultados para "${searchFolio.trim()}"`
                : 'Ventas más recientes'}
            </span>
            <span className="font-mono font-bold text-gray-300">
              {salesTotalItems} {salesTotalItems === 1 ? 'ticket encontrado' : 'tickets encontrados'}
            </span>
          </div>

          {/* Grid / Lista de tickets */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
            {loadingSales ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="text-xs font-bold">Buscando tickets...</span>
              </div>
            ) : salesResults.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-gray-800 rounded-2xl text-gray-500 p-6">
                <Receipt className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-400">No se encontraron tickets con ese folio.</p>
                <p className="text-xs text-gray-600 mt-1">
                  Verifica el folio o intenta con los últimos 4 dígitos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {salesResults.map((sale) => {
                  const isSelected = selectedSaleId === sale.id;
                  return (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() => onSelectTicket(sale.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                          : 'bg-[#121212] hover:bg-white/[0.04] border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm md:text-base text-white truncate group-hover:text-orange-400 transition-colors">
                            {sale.folio}
                          </span>
                          {!sale.isActive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                              Cancelado
                            </span>
                          ) : (sale.discountPercent || 0) >= 100 || (sale.totalAmount || 0) <= 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                              100% Descuento
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                          <span>{formatDateTime(sale.createdAt)}</span>
                          <span>•</span>
                          <span className="truncate">{sale.user?.name || 'Cajero'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-white text-base md:text-lg block">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <span className="text-xs text-orange-400 font-bold flex items-center justify-end gap-1 mt-0.5 group-hover:translate-x-1 transition-transform">
                          Seleccionar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paginación */}
          {salesTotalPages > 1 && (
            <div className="pt-4 mt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <button
                type="button"
                disabled={salesPage <= 1}
                onClick={() => onPageChange(salesPage - 1)}
                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span>
                Pág. <strong className="text-white">{salesPage}</strong> de{' '}
                <strong className="text-white">{salesTotalPages}</strong>
              </span>
              <button
                type="button"
                disabled={salesPage >= salesTotalPages}
                onClick={() => onPageChange(salesPage + 1)}
                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReturnsTicketSearch;
