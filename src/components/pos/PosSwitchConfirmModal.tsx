// src/components/pos/PosSwitchConfirmModal.tsx
import React from 'react';

interface PosSwitchConfirmModalProps {
  currentType: 'SALE' | 'QUOTE';
  onClose: () => void;
  onConfirm: () => void;
}

const PosSwitchConfirmModal: React.FC<PosSwitchConfirmModalProps> = ({
  currentType,
  onClose,
  onConfirm
}) => {
  const isQuote = currentType === 'QUOTE';

  return (
    // CONTENEDOR GLOBAL CON DESENFOQUE PROFUNDO
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#121212] p-8 rounded-3xl border-2 border-yellow-500/50 text-center space-y-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
        
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto text-3xl font-black border border-yellow-500/40">
          ⚠️
        </div>
        
        <div>
          <h3 className="text-2xl font-black text-white">¿Cambiar tipo de cuenta?</h3>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed font-medium">
            Estás a punto de convertir esta lista de <strong className={isQuote ? 'text-purple-400 font-bold' : 'text-brand-orange font-bold'}>{isQuote ? 'Presupuesto' : 'Venta Directa'}</strong> a <strong className={!isQuote ? 'text-purple-400 font-bold' : 'text-brand-orange font-bold'}>{!isQuote ? 'Presupuesto' : 'Venta Directa'}</strong>.
          </p>
          <p className="text-xs text-gray-500 mt-2 font-mono bg-black/50 p-3 rounded-xl border border-gray-800">
            Se le asignará un nuevo número de folio secuencial y cambiarán las opciones de cobro.
          </p>
        </div>

        <div className="flex space-x-4 pt-2 border-t border-gray-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-1/2 py-4 font-black rounded-2xl text-sm shadow-lg transition-all ${
              isQuote 
                ? 'bg-brand-orange hover:bg-orange-500 text-black shadow-orange-500/20' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
            }`}
          >
            Sí, Convertir Ahora
          </button>
        </div>

      </div>
    </div>
  );
};

export default PosSwitchConfirmModal;