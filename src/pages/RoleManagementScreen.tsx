// src/pages/RoleManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roleService } from '../services/roleService';
import { Role } from '../types/role';
import StatusAlert from '../components/StatusAlert';

// Componentes modulares
import RoleListPanel from '../components/roleManagement/RoleListPanel';
import PanelRol from '../components/roleManagement/PanelRol'; // Usamos el nuevo PanelRol
import RoleConfirmModal from '../components/roleManagement/RoleConfirmModal';
import RoleDeleteModal from '../components/roleManagement/RoleDeleteModal';

const RoleManagementScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);

  // Estados Lifted (Elevados) para controlar ambas columnas
  const [activePerms, setActivePerms] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  
  // Estado para colapsar la lista izquierda
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // Modales
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.token) return;
      setIsLoading(true);
      try {
        const [rolesRes, permsRes] = await Promise.all([
          roleService.getRoles(user.token),
          roleService.getPermissions(user.token)
        ]);

        if (permsRes.success) {
          setAllPermissions(permsRes.data);
        }

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          if (rolesRes.data.length > 0) {
            setSelectedRole(rolesRes.data[0]);
            setActivePerms(rolesRes.data[0].permisosIds || []);
          }
        } else {
          setAlert({ success: false, message: rolesRes.message || 'Error al cargar roles' });
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // Manejo de selecciones
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setActivePerms(role.permisosIds || []);
    setIsCreating(false);
  };

  const handleTogglePerm = (permId: number) => {
    setActivePerms(prev => prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]);
  };

  // Creación
  const handleStartCreating = () => {
    setIsCreating(true);
    setNewRoleName('');
    setActivePerms([]);
    setSelectedRole({ id: 0, nombre: 'Nuevo Rol', permisosIds: [], permisosNombres: [] });
    setIsListCollapsed(false); // Forzamos abrir la lista para ver el formulario
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    if (roles.length > 0) {
      setSelectedRole(roles[0]);
      setActivePerms(roles[0].permisosIds || []);
    }
  };

  const handleFinalCreate = async () => {
    if (!user?.token) return;
    setIsConfirmOpen(false);

    try {
      const response = await roleService.createRole(user.token, { 
        nombre: newRoleName, 
        permisosIds: activePerms 
      });
      
      if (response.success) {
        setAlert({ success: true, message: 'Rol creado y permisos asignados exitosamente.' });
        setIsCreating(false);
        
        // Recargar Roles
        const rolesRes = await roleService.getRoles(user.token);
        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          const newlyCreated = rolesRes.data.find((r: Role) => r.nombre === newRoleName);
          if (newlyCreated) handleSelectRole(newlyCreated);
        }
      } else {
        setAlert({ success: false, message: response.message || 'Error al crear el rol.' });
      }
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
    }
  };

  // Edición
  // 1. Nueva Función: Guardar SOLO el nombre
  const handleSaveName = async (roleId: number, newName: string) => {
    if (!user?.token) return;
    try {
      // El cURL decía que solo mandas el nombre para renombrar
      const response = await roleService.updateRole(user.token, roleId, { nombre: newName });
      
      if (response.success) {
        setAlert({ success: true, message: 'Nombre del rol actualizado exitosamente.' });
        const rolesRes = await roleService.getRoles(user.token);
        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          const updated = rolesRes.data.find(r => r.id === roleId);
          if (updated) setSelectedRole(updated);
        }
      } else {
        setAlert({ success: false, message: response.message || 'Error al actualizar.' });
      }
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
    }
  };

 const handleSavePermissions = async (roleId: number, newPermissionIds: number[]) => {
    if (!user?.token || !selectedRole) return;
    
    setIsLoading(true);
    try {
      // 1. Obtenemos los permisos originales del rol
      const originalPerms = selectedRole.permisosIds || [];

      // 2. Comparamos para saber qué se agregó y qué se quitó
      const permsToAdd = newPermissionIds.filter(id => !originalPerms.includes(id));
      const permsToRemove = originalPerms.filter(id => !newPermissionIds.includes(id));

      // 3. Preparamos las peticiones a tus endpoints BULK
      const promises: Promise<any>[] = [];

      if (permsToAdd.length > 0) {
        promises.push(roleService.addRolePermissionsBulk(user.token, roleId, permsToAdd));
      }

      if (permsToRemove.length > 0) {
        promises.push(roleService.removeRolePermissionsBulk(user.token, roleId, permsToRemove));
      }

      // 4. Si hubo cambios, lanzamos las peticiones al mismo tiempo
      if (promises.length > 0) {
        await Promise.all(promises);
        setAlert({ success: true, message: 'Permisos actualizados exitosamente.' });
        
        // Recargamos silenciosamente los roles para mantener la UI sincronizada
        const rolesRes = await roleService.getRoles(user.token);
        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          
          // Actualizamos el selectedRole para que los checkboxes no se reseteen solos
          const updated = rolesRes.data.find(r => r.id === roleId);
          if (updated) setSelectedRole(updated);
        }
      } else {
        setAlert({ success: true, message: 'No se detectaron cambios en los permisos.' });
      }

    } catch (error) {
      console.error("Error al actualizar permisos en bulk:", error);
      setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Eliminación de Rol
  const handleDeleteRole = async () => {
    if (!user?.token || !selectedRole) return;
    setIsDeleteOpen(false);

    try {
      const response = await roleService.deleteRole(user.token, selectedRole.id);
      
      if (response.success) {
        setAlert({ success: true, message: 'Rol eliminado exitosamente.' });
        
        const rolesRes = await roleService.getRoles(user.token);
        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          if (rolesRes.data.length > 0) {
            handleSelectRole(rolesRes.data[0]);
          }
        }
      } else {
        setAlert({ success: false, message: response.message });
      }
      setTimeout(() => setAlert(null), 6000); 
    } catch (error: any) {
      // CAMBIO AQUÍ: Usamos error.message para mostrar la razón exacta del rechazo
      setAlert({ 
        success: false, 
        message: error.message || 'Fallo la conexión con el servidor.' 
      });
      setTimeout(() => setAlert(null), 6000); 
    }
  };

  

  
