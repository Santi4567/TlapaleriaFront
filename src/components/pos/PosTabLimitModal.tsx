// src/components/pos/PosTabLimitModal.tsx
import React, { useEffect, useRef } from 'react';

interface PosTabLimitModalProps {
  maxTabs: number;
  onClose: () => void;
}

const PosTabLimitModal: React.FC<PosTabLimitModalProps> = ({
  maxTabs,
  onClose
}) => {
  // ESCUDO DE MONTAJE (150ms) para evitar que un Enter anterior lo cierre accidentalmente
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || Date.now() - mountTime.current < 150) return;

      // Tanto Enter como Escape cierran esta advertencia para agilizar el trabajo
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-yellow-500/80 p-8 shadow-[0_0_60px_rgba(234,179,8,0.25)] text-center space-y-6 relative">
        
        {/* ÍCONO GIGANTE DE ADVERTENCIA */}
        <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto text-4xl font-black border-2 border-yellow-500/40 shadow-inner">
          ⚠️
        </div>

        {/* MENSAJE DE LÍMITE ALCANZADO */}
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">¡Límite de Pestañas Alcanzado!</h3>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed font-medium">
            El sistema está configurado para un máximo de <strong className="text-yellow-400 font-bold">{maxTabs} cuentas abiertas</strong> al mismo tiempo para proteger la memoria y el orden del mostrador.
          </p>
          <p className="text-xs text-gray-400 mt-3 font-mono bg-black/60 p-3.5 rounded-xl border border-gray-800">
            💡 Por favor, cobra, convierte o vacía alguna de las cuentas que tienes en espera antes de abrir una nueva.
          </p>
        </div>

        {/* BOTÓN ÚNICO DE ENTENDIDO CON ATAJOS */}
        <div className="pt-2 border-t border-gray-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl text-base shadow-[0_0_25px_rgba(234,179,8,0.3)] transition-all flex items-center justify-center space-x-3"
          >
            <span>Entendido / Volver al Mostrador</span>
            <div className="flex items-center space-x-1">
              <kbd className="bg-black/80 text-yellow-400 px-2 py-0.5 rounded font-mono text-xs font-black shadow-inner">Enter ↵</kbd>
              <kbd className="bg-black/80 text-yellow-400 px-2 py-0.5 rounded font-mono text-xs font-black shadow-inner">Esc</kbd>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PosTabLimitModal;