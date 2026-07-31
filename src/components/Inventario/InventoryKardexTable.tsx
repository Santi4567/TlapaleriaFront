// src/components/Inventario/InventoryKardexTable.tsx
import React from 'react';
import { Product } from '../../types/product';

interface InventoryKardexTableProps {
  product: Product;
}

const InventoryKardexTable: React.FC<InventoryKardexTableProps> = ({ product }) => {
  return (
    <div className="w-full md:w-2/3 flex flex-col bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Historial del Producto (Kardex)</h3>
        {/* Aquí mostramos un resumen rápido si lo necesitas */}
      </div>
      
      <div className="flex-1 bg-[#121212] rounded-xl border border-gray-800 flex items-center justify-center flex-col text-gray-500">
        <span className="text-5xl mb-4">📊</span>
        <p className="font-bold">El Kardex está en desarrollo</p>
        <p className="text-sm mt-2 max-w-sm text-center">
          Aquí se mostrará el historial completo de entradas y salidas para 
          <strong className="text-gray-300 ml-1">{product.name}</strong>.
        </p>
      </div>
    </div>
  );
};

export default InventoryKardexTable;