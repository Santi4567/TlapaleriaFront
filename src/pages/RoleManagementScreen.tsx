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

  // 2. Nueva Función: Guardar SOLO los permisos
  const handleSavePermissions = async (roleId: number, newPermissionIds: number[]) => {
    if (!user?.token || !selectedRole) return;
    try {
      // Mandamos el nombre actual y los nuevos permisos
      const payload = {
        nombre: selectedRole.nombre,
        permisosIds: newPermissionIds
      };
      
      const response = await roleService.updateRole(user.token, roleId, payload);
      
      if (response.success) {
        setAlert({ success: true, message: 'Permisos actualizados exitosamente.' });
        const rolesRes = await roleService.getRoles(user.token);
        if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      } else {
        setAlert({ success: false, message: response.message || 'Error al actualizar permisos.' });
      }
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
    }
  };

  // Eliminación
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
    } catch (error) {
      setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#0a0a0a] p-6 text-white overflow-hidden relative">
        <div className="mb-4 z-10 shrink-0">
          <h1 className="text-3xl font-bold text-white mb-2">Roles y Permisos</h1>
          <p className="text-gray-400">Configura los niveles de acceso y los módulos disponibles para cada rol.</p>
        </div>

        {alert && (
          <div className="z-10 mb-4 animate-fade-in shrink-0">
            <StatusAlert success={alert.success} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <div className="flex-1 flex gap-6 overflow-hidden mt-2">
          
          {/* COLUMNA IZQUIERDA ANIMADA Y COLAPSABLE */}
          <div className={`relative flex flex-col shrink-0 h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.3,1,0.8,1)]
            ${isListCollapsed ? 'w-24' : 'w-1/3'}`}
          >
            {/* VISTA 1: Lista de Roles */}
            <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-700 
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
            <div className={`absolute top-0 left-0 w-full h-full bg-[#121212] border border-gray-800 rounded-3xl p-6 flex flex-col transition-transform duration-700 
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

              {/* Caja de Recomendaciones */}
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

          {/* COLUMNA DERECHA: AHORA USAMOS PANEL ROL */}
          <PanelRol 
            selectedRole={selectedRole} 
            allPermissions={allPermissions} 
            activePerms={activePerms}
            onTogglePerm={handleTogglePerm}
            onSaveName={handleSaveName} // <--- Pasamos función de nombre
            onSavePermissions={handleSavePermissions} // <--- Pasamos función de permisos
            onDeleteRequest={() => setIsDeleteOpen(true)}
            isCreating={isCreating}
          />
          
        </div>
      </div>

      {/* MODAL DE CREACIÓN */}
      <RoleConfirmModal 
        isOpen={isConfirmOpen} 
        roleName={newRoleName} 
        permsCount={activePerms.length} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleFinalCreate} 
      />

      {/* MODAL DE ELIMINACIÓN */}
      <RoleDeleteModal
        isOpen={isDeleteOpen} 
        roleName={selectedRole?.nombre || ''}
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={handleDeleteRole}
      />
    </>
  );
};

export default RoleManagementScreen;