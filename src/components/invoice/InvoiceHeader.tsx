import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Form, Input, DatePicker, Select, Row, Col, Typography, Button, Spin, Divider, message, Radio, Switch, Tooltip, Space, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RadioChangeEvent } from 'antd';
import { shipmentApi } from '../../services/api';
import { customerService } from '../../services/customerService';
import { exchangeRateService } from '../../services/exchangeRateService';
import { TaxType } from '../../services/taxApi';

const { Option } = Select;
const { Text, Title } = Typography;

// Fatura tipi enum - InvoiceForm ile aynı olmalı
enum InvoiceType {
  WHOLESALE_SALES = 'WS',
  WHOLESALE_PURCHASE = 'BP',
  EXPENSE_SALES = 'EXP',
  EXPENSE_PURCHASE = 'EP'
}

interface InvoiceHeaderProps {
  form: any;
  customers: any[];
  vendors: any[];
  offices: any[];
  warehouses: any[];
  currencies: any[];
  loadingCurrencies: boolean;
  isReturn: boolean;
  setIsReturn: (value: boolean) => void;
  isEInvoice: boolean;
  setIsEInvoice: (value: boolean) => void;
  onCurrencyChange?: (currencyCode: string) => void;
  onExchangeRateChange?: (rate: number) => void;
  onExchangeRateSourceChange?: (e: RadioChangeEvent) => void;
  onTaxTypeChange?: (taxTypeMode: string) => void;
  invoiceType: InvoiceType;
  taxTypes?: TaxType[];
  loadingTaxTypes?: boolean;
}

interface CustomerAddress {
  postalAddressId: string;
  addressName: string;
  address1: string;
  address2?: string;
  cityName?: string;
  countryName?: string;
  isDefault?: boolean;
  isDefaultShippingAddress?: boolean;
  isDefaultBillingAddress?: boolean;
}

