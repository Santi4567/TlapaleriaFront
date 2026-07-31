// src/components/Inventario/InventoryTable.tsx
import React from 'react';

const InventoryTable: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-[#1a1a1a]">
        <h3 className="text-white font-bold text-lg">Últimos Movimientos (Global)</h3>
        <p className="text-gray-500 text-xs mt-1">Historial general de entradas y salidas de inventario.</p>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#1c1c1c]">
        <span className="text-6xl mb-4">⏳</span>
        <p className="text-lg font-bold">Módulo en construcción</p>
        <p className="text-sm mt-2 text-center max-w-md">
          Próximamente esta tabla mostrará en tiempo real los movimientos más recientes realizados en la sucursal.
        </p>
      </div>
    </div>
  );
};

export default InventoryTable;