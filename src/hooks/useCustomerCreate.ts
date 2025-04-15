import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/api';

interface CustomerCreateRequest {
  customerCode: string;
  customerName: string;
  customerSurname: string;
  customerTitle: string;
  taxNumber: string;
  customerIdentityNumber: string;
  customerTypeCode: number;
  discountGroupCode: string;
  paymentPlanGroupCode: string;
  currencyCode: string;
  officeCode: string;
  salesmanCode: string;
  creditLimit: number;
  riskLimit: number;
  contacts: {
    contactTypeCode: string;
    contact: string;
    isDefault: boolean;
  }[];
  addresses: {
    addressTypeCode: string;
    address: string;
    countryCode: string;
    stateCode: string;
    cityCode: string;
    districtCode: string;
    postalCode: string;
    isDefault: boolean;
    isBlocked: boolean;
  }[];
  taxOffice: string;
  regionCode: string;
  cityCode: string;
  districtCode: string;
  isBlocked: boolean;
  communications: {
    communicationTypeCode: string;
    communication: string;
    isDefault: boolean;
  }[];
}

const useCustomerCreate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerData: any) => {
      return customerApi.createCustomer(customerData);
    },
    onSuccess: () => {
      // Müşteri listesi sorgusunu invalidate et
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

export default useCustomerCreate; 