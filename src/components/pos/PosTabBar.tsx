// src/components/pos/PosTabBar.tsx
import React, { useState } from 'react';
import { SaleTab } from '../../types/pos';

interface PosTabBarProps {
  tabs: SaleTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: (type: 'SALE' | 'QUOTE') => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onReorderTabs: (draggedId: string, targetId: string) => void; // NUEVO PROP
}

const PosTabBar: React.FC<PosTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onReorderTabs
}) => {
  // Estados visuales locales para el efecto Drag & Drop
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  // 1. Al iniciar el arrastre, guardamos el ID en memoria
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTabId(tabId);
  };

  // 2. Al pasar por encima de otra pestaña, prevenimos el comportamiento por defecto para permitir el Drop
  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  };

  // 3. Al soltar la pestaña en su nueva posición
  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const sourceTabId = e.dataTransfer.getData('text/plain') || draggedTabId;
    
    if (sourceTabId && sourceTabId !== targetTabId) {
      onReorderTabs(sourceTabId, targetTabId);
      // Opcional: Al soltarla, la convertimos en la pestaña activa automáticamente
      onSelectTab(sourceTabId);
    }
    
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  return (
    <div className="flex items-center justify-between bg-[#121212] p-2 rounded-2xl border border-gray-800 mb-6 flex-shrink-0">
      
      {/* Lista de pestañas desplazable y arrastrable */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar flex-1 pr-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isQuote = tab.type === 'QUOTE';
          const isBeingDragged = tab.id === draggedTabId;
          const isDragOver = tab.id === dragOverTabId && tab.id !== draggedTabId;

          return (
            <div
              key={tab.id}
              draggable={true} // <-- Habilita el arrastre nativo en HTML5
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDragLeave={() => setDragOverTabId(null)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm cursor-grab active:cursor-grabbing transition-all select-none whitespace-nowrap min-w-[140px] max-w-[220px] ${
                // Efecto visual si esta pestaña se está arrastrando en el aire
                isBeingDragged ? 'opacity-30 scale-95 border-2 border-dashed border-gray-500' : ''
              } ${
                // Efecto visual resplandeciente si vas a soltar la pestaña justo aquí
                isDragOver ? 'border-2 border-brand-orange scale-105 shadow-[0_0_15px_rgba(255,90,0,0.5)] bg-gray-800' : ''
              } ${
                // Estilos normales de pestaña Activa / Inactiva
                !isBeingDragged && !isDragOver
                  ? isActive
                    ? isQuote 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                      : 'bg-brand-orange text-black font-extrabold shadow-[0_0_15px_rgba(255,90,0,0.2)]'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                  : ''
              }`}
            >
              <div className="flex items-center truncate mr-2 pointer-events-none">
                <span className="mr-1.5 text-xs">{isQuote ? '📋' : '🛒'}</span>
                <span className="truncate">{tab.title}</span>
                {tab.items.length > 0 && (
                  <span className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive && !isQuote ? 'bg-black/30 text-black font-black' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {tab.items.length}
                  </span>
                )}
              </div>

              {/* Botón de cerrar pestaña (Protegido si isRemovable === false) */}
              {tab.isRemovable !== false && (
                <button
                  type="button"
                  onClick={(e) => onCloseTab(tab.id, e)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ml-2 transition-colors ${
                    isActive && !isQuote 
                      ? 'hover:bg-black/20 text-black/70 hover:text-black' 
                      : 'hover:bg-gray-700 text-gray-500 hover:text-white'
                  }`}
                  title="Cerrar pestaña"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Botones rápidos de nueva venta */}
      <div className="flex items-center space-x-2 pl-2 border-l border-gray-800 flex-shrink-0">
        <button
          type="button"
          onClick={() => onNewTab('SALE')}
          className="px-3 py-2 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-black font-bold text-sm rounded-xl border border-brand-orange/30 transition-all flex items-center"
          title="Nueva Venta Directa"
        >
          <span className="text-lg leading-none mr-1">+</span> Venta
        </button>
        <button
          type="button"
          onClick={() => onNewTab('QUOTE')}
          className="px-3 py-2 bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white font-bold text-sm rounded-xl border border-purple-500/30 transition-all flex items-center"
          title="Nuevo Presupuesto / Cotización"
        >
          <span className="text-lg leading-none mr-1">+</span> Cotizar
        </button>
      </div>
    </div>
  );
};

export default PosTabBar;