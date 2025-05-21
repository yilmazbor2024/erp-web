export interface Vendor {
  currAccCode: string;
  currAccDescription: string;
  taxNumber?: string;
  taxOffice?: string;
  country?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  addresses?: VendorAddress[];
  communications?: VendorCommunication[];
  contacts?: VendorContact[];
}

export interface VendorAddress {
  addressType?: string;
  address?: string;
  country?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  taxNumber?: string;
  taxOffice?: string;
  isDefault?: boolean;
}

export interface VendorCommunication {
  communicationType?: string;
  commAddress?: string;
  isDefault?: boolean;
}

export interface VendorContact {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
}

export interface VendorFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  currAccTypeCode?: string;
}
