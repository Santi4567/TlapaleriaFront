// src/components/roleManagement/RolListUser.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { roleService } from '../../services/roleService';

interface RolListUserProps {
  roleId: number;
}

const RolListUser: React.FC<RolListUserProps> = ({ roleId }) => {
  const { user } = useAuth();
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.token || roleId === 0) return;
      
      setIsLoading(true);
      try {
        const response = await roleService.getRoleUsers(user.token, roleId, 1, 10);
        if (response.success && response.data) {
          setRoleUsers(response.data.data || []);
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [roleId, user]);

  if (isLoading) {
    return <div className="flex justify-center p-10"><p className="text-brand-orange animate-pulse">Cargando usuarios...</p></div>;
  }

  if (roleUsers.length === 0) {
    return (
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-10 text-center mt-4">
        <p className="text-gray-500">No hay ningún usuario asignado a este rol actualmente.</p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-gray-800 rounded-2xl overflow-hidden mt-4 shadow-inner">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-gray-900/80 text-brand-orange uppercase text-xs font-bold border-b border-gray-800">
          <tr>
            <th className="px-6 py-4">Nombre</th>
            <th className="px-6 py-4">Usuario / Correo</th>
            <th className="px-6 py-4 text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {roleUsers.map(u => (
            <tr key={u.id} className="hover:bg-gray-900/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white">{u.name}</td>
              <td className="px-6 py-4 text-gray-400">{u.username}</td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                  ${u.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {u.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RolListUser;