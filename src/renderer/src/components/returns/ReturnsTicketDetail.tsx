// src/components/returns/ReturnsTicketDetail.tsx
import React, { useMemo, useState } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Package,
  User,
  Calendar,
  Loader2,
  Sparkles,
  History,
  CheckCheck,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { SaleTicketDetail, SaleTicketDetailLine } from '../../types/finance';
import { SaleReturnRecord } from '../../types/return';
import {
  QUICK_REASONS,
  formatCurrency,
  formatQty,
  formatDateTime,
} from './returnsUtils';

interface ReturnsTicketDetailProps {
  loadingTicketDetail: boolean;
  selectedSale: SaleTicketDetail | null;
  lastCreatedReturn: SaleReturnRecord | null;
  errorMessage: string | null;
  previousReturns: SaleReturnRecord[];
  canAddReturns: boolean;
  returnQuantities: Record<number, number>;
  onQuantityChange: (
    saleDetailId: number,
    newVal: number,
    maxAvailable: number,
    allowDecimals: boolean
  ) => void;
  onSelectAllAvailable: () => void;
  onClearSelection: () => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  submittingReturn: boolean;
  onSubmitReturn: () => void;
  onBackToSearch: () => void;
}

// Precio unitario REAL pagado (subtotal neto / cantidad). Refleja el descuento prorrateado del ticket.
const effectiveUnitPrice = (line: SaleTicketDetailLine): number =>
  line.quantity > 0 && line.subtotal != null ? line.subtotal / line.quantity : line.unitPrice;

