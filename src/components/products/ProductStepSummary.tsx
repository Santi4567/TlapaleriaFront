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
  // La tarjeta 0 (Padre) inicia expandida por defecto
  const [expandedCards, setExpandedCards] = useState<number[]>([0]);

  // CORRECCIÓN: El padre SIEMPRE existe como la presentación principal
  const basePresentation = {
    name: baseProduct.name || "Presentación Base",
    code: baseProduct.internalCode || "BASE",
    barcode: baseProduct.barcode || "",
    price: Number(baseProduct.baseSalePrice || 0),
    stockFactor: Number(baseProduct.baseStockFactor || 1)
  };

  // Unimos siempre al Padre (posición 0) con todos sus Hijos (posición 1 en adelante)
  const finalPresentations = [basePresentation, ...presentations];

  const toggleCard = (idx: number) => {
    if (expandedCards.includes(idx)) {
      setExpandedCards(expandedCards.filter(i => i !== idx));
    } else {
      setExpandedCards([...expandedCards, idx]);
    }
  };

  return (
    // CAMBIO CLAVE: min-h-full en lugar de h-full para permitir que crezca si abres muchas cards
    <div className="flex flex-col flex-1 pb-2 min-h-full">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center bg-[#121212] p-6 rounded-2xl border border-gray-800 flex-shrink-0">
        <div>
          <h3 className="text-2xl font-black text-white">Verificación Final</h3>
          <p className="text-gray-400 text-sm mt-1">
            {presentations.length === 0 
              ? "Se generará 1 presentación única con el Precio Base."
              : `Se guardará el artículo principal y sus ${presentations.length} variantes de venta.`}
          </p>
        </div>
      </div>

      {/* LISTA DE TARJETAS EXPANDIBLES (flex-1 para llenar el centro) */}
      <div className="mt-6 space-y-4 flex-1">
        {finalPresentations.map((pres, idx) => {
          const isExpanded = expandedCards.includes(idx);
          const isBase = idx === 0;

          return (
            <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 group ${isBase ? 'border-brand-orange/40 bg-brand-orange/5' : 'border-gray-800 bg-[#121212]'}`}>
              
              {/* HEADER DE LA TARJETA (Clicable) */}
              <div 
                onClick={() => toggleCard(idx)} 
                className="cursor-pointer p-5 flex justify-between items-center hover:bg-black/40 transition-colors"
                title="Haz clic para ver detalles o modificar"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-md ${isBase ? 'bg-brand-orange text-black' : 'bg-gray-800 text-white border border-gray-600'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="text-xl font-bold text-white group-hover:text-brand-orange transition-colors">{pres.name}</h4>
                      {isBase && (
                        <span className="bg-brand-orange/20 text-brand-orange text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest border border-brand-orange/30">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-mono flex items-center">
                      SKU: <span className="text-gray-300 font-bold ml-1 mr-3">{pres.code}</span> | 
                      <span className="ml-3">Factor:</span> <span className="text-gray-300 font-bold ml-1">x{pres.stockFactor}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <span className="text-2xl font-black text-brand-orange font-mono">${pres.price}</span>
                  <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-brand-orange/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-orange' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* CONTENIDO EXPANDIDO */}
              {isExpanded && (
                <div className="p-6 border-t border-gray-800/50 bg-black/60 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                    {isBase ? (
                      <>
                        <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Proveedor</span><strong className="text-white text-base">{supplierName}</strong></div>
                        <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Costo / Margen</span><strong className="text-white text-base">${baseProduct.supplierPrice} ({baseProduct.profitMargin}%)</strong></div>
                        <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Stock Inicial</span><strong className="text-white text-base">{baseProduct.isInventoryTracked ? `${baseProduct.initialStock} ${baseProduct.unitOfMeasure}` : 'N/S'}</strong></div>
                        <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Caducidad</span><strong className="text-white text-base">{baseProduct.hasExpiration ? baseProduct.nextExpirationDate : 'No caduca'}</strong></div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Código (SKU)</span><strong className="text-white text-base">{pres.code}</strong></div>
                        <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Factor de Descuento</span><strong className="text-white text-base">x{pres.stockFactor}</strong></div>
                      </>
                    )}
                    <div className={!isBase ? 'sm:col-span-2' : ''}>
                      <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Código de Barras Escáner</span>
                      <strong className="text-white text-base font-mono">{pres.barcode || 'Ninguno registrado'}</strong>
                    </div>
                  </div>
                  
                  {/* BOTÓN DE EDITAR INTERNO SÚPER CLARO */}
                  <div className="flex justify-end border-t border-gray-800/50 pt-4 mt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onBackToEdit(); }} 
                      className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-brand-orange font-extrabold text-sm rounded-xl flex items-center transition-colors shadow-md border border-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                      Modificar información de {isBase ? 'la base' : 'esta variante'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTONES FINALES: mt-auto ES EL QUE LOS TIRA HASTA EL SUELO */}
      <div className="mt-auto pt-6 border-t border-gray-800 flex justify-between flex-shrink-0">
        <button 
          type="button" onClick={onBackToEdit}
          className="px-6 py-4 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors"
        >
          ← Regresar a Configuración
        </button>
        
        <button 
          onClick={onConfirmSave}
          disabled={isSubmitting}
          className="px-10 py-4 rounded-2xl bg-brand-orange hover:bg-orange-600 text-black font-black text-xl transition-all shadow-[0_0_30px_rgba(255,90,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? 'Guardando...' : '¡Confirmar y Guardar Producto!'}
        </button>
      </div>

    </div>
  );
};

export default ProductStepSummary;