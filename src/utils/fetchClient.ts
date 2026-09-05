// src/utils/fetchClient.ts

const API_URL = import.meta.env.VITE_API_URL;

let isRefreshing = false;

// 1. CORRECCIÓN: La cola ahora espera recibir un string (el nuevo token) al resolverse
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// NUEVO: llama a /Auth/refresh con reintentos limitados.
// OJO: solo reintenta ante errores de RED o 5xx (fallas transitorias).
// Si el servidor responde 401/403, el refresh token fue rechazado y
// reintentar con el mismo token no cambiará el resultado, así que
// devolvemos esa respuesta de inmediato sin gastar reintentos.
const REFRESH_MAX_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY_MS = 600;

const callRefreshEndpoint = async (): Promise<Response> => {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= REFRESH_MAX_ATTEMPTS; attempt++) {
    try {
      const refreshResponse = await fetch(`${API_URL}/Auth/refresh`, {
        method: 'POST',
        headers: { 'accept': 'text/plain' },
        credentials: 'include',
        body: ''
      });

      if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        console.warn(`[fetchClient] 🔒 Refresh token rechazado (${refreshResponse.status}). No tiene sentido reintentar con el mismo token.`);
        return refreshResponse;
      }

      if (!refreshResponse.ok && attempt < REFRESH_MAX_ATTEMPTS) {
        console.warn(`[fetchClient] ⚠️ Refresh devolvió ${refreshResponse.status} (posible falla transitoria). Reintento ${attempt}/${REFRESH_MAX_ATTEMPTS}...`);
        await sleep(REFRESH_RETRY_DELAY_MS * attempt);
        continue;
      }

      return refreshResponse;
    } catch (err) {
      lastError = err;
      if (attempt < REFRESH_MAX_ATTEMPTS) {
        console.warn(`[fetchClient] ⚠️ Error de red llamando a /Auth/refresh. Reintento ${attempt}/${REFRESH_MAX_ATTEMPTS}...`, err);
        await sleep(REFRESH_RETRY_DELAY_MS * attempt);
        continue;
      }
    }
  }

  throw lastError;
};

// NUEVO: si tras refrescar el token la petición en cola SIGUE en 401,
// la sesión está realmente muerta. Antes esto se devolvía en silencio
// como una Response normal y el caller (ej. productService) simplemente
// lo trataba como "error HTTP" y devolvía null, sin disparar logout.
const ensureNotUnauthorized = (response: Response) => {
  if (response.status === 401) {
    console.error(`[fetchClient] 🚨 401 persistente tras refresh en una petición de la cola.`);
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('La sesión no pudo renovarse (401 persistente tras refresh).');
  }
  return response;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  console.log(`[fetchClient] 🚀 Iniciando petición a: ${url}`);

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include', 
    headers: {
      ...options.headers,
      'accept': 'text/plain', 
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
        
        // 2. CORRECCIÓN: Actualizamos los headers con el nuevo token antes del reintento
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

    try {
      const refreshResponse = await callRefreshEndpoint();

      console.log(`[fetchClient] 📥 Respuesta del Refresh Endpoint: Status ${refreshResponse.status}`);

      if (!refreshResponse.ok) {
        throw new Error(`La sesión expiró o falló el endpoint de refresh. Status: ${refreshResponse.status}`);
      }

      const refreshResult = await refreshResponse.json();
      console.log(`[fetchClient] 📦 Cuerpo del Refresh Result:`, refreshResult);

      if (refreshResult.success && refreshResult.data && refreshResult.data.token) {
        const newToken = refreshResult.data.token;
        console.log(`[fetchClient] ✅ Refresh exitoso. Nuevo token capturado.`);

        // 5. CORRECCIÓN (CLAVE): avisar al resto de la app que hay un token nuevo.
        // Antes, el token nuevo solo se usaba para ESTA petición y las que estaban
        // en cola en ese instante. Cualquier llamada futura (ej. otro método de
        // productService) seguía usando el `token` viejo que tenía guardado el
        // componente/contexto de auth, porque nadie se lo actualizaba.
        // Eso obliga a que CADA petición futura vuelva a pasar por todo este
        // ciclo de 401 -> refresh, en vez de usar directamente el token vigente.
        // Quien maneje el estado de auth (AuthContext, store, etc.) debe escuchar
        // este evento y guardar el token nuevo.
        window.dispatchEvent(new CustomEvent('token-refreshed', { detail: { token: newToken } }));

        // Actualizamos el header de la petición que originó el 401
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${newToken}`
        };

        // Liberamos las peticiones pausadas pasándoles el nuevo token
        console.log(`[fetchClient] 🔓 Liberando ${failedQueue.length} peticiones en cola...`);
        processQueue(null, newToken);
        
        // Reintentamos nuestra propia petición original YA con el nuevo token
        console.log(`[fetchClient] 🔄 Reintentando petición original a: ${url} con el nuevo token.`);
        response = await fetch(url, fetchOptions);
        console.log(`[fetchClient] 📥 Respuesta del reintento (${url}): Status ${response.status}`);

        // 6. CORRECCIÓN: si INCLUSO con el token recién refrescado seguimos en 401,
        // antes esto se devolvía tal cual al caller (productService lo veía como
        // un "Error HTTP: 401" cualquiera, lo logueaba y devolvía null). Eso es
        // exactamente el síntoma que describes: la pantalla "no carga nada" sin
        // que nunca se dispare un logout real. Ahora lo tratamos como sesión muerta.
        if (response.status === 401) {
          throw new Error('La sesión no pudo renovarse: el servidor rechazó el token incluso después del refresh.');
        }
      } else {
        throw new Error(refreshResult.message || "Error al renovar sesión, la respuesta no contiene token válido.");
      }

    } catch (error) {
      console.error(`[fetchClient] 🚨 Error crítico durante el refresh:`, error);
      processQueue(error as Error);
      
      // 4. CORRECCIÓN: Evitamos window.location.href para que Tauri no reinicie toda la ventana.
      // Despachamos un evento que tu AuthContext puede escuchar para cerrar sesión limpiamente.
      console.log(`[fetchClient] 🚪 Emitiendo evento 'auth-expired' para redirección suave.`);
      window.dispatchEvent(new Event('auth-expired'));
      
      throw error;
      
    } finally {
      isRefreshing = false;
      console.log(`[fetchClient] 🏁 Finalizó el bloque de intercepción 401.`);
    }
  }

  return response;
};