// src/components/CustomTitleBar.tsx
import React, { useEffect, useState } from 'react'

const CustomTitleBar: React.FC = () => {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.windowControls.isMaximized().then(setMaximized)
    // onMaximizeChange devuelve la función para desuscribirse
    return window.windowControls.onMaximizeChange(setMaximized)
  }, [])

  return (
    <div className="h-10 w-full bg-brand-deep-dark flex justify-between items-center select-none border-b border-gray-800 relative flex-shrink-0 [-webkit-app-region:drag]">
      {/* TÍTULO CENTRADO */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center">
        <span className="text-brand-orange font-bold text-sm tracking-widest">
          TLAPALERIA LEO
        </span>
      </div>

      <div className="flex-1 pointer-events-none h-full"></div>

      {/* CONTROLES: deben ser no-drag o no reciben clics */}
      <div className="flex h-full z-10 [-webkit-app-region:no-drag]">
        <button
          type="button"
          className="inline-flex justify-center items-center w-12 h-full hover:bg-gray-800 text-brand-text-muted hover:text-white transition-colors"
          onClick={() => window.windowControls.minimize()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 7h12v2H2z" />
          </svg>
        </button>

        <button
          type="button"
          className="inline-flex justify-center items-center w-12 h-full hover:bg-gray-800 text-brand-text-muted hover:text-white transition-colors"
          onClick={() => window.windowControls.toggleMaximize()}
        >
          {maximized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="5" width="9" height="9" rx="1" />
              <path d="M5 5V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="12" height="12" rx="1" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="inline-flex justify-center items-center w-12 h-full hover:bg-red-600 hover:text-white text-brand-text-muted transition-colors"
          onClick={() => window.windowControls.close()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default CustomTitleBar