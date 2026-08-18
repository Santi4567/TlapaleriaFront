// src/components/pendingOrders/CatalogOrderModal.tsx
import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { Supplier } from '../../types/supplier';
import { useAuth } from '../../context/AuthContext';
import { PendingOrder } from '../../types/pendingOrder';
import ConfirmActionModal from './ConfirmActionModal';

interface CatalogOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, isEdit: boolean) => Promise<boolean>; // 
  onChangeStatus?: (id: number, status: number) => Promise<boolean>; // 
  initialData?: PendingOrder | null;
}

const CatalogOrderModal: React.FC<CatalogOrderModalProps> = ({ 
  isOpen, onClose, onSave, onChangeStatus, initialData 
}) => {
  const { user } = useAuth();
  const token = (user as any)?.token || '';
  const isEdit = !!initialData;

  const currentStatus = initialData?.status ?? 0; 
  const isReadOnly = currentStatus === 2 || currentStatus === 3; 
  const isPartialBlock = currentStatus === 1;

  const productInputRef = useRef<HTMLInputElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);
  const mensajeInputRef = useRef<HTMLTextAreaElement>(null);

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [isProductFocused, setIsProductFocused] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);
  const [isProductLoading, setIsProductLoading] = useState(false);
  
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [fetchedSuppliers, setFetchedSuppliers] = useState<Supplier[]>([]);
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(0);
  //const [isSupplierLoading, setIsSupplierLoading] = useState(false);
  
  const [cantidad, setCantidad] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || confirmModalOpen) return; 
    
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (!isEdit && e.key === 'F3') {
        e.preventDefault();
        productInputRef.current?.focus();
      }
      if (isEdit && currentStatus === 0) {
        if (e.key === 'F2') {
          e.preventDefault();
          setStatusToConfirm(1);
          setConfirmModalOpen(true);
        } else if (e.key === 'F4') {
          e.preventDefault();
          setStatusToConfirm(2);
          setConfirmModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmModalOpen, isEdit, currentStatus, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedProduct(initialData.product || null);
        setSelectedSupplier(initialData.supplier || null);
        setCantidad(initialData.quantityText || '');
        setMensaje(initialData.notes || '');
        setTimeout(() => cantidadInputRef.current?.focus(), 100);
      } else {
        setProductSearch(''); setSelectedProduct(null); setFetchedProducts([]);
        setSupplierSearch(''); setSelectedSupplier(null); setFetchedSuppliers([]);
        setCantidad(''); setMensaje('');
        setTimeout(() => productInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!productSearch.trim() || productSearch.length < 2) { setFetchedProducts([]); setIsProductLoading(false); return; }
      setIsProductLoading(true);
      const response = await productService.searchProducts(token, productSearch);
      if (response && response.success) setFetchedProducts(response.data.slice(0, 6)); else setFetchedProducts([]);
      setIsProductLoading(false);
    };
    const delayDebounceFn = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [productSearch, token]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!supplierSearch.trim() || supplierSearch.length < 2) { setFetchedSuppliers([]); setIsSupplierLoading(false); return; }
      setIsSupplierLoading(true);
      const response = await supplierService.searchSuppliers(token, supplierSearch, true);
      if (response && response.success) setFetchedSuppliers(response.data.slice(0, 6)); else setFetchedSuppliers([]);
      setIsSupplierLoading(false);
    };
    const delayDebounceFn = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearch, token]);

  const applyProductSelection = (prod: any) => {
    setSelectedProduct(prod); 
    setProductSearch(''); 
    setIsProductFocused(false); 
    if (prod.supplier) {
      setSelectedSupplier(prod.supplier);
      setTimeout(() => cantidadInputRef.current?.focus(), 100);
    } else {
      setTimeout(() => supplierInputRef.current?.focus(), 100);
    }
  };

  const handleProductKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isProductFocused || fetchedProducts.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedProductIndex(prev => (prev < fetchedProducts.length - 1 ? prev + 1 : prev)); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedProductIndex(prev => (prev > 0 ? prev - 1 : prev)); } 
    else if (e.key === 'Enter') { 
      e.preventDefault(); 
      const selected = fetchedProducts[highlightedProductIndex]; 
      if (selected) applyProductSelection(selected);
    }
  };

  const handleSupplierKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isSupplierFocused || fetchedSuppliers.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedSupplierIndex(prev => (prev < fetchedSuppliers.length - 1 ? prev + 1 : prev)); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedSupplierIndex(prev => (prev > 0 ? prev - 1 : prev)); } 
    else if (e.key === 'Enter') { 
      e.preventDefault(); 
      const selected = fetchedSuppliers[highlightedSupplierIndex]; 
      if (selected) { 
        setSelectedSupplier(selected); setSupplierSearch(''); setIsSupplierFocused(false); 
        setTimeout(() => cantidadInputRef.current?.focus(), 100);
      } 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!cantidad.trim()) return;
    
    setIsSubmitting(true);
    const payload = {
      productId: selectedProduct.id,
      newProductName: null, // CASO 1
      supplierId: selectedSupplier?.id || null,
      quantityText: cantidad.trim(),
      notes: mensaje.trim()
    };

    await onSave(payload, isEdit);
    setIsSubmitting(false);
    onClose();
  };

  const executeStatusChange = async () => {
    if (statusToConfirm !== null && onChangeStatus && initialData) {
      setIsSubmitting(true);
      await onChangeStatus(initialData.id, statusToConfirm);
      setIsSubmitting(false);
      setConfirmModalOpen(false);
      onClose(); 
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[40] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#121212] border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
          
          <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#0a0a0a] rounded-t-3xl shrink-0">
            <h3 className="text-2xl font-black text-white flex items-center tracking-wide">
              {isReadOnly ? (
                <span className="text-gray-400 mr-3 flex items-center gap-2">🔒 Registro Histórico</span>
              ) : isEdit ? (
                <span className={`${isPartialBlock ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-500'} p-2 rounded-xl mr-3`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </span>
              ) : (
                <span className="bg-orange-500/20 text-orange-500 p-2 rounded-xl mr-3">📕</span>
              )}
              {isReadOnly ? 'Consulta de Pedido' : isEdit ? (isPartialBlock ? 'Editar Pedido (Limitado)' : 'Modificar Pedido Existente') : 'Anotar Producto de Catálogo'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-red-500/20 p-2 rounded-xl transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
            <div className={`relative ${isReadOnly || (isPartialBlock && selectedProduct) ? 'opacity-70 pointer-events-none' : ''}`}>
              <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3">1. Detalles del Producto *</label>

              {!selectedProduct ? (
                <div className="relative mb-6">
                  <input 
                    ref={productInputRef} type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} 
                    onKeyDown={handleProductKeyDown} onFocus={() => setIsProductFocused(true)} onBlur={() => setTimeout(() => setIsProductFocused(false), 200)} 
                    placeholder="🔍 Buscar producto en sistema..." 
                    className="w-full bg-[#121212] border-2 border-gray-800 text-white text-xl rounded-3xl pl-6 pr-24 py-4 font-bold outline-none focus:border-orange-500 transition-all" autoComplete="off" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
                     {isProductLoading ? <span className="text-orange-500 animate-spin font-black text-xl">↻</span> : <kbd className="bg-gray-800 text-orange-500 px-3 py-1.5 rounded-xl text-sm font-mono font-black border-2 border-gray-700 shadow-md">F3</kbd>}
                  </div>
                  {isProductFocused && productSearch.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-orange-500/60 rounded-3xl z-40 max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-800 shadow-2xl">
                      {fetchedProducts.map((prod, idx) => (
                        <div key={prod.id} onClick={() => applyProductSelection(prod)} className={`p-4 cursor-pointer flex justify-between ${idx === highlightedProductIndex ? 'bg-gray-800 border-l-4 border-orange-500' : 'hover:bg-gray-800/50'}`}>
                           <span className="text-orange-500 font-mono mr-2">{prod.internalCode}</span><span className="text-white font-bold">{prod.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-3xl p-5 shadow-inner mb-6 flex justify-between items-center">
                  <div>
                    <div className="text-orange-500 font-mono">{selectedProduct.internalCode}</div>
                    <div className="text-white font-bold text-xl">{selectedProduct.name}</div>
                  </div>
                  {!isReadOnly && !isPartialBlock && (
                    <button type="button" onClick={() => { setSelectedProduct(null); setTimeout(() => productInputRef.current?.focus(), 100); }} className="bg-orange-500/20 text-orange-400 p-2 rounded-xl text-xs font-bold hover:bg-orange-500/30 transition-colors">Cambiar (F3)</button>
                  )}
                </div>
              )}
            </div>

            <div className={`relative ${isReadOnly || isPartialBlock || !selectedProduct ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>2. Seleccionar Proveedor (Opcional)</span>
                {selectedSupplier && !isReadOnly && !isPartialBlock && <button type="button" onClick={() => { setSelectedSupplier(null); setTimeout(() => supplierInputRef.current?.focus(), 100); }} className="text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1 rounded-lg hover:bg-blue-500/20">Cambiar proveedor</button>}
              </label>
              {!selectedSupplier ? (
                <div className="relative mb-6">
                  <input 
                    ref={supplierInputRef} type="text" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} 
                    onKeyDown={handleSupplierKeyDown} onFocus={() => setIsSupplierFocused(true)} onBlur={() => setTimeout(() => setIsSupplierFocused(false), 200)} 
                    placeholder="🏢 Buscar proveedor..." 
                    className="w-full bg-[#121212] border-2 border-gray-800 text-white text-xl rounded-3xl pl-6 pr-12 py-4 font-bold outline-none focus:border-blue-500 transition-all" autoComplete="off" 
                  />
                  {isSupplierFocused && supplierSearch.length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-blue-500/60 rounded-3xl z-40 max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-800 shadow-2xl">
                      {fetchedSuppliers.map((sup, idx) => (
                        <div key={sup.id} onClick={() => { setSelectedSupplier(sup); setSupplierSearch(''); setTimeout(() => cantidadInputRef.current?.focus(), 100); }} className={`p-4 cursor-pointer flex justify-between ${idx === highlightedSupplierIndex ? 'bg-gray-800 border-l-4 border-blue-500' : 'hover:bg-gray-800/50'}`}>
                           <span className="text-white font-bold">{sup.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-3xl p-5 shadow-inner mb-6">
                  <div className="text-white font-bold text-xl">{selectedSupplier.name}</div>
                  <div className="text-blue-400 font-mono text-sm">Contacto: {selectedSupplier.contactName || 'No especificado'}</div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className={`w-full max-w-xs ${isReadOnly || isPartialBlock ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3">3. Cantidad / Unidades *</label>
                <input 
                  ref={cantidadInputRef} type="text" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} 
                  onKeyDown={(e) => { if(e.key === 'Enter') mensajeInputRef.current?.focus(); }}
                  className="w-full bg-[#121212] border-2 border-gray-800 text-white font-black text-xl rounded-3xl py-4 px-6 outline-none focus:border-green-500 text-center" 
                  placeholder="Ej. 5 bolsas..." autoComplete="off" 
                />
              </div>
              <div className={`${isReadOnly ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3">4. Notas (Opcional) {isPartialBlock && <span className="text-blue-400 normal-case font-bold ml-2">(Editable)</span>}</label>
                <textarea 
                  ref={mensajeInputRef} value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                  className="w-full bg-[#121212] border-2 border-gray-800 text-white rounded-3xl p-6 outline-none focus:border-gray-400 resize-none h-32 custom-scrollbar text-base" 
                  placeholder="Comentarios adicionales para el comprador..."
                />
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] rounded-b-3xl flex justify-between items-center shrink-0">
            <div className="flex gap-2">
              {isEdit && currentStatus === 0 && (
                <>
                  <button type="button" onClick={() => { setStatusToConfirm(2); setConfirmModalOpen(true); }} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl font-bold transition-colors">
                    <span>Cancelar</span><kbd className="bg-red-500/20 px-2 py-0.5 rounded text-[10px]">F4</kbd>
                  </button>
                  <button type="button" onClick={() => { setStatusToConfirm(1); setConfirmModalOpen(true); }} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-2xl font-bold transition-colors">
                    <span>Hacer Pedido</span><kbd className="bg-purple-500/20 px-2 py-0.5 rounded text-[10px]">F2</kbd>
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3 ml-auto">
              {isReadOnly ? (
                <button type="button" onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white text-base font-black py-3.5 px-10 rounded-2xl transition-all">Cerrar</button>
              ) : (
                <>
                  <button type="button" onClick={onClose} className="flex items-center gap-2 px-8 py-3.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-2xl font-black transition-colors"><span>Salir</span><kbd className="bg-gray-700 px-2 py-0.5 rounded text-[10px]">Esc</kbd></button>
                  <button onClick={handleSubmit} disabled={isSubmitting || !cantidad.trim() || !selectedProduct} className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-800 disabled:text-gray-600 text-black text-base font-black py-3.5 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,90,0,0.25)]">
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal 
        isOpen={confirmModalOpen}
        type={statusToConfirm === 1 ? 'purple' : 'danger'}
        title="¿Confirmar Acción?"
        message={
          <>
            Estás a punto de cambiar el estado de este registro a: <br/>
            <strong className={`block mt-2 text-xl tracking-wider ${statusToConfirm === 1 ? 'text-purple-400' : 'text-red-400'}`}>
              {statusToConfirm === 1 ? 'PEDIDO (Enviado)' : 'CANCELADO'}
            </strong>
          </>
        }
        onConfirm={executeStatusChange}
        onCancel={() => { setConfirmModalOpen(false); setStatusToConfirm(null); }}
      />
    </>
  );
};

export default CatalogOrderModal;