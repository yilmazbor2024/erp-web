import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Tabs, message, Row, Col, Input, InputRef, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined, InfoCircleOutlined, BarcodeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { exchangeRateApi, ExchangeRateSource } from '../../services/exchangeRateApi';
import { v4 as uuidv4 } from 'uuid';

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
interface InvoiceFormNewProps {
  type?: InvoiceType;
  onSuccess?: (data: any) => void;
}

// const { TabPane } = Tabs; // Artık kullanılmıyor

const InvoiceFormNew = ({ 
  type = InvoiceType.WHOLESALE_SALES, 
  onSuccess 
}: InvoiceFormNewProps) => {
  // Form ve yükleme durumu
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  // Zaten mevcut olan değişkeni tekrar tanımlamaya gerek yok
  
  // Sekme kontrolü için state
  const [activeTab, setActiveTab] = useState<string>('1'); // 1: BAŞLIK, 2: SATIR, 3: TOPLAM
  const [headerFormValid, setHeaderFormValid] = useState<boolean>(false);
  
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
    form.setFieldsValue({ currencyCode });
    
    // TRY dışında bir para birimi seçildiğinde ve döviz kurları yüklenmemişse
    if (currencyCode !== 'TRY' && Object.keys(exchangeRates).length > 0) {
      updatePricesWithExchangeRate(currencyCode);
    }
  };
  
  // Döviz kuru değiştiğinde çalışacak fonksiyon
  const handleExchangeRateChange = (rate: number) => {
    setExchangeRate(rate);
    form.setFieldsValue({ exchangeRate: rate });
  };
  
  // Döviz kuru kaynağı değiştiğinde çalışacak fonksiyon
  const handleExchangeRateSourceChange = (e: RadioChangeEvent) => {
    const source = e.target.value;
    setExchangeRateSource(source);
    form.setFieldsValue({ exchangeRateSource: source });
    
    // Seçilen para birimi ve tarihe göre kur bilgisini yeni kaynaktan al
    const currencyCode = form.getFieldValue('docCurrencyCode');
    if (currencyCode && currencyCode !== 'TRY') {
      const invoiceDate = form.getFieldValue('invoiceDate');
      if (invoiceDate) {
        // Döviz kurlarını yeniden yükle
        loadExchangeRates();
      }
    }
  };
  
  // Döviz kuru ile fiyatları güncelle
  const updatePricesWithExchangeRate = (currencyCode: string) => {
    if (currencyCode === 'TRY' || !exchangeRates[currencyCode]) {
      return;
    }
    
    // Seçilen para biriminin TL karşılığı
    const rate = exchangeRates[currencyCode];
    
    if (invoiceDetails.length > 0) {
      const updatedDetails = invoiceDetails.map(detail => {
        // Eğer birim fiyat TL ise, seçilen para birimine çevir
        let newUnitPrice = detail.unitPrice;
        if (detail.currencyCode === 'TRY' || !detail.currencyCode) {
          newUnitPrice = detail.unitPrice / rate;
        }
        
        return {
          ...detail,
          unitPrice: newUnitPrice,
          totalAmount: detail.quantity * newUnitPrice,
          discountAmount: (detail.quantity * newUnitPrice * (detail.discountRate || 0)) / 100,
          subtotalAmount: (detail.quantity * newUnitPrice) - ((detail.quantity * newUnitPrice * (detail.discountRate || 0)) / 100),
          vatAmount: ((detail.quantity * newUnitPrice) - ((detail.quantity * newUnitPrice * (detail.discountRate || 0)) / 100)) * (detail.vatRate / 100),
          netAmount: ((detail.quantity * newUnitPrice) - ((detail.quantity * newUnitPrice * (detail.discountRate || 0)) / 100)) * (1 + (detail.vatRate / 100)),
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

  // Ürün varyantlarını barkod ile arama
  const searchProductVariantsByBarcode = async (barcode: string) => {
    if (!barcode || barcode.trim() === '') {
      message.warning('Lütfen bir barkod girin');
      return;
    }
    
    setLoadingVariants(true);
    try {
      // Önce barkod ile ara
      const response = await productApi.getProductVariantsByBarcode(barcode);
      
      if (response && response.length > 0) {
        setProductVariants(response);
        // İlk varyantı otomatik olarak listeye ekle
        if (response[0]) addVariantToScannedList(response[0]);
      } else {
        // Barkod ile bulunamazsa ürün kodu veya açıklama ile ara
        const altResponse = await productApi.getProductVariantsByProductCodeOrDescription(barcode);
        setProductVariants(altResponse);
        message.info(`Barkod ile ürün bulunamadı, '${barcode}' için ${altResponse.length} sonuç bulundu`);
      }
    } catch (error) {
      console.error('Ürün arama hatası:', error);
      message.error('Ürün arama sırasında bir hata oluştu');
    } finally {
      setLoadingVariants(false);
    }
  };
  
  // Varyantı taranan ürünler listesine ekle
  const addVariantToScannedList = (variant: ProductVariant) => {
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
    const unitPrice = parseFloat(detail.unitPrice?.toString() || '0');
    const vatRate = parseFloat(detail.vatRate?.toString() || '0');
    const discountRate = parseFloat(detail.discountRate?.toString() || '0');
    
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
    let tryEquivalent = unitPrice;
    if (useCurrencyCode !== 'TRY' && currentExchangeRate > 0) {
      tryEquivalent = unitPrice * currentExchangeRate;
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
            // Varyantı taranan ürünler listesine ekle
            addVariantToScannedList(variant);
            return; // Başarılı olduğu için fonksiyondan çık
          }
        }
        
        // Fiyat listesinde bulunamadıysa, eski yöntemi dene
        console.log('Fiyat listesinde bulunamadı, eski yöntemi deniyoruz...');
      } catch (apiError) {
        console.error('Fiyat listesi API hatası:', apiError);
        // Hata durumunda eski yöntemi dene
      }
      
      // Eski yöntem: Ürün koduna göre fiyat listesini getir
      const priceList = await productApi.getProductPriceList(variant.productCode);
      
      if (priceList.length > 0) {
        // Fiyat listesinden ilk fiyatı al (en güncel fiyat)
        const firstPrice = priceList[0];
        
        // Varyantın fiyat ve KDV bilgilerini güncelle
        variant.salesPrice1 = firstPrice.birimFiyat || 0;
        variant.vatRate = firstPrice.vatRate || 10;
        console.log('Eski yöntemle fiyat bilgisi güncellendi:', variant.salesPrice1, 'KDV:', variant.vatRate);
      } else {
        console.log('Fiyat listesi bulunamadı, varsayılan değerler kullanılacak');
      }
      
      // Varyantı taranan ürünler listesine ekle
      addVariantToScannedList(variant);
      
    } catch (error) {
      console.error('Ürün fiyatı getirilirken hata oluştu:', error);
      // Hata olsa bile varyantı ekle
      addVariantToScannedList(variant);
      
      // Hata durumunda da kullanıcı hızlıca yeni barkod girebilsin
      message.error('Ürün fiyatı alınırken bir hata oluştu, varsayılan fiyat kullanıldı.');
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
      console.log('Form Bileşeni Yüklendi:', invoiceTypeDescriptions[type]);
      
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

// Bu kısım loadData fonksiyonuna taşındı

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
    
    setHeaderFormValid(isValid);
  };
  
  // Form değişikliklerini hemen kontrol et
  handleFormChange();
  
  // Form alanlarını izlemek için useEffect içinde form'un değerlerini izliyoruz
  // Bu, form değerleri değiştiğinde useEffect'in yeniden çalışmasını sağlar
  const formValues = form.getFieldsValue();
  
  // Form.Item onChange event'leri form'un değerlerini değiştirecek ve bu useEffect'i tetikleyecek
}, [form]);

// Fatura detayları değiştiğinde toplamları güncelle
useEffect(() => {
if (invoiceDetails.length > 0) {
  updateTotals(invoiceDetails);
}
}, [invoiceDetails]);

// Fatura tipinin adını döndüren yardımcı fonksiyon
const getInvoiceTypeName = (invoiceType: InvoiceType): string => {
return invoiceTypeDescriptions[invoiceType] || 'Fatura';
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

setInvoiceDetails([...invoiceDetails, newDetail]);
};

// Not: calculateLineAmounts fonksiyonu zaten yukarıda tanımlandığı için burada kaldırıldı

// Satır güncelleme fonksiyonu
const updateInvoiceDetail = (id: string, field: string, value: any) => {
  // isPriceIncludeVat değiştiğinde tüm satırları güncelle
  if (field === 'isPriceIncludeVat') {
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
    return;
  }
  
  // Belirli bir satırı güncelle
  if (id) {
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

// Satır silme fonksiyonu
const removeInvoiceDetail = (id: string) => {
const updatedDetails = invoiceDetails.filter(detail => detail.id !== id);
setInvoiceDetails(updatedDetails);
updateTotals(updatedDetails);
};

// Sekme değiştirme işleyicisi
const handleTabChange = (activeKey: string) => {
setActiveTab(activeKey);
};

// Kaydetme işleyicisi
const handleSave = () => {
form.submit();
};

// Barkod modal açma işlevi
const openBarcodeModal = () => {
setBarcodeModalVisible(true);
};

// Form gönderme işleyicisi
const navigate = useNavigate();
const onFinish = async (values: any) => {
  try {
    setLoading(true);
    
    // Güncel döviz kuru ve para birimi bilgilerini al
    const currencyCode = values.currencyCode || 'TRY';
    const currentExchangeRate = currencyCode === 'TRY' ? 1 : (form.getFieldValue('exchangeRate') || 1);
    
    // Fatura detaylarını hazırla
    const details = invoiceDetails.map(detail => {
      // Her satır için TL karşılığı tutarını hesapla
      const tryEquivalentAmount = currencyCode === 'TRY' ? 
        (detail.netAmount || 0) : // TRY ise aynı tutarı kullan
        (detail.netAmount || 0) * currentExchangeRate; // Diğer para birimleri için döviz kurunu kullan
      
      return {
        itemCode: detail.itemCode,
        quantity: detail.quantity,
        unitOfMeasureCode: detail.unitOfMeasureCode,
        unitPrice: detail.unitPrice,
        vatRate: detail.vatRate,
        description: detail.description || detail.productDescription,
        discountRate: detail.discountRate || 0,
        totalAmount: detail.totalAmount,
        discountAmount: detail.discountAmount,
        subtotalAmount: detail.subtotalAmount,
        vatAmount: detail.vatAmount,
        netAmount: detail.netAmount,
        colorCode: detail.colorCode || '',
        colorDescription: detail.colorDescription || '',
        itemDim1Code: detail.itemDim1Code || '',
        exchangeRate: currentExchangeRate, // Güncel döviz kurunu kullan
        tryEquivalent: parseFloat(tryEquivalentAmount.toFixed(2)) // TL karşılığı tutarı (2 ondalık basamakla)
      };
    });
    
    // Toplam TL karşılığını hesapla
    const tryEquivalentTotal = currencyCode === 'TRY' ?
      netAmount : // TRY ise aynı tutarı kullan
      netAmount * currentExchangeRate; // Diğer para birimleri için döviz kurunu kullan
    
    // API isteği için veri hazırla
    const request: CreateInvoiceRequest = {
      invoiceNumber: values.invoiceNumber,
      invoiceTypeCode: type.toString(),
      invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
      invoiceTime: dayjs().format('HH:mm:ss'),
      currAccCode: values.currAccCode,
      currAccTypeCode: currAccType,
      docCurrencyCode: currencyCode,
      companyCode: '001', // Şirket kodu varsayılan olarak 001
      officeCode: values.officeCode,
      warehouseCode: values.warehouseCode,
      customerCode: currAccType === CurrAccType.CUSTOMER ? values.currAccCode : undefined,
      vendorCode: currAccType === CurrAccType.VENDOR ? values.currAccCode : undefined,
      isReturn: isReturn,
      isEInvoice: isEInvoice,
      notes: values.notes,
      processCode: values.processCode,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      subtotalAmount: subtotalAmount,
      vatAmount: vatAmount,
      netAmount: netAmount,
      exchangeRate: currentExchangeRate, // Güncel döviz kurunu kullan
      tryEquivalentTotal: parseFloat(tryEquivalentTotal.toFixed(2)), // Toplam TL karşılığı (2 ondalık basamakla)
      details: details
    };
    
    // API'ye gönder - Fatura tipine göre doğru API metodunu seçiyoruz
    let response;
    try {
      if (type === InvoiceType.WHOLESALE_SALES) {
        response = await invoiceApi.createWholesaleInvoice(request);
      } else if (type === InvoiceType.WHOLESALE_PURCHASE) {
        response = await invoiceApi.createWholesalePurchaseInvoice(request);
      } else if (type === InvoiceType.EXPENSE_SALES || type === InvoiceType.EXPENSE_PURCHASE) {
        // Masraf faturaları için aynı API metodu kullanılıyor
        response = await invoiceApi.createExpenseInvoice(request);
      }
      
      if (!response) {
        throw new Error('API yanıt vermedi');
      }
    } catch (error) {
      console.error('API çağrısı hatası:', error);
      throw error; // Üst catch bloğunda yakalanacak
    }
    
    if (response && response.success) {
      message.success('Fatura başarıyla oluşturuldu');
      
      // Başarılı callback'i çağır
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Formu sıfırla
      form.resetFields();
      setInvoiceDetails([]);
      setScannedItems([]);
      setActiveTab('1');
      
      // Başarılı olursa fatura listesine yönlendir
      navigate('/invoices');
    } else {
      const errorMessage = response?.message || 'Fatura oluşturulurken bir hata oluştu';
      message.error(errorMessage);
    }
  } catch (err) {
    console.error('Fatura oluşturma hatası:', err);
    message.error('Fatura oluşturulurken bir hata oluştu');
  } finally {
    setLoading(false);
  }
};

// Bileşen render
return (
  <Card>
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        invoiceType: '1',
        paymentType: '1',
        currency: 'TRY',
        exchangeRate: 1,
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
        onChange={handleTabChange}
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
                
                <Row justify="end" style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    onClick={() => handleTabChange('2')}
                    disabled={!headerFormValid}
                    icon={<ArrowRightOutlined />}
                  >
                    İleri
                  </Button>
                </Row>
              </>
            )
          },
          {
            key: '2',
            label: 'SATIRLAR',
            disabled: !headerFormValid,
            children: (
              <>
                <InvoiceLines 
                  invoiceDetails={invoiceDetails}
                  addInvoiceDetail={addInvoiceDetail}
                  updateInvoiceDetail={updateInvoiceDetail}
                  removeInvoiceDetail={removeInvoiceDetail}
                  showBarcodeModal={openBarcodeModal}
                  currencyCode={form.getFieldValue('currencyCode') || 'TRY'}
                  loadingProducts={loadingProducts}
                  calculateLineAmounts={calculateLineAmounts}
                  isPriceIncludeVat={false}
                  units={units}
                  products={products}
                  form={form}
                />
                
                <Row justify="space-between" style={{ marginTop: 16 }}>
                  <Button 
                    onClick={() => handleTabChange('1')}
                    icon={<ArrowLeftOutlined />}
                  >
                    Geri
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={() => handleTabChange('3')}
                    disabled={invoiceDetails.length === 0}
                    icon={<ArrowRightOutlined />}
                  >
                    İleri
                  </Button>
                </Row>
              </>
            )
          },
          {
            key: '3',
            label: 'TOPLAM',
            disabled: !headerFormValid || invoiceDetails.length === 0,
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
                
                <Row justify="space-between" style={{ marginTop: 16 }}>
                  <Button 
                    onClick={() => handleTabChange('2')}
                    icon={<ArrowLeftOutlined />}
                  >
                    Geri
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Kaydet
                  </Button>
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
      loading={loadingVariants}
      productVariants={productVariants}
      setProductVariants={setProductVariants}
      inputRef={barcodeInputRef}
      scannedItems={scannedItems}
      isPriceIncludeVat={false}
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
            itemDim1Code: variant.itemDim1Code || ''
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

export default InvoiceFormNew;