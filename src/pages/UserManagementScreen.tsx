import React, { useState, useEffect } from 'react';
import { fetchUsers, searchUsers } from '../services/userService';
import { roleService } from '../services/roleService';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { Role } from '../types/role';
import UserTable from '../components/userManagement/UserTable';
import StatusAlert from '../components/StatusAlert'; 

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
    setAlert(null); 
    
    try {
      let response;
      // Si hay texto escrito, usamos el endpoint de search
      if (searchTerm.trim() !== '') {
        response = await searchUsers(user.token, searchTerm, showActive, roleFilter);
      } else {
        // Si no hay texto, usamos el normal (pero le pasamos el filtro de rol por si acaso)
        response = await fetchUsers(user.token, showActive, currentPage, 10, roleFilter);
      }

      if (response.success) {
        // Validación por si la búsqueda no trae paginación estructurada igual
        const data = response.data.data ? response.data.data : (response.data as any);
        setUsers(data || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
      } else {
        setAlert({ success: false, message: response.message || 'Error al cargar usuarios' });
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      setAlert({ success: false, message: 'Fallo la conexión con el servidor' });
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-6 text-white overflow-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Control de Usuarios</h1>
        <p className="text-gray-400">Gestiona los accesos, roles y estado del personal en el sistema.</p>
      </div>

      {alert && (
        <StatusAlert 
          success={alert.success} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}

      <div className="flex gap-4 items-center mb-6">
        <div className="flex bg-[#121212] rounded-xl border border-gray-800 p-1">
          <button 
            onClick={() => handleToggleTab(true)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${showActive ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Activos
          </button>
          <button 
            onClick={() => handleToggleTab(false)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${!showActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Inactivos
          </button>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar usuario, correo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Regresamos a pag 1 al buscar
            }}
            className="w-full bg-[#121212] border border-gray-800 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all h-10"
          />
        </div>
        
        <div className="relative w-48">
          <select 
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#121212] border border-gray-800 text-white rounded-xl px-4 py-2 appearance-none focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all h-10"
          >
            <option value="">Todos los roles</option>
            {/* Iteramos los roles que trajimos de la API */}
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>

        <button className="bg-brand-orange hover:bg-orange-600 text-black font-bold py-2 px-6 rounded-xl transition-colors shadow-lg flex items-center gap-2 h-10">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <UserTable 
        users={users} 
        isLoading={isLoading} 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage}
        onEditClick={(id) => console.log('Editar ID:', id)}
      />
    </div>
  );
};

export default UserManagementScreen;