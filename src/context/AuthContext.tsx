// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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

  // NUEVO: fetchClient.ts dispara estos dos eventos, pero antes NADIE los escuchaba.
  // Esa es la causa directa de "hay que cerrar sesión manualmente":
  //
  // 1. 'token-refreshed': fetchClient refresca el access token en segundo plano
  //    para poder reintentar la petición que dio 401, pero el token nuevo nunca
  //    llegaba a `user.token`. Entonces CADA llamada futura de cualquier
  //    componente seguía usando el token viejo (ya vencido) guardado acá,
  //    obligando a repetir el ciclo 401 -> refresh en cada petición individual
  //    en lugar de una sola vez cada ~15 min. Eso multiplica las llamadas a
  //    /Auth/refresh y aumenta mucho la probabilidad de pisar una carrera
  //    (ej. dos refresh casi simultáneos, o el WebView de Tauri tardando en
  //    aplicar la cookie rotada) -> exactamente el patrón "a veces falla, no
  //    siempre" que describes, porque depende de timing, no es determinístico.
  //
  // 2. 'auth-expired': fetchClient lo dispara cuando el refresh falla de verdad
  //    (sesión muerta), pero como nada lo escuchaba, `user` nunca se limpiaba.
  //    La app se quedaba "atorada": pantalla de logueado, pero cada petición
  //    fallando en silencio (por eso "no carga nada"), sin que nada la sacara
  //    de ese estado hasta que el usuario cerraba sesión a mano.
  useEffect(() => {
    const handleTokenRefreshed = (event: Event) => {
      const { token } = (event as CustomEvent<{ token: string }>).detail;
      console.log('[AuthContext] 🔑 Token actualizado tras refresh automático.');
      setUser(prevUser => (prevUser ? { ...prevUser, token } : prevUser));
    };

    const handleAuthExpired = () => {
      console.warn('[AuthContext] 🚪 Sesión realmente expirada (refresh falló). Cerrando sesión...');
      setUser(null);
      setAuthError('Tu sesión expiró. Por favor, inicia sesión de nuevo.');
    };

    window.addEventListener('token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    setValidationErrors(null);

    try {
      const response = await authService.login(credentials);

      // 1. Manejo de Éxito (success: true)
      if ('success' in response && response.success && response.data) {
        
        // Extraemos lo básico que nos dio el primer endpoint
        const token = response.data.token;
        const usuario = response.data.usuario;

        // AHORA SÍ: Pedimos los datos completos del perfil usando el token
        const profileResponse = await authService.getProfile(token);

        if (profileResponse && profileResponse.success) {
          // Fusionamos la información
          const fullUserData: UserData = {
            usuario: usuario,
            token: token,
            id: profileResponse.data.id,
            name: profileResponse.data.name,
            rol: profileResponse.data.rol,
            permisos: profileResponse.data.permisos
          };

          setUser(fullUserData); // Guardamos usuario completo en memoria
          console.log("Login y carga de perfil exitosos en Tlapaleria LEO");
          return true;
        } else {
          setAuthError("No se pudieron verificar los permisos del usuario.");
          return false;
        }
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