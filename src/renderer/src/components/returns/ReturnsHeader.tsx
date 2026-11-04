// src/components/returns/ReturnsHeader.tsx
import React from 'react';
import { RotateCcw, Receipt, History } from 'lucide-react';

interface ReturnsHeaderProps {
  activeTab: 'new' | 'history';
  onTabChange: (tab: 'new' | 'history') => void;
  canViewReturns: boolean;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const ReturnsHeader: React.FC<ReturnsHeaderProps> = ({
  activeTab,
  onTabChange,
  canViewReturns,
  isModal = false,
  onCloseModal,
}) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 mb-5 border-b border-gray-800 shrink-0">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
          <RotateCcw className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Centro de Devoluciones y Reembolsos
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">
            Busca el ticket por número de folio, selecciona las piezas a devolver y el stock se reintegrará automáticamente al Kardex.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
        <div className="flex items-center gap-1.5 bg-[#121212] p-1.5 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => onTabChange('new')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Buscar Ticket y Devolver
          </button>

          {canViewReturns && (
            <button
              type="button"
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              Historial de Devoluciones
            </button>
          )}
        </div>

        {isModal && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="px-4 py-2.5 rounded-2xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-300 font-bold text-sm border border-gray-700 transition-colors cursor-pointer"
          >
            ✕ Cerrar [Esc]
          </button>
        )}
      </div>
    </div>
  );
};

export default ReturnsHeader;
