// src/types/invoice.ts

export interface EmitirFacturaPayload {
  saleId: number;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  codigoPostal: string;
  usoCfdi: string;
  email?: string;
  formaPago?: string;
}

export interface FacturaResponse {
  id: number;
  saleId: number;
  folioVenta: string;
  facturapiId: string;
  uuid: string;
  rfc: string;
  razonSocial: string;
  total: number;
  status: string;
  verificationUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  saleId: number;
  facturapiId: string;
  uuid: string;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  codigoPostal: string;
  usoCfdi: string;
  total: number;
  status: 'valid' | 'canceled';
  verificationUrl?: string;
  cancelReason?: string;
  createdAt: string;
  canceledAt?: string;
  sale?: {
    id: number;
    folio: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
  };
}

export const REGIMENES_FISCALES = [
  { clave: '616', descripcion: '616 - Sin obligaciones fiscales' },
  { clave: '612', descripcion: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '626', descripcion: '626 - Régimen Simplificado de Confianza (RESICO)' },
  { clave: '601', descripcion: '601 - General de Ley Personas Morales' },
  { clave: '603', descripcion: '603 - Personas Morales con Fines no Lucrativos' },
  { clave: '605', descripcion: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '621', descripcion: '621 - Incorporación Fiscal (RIF)' },
  { clave: '625', descripcion: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' }
];

export const USOS_CFDI = [
  { clave: 'G01', descripcion: 'G01 - Adquisición de mercancías' },
  { clave: 'G03', descripcion: 'G03 - Gastos en general' },
  { clave: 'S01', descripcion: 'S01 - Sin efectos fiscales' },
  { clave: 'CP01', descripcion: 'CP01 - Pagos' }
];
