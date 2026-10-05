import React, { useRef, useEffect } from 'react';
import { Role } from '../../types/rol';

interface RoleListPanelProps {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectRole: (role: Role) => void;
  onCreateClick: () => void;
}

const RoleListPanel: React.FC<RoleListPanelProps> = ({ roles, selectedRole, isLoading, isCollapsed, onToggleCollapse, onSelectRole, onCreateClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // FIX: mismo bug del sidebar. Si la lista queda scrolleada hasta abajo y
  // luego se maximiza/restaura la ventana, el webview no reajusta el
  // scrollTop solo. El ResizeObserver lo corrige apenas el contenedor
  // cambia de tamaño.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const fixStuckScroll = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollTop > maxScroll) {
        el.scrollTop = Math.max(0, maxScroll);
      }
    };

    const ro = new ResizeObserver(fixStuckScroll);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    // Quitamos transition-all de aquí
    <div className="w-full h-full bg-[#121212] border border-gray-800 rounded-3xl p-4 flex flex-col shadow-xl min-h-0">
      
      {/* Header con botón de colapsar */}
      <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
        {!isCollapsed && <h2 className="text-lg font-bold text-brand-orange truncate pr-2">Roles</h2>}
        
        <div className={`flex gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          <button 
            onClick={onCreateClick}
            className="bg-gray-800 hover:bg-brand-orange hover:text-black text-white p-2 rounded-xl transition-colors shrink-0" 
            title="Crear nuevo rol"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </button>
          
          <button 
            onClick={onToggleCollapse}
            className="bg-gray-800 hover:text-brand-orange text-gray-400 p-2 rounded-xl transition-colors shrink-0" 
            title={isCollapsed ? "Expandir" : "Minimizar"}
          >
            {isCollapsed ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Lista de Roles */}
      {/* Agregamos overflow-x-hidden para evitar scroll lateral al animar */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className={`rounded-2xl bg-gray-900/50 border border-gray-800 animate-pulse ${isCollapsed ? 'h-14 w-14 mx-auto' : 'h-20 p-4'}`}></div>)
        ) : roles.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 text-sm">Sin roles</p>
        ) : (
          roles.map(rol => (
            <div 
              key={rol.id} onClick={() => onSelectRole(rol)}
              title={rol.nombre}
              // REGLA DE ORO AQUÍ: shrink-0 y transition-colors (no transition-all)
              className={`rounded-2xl cursor-pointer border flex shrink-0 transition-colors duration-200
                ${selectedRole?.id === rol.id ? 'bg-brand-orange/10 border-brand-orange text-white' : 'bg-black/40 border-gray-800 hover:border-gray-600 text-gray-400'}
                ${isCollapsed ? 'h-14 w-14 mx-auto items-center justify-center p-0' : 'p-4 flex-col items-start justify-start w-full'}
              `}
            >
              {isCollapsed ? (
                <span className={`font-bold text-xl ${selectedRole?.id === rol.id ? 'text-brand-orange' : 'text-gray-400'}`}>
                  {rol.nombre.charAt(0).toUpperCase()}
                </span>
              ) : (
                // Envolvemos el texto en un div full para forzar el truncate y que NUNCA haga dos líneas
                <div className="w-full overflow-hidden">
                  <h3 className={`font-bold text-lg truncate w-full ${selectedRole?.id === rol.id ? 'text-brand-orange' : 'text-gray-300'}`}>
                    {rol.nombre}
                  </h3>
                  <p className="text-xs mt-1 opacity-80 flex items-center gap-1 truncate w-full">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {rol.permisosIds?.length || 0} permisos
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoleListPanel;