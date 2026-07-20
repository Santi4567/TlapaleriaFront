// src/components/pos/PosCloseAllConfirmModal.tsx
import React, { useEffect } from 'react';

interface PosCloseAllConfirmModalProps {
  tabsCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const PosCloseAllConfirmModal: React.FC<PosCloseAllConfirmModalProps> = ({
  tabsCount,
  onClose,
  onConfirm
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Anti-rebote
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
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-red-600/80 p-8 shadow-[0_0_60px_rgba(220,38,38,0.3)] text-center space-y-6">
        
        <div className="w-20 h-20 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto text-4xl font-black border-2 border-red-500/40 shadow-inner">
          💥
        </div>

        <div>
          <h3 className="text-2xl font-black text-white">¿Cerrar todas las pestañas?</h3>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed font-medium">
            Estás a punto de cerrar <strong className="text-red-400 font-bold">{tabsCount} cuentas abiertas</strong> al mismo tiempo.
          </p>
          <p className="text-xs text-gray-400 mt-3 font-mono bg-black/60 p-3 rounded-xl border border-gray-800">
            ⚠️ Si tienes artículos o presupuestos sin guardar en alguna de ellas, se perderán para siempre y el sistema volverá al Ticket #1.
          </p>
        </div>

        <div className="flex space-x-4 pt-2 border-t border-gray-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-base transition-colors flex items-center justify-center space-x-2"
          >
            <span>Cancelar</span>
            <kbd className="bg-black/50 text-gray-400 px-2 py-0.5 rounded font-mono text-xs font-black">Esc</kbd>
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="w-1/2 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-base shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>Sí, Cerrar Todo</span>
            <kbd className="bg-black/40 text-white px-2 py-0.5 rounded font-mono text-xs font-black shadow-inner">Enter ↵</kbd>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PosCloseAllConfirmModal;