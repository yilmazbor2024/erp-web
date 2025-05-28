import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, DatePicker, Button, Table, InputNumber, Switch, Card, Row, Col, Divider, Typography, message, Spin, Modal, List, Badge, Tag, Checkbox, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, BarcodeOutlined, ScanOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceApi from '../../services/invoiceApi';
import { customerApi, warehouseApi, officeApi, vendorApi, currencyApi } from '../../services/entityApi';
import productApi, { ProductVariant } from '../../services/productApi';
import inventoryApi, { InventoryStock } from '../../services/inventoryApi';
import { InvoiceType } from '../../types/invoice';

const { Option } = Select;
const { Title } = Typography;

// Fatura tipi açıklamaları
const invoiceTypeDescriptions = {
  [InvoiceType.WHOLESALE_SALES]: 'Toptan Satış Faturası',
  [InvoiceType.WHOLESALE_PURCHASE]: 'Toptan Alış Faturası',
  [InvoiceType.EXPENSE_SALES]: 'Masraf Satış Faturası',
  [InvoiceType.EXPENSE_PURCHASE]: 'Masraf Alış Faturası'
};

// Cari hesap tipi enum
enum CurrAccType {
  VENDOR = 1,
  CUSTOMER = 3
}

// Invoice detail interface with ID for React key prop
interface InvoiceDetail {
  id: string;
  itemCode: string;
  quantity: number;
  unitOfMeasureCode: string;
  unitPrice: number;
  vatRate: number;
  description?: string;
  discountRate?: number;
  productDescription?: string; // Ürün açıklaması
  totalAmount?: number; // Toplam tutar (miktar * birim fiyat)
  discountAmount?: number; // İskonto tutarı
  subtotalAmount?: number; // Alt toplam (iskonto sonrası)
  vatAmount?: number; // KDV tutarı
  netAmount?: number; // Net tutar (KDV dahil)
  colorCode?: string; // Renk kodu
  colorDescription?: string; // Renk açıklaması
  itemDim1Code?: string; // Beden kodu
}

// API için gerekli istek tipleri
interface CreateInvoiceRequest {
  invoiceNumber: string;
  invoiceTypeCode: string;
  invoiceDate: string;
  invoiceTime?: string;
  currAccCode: string;
  currAccTypeCode: number;
  docCurrencyCode: string;
  companyCode: string;
  officeCode: string;
  warehouseCode: string;
  customerCode?: string;
  vendorCode?: string;
  isReturn?: boolean;
  isEInvoice?: boolean;
  notes?: string;
  processCode?: string;
  totalAmount?: number; // Toplam tutar
  discountAmount?: number; // İskonto tutarı
  subtotalAmount?: number; // Alt toplam
  vatAmount?: number; // KDV tutarı
  netAmount?: number; // Net tutar
  details: any[];
}

interface InvoiceFormProps {
  type?: InvoiceType;
  onSuccess?: (data: any) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  type = InvoiceType.WHOLESALE_SALES, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>(type);
  const [currAccType, setCurrAccType] = useState<CurrAccType>(
    type === InvoiceType.WHOLESALE_PURCHASE 
      ? CurrAccType.VENDOR 
      : CurrAccType.CUSTOMER
  );
  
  // Satır filtreleme için state
  const [filterText, setFilterText] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  
  // Ödeme şekli için state
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('credit'); // Varsayılan olarak vadeli
  const [showCashPaymentModal, setShowCashPaymentModal] = useState<boolean>(false);
  // KDV dahil/hariç seçeneği için state
  const [isPriceIncludeVat, setIsPriceIncludeVat] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState<boolean>(false);
  const [inventoryStock, setInventoryStock] = useState<InventoryStock[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(false);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkVatRate, setBulkVatRate] = useState<number>(18);
  const barcodeInputRef = useRef<any>(null);
  // Taranan barkodları ve miktarlarını tutacak state
  const [scannedItems, setScannedItems] = useState<{
    variant: ProductVariant;
    quantity: number;
  }[]>([]);

  // Fatura tipinin adını döndüren yardımcı fonksiyon
  const getInvoiceTypeName = (invoiceType: InvoiceType) => {
    return invoiceTypeDescriptions[invoiceType] || 'Bilinmeyen Fatura Tipi';
  };

  // Ürün fiyatını fiyat listesinden getir ve varyantı ekle
  const getProductPriceAndAddVariant = async (variant: ProductVariant) => {
    try {
      // Ürün koduna göre fiyat listesini getir
      const priceList = await productApi.getProductPriceList(variant.productCode);
      
      if (priceList.length > 0) {
        // Fiyat listesinden ilk fiyatı al (en güncel fiyat)
        const firstPrice = priceList[0];
        
        // Varyantın fiyat ve KDV bilgilerini güncelle
        // BirimFiyat alanını kullan
        variant.salesPrice1 = firstPrice.birimFiyat || 0; // Varsayılan olarak 0 kullan
        variant.vatRate = firstPrice.vatRate || 18;
        
        console.log(`Ürün fiyatı fiyat listesinden güncellendi: ${variant.productCode}, Fiyat: ${variant.salesPrice1}, KDV: ${variant.vatRate}`);
        console.log('Fiyat detayları:', {
          birimFiyat: firstPrice.birimFiyat,
          itemTypeCode: firstPrice.itemTypeCode || variant.productTypeCode
        });
      } else {
        console.log(`Ürün için fiyat listesi bulunamadı: ${variant.productCode}`);
      }
      
      // Varyantı taranan listeye ekle
      addVariantToScannedList(variant);
      
      // Varyant listesini temizle ve barkod alanını sıfırla
      setProductVariants([]);
      setBarcodeInput('');
    } catch (error) {
      console.error('Ürün fiyatı getirilirken hata oluştu:', error);
      // Hata olsa bile varyantı ekle
      addVariantToScannedList(variant);
      
      // Varyant listesini temizle ve barkod alanını sıfırla
      setProductVariants([]);
      setBarcodeInput('');
    }
  };
  
