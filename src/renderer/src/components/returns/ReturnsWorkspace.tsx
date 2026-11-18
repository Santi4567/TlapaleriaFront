// src/components/returns/ReturnsWorkspace.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saleService } from '../../services/saleService';
import { returnService } from '../../services/returnService';
import { SaleTicketDetail } from '../../types/finance';
import { SaleReturnRecord } from '../../types/return';

import ReturnsHeader from './ReturnsHeader';
import ReturnsTicketSearch from './ReturnsTicketSearch';
import ReturnsTicketDetail from './ReturnsTicketDetail';
import ReturnsHistoryTable from './ReturnsHistoryTable';

interface ReturnsWorkspaceProps {
  isModal?: boolean;
  onCloseModal?: () => void;
  initialFolio?: string;
}

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
  const [showSalesList, setShowSalesList] = useState(false);
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

  // Cargar lista de ventas por folio
  const fetchSalesList = useCallback(
    async (folioQuery: string, pageNum: number = 1) => {
      if (!token) return;
      setLoadingSales(true);
      const res = await saleService.getSales(token, folioQuery, pageNum, 14);
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
    if (activeTab === 'new' && !selectedSale) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [activeTab, selectedSale]);

  // Manejador del submit en búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salesResults.length === 1) {
      handleSelectTicket(salesResults[0].id);
    } else {
      fetchSalesList(searchFolio, 1);
      setShowSalesList(true);
    }
  };

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

  const handleBackToSearch = () => {
    setSelectedSale(null);
    setErrorMessage(null);
    setLastCreatedReturn(null);
    setReturnQuantities({});
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
    const lines = selectedSale?.details || (selectedSale as any)?.saleDetails;
    if (!lines) return;
    const next: Record<number, number> = {};
    for (const line of lines) {
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
      <ReturnsHeader
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'history') setHistoryPage(1);
        }}
        canViewReturns={canViewReturns}
        isModal={isModal}
        onCloseModal={onCloseModal}
      />

      {/* PESTAÑA 1: FLUJO DE BÚSQUEDA Y DETALLE DE DEVOLUCIÓN */}
      {activeTab === 'new' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
          {!selectedSale ? (
            <ReturnsTicketSearch
              searchInputRef={searchInputRef}
              searchFolio={searchFolio}
              onSearchChange={setSearchFolio}
              onSearchSubmit={handleSearchSubmit}
              onClearSearch={() => setSearchFolio('')}
              salesResults={salesResults}
              loadingSales={loadingSales}
              selectedSaleId={undefined}
              onSelectTicket={handleSelectTicket}
              salesTotalItems={salesTotalItems}
              salesPage={salesPage}
              salesTotalPages={salesTotalPages}
              onPageChange={(page) => fetchSalesList(searchFolio, page)}
              showList={showSalesList}
              onToggleShowList={() => setShowSalesList((prev) => !prev)}
            />
          ) : (
            <ReturnsTicketDetail
              loadingTicketDetail={loadingTicketDetail}
              selectedSale={selectedSale}
              lastCreatedReturn={lastCreatedReturn}
              errorMessage={errorMessage}
              previousReturns={previousReturns}
              canAddReturns={canAddReturns}
              returnQuantities={returnQuantities}
              onQuantityChange={handleQuantityChange}
              onSelectAllAvailable={handleSelectAllAvailable}
              onClearSelection={handleClearSelection}
              reason={reason}
              onReasonChange={setReason}
              submittingReturn={submittingReturn}
              onSubmitReturn={handleSubmitReturn}
              onBackToSearch={handleBackToSearch}
            />
          )}
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL GENERAL DE DEVOLUCIONES */}
      {activeTab === 'history' && (
        <ReturnsHistoryTable
          historySearch={historySearch}
          onSearchChange={(query) => {
            setHistorySearch(query);
            setHistoryPage(1);
          }}
          loadingHistory={loadingHistory}
          returnsHistory={returnsHistory}
          historyTotalItems={historyTotalItems}
          historyPage={historyPage}
          historyPageSize={historyPageSize}
          historyTotalPages={historyTotalPages}
          onPageChange={setHistoryPage}
          onPageSizeChange={(size) => {
            setHistoryPageSize(size);
            setHistoryPage(1);
          }}
          onSelectTicketForReturn={(saleId) => {
            setActiveTab('new');
            handleSelectTicket(saleId);
          }}
        />
      )}
    </div>
  );
};

export default ReturnsWorkspace;
