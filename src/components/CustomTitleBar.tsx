// src/components/CustomTitleBar.tsx
import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const CustomTitleBar: React.FC = () => {
  const appWindow = getCurrentWindow();

  return (
    <div 
      // Mantenemos el atributo por compatibilidad con Windows
      data-tauri-drag-region 
      // LA MAGIA PARA LINUX/WAYLAND: Forzamos el arrastre por código
      onMouseDown={(e) => {
        // e.button === 0 significa que fue un clic con el botón izquierdo
        // Evitamos que intente arrastrar si hacen clic derecho
        if (e.button === 0) {
          appWindow.startDragging();
        }
      }}
      className="h-10 w-full bg-brand-deep-dark flex justify-between items-center select-none border-b border-gray-800 relative flex-shrink-0 cursor-move"
    >
      {/* TÍTULO CENTRADO */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center">
        <span className="text-brand-orange font-bold text-sm tracking-widest">
          TLAPALERIA LEO
        </span>
      </div>

      <div className="flex-1 pointer-events-none h-full"></div>

      {/* SECCIÓN DERECHA: Controles de Ventana */}
      {/* Detenemos la propagación del clic aquí para que al presionar los botones no se intente arrastrar la ventana */}
      <div 
        className="flex h-full z-10 cursor-default" 
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          className="inline-flex justify-center items-center w-12 h-full hover:bg-gray-800 text-brand-text-muted hover:text-white transition-colors"
          onClick={() => appWindow.minimize()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 7h12v2H2z" />
          </svg>
        </div>
        
        <div 
          className="inline-flex justify-center items-center w-12 h-full hover:bg-gray-800 text-brand-text-muted hover:text-white transition-colors"
          onClick={() => appWindow.toggleMaximize()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="1" />
          </svg>
        </div>
        
        <div 
          className="inline-flex justify-center items-center w-12 h-full hover:bg-red-600 hover:text-white text-brand-text-muted transition-colors"
          onClick={() => appWindow.close()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CustomTitleBar;