import { load } from '@tauri-apps/plugin-store';

let storeInstance: any = null;

// Tu llave secreta (idealmente en tu .env)
const SECRET_KEY = import.meta.env.VITE_ENCRYPT_KEY || 'TlapaleriaLeo_SecureKey_2026';

// 1. Inicializar el Store de Tauri
const getAuthStore = async () => {
  if (!storeInstance) {
    storeInstance = await load('auth.json', { autoSave: true });
  }
  return storeInstance;
};

// ==========================================
// LÓGICA DE CRIPTOGRAFÍA NATIVA (Web Crypto API)
// ==========================================

// Prepara la llave convirtiendo el texto en una clave AES-GCM de 256 bits
const getCryptoKey = async (): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  // Hasheamos la contraseña para obtener exactamente 32 bytes (256 bits)
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(SECRET_KEY));
  return await crypto.subtle.importKey(
    'raw', 
    keyMaterial, 
    { name: 'AES-GCM' }, 
    false, 
    ['encrypt', 'decrypt']
  );
};

// Convierte un ArrayBuffer a Base64 para guardarlo en el JSON
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convierte el Base64 de vuelta a ArrayBuffer
const base64ToBuffer = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// ==========================================
// MÉTODOS PÚBLICOS SEGUROS
// ==========================================

export const getSecureToken = async (): Promise<string | null> => {
  const store = await getAuthStore();
  const encryptedBase64 = await store.get<string>('leo_refresh_token');
  
  if (!encryptedBase64) return null;

  try {
    const key = await getCryptoKey();
    const encryptedData = base64ToBuffer(encryptedBase64);
    
    // Extraemos los primeros 12 bytes (el Vector de Inicialización)
    const iv = encryptedData.slice(0, 12);
    // El resto es el texto cifrado
    const ciphertext = encryptedData.slice(12);

    // Desencriptamos
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Error al desencriptar el token (llave incorrecta o archivo corrupto)", error);
    return null; // Forzará el cierre de sesión si alguien manipuló el archivo
  }
};

export const saveSecureToken = async (token: string): Promise<void> => {
  const store = await getAuthStore();
  const key = await getCryptoKey();
  
  // Generamos un Vector de Inicialización (IV) único de 12 bytes para esta sesión
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encriptamos
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    new TextEncoder().encode(token)
  );

  // Unimos el IV y el texto cifrado en un solo paquete
  const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.length);

  // Convertimos a base64 para guardarlo como string
  const finalEncryptedString = bufferToBase64(combined.buffer);
  
  await store.set('leo_refresh_token', finalEncryptedString);
  await store.save();
};

export const deleteSecureToken = async (): Promise<void> => {
  const store = await getAuthStore();
  await store.delete('leo_refresh_token');
  await store.save();
};