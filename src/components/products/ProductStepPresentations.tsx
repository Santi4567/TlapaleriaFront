// src/components/products/ProductStepPresentations.tsx
import React, { useState } from 'react';
import { CreatePresentationRequest } from '../../types/product';

interface ProductStepPresentationsProps {
  presentations: CreatePresentationRequest[];
  setPresentations: React.Dispatch<React.SetStateAction<CreatePresentationRequest[]>>;
  onBackToBase: () => void;
  onFinishToSummary: () => void;
}

const ProductStepPresentations: React.FC<ProductStepPresentationsProps> = ({
  presentations,
  setPresentations,
  onBackToBase,
  onFinishToSummary
}) => {
  const [currentPres, setCurrentPres] = useState<any>({
    name: '',
    code: '',
    barcode: '',
    price: "",
    stockFactor: 1
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleNumberChange = (field: string, value: string, isFloat: boolean = false) => {
    if (value === "") {
      setCurrentPres((prev: any) => ({ ...prev, [field]: "" }));
    } else {
      const num = isFloat ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(num)) {
        setCurrentPres((prev: any) => ({ ...prev, [field]: num }));
      }
    }
  };

  const handleSavePresentation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentPres.name.trim() || !currentPres.code.trim() || Number(currentPres.price) <= 0) {
      alert("Llena el Nombre, Código y un Precio mayor a 0 para la presentación.");
      return;
    }

    const updatedPres = { ...currentPres, price: Number(currentPres.price) };

    if (editingIndex !== null) {
      // Modificamos la existente
      const newList = [...presentations];
      newList[editingIndex] = updatedPres;
      setPresentations(newList);
      setEditingIndex(null);
    } else {
      // Agregamos una nueva
      setPresentations([...presentations, updatedPres]);
    }

    setCurrentPres({ name: '', code: '', barcode: '', price: "", stockFactor: 1 });
  };

  const handleEditPresentation = (idx: number) => {
    setCurrentPres(presentations[idx]);
    setEditingIndex(idx);
  };

  const handleDeletePresentation = (idx: number) => {
    setPresentations(presentations.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
      setCurrentPres({ name: '', code: '', barcode: '', price: "", stockFactor: 1 });
    }
  };

  const handleFinish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPres.name.trim() && currentPres.code.trim() && Number(currentPres.price) > 0) {
      const updatedPres = { ...currentPres, price: Number(currentPres.price) };
      if (editingIndex !== null) {
        const newList = [...presentations];
        newList[editingIndex] = updatedPres;
        setPresentations(newList);
      } else {
        setPresentations([...presentations, updatedPres]);
      }
    }
    onFinishToSummary();
  };

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      
      <div className="p-6 bg-[#121212] rounded-2xl border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingIndex !== null ? `Editando: ${currentPres.name}` : 'Nueva Presentación de Venta'}
        </h3>
        <p className="text-sm text-gray-400 mb-6">Agrega o modifica aquí cómo cobrarás este producto en el mostrador (Ej. Kilo Suelto vs Bulto 50kg).</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-gray-300 font-bold mb-2">Nombre Empaque/Unidad *</label>
            <input 
              type="text" autoFocus placeholder="Ej. Rollo de 100m, Cubeta 19L" value={currentPres.name}
              onChange={e => setCurrentPres({...currentPres, name: e.target.value})}
              className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-2">Código Variante *</label>
            <input 
              type="text" placeholder="Ej. CAB-ROL, CEM-BUL" value={currentPres.code}
              onChange={e => setCurrentPres({...currentPres, code: e.target.value})}
              className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-2">Código Barras Escáner</label>
            <input 
              type="text" placeholder="Opcional si se pesa" value={currentPres.barcode}
              onChange={e => setCurrentPres({...currentPres, barcode: e.target.value})}
              className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-brand-orange font-bold mb-2">Precio de Venta ($) *</label>
            <input 
              type="number" step="0.01" 
              value={currentPres.price}
              onChange={e => handleNumberChange("price", e.target.value, true)}
              className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-2xl font-black rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono text-brand-orange"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-2">Factor de Stock (Descuento)</label>
            <div className="flex items-center">
              <input 
                type="number" step="1" 
                value={currentPres.stockFactor === "" ? "" : currentPres.stockFactor}
                onChange={e => handleNumberChange("stockFactor", e.target.value, false)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold mr-3"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">Unidades base<br/>por cada venta</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {editingIndex !== null && (
            <button 
              type="button"
              onClick={() => { setEditingIndex(null); setCurrentPres({ name: '', code: '', barcode: '', price: "", stockFactor: 1 }); }}
              className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors"
            >
              Cancelar Edición
            </button>
          )}
          <button 
            onClick={handleSavePresentation}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-brand-orange font-bold transition-colors border border-gray-700 flex items-center shadow-md"
          >
            {editingIndex !== null ? '✓ Guardar Cambios en Presentación' : '+ Agregar Presentación a la Lista'}
          </button>
        </div>
      </div>

      {/* LISTA CAPTURADA CON BOTÓN DE EDITAR */}
      {presentations.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-white mb-3">Presentaciones en Lista ({presentations.length}):</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presentations.map((p, idx) => (
              <div key={idx} className={`p-4 bg-black/40 border rounded-xl flex justify-between items-center ${editingIndex === idx ? 'border-brand-orange ring-1 ring-brand-orange' : 'border-gray-800'}`}>
                <div>
                  <p className="font-extrabold text-white text-lg">{p.name}</p>
                  <p className="text-xs text-gray-400 font-mono">Código: {p.code} | Factor: x{p.stockFactor}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xl font-mono font-black text-brand-orange">${p.price}</p>
                  <div className="flex space-x-3 mt-1">
                    <button 
                      type="button"
                      onClick={() => handleEditPresentation(idx)}
                      className="text-yellow-500 hover:text-yellow-400 text-xs font-bold underline"
                    >
                      Editar
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeletePresentation(idx)}
                      className="text-red-500 hover:text-red-400 text-xs underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="pt-6 border-t border-gray-800 flex justify-between">
        <button 
          type="button" onClick={onBackToBase}
          className="px-6 py-4 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors"
        >
          ← Regresar al Paso 1
        </button>
        <button 
          onClick={handleFinish}
          className="px-8 py-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-black font-extrabold transition-colors shadow-lg"
        >
          Finalizar Presentaciones →
        </button>
      </div>

    </div>
  );
};

export default ProductStepPresentations;