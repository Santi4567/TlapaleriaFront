// src/services/authService.ts
import { LoginRequest, APIAuthResponse } from "../types/auth";

// Vite expone las variables de entorno a través de import.meta.env
const API_URL = import.meta.env.VITE_API_URL;

export const authService = {

  // FUNCIÓN: Verifica si el API está online
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/Health`, {
        method: 'GET',
        headers: { 'accept': '*/*' }
      });
      return response.status === 200;
    } catch (error) {
      console.error("Error en Health Check:", error);
      return false;
    }
  },

  // FUNCIÓN: Iniciar sesión 
  login: async (credentials: LoginRequest): Promise<APIAuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      return data as APIAuthResponse;

    } catch (error) {
      console.error("Error de red en Login:", error);
      return {
        success: false,
        message: "No se pudo conectar con el servidor de Tlapaleria LEO.",
        data: null
      };
    }
  },

  // NUEVA FUNCIÓN: Obtener el perfil y permisos del usuario usando el Token
  getProfile: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/Users/profile`, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          // Esta es la llave que evita el error 401
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Devolvemos el JSON completo que mostraste ({ success: true, data: { name, rol, permisos... } })
      return await response.json(); 

    } catch (error) {
      console.error("Error al obtener el perfil del usuario:", error);
      return null;
    }
  }
};