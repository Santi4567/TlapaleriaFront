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
  }
  
  // Aquí agregarás después: updateRole, createRole, deleteRole...
};