  // Barkod ile ürün varyantlarını ara
  const searchProductVariantsByBarcode = async () => {
    if (!barcodeInput) {
      message.warning('Lütfen bir barkod girin');
      return;
    }

    try {
      setLoadingVariants(true);
      setLoadingInventory(true);
      
      // Ürün varyantlarını getir
      const variants = await productApi.getProductVariantsByBarcode(barcodeInput);
      
      // Envanter/stok bilgisini getir
      try {
        const stockInfo = await inventoryApi.getInventoryStockByBarcode(barcodeInput);
        setInventoryStock(stockInfo);
      } catch (stockError) {
        console.error('Envanter/stok bilgisi alınırken hata oluştu:', stockError);
        setInventoryStock([]);
      } finally {
        setLoadingInventory(false);
      }
      
      if (variants.length === 0) {
        message.warning(`${barcodeInput} barkoduna sahip ürün bulunamadı`);
      } else if (variants.length === 1) {
        // Tek varyant bulunduğunda otomatik olarak ekle
        await getProductPriceAndAddVariant(variants[0]);
      } else {
        // Birden fazla varyant bulunduğunda listeyi göster
        setProductVariants(variants);
      }
      
      setBarcodeInput('');
    } catch (error) {
      console.error('Barkod ile ürün aranırken hata oluştu:', error);
      message.error('Barkod ile ürün aranırken bir hata oluştu');
      setLoadingInventory(false);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Taranan varyantı listeye ekle veya miktarını artır
  const addVariantToScannedList = (variant: ProductVariant) => {
    setScannedItems(prevItems => {
      // Aynı barkoda sahip ürün var mı kontrol et
      const existingItemIndex = prevItems.findIndex(item => 
        item.variant.barcode === variant.barcode
      );

      if (existingItemIndex >= 0) {
        // Varsa miktarını artır
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // Yoksa yeni ekle
        return [...prevItems, { variant, quantity: 1 }];
      }
    });

    // Başarı mesajı göster
    message.success(`${variant.productDescription} listeye eklendi`);
  };

  // Ürün varyantını faturaya ekle
  const addProductVariantToInvoice = (variant: ProductVariant, quantity: number = 1) => {
    const newDetail: InvoiceDetail = {
      id: generateUniqueId(),
      itemCode: variant.productCode,
      quantity: quantity,
      unitOfMeasureCode: variant.unitOfMeasureCode1,
      unitPrice: variant.salesPrice1,
      vatRate: variant.vatRate || 18, // Varsayılan KDV oranı
      description: variant.productDescription,
      productDescription: variant.productDescription,
      discountRate: 0,
      // Renk ve beden bilgilerini ekle
      colorCode: variant.colorCode,
      colorDescription: variant.colorDescription,
      itemDim1Code: variant.itemDim1Code
    };

    setInvoiceDetails([...invoiceDetails, newDetail]);
    calculateInvoiceTotals([...invoiceDetails, newDetail]);
    message.success(`${variant.productDescription} faturaya eklendi`);
  };

  // Barkod modalını kapat
  const closeBarcodeModal = () => {
    setBarcodeModalVisible(false);
    setBarcodeInput('');
    setProductVariants([]);
    setScannedItems([]);
    setInventoryStock([]);
    setBulkPrice(0);
    setBulkVatRate(18);
  };

  // Toplu fiyat güncelleme fonksiyonu
  const updateAllPrices = () => {
    if (bulkPrice <= 0) {
      message.warning('Lütfen geçerli bir fiyat girin');
      return;
    }

    const updatedItems = scannedItems.map(item => ({
      ...item,
      variant: {
        ...item.variant,
        salesPrice1: bulkPrice,
        vatRate: bulkVatRate
      }
    }));

    setScannedItems(updatedItems);
    message.success('Tüm ürünlerin fiyatları güncellendi');
  };

  // Tüm taranan ürünleri faturaya ekle
  const addAllScannedItemsToInvoice = () => {
    if (scannedItems.length === 0) {
      message.warning('Eklenecek ürün bulunmamaktadır');
      return;
    }

    // Her bir taranan ürünü faturaya ekle
    const newDetails: InvoiceDetail[] = scannedItems.map(item => {
      // Birim fiyat ve KDV oranı al
      const unitPrice = item.variant.salesPrice1;
      const vatRate = item.variant.vatRate || 18;
      
      // Yeni detay oluştur
      const detail: InvoiceDetail = {
        id: generateUniqueId(),
        itemCode: item.variant.productCode,
        quantity: item.quantity,
        unitOfMeasureCode: item.variant.unitOfMeasureCode1,
        unitPrice: unitPrice,
        vatRate: vatRate,
        description: item.variant.productDescription,
        productDescription: item.variant.productDescription,
        discountRate: 0,
        // Renk ve beden bilgilerini ekle
        colorCode: item.variant.colorCode,
        colorDescription: item.variant.colorDescription,
        itemDim1Code: item.variant.itemDim1Code
      };
      
      // Satır toplamlarını hesapla
      const totalAmount = detail.quantity * detail.unitPrice;
      detail.totalAmount = totalAmount;
      
      // İskonto tutarını hesapla
      const discountRate = detail.discountRate || 0;
      const discountAmount = totalAmount * (discountRate / 100);
      detail.discountAmount = discountAmount;
      
      // Alt toplamı hesapla (toplam - iskonto)
      const subtotalAmount = totalAmount - discountAmount;
      detail.subtotalAmount = subtotalAmount;
      
      // KDV tutarını hesapla
      const vatAmount = subtotalAmount * (detail.vatRate / 100);
      detail.vatAmount = vatAmount;
      
      // Net tutarı hesapla (alt toplam + KDV)
      const netAmount = subtotalAmount + vatAmount;
      detail.netAmount = netAmount;
      
      return detail;
    });

    // Fatura detaylarını güncelle
    const updatedDetails = [...invoiceDetails, ...newDetails];
    setInvoiceDetails(updatedDetails);
    calculateInvoiceTotals(updatedDetails);
    
    // Başarı mesajı göster
    message.success(`${scannedItems.length} ürün faturaya eklendi`);
    
    // Modalı kapat
    closeBarcodeModal();
  };

  // İlk yükleme için veri yükleme fonksiyonu
  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Form Bileşeni Yüklendi:', invoiceTypeDescriptions[type]);
      
      // Veri yükleme işlemi
      await loadData();
      
      // Not: Fatura numarası artık backend tarafında fatura oluşturma sırasında otomatik oluşturulacak
      // Form alanını geçici bir değerle doldur
      form.setFieldsValue({ invoiceNumber: 'Otomatik oluşturulacak' });
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      message.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Form yüklenince verileri yükle
  useEffect(() => {
    loadInitialData();
  }, []);

  // Fatura detayları değiştiğinde toplamları güncelle
  useEffect(() => {
    if (invoiceDetails.length > 0) {
      calculateInvoiceTotals();
    }
  }, [invoiceDetails]);

  // Veri yükleme fonksiyonu
  const loadData = async () => {
    try {
      console.log('Veri yükleme başlıyor...');
      console.log('Cari hesap tipi:', currAccType === CurrAccType.CUSTOMER ? 'Müşteri' : 'Tedarikçi');
      
      // Paralel veri yükleme için Promise.all kullan
      const loadPromises = [];
      
      // Müşterileri yükle
      const loadCustomers = async () => {
        try {
          console.log('Müşteri listesi yükleniyor...');
          // CurrAccTypeCode=3 olan müşterileri getir
          const customerResponse = await customerApi.getCustomers({ currAccTypeCode: 3 });
          
          if (customerResponse && customerResponse.success) {
            // API yanıt yapısını kontrol et
            const customerData = customerResponse.data || [];
            console.log(`${customerData ? customerData.length : 0} müşteri yüklendi.`);
            
            if (customerData && customerData.length > 0) {
              // Müşteri verilerini standartlaştır
              const formattedCustomers = customerData.map((customer: any) => {
                // Müşteri kodu için öncelik sırası
                const code = customer.customerCode || customer.currAccCode || customer.code || '';
                // Müşteri adı için öncelik sırası
                const name = customer.customerName || customer.currAccDescription || customer.name || customer.description || `Müşteri ${code}`;
                
                return {
                  ...customer,
                  code,
                  name,
                  currAccTypeCode: customer.currAccTypeCode || customer.customerTypeCode || 3
                };
              });
              
              setCustomers(formattedCustomers);
              console.log('Formatı standartlaştırılmış müşteriler:', formattedCustomers);
            } else {
              setCustomers([]);
              console.warn('Müşteri verisi boş geldi');
            }
          } else {
            setCustomers([]);
            console.warn('Müşteri API yanıtı başarısız:', customerResponse);
          }
        } catch (error) {
          console.error('Müşteri yükleme hatası:', error);
          setCustomers([]);
        }
      };
      
      // Tedarikçileri yükle
      const loadVendors = async () => {
        try {
          console.log('Tedarikçi listesi yükleniyor...');
          const vendorResponse = await vendorApi.getVendors();
          
          if (vendorResponse && vendorResponse.success) {
            // API yanıt yapısını kontrol et
            const vendorData = vendorResponse.data || [];
            console.log(`${vendorData ? vendorData.length : 0} tedarikçi yüklendi.`);
            
            if (vendorData && vendorData.length > 0) {
              setVendors([...vendorData]);
            } else {
              setVendors([]);
            }
          } else {
            setVendors([]);
          }
        } catch (error) {
          console.error('Tedarikçi yükleme hatası:', error);
          setVendors([]);
        }
      };
      
      // Ofisleri yükle
      const loadOffices = async () => {
        try {
          console.log('Ofis listesi yükleniyor...');
          const officeResponse = await officeApi.getOffices();
          
          if (officeResponse && officeResponse.success) {
            // API yanıt yapısını kontrol et
            const officeData = officeResponse.data || [];
            console.log(`${officeData.length} ofis yüklendi.`);
            
            if (officeData && officeData.length > 0) {
              setOffices([...officeData]);
              // Varsayılan ofis kodu form'a ekle
              if (officeData.length > 0 && !form.getFieldValue('officeCode')) {
                form.setFieldsValue({ officeCode: officeData[0].code });
              }
            } else {
              setOffices([]);
            }
          } else {
            setOffices([]);
          }
        } catch (error) {
          console.error('Ofis yükleme hatası:', error);
          setOffices([]);
        }
      };
      
      // Depoları yükle
      const loadWarehouses = async () => {
        try {
          console.log('Depo listesi yükleniyor...');
          const warehouseResponse = await warehouseApi.getWarehouses();
          
          if (warehouseResponse && warehouseResponse.success) {
            // API yanıt yapısını kontrol et
            const warehouseData = warehouseResponse.data || [];
            console.log(`${warehouseData.length} depo yüklendi.`);
            
            if (warehouseData && warehouseData.length > 0) {
              setWarehouses([...warehouseData]);
              // Varsayılan depo kodu form'a ekle
              if (warehouseData.length > 0 && !form.getFieldValue('warehouseCode')) {
                form.setFieldsValue({ warehouseCode: warehouseData[0].code });
              }
            } else {
              setWarehouses([]);
            }
          } else {
            setWarehouses([]);
          }
        } catch (error) {
          console.error('Depo yükleme hatası:', error);
          setWarehouses([]);
        }
      };
      
      // Ürünleri yükle
      const loadProducts = async () => {
        try {
          console.log('Ürün listesi yükleniyor...');
          setLoadingProducts(true);
          
          // Ürün listesi parametreleri
          const productResponse = await productApi.getProducts();
          
          if (productResponse && Array.isArray(productResponse.items)) {
            const productData = productResponse.items || [];
            console.log(`${productData.length} ürün yüklendi.`);
            
            // Ürün verilerini düzenle
            const formattedProducts = productData.map(product => ({
              ...product,
              label: `${product.productCode} - ${product.productDescription || 'İsimsiz Ürün'}`,
              value: product.productCode
            }));
            
            setProducts(formattedProducts);
          } else {
            setProducts([]);
          }
        } catch (error) {
          console.error('Ürün yükleme hatası:', error);
          setProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      };
      
      // Ölçü birimlerini yükle
      const loadUnits = async () => {
        try {
          const unitsResponse = await productApi.getDefaultUnitOfMeasures();
          if (unitsResponse && Array.isArray(unitsResponse)) {
            setUnits(unitsResponse);
          } else {
            // Varsayılan ölçü birimleri
            setUnits([
              { unitOfMeasureCode: 'ADET', unitOfMeasureDescription: 'Adet' },
              { unitOfMeasureCode: 'KG', unitOfMeasureDescription: 'Kilogram' },
              { unitOfMeasureCode: 'LT', unitOfMeasureDescription: 'Litre' },
              { unitOfMeasureCode: 'MT', unitOfMeasureDescription: 'Metre' },
              { unitOfMeasureCode: 'M2', unitOfMeasureDescription: 'Metrekare' },
              { unitOfMeasureCode: 'PKT', unitOfMeasureDescription: 'Paket' }
            ]);
          }
        } catch (error) {
          console.error('Ölçü birimleri yükleme hatası:', error);
          // Varsayılan ölçü birimleri
          setUnits([
            { unitOfMeasureCode: 'ADET', unitOfMeasureDescription: 'Adet' },
            { unitOfMeasureCode: 'KG', unitOfMeasureDescription: 'Kilogram' },
            { unitOfMeasureCode: 'LT', unitOfMeasureDescription: 'Litre' },
            { unitOfMeasureCode: 'MT', unitOfMeasureDescription: 'Metre' },
            { unitOfMeasureCode: 'M2', unitOfMeasureDescription: 'Metrekare' },
            { unitOfMeasureCode: 'PKT', unitOfMeasureDescription: 'Paket' }
          ]);
        }
      };
      
      // Para birimlerini yükle - Sadece bir kez yüklemek için referans tutuyoruz
      const loadCurrencies = async () => {
        // Eğer zaten para birimleri yüklendiyse tekrar yükleme
        if (currencies.length > 0) {
          console.log('Para birimleri zaten yüklenmiş, tekrar yüklenmiyor');
          return;
        }
        
        try {
          setLoadingCurrencies(true);
          console.log('Para birimleri yükleniyor...');
          const currencyResponse = await currencyApi.getCurrencies();
          
          if (currencyResponse && currencyResponse.success) {
            const currencyData = currencyResponse.data || [];
            console.log(`${currencyData.length} para birimi yüklendi`);
            
            if (currencyData && currencyData.length > 0) {
              // Para birimi verilerini standartlaştır
              const formattedCurrencies = currencyData.map((currency: any) => ({
                ...currency,
                currencyCode: currency.currencyCode || currency.code,
                currencyDescription: currency.currencyDescription || currency.description || currency.name,
                code: currency.currencyCode || currency.code,
                name: currency.currencyDescription || currency.description || currency.name,
                description: currency.currencyDescription || currency.description || currency.name
              }));
              
              setCurrencies(formattedCurrencies);
            } else {
              // Varsayılan para birimleri
              const defaultCurrencies = [
                { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', code: 'TRY', name: 'Türk Lirası', description: 'Türk Lirası' },
                { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', code: 'USD', name: 'Amerikan Doları', description: 'Amerikan Doları' },
                { currencyCode: 'EUR', currencyDescription: 'Euro', code: 'EUR', name: 'Euro', description: 'Euro' },
                { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', code: 'GBP', name: 'İngiliz Sterlini', description: 'İngiliz Sterlini' }
              ];
              setCurrencies(defaultCurrencies);
              console.log('Varsayılan para birimleri kullanılıyor');
            }
          } else {
            // Varsayılan para birimleri
            const defaultCurrencies = [
              { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', code: 'TRY', name: 'Türk Lirası', description: 'Türk Lirası' },
              { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', code: 'USD', name: 'Amerikan Doları', description: 'Amerikan Doları' },
              { currencyCode: 'EUR', currencyDescription: 'Euro', code: 'EUR', name: 'Euro', description: 'Euro' },
              { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', code: 'GBP', name: 'İngiliz Sterlini', description: 'İngiliz Sterlini' }
            ];
            setCurrencies(defaultCurrencies);
            console.log('API yanıtı başarısız, varsayılan para birimleri kullanılıyor');
          }
        } catch (error) {
          console.error('Para birimi yükleme hatası:', error);
          // Varsayılan para birimleri
          const defaultCurrencies = [
            { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', code: 'TRY', name: 'Türk Lirası', description: 'Türk Lirası' },
            { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', code: 'USD', name: 'Amerikan Doları', description: 'Amerikan Doları' },
            { currencyCode: 'EUR', currencyDescription: 'Euro', code: 'EUR', name: 'Euro', description: 'Euro' },
            { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', code: 'GBP', name: 'İngiliz Sterlini', description: 'İngiliz Sterlini' }
          ];
          setCurrencies(defaultCurrencies);
          console.log('Hata nedeniyle varsayılan para birimleri kullanılıyor');
        } finally {
          setLoadingCurrencies(false);
        }
      };
      
      // Tüm veri yükleme işlemlerini paralel olarak başlat
      await Promise.all([
        loadCustomers(),
        loadVendors(),
        loadOffices(),
        loadWarehouses(),
        loadProducts(),
        loadUnits(),
        loadCurrencies()
      ]);
      
      console.log('Tüm veriler başarıyla yüklendi.');
    } catch (error) {
      console.error('Veri yükleme sırasında hata oluştu:', error);
    }
  };

  // Not: Fatura numarası artık backend tarafında fatura oluşturma sırasında otomatik oluşturulacak
  // Bu nedenle frontend'de fatura numarası oluşturma fonksiyonu kaldırıldı

  // Fatura tipi değiştiğinde çalışacak fonksiyon
  const handleInvoiceTypeChange = (type: InvoiceType) => {
    setSelectedInvoiceType(type);
    
    // Fatura tipine göre müşteri/tedarikçi seçimini ayarla
    if (type === InvoiceType.WHOLESALE_PURCHASE || type === InvoiceType.EXPENSE_PURCHASE) {
      setCurrAccType(CurrAccType.VENDOR);
    } else {
      setCurrAccType(CurrAccType.CUSTOMER);
    }
    
    // Detayları sıfırla
    setInvoiceDetails([]);
    
    // Not: Fatura numarası artık backend tarafında oluşturulacak
    form.setFieldsValue({ invoiceNumber: 'Otomatik oluşturulacak' });
  };

  // Benzersiz ID oluştur
  const generateUniqueId = () => {
    return `detail-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Yeni fatura detayı ekle
  const addInvoiceDetail = () => {
    const newDetails = [
      ...invoiceDetails,
      {
        id: generateUniqueId(),
        itemCode: '',
        quantity: 1,
        unitOfMeasureCode: 'ADET',
        unitPrice: 0,
        vatRate: 18,
        discountRate: 0,
        productDescription: '',
        color: '',
        totalAmount: 0,
        discountAmount: 0,
        subtotalAmount: 0,
        vatAmount: 0,
        netAmount: 0
      }
    ];
    
    setInvoiceDetails(newDetails);
    // useEffect hook'u ile toplamlar otomatik güncellenecek
  };

  // Fatura detayını sil
  const removeInvoiceDetail = (index: number) => {
    const updatedDetails = [...invoiceDetails];
    updatedDetails.splice(index, 1);
    setInvoiceDetails(updatedDetails);
    // useEffect hook'u ile toplamlar otomatik güncellenecek
  };

  // Fatura detayını güncelle
  const updateInvoiceDetail = (index: number, field: keyof InvoiceDetail, value: any) => {
    const updatedDetails = [...invoiceDetails];
    
    // Eğer ürün kodu değiştiyse, ilgili ürünün diğer bilgilerini de otomatik olarak doldur
    if (field === 'itemCode' && value) {
      const selectedProduct = products.find(p => p.productCode === value);
      
      if (selectedProduct) {
        console.log('Seçilen ürün:', selectedProduct);
        
        // Ürün bilgilerini otomatik doldur - ItemDim1Code, ItemDim2Code, ItemDim3Code ve color alanı kaldırıldı
        updatedDetails[index] = { 
          ...updatedDetails[index], 
          itemCode: value,
          productDescription: selectedProduct.productDescription || '',
          unitOfMeasureCode: selectedProduct.unitOfMeasureCode1 || 'ADET',
          unitPrice: selectedProduct.salesPrice1 || 0,
          vatRate: selectedProduct.vatRate || 18
        };
      } else {
        // Sadece ürün kodunu güncelle
        updatedDetails[index] = { ...updatedDetails[index], [field]: value };
      }
    } else {
      // Diğer alanlar için normal güncelleme yap
      updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    }
    
    // Hesaplamaları yap
    const detail = updatedDetails[index];
    const quantity = detail.quantity || 0;
    let unitPrice = detail.unitPrice || 0;
    const discountRate = detail.discountRate || 0;
    const vatRate = detail.vatRate || 0;
    
    // KDV dahil fiyat girilmişse, KDV hariç fiyatı hesapla
    if (isPriceIncludeVat && field === 'unitPrice') {
      // KDV dahil fiyattan KDV hariç fiyatı hesapla
      unitPrice = unitPrice / (1 + (vatRate / 100));
      detail.unitPrice = unitPrice;
    }
    
    // Toplam tutarı hesapla (miktar * birim fiyat)
    const totalAmount = quantity * unitPrice;
    detail.totalAmount = totalAmount;
    
    // İskonto tutarını hesapla
    const discountAmount = totalAmount * (discountRate / 100);
    detail.discountAmount = discountAmount;
    
    // Alt toplamı hesapla (toplam - iskonto)
    const subtotalAmount = totalAmount - discountAmount;
    detail.subtotalAmount = subtotalAmount;
    
    // KDV tutarını hesapla
    const vatAmount = subtotalAmount * (vatRate / 100);
    detail.vatAmount = vatAmount;
    
    // Net tutarı hesapla (alt toplam + KDV)
    const netAmount = subtotalAmount + vatAmount;
    detail.netAmount = netAmount;
    
    setInvoiceDetails(updatedDetails);
    calculateInvoiceTotals(updatedDetails);
  };

  // Fatura toplamlarını hesapla
  const calculateInvoiceTotals = (details: InvoiceDetail[] = invoiceDetails) => {
    // Toplam tutarları hesapla
    let totalAmount = 0;
    let discountAmount = 0;
    let subtotalAmount = 0;
    let vatAmount = 0;
    let netAmount = 0;

    details.forEach(detail => {
      const itemTotal = detail.totalAmount || 0;
      const itemDiscount = detail.discountAmount || 0;
      const itemSubtotal = detail.subtotalAmount || 0;
      const itemVat = detail.vatAmount || 0;
      const itemNet = detail.netAmount || 0;
      
      // Toplam değerlere ekle
      totalAmount += itemTotal;
      discountAmount += itemDiscount;
      subtotalAmount += itemSubtotal;
      vatAmount += itemVat;
      netAmount += itemNet;
    });
    
    // Form alanını güncelle
    form.setFieldsValue({
      totalAmount: totalAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      subtotalAmount: subtotalAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      netAmount: netAmount.toFixed(2)
    });
  };

  // Fatura oluştur
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Fatura detaylarını kontrol et
      if (invoiceDetails.length === 0) {
        message.error('En az bir fatura detayı eklemelisiniz.');
        setLoading(false);
        return;
      }
      
      // Fatura toplamlarını hesapla
      const totals = calculateInvoiceTotals();
      
      // Fatura isteği oluştur
      const invoiceRequest: CreateInvoiceRequest = {
        // Fatura numarası backend tarafında otomatik oluşturulacak
        invoiceNumber: '',
        invoiceTypeCode: selectedInvoiceType,
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        invoiceTime: values.invoiceDate.format('HH:mm:ss'),
        currAccTypeCode: currAccType,
        currAccCode: values.currAccCode,
        docCurrencyCode: values.docCurrencyCode || 'TRY',
        companyCode: 'COMPANY', // Şirket kodu
        officeCode: values.officeCode,
        warehouseCode: values.warehouseCode,
        isReturn: values.isReturn || false,
        isEInvoice: values.isEInvoice || false,
        notes: values.notes || '',
        // Fatura toplamlarını ekle
        totalAmount: parseFloat(values.totalAmount || '0'),
        discountAmount: parseFloat(values.discountAmount || '0'),
        subtotalAmount: parseFloat(values.subtotalAmount || '0'),
        vatAmount: parseFloat(values.vatAmount || '0'),
        netAmount: parseFloat(values.netAmount || '0'),
        details: invoiceDetails.map(detail => ({
          productCode: detail.itemCode,
          qty: detail.quantity,
          unitCode: detail.unitOfMeasureCode,
          unitPrice: detail.unitPrice,
          vatRate: detail.vatRate,
          discountRate: detail.discountRate || 0,
          lineDescription: detail.description || detail.productDescription || '',
          currencyCode: values.docCurrencyCode || 'TRY',
          priceCurrencyCode: values.docCurrencyCode || 'TRY',
          exchangeRate: 1,
          colorCode: detail.colorCode || '', // Renk kodu API'ye gönderilecek
          itemDim1Code: detail.itemDim1Code || '' // Beden kodu API'ye gönderilecek
        }))
      };
      
      // Cari hesap tipine göre müşteri veya tedarikçi kodunu ata
      if (currAccType === CurrAccType.CUSTOMER) {
        invoiceRequest.customerCode = values.currAccCode;
      } else {
        invoiceRequest.vendorCode = values.currAccCode;
      }
      
      // Masraf faturası ise işlem kodunu (processCode) ayarla
      if (selectedInvoiceType === InvoiceType.EXPENSE_SALES || selectedInvoiceType === InvoiceType.EXPENSE_PURCHASE) {
        // Masraf faturası işlem kodunu kullan
        invoiceRequest.processCode = 'EXP';
      }
      
      console.log('Fatura isteği:', invoiceRequest);
      
      // Fatura oluşturma işlemi
      let response;
      try {
        if (selectedInvoiceType === InvoiceType.WHOLESALE_SALES) {
          response = await invoiceApi.createWholesaleInvoice(invoiceRequest);
        } else if (selectedInvoiceType === InvoiceType.WHOLESALE_PURCHASE) {
          response = await invoiceApi.createWholesalePurchaseInvoice(invoiceRequest);
        } else if (selectedInvoiceType === InvoiceType.EXPENSE_SALES || selectedInvoiceType === InvoiceType.EXPENSE_PURCHASE) {
          response = await invoiceApi.createExpenseInvoice(invoiceRequest);
        }
        
        if (response && response.success) {
          message.success('Fatura başarıyla oluşturuldu.');
          
          form.resetFields();
          setInvoiceDetails([]);
          if (onSuccess) {
            onSuccess(response.data);
          }
        } else {
          message.error('Fatura oluşturulurken bir hata oluştu: ' + (response?.message || 'Bilinmeyen hata'));
        }
      } catch (apiError) {
        console.error('API hatası:', apiError);
        message.error('Fatura oluşturulurken bir hata oluştu: ' + (apiError instanceof Error ? apiError.message : 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Fatura oluşturma hatası:', error);
      message.error('Fatura oluşturulurken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card title={getInvoiceTypeName(selectedInvoiceType)} loading={loading}>
      {/* Barkod Tarama Modalı */}
      <BarcodeModal
        visible={barcodeModalVisible}
        onClose={closeBarcodeModal}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        onSearch={searchProductVariantsByBarcode}
        loading={loadingVariants}
        productVariants={productVariants}
        inputRef={barcodeInputRef}
        scannedItems={scannedItems}
        addAllToInvoice={addAllScannedItemsToInvoice}
        isPriceIncludeVat={isPriceIncludeVat}
        getProductPrice={getProductPriceAndAddVariant}
        inventoryStock={inventoryStock}
        loadingInventory={loadingInventory}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          invoiceDate: dayjs(),
          isReturn: false,
          isEInvoice: false,
          docCurrencyCode: 'TRY'
        }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="invoiceNumber"
              label="Fatura Numarası"
              tooltip="Fatura numarası backend tarafında otomatik oluşturulacak"
            >
              <Input placeholder="Otomatik oluşturulacak" disabled style={{ backgroundColor: '#f5f5f5' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="invoiceDate"
              label="Fatura Tarihi"
              rules={[{ required: true, message: 'Lütfen fatura tarihini seçiniz' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="docCurrencyCode"
              label="Para Birimi"
              rules={[{ required: true, message: 'Lütfen para birimi seçiniz' }]}
            >
              <Select 
                showSearch
                placeholder="Para birimi seçiniz"
                optionFilterProp="children"
                suffixIcon={undefined} // showArrow yerine suffixIcon kullanılıyor
                filterOption={(input, option) => {
                  if (!input || input.length < 3 || !option || !option.children) return true; // 3 karakterden az ise tümünü göster
                  
                  // Option içeriğini string'e çevir
                  let childText = '';
                  if (typeof option.children === 'string') {
                    childText = option.children;
                  } else if (React.isValidElement(option.children)) {
                    try {
                      childText = JSON.stringify(option.children);
                    } catch (e) {
                      childText = '';
                    }
                  } else {
                    try {
                      childText = option.children.toString();
                    } catch (e) {
                      childText = '';
                    }
                  }
                  
                  // Arama metni için hem kod hem de açıklama kontrol edilir
                  const searchText = String(option.label || childText);
                  return searchText.toLowerCase().includes(input.toLowerCase());
                }}
                showArrow={true}
                style={{ width: '100%' }}
              >
                {Array.isArray(currencies) && currencies.length > 0 ? currencies.map(currency => {
                  // Her para birimi için arama yapılabilecek bir metin oluştur
                  const code = currency.currencyCode || currency.code || '';
                  const description = currency.currencyDescription || currency.description || currency.name || 'Bilinmeyen';
                  
                  return (
                    <Option 
                      key={code || `currency-${Math.random()}`} 
                      value={code}
                      label={`${code} ${description}`} // Arama için ek bir etiket
                    >
                      <span>
                        <b>{code}</b> - {description}
                      </span>
                    </Option>
                  );
                }) : <Option key="no-currency" value="">Para birimi bulunamadı</Option>}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="currAccCode"
              label={currAccType === CurrAccType.CUSTOMER ? 'Müşteri' : 'Tedarikçi'}
              rules={[{ required: true, message: `Lütfen ${currAccType === CurrAccType.CUSTOMER ? 'müşteri' : 'tedarikçi'} seçiniz` }]}
            >
              <Select 
                showSearch
                placeholder={`${currAccType === CurrAccType.CUSTOMER ? 'Müşteri' : 'Tedarikçi'} seçiniz`}
                optionFilterProp="children"
                filterOption={(input, option) => {
                  if (!input || input.length < 3 || !option || !option.children) return true; // 3 karakterden az ise tümünü göster
                  
                  // Option içeriğini string'e çevir
                  let childText = '';
                  if (typeof option.children === 'string') {
                    childText = option.children;
                  } else if (React.isValidElement(option.children)) {
                    try {
                      childText = JSON.stringify(option.children);
                    } catch (e) {
                      childText = '';
                    }
                  } else {
                    try {
                      childText = option.children.toString();
                    } catch (e) {
                      childText = '';
                    }
                  }
                  
                  // Arama metni için hem kod hem de açıklama kontrol edilir
                  const searchText = String(option.label || childText);
                  return searchText.toLowerCase().includes(input.toLowerCase());
                }}
                showArrow={true}
                style={{ width: '100%' }}
              >
                {Array.isArray(currAccType === CurrAccType.CUSTOMER ? customers : vendors) && 
                  (currAccType === CurrAccType.CUSTOMER ? customers : vendors).length > 0 ? 
                  (currAccType === CurrAccType.CUSTOMER ? customers : vendors).map(item => {
                    const code = item.customerCode || item.currAccCode || item.code || '';
                    const name = item.customerName || item.currAccDescription || item.name || item.description || `Müşteri ${code}`;
                    const displayText = `${code} - ${name}`;
                    
                    return (
                      <Option 
                        key={code || `acc-${Math.random()}`} 
                        value={code}
                        label={displayText} // Arama için ek bir etiket
                      >
                        <span>
                          <b>{code}</b> - {name}
                        </span>
                      </Option>
                    );
                  }) : <Option key="no-data" value="">Veri bulunamadı</Option>}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="officeCode"
              label="Ofis"
              rules={[{ required: true, message: 'Lütfen ofis seçiniz' }]}
            >
              <Select placeholder="Ofis seçiniz" suffixIcon={undefined}>
                {Array.isArray(offices) && offices.length > 0 ? offices.map(office => (
                  <Option key={office.officeCode || office.code || `office-${Math.random()}`} value={office.officeCode || office.code || ''}>
                    {office.officeName || office.officeDescription || office.name || office.description || office.officeCode || office.code || 'Bilinmeyen'}
                  </Option>
                )) : <Option key="no-office" value="">Ofis bulunamadı</Option>}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="warehouseCode"
              label="Depo"
              rules={[{ required: true, message: 'Lütfen depo seçiniz' }]}
            >
              <Select placeholder="Depo seçiniz" suffixIcon={undefined}>
                {Array.isArray(warehouses) && warehouses.length > 0 ? warehouses.map(warehouse => (
                  <Option key={warehouse.warehouseCode || warehouse.code || `warehouse-${Math.random()}`} value={warehouse.warehouseCode || warehouse.code || ''}>
                    {warehouse.warehouseName || warehouse.warehouseDescription || warehouse.name || warehouse.description || warehouse.warehouseCode || warehouse.code || 'Bilinmeyen'}
                  </Option>
                )) : <Option key="no-warehouse" value="">Depo bulunamadı</Option>}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Fatura Detayları</Divider>
        
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={addInvoiceDetail} style={{ marginRight: '8px' }}>
              Detay Ekle
            </Button>
            <Button 
              type="primary" 
              icon={<BarcodeOutlined />} 
              onClick={() => {
                setBarcodeModalVisible(true);
                // Modal açıldığında input'a odaklan
                setTimeout(() => {
                  if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                  }
                }, 100);
              }}
            >
              Barkod ile Ekle
            </Button>
          </Col>
          <Col>
            <Form.Item
              label="Birim Fiyat"
              tooltip="Birim fiyatları KDV dahil olarak girmek için açın"
              style={{ marginBottom: 0 }}
            >
              <Switch
                checked={isPriceIncludeVat}
                onChange={(checked) => setIsPriceIncludeVat(checked)}
                checkedChildren="KDV Dahil"
                unCheckedChildren="KDV Hariç"
              />
            </Form.Item>
          </Col>
        </Row>
        
        {/* Filtreleme ve Toplu Düzenleme Kontrol Paneli */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input.Search 
              placeholder="Ürün kodu veya açıklaması ile filtrele" 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={16} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              disabled={selectedRowKeys.length === 0}
              onClick={() => {
                // Önce geçici bir değişken oluştur
                let tempBulkPrice = 0;
                
                // Modal açılmadan önce bulkPrice değerini sıfırla
                setBulkPrice(0);
                
                Modal.confirm({
                  title: 'Toplu Fiyat Değiştirme',
                  content: (
                    <div>
                      <p>Seçilen {selectedRowKeys.length} satırın birim fiyatını değiştirmek istediğinize emin misiniz?</p>
                      <p>Yeni birim fiyatı girin:</p>
                      <InputNumber 
                        style={{ width: '100%' }} 
                        placeholder="Yeni birim fiyat" 
                        min={0}
                        defaultValue={0}
                        onChange={(value) => {
                          // Geçici değişkene atama yap
                          tempBulkPrice = value || 0;
                          // State'i de güncelle
                          setBulkPrice(value || 0);
                        }}
                      />
                    </div>
                  ),
                  onOk: () => {
                    // Hem geçici değişkeni hem de state'i kontrol et
                    if (tempBulkPrice <= 0 && bulkPrice <= 0) {
                      message.error('Geçerli bir fiyat girmelisiniz!');
                      return Promise.reject('Geçerli fiyat girilmedi');
                    }
                    
                    // Kullanılacak fiyatı belirle
                    const finalPrice = tempBulkPrice > 0 ? tempBulkPrice : bulkPrice;
                    
                    console.log('Fiyat güncelleniyor:', {
                      tempBulkPrice,
                      bulkPrice,
                      finalPrice
                    });
                    
                    // Seçili satırların fiyatlarını güncelle
                    const updatedDetails = invoiceDetails.map(detail => {
                      if (selectedRowKeys.includes(detail.id)) {
                        // Sadece birim fiyatı güncelle
                        const updatedDetail = {
                          ...detail,
                          unitPrice: finalPrice
                        };
                        
                        // Satır toplamlarını yeniden hesapla
                        const quantity = updatedDetail.quantity || 0;
                        const discountRate = updatedDetail.discountRate || 0;
                        const vatRate = updatedDetail.vatRate || 0;
                        
                        // Toplam tutarı hesapla (miktar * birim fiyat)
                        const totalAmount = quantity * finalPrice;
                        updatedDetail.totalAmount = totalAmount;
                        
                        // İskonto tutarını hesapla
                        const discountAmount = totalAmount * (discountRate / 100);
                        updatedDetail.discountAmount = discountAmount;
                        
                        // Alt toplamı hesapla (toplam - iskonto)
                        const subtotalAmount = totalAmount - discountAmount;
                        updatedDetail.subtotalAmount = subtotalAmount;
                        
                        // KDV tutarını hesapla
                        const vatAmount = subtotalAmount * (vatRate / 100);
                        updatedDetail.vatAmount = vatAmount;
                        
                        // Net tutarı hesapla (alt toplam + KDV)
                        const netAmount = subtotalAmount + vatAmount;
                        updatedDetail.netAmount = netAmount;
                        
                        return updatedDetail;
                      }
                      return detail;
                    });
                    
                    setInvoiceDetails(updatedDetails);
                    
                    // Fatura dip toplamlarını güncelle
                    calculateInvoiceTotals(updatedDetails);
                    
                    setSelectedRowKeys([]);
                    message.success(`${selectedRowKeys.length} satırın fiyatı ${finalPrice} olarak güncellendi!`);
                    return Promise.resolve();
                  },
                  onCancel: () => {
                    // İptal edildiğinde bulkPrice'i sıfırla
                    setBulkPrice(0);
                  }
                });
              }}
            >
              Seçili Satırların Fiyatını Değiştir
            </Button>
          </Col>
        </Row>
        
        <Table
          dataSource={invoiceDetails.filter(detail => 
            filterText ? 
              (detail.itemCode?.toLowerCase().includes(filterText.toLowerCase()) ||
               detail.productDescription?.toLowerCase().includes(filterText.toLowerCase()))
              : true
          )}
          rowKey="id"
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[])
          }}
          size="small"
          bordered
        >
          <Table.Column 
            title="Ürün Kodu" 
            dataIndex="itemCode" 
            key="itemCode"
            width={120} // 8 hane için
            render={(value, record, index) => (
              <Select
                showSearch
                value={value}
                style={{ width: '100%' }}
                placeholder="Ürün seçin"
                loading={loadingProducts}
                optionFilterProp="children"
                dropdownMatchSelectWidth={true}
                maxTagCount={4}
                filterOption={(input, option) => {
                  if (!input || input.length < 3 || !option || !option.children) return true; // 3 karakterden az ise tümünü göster
                  
                  // Option içeriğini string'e çevir
                  let childText = '';
                  if (typeof option.children === 'string') {
                    childText = option.children;
                  } else if (React.isValidElement(option.children)) {
                    try {
                      childText = JSON.stringify(option.children);
                    } catch (e) {
                      childText = '';
                    }
                  } else {
                    try {
                      childText = option.children.toString();
                    } catch (e) {
                      childText = '';
                    }
                  }
                  
                  return childText.toLowerCase().includes(input.toLowerCase());
                }}
                onChange={(value) => updateInvoiceDetail(index, 'itemCode', value)}
              >
                {Array.isArray(products) && products.length > 0 ? (
                  products.slice(0, 4).map(product => (
                    <Option key={product.productCode} value={product.productCode}>
                      {product.productCode}
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>
                    Ürün bulunamadı
                  </Option>
                )}
              </Select>
            )}
          />
          <Table.Column 
            title="Ürün Açıklaması" 
            dataIndex="productDescription" 
            key="productDescription"
            width={200} // 200px olsun
            render={(value, record, index) => (
              <Input 
                value={value} 
                disabled={true}
                style={{ width: '100%' }}
              />
            )}
          />
          <Table.Column 
            title="Renk" 
            dataIndex="colorDescription" 
            key="colorDescription"
            width={100} // 10 hane için
            render={(value, record, index) => (
              <Input 
                value={value} 
                disabled={true}
                style={{ width: '100%' }}
                placeholder="-"
              />
            )}
          />
          <Table.Column 
            title="Beden" 
            dataIndex="itemDim1Code" 
            key="itemDim1Code"
            width={60} // 4 hane için
            render={(value, record, index) => (
              <Input 
                value={value} 
                disabled={true}
                style={{ width: '100%' }}
                placeholder="-"
              />
            )}
          />
          <Table.Column 
            title="Birim" 
            dataIndex="unitOfMeasureCode" 
            key="unitOfMeasureCode"
            width={120}
            render={(value, record, index) => (
              <Select
                value={value}
                style={{ width: '100%' }}
                suffixIcon={undefined} // showArrow yerine suffixIcon kullanılıyor
                onChange={(value) => {
                  // Birim değiştiğinde, miktarı da kontrol et ve gerekirse düzelt
                  const updatedDetails = [...invoiceDetails];
                  const detail = updatedDetails[index];
                  
                  // Birim değerini güncelle
                  detail.unitOfMeasureCode = value as string;
                  
                  // Eğer yeni birim ADET veya AD ise ve miktar küsurat içeriyorsa, tam sayıya yuvarla
                  if ((value === 'ADET' || value === 'AD') && detail.quantity && !Number.isInteger(detail.quantity)) {
                    detail.quantity = Math.round(detail.quantity);
                  }
                  
                  // Detayları güncelle
                  setInvoiceDetails(updatedDetails);
                }}
              >
                {units.map(unit => (
                  <Option key={unit.unitCode} value={unit.unitCode}>{unit.unitCode}</Option>
                ))}
              </Select>
            )}
          />
          <Table.Column 
            title="Miktar" 
            dataIndex="quantity" 
            key="quantity"
            width={120}
            render={(value, record, index) => {
              // Birim türüne göre step ve precision değerlerini belirle
              const isUnitAdet = record.unitOfMeasureCode === 'ADET' || record.unitOfMeasureCode === 'AD';
              return (
                <InputNumber 
                  value={value} 
                  min={isUnitAdet ? 1 : 0.01} 
                  step={isUnitAdet ? 1 : 0.01}
                  precision={isUnitAdet ? 0 : 2}
                  controls={false}
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    // Eğer birim ADET ise ve küsurat girilmişse, tam sayıya yuvarla
                    if (isUnitAdet && value && !Number.isInteger(value)) {
                      value = Math.round(value);
                    }
                    updateInvoiceDetail(index, 'quantity', value);
                  }}
                />
              );
            }}
          />
          <Table.Column 
            title={`Birim Fiyat ${isPriceIncludeVat ? '(KDV Dahil)' : '(KDV Hariç)'}`} 
            dataIndex="unitPrice" 
            key="unitPrice"
            width={150}
            render={(value, record, index) => (
              <InputNumber 
                value={value} 
                min={0} 
                step={0.01}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                onChange={(value) => updateInvoiceDetail(index, 'unitPrice', value)}
              />
            )}
          />
          <Table.Column 
            title="KDV (%)" 
            dataIndex="vatRate" 
            key="vatRate"
            width={100}
            render={(value, record, index) => (
              <Select
                value={value}
                style={{ width: '100%' }}
                suffixIcon={undefined} // showArrow yerine suffixIcon kullanılıyor
                onChange={(value) => updateInvoiceDetail(index, 'vatRate', value)}
              >
                <Option value={0}>%0</Option>
                <Option value={1}>%1</Option>
                <Option value={8}>%8</Option>
                <Option value={10}>%10</Option>
                <Option value={18}>%18</Option>
                <Option value={20}>%20</Option>
              </Select>
            )}
          />
          <Table.Column 
            title="İskonto (%)" 
            dataIndex="discountRate" 
            key="discountRate"
            width={100}
            render={(value, record, index) => (
              <InputNumber 
                value={value} 
                min={0} 
                max={100}
                controls={false}
                style={{ width: '100%' }}
                onChange={(value) => updateInvoiceDetail(index, 'discountRate', value)}
              />
            )}
          />
          <Table.Column 
            title="Toplam Tutar" 
            dataIndex="totalAmount"
            key="totalAmount"
            width={120}
            render={(value, record) => (
              <span>
                {(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            )}
          />
          <Table.Column 
            title="İskonto Tutarı" 
            dataIndex="discountAmount"
            key="discountAmount"
            width={120}
            render={(value, record) => (
              <span>
                {(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            )}
          />
          {/* Alt Toplam sütunu gizlendi */}
          <Table.Column 
            title="KDV Tutarı" 
            dataIndex="vatAmount"
            key="vatAmount"
            width={120}
            render={(value, record) => (
              <span>
                {(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            )}
          />
          <Table.Column 
            title="Net Tutar" 
            dataIndex="netAmount"
            key="netAmount"
            width={120}
            render={(value, record) => (
              <span>
                {(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            )}
          />
          <Table.Column 
            title="İşlemler" 
            key="actions"
            width={80}
            render={(text, record, index) => (
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => removeInvoiceDetail(index)}
              />
            )}
          />
        </Table>

        <Divider />

        {/* Fatura Dip Toplam Alanı */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Card title="Fatura Toplamları" size="small">
              <Row gutter={[16, 8]}>
                <Col span={12}><strong>Toplam:</strong></Col>
                <Col span={12}>
                  <Form.Item name="totalAmount" noStyle>
                    <Input readOnly addonAfter="TRY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 8]}>
                <Col span={12}><strong>İskonto:</strong></Col>
                <Col span={12}>
                  <Form.Item name="discountAmount" noStyle>
                    <Input readOnly addonAfter="TRY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 8]}>
                <Col span={12}><strong>Alt Toplam:</strong></Col>
                <Col span={12}>
                  <Form.Item name="subtotalAmount" noStyle>
                    <Input readOnly addonAfter="TRY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 8]}>
                <Col span={12}><strong>KDV:</strong></Col>
                <Col span={12}>
                  <Form.Item name="vatAmount" noStyle>
                    <Input readOnly addonAfter="TRY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 8]}>
                <Col span={12}><strong>Net Tutar:</strong></Col>
                <Col span={12}>
                  <Form.Item name="netAmount" noStyle>
                    <Input readOnly addonAfter="TRY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={12} lg={16}>
            <Form.Item
              name="notes"
              label="Notlar"
            >
              <Input.TextArea rows={4} placeholder="Fatura ile ilgili notlar" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        
        {/* Ödeme Şekli Seçenekleri */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Form.Item name="paymentType" label="Ödeme Şekli">
              <Radio.Group 
                onChange={(e) => {
                  setPaymentType(e.target.value);
                  // Peşin seçildiğinde hemen modalı göster
                  if (e.target.value === 'cash') {
                    setShowCashPaymentModal(true);
                  }
                }}
                value={paymentType}
              >
                <Radio value="cash">
                  Peşin
                </Radio>
                <Radio value="credit">
                  Vadeli
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Col>
            <Button type="primary" htmlType="submit" loading={loading}>
              Fatura Oluştur
            </Button>
          </Col>
        </Row>
        
        {/* Peşin Ödeme Modalı */}
        <Modal
          title="Ödeme Planı"
          visible={showCashPaymentModal}
          onOk={() => {
            setShowCashPaymentModal(false);
            message.success('Peşin ödeme başarıyla kaydedildi!');
          }}
          onCancel={() => setShowCashPaymentModal(false)}
          width={800}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Üst Tablo - Ödeme Planı */}
            <Table 
              size="small"
              pagination={false}
              bordered
              dataSource={[{ key: '1', odemeTip: '1', paraBirimi: 'TRY', dovizKuru: '1.0000', tutar: form.getFieldValue('netAmount') || '0.00', tutarTL: form.getFieldValue('netAmount') || '0.00', odemeArac: '' }]}
              columns={[
                { title: 'Ödeme Tip', dataIndex: 'odemeTip', key: 'odemeTip', width: 80 },
                { title: 'Para Birimi', dataIndex: 'paraBirimi', key: 'paraBirimi', width: 100 },
                { title: 'Döviz Kuru', dataIndex: 'dovizKuru', key: 'dovizKuru', width: 100 },
                { title: 'Tutar', dataIndex: 'tutar', key: 'tutar', width: 100, align: 'right' as 'right' },
                { title: 'Tutar (TL)', dataIndex: 'tutarTL', key: 'tutarTL', width: 100, align: 'right' as 'right' },
                { title: 'Ödeme Araç', dataIndex: 'odemeArac', key: 'odemeArac' },
              ]}
              style={{ marginBottom: 16 }}
            />
            
            {/* Form Alanları */}
            <div style={{ display: 'flex', marginBottom: 16 }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <Form layout="vertical">
                  <Form.Item label="Nakit Kasa Hesap Kodu">
                    <Select style={{ width: '100%' }} defaultValue="">
                      <Select.Option value="">Seçiniz</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Para Birimi">
                    <Select style={{ width: '100%' }} defaultValue="TRY">
                      <Select.Option value="TRY">TRY</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Döviz Kuru">
                    <InputNumber style={{ width: '100%' }} defaultValue={1.0000} disabled />
                  </Form.Item>
                  <Form.Item label="Ödeme Açıklaması">
                    <Input.TextArea rows={2} placeholder="Açıklama girin" />
                  </Form.Item>
                </Form>
              </div>
              
              {/* Sağ Taraf - Toplam Bilgileri */}
              <div style={{ width: 300, border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><strong>Toplam:</strong></span>
                  <span style={{ color: 'red' }}>{form.getFieldValue('netAmount') || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><strong>Ödenen Tutar:</strong></span>
                  <span style={{ color: 'green' }}>0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><strong>Para Üstü:</strong></span>
                  <span style={{ color: 'green' }}>0.00</span>
                </div>
              </div>
            </div>
            
            {/* Alt Tablo - Vade Bilgileri */}
            <Table 
              size="small"
              pagination={false}
              bordered
              dataSource={[{ key: '1', vadeTarihi: dayjs().format('DD.MM.YYYY'), tutar: form.getFieldValue('netAmount') || '0.00', borcNedeni: 'Fatura' }]}
              columns={[
                { title: 'Ödeme Tip', dataIndex: 'odemeTip', key: 'odemeTip', width: 30, render: () => <span>✓</span> },
                { title: 'Vade Tarihi', dataIndex: 'vadeTarihi', key: 'vadeTarihi', width: 120 },
                { title: 'Para Birimi', dataIndex: 'paraBirimi', key: 'paraBirimi', width: 100, render: () => 'TRY' },
                { title: 'Tutar', dataIndex: 'tutar', key: 'tutar', width: 100, align: 'right' as 'right' },
                { title: 'Tutar (TL)', dataIndex: 'tutarTL', key: 'tutarTL', width: 100, align: 'right' as 'right', render: (_, record) => record.tutar },
                { title: 'Borç Nedeni', dataIndex: 'borcNedeni', key: 'borcNedeni' },
              ]}
            />
          </div>
        </Modal>
      </Form>
    </Card>
  );
};

// Barkod modalı bileşeni
const BarcodeModal = ({
  visible,
  onClose,
  barcodeInput,
  setBarcodeInput,
  onSearch,
  loading,
  inputRef,
  productVariants,
  scannedItems,
  addAllToInvoice,
  isPriceIncludeVat,
  getProductPrice,
  inventoryStock,
  loadingInventory,
}: {
  visible: boolean;
  onClose: () => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  inputRef: React.RefObject<any>;
  productVariants: ProductVariant[];
  scannedItems: { variant: ProductVariant; quantity: number }[];
  addAllToInvoice: () => void;
  isPriceIncludeVat: boolean;
  getProductPrice: (variant: ProductVariant) => Promise<void>;
  inventoryStock: InventoryStock[];
  loadingInventory: boolean;
}) => {
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkVatRate, setBulkVatRate] = useState<number>(18); // Varsayılan KDV oranı
  // Toplu fiyat güncelleme fonksiyonu
  const updateAllPrices = () => {
    if (bulkPrice === null) {
      message.error('Lütfen geçerli bir fiyat girin');
      return;
    }

    // Tüm ürünlerin fiyatını güncelle
    scannedItems.forEach(item => {
      // KDV dahil fiyat girilmişse, KDV hariç fiyata çevir
      let newPrice = bulkPrice;
      if (isPriceIncludeVat) {
        newPrice = bulkPrice / (1 + (bulkVatRate / 100));
      }
      item.variant.salesPrice1 = newPrice;
      item.variant.vatRate = bulkVatRate;
    });

    message.success('Tüm ürünlerin fiyatları güncellendi');
  };

  return (
    <Modal
      title="Barkod Tarama"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          İptal
        </Button>,
        <Button key="submit" type="primary" onClick={addAllToInvoice}>
          Tamamla ve Faturaya Ekle
        </Button>
      ]}
      width={800}
    >
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            placeholder="Barkod girin veya okutun"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onPressEnter={onSearch}
            ref={inputRef}
            suffix={loading ? <Spin size="small" /> : <ScanOutlined />}
            autoFocus
          />
        </Col>
        <Col>
          <Button type="primary" onClick={onSearch} loading={loading}>
            Ara
          </Button>
        </Col>
      </Row>

      {/* Toplu fiyat güncelleme alanı */}
      {scannedItems.length > 0 && (
        <Card title="Toplu Fiyat Güncelleme" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Form.Item label="Birim Fiyat" style={{ marginBottom: 0 }}>
                <InputNumber
                  placeholder="Fiyat girin"
                  value={bulkPrice}
                  onChange={(value) => setBulkPrice(value)}
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="KDV (%)" style={{ marginBottom: 0 }}>
                <Select
                  value={bulkVatRate}
                  onChange={(value) => setBulkVatRate(value)}
                  style={{ width: '100%' }}
                >
                  <Option value={0}>%0</Option>
                  <Option value={1}>%1</Option>
                  <Option value={8}>%8</Option>
                  <Option value={10}>%10</Option>
                  <Option value={18}>%18</Option>
                  <Option value={20}>%20</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Switch
                  checked={isPriceIncludeVat}
                  disabled={true}
                  checkedChildren="KDV Dahil"
                  unCheckedChildren="KDV Hariç"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={updateAllPrices}>
                Uygula
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Çoklu varyant bulunduğunda gösterilecek liste */}
      {productVariants.length > 0 && (
        <>
          <Divider orientation="left">Bulunan Ürünler</Divider>
          <List
            loading={loading}
            dataSource={productVariants}
            renderItem={(item) => (
              <List.Item
                key={item.barcode}
                actions={[
                  <Button type="link" onClick={async () => {
                    // Ürün fiyatını fiyat listesinden getir ve ekle
                    await getProductPrice(item);
                  }}>
                    Listeye Ekle
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.productDescription}
                  description={
                    <>
                      <div><strong>Ürün Kodu:</strong> {item.productCode}</div>
                      <div><strong>Barkod:</strong> {item.barcode}</div>
                      <div><strong>Renk:</strong> {item.colorDescription || '-'}</div>
                      <div><strong>Beden:</strong> {item.itemDim1Code || '-'}</div>
                      <div><strong>Fiyat:</strong> {item.salesPrice1.toFixed(2)} TL</div>
                    </>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'Ürün bulunamadı' }}
          />
        </>
      )}

      {/* Envanter/Stok Bilgisi */}
      {inventoryStock.length > 0 && (
        <>
          <Divider orientation="left">
            <InfoCircleOutlined /> Envanter/Stok Bilgisi
          </Divider>
          <Spin spinning={loadingInventory}>
            <Card size="small">
              <Table
                dataSource={inventoryStock}
                rowKey="usedBarcode"
                columns={[
                  {
                    title: 'Ürün Açıklaması',
                    dataIndex: 'itemDescription',
                    key: 'itemDescription',
                    ellipsis: true,
                  },
                  {
                    title: 'Renk',
                    dataIndex: 'colorDescription',
                    key: 'colorDescription',
                    render: (text: string) => text || '-'
                  },
                  {
                    title: 'Beden',
                    dataIndex: 'itemDim1Code',
                    key: 'itemDim1Code',
                    render: (text: string) => text || '-'
                  },
                  {
                    title: 'Stok Miktarı',
                    dataIndex: 'qty',
                    key: 'qty',
                    render: (qty: number) => (
                      <Tag color={qty > 0 ? 'green' : 'red'}>
                        {qty.toFixed(2)}
                      </Tag>
                    )
                  },
                  {
                    title: 'Birim',
                    dataIndex: 'unitOfMeasureCode',
                    key: 'unitOfMeasureCode',
                  },
                  {
                    title: 'Durum',
                    key: 'status',
                    render: (_: any, record: InventoryStock) => (
                      <>
                        {record.variantIsBlocked && (
                          <Tag color="red">Bloke</Tag>
                        )}
                        {record.qty <= 0 && (
                          <Tag color="orange">Stok Yok</Tag>
                        )}
                        {!record.variantIsBlocked && record.qty > 0 && (
                          <Tag color="green">Satılabilir</Tag>
                        )}
                      </>
                    )
                  },
                ]}
                pagination={false}
                size="small"
                locale={{ emptyText: 'Stok bilgisi bulunamadı' }}
              />
            </Card>
          </Spin>
        </>
      )}

      {/* Taranan ürünlerin listesi */}
      <Divider orientation="left">Taranan Ürünler ({scannedItems.length})</Divider>
      <Table
        dataSource={scannedItems.map((item, index) => ({
          key: index,
          ...item
        }))}
        columns={[
          {
            title: 'Ürün Kodu',
            dataIndex: ['variant', 'productCode'],
            key: 'productCode',
          },
          {
            title: 'Ürün Adı',
            dataIndex: ['variant', 'productDescription'],
            key: 'productDescription',
            ellipsis: true,
          },
          {
            title: 'Renk',
            dataIndex: ['variant', 'colorDescription'],
            key: 'colorDescription',
            render: (text) => text || '-'
          },
          {
            title: 'Beden',
            dataIndex: ['variant', 'itemDim1Code'],
            key: 'itemDim1Code',
            render: (text) => text || '-'
          },
          {
            title: 'Miktar',
            dataIndex: 'quantity',
            key: 'quantity',
          },
          {
            title: 'Birim Fiyat',
            dataIndex: ['variant', 'salesPrice1'],
            key: 'salesPrice1',
            render: (price) => `${price.toFixed(2)} TL`
          },
        ]}
        pagination={false}
        size="small"
        locale={{ emptyText: 'Henüz ürün taranmadı' }}
      />
    </Modal>
  );
};

export default InvoiceForm;