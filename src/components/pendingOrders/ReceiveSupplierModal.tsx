// src/components/pendingOrders/ReceiveSupplierModal.tsx
import React, { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';

// MOCK DATA (Prototipo)
const MOCK_SUPPLIERS = [
  { id: 1, name: 'Ferrebastones', contactName: 'Carlos N' },
  { id: 2, name: 'Sayer Lack', contactName: 'Distribuidor Autorizado' },
];

interface ReceiveSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier: (supplierId: number) => void;
}

const ReceiveSupplierModal: React.FC<ReceiveSupplierModalProps> = ({ isOpen, onClose, onSelectSupplier }) => {
  const [supplierSearch, setSupplierSearch] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState(MOCK_SUPPLIERS);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(0);
  
  const supplierInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSupplierSearch('');
      setHighlightedSupplierIndex(0);
      setTimeout(() => supplierInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setFilteredSuppliers(
      MOCK_SUPPLIERS.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
    );
    setHighlightedSupplierIndex(0);
  }, [supplierSearch]);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (filteredSuppliers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSupplierIndex(prev => (prev < filteredSuppliers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSupplierIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredSuppliers[highlightedSupplierIndex];
      if (selected) {
        onSelectSupplier(selected.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-visible flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-gray-800 bg-[#0a0a0a] rounded-t-3xl flex justify-between items-center">
          <h3 className="text-xl font-black text-white flex items-center">
            <span className="text-blue-500 mr-2">🏢</span> Seleccionar Proveedor
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 relative">
          <input 
            ref={supplierInputRef}
            type="text" 
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar proveedor..." 
            className="w-full bg-[#1c1c1c] border-2 border-blue-500/50 text-white text-lg rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:border-blue-500 transition-colors shadow-inner"
            autoComplete="off"
          />
          
          <div className="absolute left-6 right-6 top-full mt-2 bg-[#1c1c1c] border border-gray-800 rounded-xl z-40 max-h-64 overflow-y-auto custom-scrollbar shadow-2xl">
            {filteredSuppliers.map((sup, idx) => (
              <div 
                key={sup.id} 
                onClick={() => onSelectSupplier(sup.id)}
                className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${idx === highlightedSupplierIndex ? 'bg-gray-800 border-l-4 border-blue-500' : 'hover:bg-gray-800/50'}`}
              >
                 <span className="text-white font-bold">{sup.name}</span>
                 <span className="text-gray-500 text-xs">Enter ↵</span>
              </div>
            ))}
            {filteredSuppliers.length === 0 && (
              <div className="p-4 text-gray-500 text-center font-bold">No se encontraron proveedores.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveSupplierModal;