// src/types/config.ts

export interface BusinessConfig {
  businessName: string;
  rfc?: string;
  postalCode: string;
  address?: string;
  phone?: string;
  email?: string;
  facturacionActiva: boolean;
  facturapiApiKey?: string;
  updatedAt?: string;
}

export interface UpdateBusinessConfigPayload {
  businessName: string;
  rfc?: string;
  postalCode: string;
  address?: string;
  phone?: string;
  email?: string;
  facturacionActiva: boolean;
  facturapiApiKey?: string;
}
