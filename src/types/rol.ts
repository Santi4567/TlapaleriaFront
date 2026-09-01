// src/types/role.ts

export interface Role {
  id: number;
  nombre: string;
  permisosIds?: number[];
  permisosNombres?: string[];
}

export interface RolesApiResponse {
  success: boolean;
  message: string;
  data: Role[];
}