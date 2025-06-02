import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Tabs, message, Row, Col, Input, InputRef, Radio, InputNumber, Select } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined, InfoCircleOutlined, BarcodeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import { exchangeRateApi, ExchangeRateSource } from '../../services/exchangeRateApi';
import { v4 as uuidv4 } from 'uuid';

// API Base URL
const API_BASE_URL = 'http://localhost:5180';

// Bileşenler
import InvoiceHeader from './InvoiceHeader';
import InvoiceLines from './InvoiceLines';
import InvoiceSummary from './InvoiceSummary';
import BarcodeModal from '../common/BarcodeModal';

// Servisler ve tipler
import invoiceApi from '../../services/invoiceApi';
import inventoryApi, { InventoryStock } from '../../services/inventoryApi';
import { customerApi, vendorApi, officeApi, warehouseApi, currencyApi } from '../../services/entityApi';
import productApi, { ProductVariant } from '../../services/productApi';
import productPriceListApi from '../../services/productPriceListApi';
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
  colorCode?: string;
  colorDescription?: string;
  itemDim1Code?: string;
  currencyCode?: string;
  exchangeRate?: number;
  tryEquivalent?: number; // TL karşılığı
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
  details: any[];
}

// Bileşen props
interface InvoiceFormProps {
  type?: InvoiceType;
  onSuccess?: (data: any) => void;
}

// const { TabPane } = Tabs; // Artık kullanılmıyor

