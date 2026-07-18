// src/components/pos/PosProductInfoModal.tsx
import React, { useEffect } from 'react';
import { Product } from '../../types/product';

interface PosProductInfoModalProps {
  product: Product;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
}

const PosProductInfoModal: React.FC<PosProductInfoModalProps> = ({
  product,
  onClose,
  onAddProduct
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAddProduct(product);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onAddProduct, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-200">
      {/* VENTANA MÁS ANCHA (max-w-2xl) Y CON MUCHO MÁS AIRE INTERNO */}
      <div className="max-w-2xl w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-10 shadow-[0_0_60px_rgba(255,90,0,0.25)] space-y-8 relative">
        
        {/* CABECERA */}
        <div className="flex justify-between items-start border-b border-gray-800 pb-5">
          <div className="pr-6">
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-mono font-black text-black bg-brand-orange px-3 py-1 rounded-lg text-sm">
                {product.internalCode}
              </span>
              {product.brand && (
                <span className="text-sm bg-gray-800 text-gray-200 px-3 py-1 rounded-lg font-mono font-bold border border-gray-700">
                  Marca: {product.brand}
                </span>
              )}
            </div>
            <h3 className="text-3xl font-black text-white leading-tight">{product.name}</h3>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white font-black p-3 bg-gray-800/80 rounded-2xl hover:bg-gray-700 transition-colors text-base flex items-center space-x-1"
          >
            <span>✕</span>
            <kbd className="text-[10px] bg-black/50 px-1.5 py-0.5 rounded font-mono text-gray-400">Esc</kbd>
          </button>
        </div>

        {/* DESCRIPCIÓN TÉCNICA EN GRANDE PARA EL VENDEDOR */}
        <div className="bg-brand-orange/10 border-2 border-brand-orange/50 p-6 rounded-3xl relative overflow-hidden shadow-inner">
          <div className="flex items-center space-x-2 text-brand-orange font-black text-sm uppercase tracking-widest mb-3">
            <span className="text-xl">💡</span>
            <span>Usos y Descripción Técnica para el Vendedor:</span>
          </div>
          <p className="text-white font-bold text-lg leading-relaxed whitespace-pre-wrap select-all">
            {product.description || 'Sin descripción técnica adicional registrada en el catálogo para este artículo.'}
          </p>
        </div>

        {/* DATOS DE INVENTARIO Y UBICACIÓN */}
        <div className="grid grid-cols-2 gap-4 font-mono text-sm bg-black/60 p-5 rounded-2xl border border-gray-800">
          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Ubicación en Almacén:</span>
            <strong className="text-white text-base font-sans font-extrabold">{product.location || 'Sin asignar'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Existencias Actuales:</span>
            <strong className={`text-base font-sans font-black ${product.currentStock <= 0 ? 'text-red-500' : 'text-green-400'}`}>
              {product.isInventoryTracked ? `${product.currentStock} ${product.unitOfMeasure}` : 'No Stockeable (N/S)'}
            </strong>
          </div>
        </div>

        {/* LISTA DE PRESENTACIONES CON MÁS AIRE */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
            Presentaciones disponibles ({product.presentations.length}):
          </span>
          <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {product.presentations.map((pres, idx) => (
              <div key={pres.id} className="flex justify-between items-center bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-gray-800/80 font-mono text-base">
                <div>
                  <span className="text-gray-500 mr-3 font-bold">#{idx + 1}</span>
                  <span className="font-extrabold text-white font-sans text-lg">{pres.name}</span>
                  <span className="text-sm text-gray-400 ml-2">(Factor: x{pres.stockFactor})</span>
                </div>
                <span className="font-black text-brand-orange text-xl">
                  ${pres.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTONES FINALES CON TECLAS KBD BIEN CLARAS */}
        <div className="flex space-x-4 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-base transition-colors flex items-center justify-center space-x-2"
          >
            <span>← Volver al Buscador</span>
            <kbd className="bg-black/50 text-gray-400 px-2 py-1 rounded font-mono text-xs font-black">Esc</kbd>
          </button>
          
          <button
            type="button"
            onClick={() => onAddProduct(product)}
            className="w-1/2 py-5 bg-brand-orange hover:bg-orange-500 text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(255,90,0,0.3)] flex items-center justify-center space-x-3 border-2 border-brand-orange"
          >
            <span>+ Agregar al Ticket</span>
            <kbd className="bg-black/80 text-brand-orange px-2.5 py-1 rounded-lg font-mono text-xs font-black shadow-inner border border-brand-orange/40">Enter ↵</kbd>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PosProductInfoModal;