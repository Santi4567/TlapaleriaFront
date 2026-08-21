// src/services/userService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { UsersApiResponse } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchUsers = async (
  token: string, 
  isActive: boolean,
  pageNumber: number = 1,
  pageSize: number = 10,
  rolId?: string // <-- Asegúrate de recibirlo aquí
): Promise<UsersApiResponse> => {
  let url = `${API_URL}/Users?isActive=${isActive}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
  
  // Si rolId existe y no está vacío, lo inyectamos en la URL
  if (rolId) {
    url += `&rolId=${rolId}`;
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

export const searchUsers = async (
  token: string,
  term: string,
  isActive: boolean,
  rolId?: string
): Promise<UsersApiResponse> => {
  let url = `${API_URL}/Users/search/${encodeURIComponent(term)}?isActive=${isActive}`;
  if (rolId) url += `&rolId=${rolId}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'accept': 'text/plain',
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  return response.json();
};