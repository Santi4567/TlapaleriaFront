// src/components/pos/PosQuantityModal.tsx
import React, { useState, useRef } from 'react';
import { Product, ProductPresentation } from '../../types/product';

interface PosQuantityModalProps {
  product: Product;
  presentation: ProductPresentation;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const PosQuantityModal: React.FC<PosQuantityModalProps> = ({
  product,
  presentation,
  onClose,
  onConfirm
}) => {
  const [qty, setQty] = useState<string>('1');
  const mountTime = useRef(Date.now());

  const allowFractions = product.allowFractions !== false; // Por defecto true si es undefined
  const isTracked = product.isInventoryTracked !== false;  // Por defecto true si es undefined

  // ============================================================================
  // CÁLCULOS DINÁMICOS SEGÚN REGLAS DEL PRODUCTO
  // ============================================================================
  const parsedQty = allowFractions ? parseFloat(qty) : parseInt(qty, 10);
  const safeQty = isNaN(parsedQty) ? 0 : parsedQty;
  
  // 1. Cuánto stock base requiere
  const totalStockNeeded = parseFloat((safeQty * presentation.stockFactor).toFixed(4));
  
  // 2. Máximo vendible (Si no se rastrea, el máximo es infinito 999999)
  const rawMax = isTracked ? (product.currentStock / presentation.stockFactor) : 999999;
  const maxAllowedUnits = allowFractions ? parseFloat(rawMax.toFixed(2)) : Math.floor(rawMax);
  
  // 3. Validaciones estandarizadas
  const isPositive = safeQty > 0;
  const isIntegerValid = allowFractions ? true : Number.isInteger(safeQty);
  const hasEnoughStock = !isTracked || (totalStockNeeded <= (product.currentStock + 0.0001));
  
  const isValid = isPositive && isIntegerValid && hasEnoughStock && safeQty <= maxAllowedUnits;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() - mountTime.current < 150) return;

    if (isValid) {
      onConfirm(safeQty);
    }
  };

  // ESCUDO DE TECLADO DINÁMICO
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const blockedKeys = ['e', 'E', '-', '+'];
    // Si NO permite fracciones, bloqueamos también el punto y la coma en el teclado
    if (!allowFractions) {
      blockedKeys.push('.', ',');
    }
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-150">
      <div className="max-w-lg w-full bg-[#121212] rounded-[2rem] border-2 border-brand-orange/60 p-10 shadow-[0_0_60px_rgba(255,90,0,0.25)] text-center space-y-6 relative">
        
        {/* ENCABEZADO */}
        <div>
          <div className="flex justify-center space-x-2 mb-2">
            <span className="text-[11px] font-mono bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-md uppercase font-bold">
              {allowFractions ? '⚖️ Decimales y Enteros' : '🔒 Solo Enteros'}
            </span>
            {!isTracked && (
              <span className="text-[11px] font-mono bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-md uppercase font-bold">
                ♾️ Sin rastreo de stock
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-white leading-tight">{product.name}</h3>
          
          <div className="mt-3 inline-flex items-center space-x-2 bg-brand-orange/15 border-2 border-brand-orange/40 py-2 px-5 rounded-2xl">
            <span className="text-base font-extrabold text-brand-orange">{presentation.name}</span>
            <span className="text-gray-500 font-bold">|</span>
            <span className="text-lg font-black font-mono text-white">
              ${presentation.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* INDICADOR DE EXISTENCIAS */}
        <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 flex items-center justify-between font-mono text-xs">
          <div className="text-left">
            <span className="text-gray-500 block uppercase">Existencias almacén:</span>
            <strong className="text-white text-sm font-bold">
              {isTracked ? `${product.currentStock} ${product.unitOfMeasure}` : 'N/A (Venta Libre)'}
            </strong>
          </div>
          <div className="text-right border-l border-gray-800 pl-4">
            <span className="text-gray-500 block uppercase">Máximo vendible aquí:</span>
            <strong className={`text-sm font-black ${!hasEnoughStock ? 'text-red-500' : 'text-green-400'}`}>
              {isTracked ? `${maxAllowedUnits} u.` : '∞ Infinito'}
            </strong>
          </div>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`p-6 rounded-3xl border-2 transition-colors ${
            !hasEnoughStock && safeQty > 0 
              ? 'bg-red-500/10 border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
              : 'bg-black/50 border-gray-800'
          }`}>
            <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex justify-between items-center">
              <span>¿Qué cantidad se lleva?</span>
              {!hasEnoughStock && safeQty > 0 && (
                <span className="text-red-400 font-extrabold text-xs animate-pulse">⚠️ Stock Insuficiente</span>
              )}
            </label>
            
            <input
              type="number"
              step={allowFractions ? "any" : "1"}
              min={allowFractions ? "0.001" : "1"}
              max={isTracked ? maxAllowedUnits : undefined}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              className={`w-full bg-[#1a1a1a] border-2 text-white text-6xl font-mono font-black rounded-3xl py-6 text-center focus:outline-none transition-all ${
                !hasEnoughStock && safeQty > 0 
                  ? 'border-red-500 text-red-400 focus:border-red-500' 
                  : 'border-brand-orange focus:border-orange-400 shadow-[0_0_30px_rgba(255,90,0,0.2)]'
              }`}
            />
            
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center space-x-1">
                <span>💡 Factor:</span>
                <strong className="text-brand-orange">x{presentation.stockFactor}</strong>
              </span>

              {/* BOTÓN RÁPIDO PARA VENDER TODO EL SALDO (Solo si se rastrea inventario) */}
              {isTracked && maxAllowedUnits > 0 && (
                <button
                  type="button"
                  onClick={() => setQty(maxAllowedUnits.toString())}
                  className="text-brand-orange hover:text-black hover:bg-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-lg border border-brand-orange/30 font-bold transition-all"
                >
                  ⚡ Vender todo el saldo ({maxAllowedUnits})
                </button>
              )}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-base transition-colors flex items-center justify-center space-x-2"
            >
              <span>Cancelar</span>
              <kbd className="bg-black/50 text-gray-400 px-2 py-0.5 rounded font-mono text-xs font-black">Esc</kbd>
            </button>
            
            <button
              type="submit"
              disabled={!isValid}
              className="w-1/2 py-5 bg-brand-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-800 disabled:shadow-none disabled:cursor-not-allowed text-black font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(255,90,0,0.3)] transition-all flex items-center justify-center space-x-2 border-2 border-brand-orange"
            >
              <span>{hasEnoughStock ? 'Confirmar' : 'Sin Stock'}</span>
              <kbd className="bg-black/80 text-brand-orange px-2.5 py-0.5 rounded-lg font-mono text-xs font-black shadow-inner border border-brand-orange/40">Enter ↵</kbd>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PosQuantityModal;