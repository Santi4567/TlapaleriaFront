// src/components/returns/ReturnsWorkspace.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  RotateCcw,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Package,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  History,
  ArrowRight,
  CheckCheck,
  Trash2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saleService } from '../../services/saleService';
import { returnService } from '../../services/returnService';
import { SaleTicketDetail } from '../../types/finance';
import { SaleReturnRecord } from '../../types/return';

interface ReturnsWorkspaceProps {
  isModal?: boolean;
  onCloseModal?: () => void;
  initialFolio?: string;
}

const QUICK_REASONS = [
  'Producto defectuoso o dañado',
  'Cambio de medida / presentación',
  'Error de captura en caja',
  'Cliente canceló su compra',
];

const ReturnsWorkspace: React.FC<ReturnsWorkspaceProps> = ({
  isModal = false,
  onCloseModal,
  initialFolio = '',
}) => {
  const { user } = useAuth();
  const token = user?.token || '';

  const checkPermission = (categoria: string, permiso: string) => {
    const userPerms = (user as any)?.permisos;
    if (!userPerms) return true;
    return userPerms[categoria]?.includes(permiso) || false;
  };

  const canAddReturns = checkPermission('RETURNS', 'add.returns');
  const canViewReturns = checkPermission('RETURNS', 'view.returns');

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // =========================================================================
  // ESTADOS PESTAÑA 1: BUSCADOR DE TICKET Y GENERACIÓN DE DEVOLUCIÓN
  // =========================================================================
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchFolio, setSearchFolio] = useState(initialFolio);
  const [salesResults, setSalesResults] = useState<SaleTicketDetail[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesTotalItems, setSalesTotalItems] = useState(0);

  // Ticket seleccionado para devolver
  const [selectedSale, setSelectedSale] = useState<SaleTicketDetail | null>(null);
  const [previousReturns, setPreviousReturns] = useState<SaleReturnRecord[]>([]);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  // Mapa: saleDetailId -> cantidad a devolver seleccionada por el cajero
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCreatedReturn, setLastCreatedReturn] = useState<SaleReturnRecord | null>(null);

  // =========================================================================
  // ESTADOS PESTAÑA 2: HISTORIAL DE DEVOLUCIONES
  // =========================================================================
  const [historySearch, setHistorySearch] = useState('');
  const [returnsHistory, setReturnsHistory] = useState<SaleReturnRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(25);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(val || 0);

  const formatQty = (val: number) =>
    new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: 3,
    }).format(val || 0);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Cargar lista de ventas por folio
  const fetchSalesList = useCallback(
    async (folioQuery: string, pageNum: number = 1) => {
      if (!token) return;
      setLoadingSales(true);
      const res = await saleService.getSales(token, folioQuery, pageNum, 15);
      if (res && res.success && res.data) {
        setSalesResults(res.data.data || []);
        setSalesTotalPages(res.data.totalPages || 1);
        setSalesTotalItems(res.data.totalItems || 0);
        setSalesPage(res.data.currentPage || pageNum);
      } else {
        setSalesResults([]);
      }
      setLoadingSales(false);
    },
    [token]
  );

  // Debounce al escribir folio
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalesList(searchFolio, 1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchFolio, fetchSalesList]);

  // Auto-enfoque en el buscador al abrir
  useEffect(() => {
    if (activeTab === 'new') {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [activeTab]);

  // Seleccionar un ticket y cargar sus renglones + devoluciones previas
  const handleSelectTicket = async (saleId: number) => {
    if (!token) return;
    setLoadingTicketDetail(true);
    setErrorMessage(null);
    setLastCreatedReturn(null);
    setReturnQuantities({});

    const [saleRes, returnsRes] = await Promise.all([
      saleService.getSaleById(token, saleId),
      returnService.getReturnsBySaleId(token, saleId),
    ]);

    if (saleRes && saleRes.success && saleRes.data) {
      setSelectedSale(saleRes.data);
    } else {
      setErrorMessage('No se pudo cargar el detalle del ticket.');
    }

    if (returnsRes && returnsRes.success && returnsRes.data) {
      setPreviousReturns(returnsRes.data);
    } else {
      setPreviousReturns([]);
    }

    setLoadingTicketDetail(false);
  };

  // Calcular cuánto se ha devuelto previamente por cada SaleDetailId
  const alreadyReturnedByDetailId = React.useMemo(() => {
    const map: Record<number, number> = {};
    for (const ret of previousReturns) {
      for (const det of ret.details || []) {
        map[det.saleDetailId] = (map[det.saleDetailId] || 0) + det.quantityReturned;
      }
    }
    return map;
  }, [previousReturns]);

  const totalPreviouslyRefunded = React.useMemo(() => {
    return previousReturns.reduce((acc, r) => acc + (r.totalRefunded || 0), 0);
  }, [previousReturns]);

  // Actualizar cantidad a devolver de un renglón
  const handleQuantityChange = (
    saleDetailId: number,
    newVal: number,
    maxAvailable: number,
    allowDecimals: boolean
  ) => {
    if (isNaN(newVal) || newVal <= 0) {
      setReturnQuantities((prev) => {
        const copy = { ...prev };
        delete copy[saleDetailId];
        return copy;
      });
      return;
    }

    let clamped = Math.min(newVal, maxAvailable);
    if (!allowDecimals) {
      clamped = Math.floor(clamped);
    } else {
      clamped = Math.round(clamped * 1000) / 1000;
    }

    if (clamped <= 0) {
      setReturnQuantities((prev) => {
        const copy = { ...prev };
        delete copy[saleDetailId];
        return copy;
      });
      return;
    }

    setReturnQuantities((prev) => ({
      ...prev,
      [saleDetailId]: clamped,
    }));
  };

  // Seleccionar todo el ticket disponible
  const handleSelectAllAvailable = () => {
    if (!selectedSale?.details) return;
    const next: Record<number, number> = {};
    for (const line of selectedSale.details) {
      const returned = alreadyReturnedByDetailId[line.id] || 0;
      const available = Math.max(0, Number((line.quantity - returned).toFixed(3)));
      if (available > 0) {
        next[line.id] = available;
      }
    }
    setReturnQuantities(next);
  };

  const handleClearSelection = () => {
    setReturnQuantities({});
  };

  // Cálculo del reembolso actual en vivo
  const currentRefundSummary = React.useMemo(() => {
    if (!selectedSale?.details) return { itemsCount: 0, totalUnits: 0, totalRefund: 0 };
    let itemsCount = 0;
    let totalUnits = 0;
    let totalRefund = 0;

    for (const line of selectedSale.details) {
      const qty = returnQuantities[line.id] || 0;
      if (qty > 0) {
        itemsCount += 1;
        totalUnits += qty;
        totalRefund += Math.round(qty * line.unitPrice * 100) / 100;
      }
    }

    return { itemsCount, totalUnits, totalRefund };
  }, [selectedSale, returnQuantities]);

  // Enviar devolución al backend
  const handleSubmitReturn = async () => {
    if (!selectedSale || !token) return;
    setErrorMessage(null);

    const detailsPayload = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([saleDetailId, quantityReturned]) => ({
        saleDetailId: Number(saleDetailId),
        quantityReturned,
      }));

    if (detailsPayload.length === 0) {
      setErrorMessage('Selecciona al menos un artículo y su cantidad a devolver.');
      return;
    }

    setSubmittingReturn(true);
    const res = await returnService.createReturn(token, {
      saleId: selectedSale.id,
      reason: reason.trim() || 'Devolución en mostrador',
      details: detailsPayload,
    });
    setSubmittingReturn(false);

    if (res && res.success && res.data) {
      setLastCreatedReturn(res.data);
      setReturnQuantities({});
      setReason('');
      // Recargamos el ticket y la lista lateral para reflejar su nuevo estado
      const [updatedSaleRes, updatedReturnsRes] = await Promise.all([
        saleService.getSaleById(token, selectedSale.id),
        returnService.getReturnsBySaleId(token, selectedSale.id),
      ]);
      if (updatedSaleRes?.success && updatedSaleRes.data) {
        setSelectedSale(updatedSaleRes.data);
      }
      if (updatedReturnsRes?.success && updatedReturnsRes.data) {
        setPreviousReturns(updatedReturnsRes.data);
      }
      fetchSalesList(searchFolio, salesPage);
    } else {
      setErrorMessage(res?.message || 'Error al registrar la devolución.');
    }
  };

  // Cargar historial de devoluciones (Pestaña 2)
  const fetchReturnsHistory = useCallback(
    async (searchQuery: string, pageNum: number, size: number) => {
      if (!token || !canViewReturns) return;
      setLoadingHistory(true);
      const res = await returnService.getReturns(token, searchQuery, pageNum, size);
      if (res && res.success && res.data) {
        setReturnsHistory(res.data.data || []);
        setHistoryTotalPages(res.data.totalPages || 1);
        setHistoryTotalItems(res.data.totalItems || 0);
        setHistoryPage(res.data.currentPage || pageNum);
      } else {
        setReturnsHistory([]);
      }
      setLoadingHistory(false);
    },
    [token, canViewReturns]
  );

  useEffect(() => {
    if (activeTab === 'history') {
      const timer = setTimeout(() => {
        fetchReturnsHistory(historySearch, historyPage, historyPageSize);
      }, 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeTab, historySearch, historyPage, historyPageSize, fetchReturnsHistory]);

  return (
    <div className="flex-1 flex flex-col min-h-0 text-white">
      {/* CABECERA Y SELECTOR DE MODO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 mb-5 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Centro de Devoluciones y Reembolsos
            </h1>
            <p className="text-gray-400 text-xs md:text-sm">
              Busca el ticket por número de folio, selecciona las piezas a devolver y el stock se reintegrará automáticamente al Kardex.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-1.5 bg-[#121212] p-1.5 rounded-2xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Buscar Ticket y Devolver
            </button>

            {canViewReturns && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  setHistoryPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <History className="w-4 h-4" />
                Historial de Devoluciones
              </button>
            )}
          </div>

          {isModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="px-4 py-2.5 rounded-2xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-300 font-bold text-sm border border-gray-700 transition-colors cursor-pointer"
            >
              ✕ Cerrar [Esc]
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          PESTAÑA 1: BUSCADOR DE TICKET + GENERACIÓN DE DEVOLUCIÓN
      ===================================================================== */}
      {activeTab === 'new' && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 overflow-y-auto xl:overflow-hidden custom-scrollbar">
          {/* COLUMNA IZQUIERDA (4 cols): BUSCADOR DE FOLIO Y LISTA DE TICKETS */}
          <div className="xl:col-span-4 bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 flex flex-col min-h-[380px] xl:min-h-0">
            <label className="text-xs font-extrabold uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              1. Buscar Ticket por Folio
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (salesResults.length === 1) {
                  handleSelectTicket(salesResults[0].id);
                } else {
                  fetchSalesList(searchFolio, 1);
                }
              }}
              className="relative mb-4"
            >
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchFolio}
                onChange={(e) => setSearchFolio(e.target.value)}
                placeholder="Escanea o escribe el folio (ej. 8492 o TKT-...)"
                className="w-full bg-[#111111] border-2 border-gray-800 focus:border-orange-500 rounded-2xl pl-10 pr-9 py-3 text-sm text-white placeholder-gray-500 outline-none font-mono transition-colors"
              />
              {searchFolio && (
                <button
                  type="button"
                  onClick={() => setSearchFolio('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </form>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-2.5 px-1">
              <span>
                {searchFolio.trim()
                  ? `Resultados para "${searchFolio.trim()}"`
                  : 'Ventas más recientes'}
              </span>
              <span className="font-mono font-bold text-gray-300">{salesTotalItems} tickets</span>
            </div>

            {/* Lista de tickets */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-0">
              {loadingSales ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                  <span className="text-xs font-bold">Buscando tickets...</span>
                </div>
              ) : salesResults.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-gray-800 rounded-2xl text-gray-500 p-4">
                  <Receipt className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No se encontraron tickets con ese folio.</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Intenta con los últimos 4 dígitos del ticket.
                  </p>
                </div>
              ) : (
                salesResults.map((sale) => {
                  const isSelected = selectedSale?.id === sale.id;
                  return (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() => handleSelectTicket(sale.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                          : 'bg-[#121212] hover:bg-white/[0.04] border-gray-800/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-white truncate">
                            {sale.folio}
                          </span>
                          {!sale.isActive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                              Cancelado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                          <span>{formatDateTime(sale.createdAt)}</span>
                          <span>•</span>
                          <span className="truncate">{sale.user?.name || 'Cajero'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-white text-base block">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <span className="text-[10px] text-orange-400 font-bold flex items-center justify-end gap-0.5">
                          Seleccionar <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Paginación compacta de búsqueda de tickets */}
            {salesTotalPages > 1 && (
              <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  disabled={salesPage <= 1}
                  onClick={() => fetchSalesList(searchFolio, salesPage - 1)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Ant.
                </button>
                <span>
                  Pág. <strong className="text-white">{salesPage}</strong> de{' '}
                  <strong className="text-white">{salesTotalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={salesPage >= salesTotalPages}
                  onClick={() => fetchSalesList(searchFolio, salesPage + 1)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  Sig. <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA (8 cols): DESGLOSE DEL TICKET Y CONTROLES DE DEVOLUCIÓN */}
          <div className="xl:col-span-8 bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 flex flex-col min-h-[480px] xl:min-h-0 overflow-hidden">
            {loadingTicketDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="font-bold text-sm">Cargando productos e historial del ticket...</p>
              </div>
            ) : !selectedSale ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-800 rounded-2xl">
                <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
                  <Receipt className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">
                  Selecciona un Ticket para Iniciar la Devolución
                </h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Busca la venta por su número de folio en el panel izquierdo y haz clic sobre ella para ver todos los productos comprados y elegir cuáles devolver.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-5">
                {/* BANNER DE ÉXITO SI ACABA DE GENERAR UNA DEVOLUCIÓN */}
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
                <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-xl text-white">
                        {selectedSale.folio}
                      </span>
                      {!selectedSale.isActive ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          Ticket Cancelado / Devuelto al 100%
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
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        {formatDateTime(selectedSale.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-orange-400" />
                        Cajero: <strong className="text-gray-200">{selectedSale.user?.name || 'General'}</strong>
                      </span>
                      <span>
                        Pago: <strong className="text-gray-200">{selectedSale.paymentMethod}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {totalPreviouslyRefunded > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-red-400 block">
                          Ya Devuelto Antes
                        </span>
                        <span className="font-mono font-bold text-red-400 text-base">
                          -{formatCurrency(totalPreviouslyRefunded)}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Total Original
                      </span>
                      <span className="font-mono font-black text-white text-xl">
                        {formatCurrency(selectedSale.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCIONES RÁPIDAS SOBRE LOS RENGLONES */}
                {selectedSale.isActive && canAddReturns && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                      2. Selecciona las cantidades a devolver
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllAvailable}
                        className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Devolver Todo el Ticket
                      </button>
                      {currentRefundSummary.itemsCount > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Limpiar Selección
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* TABLA DE PRODUCTOS DEL TICKET */}
                <div className="border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="max-h-[280px] overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-[#141414] border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Producto / Presentación</th>
                          <th className="py-3 px-3 font-semibold text-right">Precio Unit.</th>
                          <th className="py-3 px-3 font-semibold text-center">Comprado</th>
                          <th className="py-3 px-3 font-semibold text-center">Ya Devuelto</th>
                          <th className="py-3 px-3 font-semibold text-center text-emerald-400">
                            Disponible
                          </th>
                          <th className="py-3 px-4 font-semibold text-center text-orange-400">
                            Cant. a Devolver
                          </th>
                          <th className="py-3 px-4 font-semibold text-right text-red-400">
                            Reembolso
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {(selectedSale.details || []).map((line) => {
                          const alreadyRet = alreadyReturnedByDetailId[line.id] || 0;
                          const available = Math.max(
                            0,
                            Number((line.quantity - alreadyRet).toFixed(3))
                          );
                          const selectedQty = returnQuantities[line.id] || 0;
                          const refundLine = Math.round(selectedQty * line.unitPrice * 100) / 100;
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
                              <td className="py-3 px-4">
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
                              <td className="py-3 px-3 text-right font-mono text-gray-300">
                                {formatCurrency(line.unitPrice)}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-gray-300">
                                {formatQty(line.quantity)}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                {alreadyRet > 0 ? (
                                  <span className="text-red-400 font-bold">
                                    {formatQty(alreadyRet)}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">0</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-400">
                                {formatQty(available)}
                              </td>
                              <td className="py-3 px-4">
                                {available > 0 && selectedSale.isActive && canAddReturns ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuantityChange(
                                          line.id,
                                          selectedQty - 1,
                                          available,
                                          true
                                        )
                                      }
                                      className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
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
                                        handleQuantityChange(
                                          line.id,
                                          parseFloat(e.target.value),
                                          available,
                                          true
                                        )
                                      }
                                      className="w-20 bg-[#111111] border border-gray-700 focus:border-orange-500 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuantityChange(
                                          line.id,
                                          selectedQty + 1,
                                          available,
                                          true
                                        )
                                      }
                                      className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                                    >
                                      +
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuantityChange(line.id, available, available, true)
                                      }
                                      className="px-2 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white text-[11px] font-extrabold transition-colors cursor-pointer"
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
                              <td className="py-3 px-4 text-right font-mono font-extrabold">
                                {refundLine > 0 ? (
                                  <span className="text-red-400">-{formatCurrency(refundLine)}</span>
                                ) : (
                                  <span className="text-gray-600">$0.00</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* FORMULARIO DE MOTIVO Y CONFIRMACIÓN DE REEMBOLSO */}
                {selectedSale.isActive && canAddReturns && (
                  <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-gray-300 block mb-2">
                        3. Motivo de la Devolución
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {QUICK_REASONS.map((qr) => (
                          <button
                            key={qr}
                            type="button"
                            onClick={() => setReason(qr)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                              reason === qr
                                ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                                : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {qr}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        maxLength={255}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Escribe el motivo de la devolución (ej. Producto defectuoso, cambio de pieza...)"
                        className="w-full bg-[#1a1a1a] border border-gray-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-xs text-gray-400 block">Artículos a devolver</span>
                          <span className="font-mono font-extrabold text-white text-lg">
                            {formatQty(currentRefundSummary.totalUnits)} uds. ({currentRefundSummary.itemsCount} renglones)
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-red-400 font-bold uppercase block">
                            Total a Reembolsar al Cliente
                          </span>
                          <span className="font-mono font-black text-2xl text-red-400">
                            {formatCurrency(currentRefundSummary.totalRefund)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={submittingReturn || currentRefundSummary.itemsCount === 0}
                        onClick={handleSubmitReturn}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-sm shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {submittingReturn ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Procesando Devolución...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            Confirmar Devolución y Reintegrar Stock
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* HISTORIAL DE DEVOLUCIONES PREVIAS DE ESTE TICKET */}
                {previousReturns.length > 0 && (
                  <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-red-400" />
                      Devoluciones Registradas en este Ticket ({previousReturns.length})
                    </h4>
                    <div className="space-y-2">
                      {previousReturns.map((ret) => (
                        <div
                          key={ret.id}
                          className="p-3 rounded-xl bg-[#1a1a1a] border border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs"
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
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 2: HISTORIAL GENERAL DE DEVOLUCIONES
      ===================================================================== */}
      {activeTab === 'history' && (
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
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                placeholder="Buscar DEV-..., TKT-... o motivo"
                className="w-full bg-[#121212] border border-gray-800 focus:border-red-500 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryPage(1);
                  }}
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
                          onClick={() => {
                            setActiveTab('new');
                            handleSelectTicket(ret.saleId);
                          }}
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
                  onChange={(e) => {
                    setHistoryPageSize(Number(e.target.value));
                    setHistoryPage(1);
                  }}
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
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReturnsWorkspace;