export const ReturnsTicketDetail: React.FC<ReturnsTicketDetailProps> = ({
  loadingTicketDetail,
  selectedSale,
  lastCreatedReturn,
  errorMessage,
  previousReturns,
  canAddReturns,
  returnQuantities,
  onQuantityChange,
  onSelectAllAvailable,
  onClearSelection,
  reason,
  onReasonChange,
  submittingReturn,
  onSubmitReturn,
  onBackToSearch,
}) => {
  // Modo de devolución: por producto (cantidades) o ticket completo
  const [returnMode, setReturnMode] = useState<'product' | 'full'>('product');

  const handleModeChange = (mode: 'product' | 'full') => {
    setReturnMode(mode);
    if (mode === 'full') onSelectAllAvailable();
    else onClearSelection();
  };

  const saleLines = useMemo(() => {
    return (
      selectedSale?.details ||
      (selectedSale as any)?.saleDetails ||
      []
    ) as SaleTicketDetailLine[];
  }, [selectedSale]);

  // Cantidad devuelta previamente por cada SaleDetailId
  const alreadyReturnedByDetailId = useMemo(() => {
    const map: Record<number, number> = {};
    for (const ret of previousReturns) {
      for (const det of ret.details || []) {
        map[det.saleDetailId] = (map[det.saleDetailId] || 0) + det.quantityReturned;
      }
    }
    return map;
  }, [previousReturns]);

  const totalPreviouslyRefunded = useMemo(() => {
    return previousReturns.reduce((acc, r) => acc + (r.totalRefunded || 0), 0);
  }, [previousReturns]);

  // Saber si todos los productos del ticket ya fueron devueltos en su totalidad
  const isFullyReturned = useMemo(() => {
    if (saleLines.length === 0) return false;
    return saleLines.every((line) => {
      const alreadyReturned = alreadyReturnedByDetailId[line.id] || 0;
      return alreadyReturned >= line.quantity;
    });
  }, [saleLines, alreadyReturnedByDetailId]);

  // Saber si la venta fue una cortesía o con 100% de descuento (Total $0.00)
  const isZeroAmountSale = useMemo(() => {
    if (!selectedSale) return false;
    return (
      (selectedSale.discountPercent || 0) >= 100 ||
      (selectedSale.totalAmount || 0) <= 0
    );
  }, [selectedSale]);

  // Dinero que aún se puede reembolsar de un renglón (subtotal neto - lo ya reembolsado)
  const remainingRefundOfLine = (line: SaleTicketDetailLine): number => {
    let refunded = 0;
    for (const ret of previousReturns) {
      for (const det of ret.details || []) {
        if (det.saleDetailId === line.id) refunded += det.refundAmount || 0;
      }
    }
    const net = line.subtotal ?? line.quantity * line.unitPrice;
    return Math.max(0, Math.round((net - refunded) * 100) / 100);
  };

  // Resumen del reembolso actual seleccionado
  const currentRefundSummary = useMemo(() => {
    if (saleLines.length === 0) return { itemsCount: 0, totalUnits: 0, totalRefund: 0 };
    let itemsCount = 0;
    let totalUnits = 0;
    let totalRefund = 0;

    for (const line of saleLines) {
      const qty = returnQuantities[line.id] || 0;
      if (qty > 0) {
        itemsCount += 1;
        totalUnits += qty;
        // Si se devuelve todo lo que queda del renglón, se reembolsa el remanente exacto (igual que el backend)
        const alreadyRetLine = alreadyReturnedByDetailId[line.id] || 0;
        const availableLine = Math.max(0, Number((line.quantity - alreadyRetLine).toFixed(3)));
        totalRefund += qty === availableLine
          ? remainingRefundOfLine(line)
          : Math.round(qty * effectiveUnitPrice(line) * 100) / 100;
      }
    }

    return { itemsCount, totalUnits, totalRefund };
  }, [saleLines, returnQuantities, alreadyReturnedByDetailId, previousReturns]);

  if (loadingTicketDetail) {
    return (
      <div className="w-full bg-[#1a1a1a] border border-gray-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-gray-400 shadow-xl">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="font-bold text-sm">Cargando productos e historial del ticket...</p>
      </div>
    );
  }

  if (!selectedSale) {
    return (
      <div className="w-full bg-[#1a1a1a] border border-gray-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2">
          No hay ticket seleccionado
        </h3>
        <p className="text-gray-400 text-sm max-w-md mb-6">
          Busca un ticket de venta para ver los productos comprados y elegir cuáles devolver.
        </p>
        <button
          type="button"
          onClick={onBackToSearch}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir al buscador de tickets
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col space-y-6 shadow-xl">
      {/* BARRA SUPERIOR: BOTÓN VOLVER Y REFERENCIA */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <button
          type="button"
          onClick={onBackToSearch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#121212] hover:bg-gray-800 text-gray-300 hover:text-white text-xs md:text-sm font-bold border border-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-400" />
          <span>← Buscar otro ticket</span>
        </button>

        <span className="text-xs text-gray-400 hidden sm:inline">
          Mostrando productos vendidos en la venta <strong className="text-white font-mono">{selectedSale.folio}</strong>
        </span>
      </div>

      {/* BANNER DE ÉXITO */}
      {lastCreatedReturn && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-extrabold text-emerald-300 text-sm">
                ¡Devolución registrada con éxito! Folio:{' '}
                <span className="font-mono text-white underline">
                  {lastCreatedReturn.returnFolio}
                </span>
              </h4>
              <p className="text-xs text-gray-300 mt-0.5">
                El stock fue reintegrado al almacén y se registró el movimiento en el Kardex.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 bg-black/40 px-4 py-2 rounded-xl border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              Monto Reembolsado
            </span>
            <span className="font-mono font-black text-lg text-white">
              {formatCurrency(lastCreatedReturn.totalRefunded)}
            </span>
          </div>
        </div>
      )}

      {/* MENSAJE DE ERROR */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-300 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CABECERA DEL TICKET SELECCIONADO */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-black text-xl md:text-2xl text-white">
              {selectedSale.folio}
            </span>
            {!selectedSale.isActive ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                Ticket Cancelado (Anulado)
              </span>
            ) : isZeroAmountSale ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                100% Descuento (No Retornable)
              </span>
            ) : isFullyReturned ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Devolución Total (100% Reembolsado)
              </span>
            ) : totalPreviouslyRefunded > 0 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Con Devolución Parcial Previa
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Ticket Activo
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400 mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-400" />
              {formatDateTime(selectedSale.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-orange-400" />
              Cajero: <strong className="text-gray-200">{selectedSale.user?.name || 'General'}</strong>
            </span>
            <span>
              Pago: <strong className="text-gray-200">{selectedSale.paymentMethod}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {(selectedSale.discountAmount || 0) > 0 && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Descuento aplicado{(selectedSale.discountPercent || 0) > 0 ? ` (${selectedSale.discountPercent}%)` : ''}
              </span>
              <span className="font-mono font-bold text-emerald-400 text-lg">
                -{formatCurrency(selectedSale.discountAmount || 0)}
              </span>
            </div>
          )}
          {totalPreviouslyRefunded > 0 && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-red-400 block">
                Ya Devuelto Antes
              </span>
              <span className="font-mono font-bold text-red-400 text-lg">
                -{formatCurrency(totalPreviouslyRefunded)}
              </span>
            </div>
          )}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Total Pagado
            </span>
            <span className="font-mono font-black text-white text-2xl">
              {formatCurrency(selectedSale.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE ARTÍCULOS VENDIDOS EN ESTE TICKET (SOLO LECTURA) */}
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-400" />
          Artículos vendidos en este ticket ({saleLines.length})
        </h4>
        <div className="w-full border border-gray-800 rounded-2xl overflow-x-auto bg-[#121212]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[#141414] border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Producto</th>
                <th className="py-3.5 px-3 font-semibold">Marca</th>
                <th className="py-3.5 px-3 font-semibold text-center">Cant. vendida</th>
                <th className="py-3.5 px-3 font-semibold text-right">Precio Unit.</th>
                <th className="py-3.5 px-3 font-semibold text-right">Subtotal</th>
                <th className="py-3.5 px-3 font-semibold text-center">Ya devuelto</th>
                <th className="py-3.5 px-4 font-semibold text-center text-emerald-400">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {saleLines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-semibold text-sm">
                    No se encontraron productos registrados en este ticket.
                  </td>
                </tr>
              ) : (
                saleLines.map((line) => {
                  const alreadyRet = alreadyReturnedByDetailId[line.id] || 0;
                  const available = Math.max(0, Number((line.quantity - alreadyRet).toFixed(3)));
                  return (
                    <tr key={`sold-${line.id}`} className={available === 0 ? 'opacity-50' : ''}>
                      <td className="py-3.5 px-4 font-bold text-white">{line.productName}</td>
                      <td className="py-3.5 px-3 text-gray-400 text-xs">{line.brand || '—'}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-200">
                        {formatQty(line.quantity)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-gray-300">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(line.subtotal ?? line.quantity * line.unitPrice)}
                        {(line.discountAmount || 0) > 0 && (
                          <span className="block text-[10px] text-emerald-400 font-semibold">
                            desc. -{formatCurrency(line.discountAmount || 0)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">
                        {alreadyRet > 0 ? (
                          <span className="text-red-400 font-bold">{formatQty(alreadyRet)}</span>
                        ) : (
                          <span className="text-gray-600">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-emerald-400">
                        {formatQty(available)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AVISO CUANDO EL TICKET YA FUE DEVUELTO AL 100% */}
      {selectedSale.isActive && isFullyReturned && !isZeroAmountSale && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-sm text-purple-200 flex items-center gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <span className="font-bold block text-purple-300">Ticket con Devolución Total</span>
            <span className="text-xs text-purple-200/80">
              Todos los artículos de esta venta ya fueron devueltos en su totalidad. No quedan unidades disponibles para reembolsar.
            </span>
          </div>
        </div>
      )}

      {/* AVISO CUANDO EL TICKET TIENE 100% DE DESCUENTO O TOTAL $0 */}
      {selectedSale.isActive && isZeroAmountSale && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-sm text-amber-200 flex items-start gap-4 shadow-lg">
          <span className="text-3xl shrink-0">⚠️</span>
          <div className="space-y-1">
            <span className="font-extrabold text-base block text-amber-300">
              Venta con 100% de Descuento (Cortesía / Total $0.00)
            </span>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Este ticket no tuvo costo monetario para el cliente al haberse aplicado el 100% de descuento. 
              Por políticas comerciales y consistencia financiera, las ventas de cortesía no admiten devoluciones ni reembolsos en caja.
            </p>
          </div>
        </div>
      )}

      {/* SELECTOR DE MODO DE DEVOLUCIÓN */}
      {selectedSale.isActive && canAddReturns && !isFullyReturned && !isZeroAmountSale && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
            2. ¿Qué deseas devolver?
          </span>
          <div className="flex items-center gap-1.5 bg-[#121212] p-1.5 rounded-2xl border border-gray-800">
            <button
              type="button"
              onClick={() => handleModeChange('product')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                returnMode === 'product'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              Por producto
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('full')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                returnMode === 'full'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              Todo el ticket
            </button>
          </div>
        </div>
      )}

      {selectedSale.isActive && canAddReturns && !isZeroAmountSale && returnMode === 'full' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-200">
          Se devolverán todas las unidades disponibles del ticket
          ({formatQty(currentRefundSummary.totalUnits)} uds. en {currentRefundSummary.itemsCount} renglones)
          por un reembolso de <strong className="font-mono">{formatCurrency(currentRefundSummary.totalRefund)}</strong>.
        </div>
      )}

      {/* TABLA DE SELECCIÓN DE CANTIDADES A DEVOLVER */}
      {selectedSale.isActive && canAddReturns && !isZeroAmountSale && (
        <div
          className={`w-full border border-gray-800 rounded-2xl overflow-x-auto bg-[#121212] ${
            returnMode === 'product' ? '' : 'hidden'
          }`}
        >
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#141414] border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Producto / Presentación</th>
              <th className="py-3.5 px-3 font-semibold text-right">Precio Unit.</th>
              <th className="py-3.5 px-3 font-semibold text-center">Comprado</th>
              <th className="py-3.5 px-3 font-semibold text-center">Ya Devuelto</th>
              <th className="py-3.5 px-3 font-semibold text-center text-emerald-400">
                Disponible
              </th>
              <th className="py-3.5 px-4 font-semibold text-center text-orange-400">
                Cant. a Devolver
              </th>
              <th className="py-3.5 px-4 font-semibold text-right text-red-400">
                Reembolso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {saleLines.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500 font-semibold text-sm">
                  No se encontraron productos registrados en este ticket.
                </td>
              </tr>
            ) : (
              saleLines.map((line) => {
                const alreadyRet = alreadyReturnedByDetailId[line.id] || 0;
                const available = Math.max(
                  0,
                  Number((line.quantity - alreadyRet).toFixed(3))
                );
                const selectedQty = returnQuantities[line.id] || 0;
                const refundLine =
                  selectedQty > 0 && selectedQty === available
                    ? remainingRefundOfLine(line)
                    : Math.round(selectedQty * effectiveUnitPrice(line) * 100) / 100;
                const hasDecimals = line.quantity % 1 !== 0;

                return (
                  <tr
                    key={line.id}
                    className={`transition-colors ${
                      selectedQty > 0
                        ? 'bg-orange-500/[0.07]'
                        : available === 0
                        ? 'opacity-50 bg-black/20'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>{line.productName}</span>
                      </div>
                      {line.brand && (
                        <span className="text-xs text-gray-500 ml-6 block">
                          Marca: {line.brand}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-gray-300">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-300">
                      {formatQty(line.quantity)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {alreadyRet > 0 ? (
                        <span className="text-red-400 font-bold">
                          {formatQty(alreadyRet)}
                        </span>
                      ) : (
                        <span className="text-gray-600">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-extrabold text-emerald-400">
                      {formatQty(available)}
                    </td>
                    <td className="py-3.5 px-4">
                      {available > 0 && selectedSale.isActive && canAddReturns ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onQuantityChange(
                                line.id,
                                selectedQty - 1,
                                available,
                                true
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={available}
                            step={hasDecimals ? '0.001' : '1'}
                            value={selectedQty === 0 ? '' : selectedQty}
                            placeholder="0"
                            onChange={(e) =>
                              onQuantityChange(
                                line.id,
                                parseFloat(e.target.value),
                                available,
                                true
                              )
                            }
                            className="w-24 bg-[#111111] border border-gray-700 focus:border-orange-500 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onQuantityChange(
                                line.id,
                                selectedQty + 1,
                                available,
                                true
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onQuantityChange(line.id, available, available, true)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white text-xs font-extrabold transition-colors cursor-pointer"
                            title="Devolver todas las unidades disponibles de este renglón"
                          >
                            Máx
                          </button>
                        </div>
                      ) : (
                        <span className="block text-center text-xs text-gray-500 font-semibold">
                          Sin unidades disponibles
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-base">
                      {refundLine > 0 ? (
                        <span className="text-red-400">-{formatCurrency(refundLine)}</span>
                      ) : (
                        <span className="text-gray-600">$0.00</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* FORMULARIO DE MOTIVO Y CONFIRMACIÓN */}
      {selectedSale.isActive && canAddReturns && !isFullyReturned && !isZeroAmountSale && (
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 md:p-6 space-y-4">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-gray-300 block mb-2">
              3. Motivo de la Devolución
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_REASONS.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => onReasonChange(qr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    reason === qr
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {qr}
                </button>
              ))}
            </div>
            <input
              type="text"
              maxLength={255}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Escribe el motivo de la devolución (ej. Producto defectuoso, cambio de pieza...)"
              className="w-full bg-[#1a1a1a] border border-gray-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <div>
                <span className="text-xs text-gray-400 block">Artículos a devolver</span>
                <span className="font-mono font-extrabold text-white text-xl">
                  {formatQty(currentRefundSummary.totalUnits)} uds. ({currentRefundSummary.itemsCount} renglones)
                </span>
              </div>
              <div>
                <span className="text-xs text-red-400 font-bold uppercase block">
                  Total a Reembolsar al Cliente
                </span>
                <span className="font-mono font-black text-2xl md:text-3xl text-red-400">
                  {formatCurrency(currentRefundSummary.totalRefund)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={submittingReturn || currentRefundSummary.itemsCount === 0}
              onClick={onSubmitReturn}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-sm md:text-base shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submittingReturn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando Devolución...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Confirmar Devolución y Reintegrar Stock
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* HISTORIAL DE DEVOLUCIONES PREVIAS DE ESTE TICKET */}
      {previousReturns.length > 0 && (
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-red-400" />
            Devoluciones Registradas en este Ticket ({previousReturns.length})
          </h4>
          <div className="space-y-2.5">
            {previousReturns.map((ret) => (
              <div
                key={ret.id}
                className="p-3.5 rounded-xl bg-[#1a1a1a] border border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-400">
                      {ret.returnFolio}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{formatDateTime(ret.createdAt)}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300 font-semibold">
                      Autorizó: {ret.user?.name || 'Usuario'}
                    </span>
                  </div>
                  <p className="text-gray-400 mt-1">
                    Motivo: <span className="text-gray-200">{ret.reason || 'Sin motivo'}</span>
                  </p>
                </div>
                <div className="font-mono font-extrabold text-red-400 text-sm">
                  -{formatCurrency(ret.totalRefunded)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsTicketDetail;
