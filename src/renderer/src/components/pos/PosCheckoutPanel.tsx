// src/components/pos/PosCheckoutPanel.tsx
import React from 'react';
import { SaleTab } from '../../types/pos';

interface PosCheckoutPanelProps {
  activeTab: SaleTab;
  onClientChange: (name: string) => void;
  onProcessSale: () => void;
  onPrintQuote: () => void;
  onRequestSwitch: () => void;
}

const PosCheckoutPanel: React.FC<PosCheckoutPanelProps> = ({
  activeTab,
  onClientChange,
  onProcessSale,
  onPrintQuote,
  onRequestSwitch
}) => {
  const isQuote = activeTab.type === 'QUOTE';

  // Cálculos matemáticos con IVA INCLUIDO (Desglose hacia adentro)
  const totalItems = activeTab.items.reduce((acc, i) => acc + i.quantity, 0);
  
  // Suma bruta de precios con IVA incluido menos descuento
  const grossSum = activeTab.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const total = Math.max(0, grossSum - (activeTab.discount || 0));

  // Extracción matemática del IVA (El producto ya lo trae dentro)
  const subtotal = total / 1.16;
  const iva = total - subtotal;

  return (
    <div className="w-full xl:w-96 bg-[#121212] rounded-3xl p-6 border border-gray-800 flex flex-col justify-between flex-shrink-0 shadow-xl">
      
      {/* SECCIÓN SUPERIOR: CLIENTE Y TIPO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tipo de Documento</span>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            isQuote ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
          }`}>
            {isQuote ? '📋 Presupuesto' : '⚡ Venta Directa'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Cliente / Razón Social
          </label>
          <input
            type="text"
            value={activeTab.clientName}
            onChange={(e) => onClientChange(e.target.value)}
            placeholder="Ej. Público en General, Arq. Gómez"
            className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange transition-all"
          />
        </div>
      </div>

      {/* SECCIÓN INTERMEDIA: DESGLOSE CON IVA INCLUIDO */}
      <div className="my-4 space-y-2.5 bg-black/40 p-4 rounded-2xl border border-gray-800/80 font-mono">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Artículos Totales:</span>
          <span className="font-bold text-white">{totalItems}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Subtotal (Neto):</span>
          <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>I.V.A. (Incluido 16%):</span>
          <span>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        
        <div className="border-t border-gray-800 pt-2.5 flex justify-between items-baseline">
          <span className="font-sans font-black text-white text-base uppercase tracking-wider">Total:</span>
          <span className={`text-2xl font-black ${isQuote ? 'text-purple-400' : 'text-brand-orange'}`}>
            ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: BOTONES */}
      <div className="space-y-3 pt-2">
        {isQuote ? (
          <>
            <button
              type="button"
              onClick={onPrintQuote}
              disabled={activeTab.items.length === 0}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center justify-center space-x-2"
            >
              <span>🖨️ Guardar e Imprimir Cotización</span>
            </button>

            <button
              type="button"
              onClick={onRequestSwitch}
              disabled={activeTab.items.length === 0}
              className="w-full py-3.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-black disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-sm rounded-xl border border-brand-orange/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>⚡ Pasar a Venta Directa (Cobrar)</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onProcessSale}
              disabled={activeTab.items.length === 0}
              title="Procesar cobro del ticket actual [Teclado: F8 o F12]"
              className="w-full py-4 bg-brand-orange hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_25px_rgba(255,90,0,0.3)] flex items-center justify-center space-x-3 group border-2 border-brand-orange"
            >
              <span>💰 Cobrar Ahora</span>
              <kbd className="bg-black/80 text-brand-orange group-hover:bg-black group-hover:text-brand-orange px-2.5 py-1 rounded-lg font-mono text-xs font-black shadow-inner border border-brand-orange/40">
                F8
              </kbd>
            </button>

            <button
              type="button"
              onClick={onRequestSwitch}
              disabled={activeTab.items.length === 0}
              className="w-full py-3 bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-xs rounded-xl border border-purple-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>📋 Convertir a Presupuesto (Cotizar)</span>
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default PosCheckoutPanel;