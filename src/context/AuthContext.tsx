// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserData, LoginRequest, ValidationErrorResponse } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  authError: string | null; // Error general de credenciales
  validationErrors: ValidationErrorResponse['errors'] | null; // Errores de campo (400)
  login: (credentials: LoginRequest) => Promise<boolean>; // Devuelve true si el login fue exitoso
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado en memoria: EL TOKEN SOLO VIVE AQUÍ
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorResponse['errors'] | null>(null);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    setValidationErrors(null);

    try {
      const response = await authService.login(credentials);

      // 1. Manejo de Éxito (success: true)
      if ('success' in response && response.success) {
        setUser(response.data); // Guardamos usuario y token en memoria
        console.log("Login exitoso Tlapaleria LEO");
        return true;
      }

      // 2. Manejo de Error de Validación (status: 400)
      if ('status' in response && response.status === 400) {
        setValidationErrors(response.errors);
        return false;
      }

      // 3. Manejo de Error de Autenticación (success: false)
      if ('success' in response && !response.success) {
        setAuthError(response.message);
        return false;
      }

      // Fallback para respuestas inesperadas
      setAuthError("Error desconocido al iniciar sesión.");
      return false;

    } catch (error) {
      setAuthError("Ocurrió un error inesperado de red.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null); // Al setear a null, se pierde el token de la memoria.
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, validationErrors, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};