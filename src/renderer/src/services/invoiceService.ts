// src/services/invoiceService.ts
import { fetchWithAuth } from "../utils/fetchClient";
import { EmitirFacturaPayload, FacturaResponse, Invoice } from "../types/invoice";

const BASE_API = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_API}/Facturas`;

export const invoiceService = {
  /**
   * Emite y timbra una factura ante el SAT
   */
  async emitirFactura(token: string, payload: EmitirFacturaPayload): Promise<{ success: boolean; data?: FacturaResponse; message?: string }> {
    try {
      const response = await fetchWithAuth(`${API_URL}/emitir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: json.message || 'Error al emitir la factura.'
        };
      }

      return {
        success: true,
        data: json.data,
        message: json.message
      };
    } catch (error: any) {
      console.error('Error en emitirFactura:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor de facturación.'
      };
    }
  },

  /**
   * Consulta si una venta ya cuenta con factura emitida
   */
  async getFacturaPorVenta(token: string, saleId: number): Promise<{ success: boolean; data?: Invoice; message?: string }> {
    try {
      const response = await fetchWithAuth(`${API_URL}/venta/${saleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const json = await response.json();
      if (!response.ok) {
        return { success: false, message: json.message };
      }

      return { success: true, data: json.data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Descarga el archivo PDF oficial de la factura
   */
  async descargarPdf(token: string, invoiceId: number, uuid: string): Promise<boolean> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${invoiceId}/descargar-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al descargar el PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${uuid}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      return false;
    }
  },

  /**
   * Descarga el archivo XML fiscal de la factura
   */
  async descargarXml(token: string, invoiceId: number, uuid: string): Promise<boolean> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${invoiceId}/descargar-xml`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al descargar el XML');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${uuid}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (error) {
      console.error('Error al descargar XML:', error);
      return false;
    }
  },

  /**
   * Envía o reenvía la factura por correo electrónico
   */
  async enviarPorEmail(token: string, invoiceId: number, email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${invoiceId}/enviar-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const json = await response.json();
      return { success: response.ok, message: json.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Cancela una factura ante el SAT
   */
  async cancelarFactura(token: string, invoiceId: number, motivo: string = '02'): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${invoiceId}/cancelar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });

      const json = await response.json();
      return { success: response.ok, message: json.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};
