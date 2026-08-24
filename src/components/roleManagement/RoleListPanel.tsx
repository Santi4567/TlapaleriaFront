// src/components/roleManagement/RoleListPanel.tsx
import React from 'react';
import { Role } from '../../types/role';

interface RoleListPanelProps {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  onSelectRole: (role: Role) => void;
  onCreateClick: () => void;
}

const RoleListPanel: React.FC<RoleListPanelProps> = ({ roles, selectedRole, isLoading, onSelectRole, onCreateClick }) => {
  return (
    <div className="w-1/3 bg-[#121212] border border-gray-800 rounded-3xl p-5 flex flex-col shadow-xl shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-brand-orange">Roles Registrados</h2>
        <button 
          onClick={onCreateClick}
          className="bg-gray-800 hover:bg-brand-orange hover:text-black text-white p-2 rounded-xl transition-colors" 
          title="Crear nuevo rol"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
        {isLoading ? (
          // Esqueleto de carga
          [1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 animate-pulse h-20"></div>
          ))
        ) : roles.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No hay roles registrados.</p>
        ) : (
          roles.map(rol => (
            <div 
              key={rol.id}
              onClick={() => onSelectRole(rol)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border
                ${selectedRole?.id === rol.id 
                  ? 'bg-brand-orange/10 border-brand-orange text-white shadow-[0_0_15px_rgba(255,90,0,0.1)]' 
                  : 'bg-black/40 border-gray-800 hover:border-gray-600 text-gray-400'}`}
            >
              <h3 className={`font-bold text-lg ${selectedRole?.id === rol.id ? 'text-brand-orange' : 'text-gray-300'}`}>
                {rol.nombre}
              </h3>
              <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {rol.permisosIds?.length || 0} permisos asignados
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoleListPanel;