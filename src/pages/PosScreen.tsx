// src/pages/Pos.tsx
import React from 'react';

const PosScreen: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col">
      <h2 className="text-2xl font-bold text-brand-orange mb-4">Punto de Venta</h2>
      
      <div className="flex-1 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center">
        <span className="text-brand-text-muted font-medium tracking-widest">
          [ ÁREA DEL ESCÁNER Y CARRITO DE COMPRAS ]
        </span>
      </div>
    </div>
  );
};

export default PosScreen;