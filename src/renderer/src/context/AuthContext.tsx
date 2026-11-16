// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { UserData, LoginRequest, ValidationErrorResponse } from '../types/auth';
import { authService } from '../services/authService';
import { inventoryHubService } from '../services/inventoryHubService';
import { saveSecureToken, getSecureToken, deleteSecureToken } from '../utils/authStore';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  authError: string | null; // Error general de credenciales
  validationErrors: ValidationErrorResponse['errors'] | null; // Errores de campo (400)
  login: (credentials: LoginRequest) => Promise<boolean>; // Devuelve true si el login fue exitoso
  logout: () => Promise<void>; // Asíncrono para limpiar la base de datos y el store
  refreshProfile: () => Promise<void>; // Actualizar perfil y permisos en segundo plano vía SignalR
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado en memoria: EL ACCESS TOKEN SOLO VIVE AQUÍ
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorResponse['errors'] | null>(null);

  // Mantener referencia mutable del usuario para los callbacks de eventos sin stale closures
  const userRef = useRef<UserData | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Conectar a SignalR tan pronto como haya token de usuario disponible
  useEffect(() => {
    if (user?.token) {
      inventoryHubService.connect(user.token).catch((err) => {
        console.warn('[AuthContext] ⚠️ Error al conectar al Hub en tiempo real:', err);
      });
    }
  }, [user?.token]);

  // Función para refrescar perfil y permisos silenciosamente en segundo plano
  const refreshProfile = async () => {
    const currentUser = userRef.current;
    if (!currentUser?.token) return;

    try {
      const profileResponse = await authService.getProfile(currentUser.token);
      if (profileResponse && profileResponse.success && profileResponse.data) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            name: profileResponse.data.name,
            rol: profileResponse.data.rol,
            permisos: profileResponse.data.permisos
          };
        });
        console.log('[AuthContext] ⚡ Permisos y perfil actualizados dinámicamente vía SignalR.');
      }
    } catch (error) {
      console.warn('[AuthContext] ⚠️ Error al sincronizar perfil en segundo plano:', error);
    }
  };

  // fetchClient.ts y SignalR disparan estos eventos:
  // - 'token-refreshed': cuando refresca el access token en segundo plano.
  // - 'auth-expired': cuando el refresh falla o el usuario es desactivado.
  // - 'permissions-updated': cuando el admin cambia permisos del rol vía SignalR.
  // - 'user-updated': cuando el admin cambia datos o rol del usuario vía SignalR.
  useEffect(() => {
    const handleTokenRefreshed = (event: Event) => {
      const { token } = (event as CustomEvent<{ token: string }>).detail;
      console.log('[AuthContext] 🔑 Token actualizado tras refresh automático.');
      setUser((prevUser) => (prevUser ? { ...prevUser, token } : prevUser));
    };

    const handleAuthExpired = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      console.warn('[AuthContext] 🚪 Sesión expirada. Cerrando sesión...', message);
      inventoryHubService.disconnect();
      setUser(null);
      setAuthError(message || 'Tu sesión expiró. Por favor, inicia sesión de nuevo.');
    };

    const handlePermissionsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ roleId?: number; roleName?: string }>).detail;
      const currentUser = userRef.current;
      if (!currentUser) return;

      // Si el evento especifica un rol y no coincide con el nuestro, lo ignoramos
      if (detail?.roleName && currentUser.rol && detail.roleName !== currentUser.rol) {
        return;
      }

      console.log('[AuthContext] 🔄 Permisos modificados en el servidor para rol:', detail?.roleName || 'Global');
      refreshProfile();
    };

    const handleUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: number; roleName?: string; isActive?: boolean }>).detail;
      const currentUser = userRef.current;
      if (!currentUser) return;

      if (detail?.userId && detail.userId === currentUser.id) {
        if (detail.isActive === false) {
          console.warn('[AuthContext] 🛑 Cuenta desactivada por un administrador.');
          window.dispatchEvent(
            new CustomEvent('auth-expired', {
              detail: { message: 'Tu cuenta ha sido desactivada por un administrador.' }
            })
          );
          return;
        }

        if (detail.roleName && detail.roleName !== currentUser.rol) {
          console.log('[AuthContext] 🔄 Rol del usuario actualizado por un administrador a:', detail.roleName);
          refreshProfile();
        }
      }
    };

    window.addEventListener('token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-expired', handleAuthExpired);
    window.addEventListener('permissions-updated', handlePermissionsUpdated);
    window.addEventListener('user-updated', handleUserUpdated);

    return () => {
      window.removeEventListener('token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-expired', handleAuthExpired);
      window.removeEventListener('permissions-updated', handlePermissionsUpdated);
      window.removeEventListener('user-updated', handleUserUpdated);
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

        // NUEVO: Guardamos el refresh token de forma segura (encriptado en disco)
        const refreshToken = (response.data as any).refreshToken;
        if (refreshToken) {
          await saveSecureToken(refreshToken);
        }

        // AHORA SÍ: Pedimos los datos completos del perfil usando el access token
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

  const logout = async () => {
    try {
      // 1. Leer y desencriptar el token de forma asíncrona
      const storedRefreshToken = await getSecureToken();

      if (storedRefreshToken) {
        // 2. Le avisamos al backend que destruya la sesión en la base de datos
        await authService.logout(storedRefreshToken);
      }
    } catch (error) {
      console.error("[AuthContext] Error al notificar el logout al servidor:", error);
    } finally {
      await inventoryHubService.disconnect();

      // 3. Destruirlo del disco duro de forma segura
      await deleteSecureToken();

      // 4. Limpiamos la memoria de React
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, validationErrors, login, logout, refreshProfile }}>
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