// Sevkiyat yöntemi arayüzü - API'den gelen veri yapısına uygun
interface ShipmentMethod {
  shipmentMethodCode: string;
  shipmentMethodName?: string;
  shipmentMethodDescription?: string;
  description?: string;
  transportModeCode?: string;
  transportModeDescription?: string;
  isBlocked: boolean;
  isDefault?: boolean;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  form,
  customers,
  vendors,
  offices,
  warehouses,
  currencies,
  loadingCurrencies,
  isReturn,
  setIsReturn,
  isEInvoice,
  setIsEInvoice,
  onCurrencyChange,
  onExchangeRateChange,
  onExchangeRateSourceChange,
  onTaxTypeChange,
  invoiceType,
  taxTypes = [],
  loadingTaxTypes = false
}) => {
  // State tanımlamaları
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [vendorAddresses, setVendorAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(false);
  const [shipmentMethods, setShipmentMethods] = useState<ShipmentMethod[]>([]);
  const [loadingShipmentMethods, setLoadingShipmentMethods] = useState<boolean>(false);
  const [isCustomerCurrency, setIsCustomerCurrency] = useState<boolean>(false);
  const [isVendorCurrency, setIsVendorCurrency] = useState<boolean>(false);
  const [exchangeRateDisabled, setExchangeRateDisabled] = useState<boolean>(true);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [exchangeRateSource, setExchangeRateSource] = useState<string>('TCMB'); // TCMB varsayılan olarak seçili

  // Sevkiyat yöntemlerini getir
  const fetchShipmentMethods = async () => {
    setLoadingShipmentMethods(true);
    try {
      const response = await shipmentApi.getShipmentMethods();
      if (response && response.data) {
        setShipmentMethods(response.data);
        console.log('Sevkiyat yöntemleri yüklendi:', response.data);
        
        // Varsayılan olarak hiçbir sevkiyat yöntemi seçilmeyecek
        // Kullanıcının manuel olarak seçmesi gerekiyor
        form.setFieldsValue({ shipmentMethodCode: '' });
      }
    } catch (error) {
      console.error('Sevkiyat yöntemleri alınırken hata oluştu:', error);
      message.error('Sevkiyat yöntemleri alınırken hata oluştu');
    } finally {
      setLoadingShipmentMethods(false);
    }
  };

  // Bileşen yüklendiğinde sevkiyat yöntemlerini getir
  useEffect(() => {
    fetchShipmentMethods();
  }, []);
  
  // Vergi tiplerini izle ve "Vergisiz" seçeneğini varsayılan olarak ayarla
  useEffect(() => {
    if (taxTypes?.length > 0) {
      // "Vergisiz" vergi tipini bul
      const taxFreeType = taxTypes.find(tax => 
        tax.taxTypeDescription?.toLowerCase() === 'vergisiz' || 
        tax.taxTypeCode?.toLowerCase() === 'vergisiz'
      );
      
      // Eğer "Vergisiz" vergi tipi varsa, onu varsayılan olarak ayarla
      if (taxFreeType) {
        form.setFieldsValue({ taxTypeCode: taxFreeType.taxTypeCode });
        console.log('Varsayılan vergi tipi ayarlandı:', taxFreeType.taxTypeCode);
        // Varsayılan olarak "Vergisiz" seçildiğinde KDV oranlarını sıfırla
        handleTaxTypeChange(taxFreeType.taxTypeCode);
      }
    }
  }, [taxTypes]);
  
  // Vergi tipi değiştiğinde çalışacak fonksiyon
  const handleTaxTypeChange = (taxTypeCode: string) => {
    console.log('Vergi tipi değişti:', taxTypeCode);
    
    // Seçilen vergi tipini bul
    const selectedTaxType = taxTypes?.find(tax => tax.taxTypeCode === taxTypeCode);
    
    // Eğer "Vergisiz" seçildiyse tüm fatura satırlarındaki KDV oranını 0 yap
  // Kesin kontrol: TaxTypeCode = 4 ve bsTaxTypeDesc = "Vergisiz"
  if (selectedTaxType && 
      (selectedTaxType.taxTypeCode === '4' || 
       selectedTaxType.taxTypeDescription === 'Vergisiz')) {
      
      console.log('Vergisiz seçildi, tüm KDV oranları 0 olarak ayarlanıyor');
      
      // InvoiceForm bileşeninden gelen onTaxTypeChange fonksiyonunu çağır
      if (onTaxTypeChange) {
        onTaxTypeChange('vergisiz');
      }
    } else {
      // Başka bir vergi tipi seçildiyse, normal KDV oranlarını kullan
      if (onTaxTypeChange) {
        onTaxTypeChange('normal');
      }
    }
  };

  // Müşteri adreslerini getir
  const fetchCustomerAddresses = async (customerId: string) => {
    if (!customerId) {
      console.log('Müşteri kodu boş, adresler getirilmiyor');
      return;
    }
    
    setLoadingAddresses(true);
    try {
      const response = await customerService.getCustomerAddresses(customerId);
      console.log('Müşteri adresleri API yanıtı:', response);
      
      let addresses: CustomerAddress[] = [];
      
      if (response && response.data && response.data.length > 0) {
        addresses = response.data.map((addr: any) => ({
          postalAddressId: addr.postalAddressId,
          addressName: addr.addressTypeDescription || 'Adres',
          address1: addr.address || '',
          cityName: addr.cityDescription,
          countryName: addr.countryDescription,
          isDefault: addr.isDefault,
          isDefaultBillingAddress: addr.isDefaultBillingAddress,
          isDefaultShippingAddress: addr.isDefaultShippingAddress
        }));
        console.log('API yanıtından dönüştürülen adresler:', addresses);
      } else {
        console.log('API yanıtında adres bulunamadı, müşteri detaylarını kontrol ediyorum...');
        
        // API yanıtında adres yoksa, müşteri detaylarından adresleri almayı dene
        try {
          const customerResponse = await customerService.getCustomerByCode(customerId);
          console.log('Müşteri detayları alındı:', customerResponse);
          
          // Müşteri detaylarında adresler varsa onları kullan
          if (customerResponse && customerResponse.addresses && customerResponse.addresses.length > 0) {
            addresses = customerResponse.addresses.map((addr: any) => ({
              postalAddressId: addr.postalAddressId,
              addressName: addr.addressTypeDescription || 'Adres',
              address1: addr.address || '',
              cityName: addr.cityDescription,
              countryName: addr.countryDescription,
              isDefault: addr.isDefault,
              isDefaultBillingAddress: addr.isDefaultBillingAddress,
              isDefaultShippingAddress: addr.isDefaultShippingAddress
            }));
            console.log('Müşteri detaylarından alınan adresler:', addresses);
          } else {
            console.log('Müşteri detaylarında da adres bulunamadı');
          }
        } catch (detailError) {
          console.error('Müşteri detayları getirme hatası:', detailError);
        }
      }
      
      // Bulunan adresleri state'e kaydet
      if (addresses.length > 0) {
        console.log('Müşteri adresleri başarıyla alındı:', addresses);
        setCustomerAddresses(addresses);
        
        // Varsayılan fatura adresi
        const defaultBillingAddress = addresses.find((address: CustomerAddress) => 
          address.isDefaultBillingAddress || address.isDefault
        );
        
        // Varsayılan teslimat adresi
        const defaultShippingAddress = addresses.find((address: CustomerAddress) => 
          address.isDefaultShippingAddress || address.isDefault
        );
        
        console.log('Varsayılan fatura adresi:', defaultBillingAddress);
        console.log('Varsayılan teslimat adresi:', defaultShippingAddress);
        
        // Form alanlarını güncelle
        const formUpdate: any = {};
        
        // Müşteri kodunu currAccCode alanına set et
        formUpdate.currAccCode = customerId;
        
        // Fatura adresi seçimi
        if (defaultBillingAddress) {
          formUpdate.billingPostalAddressID = defaultBillingAddress.postalAddressId;
          console.log('Varsayılan fatura adresi seçildi:', defaultBillingAddress.postalAddressId);
        } else if (addresses.length === 1) {
          formUpdate.billingPostalAddressID = addresses[0].postalAddressId;
          console.log('Tek adres olduğu için fatura adresi olarak seçildi:', addresses[0].postalAddressId);
        } else if (addresses.length > 1) {
          // Birden fazla adres varsa ve varsayılan yoksa, ilk adresi seç
          formUpdate.billingPostalAddressID = addresses[0].postalAddressId;
          console.log('Varsayılan fatura adresi bulunamadı, ilk adres seçildi:', addresses[0].postalAddressId);
        }
        
        // Teslimat adresi seçimi
        if (defaultShippingAddress) {
          formUpdate.shippingPostalAddressID = defaultShippingAddress.postalAddressId;
          console.log('Varsayılan teslimat adresi seçildi:', defaultShippingAddress.postalAddressId);
        } else if (addresses.length === 1) {
          formUpdate.shippingPostalAddressID = addresses[0].postalAddressId;
          console.log('Tek adres olduğu için teslimat adresi olarak seçildi:', addresses[0].postalAddressId);
        } else if (addresses.length > 1) {
          // Birden fazla adres varsa ve varsayılan yoksa, ilk adresi seç
          formUpdate.shippingPostalAddressID = addresses[0].postalAddressId;
          console.log('Varsayılan teslimat adresi bulunamadı, ilk adres seçildi:', addresses[0].postalAddressId);
        }
        
        if (Object.keys(formUpdate).length > 0) {
          console.log('Form alanları güncelleniyor:', formUpdate);
          form.setFieldsValue(formUpdate);
          
          // Form alanlarının güncel değerlerini kontrol et
          setTimeout(() => {
            const currentValues = form.getFieldsValue(['billingPostalAddressID', 'shippingPostalAddressID', 'currAccCode']);
            console.log('Form alanlarının güncel değerleri:', currentValues);
            
            // Eğer adres alanları boşsa, tekrar dene
            if (!currentValues.billingPostalAddressID || !currentValues.shippingPostalAddressID) {
              console.log('Adres alanları boş, tekrar ayarlanıyor...');
              form.setFieldsValue(formUpdate);
            }
          }, 200);
        }
      } else {
        console.log('Müşteri adresleri bulunamadı');
        setCustomerAddresses([]);
      }
    } catch (error) {
      console.error('Müşteri adresleri alınırken hata oluştu:', error);
      message.error('Müşteri adresleri alınırken hata oluştu');
      setCustomerAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Tedarikçi adreslerini getir
  const fetchVendorAddresses = async (vendorId: string) => {
    if (!vendorId) {
      console.log('Tedarikçi kodu boş, adresler getirilmiyor');
      return;
    }
    
    setLoadingAddresses(true);
    try {
      console.log('Tedarikçi adresleri getiriliyor:', vendorId);
      // Tedarikçi adreslerini getirmek için API çağrısı
      const response = await customerService.getCustomerAddresses(vendorId);
      console.log('Tedarikçi adresleri API yanıtı:', response);
      
      let addresses: CustomerAddress[] = [];
      
      if (response && response.data && response.data.length > 0) {
        addresses = response.data.map((addr: any) => ({
          postalAddressId: addr.postalAddressId,
          addressName: addr.addressTypeDescription || 'Adres',
          address1: addr.address || '',
          cityName: addr.cityDescription,
          countryName: addr.countryDescription,
          isDefault: addr.isDefault,
          isDefaultBillingAddress: addr.isDefaultBillingAddress,
          isDefaultShippingAddress: addr.isDefaultShippingAddress
        }));
        console.log('API yanıtından dönüştürülen tedarikçi adresleri:', addresses);
      } else {
        console.log('API yanıtında tedarikçi adresi bulunamadı');
      }
      
      if (addresses.length > 0) {
        setVendorAddresses(addresses);
        setCustomerAddresses(addresses); // Aynı adres seçicileri kullanıldığı için
        
        // Varsayılan fatura adresi
        const defaultBillingAddress = addresses.find((address: CustomerAddress) => 
          address.isDefaultBillingAddress || address.isDefault
        );
        
        // Varsayılan teslimat adresi
        const defaultShippingAddress = addresses.find((address: CustomerAddress) => 
          address.isDefaultShippingAddress || address.isDefault
        );
        
        console.log('Varsayılan fatura adresi:', defaultBillingAddress);
        console.log('Varsayılan teslimat adresi:', defaultShippingAddress);
        
        // Form alanlarını güncelle
        const formUpdate: any = {};
        
        // Tedarikçi kodunu currAccCode alanına ekle
        formUpdate.currAccCode = vendorId;
        
        // Fatura adresi seçimi
        if (defaultBillingAddress) {
          formUpdate.billingPostalAddressID = defaultBillingAddress.postalAddressId;
          console.log('Varsayılan fatura adresi seçildi:', defaultBillingAddress.postalAddressId);
        } else if (addresses.length === 1) {
          formUpdate.billingPostalAddressID = addresses[0].postalAddressId;
          console.log('Tek adres olduğu için fatura adresi olarak seçildi:', addresses[0].postalAddressId);
        } else if (addresses.length > 1) {
          // Birden fazla adres varsa ve varsayılan yoksa, ilk adresi seç
          formUpdate.billingPostalAddressID = addresses[0].postalAddressId;
          console.log('Varsayılan fatura adresi bulunamadı, ilk adres seçildi:', addresses[0].postalAddressId);
        }
        
        // Teslimat adresi seçimi
        if (defaultShippingAddress) {
          formUpdate.shippingPostalAddressID = defaultShippingAddress.postalAddressId;
          console.log('Varsayılan teslimat adresi seçildi:', defaultShippingAddress.postalAddressId);
        } else if (addresses.length === 1) {
          formUpdate.shippingPostalAddressID = addresses[0].postalAddressId;
          console.log('Tek adres olduğu için teslimat adresi olarak seçildi:', addresses[0].postalAddressId);
        } else if (addresses.length > 1) {
          // Birden fazla adres varsa ve varsayılan yoksa, ilk adresi seç
          formUpdate.shippingPostalAddressID = addresses[0].postalAddressId;
          console.log('Varsayılan teslimat adresi bulunamadı, ilk adres seçildi:', addresses[0].postalAddressId);
        }
        
        // Form alanlarını güncelle
        if (Object.keys(formUpdate).length > 0) {
          console.log('Form alanları güncelleniyor:', formUpdate);
          form.setFieldsValue(formUpdate);
          
          // Form alanlarının güncel değerlerini kontrol et
          setTimeout(() => {
            const currentValues = form.getFieldsValue(['billingPostalAddressID', 'shippingPostalAddressID', 'currAccCode']);
            console.log('Form alanlarının güncel değerleri:', currentValues);
            
            // Eğer adres alanları boşsa, tekrar dene
            if (!currentValues.billingPostalAddressID || !currentValues.shippingPostalAddressID) {
              console.log('Adres alanları boş, tekrar ayarlanıyor...');
              form.setFieldsValue(formUpdate);
              
              // Bir kez daha kontrol et
              setTimeout(() => {
                const finalValues = form.getFieldsValue(['billingPostalAddressID', 'shippingPostalAddressID']);
                console.log('Son form alanları değerleri:', finalValues);
              }, 200);
            }
          }, 200);
        }
      } else {
        setVendorAddresses([]);
        setCustomerAddresses([]);
        message.warning('Tedarikçi için kayıtlı adres bulunamadı.');
      }
    } catch (error) {
      console.error('Tedarikçi adresleri alınırken hata oluştu:', error);
      message.error('Tedarikçi adresleri alınırken hata oluştu');
      setVendorAddresses([]);
      setCustomerAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Döviz kurunu getir
  const fetchExchangeRate = async (currencyCodeParam?: string) => {
    const currencyCode = currencyCodeParam || form.getFieldValue('currencyCode');
    const invoiceDate = form.getFieldValue('invoiceDate');
    const source = form.getFieldValue('exchangeRateSource') || exchangeRateSource;
    
    if (!currencyCode || !invoiceDate) {
      console.log('Para birimi veya tarih eksik, döviz kuru alınamıyor');
      return;
    }
    
    // TRY için kur her zaman 1'dir
    if (currencyCode === 'TRY') {
      setExchangeRate(1);
      form.setFieldsValue({ exchangeRate: 1 });
      if (onExchangeRateChange) onExchangeRateChange(1);
      return;
    }
    
    // Manuel kaynak seçilmişse, kullanıcının kuru girmesine izin ver
    if (source === 'MANUEL') {
      setExchangeRateDisabled(false);
      return;
    }
    
    // Otomatik kaynak seçilmişse, API'den kur bilgisini al
    setExchangeRateDisabled(true);
    
    try {
      console.log(`Döviz kuru alınıyor: ${currencyCode}, Tarih: ${invoiceDate.format('YYYY-MM-DD')}, Kaynak: ${source}`);
      
      // Döviz kuru API'sini çağır - kaynak değerini API beklentisine göre dönüştür
      let apiSource = 'central_bank';
      if (source === 'SERBEST_PIYASA') {
        apiSource = 'free_market';
      } else if (source === 'MANUEL') {
        apiSource = 'manual';
      }
      
      const response = await exchangeRateService.getExchangeRate(
        currencyCode,
        invoiceDate.format('YYYY-MM-DD'),
        apiSource
      );
      
      if (response && response.exchangeRate) {
        const rate = parseFloat(response.exchangeRate);
        setExchangeRate(rate);
        form.setFieldsValue({ exchangeRate: rate });
        if (onExchangeRateChange) onExchangeRateChange(rate);
      } else {
        message.warning(`${currencyCode} için döviz kuru bulunamadı.`);
        setExchangeRate(0);
        form.setFieldsValue({ exchangeRate: 0 });
        if (onExchangeRateChange) onExchangeRateChange(0);
      }
    } catch (error) {
      console.error('Döviz kuru alınırken hata oluştu:', error);
      message.error('Döviz kuru alınırken hata oluştu');
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
    }
  };

  // Para birimi değiştiğinde
  const handleCurrencyChange = (value: string) => {
    // Müşteri para birimi kontrolü
    const customerId = form.getFieldValue('customerId');
    const vendorId = form.getFieldValue('vendorId');
    
    if (customerId && customers) {
      const customer = customers.find(c => c.customerCode === customerId);
      if (customer && customer.currencyCode === value) {
        setIsCustomerCurrency(true);
      } else {
        setIsCustomerCurrency(false);
      }
    } else if (vendorId && vendors) {
      const vendor = vendors.find(v => v.vendorCode === vendorId);
      if (vendor && vendor.currencyCode === value) {
        setIsCustomerCurrency(true);
      } else {
        setIsCustomerCurrency(false);
      }
    }
    
    // Döviz kurunu getir
    fetchExchangeRate(value);
    
    // Callback fonksiyonu çağır
    if (onCurrencyChange) onCurrencyChange(value);
  };

  // Döviz kuru kaynağı değiştiğinde
  const handleExchangeRateSourceChange = (e: RadioChangeEvent) => {
    const source = e.target.value;
    setExchangeRateSource(source);
    
    // Manuel kaynak seçilmişse, kullanıcının kuru girmesine izin ver
    if (source === 'MANUEL') {
      setExchangeRateDisabled(false);
    } else {
      // Otomatik kaynak seçilmişse, API'den kur bilgisini al
      setExchangeRateDisabled(true);
      fetchExchangeRate();
    }
    
    // Callback fonksiyonu çağır
    if (onExchangeRateSourceChange) onExchangeRateSourceChange(e);
  };

  // Tarih değiştiğinde döviz kurunu güncelle
  const handleDateChange = (date: any) => {
    if (!date) return;
    
    const currencyCode = form.getFieldValue('currencyCode');
    if (currencyCode) {
      fetchExchangeRate();
    }
  };

  // Müşteri/Tedarikçi değiştiğinde
  useEffect(() => {
    // Form değerlerini izle
    const customerId = form.getFieldValue('customerId');
    const vendorId = form.getFieldValue('vendorId');
    
    // Müşteri veya tedarikçi seçilmişse adreslerini getir
    if (customerId && (invoiceType === InvoiceType.WHOLESALE_SALES || invoiceType === InvoiceType.EXPENSE_SALES)) {
      fetchCustomerAddresses(customerId);
      
      // Müşteri para birimi kontrolü
      if (customers) {
        const customer = customers.find(c => c.customerCode === customerId);
        if (customer && customer.currencyCode) {
          // Müşterinin para birimi varsa, onu seç
          form.setFieldsValue({ currencyCode: customer.currencyCode });
          setIsCustomerCurrency(true);
          
          // Döviz kurunu getir
          fetchExchangeRate(customer.currencyCode);
        } else {
          setIsCustomerCurrency(false);
        }
      }
    } else if (vendorId && (invoiceType === InvoiceType.WHOLESALE_PURCHASE || invoiceType === InvoiceType.EXPENSE_PURCHASE)) {
      fetchVendorAddresses(vendorId);
      
      // Tedarikçi para birimi kontrolü
      if (vendors) {
        const vendor = vendors.find(v => v.vendorCode === vendorId);
        if (vendor && vendor.currencyCode) {
          // Tedarikçinin para birimi varsa, onu seç
          form.setFieldsValue({ currencyCode: vendor.currencyCode });
          setIsCustomerCurrency(true);
          
          // Döviz kurunu getir
          fetchExchangeRate(vendor.currencyCode);
        } else {
          setIsCustomerCurrency(false);
        }
      }
    }
    
    // Tarih ve para birimi varsa döviz kurunu getir
    const currencyCode = form.getFieldValue('currencyCode');
    const date = form.getFieldValue('invoiceDate');
    if (currencyCode && date) {
      fetchExchangeRate(currencyCode);
    }
  }, []);

  // useEffect ile form başlangıç değerlerini ayarla
  // Component mount olduğunda form başlangıç değerlerini ayarla
  useEffect(() => {
    if (form) {
      // Form başlangıç değerlerini ayarla
      form.setFieldsValue({
        exchangeRateSource: 'TCMB', // TCMB varsayılan olarak seçili
        invoiceDate: dayjs() // Bugünün tarihi
      });
    }
  }, [form]);
  
  return (
    <>
      
      <Row gutter={24}>
        <Col span={24}>
          <Title level={5}>Fatura Bilgileri</Title>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="invoiceDate"
            label="Fatura Tarihi"
            rules={[{ required: true, message: 'Lütfen fatura tarihini seçin' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD.MM.YYYY" 
              placeholder="Tarih seçin"
              onChange={handleDateChange}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="invoiceNumber"
            label="Fatura Numarası"
            tooltip="Fatura numarası sistem tarafından otomatik oluşturulacak"
          >
            <Input 
              placeholder="WS-7-XXXX" 
              disabled 
              style={{ backgroundColor: '#f5f5f5' }} 
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="currencyCode"
            label="Para Birimi"
            rules={[{ required: true, message: 'Lütfen para birimini seçin' }]}
          >
            <Select
              showSearch
              placeholder="Para birimi seçin"
              optionFilterProp="children"
              onChange={handleCurrencyChange}
              loading={loadingCurrencies}
              filterOption={(input, option) => {
                // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                if (!input || !option) return true;
                
                // Option label veya children'dan arama metni oluştur
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {currencies?.length > 0 ? 
                currencies.map((currency, index) => {
                  // TRY için varsayılan ve koyu stil
                  const isTRY = currency.code === 'TRY' || currency.currencyCode === 'TRY';
                  const style = isTRY ? { fontWeight: 'bold' } : {};
                  
                  // Kod ve açıklama için uygun alanları kullan
                  const code = currency.code || currency.currencyCode;
                  const name = currency.name || currency.description || currency.currencyDescription || currency.currencyName;
                  
                  return (
                    <Option 
                      key={code || `currency-${index}`} 
                      value={code}
                      style={style}
                    >
                      {code} - {name}
                    </Option>
                  );
                }) : 
                <Option disabled value="">Para birimi listesi yüklenemedi</Option>
              }
            </Select>
          </Form.Item>
          {isCustomerCurrency && (
            <Text type="secondary" style={{ marginTop: -16, display: 'block' }}>
              Müşteri Para Birimi seçili
            </Text>
          )}
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="exchangeRateSource"
            label="Döviz Kuru Kaynağı"
          >
            <Radio.Group 
              onChange={handleExchangeRateSourceChange}
              optionType="button"
              buttonStyle="solid"
              size="small"
              style={{ textAlign: 'left' }}
            >
              <Radio.Button value="TCMB">TCMB</Radio.Button>
              <Radio.Button value="SERBEST_PIYASA">S.PİYASA</Radio.Button>
              <Radio.Button value="MANUEL">Manuel</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="exchangeRate"
            label="Döviz Kuru"
            rules={[{ required: true, message: 'Döviz kuru gerekli' }]}
          >
            <Input 
              type="number" 
              step="0.0001" 
              min="0" 
              disabled={exchangeRateDisabled} 
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && onExchangeRateChange) {
                  onExchangeRateChange(value);
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="officeCode"
            label="Ofis"
            rules={[{ required: true, message: 'Lütfen ofis seçin' }]}
          >
            <Select
              showSearch
              placeholder="Ofis seçin"
              optionFilterProp="children"
              filterOption={(input, option) => {
                // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                if (!input || !option) return true;
                
                // Option label veya children'dan arama metni oluştur
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {offices?.length > 0 ? 
                offices.map((office, index) => (
                  <Option key={index} value={office.officeCode}>
                    {office.officeName}
                  </Option>
                )) : 
                <Option disabled value="">Ofis listesi yüklenemedi</Option>
              }
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="warehouseCode"
            label="Depo"
            rules={[{ required: true, message: 'Lütfen depo seçin' }]}
          >
            <Select
              showSearch
              placeholder="Depo seçin"
              optionFilterProp="children"
              filterOption={(input, option) => {
                // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                if (!input || !option) return true;
                
                // Option label veya children'dan arama metni oluştur
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {warehouses?.length > 0 ? 
                warehouses.map((warehouse, index) => (
                  <Option key={index} value={warehouse.warehouseCode}>
                    {warehouse.warehouseName}
                  </Option>
                )) : 
                <Option disabled value="">Depo listesi yüklenemedi</Option>
              }
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={24}>
          <Divider orientation="left">Müşteri/Tedarikçi Bilgileri</Divider>
        </Col>
      </Row>

      <Row gutter={24}>
        {(invoiceType === InvoiceType.WHOLESALE_SALES || invoiceType === InvoiceType.EXPENSE_SALES) && (
          <Col xs={24} sm={12}>
            <Form.Item
              name="currAccCode"
              label="Müşteri"
              rules={[{ required: true, message: 'Lütfen müşteri seçin' }]}
            >
              <Select
                showSearch
                placeholder="Müşteri seçin"
                optionFilterProp="children"
                filterOption={(input, option) => {
                  // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                  if (!input || !option) return true;
                  
                  // Option label veya children'dan arama metni oluştur
                  let searchText = '';
                  if (option.label) {
                    searchText = option.label.toString();
                  } else if (option.children) {
                    try {
                      searchText = option.children.toString();
                    } catch (e) {
                      searchText = '';
                    }
                  }
                  
                  return searchText.toLowerCase().includes(input.toLowerCase());
                }}
                onChange={(value) => {
                  if (!value) return;
                  
                  console.log('Seçilen müşteri kodu:', value);
                  
                  // Form alanını güncelle (artık currAccCode olarak)
                  form.setFieldsValue({ currAccCode: value });
                  
                  // Müşteri adreslerini getir
                  fetchCustomerAddresses(value as string);
                  
                  // Müşteri para birimi kontrolü
                  if (customers) {
                    const customer = customers.find(c => c.customerCode === value);
                    if (customer && customer.currencyCode) {
                      // Müşterinin para birimi varsa, onu seç
                      form.setFieldsValue({ currencyCode: customer.currencyCode });
                      setIsCustomerCurrency(true);
                      
                      // Döviz kurunu getir
                      fetchExchangeRate(customer.currencyCode);
                    } else {
                      setIsCustomerCurrency(false);
                    }
                  }
                }}
              >
                {customers?.length > 0 ? 
                  customers
                    .filter(customer => customer.currAccTypeCode === 3) // Sadece müşterileri göster (CurrAccTypeCode=3)
                    .map((customer, index) => {
                      const code = customer.customerCode || customer.currAccCode || '';
                      const name = customer.customerName || customer.currAccDescription || '';
                      const displayText = `${code} - ${name}`;
                      
                      return (
                        <Option 
                          key={code || `customer-${index}`} 
                          value={code}
                          label={displayText} // Arama için etiket
                        >
                          {displayText}
                        </Option>
                      );
                    }) : 
                  <Option disabled value="">Müşteri listesi yüklenemedi</Option>
                }
              </Select>
            </Form.Item>
          </Col>
        )}

        {(invoiceType === InvoiceType.WHOLESALE_PURCHASE || invoiceType === InvoiceType.EXPENSE_PURCHASE) && (
          <Col xs={24} sm={12}>
            <Form.Item
              name="currAccCode"
              label="Tedarikçi"
              rules={[{ required: true, message: 'Lütfen tedarikçi seçin' }]}
            >
              <Select
                showSearch
                placeholder="Tedarikçi seçin"
                optionFilterProp="children"
                filterOption={(input, option) => {
                  // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                  if (!input || !option) return true;
                  
                  // Option label veya children'dan arama metni oluştur
                  let searchText = '';
                  if (option.label) {
                    searchText = option.label.toString();
                  } else if (option.children) {
                    try {
                      searchText = option.children.toString();
                    } catch (e) {
                      searchText = '';
                    }
                  }
                  
                  return searchText.toLowerCase().includes(input.toLowerCase());
                }}
                onChange={(value) => {
                  if (!value) return;
                  
                  console.log('Seçilen tedarikçi kodu:', value);
                  
                  // Form alanını güncelle (artık currAccCode olarak)
                  form.setFieldsValue({ currAccCode: value });
                  
                  // Tedarikçi adreslerini getir
                  fetchVendorAddresses(value as string);
                  
                  // Tedarikçi para birimi kontrolü
                  if (vendors) {
                    const vendor = vendors.find(v => v.vendorCode === value);
                    if (vendor && vendor.currencyCode) {
                      // Tedarikçinin para birimi varsa, onu seç
                      form.setFieldsValue({ currencyCode: vendor.currencyCode });
                      setIsVendorCurrency(true);
                      
                      // Döviz kurunu getir
                      fetchExchangeRate(vendor.currencyCode);
                    } else {
                      setIsVendorCurrency(false);
                    }
                  }
                }}
              >
                {vendors?.length > 0 ? 
                  vendors
                    .filter(vendor => vendor.currAccTypeCode === 1) // Sadece tedarikçileri göster (CurrAccTypeCode=1)
                    .map((vendor, index) => {
                      const code = vendor.vendorCode || vendor.currAccCode || '';
                      const name = vendor.vendorName || vendor.currAccDescription || '';
                      const displayText = `${code} - ${name}`;
                      
                      return (
                        <Option 
                          key={code || `vendor-${index}`} 
                          value={code}
                          label={displayText} // Arama için etiket
                        >
                          {displayText}
                        </Option>
                      );
                    }) : 
                  <Option disabled value="">Tedarikçi listesi yüklenemedi</Option>
                }
              </Select>
            </Form.Item>
          </Col>
        )}

        <Col xs={24} sm={12}>
          <Form.Item
            name="shipmentMethodCode"
            label="Sevkiyat Yöntemi"
          >
            <Select
              showSearch
              placeholder="Sevkiyat yöntemi seçin"
              optionFilterProp="children"
              loading={loadingShipmentMethods}
              onChange={(value) => {
                if (!value) return;
                console.log('Sevkiyat yöntemi seçildi:', value);
                // Seçilen değeri doğrudan form alanına ata
                form.setFieldsValue({ shipmentMethodCode: value });
                
                // Form alanının güncel değerini kontrol et
                setTimeout(() => {
                  const currentValue = form.getFieldValue('shipmentMethodCode');
                  console.log('Sevkiyat yöntemi form alanı güncel değeri:', currentValue);
                }, 100);
              }}
              filterOption={(input, option) => {
                // Hem kod hem açıklamada arama yapabilmek için
                if (!input || !option) return true;
                
                // Option label veya children'dan arama metni oluştur
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
            >
              <Option value="">Sevkiyat yöntemi seçin</Option>
              {shipmentMethods?.length > 0 ? 
                shipmentMethods.map((method, index) => (
                  <Option key={index} value={method.shipmentMethodCode}>
                    {method.shipmentMethodDescription || method.description || `${method.shipmentMethodName} (${method.shipmentMethodCode})`}
                  </Option>
                )) : 
                <Option disabled value="">Sevkiyat yöntemi bulunamadı</Option>
              }
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="shippingPostalAddressID"
            label="Teslimat Adresi"
            rules={[{ required: true, message: 'Lütfen teslimat adresi seçin!' }]}
          >
            <Select
              showSearch
              placeholder="Teslimat adresi seçin"
              optionFilterProp="children"
              loading={loadingAddresses}
              onChange={(value) => {
                if (!value) return;
                console.log('Teslimat adresi seçildi:', value);
                // Seçilen değeri doğrudan form alanına ata
                form.setFieldsValue({ shippingPostalAddressID: value });
                
                // Form alanının güncel değerini kontrol et
                setTimeout(() => {
                  const currentValue = form.getFieldValue('shippingPostalAddressID');
                  console.log('Teslimat adresi form alanı güncel değeri:', currentValue);
                }, 100);
              }}
              filterOption={(input, option) => {
                // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                if (!input || !option) return true;
                
                // Option label veya children'dan arama metni oluştur
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={loadingAddresses ? <Spin size="small" /> : null}
            >
              {customerAddresses?.length > 0 ? 
                customerAddresses.map((address, index) => (
                  <Option key={index} value={address.postalAddressId}>
                    {address.addressName ? `${address.addressName} - ` : ""}{address.address1}
                    {address.cityName && `, ${address.cityName}`}
                    {address.countryName && `, ${address.countryName}`}
                  </Option>
                )) : 
                <Option disabled value="">Adres listesi bulunamadı</Option>
              }
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            name="billingPostalAddressID"
            label="Fatura Adresi"
            rules={[{ required: true, message: 'Lütfen fatura adresi seçin!' }]}
          >
            <Select
              showSearch
              placeholder="Fatura adresi seçin"
              optionFilterProp="children"
              loading={loadingAddresses}
              onChange={(value) => {
                if (!value) return;
                console.log('Fatura adresi seçildi:', value);
                // Seçilen değeri doğrudan form alanına ata
                form.setFieldsValue({ billingPostalAddressID: value });
                
                // Form alanının güncel değerini kontrol et
                setTimeout(() => {
                  const currentValue = form.getFieldValue('billingPostalAddressID');
                  console.log('Fatura adresi form alanı güncel değeri:', currentValue);
                }, 100);
              }}
              filterOption={(input, option) => {
                // Hem müşteri kodu hem müşteri adında arama yapabilmek için
                if (!input || !option) return true;
                
                // Option label veya children'dan arama metni oluştur
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={loadingAddresses ? <Spin size="small" /> : null}
            >
              {customerAddresses?.length > 0 ? 
                customerAddresses.map((address, index) => (
                  <Option key={index} value={address.postalAddressId}>
                    {address.addressName ? `${address.addressName} - ` : ""}{address.address1}
                    {address.cityName && `, ${address.cityName}`}
                    {address.countryName && `, ${address.countryName}`}
                  </Option>
                )) : 
                <Option disabled value="">Adres listesi bulunamadı</Option>
              }
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="taxTypeCode"
            label="Vergi Tipi"
            rules={[{ required: true, message: 'Lütfen vergi tipi seçin!' }]}
          >
            <Select
              showSearch
              placeholder="Vergi tipi seçin"
              optionFilterProp="children"
              loading={loadingTaxTypes}
              onChange={(value) => handleTaxTypeChange(value)}
              filterOption={(input, option) => {
                if (!input || !option) return true;
                let searchText = '';
                if (option.label) {
                  searchText = option.label.toString();
                } else if (option.children) {
                  try {
                    searchText = option.children.toString();
                  } catch (e) {
                    searchText = '';
                  }
                }
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={loadingTaxTypes ? <Spin size="small" /> : <Empty description="Vergi tipi bulunamadı" />}
            >
              {taxTypes?.length > 0 ? 
                taxTypes.filter(tax => !tax.isBlocked).map((tax) => (
                  <Option key={tax.taxTypeCode} value={tax.taxTypeCode}>
                    {tax.taxTypeDescription || tax.taxTypeCode}
                  </Option>
                )) : 
                <Option disabled value="">Vergi tipi bulunamadı</Option>
              }
            </Select>
          </Form.Item>
        </Col>
        
        <Col xs={24} sm={12}>
          <Form.Item
            name="notes"
            label="Notlar"
          >
            <Input.TextArea rows={3} placeholder="Fatura ile ilgili notlar..." />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Form.Item
            name="isReturn"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="İade" 
              unCheckedChildren="Normal" 
              checked={isReturn}
              onChange={(checked) => setIsReturn(checked)}
            />
          </Form.Item>
        </Col>
        
        <Col xs={12} sm={6}>
          <Form.Item
            name="isEInvoice"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="E-Fatura" 
              unCheckedChildren="Normal Fatura" 
              checked={isEInvoice}
              onChange={(checked) => setIsEInvoice(checked)}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default InvoiceHeader;
