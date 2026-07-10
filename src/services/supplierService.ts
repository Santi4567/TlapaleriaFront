// src/services/supplierService.ts
import { APISuppliersResponse, CreateSupplierRequest, APICreateSupplierResponse, UpdateSupplierRequest } from "../types/supplier";

const API_URL = import.meta.env.VITE_API_URL;

export const supplierService = {
  
  getSuppliers: async (token: string): Promise<APISuppliersResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/Suppliers`, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return null;
    }
  },

  searchSuppliers: async (token: string, term: string): Promise<APISuppliersResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/Suppliers/search/${encodeURIComponent(term)}`, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error al buscar proveedor con término ${term}:`, error);
      return null;
    }
  },

  // Crear un proveedor
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
      
      // Aunque falle (ej. 400 Bad Request), intentamos leer el JSON para ver el mensaje de error de tu API
      return await response.json();
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      return { success: false, message: "Error de conexión al guardar el proveedor.", data: null };
    }
  },
  //  createSupplier 
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