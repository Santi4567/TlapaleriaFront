// src/components/Inventario/InventoryMessageModal.tsx
import React from 'react';

interface InventoryMessageModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
}

const InventoryMessageModal: React.FC<InventoryMessageModalProps> = ({ isOpen, type, message, onClose }) => {
  if (!isOpen) return null;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  const colors = {
    success: 'text-green-400 bg-green-500/10 border-green-500/50',
    error: 'text-red-400 bg-red-500/10 border-red-500/50',
    warning: 'text-brand-orange bg-brand-orange/10 border-brand-orange/50'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1c1c1c] border-2 border-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border ${colors[type]}`}>
          {icons[type]}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {type === 'success' ? '¡Éxito!' : type === 'error' ? 'Error' : 'Atención'}
        </h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default InventoryMessageModal;