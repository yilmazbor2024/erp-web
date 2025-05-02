export interface CustomerAddress {
  addressId?: string;
  addressTypeCode: string;
  addressType?: string;
  address: string;
  city: string;
  cityCode?: string;
  district: string;
  districtCode?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  [key: string]: any;
}

export interface CustomerCommunication {
  communicationId?: string;
  communicationTypeCode: string;
  communicationType?: string;
  communication: string;
  isDefault: boolean;
  isBlocked: boolean;
}

export interface CustomerContact {
  contactId?: string;
  contactName: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  isDefault: boolean;
}

export interface Customer {
  customerCode: string;
  customerName: string;
  customerTypeCode: number;
  customerTypeDescription?: string;
  cityDescription?: string;
  districtDescription?: string;
  isActive: boolean;
  isBlocked: boolean;
  isRealPerson?: boolean;
  identityNum?: string;
  taxNumber?: string;
  taxOffice?: string;
  taxOfficeCode?: string;
  creditLimit?: number;
  paymentTerm?: number;
  currencyCode?: string;
  balance?: number;
  debit?: number;
  credit?: number;
  openRisk?: number;
  totalRisk?: number;
  eInvoiceEnabled?: boolean;
  eArchiveEnabled?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  addresses?: CustomerAddress[];
  communications?: CustomerCommunication[];
  contacts?: CustomerContact[];
}