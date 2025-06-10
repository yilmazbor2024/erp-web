import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Form, Button, Tabs, message, Row, Col, Input, InputRef, Radio, InputNumber, Select, Modal } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined, InfoCircleOutlined, BarcodeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import { exchangeRateApi, ExchangeRateSource } from '../../services/exchangeRateApi';
import { v4 as uuidv4 } from 'uuid';
import { AuthProvider } from '../../contexts/AuthContext';

// API Base URL
const API_BASE_URL = 'http://localhost:5180';

// Bileşenler
import InvoiceHeader from './InvoiceHeader';
import InvoiceLines from './InvoiceLines';
import InvoiceSummary from './InvoiceSummary';
import BarcodeModal from '../common/BarcodeModal';
import CashPaymentModal from '../payment/CashPaymentModal';
import CashPaymentForm from '../payment/CashPaymentForm';

// Servisler ve tipler
import invoiceApi from '../../services/invoiceApi';
import inventoryApi, { InventoryStock } from '../../services/inventoryApi';
import { customerApi, vendorApi, officeApi, warehouseApi, currencyApi } from '../../services/entityApi';
import productApi, { ProductVariant } from '../../services/productApi';
import productPriceListApi from '../../services/productPriceListApi';
import taxApi, { TaxType } from '../../services/taxApi';
import { InvoiceType } from '../../types/invoice';

// Enum ve Tipler
enum CurrAccType {
  VENDOR = 1,
  CUSTOMER = 3
}

// Fatura tipi açıklamaları
const invoiceTypeDescriptions = {
  [InvoiceType.WHOLESALE_SALES]: 'Toptan Satış Faturası',
  [InvoiceType.WHOLESALE_PURCHASE]: 'Toptan Alış Faturası',
  [InvoiceType.EXPENSE_SALES]: 'Masraf Satış Faturası',
  [InvoiceType.EXPENSE_PURCHASE]: 'Masraf Alış Faturası'
};

// Fatura detay arayüzü
interface InvoiceDetail {
  id: string;
  itemCode: string;
  quantity: number;
  unitOfMeasureCode: string;
  unitPrice: number;
  vatRate: number;
  description?: string;
  discountRate?: number;
  productDescription?: string;
  totalAmount?: number;
  discountAmount?: number;
  subtotalAmount?: number;
  vatAmount?: number;
  netAmount?: number;
  // Ürün varyant bilgileri
  colorCode?: string;
  colorDescription?: string;
  itemDim1Code?: string;
  itemDim2Code?: string;
  itemDim3Code?: string;
  currencyCode?: string;
  exchangeRate?: number;
  tryEquivalent?: number; // TL karşılığı
}

// Backend'e gönderilecek fatura detayı formatı
interface InvoiceDetailRequest {
  itemCode: string;
  // Ürün varyant bilgileri
  colorCode?: string;
  itemDim1Code?: string;
  itemDim2Code?: string;
  itemDim3Code?: string;
  quantity: number;
  unitOfMeasureCode: string;
  unitPrice: number;
  vatRate: number;
  discountRate: number;
  description: string;
  totalAmount: number;
  discountAmount: number;
  subtotalAmount: number;
  vatAmount: number;
  netAmount: number;
  currencyCode: string;
  exchangeRate: number;
}

// API için istek tipi
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
  totalAmount?: number;
  discountAmount?: number;
  subtotalAmount?: number;
  vatAmount?: number;
  netAmount?: number;
  exchangeRate?: number; // TL karşılığı (kur) değeri
  tryEquivalentTotal?: number; // Toplam tutarın TL karşılığı
  shippingPostalAddressID?: string; // Teslimat adresi ID'si
  billingPostalAddressID?: string;   // Fatura adresi ID'si
  ShipmentMethodCode?: string;       // Sevkiyat yöntemi kodu
  details: InvoiceDetailRequest[];
}

// Bileşen props
interface InvoiceFormProps {
  type?: InvoiceType;
  onSuccess?: (data: any) => void;
}