return (
    <>
      <div className="flex flex-col h-full bg-[#0a0a0a] p-6 text-white overflow-hidden relative">
        <div className="mb-4 z-10 shrink-0">
          <h1 className="text-3xl font-bold text-white mb-2">Roles y Permisos</h1>
          <p className="text-gray-400">Configura los niveles de acceso y los módulos disponibles para cada rol.</p>
        </div>

        {/* ALERTA FLOTANTE (TOAST) */}
        {alert && (
          <div className="absolute top-6 right-6 z-[100] animate-fade-in shadow-2xl min-w-[320px] max-w-md">
            <StatusAlert success={alert.success} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* AGREGAMOS min-h-0 AL CONTENEDOR PRINCIPAL */}
        <div className="flex-1 flex gap-6 overflow-hidden mt-2 min-h-0">
          
          {/* ==========================================
              COLUMNA IZQUIERDA ANIMADA Y COLAPSABLE
          ========================================== */}
          {/* Usamos transition-[width] en lugar de transition-all para que no pelee con el flexbox */}
          <div className={`relative shrink-0 h-full overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.3,1,0.8,1)]
            ${isListCollapsed ? 'w-24' : 'w-1/3'}`}
          >
            
            {/* VISTA 1: Lista de Roles (absolute inset-0 lo ancla a las 4 esquinas exactas) */}
            <div className={`absolute inset-0 transition-transform duration-700 
              ${isCreating ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
            >
              <RoleListPanel 
                roles={roles} 
                selectedRole={selectedRole} 
                isLoading={isLoading} 
                isCollapsed={isListCollapsed}
                onToggleCollapse={() => setIsListCollapsed(!isListCollapsed)}
                onSelectRole={handleSelectRole} 
                onCreateClick={handleStartCreating} 
              />
            </div>

            {/* VISTA 2: Formulario de Creación */}
            <div className={`absolute inset-0 bg-[#121212] border border-gray-800 rounded-3xl p-6 flex flex-col transition-transform duration-700 
              ${isCreating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
            >
              <h2 className="text-xl font-bold text-brand-orange mb-6 border-b border-gray-800 pb-3">Diseñar Nuevo Rol</h2>
              
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-semibold text-gray-300">Nombre del Rol</label>
                <input 
                  type="text" 
                  value={newRoleName} 
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ej. Cajero Nocturno"
                  className="bg-[#0a0a0a] border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition-all placeholder-gray-600"
                />
              </div>

              <div className="bg-gray-900/50 border border-brand-orange/20 rounded-2xl p-5 mb-auto flex-1 overflow-y-auto">
                <h3 className="text-brand-orange font-bold text-sm mb-4">Recomendaciones:</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <span><strong className="text-gray-200">Sé específico:</strong> Evita nombres genéricos como "Usuario1".</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">🛡️</span>
                    <span><strong className="text-gray-200">Mínimo Privilegio:</strong> Asigna en el panel derecho SOLO los permisos necesarios para trabajar.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">🔄</span>
                    <span><strong className="text-gray-200">Evita duplicados:</strong> Revisa si el rol ya existe antes de crearlo.</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-6 mt-4 border-t border-gray-800">
                <button onClick={handleCancelCreating} className="flex-1 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium">
                  Cancelar
                </button>
                <button 
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={!newRoleName.trim()}
                  className="flex-1 py-3 bg-brand-orange hover:bg-orange-600 text-black font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear y Guardar
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <PanelRol 
            selectedRole={selectedRole} 
            allPermissions={allPermissions} 
            activePerms={activePerms}
            onTogglePerm={handleTogglePerm}
            onSaveName={handleSaveName}
            onSavePermissions={handleSavePermissions}
            onDeleteRequest={() => setIsDeleteOpen(true)}
            isCreating={isCreating}
          />
          
        </div>
      </div>

      <RoleConfirmModal 
        isOpen={isConfirmOpen} roleName={newRoleName} permsCount={activePerms.length} 
        onClose={() => setIsConfirmOpen(false)} onConfirm={handleFinalCreate} 
      />

      <RoleDeleteModal
        isOpen={isDeleteOpen} roleName={selectedRole?.nombre || ''}
        onClose={() => setIsDeleteOpen(false)} onConfirm={handleDeleteRole}
      />
    </>
  );
};

export default RoleManagementScreen;