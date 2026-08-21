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
      }).catch(err => {
        console.error(`[fetchClient] ❌ Error en petición pausada (${url}):`, err);
        return Promise.reject(err);
      });
    }

    // Si somos los primeros, bloqueamos e iniciamos el refresh
    isRefreshing = true;
    console.log(`[fetchClient] 🔄 Iniciando proceso automático de Refresh Token...`);

    try {
      const refreshResponse = await fetch(`${API_URL}/Auth/refresh`, {
        method: 'POST',
        headers: { 'accept': 'text/plain' },
        credentials: 'include',
        body: ''
      });

      console.log(`[fetchClient] 📥 Respuesta del Refresh Endpoint: Status ${refreshResponse.status}`);

      if (!refreshResponse.ok) {
        throw new Error(`La sesión expiró o falló el endpoint de refresh. Status: ${refreshResponse.status}`);
      }

      const refreshResult = await refreshResponse.json();
      console.log(`[fetchClient] 📦 Cuerpo del Refresh Result:`, refreshResult);

      if (refreshResult.success && refreshResult.data && refreshResult.data.token) {
        const newToken = refreshResult.data.token;
        console.log(`[fetchClient] ✅ Refresh exitoso. Nuevo token capturado.`);
        
        // 3. CORRECCIÓN: Actualizamos el header de la petición que originó el 401
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