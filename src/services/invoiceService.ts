import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface InvoiceListParams {
  pageSize?: number;
  pageNumber?: number;
  sortBy?: string;
  sortDirection?: string;
  customerCode?: string;
  invoiceNumber?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: 'purchase' | 'sales' | 'all';
}

interface InvoiceLineRequest {
  itemCode: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  description?: string;
}

interface InvoiceCreateRequest {
  customerCode: string;
  invoiceDate: Date;
  invoiceTime?: Date;
  officeCode: string;
  paymentPlanCode: string;
  description1?: string;
  description2?: string;
  description3?: string;
  description4?: string;
  lines: InvoiceLineRequest[];
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const invoiceService = {
  getInvoices: async (params: InvoiceListParams = {}) => {
    try {
      const response = await apiClient.get('/api/v1/SalesInvoice', { params });
      
      if (!response.data) {
        return { 
          success: true,
          data: {
            invoices: [],
            totalCount: 0,
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      if ((error as any).response) {
        console.error('API response error:', (error as any).response.status, (error as any).response.data);
      }
      throw error;
    }
  },

  getInvoiceById: async (invoiceId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/SalesInvoice/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  createInvoice: async (invoice: InvoiceCreateRequest) => {
    try {
      const response = await apiClient.post('/api/v1/SalesInvoice/invoices', invoice);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  cancelInvoice: async (invoiceId: string) => {
    try {
      const response = await apiClient.patch(`/api/v1/SalesInvoice/invoices/${invoiceId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error cancelling invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  getPaymentPlans: async (forCreditCardPlan?: boolean, isBlocked: boolean = false) => {
    try {
      const params = { forCreditCardPlan, isBlocked };
      const response = await apiClient.get('/api/v1/SalesInvoice/payment-plans', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      throw error;
    }
  },

  getAttributeTypes: async (isBlocked: boolean = false) => {
    try {
      const response = await apiClient.get('/api/v1/SalesInvoice/attribute-types', { 
        params: { isBlocked } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching attribute types:', error);
      throw error;
    }
  },

  getAttributes: async (attributeTypeCode: string, isBlocked: boolean = false) => {
    try {
      const response = await apiClient.get(`/api/v1/SalesInvoice/attribute-types/${attributeTypeCode}/attributes`, {
        params: { isBlocked }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching attributes for type ${attributeTypeCode}:`, error);
      throw error;
    }
  },

  getOffices: async (isBlocked: boolean = false) => {
    try {
      const response = await apiClient.get('/api/v1/SalesInvoice/offices', {
        params: { isBlocked }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching offices:', error);
      throw error;
    }
  },

  getItemDimensionTypes: async (isBlocked: boolean = false) => {
    try {
      const response = await apiClient.get('/api/v1/SalesInvoice/item-dimension-types', {
        params: { isBlocked }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching item dimension types:', error);
      throw error;
    }
  },

  getInvoiceDebits: async (invoiceId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/SalesInvoice/invoices/${invoiceId}/debits`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching debits for invoice ${invoiceId}:`, error);
      throw error;
    }
  }
}; 