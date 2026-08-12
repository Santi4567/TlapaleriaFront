// src/screens/PendingOrdersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import PendingOrdersTable from '../components/pendingOrders/PendingOrdersTable';
import ConfirmActionModal from '../components/pendingOrders/ConfirmActionModal';
import PendingOrdersFilters, { PendingFiltersState } from '../components/pendingOrders/PendingOrdersFilters';
import ReceiveSupplierModal from '../components/pendingOrders/ReceiveSupplierModal'; 
import ReceiveMerchandiseModal from '../components/pendingOrders/ReceiveMerchandiseModal'; 
import PlaceOrderModal from '../components/pendingOrders/PlaceOrderModal'; 

// IMPORTAMOS LOS DOS NUEVOS MODALES
import CatalogOrderModal from '../components/pendingOrders/CatalogOrderModal';
import CustomOrderModal from '../components/pendingOrders/CustomOrderModal';

import { pendingOrderService } from '../services/pendingOrderService';
import { supplierService } from '../services/supplierService';
import { PendingOrder, CreatePendingOrderRequest, UpdatePendingOrderRequest } from '../types/pendingOrder';
import { Supplier } from '../types/supplier';
import { useAuth } from '../context/AuthContext';

const PendingOrdersScreen: React.FC = () => {
  const { user } = useAuth();
  const token = (user as any)?.token || '';
  
  const [items, setItems] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);

  // ================= ESTADOS DE LOS MODALES DE EDICIÓN/CREACIÓN =================
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedOrderToEdit, setSelectedOrderToEdit] = useState<PendingOrder | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [orderToChange, setOrderToChange] = useState<{ id: number, status: number } | null>(null);

  // ================= ESTADOS DEL TOAST =================
  const [toast, setToast] = useState<{ visible: boolean, type: 'success' | 'error', message: string }>({ visible: false, type: 'success', message: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4500);
  };

  // ================= ESTADOS DE LOS FLUJOS MASIVOS =================
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierModalAction, setSupplierModalAction] = useState<'receive' | 'placeOrder' | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  
  const [isReceiveCardsModalOpen, setIsReceiveCardsModalOpen] = useState(false);
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);

  // Filtros
  const [appliedFilters, setAppliedFilters] = useState<PendingFiltersState>({
    search: '', supplierId: '', status: 0, startDate: '', endDate: ''
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (token) {
        const response = await supplierService.getSuppliers(token, 1, 100, true);
        if (response && response.success) setSuppliersList(response.data.data);
      }
    };
    fetchSuppliers();
  }, [token]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await pendingOrderService.getPendingOrders(
        token, appliedFilters.status === -1 ? null : appliedFilters.status, 1, 50, 
        appliedFilters.search || undefined, appliedFilters.supplierId ? Number(appliedFilters.supplierId) : undefined, 
        appliedFilters.startDate || undefined, appliedFilters.endDate || undefined
      );
      if (response && response.success) {
        setItems(Array.isArray(response.data) ? response.data : (response.data.data || []));
      } else setItems([]);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  }, [token, appliedFilters]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleSaveOrder = async (data: any, isEdit: boolean): Promise<boolean> => {
    try {
      if (isEdit && selectedOrderToEdit) {
        const response = await pendingOrderService.updatePendingOrder(token, selectedOrderToEdit.id, data as UpdatePendingOrderRequest);
        if (response && response.success) {
          setItems(prev => prev.map(item => item.id === selectedOrderToEdit.id ? response.data : item));
          showToast('success', response.message || 'Pedido actualizado correctamente.');
          return true;
        } else {
          showToast('error', response?.message || 'No se pudo actualizar el registro.');
          return false;
        }
      } else {
        const response = await pendingOrderService.createPendingOrder(token, data as CreatePendingOrderRequest);
        if (response && response.success) {
          if (appliedFilters.status === 0 || appliedFilters.status === -1) setItems(prev => [response.data, ...prev]);
          showToast('success', response.message || 'Faltante agregado a la libreta correctamente.');
          return true;
        } else {
          showToast('error', response?.message || 'Error al agregar a la libreta.');
          return false;
        }
      }
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Ocurrió un error inesperado.');
      return false;
    }
  };

  const executeChangeStatus = async (id: number, newStatus: number): Promise<boolean> => {
    try {
      const response = await pendingOrderService.changeOrderStatus(token, id, newStatus);
      if (response && response.success) {
        if (appliedFilters.status !== -1 && appliedFilters.status !== newStatus) {
          setItems(prevItems => prevItems.filter(item => item.id !== id));
        } else {
          setItems(prevItems => prevItems.map(item => item.id === id ? response.data : item));
        }
        showToast('success', response.message || 'Estado actualizado correctamente.');
        return true;
      } else {
        showToast('error', response?.message || 'Error al cambiar de estado.');
        return false;
      }
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Error inesperado de red.');
      return false;
    }
  };

  const requestChangeStatus = (id: number, newStatus: number) => {
    setOrderToChange({ id, status: newStatus });
    setConfirmModalOpen(true);
  };

  const confirmTableChangeStatus = async () => {
    if (orderToChange) {
      await executeChangeStatus(orderToChange.id, orderToChange.status);
      setConfirmModalOpen(false);
      setOrderToChange(null);
    }
  };

  // Rutas de edición desde la tabla
  const handleEditOrder = (order: PendingOrder) => {
    setSelectedOrderToEdit(order);
    if (order.productId) {
      setIsCatalogModalOpen(true);
    } else {
      setIsCustomModalOpen(true);
    }
  };

  const handleOpenReceiveFlow = () => {
    setSupplierModalAction('receive');
    setIsSupplierModalOpen(true);
  };

  const handleOpenPlaceOrderFlow = () => {
    setSupplierModalAction('placeOrder');
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSelected = (supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setIsSupplierModalOpen(false);
    
    if (supplierModalAction === 'receive') {
      setIsReceiveCardsModalOpen(true);
    } else if (supplierModalAction === 'placeOrder') {
      setIsPlaceOrderModalOpen(true);
    }
    
    setSupplierModalAction(null);
  };

  const getModalConfig = (status?: number) => {
    switch(status) {
      case 1: return { type: 'purple', text: 'PEDIDO (Enviado al proveedor)', colorClass: 'text-purple-400' };
      case 2: return { type: 'danger', text: 'CANCELADO', colorClass: 'text-red-400' };
      case 3: return { type: 'success', text: 'COMPLETADO', colorClass: 'text-green-400' };
      default: return { type: 'warning', text: 'MODIFICADO', colorClass: 'text-orange-400' };
    }
  };

  const modalConfig = getModalConfig(orderToChange?.status);

  return (
    <div className="bg-[#121212] rounded-3xl shadow-2xl flex-1 flex flex-col p-6 border border-gray-800/50 overflow-hidden relative z-10 m-4 ml-0">
      
      {/* TOAST */}
      {toast.visible && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border-2 bg-[#1a1a1a] ${
            toast.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
          }`}>
            <p className="text-white font-bold text-base tracking-wide">{toast.message}</p>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white tracking-wide">Libreta de Pedidos</h1>
        
        <div className="flex gap-3">
          
          <button 
            onClick={handleOpenPlaceOrderFlow} 
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-5 rounded-xl transition-colors flex items-center shadow-[0_0_15px_rgba(147,51,234,0.2)]"
          >
            Levantar Pedidos
          </button>

          <button 
            onClick={handleOpenReceiveFlow} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl transition-colors flex items-center shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            Recibir Mercancía
          </button>

          {/* NUEVO BOTÓN CON MENÚ DESPLEGABLE */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-2 px-5 rounded-xl transition-colors flex items-center shadow-[0_0_15px_rgba(255,90,0,0.2)]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Anotar en Libreta
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => { setIsMenuOpen(false); setSelectedOrderToEdit(null); setIsCatalogModalOpen(true); }}
                  className="w-full text-left px-5 py-4 text-white hover:bg-gray-800 font-bold border-b border-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-xl">📕</span> Anotar producto existente
                </button>
                <button
                   onClick={() => { setIsMenuOpen(false); setSelectedOrderToEdit(null); setIsCustomModalOpen(true); }}
                  className="w-full text-left px-5 py-4 text-white hover:bg-gray-800 font-bold flex items-center gap-3 transition-colors"
                >
                  <span className="text-xl">✨</span> Encargo fuera de catálogo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PendingOrdersFilters suppliersList={suppliersList} isLoading={isLoading} onFiltersChange={setAppliedFilters} />
      
      <PendingOrdersTable 
        items={items} 
        onEdit={handleEditOrder} 
        onChangeStatus={requestChangeStatus} 
      />

      <ConfirmActionModal 
        isOpen={confirmModalOpen} type={modalConfig.type as any} title="¿Confirmar Acción?"
        message={<>Estás a punto de cambiar el estado de este registro a: <br/><strong className={`block mt-2 text-xl tracking-wider ${modalConfig.colorClass}`}>{modalConfig.text}</strong></>}
        onConfirm={confirmTableChangeStatus} onCancel={() => { setConfirmModalOpen(false); setOrderToChange(null); }}
      />

      {/* ================= FLUJO MASIVO ================= */}
      <ReceiveSupplierModal isOpen={isSupplierModalOpen} onClose={() => { setIsSupplierModalOpen(false); setSupplierModalAction(null); }} onSelectSupplier={handleSupplierSelected} />
      <ReceiveMerchandiseModal isOpen={isReceiveCardsModalOpen} supplierId={selectedSupplierId} onClose={() => setIsReceiveCardsModalOpen(false)} />
      <PlaceOrderModal isOpen={isPlaceOrderModalOpen} supplierId={selectedSupplierId} onClose={(hasChanges) => { setIsPlaceOrderModalOpen(false); if (hasChanges) loadOrders(); }} />

      {/* ================= NUEVOS MODALES ================= */}
      <CatalogOrderModal 
        isOpen={isCatalogModalOpen} 
        onClose={() => setIsCatalogModalOpen(false)} 
        onSave={handleSaveOrder} 
        onChangeStatus={executeChangeStatus} 
        initialData={selectedOrderToEdit} 
      />

      <CustomOrderModal 
        isOpen={isCustomModalOpen} 
        onClose={() => setIsCustomModalOpen(false)} 
        onSave={handleSaveOrder} 
        onChangeStatus={executeChangeStatus} 
        initialData={selectedOrderToEdit} 
      />

    </div>
  );
};

export default PendingOrdersScreen;