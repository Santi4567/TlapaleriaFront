// src/components/pendingOrders/PendingOrdersTable.tsx
import React from 'react';
import { PendingOrder } from '../../types/pendingOrder';

interface PendingOrdersTableProps {
  items: PendingOrder[];
  onEdit: (item: PendingOrder) => void;
  onChangeStatus: (id: number, newStatus: number) => void; // <-- Regresa la prop
}

const PendingOrdersTable: React.FC<PendingOrdersTableProps> = ({ items, onEdit, onChangeStatus }) => {
  const renderStatusTag = (status: number) => {
    switch (status) {
      case 0: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-orange-500/50 text-orange-400 bg-orange-500/10">Pendiente</span>;
      case 1: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-red-500/50 text-red-400 bg-red-500/10">Cancelado</span>;
      case 2: return <span className="px-3 py-1 rounded-md text-xs font-semibold border border-green-500/50 text-green-400 bg-green-500/10">Completado</span>;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-auto overflow-x-auto min-h-0 border-t border-gray-800/50 pt-4 pr-2 custom-scrollbar">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="text-xs text-gray-500 uppercase font-semibold border-b border-gray-800">
          <tr>
            <th className="pb-3 px-2 font-medium">Fecha</th>
            <th className="pb-3 px-2 font-medium">Producto</th>
            <th className="pb-3 px-2 font-medium">Proveedor</th>
            <th className="pb-3 px-2 font-medium text-center">Cant.</th>
            <th className="pb-3 px-2 font-medium text-center">Estado</th>
            <th className="pb-3 px-2 font-medium">Usuario</th>
            <th className="pb-3 px-2 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(!items || items.length === 0) ? (
            <tr><td colSpan={7} className="py-8 text-center text-gray-500">No hay registros para mostrar.</td></tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                <td className="py-4 px-2 font-mono text-xs text-gray-400">{formatDate(item.createdAt)}</td>
                <td className="py-4 px-2">
                  <div className="font-bold text-orange-400 text-xs">{item.product?.internalCode || 'S/C'}</div>
                  <div className="text-white font-medium">{item.product?.name || 'Producto Desconocido'}</div>
                  {item.notes && <div className="text-xs text-gray-500 mt-1 italic">{item.notes}</div>}
                </td>
                <td className="py-4 px-2 text-gray-300">
                  <div className="font-bold">{item.supplier?.name || 'Sin Proveedor'}</div>
                  <div className="text-xs text-gray-500">{item.supplier?.contactName || ''}</div>
                </td>
                <td className="py-4 px-2 text-center font-bold text-white">{item.quantityText}</td>
                <td className="py-4 px-2 text-center">{renderStatusTag(item.status)}</td>
                <td className="py-4 px-2 text-gray-400 text-xs">{item.user?.name || 'Sistema'}</td>
                <td className="py-4 px-2 text-right">
                  {/* Botón Ver/Editar siempre disponible si está pendiente */}
                  {item.status === 0 && (
                    <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 p-1 mr-3" title="Ver / Editar pedido">
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                  )}
                  {/* Botón Cancelar */}
                  {item.status === 0 && (
                    <button onClick={() => onChangeStatus(item.id, 1)} className="text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 p-1" title="Cancelar pedido">
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                  )}
                  {/* Botón Completar */}
                  {item.status === 0 && (
                     <button onClick={() => onChangeStatus(item.id, 2)} className="text-green-400 hover:text-green-300 ml-3 transition-colors opacity-0 group-hover:opacity-100 p-1" title="Marcar como completado">
                       <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendingOrdersTable;