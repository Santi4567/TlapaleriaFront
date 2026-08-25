// src/components/roleManagement/PanelRol.tsx
import React, { useState, useEffect } from 'react';
import { Role } from '../../types/role';
import RolePermissionsPanel from './RolePermissionsPanel';
import RolListUser from './RolListUser';

interface PanelRolProps {
  selectedRole: Role | null;
  allPermissions: any[];
  activePerms: number[];
  onTogglePerm: (permId: number) => void;
  onSaveName: (roleId: number, newName: string) => void;
  onSavePermissions: (roleId: number, perms: number[]) => void;
  onDeleteRequest: (roleId: number) => void;
  isCreating: boolean;
}

const PanelRol: React.FC<PanelRolProps> = (props) => {
  const { selectedRole, isCreating, onSaveName, onDeleteRequest } = props;
  
  const [activeTab, setActiveTab] = useState<'PERMISOS' | 'USUARIOS'>('PERMISOS');
  
  // Estados para la edición en línea del nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const isAdmin = !isCreating && selectedRole?.id === 1;

  useEffect(() => {
    if (selectedRole) {
      setEditNameValue(selectedRole.nombre);
      setIsEditingName(false);
    }
  }, [selectedRole]);

  if (!selectedRole && !isCreating) {
    return (
      <div className="flex-1 bg-[#121212] rounded-3xl flex items-center justify-center text-gray-600 border border-gray-800">
        <p>Selecciona un rol de la lista para gestionar su configuración.</p>
      </div>
    );
  }

  const handleSaveNameClick = () => {
    if (editNameValue.trim() !== '' && editNameValue !== selectedRole?.nombre) {
      onSaveName(selectedRole!.id, editNameValue);
    }
    setIsEditingName(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121212] rounded-3xl overflow-hidden border border-gray-800 shadow-xl p-6">
      
      {/* 1. CABECERA PRINCIPAL (Nombre y Acciones) */}
      <div className="flex justify-between items-start mb-6 border-b border-gray-800 pb-6">
        <div className="flex-1">
          {isEditingName && !isAdmin ? (
            <div className="flex items-center gap-3">
              <input 
                autoFocus
                type="text" 
                value={editNameValue} 
                onChange={(e) => setEditNameValue(e.target.value)} 
                className="bg-gray-900 border border-brand-orange text-white rounded-lg px-3 py-1.5 focus:outline-none text-2xl font-bold w-72"
              />
              <button onClick={handleSaveNameClick} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors" title="Guardar Nombre">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </button>
              <button onClick={() => { setIsEditingName(false); setEditNameValue(selectedRole!.nombre); }} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors" title="Cancelar">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">{selectedRole?.nombre}</h2>
              {!isAdmin && !isCreating && (
                <button onClick={() => setIsEditingName(true)} className="p-1.5 text-gray-500 hover:text-brand-orange transition-colors" title="Renombrar Rol">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                </button>
              )}
            </div>
          )}
          
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              ID: {selectedRole?.id}
            </span>
            {isAdmin && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-orange/20 text-brand-orange border border-brand-orange/30">Rol Inmutable (Sistema)</span>}
          </div>
        </div>

        {/* Botón de Eliminar */}
        {!isAdmin && !isCreating && selectedRole && (
          <button 
            onClick={() => onDeleteRequest(selectedRole.id)}
            className="flex items-center gap-2 px-4 py-2 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-colors font-medium border border-red-500/20"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            Eliminar Rol
          </button>
        )}
      </div>

      {/* 2. NAVEGACIÓN (TABS) */}
      {!isCreating && (
        <div className="flex gap-4 mb-2">
          <button
            onClick={() => setActiveTab('PERMISOS')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center gap-2
              ${activeTab === 'PERMISOS' ? 'bg-brand-orange text-black shadow-[0_0_15px_rgba(255,90,0,0.3)]' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
            Administrar Permisos
          </button>
          
          <button
            onClick={() => setActiveTab('USUARIOS')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center gap-2
              ${activeTab === 'USUARIOS' ? 'bg-brand-orange text-black shadow-[0_0_15px_rgba(255,90,0,0.3)]' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            Usuarios en este Rol
          </button>
        </div>
      )}

      {/* 3. CONTENIDO DINÁMICO */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'PERMISOS' || isCreating ? (
           <RolePermissionsPanel 
              selectedRole={selectedRole!} 
              allPermissions={props.allPermissions} 
              activePerms={props.activePerms} 
              onTogglePerm={props.onTogglePerm} 
              onSavePermissions={props.onSavePermissions} 
              isAdmin={isAdmin}
           />
        ) : (
           <RolListUser roleId={selectedRole!.id} />
        )}
      </div>

    </div>
  );
};

export default PanelRol;