// const { TabPane } = Tabs; // Artık kullanılmıyor

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  type, 
  onSuccess 
}) => {
  // URL parametrelerini al ve navigasyon için hook
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlType = queryParams.get('type');
  
  // URL'den gelen parametreye göre fatura tipini belirleyen fonksiyon
  const determineInvoiceType = (): InvoiceType => {
    if (urlType) {
      switch(urlType) {
        case 'purchase':
          return InvoiceType.WHOLESALE_PURCHASE;
        case 'sales':
          return InvoiceType.WHOLESALE_SALES;
        case 'expense-sales':
          return InvoiceType.EXPENSE_SALES;
        case 'expense-purchase':
          return InvoiceType.EXPENSE_PURCHASE;
        default:
          return type || InvoiceType.WHOLESALE_SALES;
      }
    }
    return type || InvoiceType.WHOLESALE_SALES;
  };
  
  // Form nesnesi oluştur
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  
  // Fatura tipini belirle ve state olarak sakla
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>(determineInvoiceType());
  
  // Form başlangıç değerlerini ayarla
  useEffect(() => {
    // Form için dayjs nesnesi kullanıyoruz
    const today = dayjs();
    
    // Form değerlerini ayarla - React'in render döngüsünde güvenli bir şekilde
    form.setFieldsValue({
      invoiceDate: today,
      docCurrencyCode: 'TRY',
      exchangeRate: 1,
      exchangeRateSource: 'TCMB',
      officeCode: 'M',
      warehouseCode: '101',
      currencyCode: 'TRY',
      currency: 'TRY',
      invoiceType: selectedInvoiceType,
      paymentType: '1',
      discountType: '1',
      discountRate: 0,
      vatRate: 18,
      isPriceIncludeVat: false
    });
  }, [form, selectedInvoiceType]);
  
  // Veri yükleme için useEffect
  useEffect(() => {
    // Sayfa yüklenirken verileri yükle
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sekme kontrolü için state
  const [activeTab, setActiveTab] = useState<string>('1'); // 1: BAŞLIK, 
  const [headerFormValid, setHeaderFormValid] = useState<boolean>(false); // Form validasyonu için state - başlangıçta kesinlikle false olarak ayarla
  
  // Fatura tipini belirle
  // Sekme kontrolü için state
  
  // Veri state'leri
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
  
  // Fatura tipine göre müşteri/tedarikçi tipini belirle
  const [currAccType, setCurrAccType] = useState<CurrAccType>(
    selectedInvoiceType === InvoiceType.WHOLESALE_PURCHASE || selectedInvoiceType === InvoiceType.EXPENSE_PURCHASE
      ? CurrAccType.VENDOR 
      : CurrAccType.CUSTOMER
  );
  const [inventoryStock, setInventoryStock] = useState<InventoryStock[]>([]);
  
  // Yükleme durumları
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [loadingOffices, setLoadingOffices] = useState<boolean>(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState<boolean>(false);
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState<boolean>(false);
  
  // Vergi tipleri
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [loadingTaxTypes, setLoadingTaxTypes] = useState<boolean>(false);
  
  // Vergi tipi modu (normal veya vergisiz)
  const [taxTypeMode, setTaxTypeMode] = useState<string>('normal');
  
  // Barkod tarama ile ilgili state'ler
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState<boolean>(false);
  const [scannedItems, setScannedItems] = useState<{variant: ProductVariant; quantity: number}[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(false);
  const barcodeInputRef = useRef<InputRef>(null);
  
  // Nakit ödeme modalı için state
  const [showCashPaymentModal, setShowCashPaymentModal] = useState<boolean>(false);
  const [savedInvoiceData, setSavedInvoiceData] = useState<any>(null);
  
  // Fatura seçenekleri
  const [isReturn, setIsReturn] = useState<boolean>(false);
  const [isEInvoice, setIsEInvoice] = useState<boolean>(false);
  
  // Para birimi ve döviz kuru state'leri
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>('TRY');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [exchangeRateSource, setExchangeRateSource] = useState<ExchangeRateSource>(ExchangeRateSource.CENTRAL_BANK);
  
  // KDV dahil/hariç seçeneği için state
  const [isPriceIncludeVat, setIsPriceIncludeVat] = useState<boolean>(false);
  
  // Toplam tutar state'leri için tryEquivalentTotal ekleyelim
  const [tryEquivalentTotal, setTryEquivalentTotal] = useState<number>(0);
  
  // Nakit tahsilat modal kontrolü için state
  
  // Form bağlantısını kontrol et
  useEffect(() => {
    console.log('Form nesnesi kontrolü:', form);
    if (!form) {
      console.error('Form nesnesi bulunamadı!');
    }
  }, [form]);

  // Döviz kurlarını yükle
  const loadExchangeRates = async () => {
    try {
      setLoadingRates(true);
      
      // Seçili para birimi al
      const currencyCode = form.getFieldValue('docCurrencyCode');
      
      // Eğer para birimi boş veya null ise, kur değerini 0 olarak ayarla
      if (!currencyCode) {
        setExchangeRate(0);
        form.setFieldsValue({ exchangeRate: 0 });
        return;
      }
      
      // Eğer para birimi TRY ise, kur değerini 1 olarak ayarla
      if (currencyCode === 'TRY') {
        setExchangeRate(1);
        form.setFieldsValue({ exchangeRate: 1 });
        return;
      }
      
      // Tüm döviz kurlarını al
      const rates = await exchangeRateApi.getLatestExchangeRates(exchangeRateSource);
      
      // Döviz kurlarını bir map'e dönüştür
      const ratesMap: Record<string, number> = {};
      rates.forEach(rate => {
        if (rate.relationCurrencyCode === 'TRY') {
          // Satış kuru kullan (banknoteSellingRate veya freeMarketSellingRate)
          const sellingRate = exchangeRateSource === ExchangeRateSource.CENTRAL_BANK
            ? rate.banknoteSellingRate
            : rate.freeMarketSellingRate;
            
          // Eğer kur değeri boş veya null ise 0 olarak ayarla
          ratesMap[rate.currencyCode] = sellingRate !== null && sellingRate !== undefined ? sellingRate : 0;
        }
      });
      
      setExchangeRates(ratesMap);
      
      // Seçili para birimi varsa, kur değerini güncelle
      if (currencyCode && ratesMap[currencyCode] !== undefined) {
        const rate = ratesMap[currencyCode];
        setExchangeRate(rate);
        form.setFieldsValue({ exchangeRate: rate });
        handleExchangeRateChange(rate);
      } else {
        // Eğer para birimi için kur bulunamazsa, 0 olarak ayarla
        setExchangeRate(0);
        form.setFieldsValue({ exchangeRate: 0 });
      }
    } catch (error) {
      console.error('Döviz kurları yüklenirken hata oluştu:', error);
      message.error('Döviz kurları yüklenirken bir hata oluştu');
      // Hata durumunda da 0 olarak ayarla
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
    } finally {
      setLoadingRates(false);
    }
  };
  
  // Bileşen yüklendiğinde ve döviz kuru kaynağı değiştiğinde döviz kurlarını yükle
  useEffect(() => {
    loadExchangeRates();
  }, [exchangeRateSource]);
  
  // Para birimi değiştiğinde çalışacak fonksiyon
  const handleCurrencyChange = async (currencyCode: string) => {
    console.log('------ PARA BİRİMİ DEĞİŞİKLİĞİ BAŞLADI ------');
    console.log('Para birimi değişti:', currencyCode);
    setCurrentCurrencyCode(currencyCode);
    form.setFieldsValue({ 
      currencyCode,
      docCurrencyCode: currencyCode // docCurrencyCode'u da güncelle
    });
    
    // Para birimi değiştiğinde döviz kurunu güncelle
    try {
      const invoiceDate = form.getFieldValue('invoiceDate');
      console.log('Para birimi değişti - Fatura tarihi:', invoiceDate ? invoiceDate.format('YYYY-MM-DD') : 'Belirtilmemiş');
      
      // Önce döviz kurunu güncelle
      console.log('Para birimi değişti - Döviz kuru güncelleniyor...');
      await loadExchangeRates();
      const currentRate = form.getFieldValue('exchangeRate');
      console.log('Para birimi değişti - Döviz kuru güncellendi:', currentRate);
      
      // Para birimi değiştiğinde her zaman tüm satırların para birimini güncelle
      if (Object.keys(exchangeRates).length > 0 || currencyCode === 'TRY') {
        // Tüm satırların para birimini güncelle
        console.log('Para birimi değişti - Satırlar güncelleniyor...');
        updatePricesWithExchangeRate(currencyCode);
        
        // Satırları ve toplamları güncelle
        const updatedDetails = invoiceDetails.map(detail => ({
          ...detail,
          currencyCode: currencyCode
        }));
        
        setInvoiceDetails(updatedDetails);
        console.log('Para birimi değişti - Satırlar güncellendi:', updatedDetails.length, 'satır');
        
        // Toplamları güncelle
        console.log('Para birimi değişti - Toplamlar güncelleniyor...');
        updateTotals(updatedDetails);
        console.log('Para birimi değişti - Toplamlar güncellendi:', {
          toplam: totalAmount,
          indirim: discountAmount,
          araToplam: subtotalAmount,
          kdv: vatAmount,
          net: netAmount
        });
      }
      console.log('------ PARA BİRİMİ DEĞİŞİKLİĞİ TAMAMLANDI ------');
    } catch (error) {
      console.error('Para birimi değiştiğinde döviz kuru güncellenirken hata oluştu:', error);
      message.error('Döviz kuru güncellenirken bir hata oluştu');
    }
  };
  
  // Döviz kuru değiştiğinde çalışacak fonksiyon
  const handleExchangeRateChange = (rate: number) => {
    setExchangeRate(rate);
    form.setFieldsValue({ exchangeRate: rate });
    
    // Döviz kuru değiştiğinde tüm satırların TL karşılığını güncelle
    if (invoiceDetails.length > 0) {
      const currencyCode = form.getFieldValue('docCurrencyCode') || 'TRY';
      
      // Eğer TRY dışında bir para birimi kullanılıyorsa
      if (currencyCode !== 'TRY') {
        const updatedDetails = invoiceDetails.map(detail => {
          // Satırın TL karşılığını güncelle
          const netAmount = detail.netAmount || 0;
          return {
            ...detail,
            exchangeRate: rate,
            tryEquivalent: netAmount * rate
          };
        });
        
        setInvoiceDetails(updatedDetails);
        updateTotals(updatedDetails);
      }
    }
  };
  
  // Döviz kuru kaynağı değiştiğinde çalışacak fonksiyon
  const handleExchangeRateSourceChange = (e: RadioChangeEvent) => {
    const source = e.target.value as ExchangeRateSource;
    setExchangeRateSource(source);
    form.setFieldsValue({ exchangeRateSource: source });
    
    // Döviz kuru kaynağı değiştiğinde güncel kurları yükle
    if (currentCurrencyCode !== 'TRY') {
      const invoiceDate = form.getFieldValue('invoiceDate');
      if (invoiceDate) {
        loadExchangeRates();
      }
    }
  };
  
  // Döviz kuru ile fiyatları güncelle
  const updatePricesWithExchangeRate = (currencyCode: string) => {
    console.log('updatePricesWithExchangeRate çağrıldı:', currencyCode);
    // TRY için kur her zaman 1'dir
    let rate = 1;
    
    // TRY dışında bir para birimi için kur bilgisini al
    if (currencyCode !== 'TRY') {
      if (!exchangeRates[currencyCode]) {
        // Kur bilgisi yoksa işlem yapma
        message.error(`${currencyCode} için döviz kuru bilgisi bulunamadı!`);
        return;
      }
      rate = exchangeRates[currencyCode];
    }
    
    if (invoiceDetails.length > 0) {
      const updatedDetails = invoiceDetails.map(detail => {
        // Mevcut satırın para birimi
        const detailCurrency = detail.currencyCode || 'TRY';
        let newUnitPrice = detail.unitPrice;
        
        if (detailCurrency !== currencyCode) {
          if (detailCurrency === 'TRY' && currencyCode !== 'TRY') {
            // TL'den yabancı para birimine çevirme
            newUnitPrice = detail.unitPrice / rate;
          } else if (detailCurrency !== 'TRY' && currencyCode === 'TRY') {
            // Yabancı para biriminden TL'ye çevirme
            const detailRate = exchangeRates[detailCurrency] || 1;
            newUnitPrice = detail.unitPrice * detailRate;
          } else if (detailCurrency !== 'TRY' && currencyCode !== 'TRY') {
            // Yabancı para biriminden başka bir yabancı para birimine çevirme
            const detailRate = exchangeRates[detailCurrency] || 1;
            // Önce TL'ye çevir, sonra hedef para birimine çevir
            newUnitPrice = (detail.unitPrice * detailRate) / rate;
          }
        }
        
        // Yeni değerleri hesapla
        const totalAmount = detail.quantity * newUnitPrice;
        const discountAmount = (totalAmount * (detail.discountRate || 0)) / 100;
        const subtotalAmount = totalAmount - discountAmount;
        const vatAmount = subtotalAmount * (detail.vatRate / 100);
        const netAmount = subtotalAmount + vatAmount;
        
        // Kullanılacak para birimi - form'dan al veya parametre olarak gelen değeri kullan
        const formCurrencyCode = form.getFieldValue('docCurrencyCode');
        const useCurrencyCode = currencyCode || formCurrencyCode || detail.currencyCode || 'TRY';
        
        // Güncel döviz kurunu al
        const currentExchangeRate = useCurrencyCode === 'TRY' ? 1 : exchangeRate;
        
        // TL karşılığını hesapla (eğer farklı bir para birimi seçilmişse ve kur bilgisi varsa)
        let tryEquivalent = netAmount;
        if (useCurrencyCode !== 'TRY' && currentExchangeRate > 0) {
          tryEquivalent = netAmount * currentExchangeRate;
        } else {
          tryEquivalent = netAmount;
        }
        
        return {
          ...detail,
          unitPrice: newUnitPrice,
          totalAmount,
          discountAmount,
          subtotalAmount,
          vatAmount,
          netAmount,
          currencyCode: useCurrencyCode,
          tryEquivalent: parseFloat(tryEquivalent.toFixed(2)),
          exchangeRate: currentExchangeRate // Güncel döviz kurunu da ekle
        };
      });
      
      // Güncellenmiş satırları state'e kaydet
      setInvoiceDetails(updatedDetails);
      
      // Fatura toplamlarını güncelle
      updateTotals(updatedDetails);
      
      // Form alanlarını güncelle
      form.setFieldsValue({
        exchangeRate: rate,
        currencyCode: currencyCode
      });
      
      // Konsola bilgi yazdır
      console.log('Satırlar ve toplamlar güncellendi. Yeni para birimi:', currencyCode, 'Kur:', rate);
    }  
  };
  
  // Para birimi değiştiğinde fiyatları güncelle
  useEffect(() => {
    if (currentCurrencyCode !== 'TRY' && Object.keys(exchangeRates).length > 0) {
      updatePricesWithExchangeRate(currentCurrencyCode);
    } else if (currentCurrencyCode === 'TRY' && invoiceDetails.length > 0) {
      // TRY seçildiğinde, tüm fiyatları TRY olarak güncelle
      const updatedDetails = invoiceDetails.map(detail => ({
        ...detail,
        currencyCode: 'TRY'
      }));
      setInvoiceDetails(updatedDetails);
    }
  }, [currentCurrencyCode, exchangeRates]);

  // Bir metnin barkod olup olmadığını kontrol et
  const isBarcodeFormat = (text: string): boolean => {
    // Barkodlar genellikle 8 veya 2 ile başlar, en az 12, en fazla 13 hanedir
    const barcodeRegex = /^(8|2)\d{11,12}$/;
    return barcodeRegex.test(text) && text.length >= 12 && text.length <= 13;
  };

  // Ürün varyantlarını barkod ile arama
  const searchProductVariantsByBarcode = async (searchText: string) => {
    if (!searchText || searchText.trim() === '') {
      message.warning('Lütfen bir barkod girin');
      return;
    }
    
    setLoadingVariants(true);
    try {
      console.log('Barkod araması başlatılıyor:', searchText);
      
      // Barkod ile ara
      const response = await productApi.getProductVariantsByBarcode(searchText);
      console.log('Barkod araması sonucu:', response);
      
      if (response && response.length > 0) {
        console.log('Barkod ile varyantlar bulundu:', response);
        setProductVariants(response);
        // İlk varyantı otomatik olarak listeye ekle
        if (response[0]) {
          console.log('İlk varyant listeye ekleniyor:', response[0]);
          addVariantToScannedList(response[0]);
        }
      } else {
        // Barkod ile bulunamadıysa uyarı göster
        console.log('Barkod ile varyant bulunamadı');
        message.warning(`'${searchText}' için hiçbir ürün bulunamadı`);
        setProductVariants([]);
      }
    } catch (error) {
      console.error('Barkod araması hatası:', error);
      message.error('Barkod arama sırasında bir hata oluştu');
      setProductVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };
  
  // Varyantı taranan ürünler listesine ekle
  const addVariantToScannedList = (variant: ProductVariant) => {
    if (!variant) {
      console.error('Eklenecek varyant bulunamadı');
      return;
    }
    // Aynı barkoda sahip ürün var mı kontrol et
    const existingItemIndex = scannedItems.findIndex(item => 
      item.variant.barcode === variant.barcode
    );

    if (existingItemIndex >= 0) {
      // Varsa miktarını artır
      const updatedItems = [...scannedItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1
      };
      setScannedItems(updatedItems);
    } else {
      // Yoksa yeni ekle
      setScannedItems([...scannedItems, { variant, quantity: 1 }]);
    }

    // Başarı mesajı göster
    message.success(`${variant.productDescription} listeye eklendi`);
  };
  
  // Fatura detaylarını API için hazırla
  const mapInvoiceDetailToRequest = (detail: InvoiceDetail) => {
    return {
      ...detail,
      // InvoiceDetail tipinde bulunan alanları kullan
      vatAmount: detail.vatAmount || 0,
      discountAmount: detail.discountAmount || 0,
      netAmount: detail.netAmount || 0
    };
  };
  
  // Satır tutarlarını hesapla
  const calculateLineAmounts = (detail: InvoiceDetail, currencyCode?: string): InvoiceDetail => {
    const quantity = parseFloat(detail.quantity?.toString() || '0');
    // Vergi tipi vergisiz ise KDV oranını 0 olarak ayarla, değilse detaydan al
    const vatRate = taxTypeMode === 'vergisiz' ? 0 : parseFloat(detail.vatRate?.toString() || '0');
    const discountRate = parseFloat(detail.discountRate?.toString() || '0');
    let unitPrice = parseFloat(detail.unitPrice?.toString() || '0');
    
    // KDV dahil/hariç durumuna göre birim fiyatı ayarla
    if (isPriceIncludeVat && unitPrice > 0) {
      // Eğer KDV dahil ise, birim fiyatı KDV'siz hale getir
      unitPrice = unitPrice / (1 + (vatRate / 100));
    }
    
    // Toplam tutar (miktar * birim fiyat)
    const totalAmount = quantity * unitPrice;
    
    // İndirim tutarı
    const discountAmount = (totalAmount * discountRate) / 100;
    
    // Ara toplam (toplam - indirim)
    const subtotalAmount = totalAmount - discountAmount;
    
    // KDV tutarı
    const vatAmount = (subtotalAmount * vatRate) / 100;
    
    // Net tutar (ara toplam + KDV)
    const netAmount = subtotalAmount + vatAmount;
    
    // Kullanılacak para birimi - form'dan al veya parametre olarak gelen değeri kullan
    const formCurrencyCode = form.getFieldValue('docCurrencyCode');
    const useCurrencyCode = currencyCode || formCurrencyCode || detail.currencyCode || 'TRY';
    
    // Güncel döviz kurunu al
    const currentExchangeRate = useCurrencyCode === 'TRY' ? 1 : exchangeRate;
    
    // TL karşılığını hesapla (eğer farklı bir para birimi seçilmişse ve kur bilgisi varsa)
    let tryEquivalent = netAmount;
    if (useCurrencyCode !== 'TRY' && currentExchangeRate > 0) {
      tryEquivalent = netAmount * currentExchangeRate;
    } else {
      tryEquivalent = netAmount;
    }
    
    return {
      ...detail,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      subtotalAmount: parseFloat(subtotalAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      currencyCode: useCurrencyCode,
      tryEquivalent: parseFloat(tryEquivalent.toFixed(2)),
      exchangeRate: currentExchangeRate // Güncel döviz kurunu da ekle
    };
  };
  
  // Fatura toplamlarını güncelle
  const updateTotals = (details: InvoiceDetail[]) => {
    if (!details || details.length === 0) {
      setTotalAmount(0);
      setDiscountAmount(0);
      setSubtotalAmount(0);
      setVatAmount(0);
      setNetAmount(0);
      
      // Form alanlarını güncelle
      form.setFieldsValue({
        totalAmount: 0,
        discountAmount: 0,
        subtotalAmount: 0,
        vatAmount: 0,
        netAmount: 0,
        currencyCode: 'TRY'
      });
      return;
    }
    
    // Toplamları hesapla
    let total = 0;
    let discount = 0;
    let subtotal = 0;
    let vat = 0;
    let net = 0;
    let tryTotal = 0; // TL karşılığı toplam
    
    // Form'dan güncel para birimini al
    const formCurrencyCode = form.getFieldValue('docCurrencyCode');
    
    // Kullanılan para birimi (form'dan al veya ilk satırın para birimini kullan)
    const usedCurrencyCode = formCurrencyCode || details[0]?.currencyCode || currentCurrencyCode || 'TRY';
    
    // Güncel döviz kurunu al
    const currentExchangeRate = usedCurrencyCode === 'TRY' ? 1 : exchangeRate;

    // Her bir satır için toplamları hesapla
    details.forEach(detail => {
      total += detail.totalAmount || 0;
      discount += detail.discountAmount || 0;
      subtotal += detail.subtotalAmount || 0;
      vat += detail.vatAmount || 0;
      net += detail.netAmount || 0;
      
      // Eğer TRY dışında bir para birimi kullanılıyorsa ve kur bilgisi varsa
      if (usedCurrencyCode !== 'TRY') {
        // TL karşılığını hesapla ve ekle - güncel kur değerini kullan
        tryTotal += (detail.totalAmount || 0) * currentExchangeRate;
      }
    });

    // State'leri güncelle
    setTotalAmount(total);
    setDiscountAmount(discount);
    setSubtotalAmount(subtotal);
    setVatAmount(vat);
    setNetAmount(net);
    
    // Form alanlarını güncelle
    form.setFieldsValue({
      totalAmount: total,
      discountAmount: discount,
      subtotalAmount: subtotal,
      vatAmount: vat,
      netAmount: net,
      currencyCode: usedCurrencyCode,
      exchangeRate: currentExchangeRate,
      tryEquivalentTotal: usedCurrencyCode !== 'TRY' ? parseFloat(tryTotal.toFixed(2)) : undefined
    });
  };

  // Stok bilgisini getir
  const getInventoryStock = async (productCode: string) => {
    setLoadingInventory(true);
    try {
      // Stok bilgisini getir
      const stockResponse = await inventoryApi.getInventoryStockByProductCode(productCode);
      
      if (stockResponse && stockResponse.length > 0) {
        // Mevcut stok bilgisini güncelle
        const prevStock = inventoryStock.find(s => 
          (s as any).productCode === productCode || (s as any).itemCode === productCode
        );

        if (prevStock) {
          // Mevcut stok bilgisini güncelle
          const updatedStock = inventoryStock.map(s => 
            ((s as any).productCode === productCode || (s as any).itemCode === productCode) ? stockResponse[0] : s
          );
          setInventoryStock(updatedStock);
        } else {
          // Yeni stok bilgisi ekle
          setInventoryStock([...inventoryStock, ...stockResponse]);
        }
        
        return stockResponse;
      }
      
      return [];
    } catch (error) {
      console.error('Stok bilgisi getirme hatası:', error);
      return [];
    } finally {
      setLoadingInventory(false);
    }
  };

  // Ürün fiyatını fiyat listesinden getir ve varyantı ekle
  const getProductPriceAndAddVariant = async (variant: ProductVariant) => {
    try {
      console.log('Ürün fiyatı getiriliyor ve varyant ekleniyor:', variant.productCode);
      let fiyatBulundu = false;
      
      // Önce /api/v1/Product/all-price-lists endpoint'ini kullanarak fiyat bilgisini almayı dene
      try {
        // Fiyat listesi API'sini çağır
        const priceListResponse = await productPriceListApi.getPriceList({
          page: 1,
          pageSize: 10,
          itemCode: variant.productCode,
          companyCode: 1
        });
        
        console.log('Fiyat listesi API yanıtı:', priceListResponse);
        
        // API yanıtında veri varsa ve başarılıysa
        if (priceListResponse.success && priceListResponse.data && priceListResponse.data.length > 0) {
          // Ürün koduna göre filtreleme yap
          const matchingItems = priceListResponse.data.filter(item => 
            item.itemCode === variant.productCode
          );
          
          if (matchingItems.length > 0) {
            // Eşleşen ilk öğeyi al
            const priceItem = matchingItems[0];
            
            // Varyantın fiyat ve KDV bilgilerini güncelle
            variant.salesPrice1 = priceItem.birimFiyat || 0;
            // Vergi tipi vergisiz ise KDV 0, değilse 10
            variant.vatRate = taxTypeMode === 'vergisiz' ? 0 : 10;
            console.log('Fiyat listesinden fiyat bilgisi güncellendi:', variant.salesPrice1);
            fiyatBulundu = true;
          }
        }
        
        if (!fiyatBulundu) {
          console.log('Fiyat listesinde bulunamadı, eski yöntemi deniyoruz...');
        }
      } catch (apiError) {
        console.log('Fiyat listesi API hatası:', apiError);
        // Hata durumunda sessizce devam et, eski yöntemi dene
      }
      
      // Fiyat bulunamadıysa eski yöntemi dene
      if (!fiyatBulundu) {
        try {
          // Eski yöntem: Ürün koduna göre fiyat listesini getir
          const priceList = await productApi.getProductPriceList(variant.productCode);
          
          if (priceList.length > 0) {
            // Fiyat listesinden ilk fiyatı al (en güncel fiyat)
            const firstPrice = priceList[0];
            
            // Varyantın fiyat ve KDV bilgilerini güncelle
            variant.salesPrice1 = firstPrice.birimFiyat || 0;
            // Vergi tipi vergisiz ise KDV 0, değilse API'den gelen değer veya 10
            variant.vatRate = taxTypeMode === 'vergisiz' ? 0 : (firstPrice.vatRate || 10);
            console.log('Eski yöntemle fiyat bilgisi güncellendi:', variant.salesPrice1, 'KDV:', variant.vatRate);
            fiyatBulundu = true;
          }
        } catch (priceError) {
          console.log('Eski yöntem fiyat getirme hatası:', priceError);
          // Sessizce devam et
        }
      }
      
      // Fiyat bulunamadıysa varsayılan değerleri kullan
      if (!fiyatBulundu) {
        console.log('Fiyat listesi bulunamadı, varsayılan değerler kullanılıyor');
        variant.salesPrice1 = 0; // Varsayılan fiyat 0
        variant.vatRate = 10;    // Varsayılan KDV oranı 10
        message.info(`${variant.productCode} için fiyat bulunamadı, 0 TL olarak eklendi.`);
      }
      
      // Her durumda varyantı taranan ürünler listesine ekle
      addVariantToScannedList(variant);
      
    } catch (error) {
      console.error('Ürün fiyatı getirilirken hata oluştu:', error);
      // Hata olsa bile varyantı varsayılan değerlerle ekle
      variant.salesPrice1 = 0;
      variant.vatRate = taxTypeMode === 'vergisiz' ? 0 : 10;
      addVariantToScannedList(variant);
      
      // Bilgilendirme mesajı göster
      message.info(`${variant.productCode} için fiyat bulunamadı, 0 TL olarak eklendi.`);
    }
  };

  // Toplam değerler
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [subtotalAmount, setSubtotalAmount] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [netAmount, setNetAmount] = useState<number>(0);
  
  // Veri yükleme fonksiyonu
  const loadData = async () => {
    try {
      console.log('Veri yükleme başlıyor...');
      console.log('Cari hesap tipi:', currAccType === CurrAccType.CUSTOMER ? 'Müşteri' : 'Tedarikçi');
      
      // Paralel veri yükleme için Promise.all kullan
      const loadPromises = [];
      
      // Müşterileri yükle
      const loadCustomers = async () => {
        // Eğer zaten müşteriler yüklendiyse tekrar yükleme
        if (customers.length > 0) {
          console.log('Müşteriler zaten yüklenmiş, tekrar yüklenmiyor');
          return;
        }
        
        try {
          setLoadingCustomers(true);
          console.log('Müşteri listesi yükleniyor...');
          
          // Müşteri verilerini API'den çek (currAccTypeCode=3: Müşteri)
          const customerResponse = await customerApi.getCustomers({ currAccTypeCode: 3 });
          
          if (customerResponse && customerResponse.data) {
            try {
              // API'den gelen veriyi işle
              const customerData = customerResponse.data;
              console.log('API\'den gelen ham müşteri verileri:', customerData);
              
              if (customerData && customerData.length > 0) {
                // Müşteri verilerini standart bir formata dönüştür
                const formattedCustomers = customerData.map((customer: any) => {
                  // Müşteri kodu için öncelik sırası
                  const code = customer.customerCode || customer.currAccCode || customer.code || '';
                  // Müşteri adı için öncelik sırası
                  const name = customer.customerName || customer.currAccDesc || customer.name || customer.description || `Müşteri ${code}`;
                  
                  return {
                    ...customer,
                    code,
                    name,
                    currAccCode: code,
                    currAccDesc: name,
                    currAccTypeCode: customer.currAccTypeCode || customer.customerTypeCode || 3
                  };
                });
                
                console.log('Formatı standartlaştırılmış müşteriler:', formattedCustomers);
                setCustomers(formattedCustomers);
                console.log(`${formattedCustomers.length} müşteri başarıyla yüklendi.`);
              } else {
                console.warn('Müşteri verisi boş geldi');
                setCustomers([]);
                message.warning('Müşteri listesi boş veya yüklenemedi.');
              }
            } catch (error) {
              console.error('Müşteri verileri işlenirken hata oluştu:', error);
              setCustomers([]);
              message.error('Müşteri verileri işlenirken hata oluştu.');
            }
          } else {
            console.error('Müşteri verileri alınamadı veya boş geldi');
            setCustomers([]);
            message.warning('Müşteri verileri alınamadı.');
          }
        } catch (error) {
          console.error('Müşteri verileri yüklenirken hata oluştu:', error);
          setCustomers([]);
          message.error('Müşteri verileri yüklenirken hata oluştu.');
        } finally {
          setLoadingCustomers(false);
        }
      };
      
      // Tedarikçileri yükle
      const loadVendors = async () => {
        // Eğer zaten tedarikçiler yüklendiyse tekrar yükleme
        if (vendors.length > 0) {
          console.log('Tedarikçiler zaten yüklenmiş, tekrar yüklenmiyor');
          return;
        }
        
        try {
          setLoadingVendors(true);
          console.log('Tedarikçi listesi yükleniyor...');
          
          // Tedarikçi verilerini API'den çek (currAccTypeCode=1: Tedarikçi)
          const vendorResponse = await vendorApi.getVendors({ currAccTypeCode: 1 });
          
          if (vendorResponse && vendorResponse.data) {
            try {
              // API'den gelen veriyi işle
              const vendorData = vendorResponse.data;
              console.log('API\'den gelen ham tedarikçi verileri:', vendorData);
              
              if (vendorData && vendorData.length > 0) {
                // Tedarikçi verilerini standart bir formata dönüştür
                const formattedVendors = vendorData.map((vendor: any) => {
                  // Tedarikçi kodu için öncelik sırası
                  const code = vendor.vendorCode || vendor.currAccCode || vendor.code || '';
                  // Tedarikçi adı için öncelik sırası
                  const name = vendor.vendorName || vendor.currAccDesc || vendor.name || vendor.description || `Tedarikçi ${code}`;
                  
                  return {
                    ...vendor,
                    code,
                    name,
                    currAccCode: code,
                    currAccDesc: name,
                    currAccTypeCode: vendor.currAccTypeCode || vendor.vendorTypeCode || 1
                  };
                });
                
                console.log('Formatı standartlaştırılmış tedarikçiler:', formattedVendors);
                setVendors(formattedVendors);
                console.log(`${formattedVendors.length} tedarikçi başarıyla yüklendi.`);
              } else {
                console.warn('Tedarikçi verisi boş geldi');
                setVendors([]);
                message.warning('Tedarikçi listesi boş veya yüklenemedi.');
              }
            } catch (error) {
              console.error('Tedarikçi verileri işlenirken hata oluştu:', error);
              setVendors([]);
              message.error('Tedarikçi verileri işlenirken hata oluştu.');
            }
          } else {
            console.error('Tedarikçi verileri alınamadı veya boş geldi');
            setVendors([]);
            message.warning('Tedarikçi verileri alınamadı.');
          }
        } catch (error) {
          console.error('Tedarikçi verileri yüklenirken hata oluştu:', error);
          setVendors([]);
          message.error('Tedarikçi verileri yüklenirken hata oluştu.');
        } finally {
          setLoadingVendors(false);
        }
      };
      
      // Ofisleri yükle
      const loadOffices = async () => {
        try {
          setLoadingOffices(true);
          console.log('Ofis listesi yükleniyor...');
          const officeResponse = await officeApi.getOffices();
          
          if (officeResponse && officeResponse.success) {
            // API yanıt yapısını kontrol et
            const officeData = officeResponse.data || [];
            console.log(`${officeData.length} ofis yüklendi`);
            
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
        } finally {
          setLoadingOffices(false);
        }
      };
      
      // Depoları yükle
      const loadWarehouses = async () => {
        try {
          setLoadingWarehouses(true);
          console.log('Depo listesi yükleniyor...');
          const warehouseResponse = await warehouseApi.getWarehouses();
          
          if (warehouseResponse && warehouseResponse.success) {
            // API yanıt yapısını kontrol et
            const warehouseData = warehouseResponse.data || [];
            console.log(`${warehouseData.length} depo yüklendi`);
            
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
        } finally {
          setLoadingWarehouses(false);
        }
      };
      
      // Para birimlerini yükle
      const loadCurrencies = async () => {
        // Eğer zaten para birimleri yüklendiyle tekrar yükleme
        if (currencies.length > 0) {
          console.log('Para birimleri zaten yüklenmiş, tekrar yüklenmiyor');
          return;
        }
        
        try {
          setLoadingCurrencies(true);
          console.log('Para birimleri yükleniyor...');
          
          // API'den para birimlerini getir
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
                description: currency.currencyDescription || currency.description || currency.name,
                // TRY için varsayılan olarak işaretle
                isDefault: (currency.currencyCode || currency.code) === 'TRY'
              }));
              
              // TRY yoksa ekleyelim
              const hasTRY = formattedCurrencies.some((c: any) => c.code === 'TRY');
              if (!hasTRY) {
                formattedCurrencies.unshift({
                  currencyCode: 'TRY', 
                  currencyDescription: 'Türk Lirası', 
                  code: 'TRY', 
                  name: 'Türk Lirası', 
                  description: 'Türk Lirası',
                  isDefault: true
                });
              }
              
              setCurrencies(formattedCurrencies);
            } else {
              // Varsayılan para birimleri
              const defaultCurrencies = [
                { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', code: 'TRY', name: 'Türk Lirası', description: 'Türk Lirası', isDefault: true },
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
              { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', code: 'TRY', name: 'Türk Lirası', description: 'Türk Lirası', isDefault: true },
              { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', code: 'USD', name: 'Amerikan Doları', description: 'Amerikan Doları' },
              { currencyCode: 'EUR', currencyDescription: 'Euro', code: 'EUR', name: 'Euro', description: 'Euro' },
              { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', code: 'GBP', name: 'İngiliz Sterlini', description: 'İngiliz Sterlini' }
            ];
            setCurrencies(defaultCurrencies);
            console.log('API yanıtı başarısız, varsayılan para birimleri kullanılıyor');
          }
          
          // Varsayılan para birimi olarak TRY ayarla
          if (!form.getFieldValue('docCurrencyCode')) {
            form.setFieldsValue({ docCurrencyCode: 'TRY' });
          }
        } catch (error) {
          console.error('Para birimi yükleme hatası:', error);
          // Varsayılan para birimleri
          const defaultCurrencies = [
            { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', code: 'TRY', name: 'Türk Lirası', description: 'Türk Lirası', isDefault: true },
            { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', code: 'USD', name: 'Amerikan Doları', description: 'Amerikan Doları' },
            { currencyCode: 'EUR', currencyDescription: 'Euro', code: 'EUR', name: 'Euro', description: 'Euro' },
            { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', code: 'GBP', name: 'İngiliz Sterlini', description: 'İngiliz Sterlini' }
          ];
          setCurrencies(defaultCurrencies);
          console.log('Hata nedeniyle varsayılan para birimleri kullanılıyor');
          
          // Varsayılan para birimi olarak TRY ayarla
          if (!form.getFieldValue('docCurrencyCode')) {
            form.setFieldsValue({ docCurrencyCode: 'TRY' });
          }
        } finally {
          setLoadingCurrencies(false);
        }
      };
      
      // Cari hesap tipine göre müşteri veya tedarikçi listesini yükle
      if (currAccType === CurrAccType.CUSTOMER) {
        loadPromises.push(loadCustomers());
      } else if (currAccType === CurrAccType.VENDOR) {
        loadPromises.push(loadVendors());
      }
      
      // Vergi tiplerini yükle
      const loadTaxTypes = async () => {
        try {
          setLoadingTaxTypes(true);
          console.log('Vergi tipleri yükleniyor...');
          
          const taxTypesResponse = await taxApi.getAllTaxTypes();
          if (taxTypesResponse) {
            setTaxTypes(taxTypesResponse);
            console.log('Vergi tipleri başarıyla yüklendi:', taxTypesResponse);
          } else {
            console.warn('Vergi tipleri boş döndü');
            setTaxTypes([]);
          }
        } catch (error) {
          console.error('Vergi tipleri yüklenirken hata oluştu:', error);
          message.error('Vergi tipleri yüklenirken bir hata oluştu');
          setTaxTypes([]);
        } finally {
          setLoadingTaxTypes(false);
        }
      };
      
      // Diğer verileri yükle
      loadPromises.push(loadOffices());
      loadPromises.push(loadWarehouses());
      loadPromises.push(loadCurrencies());
      loadPromises.push(loadTaxTypes());
      
      // Tüm veri yükleme işlemlerini paralel olarak çalıştır
      await Promise.all(loadPromises);
      
      console.log('Tüm veriler başarıyla yüklendi.');
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      message.error('Veriler yüklenirken bir hata oluştu.');
    }
  };
  
  // İlk yükleme için veri yükleme fonksiyonu
  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Form Bileşeni Yüklendi:', invoiceTypeDescriptions[selectedInvoiceType as keyof typeof invoiceTypeDescriptions]);
      
      // Form bağlantısı kontrolü burada yapılmaz
      
      // Veri yükleme işlemi
      await loadData();
      
      // Not: Fatura numarası artık backend tarafında fatura oluşturma sırasında otomatik oluşturulacak
      // Form alanını geçici bir değerle doldur
      form.setFieldsValue({ 
        invoiceNumber: 'Otomatik oluşturulacak',
        invoiceDate: dayjs(), // Bugünün tarihini ayarla
        docCurrencyCode: 'TRY' // Varsayılan para birimi
      });
      
      // İleri butonunu aktif et - form yüklendiğinde butonun aktif olması için
      setHeaderFormValid(true);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      message.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      // Yükleme işlemi tamamlandı
      setLoading(false);
    }
  };

  // Sekme değiştirme işleyicisi
  const handleTabChange = (activeKey: string) => {
    setActiveTab(activeKey);
  };

  // Vergi tipi değiştiğinde çağrılacak fonksiyon
  const handleTaxTypeChange = (taxMode: string) => {
    console.log('Vergi tipi modu değişti:', taxMode);
    setTaxTypeMode(taxMode);
    
    // Eğer "vergisiz" seçildiyse tüm fatura satırlarındaki KDV oranını 0 yap
    if (taxMode === 'vergisiz') {
      const updatedDetails = invoiceDetails.map(detail => {
        // KDV oranını 0 olarak ayarla
        const updatedDetail = { ...detail, vatRate: 0 };
        
        // Döviz kuru bilgisini ekle
        if (currentCurrencyCode !== 'TRY' && exchangeRates[currentCurrencyCode]) {
          updatedDetail.exchangeRate = exchangeRates[currentCurrencyCode];
        }
        
        // Hesaplamaları yap
        return calculateLineAmounts(updatedDetail, currentCurrencyCode);
      });
      
      setInvoiceDetails(updatedDetails);
      updateTotals(updatedDetails);
      console.log('Tüm KDV oranları 0 olarak ayarlandı');
      
      // Taranan ürünlerin KDV oranlarını da güncelle
      if (scannedItems.length > 0) {
        const updatedScannedItems = scannedItems.map(item => {
          item.variant.vatRate = 0;
          return item;
        });
        setScannedItems(updatedScannedItems);
        console.log('Taranan ürünlerin KDV oranları 0 olarak ayarlandı');
      }
    }
  };

  // Yeni satır ekle
  const addInvoiceDetail = () => {
    const newDetail: InvoiceDetail = {
      id: uuidv4(),
      itemCode: '',
      quantity: 1,
      unitOfMeasureCode: 'AD',// Ürün varyant detayından gelmeli
      unitPrice: 0, //Eğer varsa barkod modaldan fiyat listesinden gelmeli
      vatRate: taxTypeMode === 'vergisiz' ? 0 : 10, // Vergi tipi vergisiz ise KDV 0, değilse 10
      discountRate: 0,
      totalAmount: 0,
      discountAmount: 0,
      subtotalAmount: 0,
      vatAmount: 0,
      netAmount: 0
    };

    const updatedDetails = [...invoiceDetails, newDetail];
    setInvoiceDetails(updatedDetails);
    
    // Başlık zorunlu alanları tamamsa ve en az bir satır varsa TOPLAM sekmesini aktif et
    if (headerFormValid && updatedDetails.length > 0) {
      // Eğer SATIRLAR sekmesindeyse ve başlık geçerliyse, otomatik olarak TOPLAM sekmesine geç
      if (activeTab === '2') {
        handleTabChange('3');
      }
    }
  };

  // Satır silme fonksiyonu
  const removeInvoiceDetail = (id: string) => {
    const updatedDetails = invoiceDetails.filter(detail => detail.id !== id);
    setInvoiceDetails(updatedDetails);
    updateTotals(updatedDetails);
    
    // Eğer satır kalmadıysa ve TOPLAM sekmesindeyse, SATIRLAR sekmesine geri dön
    if (updatedDetails.length === 0 && activeTab === '3') {
      handleTabChange('2');
    }
  };

  // Satır güncelleme fonksiyonu
  const updateInvoiceDetail = (id: string, field: string, value: any) => {
    if (!id || !field) {
      console.error('Geçersiz id veya alan adı');
      return;
    }
    
    // isPriceIncludeVat değiştiğinde tüm satırları güncelle
    if (field === 'isPriceIncludeVat') {
      // KDV dahil/hariç değerini günculle
      setIsPriceIncludeVat(value);
      form.setFieldsValue({ isPriceIncludeVat: value });
      
      const updatedDetails = invoiceDetails.map(detail => {
        // Döviz kuru bilgisini ekle
        const detailWithExchangeRate = {
          ...detail,
          exchangeRate: currentCurrencyCode !== 'TRY' && exchangeRates[currentCurrencyCode] ? 
            exchangeRates[currentCurrencyCode] : 1
        };
        
        // Hesaplamaları yap
        return calculateLineAmounts(detailWithExchangeRate, currentCurrencyCode);
      });
      
      setInvoiceDetails(updatedDetails);
      updateTotals(updatedDetails);
    } else {
      // Tek bir satırı günculle
      const updatedDetails = invoiceDetails.map(detail => {
        if (detail.id === id) {
          // Güncellenmiş detay
          const updatedDetail = { ...detail, [field]: value };
          
          // Eğer vergi tipi "vergisiz" ise ve vatRate alanı güncelleniyorsa, 0 olarak zorla
          if (taxTypeMode === 'vergisiz' && field === 'vatRate') {
            updatedDetail.vatRate = 0;
          }
          
          // Döviz kuru bilgisini ekle
          if (currentCurrencyCode !== 'TRY' && exchangeRates[currentCurrencyCode]) {
            updatedDetail.exchangeRate = exchangeRates[currentCurrencyCode];
          }
          
          // Hesaplamaları yap
          return calculateLineAmounts(updatedDetail, currentCurrencyCode);
        }
        return detail;
      });
      
      setInvoiceDetails(updatedDetails);
      updateTotals(updatedDetails);
    }
  };

  // Not: calculateLineAmounts ve updateTotals fonksiyonları dosyada zaten tanımlı olduğu için burada tekrar tanımlanmadı.

  // Kaydetme işleyicisi
  const handleSave = () => {
    console.log('Kaydet butonu tıklandı');
    // Önceki mesajları temizle ve tek bir yükleme mesajı göster
    message.destroy('invoiceSave');
    message.loading({ content: 'Form gönderiliyor...', key: 'invoiceSave', duration: 0 });
    setLoading(true); // Yükleme durumunu başlat
    
    // Fatura detaylarını kontrol et
    if (!invoiceDetails || invoiceDetails.length === 0) {
      console.error('Fatura detayları boş! En az bir ürün eklemelisiniz.');
      message.error('Fatura detayları boş! En az bir ürün eklemelisiniz.');
      setLoading(false);
      return;
    }
    
    // Form validasyonunu kontrol et
    form.validateFields()
      .then(values => {
        console.log('Form doğrulandı, gönderiliyor...', values);
        // Form.submit yerine doğrudan onFinish fonksiyonunu çağır
        onFinish(values);
      })
      .catch(errorInfo => {
        console.error('Form doğrulama hatası:', errorInfo);
        message.error('Lütfen tüm zorunlu alanları doldurunuz!');
        setLoading(false); // Yükleme durumunu sıfırla
      });
  };

  // Form gönderme işleyicisi
  const onFinish = async (values: any) => {
    try {
      // Önceki yükleme mesajlarını temizle
      message.destroy('invoiceSave');
      
      console.log('onFinish çağrıldı, form verileri:', values);
      // Tek bir yükleme mesajı göster
      message.loading({ content: 'Fatura kaydediliyor...', key: 'invoiceSave', duration: 0 });
      
      // Fatura tipi ve cari hesap tipi kodlarını belirle
      const invoiceTypeCode = selectedInvoiceType === InvoiceType.WHOLESALE_SALES ? 'WS' : 
                           selectedInvoiceType === InvoiceType.WHOLESALE_PURCHASE ? 'WP' : 
                           selectedInvoiceType === InvoiceType.EXPENSE_SALES ? 'EXS' : 'EXP';
    
    const currAccTypeCode = selectedInvoiceType === InvoiceType.WHOLESALE_SALES || selectedInvoiceType === InvoiceType.EXPENSE_SALES ? 
                           CurrAccType.CUSTOMER : CurrAccType.VENDOR;
    
    // Fatura detaylarını hazırla
    console.log('Hazırlanacak fatura detayları:', invoiceDetails);
    
    if (!invoiceDetails || invoiceDetails.length === 0) {
      message.error('Fatura detayları boş! En az bir ürün eklemelisiniz.');
      setLoading(false);
      return;
    }
    
    // Adres kontrolleri
    if (!values.shippingPostalAddressID) {
      message.error('Teslimat adresi seçilmesi zorunludur!');
      setLoading(false);
      return;
    }
    
    if (!values.billingPostalAddressID) {
      message.error('Fatura adresi seçilmesi zorunludur!');
      setLoading(false);
      return;
    }
    
    // Fatura detaylarını doğru formatta hazırla
    const formattedDetails: InvoiceDetailRequest[] = [];
    
    // Her bir detayı döngüyle işle ve formatlayarak yeni diziye ekle
    for (let i = 0; i < invoiceDetails.length; i++) {
      const detail = invoiceDetails[i];
      console.log(`Detay ${i + 1}:`, detail);
      
      // Hesaplanan tutarları kontrol et ve varsayılan değerler ata
      const totalAmount = detail.totalAmount || (detail.quantity * detail.unitPrice) || 0;
      const discountAmount = detail.discountAmount || 0;
      const subtotalAmount = detail.subtotalAmount || totalAmount - discountAmount || 0;
      const vatAmount = detail.vatAmount || (subtotalAmount * (detail.vatRate / 100)) || 0;
      const netAmount = detail.netAmount || subtotalAmount + vatAmount || 0;
            // Backend'in beklediği formatta detay oluştur
       const formattedDetail: InvoiceDetailRequest = {
        itemCode: detail.itemCode,
        // Ürün varyant bilgilerini ekle
        colorCode: detail.colorCode || 'STD',  // Varsayılan olarak STD renk kodu
        itemDim1Code: detail.itemDim1Code || '',
        itemDim2Code: detail.itemDim2Code || '',
        itemDim3Code: detail.itemDim3Code || '',
        quantity: detail.quantity,
        unitOfMeasureCode: detail.unitOfMeasureCode || 'AD',
        unitPrice: detail.unitPrice || 0,
        vatRate: detail.vatRate || 10,
        discountRate: detail.discountRate || 0,
        description: detail.description || detail.productDescription || '',
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        subtotalAmount: subtotalAmount,
        vatAmount: vatAmount,
        netAmount: netAmount,
        currencyCode: detail.currencyCode || currentCurrencyCode,
        exchangeRate: detail.exchangeRate || values.exchangeRate || 1
      };
      
      // Formatlanan detayı diziye ekle
      formattedDetails.push(formattedDetail);
    }
    
    console.log('Formatlanan fatura detayları:', formattedDetails);
    
    // API isteği hazırla - doğrudan PascalCase alanlarla oluştur
    const requestData: any = {
      InvoiceNumber: values.invoiceNumber || 'Otomatik oluşturulacak',
      InvoiceTypeCode: invoiceTypeCode,
      InvoiceDate: values.invoiceDate ? values.invoiceDate.format('YYYY-MM-DD') : '', // dayjs nesnesini string'e çeviriyoruz
      InvoiceTime: '00:00:00', // Sabit saat
      CurrAccCode: values.currAccCode, // Müşteri/Tedarikçi kodu
      CurrAccTypeCode: values.currAccTypeCode || currAccTypeCode, // Müşteri/Tedarikçi tipi kodu
      DocCurrencyCode: currentCurrencyCode, // Güncel para birimini kullan
      CurrencyCode: currentCurrencyCode, // CurrencyCode alanını da aynı değerle ayarla
      LocalCurrencyCode: 'TRY', // Yerel para birimi her zaman TRY
      ExchangeRate: values.exchangeRate !== undefined && values.exchangeRate !== null ? values.exchangeRate : 1, // Döviz kuru
      CompanyCode: '1', // Sabit şirket kodu
      OfficeCode: values.officeCode || 'M',
      WarehouseCode: values.warehouseCode || '101',
      IsReturn: values.isReturn || false,
      IsEInvoice: values.isEInvoice || false,
      Notes: values.notes || '',
      ProcessCode: invoiceTypeCode, // İşlem kodu fatura tipi ile aynı
      TotalAmount: totalAmount,
      DiscountAmount: discountAmount,
      SubtotalAmount: subtotalAmount,
      VatAmount: vatAmount,
      NetAmount: netAmount,
      TryEquivalentTotal: values.tryEquivalentTotal,
      ShippingPostalAddressID: values.shippingPostalAddressID, // Teslimat adresi ID'si
      BillingPostalAddressID: values.billingPostalAddressID,   // Fatura adresi ID'si
      Details: formattedDetails // Formatlanan detayları kullan
    };
    
    // Sevkiyat yöntemi seçildiyse ekle, boşsa gönderme
    if (values.ShipmentMethodCode && values.ShipmentMethodCode !== '') {
      console.log('Sevkiyat yöntemi seçildi:', values.ShipmentMethodCode);
      requestData.ShipmentMethodCode = values.ShipmentMethodCode;
    } else {
      console.log('Sevkiyat yöntemi seçilmedi, API isteğinde gönderilmeyecek');
    }
    
    // Müşteri veya tedarikçi kodunu ekle
    if (currAccTypeCode === CurrAccType.CUSTOMER) {
      requestData.customerCode = values.currAccCode;
    } else {
      requestData.vendorCode = values.currAccCode;
    }
    
    console.log('API isteği hazırlandı:', requestData);
    
    // API'ye gönder
    let response;
    console.log('Fatura API çağrısı yapılıyor, fatura tipi:', type);
    console.log('API isteği:', requestData);
    
    // Axios ile doğrudan API çağrısı yap
    // API_BASE_URL zaten dosyanın başında tanımlı
    
    // Axios instance oluştur ve token ekle
    const token = localStorage.getItem('token');
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Fatura tipine göre doğru endpoint'i belirle
    let endpoint = '/api/v1/Invoice';
    
    // API çağrısını yap
    console.log(`API çağrısı yapılıyor: ${endpoint}`);
    console.log('Fatura gönderme öncesi kontrol:', {
      "InvoiceNumber": requestData.InvoiceNumber,
      "InvoiceTypeCode": requestData.InvoiceTypeCode,
      "CurrAccCode": requestData.CurrAccCode,
      "DocCurrencyCode": requestData.DocCurrencyCode,
      "CurrencyCode": requestData.CurrencyCode,
      "LocalCurrencyCode": requestData.LocalCurrencyCode,
      "ExchangeRate": requestData.ExchangeRate,
      "ShippingPostalAddressID": requestData.ShippingPostalAddressID,
      "BillingPostalAddressID": requestData.BillingPostalAddressID,
      "ShipmentMethodCode": requestData.ShipmentMethodCode,
      "Detaylar": requestData.Details ? requestData.Details.length : 0
    });
    
    // Özellikle detayları kontrol et
    if (!requestData.Details || requestData.Details.length === 0) {
      console.error('Fatura detayları boş! API çağrısı iptal ediliyor.');
      message.error('Fatura detayları boş! Lütfen en az bir ürün ekleyin.');
      setLoading(false);
      return;
    }
      
      // convertToPascalCase fonksiyonu kaldırıldı, çünkü artık doğrudan PascalCase kullanıyoruz
      
      // Fatura detaylarının var olduğundan emin ol
      if (!requestData.Details || !Array.isArray(requestData.Details)) {
        requestData.Details = [];
        console.warn('Fatura detayları bulunamadı veya geçerli bir dizi değil. Boş dizi kullanılıyor.');
      }
      
      // Geriye dönük uyumluluk için details alanını da ekleyelim
      requestData.details = requestData.Details;
      
      // API isteği için doğrudan requestData kullan
      const apiRequestData = requestData;
      
      console.log('API\'ye gönderilecek veri:', apiRequestData);
      console.log('PARA BİRİMİ KONTROLÜ:');
      console.log('Frontend\'de seçilen para birimi:', currentCurrencyCode);
      console.log('API\'ye gönderilen DocCurrencyCode:', apiRequestData.DocCurrencyCode);
      console.log('API\'ye gönderilen CurrencyCode:', apiRequestData.CurrencyCode);
      console.log('API\'ye gönderilen LocalCurrencyCode:', apiRequestData.LocalCurrencyCode);
      console.log('API\'ye gönderilen ExchangeRate:', apiRequestData.ExchangeRate);
      
      // Fatura tipine göre API çağrısı yap
      switch (selectedInvoiceType) {
        case InvoiceType.WHOLESALE_SALES:
          response = await invoiceApi.createWholesaleInvoice(apiRequestData);
          break;
        case InvoiceType.WHOLESALE_PURCHASE:
          response = await invoiceApi.createWholesalePurchaseInvoice(apiRequestData);
          break;
        case InvoiceType.EXPENSE_SALES:
          response = await invoiceApi.createExpenseInvoice(apiRequestData);
          break;
        case InvoiceType.EXPENSE_PURCHASE:
          response = await invoiceApi.createExpenseInvoice(apiRequestData);
          break;
        default:
          message.error('Geçersiz fatura tipi!');
          setLoading(false);
          return;
      }
      
      console.log('API yanıtı:', response);
      
      // Yükleme mesajını kapat
      message.destroy('invoiceSave');
      
      // API yanıtını kontrol et
      if (response && response.success) {
        // Ödeme tipini kontrol et
        const currentPaymentType = form.getFieldValue('paymentType');
        const currentNormalizedPaymentType = typeof currentPaymentType === 'number' ? String(currentPaymentType) : currentPaymentType;
        
        // Her durumda aynı başarı mesajını göster
        message.success('Fatura başarıyla kaydedildi');
        
        // Başarı callback'ini çağır
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // Fatura verilerini kaydet
        const savedInvoice = {
          id: response.data.invoiceHeaderID || 'temp-id-' + Date.now(),
          invoiceNumber: response.data.invoiceNumber || values.invoiceNumber,
          amount: response.data.netAmount || values.netAmount || 0,
          currencyCode: values.docCurrencyCode || 'TRY',
          currAccCode: values.currAccCode,
          currAccTypeCode: currAccTypeCode,
          officeCode: values.officeCode
        };
        
        console.log('Kaydedilen fatura verileri:', savedInvoice);
        
        // Yükleme durumunu kapat
        setLoading(false);
        
        // Nakit ödeme modalını açmak için gerekli verileri hazırla
        const invoiceData = {
          id: response.data?.invoiceHeaderID || '',
          invoiceNumber: response.data?.invoiceNumber || '',
          // Fatura tutarını doğru şekilde al, önce netAmount'a bak, yoksa form değerlerinden al
          amount: response.data?.netAmount || values.netAmount || form.getFieldValue('netAmount') || 0,
          currencyCode: values.docCurrencyCode || 'TRY',
          currAccCode: values.currAccCode || '',
          currAccTypeCode: currAccTypeCode || 0,
          officeCode: values.officeCode || ''
        };
        
        // Tutarın doğru aktarılıp aktarılmadığını kontrol et
        console.log('Fatura tutarı kontrol:', {
          responseNetAmount: response.data?.netAmount,
          formNetAmount: values.netAmount,
          fieldNetAmount: form.getFieldValue('netAmount'),
          finalAmount: invoiceData.amount
        });
        
        console.log('Nakit ödeme modalını açılıyor...', invoiceData);
        
        // Ödeme tipini kontrol et
        const paymentType = form.getFieldValue('paymentType');
        console.log('Ödeme tipi:', paymentType);
        console.log('Ödeme tipi türü:', typeof paymentType);
        console.log('Form değerleri:', form.getFieldsValue());
        
        // Eğer paymentType sayısal bir değerse string'e çevirelim
        const normalizedPaymentType = typeof paymentType === 'number' ? String(paymentType) : paymentType;
        
        // State'i güncelleyelim ve sonra modalı açalım
        setSavedInvoiceData(invoiceData);
        
        // Sadece ödeme tipi "Peşin" veya 1 ise nakit tahsilat modalını aç
        if (normalizedPaymentType === 'Peşin' || normalizedPaymentType === '1' || normalizedPaymentType === 1) {
          message.success('Fatura oluşturuldu. Nakit tahsilat işlemi başlatılıyor...');
          
          // Önce invoiceData'yı ayarla, sonra modalı aç
          console.log('Nakit tahsilat modalı açılıyor, invoiceData:', invoiceData);
          
          // Doğrudan state'leri ayarla - sıralama önemli
          setSavedInvoiceData(invoiceData);
          
          // Modalı aç
          setTimeout(() => {
            setShowCashPaymentModal(true);
            console.log('showCashPaymentModal ayarlandı:', true);
          }, 300);
          
          console.log('Modal açma işlemi başlatıldı');
        }
        
        // Not: Nakit ödeme modalı kapatıldığında form sıfırlanacak
        // Bu işlem handleCashPaymentModalClose ve handleCashPaymentSuccess fonksiyonlarında yapılıyor
      } else {
        // Hata mesajını göster
        let errorMessage = response?.message || 'Fatura kaydedilirken bir hata oluştu!';
        
        // Özel hata mesajları için kontrol
        if (errorMessage.includes('UNIQUE KEY constraint') && errorMessage.includes('UQ_trInvoiceHeader')) {
          errorMessage = 'Bu fatura numarası zaten kullanımda! Lütfen farklı bir fatura numarası kullanın veya otomatik numara oluşturma seçeneğini seçin.';
        }
        
        message.error(errorMessage);
        console.error('API yanıtı (hata):', response);
        

      }
    } catch (error: any) {
      console.error('Fatura kaydedilirken hata oluştu:', error);
      let errorMessage = 'Fatura kaydedilirken bir hata oluştu!';
      
      // Hata mesajını daha detaylı göster
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
};

// ...
// Bu fonksiyon zaten tanımlandığı için kaldırıldı

const openBarcodeModal = () => {
  setBarcodeModalVisible(true);
};

const handleCashPaymentModalClose = () => {
  // Modalı kapat ve state'i temizle
  setShowCashPaymentModal(false);
  setSavedInvoiceData(null);
  
  // Formu sıfırla
  form.resetFields();
  setInvoiceDetails([]);
  updateTotals([]);
  setActiveTab('1');
  
  // Yeni fatura için başlangıç değerleri useEffect içinde ayarlanıyor
};

const handleCashPaymentSuccess = (paymentData: any) => {
  console.log('Nakit tahsilat başarılı:', paymentData);
  
  // Modalı kapat ve state'i temizle
  setShowCashPaymentModal(false);
  setSavedInvoiceData(null);
  
  // Tek bir başarı mesajı göster
  message.success('Nakit tahsilat başarıyla kaydedildi');
  
  // Formu sıfırla
  form.resetFields();
  setInvoiceDetails([]);
  updateTotals([]);
  setActiveTab('1');
  
  // Fatura listesine yönlendir
  navigate('/invoices');
  
  // Başarı callback'ini çağır
  if (onSuccess) {
    onSuccess(savedInvoiceData);
  }
};





  
  // Başarı callback'ini çağır
  if (onSuccess && savedInvoiceData) {
    onSuccess(savedInvoiceData);
  }

  // Bileşen render
  return (
  <Card
    title={invoiceTypeDescriptions[selectedInvoiceType] || 'Fatura Oluştur'}
    extra={
      <Button type="default" onClick={() => navigate('/invoice')}>
        <ArrowLeftOutlined /> Listeye Dön
      </Button>
    }
    variant="outlined"
  >
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={async (changedValues, allValues) => {
        // Eğer değişen değerler arasında exchangeRate varsa ve 0 ise, uyarı göster
        if ('exchangeRate' in changedValues) {
          const rate = parseFloat(changedValues.exchangeRate);
          if (rate === 0) {
            message.error('TL karşılığı 0 olamaz!');
            form.setFieldsValue({ exchangeRate: 1 }); // Varsayılan olarak 1 yap
          }
        }
        
        // Fatura tarihi değiştiğinde döviz kurunu güncelle
        if ('invoiceDate' in changedValues && changedValues.invoiceDate) {
          // Geçerli bir tarih değişikliği olduğundan emin ol
          const newDate = changedValues.invoiceDate;
          
          // Tarih değişikliğini bir kez işle ve sonraki gereksiz güncellemeleri önle
          console.log('------ FATURA TARİHİ DEĞİŞİKLİĞİ BAŞLADI ------');
          console.log('Fatura tarihi değişti:', newDate.format('YYYY-MM-DD'));
          console.log('Para birimi:', allValues.currencyCode || 'TRY');
          
          // TRY olsa bile döviz kurunu güncelle (TRY için 1 olacak)
          console.log('Fatura tarihi değişti - Döviz kuru güncelleniyor...');
          try {
            // Döviz kurunu güncelle
            await loadExchangeRates();
            
            // Form'dan güncel döviz kurunu al
            const currentRate = form.getFieldValue('exchangeRate');
            console.log('Fatura tarihi değişti - Döviz kuru güncellendi:', currentRate);
            
            // Satırları ve toplamları güncelle
            if (invoiceDetails.length > 0) {
              console.log('Fatura tarihi değişti - Satırlar güncelleniyor...');
              updatePricesWithExchangeRate(allValues.currencyCode || 'TRY');
              console.log('Fatura tarihi değişti - Satırlar güncellendi:', invoiceDetails.length, 'satır');
              
              console.log('Fatura tarihi değişti - Toplamlar güncelleniyor...');
              updateTotals(invoiceDetails);
              console.log('Fatura tarihi değişti - Toplamlar güncellendi:', {
                toplam: totalAmount,
                indirim: discountAmount,
                araToplam: subtotalAmount,
                kdv: vatAmount,
                net: netAmount
              });
            }
            console.log('------ FATURA TARİHİ DEĞİŞİKLİĞİ TAMAMLANDI ------');
          } catch (error) {
            console.error('Döviz kuru güncellenirken hata oluştu:', error);
            message.error('Döviz kuru güncellenirken bir hata oluştu');
          }
        }
        
        // Müşteri/Tedarikçi değiştiğinde kontrol et
        if ('currAccCode' in changedValues && changedValues.currAccCode) {
          console.log('Müşteri/Tedarikçi değişti:', changedValues.currAccCode);
          
          // Müşteri/Tedarikçi değiştiğinde döviz kurunu güncelle
          console.log('Müşteri/Tedarikçi değişti - Döviz kuru güncelleniyor...');
          try {
            // Döviz kurunu güncelle
            loadExchangeRates().then(() => {
              // Form'dan güncel döviz kurunu ve para birimini al
              const currentRate = form.getFieldValue('exchangeRate');
              const currencyCode = form.getFieldValue('currencyCode');
              console.log('Müşteri/Tedarikçi değişti - Döviz kuru güncellendi:', currentRate);
              console.log('Müşteri/Tedarikçi değişti - Para birimi:', currencyCode);
              
              // Güncel para birimini state'e kaydet
              setCurrentCurrencyCode(currencyCode);
              
              // Satırları ve toplamları güncelle
              if (invoiceDetails.length > 0) {
                console.log('Müşteri/Tedarikçi değişti - Satırlar güncelleniyor...');
                updatePricesWithExchangeRate(currencyCode);
                console.log('Müşteri/Tedarikçi değişti - Satırlar güncellendi:', invoiceDetails.length, 'satır');
                
                console.log('Müşteri/Tedarikçi değişti - Toplamlar güncelleniyor...');
                updateTotals(invoiceDetails);
                console.log('Müşteri/Tedarikçi değişti - Toplamlar güncellendi:', {
                  toplam: totalAmount,
                  indirim: discountAmount,
                  araToplam: subtotalAmount,
                  kdv: vatAmount,
                  net: netAmount
                });
              }
            });
          } catch (error) {
            console.error('Müşteri/Tedarikçi değiştiğinde döviz kuru güncellenirken hata oluştu:', error);
          }
        }
        
        // Zorunlu alanları kontrol et - Para Birimi zorunlu değil
        const isValid = !!(allValues.invoiceDate && 
          allValues.currencyCode && 
          allValues.currAccCode && 
          allValues.officeCode && 
          allValues.warehouseCode);
        
        // TL karşılığı kontrol et
        const exchangeRate = parseFloat(allValues.exchangeRate || '0');
        const validExchangeRate = exchangeRate > 0;
        
        if (!validExchangeRate && allValues.exchangeRate !== undefined) {
          message.warning('TL karşılığı 0\'dan büyük olmalıdır');
        }
        
        console.log('Form validation check (onValuesChange):', { 
          invoiceDate: !!allValues.invoiceDate, 
          currencyCode: !!allValues.currencyCode, 
          currAccCode: !!allValues.currAccCode, 
          officeCode: !!allValues.officeCode, 
          warehouseCode: !!allValues.warehouseCode,
          exchangeRate: exchangeRate,
          validExchangeRate: validExchangeRate,
          isValid: isValid && validExchangeRate
        });
        
        setHeaderFormValid(isValid && validExchangeRate);
      }}
      initialValues={{
        invoiceDate: dayjs(), // Fatura tarihi için bugünün tarihi
        invoiceType: selectedInvoiceType,
        paymentType: '1',
        currency: 'TRY',
        currencyCode: 'TRY',
        docCurrencyCode: 'TRY',
        exchangeRate: 1,
        exchangeRateSource: 'TCMB',
        officeCode: 'M',
        warehouseCode: '101',
        discountType: '1',
        discountRate: 0,
        vatRate: 18,
        isPriceIncludeVat: false
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        {/* T.C. Merkez Bankası / Serbest Piyasa butonları kaldırıldı */}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          // Sekme değişiminde zorunlu alanları kontrol et - Para Birimi zorunlu değil
          if (key === '2' || key === '3') {
            const values = form.getFieldsValue(['invoiceDate', 'currAccCode', 'officeCode', 'warehouseCode']);
            
            // Tüm gerekli alanlar doldurulmuşsa headerFormValid'i true yap
            const isValid = !!(values.invoiceDate && 
              values.currAccCode && 
              values.officeCode && 
              values.warehouseCode);
            
            if (!isValid) {
              message.error('Lütfen tüm zorunlu alanları doldurunuz!');
              return;
            }
            
            if (key === '3' && invoiceDetails.length === 0) {
              message.error('Lütfen en az bir fatura satırı ekleyiniz!');
              return;
            }
          }
          
          handleTabChange(key);
        }}
        // forceRender özelliği Ant Design Tabs bileşeninde bulunmuyor
        items={[
          {
            key: '1',
            label: 'BAŞLIK',
            children: (
              <>
                <InvoiceHeader 
                  form={form}
                  customers={customers}
                  vendors={vendors}
                  offices={offices}
                  warehouses={warehouses}
                  currencies={currencies}
                  loadingCurrencies={loadingCurrencies}
                  isReturn={isReturn}
                  setIsReturn={setIsReturn}
                  isEInvoice={isEInvoice}
                  setIsEInvoice={setIsEInvoice}
                  onCurrencyChange={handleCurrencyChange}
                  onExchangeRateChange={handleExchangeRateChange}
                  onExchangeRateSourceChange={handleExchangeRateSourceChange}
                  onTaxTypeChange={handleTaxTypeChange}
                  invoiceType={selectedInvoiceType}
                  taxTypes={taxTypes}
                  loadingTaxTypes={loadingTaxTypes}
                />
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      // Zorunlu alanları kontrol et - Para Birimi zorunlu değil
                      const values = form.getFieldsValue(['invoiceDate', 'currAccCode', 'officeCode', 'warehouseCode', 'exchangeRate']);
                      
                      const isValid = !!(values.invoiceDate && 
                        values.currAccCode && 
                        values.officeCode && 
                        values.warehouseCode);
                      
                      // TL karşılığı kontrol et
                      const exchangeRate = parseFloat(values.exchangeRate || '0');
                      const validExchangeRate = exchangeRate > 0;
                      
                      if (isValid && validExchangeRate) {
                        setHeaderFormValid(true);
                        handleTabChange('2');
                      } else {
                        setHeaderFormValid(false);
                        
                        if (!isValid) {
                          message.error('Lütfen tüm zorunlu alanları doldurunuz!');
                        }
                        
                        if (!validExchangeRate) {
                          message.error('TL karşılığı 0\'dan büyük olmalıdır!');
                        }
                        
                        // Hangi alanların eksik olduğunu göster - Para Birimi zorunlu değil
                        if (!values.invoiceDate) message.warning('Fatura Tarihi boş olamaz');
                        if (!values.currAccCode) message.warning('Müşteri/Tedarikçi boş olamaz');
                        if (!values.officeCode) message.warning('Ofis boş olamaz');
                        if (!values.warehouseCode) message.warning('Depo boş olamaz');
                      }
                    }} 
                  >
                    İLERİ
                  </Button>
                </div>
              </>
            )
          },
          {
            key: '2',
            label: 'SATIRLAR',
            disabled: true, // Her zaman devre dışı bırak, programatik olarak kontrol edeceğiz
            children: (
              <InvoiceLines 
                invoiceDetails={invoiceDetails}
                addInvoiceDetail={addInvoiceDetail}
                updateInvoiceDetail={updateInvoiceDetail}
                removeInvoiceDetail={removeInvoiceDetail}
                showBarcodeModal={openBarcodeModal}
                currencyCode={currentCurrencyCode || 'TRY'}
                loadingProducts={loadingProducts}
                calculateLineAmounts={calculateLineAmounts}
                isPriceIncludeVat={isPriceIncludeVat}
                units={units}
                products={products}
              />
            )
          },
          {
            key: '3',
            label: 'TOPLAM',
            disabled: !(headerFormValid && invoiceDetails.length > 0), // Başlık geçerli ve en az bir satır varsa aktif olsun
            children: (
              <>
                <InvoiceSummary 
                  form={form}
                  totalAmount={totalAmount}
                  discountAmount={discountAmount}
                  subtotalAmount={subtotalAmount}
                  vatAmount={vatAmount}
                  netAmount={netAmount}
                  onSubmit={handleSave}
                  loading={loading}
                  currencyCode={currentCurrencyCode}
                  exchangeRate={exchangeRate}
                />
                
                {/* TOPLAM sekmesine kaydet butonu eklendi */}
                <Row justify="end" style={{ marginTop: '20px' }}>
                  <Col>
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />} 
                      onClick={handleSave} 
                      loading={loading}
                      size="large"
                    >
                      K A Y D E T
                    </Button>
                  </Col>
                </Row>
              </>
            )
          }
        ]}
      />
    </Form>
    
    {/* Barkod Modal */}
    <BarcodeModal
      open={barcodeModalVisible}
      onClose={() => {
        // Barkod Modal'ı kapat
        setBarcodeModalVisible(false);
        
        // Tüm ilgili state'leri sıfırla
        setBarcodeInput('');
        setProductVariants([]);
        setScannedItems([]);
      }}
      setScannedItems={setScannedItems}
      barcodeInput={barcodeInput}
      setBarcodeInput={setBarcodeInput}
      onSearch={searchProductVariantsByBarcode}
      onSearchByProductCodeOrDescription={(searchText) => {
        // Ürün kodu veya açıklaması ile arama - doğrudan ProductCodeOrDescription API'sini çağır
        console.log('Ürün kodu/açıklaması ile arama yapılıyor (Switch ile):', searchText);
        productApi.getProductVariantsByProductCodeOrDescription(searchText)
          .then(response => {
            console.log('Ürün kodu/açıklaması araması sonucu:', response);
            setProductVariants(response || []);
            if (response && response.length === 1) {
              // Tek sonuç varsa otomatik ekle
              addVariantToScannedList(response[0]);
            } else if (response && response.length > 1) {
              message.info(`'${searchText}' için ${response.length} sonuç bulundu`);
            } else {
              message.warning(`'${searchText}' için hiçbir ürün bulunamadı`);
            }
          })
          .catch(error => {
            console.error('Ürün kodu/açıklaması ile arama hatası:', error);
            message.error('Ürün arama sırasında bir hata oluştu');
            setProductVariants([]);
          })
          .finally(() => {
            setLoadingVariants(false);
          });
      }}
      loading={loadingVariants}
      productVariants={productVariants}
      setProductVariants={setProductVariants}
      inputRef={barcodeInputRef}
      scannedItems={scannedItems}
      isPriceIncludeVat={isPriceIncludeVat}
      getProductPrice={getProductPriceAndAddVariant}
      inventoryStock={inventoryStock}
      loadingInventory={loadingInventory}
      currencyCode={currentCurrencyCode}
      taxTypeMode={taxTypeMode}
      removeScannedItem={(index) => {
        const updatedItems = [...scannedItems];
        updatedItems.splice(index, 1);
        setScannedItems(updatedItems);
      }}
      removeAllScannedItems={() => setScannedItems([])}
      updateScannedItemQuantity={(index, quantity) => {
        const updatedItems = [...scannedItems];
        updatedItems[index] = { ...updatedItems[index], quantity };
        setScannedItems(updatedItems);
      }}
      updateScannedItemPrice={(index, price) => {
        const updatedItems = [...scannedItems];
        updatedItems[index] = { 
          ...updatedItems[index], 
          variant: { 
            ...updatedItems[index].variant, 
            salesPrice1: price 
          } 
        };
        setScannedItems(updatedItems);
      }}
      addAllToInvoice={() => {
        // Seçili para birimini al
        const currencyCode = form.getFieldValue('docCurrencyCode');
        
        // Taranan ürünleri fatura satırlarına ekle
        const newDetails = scannedItems.map(item => {
          const { variant, quantity } = item;
          
          // Varyant bilgilerinden InvoiceDetail nesnesi oluştur
          const detail: InvoiceDetail = {
            id: uuidv4(),
            itemCode: variant.productCode,
            quantity: quantity,
            unitOfMeasureCode: variant.unitOfMeasureCode1 || 'AD',
            unitPrice: variant.salesPrice1 || 0,
            vatRate: taxTypeMode === 'vergisiz' ? 0 : (variant.vatRate || 10), // null olabilir, varsayılan değer eklendi
            discountRate: 0,
            description: variant.productDescription,
            productDescription: variant.productDescription,
            colorCode: variant.colorCode,
            colorDescription: variant.colorDescription || '',
            itemDim1Code: variant.itemDim1Code || '',
            currencyCode: currentCurrencyCode || 'TRY' // Güncel para birimini ekle
          };
          
          return calculateLineAmounts(detail);
        });
        
        const allDetails = [...invoiceDetails, ...newDetails];
        setInvoiceDetails(allDetails);
        
        // Para birimine göre toplamları güncelle
        updateTotals(allDetails);
        
        // Barkod Modal'ı kapat ve tüm değişkenleri temizle
        setBarcodeModalVisible(false);
        setScannedItems([]);
        setBarcodeInput('');
        setProductVariants([]);
      }}
    />
    
    {/* Nakit tahsilat modal - Her zaman render et, görünürlüğü isVisible ile kontrol et */}
    <CashPaymentModal
      isVisible={showCashPaymentModal}
      onClose={handleCashPaymentModalClose}
      onSuccess={handleCashPaymentSuccess}
      invoiceHeaderID={savedInvoiceData?.id || ''}
      invoiceNumber={savedInvoiceData?.invoiceNumber || ''}
      invoiceAmount={savedInvoiceData?.amount || 0}
      currencyCode={savedInvoiceData?.currencyCode || 'TRY'}
      currAccCode={savedInvoiceData?.currAccCode || ''}
      currAccTypeCode={savedInvoiceData?.currAccTypeCode || 3}
      officeCode={savedInvoiceData?.officeCode || ''}
    />
    

  </Card>
  );
};

export default InvoiceForm;