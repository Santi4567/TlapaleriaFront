// src/components/pos/PosCartTable.tsx
import React from 'react';
import { CartItem } from '../../types/pos';

interface PosCartTableProps {
  items: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
}

const PosCartTable: React.FC<PosCartTableProps> = ({ items, onUpdateQty, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl p-12 text-center bg-[#121212]/50">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center text-3xl mb-4 text-gray-600">🛒</div>
        <p className="text-white font-bold text-xl">El carrito está vacío</p>
        <p className="text-gray-500 text-sm mt-1 max-w-sm">Busca un producto en la barra superior o escanea para comenzar el ticket.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-800 rounded-2xl bg-[#121212] relative flex flex-col">
      <table className="w-full text-left text-sm text-gray-300 table-fixed">
        <thead className="bg-[#1a1a1a] text-gray-400 font-bold uppercase text-xs sticky top-0 z-10 border-b border-gray-800">
          <tr>
            <th className="py-3.5 px-3 w-[15%]">SKU / Marca</th>
            <th className="py-3.5 px-3 w-[35%]">Producto / Presentación</th>
            <th className="py-3.5 px-3 w-[15%] text-center">Ubicación</th>
            <th className="py-3.5 px-3 w-[18%] text-center">Cantidad</th>
            <th className="py-3.5 px-3 w-[12%] text-right">Subtotal</th>
            <th className="py-3.5 px-2 w-[5%] text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60 font-medium">
          {items.map((item, idx) => {
            const subtotal = item.unitPrice * item.quantity;
            return (
              <tr key={`${item.productId}-${item.presentationId}`} className="hover:bg-gray-800/30 transition-colors group">
                
                {/* SKU Y MARCA */}
                <td className="py-3.5 px-3 truncate">
                  <span className="font-mono font-bold text-brand-orange block truncate" title={item.internalCode}>
                    {item.internalCode}
                  </span>
                  <span className="text-[11px] text-gray-400 block truncate" title={item.brand || 'Sin marca'}>
                    {item.brand || 'Genérico'}
                  </span>
                </td>

                {/* PRODUCTO Y PRESENTACIÓN CON TRUNCADO PARA NOMBRES LARGOS */}
                <td className="py-3.5 px-3">
                  <p className="font-extrabold text-white text-sm truncate cursor-help" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="px-1.5 py-0.5 bg-black rounded text-[11px] text-brand-orange font-mono font-bold border border-gray-800 truncate" title={item.presentationName}>
                      {item.presentationName}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      (${item.unitPrice} / {item.unitOfMeasure})
                    </span>
                  </div>
                </td>

                {/* UBICACIÓN */}
                <td className="py-3.5 px-3 text-center truncate text-xs text-gray-400 font-mono" title={item.location || 'Sin asignar'}>
                  {item.location || '—'}
                </td>

                {/* CANTIDAD Y BOTONES */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center justify-center space-x-1 bg-black/60 p-1 rounded-xl border border-gray-800 w-max mx-auto">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(idx, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-black transition-colors flex items-center justify-center text-xs"
                    >-</button>
                    
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onUpdateQty(idx, val);
                      }}
                      className="w-12 bg-transparent text-center font-mono font-bold text-white text-sm focus:outline-none"
                    />
                    
                    <button
                      type="button"
                      onClick={() => onUpdateQty(idx, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-black transition-colors flex items-center justify-center text-xs"
                    >+</button>
                  </div>
                </td>

                {/* SUBTOTAL MULTIPLICADO */}
                <td className="py-3.5 px-3 text-right font-mono font-black text-white text-sm truncate">
                  ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>

                {/* ACCIÓN ELIMINAR */}
                <td className="py-3.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="text-gray-600 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                    title="Eliminar artículo del ticket"
                  >✕</button>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PosCartTable;