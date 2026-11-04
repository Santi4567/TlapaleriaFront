// src/components/pos/PosDiscountModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PosDiscountModalProps {
  grossTotal: number;
  currentDiscountAmount?: number;
  currentDiscountPercent?: number;
  onClose: () => void;
  onConfirm: (mode: 'PERCENT' | 'AMOUNT' | 'NONE', value?: number) => void;
}

const QUICK_PERCENTAGES = [5, 10, 15, 20, 50, 100];

export const PosDiscountModal: React.FC<PosDiscountModalProps> = ({
  grossTotal,
  currentDiscountAmount = 0,
  currentDiscountPercent = 0,
  onClose,
  onConfirm
}) => {
  const mountTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializar en porcentaje si ya tenía % o si no tenía nada
  const initialMode: 'PERCENT' | 'AMOUNT' =
    currentDiscountPercent > 0 ? 'PERCENT' : currentDiscountAmount > 0 ? 'AMOUNT' : 'PERCENT';
  const initialValue =
    currentDiscountPercent > 0
      ? currentDiscountPercent.toString()
      : currentDiscountAmount > 0
      ? currentDiscountAmount.toString()
      : '';

  const [mode, setMode] = useState<'PERCENT' | 'AMOUNT'>(initialMode);
  const [inputValue, setInputValue] = useState<string>(initialValue);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numVal = parseFloat(inputValue) || 0;

  // Cálculo en vivo del descuento y del nuevo total
  let calculatedDiscount = 0;
  if (numVal > 0) {
    if (mode === 'PERCENT') {
      calculatedDiscount = Math.round((grossTotal * Math.min(100, numVal)) / 100 * 100) / 100;
    } else {
      calculatedDiscount = Math.min(grossTotal, Math.round(numVal * 100) / 100);
    }
  }

  const newTotal = Math.max(0, Math.round((grossTotal - calculatedDiscount) * 100) / 100);

  // Validación
  const isTooHigh = mode === 'PERCENT' ? numVal > 100 : numVal > grossTotal;
  const isValid = numVal > 0 && !isTooHigh;

  // Auto-focus al abrir
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, [mode]);

  // Manejo de atajos Esc y Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (Date.now() - mountTime.current < 150) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (Date.now() - mountTime.current < 150) return;

    if (numVal <= 0) {
      setErrorMsg('Ingresa un descuento mayor a 0');
      return;
    }
    if (mode === 'PERCENT' && numVal > 100) {
      setErrorMsg('El porcentaje no puede ser mayor al 100%');
      return;
    }
    if (mode === 'AMOUNT' && numVal > grossTotal) {
      setErrorMsg(
        `El descuento no puede superar el total ($${grossTotal.toLocaleString('es-MX', {
          minimumFractionDigits: 2
        })})`
      );
      return;
    }

    onConfirm(mode, numVal);
  };

  const handleRemoveDiscount = () => {
    onConfirm('NONE');
  };

  const hasActiveDiscount = currentDiscountAmount > 0 || currentDiscountPercent > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-7 shadow-[0_0_60px_rgba(255,90,0,0.25)] space-y-5 relative">
        {/* CABECERA */}
        <div className="text-center border-b border-gray-800 pb-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-2xl mb-2">
            🏷️
          </div>
          <h3 className="text-2xl font-black text-white">Descuento Especial</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Para clientes frecuentes, familiares o cortesías
          </p>
        </div>

        {/* SELECTOR DE MODO: % O $ */}
        <div className="flex gap-2 bg-[#1a1a1a] p-1.5 rounded-2xl border border-gray-800 font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('PERCENT');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'PERCENT'
                ? 'bg-brand-orange text-black shadow-md shadow-brand-orange/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            % Porcentaje
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('AMOUNT');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'AMOUNT'
                ? 'bg-brand-orange text-black shadow-md shadow-brand-orange/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            $ Monto en Pesos
          </button>
        </div>

        {/* CAMPO DE CAPTURA NUMÉRICA */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-brand-orange uppercase tracking-widest">
                {mode === 'PERCENT' ? 'Porcentaje de descuento (%)' : 'Monto a descontar ($)'}
              </label>
              {isTooHigh && (
                <span className="text-[11px] font-bold text-red-400">
                  {mode === 'PERCENT' ? 'Máx 100%' : 'Supera el total'}
                </span>
              )}
            </div>

            <input
              ref={inputRef}
              type="number"
              step={mode === 'PERCENT' ? '1' : '0.01'}
              min={0}
              max={mode === 'PERCENT' ? 100 : grossTotal}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={mode === 'PERCENT' ? '0' : '0.00'}
              className={`w-full bg-[#1a1a1a] border-2 text-white text-3xl font-black rounded-2xl px-5 py-3 text-right focus:outline-none transition-all shadow-inner placeholder-gray-600 ${
                isTooHigh || errorMsg
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-700 focus:border-brand-orange'
              }`}
            />
            {errorMsg && (
              <p className="text-red-400 text-xs font-sans font-semibold mt-1 text-right">
                {errorMsg}
              </p>
            )}
          </div>

          {/* BOTONES RÁPIDOS DE PORCENTAJE (SI ESTÁ EN MODO %) */}
          {mode === 'PERCENT' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_PERCENTAGES.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setInputValue(pct.toString());
                    setErrorMsg(null);
                  }}
                  className={`flex-1 min-w-[50px] py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    numVal === pct
                      ? 'bg-brand-orange/20 text-brand-orange border-brand-orange'
                      : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                >
                  {pct === 100 ? '100% (Gratis)' : `${pct}%`}
                </button>
              ))}
            </div>
          )}

          {/* DESGLOSE EN VIVO */}
          <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-gray-800 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Total de lista:</span>
              <span className="font-bold text-gray-200">
                ${grossTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Descuento aplicado:</span>
                <span>
                  -${calculatedDiscount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="border-t border-gray-800 pt-2 flex justify-between items-baseline font-sans">
              <span className="text-xs uppercase font-extrabold tracking-wider text-gray-300">
                Nuevo Total:
              </span>
              <span className="text-2xl font-black font-mono text-brand-orange">
                ${newTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-2.5 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Cancelar [Esc]
            </button>

            {hasActiveDiscount && (
              <button
                type="button"
                onClick={handleRemoveDiscount}
                className="px-4 py-3.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                title="Quitar el descuento de este ticket"
              >
                Quitar
              </button>
            )}

            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-3.5 bg-brand-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-800 disabled:shadow-none disabled:cursor-not-allowed text-black font-black text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] border border-brand-orange cursor-pointer"
            >
              ✓ Aplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosDiscountModal;
