// src/utils/fetchClient.ts
import { getSecureToken, saveSecureToken, deleteSecureToken } from './authStore';

const API_URL = import.meta.env.VITE_API_URL;

let isRefreshing = false;

// La cola espera recibir un string (el nuevo token) al resolverse
let failedQueue: Array<{ resolve: (value?: any) => void, reject: (reason?: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Si la petición sigue en 401 incluso después de haber refrescado el token,
// la sesión está realmente muerta.
const ensureNotUnauthorized = (response: Response) => {
  if (response.status === 401) {
    console.error(`[fetchClient] 🚨 401 persistente tras refresh.`);
    window.dispatchEvent(new CustomEvent('auth-expired', {
      detail: { message: 'La sesión no pudo renovarse correctamente. Vuelve a iniciar sesión.' }
    }));
    throw new Error('La sesión no pudo renovarse (401 persistente tras refresh).');
  }
  return response;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  console.log(`[fetchClient] 🚀 Iniciando petición a: ${url}`);

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'accept': 'application/json',
    }
  };

  // Ejecutar la petición original
  let response = await fetch(url, fetchOptions);
  console.log(`[fetchClient] 📥 Respuesta de ${url}: Status ${response.status}`);

  // Interceptar el 401
  if (response.status === 401) {
    console.warn(`[fetchClient] ⚠️ 401 No Autorizado detectado en ${url}.`);

    // Si ya hay un proceso de refresh ejecutándose, ponemos en cola
    if (isRefreshing) {
      console.log(`[fetchClient] ⏸️ Refresh en curso. Pausando petición a: ${url}`);
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        console.log(`[fetchClient] ▶️ Reanudando petición pausada a: ${url}`);
        if (newToken) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${newToken}`
          };
        }
        return fetch(url, fetchOptions);
      }).then(ensureNotUnauthorized)
      .catch(err => {
        console.error(`[fetchClient] ❌ Error en petición pausada (${url}):`, err);
        return Promise.reject(err);
      });
    }

    // Si somos los primeros, bloqueamos e iniciamos el refresh
    isRefreshing = true;
    console.log(`[fetchClient] 🔄 Iniciando proceso automático de Refresh Token...`);

    let newToken: string;
    try {
      // 1. AHORA ES ASÍNCRONO Y SEGURO: Leer el token desencriptado
      const storedRefreshToken = await getSecureToken();
      if (!storedRefreshToken) {
        throw new Error('No hay refresh token local para renovar la sesión o el archivo fue manipulado.');
      }

      // 2. Mandarlo explícitamente en el cuerpo (JSON)
      const refreshResponse = await fetch(`${API_URL}/Auth/refresh`, {
        method: 'POST',
        headers: { 
          'accept': 'application/json',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });
      console.log(`[fetchClient] 📥 Respuesta del Refresh Endpoint: Status ${refreshResponse.status}`);

      let refreshResult: any = null;
      try {
        refreshResult = await refreshResponse.json();
        console.log(`[fetchClient] 📦 Cuerpo del Refresh Result:`, refreshResult);
      } catch {
        console.warn('[fetchClient] El body del refresh no era JSON válido.');
      }

      if (!(refreshResponse.ok && refreshResult?.success && refreshResult?.data?.token)) {
        // El refresh falló de verdad (ej. el refresh token caducó o no es válido).
        const backendMessage = typeof refreshResult?.message === 'string' ? refreshResult.message : null;
        throw new Error(backendMessage || `La sesión expiró o falló el endpoint de refresh. Status: ${refreshResponse.status}`);
      }

      newToken = refreshResult.data.token;
      
      // 3. AHORA ES ASÍNCRONO Y SEGURO: Encriptar y guardar el nuevo token
      if (refreshResult.data.refreshToken) {
        await saveSecureToken(refreshResult.data.refreshToken);
      }

      console.log(`[fetchClient] ✅ Refresh exitoso. Nuevo token capturado.`);

      // CLAVE: avisamos al resto de la app (AuthContext) que hay token nuevo
      window.dispatchEvent(new CustomEvent('token-refreshed', { detail: { token: newToken } }));

      // Liberamos las peticiones que quedaron pausadas esperando este refresh
      console.log(`[fetchClient] 🔓 Liberando ${failedQueue.length} peticiones en cola...`);
      processQueue(null, newToken);

    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      console.error(`[fetchClient] 🚨 Error crítico durante el refresh:`, message);
      processQueue(error as Error);

      // 4. Eliminar el token corrupto o caducado
      try {
        await deleteSecureToken();
      } catch (storeError) {
        console.error("[fetchClient] Error al limpiar el store:", storeError);
      }

      // Mandamos el mensaje real del backend en el evento
      console.log(`[fetchClient] 🚪 Emitiendo evento 'auth-expired' para redirección al login.`);
      window.dispatchEvent(new CustomEvent('auth-expired', { detail: { message } }));

      throw error;

    } finally {
      isRefreshing = false;
      console.log(`[fetchClient] 🏁 Finalizó el bloque de intercepción 401.`);
    }

    // Reintentamos nuestra propia petición original YA con el nuevo token
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Authorization': `Bearer ${newToken}`
    };
    console.log(`[fetchClient] 🔄 Reintentando petición original a: ${url} con el nuevo token.`);
    response = await fetch(url, fetchOptions);
    console.log(`[fetchClient] 📥 Respuesta del reintento (${url}): Status ${response.status}`);

    ensureNotUnauthorized(response);
  }

  return response;
};