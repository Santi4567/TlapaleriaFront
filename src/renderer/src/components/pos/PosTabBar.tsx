// src/components/pos/PosTabBar.tsx
import React, { useState } from 'react';
import { SaleTab } from '../../types/pos';

interface PosTabBarProps {
  tabs: SaleTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: (type: 'SALE' | 'QUOTE') => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onReorderTabs: (draggedId: string, targetId: string) => void;
  onClearTable: () => void;
  onCloseAll: () => void;
  hasItems: boolean;
}

const PosTabBar: React.FC<PosTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onReorderTabs,
  onClearTable,
  onCloseAll,
  hasItems
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('text/plain', id); setDraggedTabId(id); };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (dragOverTabId !== id) setDragOverTabId(id); };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTabId;
    if (sourceId && sourceId !== targetId) { onReorderTabs(sourceId, targetId); onSelectTab(sourceId); }
    setDraggedTabId(null); setDragOverTabId(null);
  };

  return (
    <div className="flex items-center justify-between bg-[#121212] p-3 rounded-3xl border border-gray-800 mb-6 flex-shrink-0 shadow-lg">
      
      {/* Lista de pestañas más amplias */}
      <div className="flex items-center space-x-3 overflow-x-auto custom-scrollbar flex-1 pr-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isQuote = tab.type === 'QUOTE';
          const isBeingDragged = tab.id === draggedTabId;
          const isDragOver = tab.id === dragOverTabId && tab.id !== draggedTabId;

          return (
            <div
              key={tab.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDragLeave={() => setDragOverTabId(null)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={() => { setDraggedTabId(null); setDragOverTabId(null); }}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center justify-between px-5 py-3 rounded-2xl font-black text-base cursor-grab active:cursor-grabbing transition-all select-none whitespace-nowrap min-w-[160px] max-w-[240px] ${
                isBeingDragged ? 'opacity-30 scale-95 border-2 border-dashed border-gray-500' : ''
              } ${
                isDragOver ? 'border-2 border-brand-orange scale-105 shadow-[0_0_20px_rgba(255,90,0,0.5)] bg-gray-800' : ''
              } ${
                !isBeingDragged && !isDragOver
                  ? isActive
                    ? isQuote 
                      ? 'bg-purple-600/20 text-purple-400 border-2 border-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                      : 'bg-brand-orange text-black font-extrabold shadow-[0_0_20px_rgba(255,90,0,0.25)]'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-gray-800/80 border-2 border-transparent'
                  : ''
              }`}
            >
              <div className="flex items-center truncate mr-3 pointer-events-none">
                <span className="mr-2 text-base">{isQuote ? '📋' : '🛒'}</span>
                <span className="truncate">{tab.title}</span>
                {tab.items.length > 0 && (
                  <span className={`ml-2.5 px-2 py-0.5 rounded-full text-xs font-mono ${
                    isActive && !isQuote ? 'bg-black/30 text-black font-black' : 'bg-gray-700 text-gray-200 font-bold'
                  }`}>
                    {tab.items.length}
                  </span>
                )}
              </div>

              {tab.isRemovable !== false && (
                <button
                  type="button"
                  onClick={(e) => onCloseTab(tab.id, e)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ml-1 transition-colors ${
                    isActive && !isQuote ? 'hover:bg-black/20 text-black/70 hover:text-black font-black' : 'hover:bg-gray-700 text-gray-500 hover:text-white font-bold'
                  }`}
                >✕</button>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTONES CON ATAJOS TIPO TECLA FÍSICA (<KBD>) */}
      <div className="flex items-center space-x-3 pl-3 border-l-2 border-gray-800/80 flex-shrink-0">

      {/* NUEVO: BOTÓN CERRAR TODAS */}
        <button
          type="button"
          onClick={onCloseAll}
          disabled={tabs.length <= 1}
          className="px-3.5 py-3 bg-red-500/10 hover:bg-red-600/20 disabled:opacity-20 disabled:cursor-not-allowed text-red-400 hover:text-red-300 font-extrabold text-sm rounded-2xl border-2 border-red-500/30 transition-all flex items-center space-x-1.5 shadow-sm"
          title="Cerrar todas las pestañas abiertas y regresar a la inicial"
        >
          <span>✕ Cerrar Todas ({tabs.length})</span>
        </button>
        
        {/* BOTÓN LIMPIAR [F4] */}
        <button
          type="button"
          onClick={onClearTable}
          disabled={!hasItems}
          className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 font-extrabold text-sm rounded-2xl border-2 border-red-500/30 transition-all flex items-center space-x-2.5 shadow-sm"
          title="Limpiar todos los artículos [F4]"
        >
          <span className="text-base">🗑️ Limpiar</span>
          <kbd className="bg-black/60 text-red-400 px-2 py-1 rounded-lg text-xs font-mono font-black border border-red-500/40 shadow-inner">
            F4
          </kbd>
        </button>

        {/* BOTÓN NUEVA VENTA [F1] */}
        <button
          type="button"
          onClick={() => onNewTab('SALE')}
          className="px-4 py-3 bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-black font-extrabold text-sm rounded-2xl border-2 border-brand-orange/40 transition-all flex items-center space-x-2.5 shadow-sm group"
          title="Nueva pestaña de venta [F1]"
        >
          <span className="text-base">+ Venta</span>
          <kbd className="bg-black/60 text-brand-orange group-hover:bg-black group-hover:text-brand-orange px-2 py-1 rounded-lg text-xs font-mono font-black border border-brand-orange/40 shadow-inner">
            F1
          </kbd>
        </button>

        {/* BOTÓN NUEVO PRESUPUESTO [F2] */}
        <button
          type="button"
          onClick={() => onNewTab('QUOTE')}
          className="px-4 py-3 bg-purple-500/15 hover:bg-purple-600 text-purple-400 hover:text-white font-extrabold text-sm rounded-2xl border-2 border-purple-500/40 transition-all flex items-center space-x-2.5 shadow-sm group"
          title="Nueva pestaña de cotización [F2]"
        >
          <span className="text-base">+ Cotizar</span>
          <kbd className="bg-black/60 text-purple-300 group-hover:bg-black group-hover:text-purple-300 px-2 py-1 rounded-lg text-xs font-mono font-black border border-purple-500/40 shadow-inner">
            F2
          </kbd>
        </button>

      </div>
    </div>
  );
};

export default PosTabBar;