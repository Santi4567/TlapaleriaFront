// src/components/pos/PosPaymentMethodModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethod } from '../../types/pos';

interface PosPaymentMethodModalProps {
  totalAmount: number;
  onClose: () => void;
  onSelectMethod: (method: PaymentMethod) => void;
}

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  icon: string;
  subtitle: string;
}

const PosPaymentMethodModal: React.FC<PosPaymentMethodModalProps> = ({
  totalAmount,
  onClose,
  onSelectMethod
}) => {
  // Estado para controlar qué opción está resaltada con el teclado (0 = Efectivo por defecto)
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  // Escudo de montaje para evitar el Enter fantasma (150ms)
  const mountTime = useRef(Date.now());

  // Lista estructurada de métodos para recorrerlos fácilmente
  const paymentOptions: PaymentOption[] = [
    { id: 'CASH', title: 'Efectivo', icon: '💵', subtitle: 'Pago en mostrador →' },
    { id: 'TRANSFER', title: 'Transferencia', icon: '🏦', subtitle: 'SPEI / BBVA →' },
    { id: 'CARD', title: 'Tarjeta Débito/Crédito', icon: '💳', subtitle: 'Terminal TPV →' }
  ];

  // ============================================================================
  // NAVEGACIÓN POR TECLADO (↑, ↓, Enter, Esc)
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escudo anti-rebote y anti-enter fantasma de la pantalla anterior
      if (e.repeat || Date.now() - mountTime.current < 150) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % paymentOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + paymentOptions.length) % paymentOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectMethod(paymentOptions[selectedIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, paymentOptions, onSelectMethod, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-8 shadow-[0_0_60px_rgba(255,90,0,0.25)] text-center space-y-6 relative">
        
        {/* CABECERA */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">Paso 1 de 2</span>
            <span className="text-[11px] font-mono bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700">
              Usa ↑ ↓ y Enter
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">Selecciona Método</h3>
          <p className="text-xs font-mono text-gray-400 mt-1">Total a cobrar en este ticket:</p>
          <p className="text-4xl font-black font-mono text-brand-orange mt-1.5 drop-shadow-md">
            ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* LISTA DE OPCIONES NAVEGABLES */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {paymentOptions.map((option, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (Date.now() - mountTime.current >= 100) {
                    onSelectMethod(option.id);
                  }
                }}
                onMouseEnter={() => setSelectedIndex(idx)} // Permite que el ratón también tome el control del foco
                className={`w-full py-4 px-6 rounded-2xl border-2 transition-all flex items-center justify-between group shadow-md ${
                  isSelected
                    ? 'bg-brand-orange text-black font-black border-brand-orange scale-[1.03] shadow-[0_0_25px_rgba(255,90,0,0.4)]'
                    : 'bg-[#1a1a1a] text-white font-extrabold border-gray-800 hover:border-gray-700 hover:bg-gray-800/60'
                }`}
              >
                <span className="flex items-center space-x-3.5">
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-lg tracking-tight">{option.title}</span>
                </span>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-mono ${isSelected ? 'text-black/80 font-black' : 'text-gray-500'}`}>
                    {option.subtitle}
                  </span>
                  {isSelected && (
                    <kbd className="bg-black/80 text-brand-orange px-2 py-0.5 rounded text-[10px] font-mono font-black shadow-inner border border-brand-orange/40">
                      ↵
                    </kbd>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* BOTÓN CANCELAR CON ATAJO */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors mt-4 flex items-center justify-center space-x-2"
        >
          <span>✕ Cancelar / Volver al Ticket</span>
          <kbd className="bg-black/50 text-gray-400 px-2 py-0.5 rounded font-mono text-xs font-black">Esc</kbd>
        </button>

      </div>
    </div>
  );
};

export default PosPaymentMethodModal;