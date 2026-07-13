// src/components/products/ProductStepSummary.tsx
import React, { useState } from 'react';
import { CreatePresentationRequest } from '../../types/product';

interface ProductStepSummaryProps {
  baseProduct: any;
  presentations: CreatePresentationRequest[];
  supplierName: string;
  onBackToEdit: () => void;
  onConfirmSave: () => Promise<void>;
  isSubmitting: boolean;
}

const ProductStepSummary: React.FC<ProductStepSummaryProps> = ({
  baseProduct,
  presentations,
  supplierName,
  onBackToEdit,
  onConfirmSave,
  isSubmitting
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const finalPresentations = presentations.length === 0 ? [{
    name: baseProduct.name || "Presentación Base",
    code: baseProduct.internalCode || "BASE",
    barcode: baseProduct.barcode || "",
    price: Number(baseProduct.baseSalePrice || 0),
    stockFactor: 1
  }] : presentations;

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      
      <div className="flex justify-between items-center bg-[#121212] p-6 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-2xl font-black text-white">Verificación de Estructura</h3>
          <p className="text-gray-400 text-sm mt-1">
            {presentations.length === 0 
              ? "Se ha generado una presentación única con el precio de venta capturado."
              : `Se guardarán el producto base y sus ${presentations.length} variantes de venta.`}
          </p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-brand-orange hover:underline text-sm font-bold"
        >
          {isExpanded ? "Colapsar Detalle" : "Expandir Detalle"}
        </button>
      </div>

      {/* VISTA TREE LINUX OSCURA CON SCROLL DESBLOQUEADO (max-h-[60vh] overflow-y-auto) */}
      <div className="p-6 bg-black rounded-2xl border border-gray-800 font-mono text-base max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        {/* NODO PADRE */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-900 sticky top-0 bg-black z-10">
          <div className="flex items-center">
            <span className="text-brand-orange font-bold mr-2">└──</span>
            <span className="text-white font-black text-xl mr-3">{baseProduct.name}</span>
            <span className="bg-gray-800 text-brand-orange text-xs px-2 py-0.5 rounded border border-gray-700">
              SKU: {baseProduct.internalCode}
            </span>
          </div>
          <button 
            onClick={onBackToEdit}
            className="flex items-center px-4 py-2 bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-black font-extrabold text-xs rounded-xl border border-brand-orange/50 transition-all shadow-md"
          >
            EDITAR PADRE
          </button>
        </div>

        {/* DETALLES DEL PADRE */}
        {isExpanded && (
          <div className="ml-8 my-4 p-4 bg-[#121212] rounded-xl border border-gray-800/80 text-sm font-sans grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-300">
            <div><span className="text-gray-500 block text-xs">Proveedor:</span> <strong className="text-white">{supplierName}</strong></div>
            <div><span className="text-gray-500 block text-xs">Costo / Margen:</span> <strong className="text-white">${baseProduct.supplierPrice} ({baseProduct.profitMargin}%)</strong></div>
            <div><span className="text-gray-500 block text-xs">Inventario Inicial:</span> <strong className="text-white">{baseProduct.isInventoryTracked ? `${baseProduct.initialStock} ${baseProduct.unitOfMeasure}` : 'No Stockeable'}</strong></div>
            <div><span className="text-gray-500 block text-xs">Caducidad:</span> <strong className="text-white">{baseProduct.hasExpiration ? baseProduct.nextExpirationDate : 'No caduca'}</strong></div>
          </div>
        )}

        {/* NODOS HIJOS */}
        <div className="mt-4 space-y-3">
          {finalPresentations.map((pres, idx) => {
            const isLast = idx === finalPresentations.length - 1;
            const isCloned = presentations.length === 0;
            return (
              <div key={idx} className="ml-8 p-3 bg-[#0a0a0a] rounded-xl border border-gray-900 flex items-center justify-between text-gray-300 hover:border-gray-700 transition-all">
                <div className="flex items-center">
                  <span className="text-gray-600 font-bold mr-2">{isLast ? '└──' : '├──'}</span>
                  <span className="font-bold text-white mr-2">{pres.name}</span>
                  <span className="text-gray-500 text-sm mr-2">[{pres.code}]</span>
                  <span className="text-brand-orange font-black text-lg">${pres.price}</span>
                  <span className="text-xs text-gray-500 ml-2">(Factor: x{pres.stockFactor})</span>
                  {isCloned && (
                    <span className="ml-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded font-sans">
                      Autogenerada
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={onBackToEdit}
                  className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white hover:text-brand-orange font-bold text-xs rounded-lg transition-all"
                >
                  EDITAR
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* BOTONES FINALES */}
      <div className="pt-6 border-t border-gray-800 flex justify-between">
        <button 
          type="button" onClick={onBackToEdit}
          className="px-6 py-4 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors"
        >
          ← Volver y Modificar Datos
        </button>
        
        <button 
          onClick={onConfirmSave}
          disabled={isSubmitting}
          className="px-10 py-4 rounded-2xl bg-brand-orange hover:bg-orange-600 text-black font-black text-xl transition-all shadow-[0_0_30px_rgba(255,90,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? 'Guardando en Base de Datos...' : '¡Confirmar y Guardar Producto!'}
        </button>
      </div>

    </div>
  );
};

export default ProductStepSummary;