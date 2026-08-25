// src/components/roleManagement/RoleListPanel.tsx
import React from 'react';
import { Role } from '../../types/role';

interface RoleListPanelProps {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  isCollapsed: boolean; // NUEVO
  onToggleCollapse: () => void; // NUEVO
  onSelectRole: (role: Role) => void;
  onCreateClick: () => void;
}

const RoleListPanel: React.FC<RoleListPanelProps> = ({ roles, selectedRole, isLoading, isCollapsed, onToggleCollapse, onSelectRole, onCreateClick }) => {
  return (
    <div className="w-full h-full bg-[#121212] border border-gray-800 rounded-3xl p-4 flex flex-col shadow-xl transition-all">
      
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
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className={`rounded-2xl bg-gray-900/50 border border-gray-800 animate-pulse ${isCollapsed ? 'h-14 w-14 mx-auto' : 'h-20 p-4'}`}></div>)
        ) : roles.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 text-sm">Sin roles</p>
        ) : (
          roles.map(rol => (
            <div 
              key={rol.id} onClick={() => onSelectRole(rol)}
              title={rol.nombre}
              className={`rounded-2xl cursor-pointer transition-all border flex items-center justify-center 
                ${selectedRole?.id === rol.id ? 'bg-brand-orange/10 border-brand-orange text-white' : 'bg-black/40 border-gray-800 hover:border-gray-600 text-gray-400'}
                ${isCollapsed ? 'h-14 w-14 mx-auto p-0' : 'p-4 flex-col items-start justify-start'}
              `}
            >
              {isCollapsed ? (
                <span className={`font-bold text-xl ${selectedRole?.id === rol.id ? 'text-brand-orange' : 'text-gray-400'}`}>
                  {rol.nombre.charAt(0).toUpperCase()}
                </span>
              ) : (
                <>
                  <h3 className={`font-bold text-lg ${selectedRole?.id === rol.id ? 'text-brand-orange' : 'text-gray-300'}`}>{rol.nombre}</h3>
                  <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {rol.permisosIds?.length || 0} permisos
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoleListPanel;