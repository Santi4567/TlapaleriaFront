// src/components/userManagement/UserTable.tsx
import React from 'react';
import { User } from '../../types/user';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditClick: (id: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onEditClick
}) => {
  return (
    <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden flex flex-col flex-1">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1a1a] text-gray-400 text-sm uppercase tracking-wider">
              <th className="p-4 border-b border-gray-800 font-medium">Nombre</th>
              <th className="p-4 border-b border-gray-800 font-medium">Usuario / Correo</th>
              <th className="p-4 border-b border-gray-800 font-medium">Rol</th>
              <th className="p-4 border-b border-gray-800 font-medium">Estado</th>
              <th className="p-4 border-b border-gray-800 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors text-white">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-400">{u.username}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 border border-gray-700">
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1
                      ${u.isActive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button 
                      onClick={() => onEditClick(u.id)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Editar Usuario"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación - Estilo de la imagen */}
      <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
        <span className="text-gray-400 text-sm">
          Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages || 1}</strong>
        </span>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button 
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTable;