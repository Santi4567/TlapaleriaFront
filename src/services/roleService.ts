// src/services/roleService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { RolesApiResponse } from '../types/role';

const API_URL = import.meta.env.VITE_API_URL;

export const roleService = {
  getRoles: async (token: string): Promise<RolesApiResponse> => {
    const response = await fetchWithAuth(`${API_URL}/Roles`, {
      method: 'GET',
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return response.json();
  },

  //Traer todos los permisos 
getPermissions: async (token: string) => {
    const response = await fetchWithAuth(`${API_URL}/Roles/permissions`, {
      method: 'GET',
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return response.json();
  },
  createRole: async (token: string, roleData: { nombre: string; permisosIds: number[] }) => {
    const response = await fetchWithAuth(`${API_URL}/Roles`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(roleData)
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
  },

  //Actualizar el nombre del ROL

  updateRole: async (token: string, id: number, roleData: { nombre: string; permisosIds?: number[] }) => {
    const response = await fetchWithAuth(`${API_URL}/Roles/${id}`, {
      method: 'PUT',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // Mandamos el nombre, y los permisos por si tu API los acepta en el mismo endpoint
      body: JSON.stringify(roleData)
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
  },

  // En src/services/roleService.ts
  deleteRole: async (token: string, roleId: number) => {
    const response = await fetchWithAuth(`${API_URL}/Roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    });

    // 1. Primero extraemos la respuesta JSON del servidor, sin importar si es error o éxito.
    const data = await response.json();

    // 2. Si el código HTTP es de error (400, 500), lanzamos el mensaje exacto que mandó tu API de C#
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }

    return data;
  },

  // Traer a los usuarios pertenecientes a un Rol

  getRoleUsers: async (token: string, roleId: number, pageNumber: number = 1, pageSize: number = 10) => {
    const response = await fetchWithAuth(`${API_URL}/Roles/${roleId}/users?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
  },

  // Agregar varios permisos de golpe
  addRolePermissionsBulk: async (token: string, roleId: number, permissionIds: number[]) => {
    const response = await fetchWithAuth(`${API_URL}/Roles/${roleId}/permissions/bulk`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(permissionIds)
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
  },

  // Quitar varios permisos de golpe
  removeRolePermissionsBulk: async (token: string, roleId: number, permissionIds: number[]) => {
    const response = await fetchWithAuth(`${API_URL}/Roles/${roleId}/permissions/bulk`, {
      method: 'DELETE',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(permissionIds)
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
  }

};
