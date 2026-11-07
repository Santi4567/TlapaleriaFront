// src/services/configService.ts
import { fetchWithAuth } from "../utils/fetchClient";
import { BusinessConfig, UpdateBusinessConfigPayload } from "../types/config";

const BASE_API = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_API}/Configuracion`;

export const configService = {
  async getConfig(token: string): Promise<{ success: boolean; data?: BusinessConfig; message?: string }> {
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const json = await response.json();
      return { success: response.ok, data: json.data, message: json.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async updateConfig(token: string, payload: UpdateBusinessConfigPayload): Promise<{ success: boolean; data?: BusinessConfig; message?: string }> {
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      return { success: response.ok, data: json.data, message: json.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async testFacturapi(token: string, apiKey?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetchWithAuth(`${API_URL}/probar-facturapi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const json = await response.json();
      return { success: response.ok, message: json.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};
