import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Tabs, message, Row, Col, Input, InputRef } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined, InfoCircleOutlined, BarcodeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
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
  const calculateLineAmounts = (detail: InvoiceDetail): InvoiceDetail => {
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
    
    return {
      ...detail,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      subtotalAmount: parseFloat(subtotalAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2))
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
        netAmount: 0
      });
      return;
    }
    
    // Toplamları hesapla
    let total = 0;
    let discount = 0;
    let subtotal = 0;
    let vat = 0;
    let net = 0;

    // Her bir satır için toplamları hesapla
    details.forEach(detail => {
      total += detail.totalAmount || 0;
      discount += detail.discountAmount || 0;
      subtotal += detail.subtotalAmount || 0;
      vat += detail.vatAmount || 0;
      net += detail.netAmount || 0;
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
      netAmount: net
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
  
  // Bu kısım kaldırıldı çünkü loadData fonksiyonu zaten tanımlanmış
  
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
const updatedDetails = invoiceDetails.map(detail => {
  if (detail.id === id) {
    // Güncellenmiş detay
    const updatedDetail = { ...detail, [field]: value };
    // Hesaplamaları yap
    return calculateLineAmounts(updatedDetail);
  }
  return detail;
});

setInvoiceDetails(updatedDetails);
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
    
    // Fatura detaylarını hazırla
    const details = invoiceDetails.map(detail => ({
      itemCode: detail.itemCode,
      quantity: detail.quantity,
      unitOfMeasureCode: detail.unitOfMeasureCode,
      unitPrice: detail.unitPrice,
      vatRate: detail.vatRate,
      description: detail.description || detail.productDescription,
      discountRate: detail.discountRate || 0,
    }));
    
    // API isteği için veri hazırla
    const request: CreateInvoiceRequest = {
      invoiceNumber: values.invoiceNumber,
      invoiceTypeCode: type.toString(),
      invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
      invoiceTime: dayjs().format('HH:mm:ss'),
      currAccCode: values.currAccCode,
      currAccTypeCode: currAccType,
      docCurrencyCode: values.currencyCode,
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
            label: 'DETAYLAR',
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
                  currencyCode={form.getFieldValue('currencyCode') || 'TRY'}
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
      onClose={() => setBarcodeModalVisible(false)}
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
            colorDescription: variant.colorDescription,
            itemDim1Code: variant.itemDim1Code
          };
          
          return calculateLineAmounts(detail);
        });
        
        const allDetails = [...invoiceDetails, ...newDetails];
        setInvoiceDetails(allDetails);
        updateTotals(allDetails);
        setBarcodeModalVisible(false);
        setScannedItems([]);
      }}
    />
  </Card>
);
};

export default InvoiceFormNew;