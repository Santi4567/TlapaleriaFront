// src/screens/PendingOrdersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import PendingOrdersTable from '../components/pendingOrders/PendingOrdersTable';
import PendingOrderModal from '../components/pendingOrders/PendingOrderModal';
import ConfirmActionModal from '../components/pendingOrders/ConfirmActionModal';
import PendingOrdersFilters, { PendingFiltersState } from '../components/pendingOrders/PendingOrdersFilters';
import ReceiveSupplierModal from '../components/pendingOrders/ReceiveSupplierModal'; // <-- MODAL 1
import ReceiveMerchandiseModal from '../components/pendingOrders/ReceiveMerchandiseModal'; // <-- MODAL 2
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderToEdit, setSelectedOrderToEdit] = useState<PendingOrder | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [orderToChange, setOrderToChange] = useState<{ id: number, status: number } | null>(null);

  // NUEVOS ESTADOS PARA EL FLUJO DE RECEPCIÓN (2 PASOS)
  const [isReceiveSupplierModalOpen, setIsReceiveSupplierModalOpen] = useState(false);
  const [isReceiveCardsModalOpen, setIsReceiveCardsModalOpen] = useState(false);
  const [selectedSupplierForReceive, setSelectedSupplierForReceive] = useState<number | null>(null);

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

  const handleSaveOrder = async (data: any, isEdit: boolean) => {
    if (isEdit && selectedOrderToEdit) {
      const response = await pendingOrderService.updatePendingOrder(token, selectedOrderToEdit.id, data as UpdatePendingOrderRequest);
      if (response && response.success) setItems(prev => prev.map(item => item.id === selectedOrderToEdit.id ? response.data : item));
    } else {
      const response = await pendingOrderService.createPendingOrder(token, data as CreatePendingOrderRequest);
      if (response && response.success) {
        if (appliedFilters.status === 0 || appliedFilters.status === -1) setItems(prev => [response.data, ...prev]);
      }
    }
  };

  const requestChangeStatus = (id: number, newStatus: number) => {
    setOrderToChange({ id, status: newStatus });
    setConfirmModalOpen(true);
  };

  const executeChangeStatus = async (id: number, newStatus: number) => {
    const response = await pendingOrderService.changeOrderStatus(token, id, newStatus);
    if (response && response.success) {
      if (appliedFilters.status !== -1 && appliedFilters.status !== newStatus) {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
      } else {
        setItems(prevItems => prevItems.map(item => item.id === id ? response.data : item));
      }
    }
  };

  const confirmTableChangeStatus = async () => {
    if (orderToChange) {
      await executeChangeStatus(orderToChange.id, orderToChange.status);
      setConfirmModalOpen(false);
      setOrderToChange(null);
    }
  };

  // NAVEGACIÓN DEL WIZARD DE RECEPCIÓN
  const handleSupplierSelectedForReceive = (supplierId: number) => {
    setSelectedSupplierForReceive(supplierId);
    setIsReceiveSupplierModalOpen(false); // Cerramos el modal de búsqueda
    setIsReceiveCardsModalOpen(true);     // Abrimos el modal grande de las cards
  };

  return (
    <div className="bg-[#121212] rounded-3xl shadow-2xl flex-1 flex flex-col p-6 border border-gray-800/50 overflow-hidden relative z-10 m-4 ml-0">
      
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white tracking-wide">Libreta de Pedidos</h1>
        
        <div className="flex gap-3">
          {/* BOTÓN QUE ABRE EL PASO 1 */}
          <button 
            onClick={() => setIsReceiveSupplierModalOpen(true)} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl transition-colors flex items-center shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            Recibir Mercancía
          </button>

          <button 
            onClick={() => { setSelectedOrderToEdit(null); setIsModalOpen(true); }} 
            className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-2 px-5 rounded-xl transition-colors flex items-center shadow-[0_0_15px_rgba(255,90,0,0.2)]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Agregar a Libreta
          </button>
        </div>
      </div>

      <PendingOrdersFilters 
        suppliersList={suppliersList}
        isLoading={isLoading}
        onFiltersChange={setAppliedFilters} 
      />

      <PendingOrdersTable 
        items={items} 
        onEdit={(order) => { setSelectedOrderToEdit(order); setIsModalOpen(true); }} 
        onChangeStatus={requestChangeStatus} 
      />

      <PendingOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveOrder}
        onChangeStatus={executeChangeStatus}
        initialData={selectedOrderToEdit}
      />

      <ConfirmActionModal 
        isOpen={confirmModalOpen}
        type={orderToChange?.status === 2 ? 'success' : 'danger'}
        title="¿Confirmar Acción?"
        message={<>Estás a punto de marcar este pedido como <br/><strong className={`uppercase text-lg ${orderToChange?.status === 2 ? 'text-green-400' : 'text-red-400'}`}>{orderToChange?.status === 2 ? 'Completado' : 'Cancelado'}</strong>.</>}
        onConfirm={confirmTableChangeStatus}
        onCancel={() => { setConfirmModalOpen(false); setOrderToChange(null); }}
      />

      {/* MODAL 1: BÚSQUEDA DE PROVEEDOR */}
      <ReceiveSupplierModal 
        isOpen={isReceiveSupplierModalOpen}
        onClose={() => setIsReceiveSupplierModalOpen(false)}
        onSelectSupplier={handleSupplierSelectedForReceive}
      />

      {/* MODAL 2: CARDS DE REVISIÓN */}
      <ReceiveMerchandiseModal 
        isOpen={isReceiveCardsModalOpen}
        supplierId={selectedSupplierForReceive}
        onClose={() => setIsReceiveCardsModalOpen(false)}
      />

    </div>
  );
};

export default PendingOrdersScreen;