// src/components/products/ProductStepBase.tsx
import React from 'react';

interface ProductStepBaseProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  onCancel: () => void;
  onNext: (e: React.FormEvent) => void;
}

const ProductStepBase: React.FC<ProductStepBaseProps> = ({
  baseProduct,
  setBaseProduct,
  onCancel,
  onNext
}) => {
  return (
    <form onSubmit={onNext} className="space-y-6 max-w-4xl pb-12">
      
      <div className="p-4 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl mb-6">
        <p className="text-sm text-brand-orange font-bold">
          ℹ️ Paso 1: Ingresa únicamente los datos de identificación general del artículo. Los costos, inventario y formas de venta se configuran en el siguiente paso.
        </p>
      </div>

      {/* CÓDIGOS Y MARCA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-gray-300 font-bold mb-2">Código Interno / SKU *</label>
          <input 
            type="text" autoFocus placeholder="Ej. CAB-12-R, CEM-01" 
            value={baseProduct.internalCode}
            onChange={e => setBaseProduct({...baseProduct, internalCode: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Código de Barras Base</label>
          <input 
            type="text" placeholder="Ej. 75010000002 (Master)" 
            value={baseProduct.barcode}
            onChange={e => setBaseProduct({...baseProduct, barcode: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Marca</label>
          <input 
            type="text" placeholder="Ej. IUSA, Truper, Cruz Azul" 
            value={baseProduct.brand}
            onChange={e => setBaseProduct({...baseProduct, brand: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
          />
        </div>
      </div>

      {/* NOMBRE Y UBICACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-gray-300 font-bold mb-2">Nombre Genérico del Artículo *</label>
          <input 
            type="text" placeholder="Ej. Cable THW Calibre 12 Rojo, Cemento Gris Tipo CPO" 
            value={baseProduct.name}
            onChange={e => setBaseProduct({...baseProduct, name: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Ubicación en Piso / Almacén</label>
          <input 
            type="text" placeholder="Ej. Pasillo 2, Estante C, Tarima A" 
            value={baseProduct.location}
            onChange={e => setBaseProduct({...baseProduct, location: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
          />
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="block text-gray-300 font-bold mb-2">Descripción Detallada</label>
        <textarea 
          rows={3} placeholder="Ej. Cable de cobre con aislamiento de PVC para uso residencial..." 
          value={baseProduct.description}
          onChange={e => setBaseProduct({...baseProduct, description: e.target.value})}
          className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
        />
      </div>

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
        <button 
          type="button" onClick={onCancel}
          className="px-6 py-4 rounded-xl border border-gray-700 text-gray-400 font-bold hover:bg-gray-800 transition-colors"
        >
          Cancelar y Volver al Catálogo
        </button>
        
        <button 
          type="submit"
          className="px-8 py-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-black font-extrabold transition-colors shadow-lg flex items-center"
        >
          Continuar a Configuración y Variantes →
        </button>
      </div>

    </form>
  );
};

export default ProductStepBase;