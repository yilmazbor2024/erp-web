export interface Customer {
  customerCode: string;
  customerName: string;
  customerTypeCode: number;
  customerTypeDescription: string;
  cityDescription: string;
  districtDescription: string;
  isVIP: boolean;
  isBlocked: boolean;
  createdDate: string;
  createdUsername: string;
  currencyCode: string;
  promotionGroupDescription: string;
  companyCode: string;
  officeCode: string;
  officeDescription: string;
  officeCountryCode: string;
  identityNum: string;
  taxNumber: string;
  vendorCode: string;
  isSubjectToEInvoice: boolean;
  useDBSIntegration: boolean;
} 