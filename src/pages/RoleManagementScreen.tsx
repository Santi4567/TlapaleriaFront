// src/pages/RoleManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roleService } from '../services/roleService';
import { Role } from '../types/role';
import StatusAlert from '../components/StatusAlert';
import RoleListPanel from '../components/roleManagement/RoleListPanel';
import RolePermissionsPanel from '../components/roleManagement/RolePermissionsPanel';

const RoleManagementScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // NUEVO ESTADO: Todos los permisos disponibles
  const [allPermissions, setAllPermissions] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.token) return;
      
      setIsLoading(true);
      try {
        // Ejecutamos ambas peticiones en paralelo para que sea súper rápido
        const [rolesRes, permsRes] = await Promise.all([
          roleService.getRoles(user.token),
          roleService.getPermissions(user.token)
        ]);

        if (permsRes.success) {
          setAllPermissions(permsRes.data);
        }

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
          if (rolesRes.data.length > 0) setSelectedRole(rolesRes.data[0]);
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

  const handleCreateNewRole = () => {
    console.log("Abrir modal o panel para crear nuevo rol");
  };

  const handleSavePermissions = (roleId: number, newPermissionIds: number[]) => {
    console.log(`Guardar para el rol ID ${roleId}, permisos:`, newPermissionIds);
    // Aquí pondremos el PUT a la API cuando me pases el cURL
  };

  return (
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

      {/* CONTENEDOR MAESTRO - DETALLE */}
      <div className="flex-1 flex gap-6 overflow-hidden mt-2">
        <RoleListPanel 
          roles={roles} 
          selectedRole={selectedRole} 
          isLoading={isLoading} 
          onSelectRole={setSelectedRole} 
          onCreateClick={handleCreateNewRole}
        />
        <RolePermissionsPanel 
          selectedRole={selectedRole}
          allPermissions={allPermissions} // <--- Pasamos el catálogo
          onSave={handleSavePermissions}
        />
      </div>
    </div>
  );
};

export default RoleManagementScreen;