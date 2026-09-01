// src/components/roleManagement/RolePermissionsPanel.tsx
import React from 'react';
import { Role } from '../../types/rol';

interface Permission { id: number; nombreSistema: string; descripcion: string; }

interface RolePermissionsPanelProps {
  selectedRole: Role;
  allPermissions: Permission[];
  activePerms: number[];
  onTogglePerm: (permId: number) => void;
  onSavePermissions: (roleId: number, perms: number[]) => void;
  isAdmin: boolean;
}

const RolePermissionsPanel: React.FC<RolePermissionsPanelProps> = ({ 
  selectedRole, allPermissions, activePerms, onTogglePerm, onSavePermissions, isAdmin 
}) => {
  
  // VERIFICACIÓN: Sabemos que si el ID es 0, estamos en modo "Nuevo Rol"
  const isCreating = selectedRole.id === 0;

  // Agrupar permisos por módulo
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
    else if (p.nombreSistema.includes('rol')) moduleName = '⚙️ Roles';

    if (!groupedPermissions[moduleName]) groupedPermissions[moduleName] = [];
    groupedPermissions[moduleName].push(p);
  });

  return (
    <div className="flex flex-col h-full mt-4">
      
      {/* SE OCULTA TODA LA CABECERA SI ESTAMOS CREANDO UN ROL NUEVO */}
      {!isCreating && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">Activa o desactiva los módulos permitidos para este rol.</p>
          <button 
            onClick={() => onSavePermissions(selectedRole.id, activePerms)} 
            disabled={isAdmin}
            className={`font-bold py-2 px-6 rounded-xl transition-all shadow-lg 
              ${isAdmin ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-brand-orange hover:bg-orange-600 text-black'}`
            }
          >
            Guardar Permisos
          </button>
        </div>
      )}

      {/* Grid de Módulos (Tarjetas) */}
      <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                      <div className="flex flex-col pr-4">
                        <span className={`text-sm font-medium transition-colors ${isAdmin ? 'text-gray-500' : (isToggled ? 'text-white' : 'text-gray-400')}`}>{desc}</span>
                        <span className={`text-xs font-mono mt-0.5 ${isAdmin ? 'text-gray-600' : 'text-gray-600'}`}>{p.nombreSistema}</span>
                      </div>
                      <button
                        type="button" onClick={() => onTogglePerm(p.id)} disabled={isAdmin}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0
                          ${isAdmin ? (isToggled ? 'bg-brand-orange/40 cursor-not-allowed' : 'bg-gray-800 cursor-not-allowed') : (isToggled ? 'bg-brand-orange shadow-[0_0_10px_rgba(255,90,0,0.3)]' : 'bg-gray-700')}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ease-in-out duration-200 ${isToggled ? 'translate-x-6' : 'translate-x-1'} ${isAdmin ? 'opacity-70' : 'opacity-100'}`} />
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