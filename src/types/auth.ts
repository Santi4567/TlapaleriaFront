// src/types/auth.ts

// Petición de Login
export interface LoginRequest {
  usuarioOCorreo: string;
  password: string;
}

// Datos del usuario dentro de una respuesta exitosa
export interface UserData {
  usuario: string; // El que viene del login
  token: string;   // El que viene del login
  
  // Propiedades del perfil (Opcionales al inicio, se llenan después)
  id?: number;
  username?: string;
  name?: string;
  rol?: string;
  permisos?: Permisos;
}

// Respuesta Exitosa (200)
export interface LoginSuccessResponse {
  success: true;
  message: string;
  data: UserData;
}

// Respuesta de Error de Credenciales (200 o 401 según API)
export interface LoginAuthErrorResponse {
  success: false;
  message: string;
  data: null;
}

// Respuesta de Error de Validación (400 Bad Request)
export interface ValidationErrorResponse {
  type: string;
  title: string;
  status: 400;
  errors: {
    // Las claves son dinámicas según el campo que falle (ej. "Password", "UsuarioOCorreo")
    [key: string]: string[];
  };
  traceId: string;
}

export interface Permisos {
  USERS?: string[];
  PRODUCTS?: string[];
  RESET_PASSWORD?: string[];
  SUPPLIERS?: string[];
  PENDINGORDERS?: string[];
  INVENTORYMOVEMENTS?: string[];
  RETURNS?: string[];
  SALES?: string[];
}

export interface User {
  id: number;
  username: string;
  name: string;
  rol: string;
  permisos: Permisos;
}

// Tipo de unión para manejar la respuesta cruda de la API
export type APIAuthResponse = LoginSuccessResponse | LoginAuthErrorResponse | ValidationErrorResponse | Permisos | User;