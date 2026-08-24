// src/services/userService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { UsersApiResponse } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchUsers = async (
  token: string, 
  isActive: boolean,
  pageNumber: number = 1,
  pageSize: number = 10,
  rolId?: string,
  termino?: string 
): Promise<UsersApiResponse> => {
  let url = `${API_URL}/Users?isActive=${isActive}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
  
// Si rolId existe y no está vacío, lo inyectamos en la URL
if (rolId && rolId.trim() !== '') {
  url += `&rolId=${encodeURIComponent(rolId)}`;
}

// Si hay término de búsqueda, lo inyectamos
if (termino && termino.trim() !== '') {
  url += `&termino=${encodeURIComponent(termino)}`;
}

  const response = await fetchWithAuth(url, {
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
};

// Para crear un nuevo usuario 

export const createUser = async (
  token: string,
  userData: { username: string; password?: string; name: string; rolNombre: string }
) => {
  const response = await fetchWithAuth(`${API_URL}/Users/create`, {
    method: 'POST',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return response.json();
};

//Endpoint para actualizar datos generales
export const updateUser = async (
  token: string,
  id: number,
  userData: { username: string; name: string; rolNombre: string; isActive: boolean }
) => {
  // Ajustamos la ruta para que incluya /update/
  const response = await fetchWithAuth(`${API_URL}/Users/update/${id}`, { 
    method: 'PUT',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  return response.json();
};

//Endpoint para restablecer contraseña
export const resetUserPassword = async (
  token: string,
  id: number,
  newPassword: string
) => {
  const response = await fetchWithAuth(`${API_URL}/Users/admin-reset-password/${id}`, {
    method: 'POST',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ newPassword }) // Mandamos exactamente lo que pide tu cURL
  });

  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  return response.json();
};