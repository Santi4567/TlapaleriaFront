// src/services/supplierService.ts
import { 
  APISuppliersResponse, 
  APISearchSuppliersResponse, 
  CreateSupplierRequest, 
  UpdateSupplierRequest, 
  APICreateSupplierResponse 
} from "../types/supplier";

const API_URL = import.meta.env.VITE_API_URL;

export const supplierService = {
  
  getSuppliers: async (
    token: string, 
    pageNumber: number = 1, 
    pageSize: number = 10, 
    isActive: boolean = true
  ): Promise<APISuppliersResponse | null> => {
    try {
      const response = await fetch(
        `${API_URL}/Suppliers?isActive=${isActive}&pageNumber=${pageNumber}&pageSize=${pageSize}`, 
        {
          method: 'GET',
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return null;
    }
  },

  // ACTUALIZADO: Ahora recibe "isActive" y lo agrega como parámetro GET a la URL de búsqueda
  searchSuppliers: async (
    token: string, 
    term: string, 
    isActive: boolean = true
  ): Promise<APISearchSuppliersResponse | null> => {
    try {
      const response = await fetch(
        `${API_URL}/Suppliers/search/${encodeURIComponent(term)}?isActive=${isActive}`, 
        {
          method: 'GET',
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error al buscar proveedor con término ${term}:`, error);
      return null;
    }
  },

  createSupplier: async (token: string, supplier: CreateSupplierRequest): Promise<APICreateSupplierResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/Suppliers`, {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplier)
      });
      return await response.json();
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      return { success: false, message: "Error de conexión al guardar el proveedor.", data: null };
    }
  },

  updateSupplier: async (token: string, id: number, supplier: UpdateSupplierRequest) => {
    try {
      const response = await fetch(`${API_URL}/Suppliers/${id}`, {
        method: 'PUT',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplier)
      });
      return await response.json();
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      return { success: false, message: "Error de conexión al actualizar el proveedor.", data: null };
    }
  }
};