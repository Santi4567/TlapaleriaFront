// src/types/auth.ts

// Petición de Login
export interface LoginRequest {
  usuarioOCorreo: string;
  password: string;
}

// Datos del usuario dentro de una respuesta exitosa
export interface UserData {
  usuario: string;
  token: string;
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

// Tipo de unión para manejar la respuesta cruda de la API
export type APIAuthResponse = LoginSuccessResponse | LoginAuthErrorResponse | ValidationErrorResponse;