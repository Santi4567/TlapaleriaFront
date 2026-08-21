export interface Role {
  id: number;
  nombre: string;
}

export interface RolesApiResponse {
  success: boolean;
  message: string;
  data: Role[];
}