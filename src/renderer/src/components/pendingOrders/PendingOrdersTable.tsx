// src/components/pendingOrders/PendingOrdersTable.tsx
import React from 'react';
import { PendingOrder } from '../../types/pendingOrder';

interface PendingOrdersTableProps {
  items: PendingOrder[];
  onEdit: (item: PendingOrder) => void;
  onChangeStatus: (id: number, newStatus: number) => void;
}

const PendingOrdersTable: React.FC<PendingOrdersTableProps> = ({ items, onEdit, onChangeStatus }) => {
  
  // Renderizado dinámico de la etiqueta de estado
  const renderStatusTag = (status: number) => {
    switch (status) {
      case 0: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-orange-500/50 text-orange-400 bg-orange-500/10">Pendiente</span>;
      case 1: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-purple-500/50 text-purple-400 bg-purple-500/10">Pedido</span>;
      case 2: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-red-500/50 text-red-400 bg-red-500/10">Cancelado</span>;
      case 3: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-green-500/50 text-green-400 bg-green-500/10">Completado</span>;
      default: return null;
    }
  };

  // Formateador de fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Función para determinar si es producto de catálogo o encargo especial
  const getProductDisplay = (item: PendingOrder) => {
    if (item.product) {
      return { 
        code: item.product.internalCode || 'S/C', 
        name: item.product.name, 
        isCustom: false 
      };
    } else if (item.newProductName) {
      const parts = item.newProductName.split(' | ');
      return { 
        code: parts[0] || 'S/C', 
        name: parts[1] || item.newProductName, 
        isCustom: true 
      };
    }
    return { code: 'S/C', name: 'Producto Desconocido', isCustom: false };
  };

  return (
    <div className="flex-1 overflow-auto overflow-x-auto min-h-0 border-t border-gray-800/50 pt-4 pr-2 custom-scrollbar">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="text-xs text-gray-500 uppercase font-semibold border-b border-gray-800">
          <tr>
            <th className="pb-3 px-2 font-medium">Producto</th>
            <th className="pb-3 px-2 font-medium">Proveedor</th>
            <th className="pb-3 px-2 font-medium text-center">Cant.</th>
            <th className="pb-3 px-2 font-medium text-center">Estado</th>
            <th className="pb-3 px-2 font-medium">F. Solicitud</th>
            <th className="pb-3 px-2 font-medium">Últ. Actividad</th>
            <th className="pb-3 px-2 font-medium">Usuario</th>
            <th className="pb-3 px-2 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(!items || items.length === 0) ? (
            <tr><td colSpan={8} className="py-8 text-center text-gray-500">No hay registros para mostrar.</td></tr>
          ) : (
            items.map((item) => {
              const display = getProductDisplay(item);
              
              return (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                  
                  {/* COLUMNA PRODUCTO */}
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold font-mono text-xs ${display.isCustom ? 'text-fuchsia-400' : 'text-orange-400'}`}>
                        {display.code}
                      </span>
                      {display.isCustom && (
                        <span className="text-[8px] bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-fuchsia-500/30">
                          Encargo
                        </span>
                      )}
                    </div>
                    <div className="text-white font-medium">{display.name}</div>
                    {item.notes && <div className="text-xs text-gray-500 mt-1 italic line-clamp-2 max-w-[200px]" title={item.notes}>{item.notes}</div>}
                  </td>
                  
                  {/* COLUMNA PROVEEDOR */}
                  <td className="py-4 px-2 text-gray-300">
                    <div className="font-bold">{item.supplier?.name || 'Sin Proveedor'}</div>
                    <div className="text-xs text-gray-500">{item.supplier?.contactName || ''}</div>
                  </td>
                  
                  <td className="py-4 px-2 text-center font-bold text-white">{item.quantityText}</td>
                  
                  <td className="py-4 px-2 text-center">
                    {renderStatusTag(item.status)}
                  </td>

                  <td className="py-4 px-2 font-mono text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>

                  <td className="py-4 px-2 font-mono text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(item.updatedAt)}
                  </td>
                  
                  <td className="py-4 px-2 text-gray-400 text-xs truncate max-w-[100px]" title={item.user?.name}>
                    {item.user?.name || 'Sistema'}
                  </td>
                  
                  <td className="py-4 px-2 text-right whitespace-nowrap">
                    
                    {/* Botón Ver/Editar */}
                    <button 
                      onClick={() => onEdit(item)} 
                      className="text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 p-1.5 mr-2 rounded hover:bg-blue-500/10" 
                      title={item.status >= 2 ? "Ver detalle histórico" : "Ver / Editar pedido"}
                    >
                      {item.status >= 2 ? (
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      )}
                    </button>

                    {/* Botón rápido para marcar como pedido (Solo Pendientes) */}
                    {item.status === 0 && (
                      <button 
                        onClick={() => onChangeStatus(item.id, 1)} 
                        className="text-purple-400 hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100 p-1.5 mr-2 rounded hover:bg-purple-500/10" 
                        title="Marcar como 'Pedido enviado al proveedor'"
                      >
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      </button>
                    )}

                    {/* Botón Cancelar (Pendientes y Pedidos) */}
                    {(item.status === 0 || item.status === 1) && (
                      <button 
                        onClick={() => onChangeStatus(item.id, 2)} 
                        className="text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/10" 
                        title="Cancelar pedido"
                      >
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </button>
                    )}

                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendingOrdersTable;