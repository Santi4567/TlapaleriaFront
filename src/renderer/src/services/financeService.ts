// src/services/financeService.ts
import { FinancialReportResponse } from '../types/finance';
import { fetchWithAuth } from '../utils/fetchClient';

const API_URL = `${import.meta.env.VITE_API_URL}/reports/financial`;

export const financeService = {
  async getFinancialReport(
    token: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<FinancialReportResponse | null> {
    try {
      let url = API_URL;
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log(`[financeService] Consultando reporte en: ${url}`);

      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: FinancialReportResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener el reporte financiero:', error);
      return null;
    }
  }
};