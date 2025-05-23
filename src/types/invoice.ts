// Fatura tipleri
export enum InvoiceType {
  WHOLESALE_SALES = 'WS',
  WHOLESALE_PURCHASE = 'BP',
  EXPENSE_SALES = 'EXP',
  EXPENSE_PURCHASE = 'EP'
}

// Fatura durumları
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  CANCELED = 'CANCELED'
}

// Fatura detay tipi
export interface InvoiceDetail {
  id?: string;
  itemCode: string;
  unitOfMeasureCode: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discountRate?: number;
  description?: string;
}

// Fatura tipi
export interface Invoice {
  id?: string;
  invoiceNumber: string;
  invoiceTypeCode: string;
  invoiceDate: string;
  currAccTypeCode: number;
  docCurrencyCode: string;
  companyCode: string;
  warehouseCode: string;
  customerCode: string;
  isReturn?: boolean;
  isEInvoice?: boolean;
  invoiceTime?: string;
  officeCode?: string;
  details: InvoiceDetail[];
}