const InvoiceForm = ({ 
  type = InvoiceType.WHOLESALE_SALES, 
  onSuccess 
}: InvoiceFormProps) => {
  // Form ve yükleme durumu
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  
  // Form instance'ının doğru şekilde bağlanmasını sağla
  useEffect(() => {
    // Form instance'ını başlangıç değerleriyle ayarla
    form.setFieldsValue({
      invoiceDate: dayjs(),
      docCurrencyCode: 'TRY',
      currencyCode: 'TRY',
      exchangeRate: 1,
      exchangeRateSource: 'TCMB'
    });
  }, [form]);
  // Zaten mevcut olan değişkeni tekrar tanımlamaya gerek yok
  
  // Sekme kontrolü için state
  const [activeTab, setActiveTab] = useState<string>('1'); // 1: BAŞLIK, 
  const [headerFormValid, setHeaderFormValid] = useState<boolean>(false); // Form validasyonu için state - başlangıçta kesinlikle false olarak ayarla
  
  // Veri state'leri
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>(type);
  const [currAccType, setCurrAccType] = useState<CurrAccType>(
    type === InvoiceType.WHOLESALE_PURCHASE || type === InvoiceType.EXPENSE_PURCHASE
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
  
  // Barkod tarama ile ilgili state'ler
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState<boolean>(false);
  const [scannedItems, setScannedItems] = useState<{variant: ProductVariant; quantity: number}[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(false);
  const barcodeInputRef = useRef<InputRef>(null);
  
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
  const handleCurrencyChange = (currencyCode: string) => {
    setCurrentCurrencyCode(currencyCode);
    form.setFieldsValue({ 
      currencyCode,
      docCurrencyCode: currencyCode // docCurrencyCode'u da güncelle
    });
    
    // Para birimi değiştiğinde her zaman tüm satırların para birimini güncelle
    if (Object.keys(exchangeRates).length > 0 || currencyCode === 'TRY') {
      updatePricesWithExchangeRate(currencyCode);
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
        
        return {
          ...detail,
          unitPrice: newUnitPrice,
          totalAmount,
          discountAmount,
          subtotalAmount,
          vatAmount,
          netAmount,
          currencyCode: currencyCode,
          exchangeRate: rate
        };
      });
      
      setInvoiceDetails(updatedDetails);
      updateTotals(updatedDetails);
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
  
  // Satır tutarlarını hesapla
  const calculateLineAmounts = (detail: InvoiceDetail, currencyCode?: string): InvoiceDetail => {
    const quantity = parseFloat(detail.quantity?.toString() || '0');
    const vatRate = parseFloat(detail.vatRate?.toString() || '0');
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
            variant.vatRate = 10; // Varsayılan KDV oranı 10
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
            variant.vatRate = firstPrice.vatRate || 10;
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
      variant.vatRate = 10;
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
        try {
          setLoadingCustomers(true);
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
        } finally {
          setLoadingCustomers(false);
        }
      };
      
      // Tedarikçileri yükle
      const loadVendors = async () => {
        try {
          setLoadingVendors(true);
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
      
      // Diğer verileri yükle
      loadPromises.push(loadOffices());
      loadPromises.push(loadWarehouses());
      loadPromises.push(loadCurrencies());
      
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
      console.log('Form Bileşeni Yüklendi:', invoiceTypeDescriptions[type as keyof typeof invoiceTypeDescriptions]);
      
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

// Yeni satır ekle
const addInvoiceDetail = () => {
  const newDetail: InvoiceDetail = {
    id: uuidv4(),
    itemCode: '',
    quantity: 1,
    unitOfMeasureCode: 'AD',// Ürün varyant detayından gelmeli
    unitPrice: 0, //Eğer varsa barkod modaldan fiyat listesinden gelmeli
    vatRate: 10, //Eğer varsa barkod modaldan fiyat listesinden gelmeli
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

// Form yüklenince verileri yükle
useEffect(() => {
  loadInitialData();
}, []);

// Form değişikliklerini izle
useEffect(() => {
  // Form değişikliklerini kontrol eden fonksiyon
  const handleFormChange = () => {
    // Gerekli alanları kontrol et
    const values = form.getFieldsValue(['invoiceDate', 'currencyCode', 'currAccCode', 'officeCode', 'warehouseCode']);
    
    // Tüm gerekli alanlar doldurulmuşsa headerFormValid'i true yap
    const isValid = !!(values.invoiceDate && 
      values.currencyCode && 
      values.currAccCode && 
      values.officeCode && 
      values.warehouseCode);
    
    console.log('Form validation check:', { 
      invoiceDate: !!values.invoiceDate, 
      currencyCode: !!values.currencyCode, 
      currAccCode: !!values.currAccCode, 
      officeCode: !!values.officeCode, 
      warehouseCode: !!values.warehouseCode,
      isValid: isValid
    });
    
    setHeaderFormValid(isValid);
    
    // Tarih değiştiğinde güncel kur bilgisini al
    const prevInvoiceDate = form.getFieldValue('_prevInvoiceDate');
    const currentInvoiceDate = values.invoiceDate;
    
    if (currentInvoiceDate && (!prevInvoiceDate || !currentInvoiceDate.isSame(prevInvoiceDate))) {
      // Önceki tarihi sakla
      form.setFieldsValue({ _prevInvoiceDate: currentInvoiceDate });
      
      // Mevcut para birimini al
      const currentCurrency = form.getFieldValue('docCurrencyCode') || 'TRY';
      
      if (currentCurrency !== 'TRY') {
        // Seçili döviz kuru kaynağını al
        const rateSourceStr = form.getFieldValue('exchangeRateSource') || 'TCMB';
        const rateSource = rateSourceStr === 'TCMB' ? ExchangeRateSource.CENTRAL_BANK : ExchangeRateSource.FREE_MARKET;
        
        // Yeni tarih için döviz kurlarını getir
        const formattedDate = currentInvoiceDate.format('YYYY-MM-DD');
        
        // API'den döviz kurlarını getir
        exchangeRateApi.getExchangeRatesByDate(formattedDate, rateSource)
          .then((rates) => {
            // Seçili para birimi için kur bilgisini bul
            const currencyRate = rates.find(r => r.currencyCode === currentCurrency);
            
            if (currencyRate) {
              // Kur değerini belirle (satış kuru)
              const newRate = rateSource === ExchangeRateSource.CENTRAL_BANK
                ? currencyRate.banknoteSellingRate 
                : currencyRate.freeMarketSellingRate;
              
              // Yeni kur değerini ayarla
              setExchangeRate(newRate);
              form.setFieldsValue({ exchangeRate: newRate });
              
              // Tüm satırların TL karşılığını güncelle
              if (invoiceDetails.length > 0) {
                const updatedDetails = invoiceDetails.map(detail => {
                  const netAmount = detail.netAmount || 0;
                  return {
                    ...detail,
                    exchangeRate: newRate,
                    tryEquivalent: netAmount * newRate
                  };
                });
                
                setInvoiceDetails(updatedDetails);
                updateTotals(updatedDetails);
                console.log('Tarih değişti: Döviz kuru güncellendi ve TL karşılıkları yeniden hesaplandı');
              }
            }
          })
          .catch((error) => {
            console.error('Tarih değişikliğinde döviz kuru getirme hatası:', error);
            message.error('Döviz kuru bilgisi alınamadı!');
          });
      } else {
        console.log('Tarih değişti: Para birimi TRY, kur 1 olarak ayarlandı');
      }
    }
  };
  
  // Form değişikliklerini hemen kontrol et
  handleFormChange();
  
  // Form değişikliklerini izlemek için form'un değerlerini izliyoruz
  // Ant Design Form'da subscribe metodu olmadığı için onValuesChange kullanılacak
}, [form]);

// Satır güncelleme fonksiyonu
const updateInvoiceDetail = (id: string, field: string, value: any) => {
  if (!id || !field) {
    console.error('Geçersiz id veya alan adı');
    return;
  }
  
  // isPriceIncludeVat değiştiğinde tüm satırları güncelle
  if (field === 'isPriceIncludeVat') {
    // KDV dahil/hariç değerini güncelle
    setIsPriceIncludeVat(value);
    form.setFieldsValue({ isPriceIncludeVat: value });
    
    const updatedDetails = invoiceDetails.map(detail => {
      // Döviz kuru bilgisini ekle
      const detailWithExchangeRate = {
        ...detail,
        exchangeRate: detail.currencyCode && detail.currencyCode !== 'TRY' ? 
          exchangeRates[detail.currencyCode] : undefined
      };
      return calculateLineAmounts(detailWithExchangeRate, currentCurrencyCode);
    });
    
    setInvoiceDetails(updatedDetails);
    updateTotals(updatedDetails);
  } else {
    // Diğer alanlar için normal güncelleme
    const updatedDetails = invoiceDetails.map(detail => {
      if (detail.id === id) {
        // Güncellenmiş detay
        const updatedDetail = { ...detail, [field]: value };
        
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

// Sekme değiştirme işleyicisi
const handleTabChange = (activeKey: string) => {
  setActiveTab(activeKey);
};

// Kaydetme işleyicisi
const handleSave = () => {
  console.log('Kaydet butonu tıklandı');
  message.info('Form gönderiliyor...');
  setLoading(true); // Yükleme durumunu başlat
  
  // Form validasyonunu kontrol et
  form.validateFields()
    .then(() => {
      console.log('Form doğrulandı, gönderiliyor...');
      form.submit(); // Form gönderme işlemini başlat
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
    // Yükleme durumu handleSave'de başlatıldığı için burada tekrar ayarlamaya gerek yok
    console.log('onFinish çağrıldı, form verileri:', values);
    message.loading({ content: 'Fatura kaydediliyor...', key: 'invoiceSave', duration: 0 });
    
    // Fatura tipi ve cari hesap tipi kodlarını belirle
    const invoiceTypeCode = type === InvoiceType.WHOLESALE_SALES ? 'WS' : 
                           type === InvoiceType.WHOLESALE_PURCHASE ? 'WP' : 
                           type === InvoiceType.EXPENSE_SALES ? 'EXS' : 'EXP';
    
    const currAccTypeCode = type === InvoiceType.WHOLESALE_SALES || type === InvoiceType.EXPENSE_SALES ? 
                           CurrAccType.CUSTOMER : CurrAccType.VENDOR;
    
    // Fatura detaylarını hazırla
    const details = invoiceDetails.map(detail => ({
      itemCode: detail.itemCode,
      quantity: detail.quantity,
      unitOfMeasureCode: detail.unitOfMeasureCode,
      unitPrice: detail.unitPrice,
      vatRate: detail.vatRate,
      discountRate: detail.discountRate || 0,
      description: detail.description || '',
      currencyCode: detail.currencyCode || values.docCurrencyCode,
      exchangeRate: detail.exchangeRate || values.exchangeRate
    }));
    
    // API isteği için veri hazırla
    const requestData: CreateInvoiceRequest = {
      invoiceNumber: values.invoiceNumber || 'Otomatik',
      invoiceTypeCode: values.invoiceTypeCode || invoiceTypeCode,
      invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
      invoiceTime: values.invoiceDate.format('HH:mm:ss'),
      currAccCode: values.currAccCode,
      currAccTypeCode: currAccTypeCode,
      docCurrencyCode: values.docCurrencyCode || 'TRY',
      companyCode: values.companyCode || '1',
      officeCode: values.officeCode,
      warehouseCode: values.warehouseCode,
      isReturn: values.isReturn || false,
      isEInvoice: values.isEInvoice || false,
      notes: values.notes || '',
      processCode: invoiceTypeCode,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      subtotalAmount: subtotalAmount,
      vatAmount: vatAmount,
      netAmount: netAmount,
      exchangeRate: values.exchangeRate || 1,
      tryEquivalentTotal: values.tryEquivalentTotal,
      details: details
    };
    
    // Müşteri veya tedarikçi kodunu ekle
    if (currAccTypeCode === CurrAccType.CUSTOMER) {
      requestData.customerCode = values.currAccCode;
    } else {
      requestData.vendorCode = values.currAccCode;
    }
    
    console.log('API isteği hazırlandı:', requestData);
    
    // API'ye gönder
    let response;
    try {
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
      const axiosResponse = await axiosInstance.post(endpoint, requestData);
      response = axiosResponse.data;
      
      console.log('API yanıtı:', response);
    } catch (apiError: any) {
      console.error('API çağrısı sırasında hata:', apiError);
      message.error({ content: `API hatası: ${apiError.message || 'Bilinmeyen hata'}`, key: 'invoiceSave' });
      setLoading(false);
      return;
    }
    
    // Başarılı yanıt kontrolü
    if (response && response.success) {
      message.success({ content: 'Fatura başarıyla kaydedildi!', key: 'invoiceSave', duration: 3 });
      
      // Başarı callback'ini çağır
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Formu sıfırla
      form.resetFields();
      setInvoiceDetails([]);
      updateTotals([]);
      setActiveTab('1');
      
      // Yeni fatura için başlangıç değerlerini ayarla
      form.setFieldsValue({
        invoiceDate: dayjs(),
        docCurrencyCode: 'TRY',
        currencyCode: 'TRY',
        exchangeRate: 1,
        exchangeRateSource: 'TCMB'
      });
    } else {
      // Hata mesajını göster
      const errorMessage = response?.message || 'Fatura kaydedilirken bir hata oluştu';
      message.error({ content: errorMessage, key: 'invoiceSave', duration: 3 });
      console.error('Fatura kaydetme hatası:', response);
    }
  } catch (error: any) {
    console.error('Fatura kaydetme hatası:', error);
    message.error({ content: `Fatura kaydedilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`, key: 'invoiceSave', duration: 3 });
  } finally {
    setLoading(false); // İşlem tamamlandığında yükleme durumunu sıfırla
  }
};

// Bu fonksiyon zaten tanımlandığı için kaldırıldı

// Barkod modal açma işlevi
const openBarcodeModal = () => {
  setBarcodeModalVisible(true);
};

// Bileşen render
return (
  <Card>
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={(changedValues, allValues) => {
        // Eğer değişen değerler arasında exchangeRate varsa ve 0 ise, uyarı göster
        if ('exchangeRate' in changedValues) {
          const rate = parseFloat(changedValues.exchangeRate);
          if (rate === 0) {
            message.error('TL karşılığı 0 olamaz!');
            form.setFieldsValue({ exchangeRate: 1 }); // Varsayılan olarak 1 yap
          }
        }
        
        // Zorunlu alanları kontrol et - Para Birimi zorunlu değil
        const isValid = !!(allValues.invoiceDate && 
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
        invoiceType: '1',
        paymentType: '1',
        currency: 'TRY',
        currencyCode: 'TRY',  // Para birimi için defaultValue yerine initialValues kullanıldı
        docCurrencyCode: 'TRY',  // Para birimi için defaultValue yerine initialValues kullanıldı
        exchangeRate: 1,
        exchangeRateSource: 'TCMB',  // Döviz kuru kaynağı için defaultValue yerine initialValues kullanıldı
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
                  currAccType={currAccType}
                  isReturn={isReturn}
                  setIsReturn={setIsReturn}
                  isEInvoice={isEInvoice}
                  setIsEInvoice={setIsEInvoice}
                  onCurrencyChange={handleCurrencyChange}
                  onExchangeRateChange={handleExchangeRateChange}
                  onExchangeRateSourceChange={handleExchangeRateSourceChange}
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
                currencyCode={form.getFieldValue('currencyCode') || 'TRY'}
                loadingProducts={loadingProducts}
                calculateLineAmounts={calculateLineAmounts}
                isPriceIncludeVat={isPriceIncludeVat}
                units={units}
                products={products}
                form={form}
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
        
        // Taranan ürünleri fatura detaylarına ekle
        const newDetails = scannedItems.map(item => {
          const variant = item.variant;
          const detail: InvoiceDetail = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            itemCode: variant.productCode,
            quantity: item.quantity,
            unitOfMeasureCode: variant.unitOfMeasureCode1, // unitOfMeasureCode1 kullanılıyor
            unitPrice: variant.salesPrice1,
            vatRate: variant.vatRate || 10, // null olabilir, varsayılan değer eklendi
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
  </Card>
);
};

export default InvoiceForm;