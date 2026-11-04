// src/components/returns/ReturnsHistoryTable.tsx
import React from 'react';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from 'lucide-react';
import { SaleReturnRecord } from '../../types/return';
import {
  formatCurrency,
  formatQty,
  formatDateTime,
} from './returnsUtils';

interface ReturnsHistoryTableProps {
  historySearch: string;
  onSearchChange: (value: string) => void;
  loadingHistory: boolean;
  returnsHistory: SaleReturnRecord[];
  historyTotalItems: number;
  historyPage: number;
  historyPageSize: number;
  historyTotalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onSelectTicketForReturn: (saleId: number) => void;
}

export const ReturnsHistoryTable: React.FC<ReturnsHistoryTableProps> = ({
  historySearch,
  onSearchChange,
  loadingHistory,
  returnsHistory,
  historyTotalItems,
  historyPage,
  historyPageSize,
  historyTotalPages,
  onPageChange,
  onPageSizeChange,
  onSelectTicketForReturn,
}) => {
  return (
    <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 flex flex-col min-h-0 space-y-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">
            Historial General de Devoluciones
          </h2>
          <p className="text-xs text-gray-400">
            Filtra por folio de devolución (<span className="font-mono">DEV-...</span>), folio de ticket original (<span className="font-mono">TKT-...</span>) o motivo.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={historySearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar DEV-..., TKT-... o motivo"
            className="w-full bg-[#121212] border border-gray-800 focus:border-red-500 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
          />
          {historySearch && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-h-[520px] overflow-auto custom-scrollbar border border-gray-800 rounded-2xl">
        {loadingHistory ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-sm font-bold">Cargando historial de devoluciones...</span>
          </div>
        ) : returnsHistory.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <RotateCcw className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="font-semibold">No se encontraron devoluciones registradas.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#141414] border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Folio Devolución</th>
                <th className="py-3.5 px-4 font-semibold">Ticket Original</th>
                <th className="py-3.5 px-4 font-semibold">Fecha y Hora</th>
                <th className="py-3.5 px-4 font-semibold">Autorizó</th>
                <th className="py-3.5 px-4 font-semibold">Motivo</th>
                <th className="py-3.5 px-4 font-semibold">Productos Devueltos</th>
                <th className="py-3.5 px-4 font-semibold text-right text-red-400">
                  Total Reembolsado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {returnsHistory.map((ret) => (
                <tr key={ret.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                    {ret.returnFolio}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectTicketForReturn(ret.saleId)}
                      className="font-mono text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Abrir este ticket en el panel de devoluciones"
                    >
                      {ret.sale?.folio || `Ticket #${ret.saleId}`}
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                    {formatDateTime(ret.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-200">
                    {ret.user?.name || 'Usuario'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-300 max-w-xs">
                    {ret.reason || <span className="text-gray-600 italic">Sin motivo</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      {(ret.details || []).map((det) => (
                        <div
                          key={det.id}
                          className="inline-flex items-center gap-1.5 text-xs bg-[#121212] border border-gray-800 rounded-lg px-2.5 py-1 w-fit"
                        >
                          <span className="font-mono font-bold text-red-400">
                            {formatQty(det.quantityReturned)}x
                          </span>
                          <span className="text-gray-200 font-medium">
                            {det.saleDetail?.productName || `Renglón #${det.saleDetailId}`}
                          </span>
                          <span className="text-gray-500 font-mono">
                            ({formatCurrency(det.refundAmount)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-red-400 text-base whitespace-nowrap">
                    -{formatCurrency(ret.totalRefunded)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Barra de paginación inferior */}
      {historyTotalItems > 0 && (
        <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              Total: <strong className="text-white">{historyTotalItems}</strong> devoluciones
            </span>
            <select
              value={historyPageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#121212] border border-gray-800 rounded-xl px-2.5 py-1.5 text-white font-semibold outline-none cursor-pointer"
            >
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={historyPage <= 1}
              onClick={() => onPageChange(Math.max(1, historyPage - 1))}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-[#121212] border border-gray-800 font-bold text-gray-300">
              Pág. <strong className="text-white">{historyPage}</strong> de{' '}
              <strong className="text-white">{historyTotalPages}</strong>
            </span>
            <button
              type="button"
              disabled={historyPage >= historyTotalPages}
              onClick={() => onPageChange(Math.min(historyTotalPages, historyPage + 1))}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsHistoryTable;
