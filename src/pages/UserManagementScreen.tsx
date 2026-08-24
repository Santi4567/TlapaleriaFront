import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, updateUser, resetUserPassword } from '../services/userService';
import { roleService } from '../services/roleService';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { Role } from '../types/role';
import UserTable from '../components/userManagement/UserTable';
import StatusAlert from '../components/StatusAlert'; 
//Componetes/pantallas 
import UserFormPanel from '../components/userManagement/UserFormPanel';

const UserManagementScreen: React.FC = () => {
  const { user } = useAuth(); 
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ success: boolean; message: string } | null>(null);

  const [showActive, setShowActive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  //UserModal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  //Crear un nuevo usario 
  const handleSaveUser = async (userData: any): Promise<void> => {
    if (!user?.token) return;

    try {
      // 1. Buscamos el nombre del rol (Lo necesitamos para ambos casos)
      const roleObj = roles.find(r => r.id === Number(userData.rolId));
      if (!roleObj) {
        setAlert({ success: false, message: 'Rol inválido seleccionado.' });
        return;
      }

      // ==========================================
      // MODO EDICIÓN (UPDATE)
      // ==========================================
      if (userData.id) {
        
        // Armamos el payload estricto para el PUT
        const updatePayload = {
          name: userData.name,
          username: userData.username,
          rolNombre: roleObj.nombre,
          // AHORA usamos el estado que viene del formulario, ya no usamos "userToEdit?.isActive"
          isActive: userData.isActive 
        };

        // 1ra Petición: Actualizar datos
        const response = await updateUser(user.token, userData.id, updatePayload);
        
        if (response.success) {
          let alertMessage = 'Usuario actualizado correctamente.';

          // 2da Petición (Condicional): Si el admin escribió una nueva contraseña, hacemos el reset
          if (userData.password && userData.password.trim() !== '') {
            try {
              await resetUserPassword(user.token, userData.id, userData.password);
              alertMessage = 'Datos y contraseña actualizados correctamente.';
            } catch (error) {
              console.error("Error al cambiar contraseña:", error);
              alertMessage = 'Datos actualizados, pero hubo un error al cambiar la contraseña.';
            }
          }

          setAlert({ success: true, message: alertMessage });
          setIsFormOpen(false); // Cerramos el panel
          
          setTimeout(() => setAlert(null), 4000);
          loadUsers(); // Recargamos la tabla
        } else {
          setAlert({ success: false, message: response.message || 'Error al actualizar usuario' });
        }
      } 
      // ==========================================
      // MODO CREACIÓN (POST)
      // ==========================================
      else {
        // En creación solo mandamos lo que el endpoint /create necesita
        const createPayload = {
          username: userData.username,
          password: userData.password,
          name: userData.name,
          rolNombre: roleObj.nombre 
        };

        const response = await createUser(user.token, createPayload);

        if (response.success) {
          setAlert({ success: true, message: `${response.message}. El usuario está inactivo por defecto.` });
          setIsFormOpen(false); 
          
          setTimeout(() => setAlert(null), 4000);

          if (showActive) {
            setShowActive(false);
            setCurrentPage(1);
          } else {
            loadUsers();
          }
        } else {
          setAlert({ success: false, message: response.message || 'Error al crear usuario' });
        }
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      setAlert({ success: false, message: 'Fallo la conexión con el servidor.' });
    }
  };

// Cargar Roles solo una vez al montar la pantalla
  useEffect(() => {
    const loadRoles = async () => {
      if (!user?.token) return;
      try {
        // CORRECCIÓN: Es .getRoles en lugar de .roleService
        const res = await roleService.getRoles(user.token);
        
        if (res.success) {
          setRoles(res.data);
        }
      } catch (error) {
        console.error("Error cargando roles:", error);
      }
    };
    loadRoles();
  }, [user?.token]);

  // Cargar Usuarios (con o sin búsqueda)
 const loadUsers = async () => {
    if (!user?.token) return;
    
    setIsLoading(true);
    //setAlert(null); 
    
    try {
      // Un solo llamado poderoso que hace paginación, filtro y búsqueda
      const response = await fetchUsers(
        user.token, 
        showActive, 
        currentPage, 
        10, 
        roleFilter, 
        searchTerm 
      );

      if (response.success) {
        // Mapeo seguro de la data
        const data = response.data.data ? response.data.data : (response.data as any);
        setUsers(data || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
      } else {
        setAlert({ success: false, message: response.message || 'Error al cargar usuarios' });
        setUsers([]); // Limpiamos la tabla si hay error
      }
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      setAlert({ success: false, message: 'Fallo la conexión con el servidor' });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto con "Debounce" para que espere 500ms después de que dejas de escribir para buscar
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter, showActive, currentPage, user?.token]);

  const handleToggleTab = (isActiveTab: boolean) => {
    if (showActive !== isActiveTab) {
      setShowActive(isActiveTab);
      setCurrentPage(1);
    }
  };

  // 3. FUNCIONES PARA MANEJAR EL MODAL UserModal
  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    const userRow = users.find(u => u.id === id);
    if (userRow) {
      setUserToEdit(userRow);
      setIsFormOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-6 text-white overflow-hidden relative">
      
      {/* Título Principal (Siempre visible) */}
      <div className="mb-6 z-10">
        <h1 className="text-3xl font-bold text-white mb-2">Control de Usuarios</h1>
        <p className="text-gray-400">Gestiona los accesos, roles y estado del personal en el sistema.</p>
      </div>

      {alert && (
        <div className="z-10"><StatusAlert success={alert.success} message={alert.message} onClose={() => setAlert(null)} /></div>
      )}

      {/* ÁREA DE TRANSICIÓN: Contenedor Relativo que maneja el Sliding */}
      <div className="flex-1 relative overflow-hidden flex w-full">
        
        {/* ==============================
            VISTA 1: TABLA Y FILTROS 
            (Desaparece hacia la izquierda si isFormOpen es true)
        ============================== */}
        <div 
          className={`absolute top-0 left-0 w-full h-full flex flex-col transition-all duration-700 ease-in-out
          ${isFormOpen ? '-translate-x-[110%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        >
          {/* Controles y Búsqueda */}
          <div className="flex gap-4 items-center mb-6">
            <div className="flex bg-[#121212] rounded-xl border border-gray-800 p-1">
              <button 
                onClick={() => setShowActive(true)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${showActive ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
              >Activos</button>
              <button 
                onClick={() => setShowActive(false)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${!showActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >Inactivos</button>
            </div>

            <div className="relative flex-1">
              <input
                type="text" placeholder="Buscar usuario, correo..." value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#121212] border border-gray-800 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all h-10"
              />
            </div>
            
            <div className="relative w-48">
              <select 
                value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#121212] border border-gray-800 text-white rounded-xl px-4 py-2 appearance-none focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all h-10"
              >
                <option value="">Todos los roles</option>
                {roles.map((rol) => (<option key={rol.id} value={rol.id}>{rol.nombre}</option>))}
              </select>
            </div>

            <button 
              onClick={handleOpenCreate}
              className="bg-brand-orange hover:bg-orange-600 text-black font-bold py-2 px-6 rounded-xl transition-colors shadow-lg flex items-center gap-2 h-10"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Usuario
            </button>
          </div>

          <UserTable 
            users={users} isLoading={isLoading} currentPage={currentPage} totalPages={totalPages} 
            onPageChange={setCurrentPage} onEditClick={handleOpenEdit}
          />
        </div>

        {/* ==============================
            VISTA 2: PANEL DE FORMULARIO 
            (Entra desde la derecha si isFormOpen es true)
        ============================== */}
        <div 
          className={`absolute top-0 left-0 w-full h-full flex flex-col transition-all duration-700 ease-in-out
          ${isFormOpen ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'}`}
        >
          <UserFormPanel 
            isOpen={isFormOpen}
            userToEdit={userToEdit}
            roles={roles}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveUser}
          />
        </div>

      </div>
    </div>
  );
};

export default UserManagementScreen;