// src/components/pos/PosClearConfirmModal.tsx
import React, { useEffect } from 'react';

interface PosClearConfirmModalProps {
  tabTitle: string;
  itemsCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const PosClearConfirmModal: React.FC<PosClearConfirmModalProps> = ({
  tabTitle,
  itemsCount,
  onClose,
  onConfirm
}) => {
  // Atajos de teclado: Enter para confirmar, Esc para cancelar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-red-500/60 p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto text-3xl font-black border border-red-500/40">
          🗑️
        </div>

        <div>
          <h3 className="text-2xl font-black text-white">¿Vaciar toda la tabla?</h3>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed font-medium">
            Estás a punto de eliminar <strong className="text-red-400">{itemsCount} artículos</strong> de la cuenta <strong className="text-white font-bold">{tabTitle}</strong>.
          </p>
          <p className="text-xs text-gray-500 mt-2 font-mono bg-black/50 p-3 rounded-xl border border-gray-800">
            ⚠️ Esta acción no se puede deshacer y tendrás que volver a escanear los productos.
          </p>
        </div>

        <div className="flex space-x-4 pt-2 border-t border-gray-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors"
          >
            Cancelar [Esc]
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-1/2 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center space-x-1"
          >
            <span>Sí, Vaciar [Enter]</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PosClearConfirmModal;