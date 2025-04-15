export interface AddressResponse {
  addressId: string;
  customerCode: string;
  addressTypeCode: string;
  addressTypeName: string;
  address: string;
  countryCode: string;
  countryName?: string;
  stateCode: string;
  stateName?: string;
  cityCode: string;
  cityName?: string;
  districtCode: string;
  districtName?: string;
  postalCode: string;
  isDefault: boolean;
  isBlocked: boolean;
  createdDate?: string;
  createdUserName?: string;
  lastUpdatedDate?: string;
  lastUpdatedUserName?: string;
}

export interface AddressCreateRequest {
  addressTypeCode: string;
  address: string;
  city: string;
  district: string;
  country: string;
  postalCode: string;
  countryCode: string;
  stateCode: string;
  cityCode: string;
  districtCode: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface AddressTypeResponse {
  addressTypeCode: string;
  addressTypeDescription: string;
  isRequired?: boolean;
  isBlocked?: boolean;
} 