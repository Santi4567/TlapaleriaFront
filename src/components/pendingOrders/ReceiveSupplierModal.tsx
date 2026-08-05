// src/components/pendingOrders/ReceiveSupplierModal.tsx
import React, { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types/supplier';
import { useAuth } from '../../context/AuthContext';

interface ReceiveSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier: (supplierId: number) => void;
}

const ReceiveSupplierModal: React.FC<ReceiveSupplierModalProps> = ({ isOpen, onClose, onSelectSupplier }) => {
  const { user } = useAuth();
  const token = (user as any)?.token || '';

  const [supplierSearch, setSupplierSearch] = useState('');
  const [fetchedSuppliers, setFetchedSuppliers] = useState<Supplier[]>([]);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const supplierInputRef = useRef<HTMLInputElement>(null);

  // 1. Resetear el modal cada que se abre
  useEffect(() => {
    if (isOpen) {
      setSupplierSearch('');
      setHighlightedSupplierIndex(0);
      setFetchedSuppliers([]);
      setTimeout(() => supplierInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 2. Búsqueda Asíncrona Inteligente (Maneja 10, 100 o 1000 proveedores sin problema)
  useEffect(() => {
    if (!isOpen) return;

    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        let response;
        // Si no ha escrito nada, traemos los primeros 6 por defecto (Paginación)
        if (!supplierSearch.trim()) {
          response = await supplierService.getSuppliers(token, 1, 6, true);
        } else {
          // Si ya escribió, buscamos coincidencias
          response = await supplierService.searchSuppliers(token, supplierSearch, true);
        }

        if (response && response.success) {
          // Dependiendo si el endpoint devuelve un arreglo directo o paginado
          const dataList = Array.isArray(response.data) ? response.data : (response.data.data || []);
          // Limitamos visualmente a 6 resultados para no saturar el modal
          setFetchedSuppliers(dataList.slice(0, 6));
        } else {
          setFetchedSuppliers([]);
        }
      } catch (error) {
        console.error("Error buscando proveedores:", error);
        setFetchedSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Esperar 300ms después de que el usuario deje de teclear
    const delayDebounceFn = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearch, token, isOpen]);

  // 3. Navegación con teclado
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    
    if (fetchedSuppliers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSupplierIndex(prev => (prev < fetchedSuppliers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSupplierIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = fetchedSuppliers[highlightedSupplierIndex];
      if (selected) {
        onSelectSupplier(selected.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* CABECERA */}
        <div className="p-6 border-b border-gray-800 bg-[#0a0a0a] flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black text-white flex items-center">
            <span className="text-blue-500 mr-3 text-2xl">🏢</span> Seleccionar Proveedor
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-800/50 hover:bg-red-500/20 p-2 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-6 flex flex-col gap-5 bg-[#161616]">
          
          {/* BUSCADOR */}
          <div className="relative">
            {isLoading ? (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin font-black">↻</span>
            ) : (
              <svg className="w-6 h-6 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            )}
            
            <input 
              ref={supplierInputRef}
              type="text" 
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setHighlightedSupplierIndex(0); // Resetear índice al escribir
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre..." 
              className="w-full bg-[#121212] border-2 border-gray-800 text-white text-lg rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-blue-500 transition-colors shadow-inner placeholder-gray-600"
              autoComplete="off"
            />
          </div>
          
          {/* LISTA DE PROVEEDORES (Limitada visualmente a max-h-64) */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {fetchedSuppliers.map((sup, idx) => {
              const isHighlighted = idx === highlightedSupplierIndex;
              return (
                <div 
                  key={sup.id} 
                  onClick={() => onSelectSupplier(sup.id)}
                  className={`p-4 cursor-pointer flex justify-between items-center rounded-xl border-2 transition-all duration-200 ${
                    isHighlighted 
                      ? 'bg-blue-600/10 border-blue-500 shadow-md' 
                      : 'bg-[#1a1a1a] border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                  }`}
                >
                   <div>
                     <span className={`font-bold block ${isHighlighted ? 'text-blue-400' : 'text-white'}`}>
                       {sup.name}
                     </span>
                     {sup.contactName && (
                       <span className="text-xs text-gray-500 mt-1 block">
                         Contacto: {sup.contactName}
                       </span>
                     )}
                   </div>
                   
                   {isHighlighted && (
                     <div className="flex items-center gap-2 text-blue-500 animate-pulse">
                       <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 px-2 py-1 rounded">Enter ↵</span>
                     </div>
                   )}
                </div>
              );
            })}
            
            {!isLoading && fetchedSuppliers.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center justify-center bg-[#1a1a1a] rounded-xl border border-gray-800 border-dashed">
                <span className="text-4xl mb-3">👻</span>
                <span className="text-gray-400 font-bold">No se encontraron proveedores</span>
                <span className="text-gray-600 text-xs mt-1">Intenta con otra búsqueda</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReceiveSupplierModal;