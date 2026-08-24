// src/components/roleManagement/RolePermissionsPanel.tsx
import React, { useState, useEffect } from 'react';
import { Role } from '../../types/role';

interface Permission {
  id: number;
  nombreSistema: string;
  descripcion: string;
}

interface RolePermissionsPanelProps {
  selectedRole: Role | null;
  allPermissions: Permission[];
  onSave: (roleId: number, newPermissionIds: number[]) => void;
}

const RolePermissionsPanel: React.FC<RolePermissionsPanelProps> = ({ selectedRole, allPermissions, onSave }) => {
  const [activePerms, setActivePerms] = useState<number[]>([]);

  useEffect(() => {
    if (selectedRole) {
      setActivePerms(selectedRole.permisosIds || []);
    }
  }, [selectedRole]);

  if (!selectedRole) {
    return (
      <div className="flex-1 bg-[#121212] border border-gray-800 rounded-3xl p-6 flex flex-col shadow-xl items-center justify-center text-gray-600">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
        <p>Selecciona un rol de la lista para ver sus permisos</p>
      </div>
    );
  }

  // ==========================================
  // REGLA DE SEGURIDAD: ADMIN ES INMUTABLE
  // ==========================================
  const isAdmin = selectedRole.id === 1;

  const handleToggle = (permId: number) => {
    // Si es admin, ignoramos los clics
    if (isAdmin) return;
    
    setActivePerms(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const groupedPermissions: Record<string, Permission[]> = {};
  
  allPermissions.forEach(p => {
    let moduleName = "Otros";
    if (p.nombreSistema.includes('users')) moduleName = '👥 Usuarios';
    else if (p.nombreSistema.includes('products')) moduleName = '📦 Productos';
    else if (p.nombreSistema.includes('suppliers')) moduleName = '🤝 Proveedores';
    else if (p.nombreSistema.includes('pendingorders')) moduleName = '⏳ Pedidos Pendientes';
    else if (p.nombreSistema.includes('inventorymovements')) moduleName = '📋 Inventario';
    else if (p.nombreSistema.includes('returns')) moduleName = '🔄 Devoluciones';
    else if (p.nombreSistema.includes('sales')) moduleName = '💰 Ventas';

    if (!groupedPermissions[moduleName]) groupedPermissions[moduleName] = [];
    groupedPermissions[moduleName].push(p);
  });

  return (
    <div className="flex-1 bg-[#121212] border border-gray-800 rounded-3xl p-6 flex flex-col shadow-xl relative overflow-hidden">
      
      {/* Header de Permisos */}
      <div className="border-b border-gray-800 pb-4 mb-4 flex justify-between items-center z-10 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Configuración: <span className="text-brand-orange">{selectedRole.nombre}</span></h2>
          <p className="text-sm text-gray-500 mt-1">Activa o desactiva los módulos a los que este rol tiene acceso.</p>
        </div>
        
        {/* El botón se bloquea si es el Admin */}
        <button 
          onClick={() => !isAdmin && onSave(selectedRole.id, activePerms)}
          disabled={isAdmin}
          className={`font-bold py-2 px-6 rounded-xl transition-all shadow-lg
            ${isAdmin 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-brand-orange hover:bg-orange-600 text-black'
            }`}
        >
          Guardar Cambios
        </button>
      </div>

      {/* AVISO VISUAL SI ES ADMIN */}
      {isAdmin && (
        <div className="mb-6 bg-brand-orange/10 border border-brand-orange/30 rounded-xl p-4 flex items-start gap-3 shrink-0">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-brand-orange shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <div>
            <h4 className="text-brand-orange font-bold text-sm">Rol Inmutable</h4>
            <p className="text-gray-400 text-xs mt-1">El rol de Administrador tiene acceso total por defecto y sus permisos no pueden ser modificados por seguridad.</p>
          </div>
        </div>
      )}

      {/* Grid de Módulos (Tarjetas) */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
            
            <div key={moduleName} className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 shadow-inner flex flex-col">
              <h3 className="text-brand-orange font-bold text-lg mb-4 pb-2 border-b border-gray-800">{moduleName}</h3>
              
              <div className="flex flex-col gap-3">
                {perms.map(p => {
                  const isToggled = activePerms.includes(p.id);
                  const desc = p.descripcion.replace('contrase├▒a', 'contraseña').replace('informaci├│n', 'información');

                  return (
                    <div key={p.id} className="flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium transition-colors 
                          ${isAdmin ? 'text-gray-500' : (isToggled ? 'text-white' : 'text-gray-400')}
                        `}>
                          {desc}
                        </span>
                        <span className={`text-xs font-mono mt-0.5 ${isAdmin ? 'text-gray-600' : 'text-gray-600'}`}>
                          {p.nombreSistema}
                        </span>
                      </div>
                      
                      {/* Switch Animado - Bloqueado si es Admin */}
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id)}
                        disabled={isAdmin}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0
                          ${isAdmin 
                              ? (isToggled ? 'bg-brand-orange/40 cursor-not-allowed' : 'bg-gray-800 cursor-not-allowed') 
                              : (isToggled ? 'bg-brand-orange shadow-[0_0_10px_rgba(255,90,0,0.3)]' : 'bg-gray-700')
                          }
                        `}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ease-in-out duration-200
                            ${isToggled ? 'translate-x-6' : 'translate-x-1'}
                            ${isAdmin ? 'opacity-70' : 'opacity-100'}
                          `}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsPanel;