import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Form, Input, DatePicker, Select, Row, Col, Typography, Button, Spin, Divider, message, Radio, Switch, Tooltip, Space, Empty, InputNumber } from 'antd';
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
  ShipmentMethodCode: string;
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
        // API'den gelen verileri ShipmentMethod arayüzüne uygun şekilde dönüştür
        const formattedMethods = response.data.map(method => ({
          ...method,
          ShipmentMethodCode: method.shipmentMethodCode
        }));
        setShipmentMethods(formattedMethods);
        console.log('Sevkiyat yöntemleri yüklendi:', response.data);
        
        // Varsayılan olarak hiçbir sevkiyat yöntemi seçilmeyecek
        // Kullanıcının manuel olarak seçmesi gerekiyor
        form.setFieldsValue({ ShipmentMethodCode: '' });
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
      // Tüm vergi tiplerini konsola yazdır
      console.log('Mevcut tüm vergi tipleri:', JSON.stringify(taxTypes, null, 2));
      
      // "Vergisiz" vergi tipini bul
      const taxFreeType = taxTypes.find(tax => 
        tax.taxTypeDescription?.toLowerCase() === 'Vergisiz' || 
        tax.taxTypeCode === '4' // Vergisiz için kesin kod kontrolü
      );
      
      // Eğer "Vergisiz" vergi tipi varsa, onu varsayılan olarak ayarla
      if (taxFreeType) {
        form.setFieldsValue({ taxTypeCode: taxFreeType.taxTypeCode });
        console.log('Varsayılan vergi tipi ayarlandı:', taxFreeType.taxTypeCode, taxFreeType);
        // Varsayılan olarak "Vergisiz" seçildiğinde KDV oranlarını sıfırla
        handleTaxTypeChange(taxFreeType.taxTypeCode);
      }
    }
  }, [taxTypes]);
  
  // Vergi tipi değiştiğinde çalışacak fonksiyon
  const handleTaxTypeChange = (taxTypeCode: string) => {
    console.log('Vergi tipi değişti - Seçilen TaxTypeCode:', taxTypeCode);
    
    // Seçilen vergi tipini bul
    const selectedTaxType = taxTypes?.find(tax => tax.taxTypeCode === taxTypeCode);
    console.log('Seçilen vergi tipi detayları:', selectedTaxType);
    
    // Form alanını güncelle - bu önemli, API'ye gönderilecek
    form.setFieldsValue({ taxTypeCode: taxTypeCode });
    
    // Eğer "Vergisiz" seçildiyse tüm fatura satırlarındaki KDV oranını 0 yap
    // Kesin kontrol: TaxTypeCode = 4 ve bsTaxTypeDesc = "Vergisiz"
    if (selectedTaxType && 
        (selectedTaxType.taxTypeCode === '4' || 
         selectedTaxType.taxTypeDescription === 'Vergisiz')) {
      
      console.log('Vergisiz seçildi (TaxTypeCode=4), tüm KDV oranları 0 ve KDV kodları %0 olarak ayarlanıyor');
      
      // InvoiceForm bileşeninden gelen onTaxTypeChange fonksiyonunu çağır
      if (onTaxTypeChange) {
        onTaxTypeChange('vergisiz');
      }
    } else {
      // Başka bir vergi tipi seçildiyse, normal KDV oranlarını kullan (varsayılan %10)
      console.log('Normal vergi tipi seçildi (TaxTypeCode=' + taxTypeCode + '), varsayılan KDV oranı %10 kullanılıyor');
      if (onTaxTypeChange) {
        onTaxTypeChange('normal'); // normal mod - varsayılan KDV oranı %10
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
    // Önemli: Mevcut fatura tarihini sakla
    const currentInvoiceDate = form.getFieldValue('invoiceDate');
    console.log('fetchExchangeRate: Mevcut tarih saklandı:', currentInvoiceDate ? currentInvoiceDate.format('YYYY-MM-DD') : 'Tarih yok');
    
    const currencyCode = currencyCodeParam || form.getFieldValue('currencyCode');
    const invoiceDate = currentInvoiceDate; // Sakladığımız tarihi kullan
    const source = form.getFieldValue('exchangeRateSource') || exchangeRateSource;
    
    if (!currencyCode || !invoiceDate) {
      console.log('Para birimi veya tarih eksik, döviz kuru alınamıyor');
      return;
    }
    
    // TRY için kur her zaman 1'dir
    if (currencyCode === 'TRY') {
      setExchangeRate(1);
      form.setFieldsValue({ 
        exchangeRate: 1,
        // Tarihi koru
        invoiceDate: currentInvoiceDate
      });
      if (onExchangeRateChange) onExchangeRateChange(1);
      return;
    }
    
    // Manuel kaynak seçilmişse, kullanıcının kuru girmesine izin ver
    if (source === 'MANUEL') {
      setExchangeRateDisabled(false);
      // Tarihi koru
      form.setFieldsValue({ invoiceDate: currentInvoiceDate });
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
        form.setFieldsValue({ 
          exchangeRate: rate,
          // Tarihi koru
          invoiceDate: currentInvoiceDate
        });
        if (onExchangeRateChange) onExchangeRateChange(rate);
      } else {
        message.warning(`${currencyCode} için döviz kuru bulunamadı.`);
        setExchangeRate(0);
        form.setFieldsValue({ 
          exchangeRate: 0,
          // Tarihi koru
          invoiceDate: currentInvoiceDate
        });
        if (onExchangeRateChange) onExchangeRateChange(0);
      }
      
      // Son kontrol: Tarih hala doğru mu?
      const finalDate = form.getFieldValue('invoiceDate');
      if (!finalDate || (currentInvoiceDate && !dayjs(finalDate).isSame(currentInvoiceDate))) {
        console.log('fetchExchangeRate: Tarih değişmiş, tekrar yükleniyor:', 
                    currentInvoiceDate ? currentInvoiceDate.format('YYYY-MM-DD') : 'Tarih yok');
        form.setFieldsValue({ invoiceDate: currentInvoiceDate });
      }
    } catch (error) {
      console.error('Döviz kuru alınırken hata oluştu:', error);
      message.error('Döviz kuru alınırken hata oluştu');
      setExchangeRate(0);
      form.setFieldsValue({ 
        exchangeRate: 0,
        // Tarihi koru
        invoiceDate: currentInvoiceDate
      });
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

  // Ödeme tipi değerini dönüştüren yardımcı fonksiyon
  const normalizePaymentType = (value: string | number) => {
    // Sayısal değerleri dönüştür
    if (value === 1 || value === '1') return 'Peşin';
    if (value === 2 || value === '2') return 'Vadeli';
    
    // Zaten string ise doğrudan dön
    return value as string;
  };
  
  // Ödeme tipi değiştiğinde çalışacak fonksiyon
  const handlePaymentTypeChange = (value: string) => {
    console.log('Ödeme tipi değişti:', value);
    if (value === 'Peşin') {
      // Peşin seçilirse vade gün sıfırla ve vade tarihi fatura tarihine eşitle
      form.setFieldsValue({
        dueDays: 0,
        dueDate: form.getFieldValue('invoiceDate')
      });
    }
    // Form alanlarını yeniden render etmek için form'u güncelle
    form.setFields([{
      name: 'paymentType',
      value
    }]);
  };

  // Vade gün değiştiğinde çalışacak fonksiyon
  const handleDueDaysChange = (value: number | null) => {
    const invoiceDate = form.getFieldValue('invoiceDate');
    if (invoiceDate && value !== null && value > 0) {
      // Vade günü kadar fatura tarihine ekle
      const dueDate = dayjs(invoiceDate).add(value, 'day');
      form.setFieldsValue({
        dueDate: dueDate,
        paymentType: 'vadeli' // Vade gün 0'dan farklı ise ödeme tipini vadeli yap
      });
    } else {
      // Vade gün 0 veya null ise vade tarihi fatura tarihine eşit olsun
      form.setFieldsValue({
        dueDate: invoiceDate,
        paymentType: 'Peşin' // Vade gün 0 ise ödeme tipini peşin yap
      });
    }
  };

  // Tarih değiştiğinde sadece vade tarihini güncelle
  const handleDateChange = (date: any) => {
    if (!date) return;
    
    // Döviz kuru güncellemesi için fetchExchangeRate fonksiyonunu çağırmayı kaldırdık
    // Bu işlem artık InvoiceForm'daki onValuesChange fonksiyonunda yapılıyor
    
    // Sadece vade tarihini güncelle
    const paymentType = form.getFieldValue('paymentType');
    if (paymentType === 'Peşin') {
      // Peşin ise vade tarihi fatura tarihine eşit olsun
      form.setFieldsValue({
        dueDate: date
      });
    } else {
      // Vadeli ise, vade gününe göre vade tarihini güncelle
      const dueDays = form.getFieldValue('dueDays') || 0;
      if (dueDays > 0) {
        const dueDate = dayjs(date).add(dueDays, 'day');
        form.setFieldsValue({
          dueDate: dueDate
        });
      } else {
        // Vade gün 0 ise, mevcut tarih ile vade tarihi arasındaki gün farkını hesapla
        const currentDueDate = form.getFieldValue('dueDate');
        if (currentDueDate) {
          const daysDiff = dayjs(currentDueDate).diff(date, 'day');
          if (daysDiff > 0) {
            form.setFieldsValue({
              dueDays: daysDiff
            });
          }
        }
      }
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
          // Müşterinin para birimi varsa, onu seç - ancak mevcut seçili para birimi varsa değiştirme
          const currentCurrency = form.getFieldValue('currencyCode');
          if (!currentCurrency) {
            form.setFieldsValue({ currencyCode: customer.currencyCode });
            setIsCustomerCurrency(true);
            
            // Müşteri para birimi değiştiğinde callback fonksiyonu çağır
            if (onCurrencyChange) onCurrencyChange(customer.currencyCode);
          }
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
          // Tedarikçinin para birimi varsa, onu seç - ancak mevcut seçili para birimi varsa değiştirme
          const currentCurrency = form.getFieldValue('currencyCode');
          if (!currentCurrency) {
            form.setFieldsValue({ currencyCode: vendor.currencyCode });
            setIsCustomerCurrency(true);
            
            // Tedarikçi para birimi değiştiğinde callback fonksiyonu çağır
            if (onCurrencyChange) onCurrencyChange(vendor.currencyCode);
          }
        } else {
          setIsCustomerCurrency(false);
        }
      }
    }
    
    // Tarih ve para birimi için döviz kuru güncellemesi artık InvoiceForm'da merkezi olarak yapılıyor
    // Bu nedenle buradaki fetchExchangeRate çağrısını kaldırdık
  }, []);

  // useEffect ile form başlangıç değerlerini ayarla
  // Component mount olduğunda form başlangıç değerlerini ayarla
  useEffect(() => {
    // Form nesnesinin var olduğundan emin ol
    if (!form) return;
    
    try {
      // Bugünün tarihini al
      const today = dayjs();
      
      // Mevcut form değerlerini logla - tarih değerlerini okunabilir formatta göster
      const allValues = form.getFieldsValue();
      const formattedValues: Record<string, any> = {};
      
      // Tarih değerlerini okunabilir formata dönüştür
      Object.keys(allValues).forEach(key => {
        if (allValues[key] && typeof allValues[key] === 'object' && allValues[key].format) {
          // Bu bir dayjs/moment nesnesi
          formattedValues[key] = allValues[key].format('YYYY-MM-DD');
        } else {
          formattedValues[key] = allValues[key];
        }
      });
      
      console.log('Form başlangıcında tüm değerler (formatlı):', formattedValues);
      
      // Mevcut ödeme tipi değerini al
      const currentPaymentType = form.getFieldValue('paymentType');
      console.log('Ödeme tipi ham değer:', currentPaymentType, 'Türü:', typeof currentPaymentType);
      
      // Ödeme tipini normalize et
      let normalizedPaymentType = 'Vadeli'; // Varsayılan değer 'Vadeli' olarak değiştirildi
      if (currentPaymentType) {
        normalizedPaymentType = normalizePaymentType(currentPaymentType);
      }
      console.log('Normalize edilmiş ödeme tipi:', normalizedPaymentType);
      
      // Önemli: Mevcut fatura tarihini kontrol et
      const currentInvoiceDate = form.getFieldValue('invoiceDate');
      
      // Form değerlerini ayarla - eğer zaten bir tarih varsa, onu koru
      form.setFieldsValue({
        exchangeRateSource: 'TCMB',
        // Eğer mevcut bir tarih varsa onu koru, yoksa bugünün tarihini kullan
        invoiceDate: currentInvoiceDate || today,
        paymentType: normalizedPaymentType,
        dueDays: 30, // Varsayılan vade günü 30 gün olarak ayarlandı
        // Vade tarihi, fatura tarihinden 30 gün sonra olacak şekilde ayarlandı
        dueDate: currentInvoiceDate ? dayjs(currentInvoiceDate).add(30, 'day') : dayjs(today).add(30, 'day')
      });
      
      // Güncellenen değerleri logla - tarih değerlerini okunabilir formatta göster
      const updatedValues = form.getFieldsValue();
      const formattedUpdatedValues: Record<string, any> = {};
      
      Object.keys(updatedValues).forEach(key => {
        if (updatedValues[key] && typeof updatedValues[key] === 'object' && updatedValues[key].format) {
          // Bu bir dayjs/moment nesnesi
          formattedUpdatedValues[key] = updatedValues[key].format('YYYY-MM-DD');
        } else {
          formattedUpdatedValues[key] = updatedValues[key];
        }
      });
      
      console.log('Form değerleri güncellendi (formatlı):', formattedUpdatedValues);
    } catch (error) {
      console.error('Form değerleri ayarlanırken hata oluştu:', error);
    }
  }, [form, normalizePaymentType]);
  
  return (
    <div className="invoice-header-section">
      
      <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Title level={5} style={{ marginBottom: '12px' }}>Fatura Bilgileri</Title>
        </Col>

        {/* Fatura Türü gizlendi */}
        {/* <Col xs={24} sm={12} md={6} lg={4}>
          <Form.Item
            name="isReturn"
            valuePropName="checked"
            label="Fatura Türü"
            style={{ marginBottom: '12px' }}
          >
            <Switch 
              checkedChildren="İade" 
              unCheckedChildren="Normal" 
              checked={isReturn}
              onChange={(checked) => setIsReturn(checked)}
              size="small"
            />
          </Form.Item>
        </Col> */}
        
        {/* Vergi Türü ve Belge Türü yan yana */}
        <Col xs={24} sm={12} md={12} lg={12}>
          <Form.Item
            name="taxTypeCode"
            label="Vergi Türü"
            rules={[{ required: true, message: 'Lütfen vergi tipi seçin!' }]}
            style={{ marginBottom: '12px' }}
          >
            <Select
              showSearch
              placeholder="Vergi tipi seçin"
              optionFilterProp="children"
              loading={loadingTaxTypes}
              onChange={(value) => handleTaxTypeChange(value)}
              size="middle"
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
        
        <Col xs={24} sm={12} md={12} lg={12}>
          <Form.Item
            name="isEInvoice"
            valuePropName="checked"
            label="Belge Türü"
            style={{ marginBottom: '12px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}
          >
            <Switch 
              checkedChildren="E-Fatura" 
              unCheckedChildren="Normal" 
              checked={isEInvoice}
              onChange={(checked) => setIsEInvoice(checked)}
              size="small"
            />
          </Form.Item>
        </Col>

        {/* Vergi Tipi ve Fatura Tarihi yan yana */}
        <Col xs={24} sm={12} md={12} lg={12}>
          <Form.Item
            name="invoiceDate"
            label="Fatura Tarihi"
            rules={[{ required: true, message: 'Lütfen fatura tarihini seçin' }]}
            style={{ marginBottom: '12px' }}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD.MM.YYYY" 
              placeholder="Tarih seçin"
              onChange={handleDateChange}
              size="middle"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6} lg={6}>
          <Form.Item
            name="invoiceNumber"
            label="Fatura No:"
            tooltip="Fatura numarası sistem tarafından otomatik oluşturulacak"
            style={{ marginBottom: '12px' }}
          >
            <Input 
              placeholder="WS-7-XX" 
              disabled 
              style={{ backgroundColor: '#f5f5f5' }} 
              size="middle"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Fatura Bilgileri - Mobil Uyumlu Tasarım */}
      <div className="invoice-header-mobile-friendly" style={{ marginBottom: '8px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          /* Form öğelerinin genel stil ayarları */
          .invoice-header-mobile-friendly .ant-form-item {
            margin-bottom: 12px;
          }
          
          /* Form etiketlerinin stil ayarları */
          .invoice-header-mobile-friendly .ant-form-item-label {
            padding-bottom: 4px;
          }
          
          .invoice-header-mobile-friendly .ant-form-item-label > label {
            font-size: 14px;
            height: 20px;
            line-height: 20px;
          }
          
          /* Tüm form bileşenleri için ortak stil ayarları */
          .invoice-header-mobile-friendly .ant-picker,
          .invoice-header-mobile-friendly .ant-input,
          .invoice-header-mobile-friendly .ant-input-number,
          .invoice-header-mobile-friendly .ant-select:not(.ant-select-customize-input) .ant-select-selector {
            border-radius: 6px;
            height: 32px !important;
            box-sizing: border-box;
            padding: 0 11px;
            border: 1px solid #d9d9d9;
          }
          
          /* Radio.Button için özel stil */
          .invoice-header-mobile-friendly .ant-radio-group {
            width: 100%;
            display: flex;
            height: 32px;
          }
          
          .invoice-header-mobile-friendly .ant-radio-button-wrapper {
            flex: 1;
            height: 32px;
            line-height: 30px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 8px;
          }
          
          /* Input alanı için özel stil */
          .invoice-header-mobile-friendly .ant-input {
            line-height: 32px;
          }
          
          /* Input Number için özel stil */
          .invoice-header-mobile-friendly .ant-input-number {
            width: 100%;
          }
          
          .invoice-header-mobile-friendly .ant-input-number .ant-input-number-input {
            height: 30px;
            line-height: 30px;
            padding: 0 11px;
          }
          
          /* Select için özel stil */
          .invoice-header-mobile-friendly .ant-select-single .ant-select-selector {
            padding: 0 11px;
            display: flex;
            align-items: center;
          }
          
          .invoice-header-mobile-friendly .ant-select-single .ant-select-selector .ant-select-selection-item {
            line-height: 30px;
            height: 30px;
            padding-right: 18px;
          }
          
          /* DatePicker için özel stil */
          .invoice-header-mobile-friendly .ant-picker {
            padding: 0 11px;
            display: flex;
            align-items: center;
          }
          
          .invoice-header-mobile-friendly .ant-picker-input {
            display: flex;
            align-items: center;
            width: 100%;
          }
          
          .invoice-header-mobile-friendly .ant-picker-input > input {
            height: 30px;
            line-height: 30px;
            padding: 0;
            font-size: 14px;
          }
          
          /* Satır ve sütun boşlukları */
          .invoice-header-mobile-friendly .ant-row {
            margin-bottom: 0 !important;
          }
          
          /* Form öğeleri arasındaki boşlukları ayarla */
          .invoice-header-mobile-friendly .ant-col {
            padding: 0 4px;
          }
          
          /* Mobil görünüm için özel stiller */
          @media (max-width: 576px) {
            .invoice-header-mobile-friendly .ant-form-item {
              margin-bottom: 8px;
            }
            
            .invoice-header-mobile-friendly .ant-form-item-label > label {
              font-size: 13px;
            }
            
            .invoice-header-mobile-friendly .ant-form-item-label {
              padding-bottom: 2px;
            }
          }
        `}} />
        
        {/* Tek satırda - Fatura Tarihi, Fatura No, Ödeme Tipi, Vade Gün, Vade Tarihi, Para Birimi */}
        <Row gutter={[24, 12]}>
          {/* Fatura Tarihi ve Fatura No alanları üst kısma taşındı */}
          
          <Col xs={12} sm={6} md={3} lg={3}>
            <Form.Item
              name="paymentType"
              label="Ödeme Tipi"
              rules={[{ required: true, message: 'Lütfen ödeme tipini seçin' }]}
              style={{ marginBottom: '8px' }}
              normalize={(value) => {
                // Form değerini normalize et
                const normalized = normalizePaymentType(value);
                console.log('Form normalize edildi:', value, '->', normalized);
                return normalized;
              }}
              getValueProps={(value) => {
                // Değeri görüntülemek için normalize et
                const normalized = normalizePaymentType(value);
                console.log('getValueProps:', value, '->', normalized);
                return { value: normalized };
              }}
            >
              <Select
                placeholder="Ödeme tipi seçin"
                onChange={handlePaymentTypeChange}
                size="small"
                getPopupContainer={triggerNode => triggerNode.parentNode}
              >
                <Option value="Peşin">Peşin</Option>
                <Option value="Vadeli">Vadeli</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={12} sm={6} md={3} lg={3}>
            <Form.Item
              shouldUpdate={(prevValues, currentValues) => prevValues.paymentType !== currentValues.paymentType}
            >
              {({ getFieldValue }) => (
                <Form.Item
                  name="dueDays"
                  label="Vade Gün"
                  tooltip="Peşin ödemede 0, vadeli ödemede vade gün sayısını girin"
                  style={{ marginBottom: '8px' }}
                >
                  <InputNumber
                    min={0}
                    max={365}
                    style={{ width: '100%' }}
                    placeholder="Vade gün sayısı"
                    onChange={handleDueDaysChange}
                    disabled={getFieldValue('paymentType') === 'Peşin'}
                    size="small"
                  />
                </Form.Item>
              )}
            </Form.Item>
          </Col>
          
          <Col xs={12} sm={6} md={3} lg={3}>
            <Form.Item
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.paymentType !== currentValues.paymentType || 
                prevValues.dueDays !== currentValues.dueDays ||
                prevValues.invoiceDate !== currentValues.invoiceDate
              }
            >
              {({ getFieldValue }) => (
                <Form.Item
                  name="dueDate"
                  label="Vade Tarihi"
                  dependencies={['paymentType', 'dueDays', 'invoiceDate']}
                  tooltip="Peşin ödemede fatura tarihi ile aynı, vadeli ödemede vade gün sayısı kadar sonrası"
                  style={{ marginBottom: '8px' }}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD.MM.YYYY" 
                    placeholder="Vade tarihi"
                    disabled={getFieldValue('paymentType') === 'Peşin'}
                    size="small"
                  />
                </Form.Item>
              )}
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={6}>
            <Form.Item
              name="exchangeRateSource"
              label="Döviz Kuru Kaynağı"
              style={{ marginBottom: '12px' }}
            >
              <Radio.Group 
                onChange={handleExchangeRateSourceChange}
                optionType="button"
                buttonStyle="solid"
                size="middle"
                style={{ 
                  width: '100%', 
                  display: 'flex',
                  height: '36px'
                }}
              >
                <Radio.Button value="TCMB" style={{ flex: 1, height: '36px', lineHeight: '34px', textAlign: 'center', padding: '0 8px', fontSize: '14px' }}>TCMB</Radio.Button>
                <Radio.Button value="SERBEST_PIYASA" style={{ flex: 1, height: '36px', lineHeight: '34px', textAlign: 'center', padding: '0 8px', fontSize: '14px' }}>S.PİYASA</Radio.Button>
                <Radio.Button value="MANUEL" style={{ flex: 1, height: '36px', lineHeight: '34px', textAlign: 'center', padding: '0 8px', fontSize: '14px' }}>Manuel</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={6}>
            <Form.Item
              name="currencyCode"
              label="Para Birimi"
              rules={[{ required: true, message: 'Lütfen para birimi seçin' }]}
              style={{ marginBottom: '12px' }}
            >
              <Select
                showSearch
                placeholder="Para birimi seçin"
                optionFilterProp="children"
                size="middle"
                style={{ width: '100%' }}
                onChange={(value) => {
                  console.log('Para birimi seçildi:', value);
                  handleCurrencyChange(value);
                }}
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
                notFoundContent={loadingCurrencies ? <Spin size="default" /> : <Empty description="Para birimi bulunamadı" />}
              >
                {currencies?.length > 0 ? 
                  currencies.filter(currency => {
                    // Geçersiz para birimlerini filtrele
                    const code = currency?.code || currency?.currencyCode;
                    return code !== undefined && code !== null && code !== '';
                  }).map((currency, index) => {
                    // Kod ve açıklama için uygun alanları kullan
                    const code = currency.code || currency.currencyCode || '';
                    const name = currency.name || currency.currencyName || currency.description || currency.currencyDescription || '';
                    
                    return (
                      <Option 
                        key={`currency-${code}-${index}`} 
                        value={code}
                        title={`${code} - ${name}`}
                      >
                        {code} - {name}
                      </Option>
                    );
                  }) : 
                  <Option disabled value="" key="no-currency">Para birimi bulunamadı</Option>
                }
            </Select>
          </Form.Item>
          {isCustomerCurrency && (
            <Text type="secondary" style={{ marginTop: -16, display: 'block' }}>
              Müşteri Para Birimi seçili
            </Text>
          )}
        </Col>
        </Row>
      </div>

      <Row gutter={[24, 12]}>
        <Col xs={12} sm={6} md={6} lg={6}>
          <Form.Item
            name="exchangeRate"
            label="Döviz Kuru"
            rules={[{ required: true, message: 'Döviz kuru gerekli' }]}
            style={{ marginBottom: '8px' }}
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

        <Col xs={12} sm={6} md={6} lg={6}>
          <Form.Item
            name="officeCode"
            label="Ofis"
            rules={[{ required: true, message: 'Lütfen ofis seçin' }]}
            style={{ marginBottom: '8px' }}
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
                      
                      // Para birimi değişikliğini bildir
                      if (onCurrencyChange) {
                        console.log('Müşteri seçimi sonrası para birimi değişti:', customer.currencyCode);
                        onCurrencyChange(customer.currencyCode);
                      }
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
                      
                      // Para birimi değişikliğini bildir
                      if (onCurrencyChange) {
                        console.log('Tedarikçi seçimi sonrası para birimi değişti:', vendor.currencyCode);
                        onCurrencyChange(vendor.currencyCode);
                      }
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
            name="ShipmentMethodCode"
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
                form.setFieldsValue({ ShipmentMethodCode: value });
                
                // Form alanının güncel değerini kontrol et
                setTimeout(() => {
                  const currentValue = form.getFieldValue('ShipmentMethodCode');
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
                  <Option key={index} value={method.ShipmentMethodCode}>
                    {method.shipmentMethodDescription || method.description || `${method.shipmentMethodName} (${method.ShipmentMethodCode})`}
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
            label="Teslimat Adr."
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
            label="Fatura Adr."
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
            name="notes"
            label="Notlar"
          >
            <Input.TextArea rows={3} placeholder="Fatura ile ilgili notlar..." />
          </Form.Item>
        </Col>
      </Row>



      {/* Switch bileşenleri Fatura Bilgileri bölümüne taşındı */}
    </div>
  );
};

export default InvoiceHeader;
