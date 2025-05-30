import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, DatePicker, Button, Table, InputNumber, Switch, Card, Row, Col, Divider, Typography, message, Spin, Modal, List, Badge, Tag, Checkbox, Radio, Space } from 'antd';
import { DeleteOutlined, BarcodeOutlined, ScanOutlined, InfoCircleOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceApi from '../../services/invoiceApi';
import { customerApi, warehouseApi, officeApi, vendorApi, currencyApi } from '../../services/entityApi';
import productApi, { ProductVariant, InventoryStockParams } from '../../services/productApi';
import inventoryApi, { InventoryStock } from '../../services/inventoryApi';
import productPriceListApi from '../../services/productPriceListApi';
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
  const [cashPaymentForm] = Form.useForm(); // Nakit ödeme modalı için form instance
  // KDV dahil/hariç seçeneği için state
  const [isPriceIncludeVat, setIsPriceIncludeVat] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [barcodeModalVisible, setBarcodeModalVisible] = useState<boolean>(false);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState<boolean>(false);
  const [inventoryStock, setInventoryStock] = useState<InventoryStock[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(false);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkVatRate, setBulkVatRate] = useState<number>(10); // Varsayılan KDV oranı %10
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
  
  // Barkod, ürün kodu veya açıklaması ile ürün varyantlarını ara
  const searchProductVariantsByBarcode = async () => {
    if (!barcodeInput) {
      message.warning('Lütfen bir arama terimi girin');
      return [];
    }
    try {
      setLoadingVariants(true);
      setLoadingInventory(true);
      
      let variants: ProductVariant[] = [];
      
      // Önce barkod ile ara
      try {
        console.log('Barkod ile arama yapılıyor:', barcodeInput);
        variants = await productApi.getProductVariantsByBarcode(barcodeInput);
        if (variants.length > 0) {
          console.log('Barkod ile varyant bulundu');
          // KDV oranını kontrol et ve %18 ise %10'a değiştir
          variants = variants.map(variant => ({
            ...variant,
            vatRate: variant.vatRate === 18 ? 10 : variant.vatRate
          }));
        }
      } catch (error: any) {
        // 404 hatası alınırsa sessizce devam et, diğer hataları göster
        if (error?.response?.status !== 404) {
          console.error('Barkod ile arama sırasında hata:', error);
          message.warning(`Barkod ile arama sırasında bir sorun oluştu. Ürün kodu ile arama yapılacak.`);
        }
      }
      
      // Eğer barkod ile bulunamadıysa, ürün kodu veya açıklaması ile ara
      if (variants.length === 0) {
        try {
          console.log('Ürün kodu/açıklaması ile arama yapılıyor:', barcodeInput);
          variants = await productApi.getProductVariantsByProductCodeOrDescription(barcodeInput);
          console.log('Ürün kodu ile bulunan varyant sayısı:', variants.length);
          // KDV oranını kontrol et ve %18 ise %10'a değiştir
          variants = variants.map(variant => ({
            ...variant,
            vatRate: variant.vatRate === 18 ? 10 : variant.vatRate
          }));
        } catch (error: any) {
          console.error('Ürün kodu/açıklaması ile arama sırasında hata:', error);
          // Sadece ciddi hataları kullanıcıya göster
          if (error?.response?.status === 500) {
            message.error(`Sunucu hatası: Ürün araması yapılamadı.`);
          }
        }
      }
      
      // Envanter/stok bilgisini ve fiyat listesini getir
      if (variants.length > 0) {
        try {
          // Bulunan ürünlerin kodlarını kullanarak stok bilgisini getir
          const productCodes = Array.from(new Set(variants.map(v => v.productCode)));
          
          // Stok bilgilerini ve fiyat listelerini toplu olarak getir
          const allStockInfo: InventoryStock[] = [];
          
          for (const code of productCodes) {
            // Stok bilgisini getir
            try {
              console.log(`${code} için stok bilgisi getiriliyor...`);
              const stockInfo = await inventoryApi.getInventoryStockByProductCode(code);
              console.log(`${code} için stok bilgisi alındı:`, stockInfo);
              allStockInfo.push(...stockInfo);
            } catch (e: any) {
              // 404 hatalarını sessizce yönet
              if (e?.response?.status !== 404) {
                console.error(`${code} için stok bilgisi alınırken hata:`, e);
              } else {
                console.log(`${code} için stok bilgisi bulunamadı (404)`);
              }
            }
            
            // Fiyat listesi bilgisini getir
            try {
              const priceList = await productApi.getProductPriceList(code);
              console.log(`${code} için fiyat listesi:`, priceList);
              
              // Fiyat listesi bilgisini varyantlara ekle
              if (priceList.length > 0) {
                variants = variants.map(variant => {
                  if (variant.productCode === code) {
                    // Fiyat listesinden ilk fiyatı al
                    const price = priceList[0];
                    return {
                      ...variant,
                      salesPrice1: price.birimFiyat || variant.salesPrice1,
                      vatRate: price.vatRate !== null ? price.vatRate : (variant.vatRate === 18 ? 10 : variant.vatRate)
                    };
                  }
                  return variant;
                });
              }
            } catch (e) {
              console.warn(`${code} için fiyat listesi alınırken hata:`, e);
              // Fiyat listesi alınamazsa sessizce devam et
            }
          }
          
          // Stok bilgilerini state'e kaydet ve konsola yazdır
        console.log('Tüm stok bilgileri:', allStockInfo);
        setInventoryStock(allStockInfo);
        
        // Stok bilgilerini varyantlara ekle
        variants = variants.map(variant => {
          const stock = allStockInfo.find(s => 
            s.itemCode === variant.productCode && 
            s.colorCode === variant.colorCode && 
            s.itemDim1Code === variant.itemDim1Code
          );
          
          return {
            ...variant,
            stockQty: stock ? stock.qty : 0
          };
        });
        } catch (error) {
          console.error('Stok ve fiyat bilgisi alınırken hata:', error);
          setInventoryStock([]);
        }
      } else {
        // Ürün bulunamadıysa stok bilgisini boşalt
        setInventoryStock([]);
        message.warning(`"${barcodeInput}" için ürün bulunamadı.`);
      }
      
      setProductVariants(variants);
    
    // Eğer sadece 1 varyant bulunduysa, otomatik olarak listeye ekle
    if (variants.length === 1) {
      console.log('Tek varyant bulundu, otomatik olarak listeye ekleniyor:', variants[0]);
      await getProductPriceAndAddVariant(variants[0]);
    }
    
    return variants;
    } catch (error) {
      console.error('Ürün arama sırasında hata:', error);
      message.error('Ürün arama sırasında bir hata oluştu.');
      setProductVariants([]);
      setInventoryStock([]);
      setLoadingInventory(false);
      return [];
    } finally {
      setLoadingVariants(false);
      setLoadingInventory(false);
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
  
  // Taranan bir ürünü listeden kaldır
  const removeScannedItem = (index: number) => {
    setScannedItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
    message.success('Satır listeden kaldırıldı');
  };
  
  // Tüm taranan ürünleri listeden kaldır
  const removeAllScannedItems = () => {
    setScannedItems([]);
    message.success('Tüm satırlar listeden kaldırıldı');
  };
  
  // Taranan bir ürünün miktarını güncelle
  const updateScannedItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      message.warning('Miktar 0\'dan büyük olmalıdır');
      return;
    }
    
    setScannedItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity
      };
      return updatedItems;
    });
  };
  
  // Taranan bir ürünün fiyatını güncelle
  const updateScannedItemPrice = (index: number, price: number) => {
    if (price <= 0) {
      message.warning('Fiyat 0\'dan büyük olmalıdır');
      return;
    }
    
    setScannedItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index].variant = {
        ...updatedItems[index].variant,
        salesPrice1: price
      };
      return updatedItems;
    });
  };

  // Ürün varyantını faturaya ekle
  const addProductVariantToInvoice = async (variant: ProductVariant, quantity: number = 1) => {
    try {
      // Ürün fiyatını fiyat listesinden getir
      const priceList = await productApi.getProductPriceList(variant.productCode);
      
      // Fiyat bilgilerini güncelle
      let unitPrice = variant.salesPrice1;
      let vatRate = variant.vatRate || 10;
      
      if (priceList.length > 0) {
        // Fiyat listesinden ilk fiyatı al (en güncel fiyat)
        const firstPrice = priceList[0];
        
        // Birim fiyatı güncelle
        unitPrice = firstPrice.birimFiyat || variant.salesPrice1;
        vatRate = firstPrice.vatRate || vatRate;
        
        console.log(`Ürün fiyatı fiyat listesinden getirildi: ${variant.productCode}, Fiyat: ${unitPrice}, KDV: ${vatRate}`);
      } else {
        console.log(`Ürün için fiyat listesi bulunamadı: ${variant.productCode}, Varsayılan fiyat kullanılıyor: ${unitPrice}`);
      }
      
      const newDetail: InvoiceDetail = {
        id: generateUniqueId(),
        itemCode: variant.productCode,
        quantity: quantity,
        unitOfMeasureCode: variant.unitOfMeasureCode1,
        unitPrice: unitPrice,
        vatRate: vatRate,
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
      message.success(`${variant.productDescription} faturaya eklendi (Birim Fiyat: ${unitPrice.toFixed(2)} TL)`);
    } catch (error) {
      console.error('Ürün fiyatı getirilirken hata oluştu:', error);
      
      // Hata durumunda varsayılan değerlerle devam et
      const newDetail: InvoiceDetail = {
        id: generateUniqueId(),
        itemCode: variant.productCode,
        quantity: quantity,
        unitOfMeasureCode: variant.unitOfMeasureCode1,
        unitPrice: variant.salesPrice1,
        vatRate: variant.vatRate || 10,
        description: variant.productDescription,
        productDescription: variant.productDescription,
        discountRate: 0,
        colorCode: variant.colorCode,
        colorDescription: variant.colorDescription,
        itemDim1Code: variant.itemDim1Code
      };

      setInvoiceDetails([...invoiceDetails, newDetail]);
      calculateInvoiceTotals([...invoiceDetails, newDetail]);
      message.success(`${variant.productDescription} faturaya eklendi`);
    }
  };

  // Barkod modalını kapat
  const closeBarcodeModal = () => {
    setBarcodeModalVisible(false);
    setBarcodeInput('');
    setProductVariants([]);
    setScannedItems([]);
    setInventoryStock([]);
    setBulkPrice(0);
    setBulkVatRate(10);
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
      const vatRate = item.variant.vatRate || 10;
      
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
        vatRate: 10,
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
  const updateInvoiceDetail = async (index: number, field: keyof InvoiceDetail, value: any) => {
    const updatedDetails = [...invoiceDetails];
    
    // Eğer ürün kodu değiştiyse, ilgili ürünün diğer bilgilerini de otomatik olarak doldur
    if (field === 'itemCode' && value) {
      const selectedProduct = products.find(p => p.productCode === value);
      
      if (selectedProduct) {
        console.log('Seçilen ürün:', selectedProduct);
        
        // Ürün bilgilerini otomatik doldur
        updatedDetails[index] = { 
          ...updatedDetails[index], 
          itemCode: value,
          productDescription: selectedProduct.productDescription || '',
          unitOfMeasureCode: selectedProduct.unitOfMeasureCode1 || 'ADET',
          vatRate: selectedProduct.vatRate || 10
        };
        
        try {
          // Ürün fiyatını fiyat listesinden getir
          const priceList = await productApi.getProductPriceList(value);
          
          if (priceList.length > 0) {
            // Fiyat listesinden ilk fiyatı al (en güncel fiyat)
            const firstPrice = priceList[0];
            
            // Birim fiyatı güncelle
            updatedDetails[index].unitPrice = firstPrice.birimFiyat || 0;
            updatedDetails[index].vatRate = firstPrice.vatRate || 10;
            
            console.log(`Ürün fiyatı fiyat listesinden getirildi: ${value}, Fiyat: ${updatedDetails[index].unitPrice}, KDV: ${updatedDetails[index].vatRate}`);
          } else {
            // Fiyat listesi bulunamadıysa varsayılan değerleri kullan
            updatedDetails[index].unitPrice = selectedProduct.salesPrice1 || 0;
            console.log(`Ürün için fiyat listesi bulunamadı: ${value}, Varsayılan fiyat kullanılıyor: ${updatedDetails[index].unitPrice}`);
          }
        } catch (error) {
          console.error('Ürün fiyatı getirilirken hata oluştu:', error);
          // Hata durumunda varsayılan fiyatı kullan
          updatedDetails[index].unitPrice = selectedProduct.salesPrice1 || 0;
        }
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
        open={barcodeModalVisible}
        onClose={closeBarcodeModal}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        onSearch={searchProductVariantsByBarcode}
        loading={loadingVariants}
        productVariants={productVariants}
        setProductVariants={setProductVariants}
        inputRef={barcodeInputRef}
        scannedItems={scannedItems}
        addAllToInvoice={addAllScannedItemsToInvoice}
        isPriceIncludeVat={isPriceIncludeVat}
        getProductPrice={getProductPriceAndAddVariant}
        inventoryStock={inventoryStock}
        loadingInventory={loadingInventory}
        removeScannedItem={removeScannedItem}
        removeAllScannedItems={removeAllScannedItems}
        updateScannedItemQuantity={updateScannedItemQuantity}
        updateScannedItemPrice={updateScannedItemPrice}
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
                // showArrow prop'u kaldırıldı
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
                // showArrow prop'u kaldırıldı
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
                // showArrow prop'u kaldırıldı
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
              Satır Ekle
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
          scroll={{ x: 'max-content', y: 400 }} // Yatay ve dikey kaydırma ekle, yüksekliği 400px ile sınırla
          style={{ fontSize: '0.8em', width: '100%' }} // Font boyutunu %20 küçült ve genişliği ayarla
          className="compact-table" // Başlıkları daha kompakt göstermek için özel sınıf
        >
          <Table.Column 
            title="Ürün Kodu" 
            dataIndex="itemCode" 
            key="itemCode"
            width={100} // 10 karakter genişliğinde
            render={(value, record, index) => (
              <Select
                showSearch
                value={value}
                style={{ width: '100%' }}
                placeholder="Ürün seçin"
                loading={loadingProducts}
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
                  
                  return childText.toLowerCase().includes(input.toLowerCase());
                }}
                onChange={(value) => updateInvoiceDetail(index, 'itemCode', value)}
              >
                {Array.isArray(products) && products.length > 0 ? (
                  products.map(product => (
                    <Option key={product.productCode} value={product.productCode}>
                      {product.productCode}
                    </Option>
                  ))
                ) : (
                  <Option key="empty-disabled" value="" disabled>
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
            width={250} // 25 karakter genişliğinde
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
            width={100} // 10 karakter genişliğinde
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
            width={50} // 5 karakter genişliğinde
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
            width={60} // 4 hane için 60px yeterli
            render={(value, record, index) => (
              <Select
                value={value}
                style={{ width: '100%', minWidth: '60px' }} // 4 hane için 60px yeterli
                dropdownMatchSelectWidth={false}
                // showArrow prop'u kaldırıldı
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
            width={80} // Miktar için daha dar bir sütun
            render={(value, record, index) => {
              // Birim türüne göre step ve precision değerlerini belirle
              const isUnitAdet = record.unitOfMeasureCode === 'ADET' || record.unitOfMeasureCode === 'AD';
              return (
                <InputNumber 
                  value={value} 
                  min={isUnitAdet ? 1 : 0.01} 
                  max={9999} // Maksimum 9999 değeri
                  step={isUnitAdet ? 1 : 0.01}
                  precision={isUnitAdet ? 0 : 2}
                  controls={false}
                  style={{ width: '100%', minWidth: '80px' }} // Genişliği azaltıyorum
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
            width={100} // Birim Fiyat için daha dar bir sütun
            render={(value, record, index) => (
              <InputNumber 
                value={value} 
                min={1} // Minimum 1 değeri
                max={999999} // Maksimum 999.999 değeri
                step={0.01}
                precision={2} // Virgülden sonra 2 hane
                controls={false}
                style={{ width: '100%', minWidth: '100px' }} // Genişliği azaltıyorum
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
                // showArrow prop'u kaldırıldı
                onChange={(value) => updateInvoiceDetail(index, 'vatRate', value)}
              >
                <Option key="0" value={0}>%0</Option>
                <Option key="1" value={1}>%1</Option>
                <Option key="8" value={8}>%8</Option>
                <Option key="10" value={10}>%10</Option>
                <Option key="18" value={18}>%18</Option>
                <Option key="20" value={20}>%20</Option>
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
                style={{ width: '100%', minWidth: '80px' }}
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
          <Table.Column 
            title="Alt Toplam" 
            dataIndex="subtotalAmount"
            key="subtotalAmount"
            width={120}
            render={(value, record) => (
              <span>
                {(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            )}
          />
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
          open={showCashPaymentModal}
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
                <Form form={cashPaymentForm} layout="vertical">
                  <Form.Item label="Nakit Kasa Hesap Kodu">
                    <Select style={{ width: '100%' }} defaultValue="">
                      <Select.Option key="empty" value="">Seçiniz</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Para Birimi">
                    <Select style={{ width: '100%' }} defaultValue="TRY">
                      <Select.Option key="TRY" value="TRY">TRY</Select.Option>
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

  open,
  onClose,
  barcodeInput,
  setBarcodeInput,
  onSearch,
  loading,
  inputRef,
  productVariants,
  setProductVariants,
  scannedItems,
  addAllToInvoice,
  isPriceIncludeVat,
  getProductPrice,
  inventoryStock,
  loadingInventory,
  removeScannedItem,
  removeAllScannedItems,
  updateScannedItemQuantity,
  updateScannedItemPrice,
}: {
  open: boolean;
  onClose: () => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  inputRef: React.RefObject<any>;
  productVariants: ProductVariant[];
  setProductVariants: (variants: ProductVariant[]) => void;
  scannedItems: { variant: ProductVariant; quantity: number }[];
  addAllToInvoice: () => void;
  isPriceIncludeVat: boolean;
  getProductPrice: (variant: ProductVariant) => Promise<void>;
  inventoryStock: InventoryStock[];
  loadingInventory: boolean;
  removeScannedItem: (index: number) => void;
  removeAllScannedItems: () => void;
  updateScannedItemQuantity: (index: number, quantity: number) => void;
  updateScannedItemPrice: (index: number, price: number) => void;
}) => {
  const [barcodeForm] = Form.useForm();
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkVatRate, setBulkVatRate] = useState<number>(10); // Varsayılan KDV oranı
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
      title="Satır Ekle"
      open={open}
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
            placeholder="Ürün kodu, açıklaması veya barkod girin (en az 3 karakter)"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onPressEnter={() => {
              // En az 3 karakter kontrolü
              if (barcodeInput.trim().length >= 3) {
                onSearch();
                // Arama yapıldıktan sonra input'u temizle
                setBarcodeInput('');
              } else if (barcodeInput.trim().length > 0) {
                message.warning('Lütfen en az 3 karakter girin');
              }
            }}
            ref={inputRef}
            suffix={loading ? <Spin size="small" /> : <SearchOutlined />}
            autoFocus
          />
        </Col>
        <Col>
          <Button 
            type="primary" 
            onClick={() => {
              // En az 3 karakter kontrolü
              if (barcodeInput.trim().length >= 3) {
                onSearch();
                // Arama yapıldıktan sonra input'u temizle
                setBarcodeInput('');
              } else if (barcodeInput.trim().length > 0) {
                message.warning('Lütfen en az 3 karakter girin');
              }
            }} 
            loading={loading}
            disabled={barcodeInput.trim().length < 3}
          >
            Ara
          </Button>
        </Col>
      </Row>

      {/* Çoklu varyant bulunduğunda gösterilecek tablo */}
      {productVariants.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
            <Divider orientation="left" style={{ flex: 1, minWidth: 0 }}>Bulunan Ürünler ({productVariants.length})</Divider>
            <Space size="small" style={{ flexShrink: 0 }}>
              <Button 
                type="primary" 
                size="small"
                onClick={() => {
                  // Tüm varyantları sırayla ekle
                  const addAllVariants = async () => {
                    for (const variant of productVariants) {
                      await getProductPrice(variant);
                    }
                    message.success(`${productVariants.length} ürün varyantı listeye eklendi`);
                  };
                  addAllVariants();
                }}
                icon={<PlusOutlined />}
              >
                Tüm Varyantları Ekle
              </Button>
              <Button 
                type="link" 
                size="small"
                onClick={() => setProductVariants([])} 
                icon={<DeleteOutlined />}
              >
                Temizle
              </Button>
            </Space>
          </div>
          <Table
            loading={loading}
            dataSource={productVariants}
            rowKey="barcode"
            size="small"
            className="compact-table"
            pagination={false}
            scroll={{ y: 300 }}
            columns={[
              {
                title: 'İşlem',
                key: 'action',
                width: 100,
                fixed: 'left',
                render: (_, record) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => getProductPrice(record)}
                  >
                    Ekle
                  </Button>
                )
              },
              {
                title: 'Ürün Kodu',
                dataIndex: 'productCode',
                key: 'productCode',
                width: 100
              },
              {
                title: 'Ürün Açıklaması',
                dataIndex: 'productDescription',
                key: 'productDescription',
                width: 200, // %20 daraltıldı (250'den 200'e)
                ellipsis: true
              },
              {
                title: 'Renk',
                dataIndex: 'colorDescription',
                key: 'colorDescription',
                width: 100,
                render: (text) => text || '-'
              },
              {
                title: 'Beden',
                dataIndex: 'itemDim1Code',
                key: 'itemDim1Code',
                width: 60,
                render: (text) => text || '-'
              },
              {
                title: 'Stok',
                key: 'stock',
                width: 80,
                render: (_, record) => {
                  // Envanter/Stok Bilgisi tablosundan doğru stok miktarını bul
                  const stock = inventoryStock.find(s => 
                    s.itemCode === record.productCode && 
                    s.colorCode === record.colorCode && 
                    s.itemDim1Code === record.itemDim1Code
                  );
                  
                  // Stok miktarını göster - eğer varsa stok.qty değerini, yoksa 0 göster
                  return loadingInventory ? 
                    <Spin size="small" /> : 
                    <Tag color={stock && stock.qty > 0 ? 'green' : 'red'}>
                      {stock ? stock.qty.toFixed(2) : '0.00'}
                    </Tag>;
                }
              },
              {
                title: 'Birim Fiyat',
                dataIndex: 'salesPrice1',
                key: 'salesPrice1',
                width: 120,
                render: (price) => `${price.toFixed(2)} TL`
              },
              {
                title: 'KDV',
                dataIndex: 'vatRate',
                key: 'vatRate',
                width: 60,
                render: (vatRate) => `%${vatRate}`
              }
            ]}
          />
        </>
      )}
      
      {/* Taranan ürünlerin listesi */}
      {scannedItems.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Divider orientation="left" style={{ flex: 1 }}>Taranan Ürünler ({scannedItems.length})</Divider>
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={removeAllScannedItems}
            >
              Listeyi Temizle
            </Button>
          </div>
          
          {/* Toplu fiyat güncelleme alanı */}
          <Card title="Toplu Fiyat Güncelleme" size="small" style={{ marginBottom: 16 }}>
            <Form layout="vertical" style={{ marginBottom: 0 }}>
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
                    <Option key="0" value={0}>%0</Option>
                    <Option key="1" value={1}>%1</Option>
                    <Option key="8" value={8}>%8</Option>
                    <Option key="10" value={10}>%10</Option>
                    <Option key="18" value={18}>%18</Option>
                    <Option key="20" value={20}>%20</Option>
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
            </Form>
          </Card>
          
          <Table
            dataSource={scannedItems}
            rowKey={(item) => item.variant.barcode || item.variant.productCode + item.variant.colorCode + item.variant.itemDim1Code}
            size="small"
            pagination={false}
            className="compact-table"
            scroll={{ y: 200 }}
            columns={[
              {
                title: 'Ürün Kodu',
                dataIndex: ['variant', 'productCode'],
                key: 'productCode',
                width: 100
              },
              {
                title: 'Ürün Açıklaması',
                dataIndex: ['variant', 'productDescription'],
                key: 'productDescription',
                width: 200,
                ellipsis: true
              },
              {
                title: 'Renk',
                dataIndex: ['variant', 'colorDescription'],
                key: 'colorDescription',
                width: 80,
                render: (text) => text || '-'
              },
              {
                title: 'Beden',
                dataIndex: ['variant', 'itemDim1Code'],
                key: 'itemDim1Code',
                width: 60,
                render: (text) => text || '-'
              },
              {
                title: 'Miktar',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 80,
                render: (quantity, record, index) => (
                  <InputNumber
                    value={quantity}
                    min={1}
                    max={9999}
                    step={1}
                    precision={0}
                    style={{ width: '100%' }}
                    onChange={(value) => updateScannedItemQuantity(index, value as number)}
                  />
                )
              },
              {
                title: 'Birim Fiyat',
                dataIndex: ['variant', 'salesPrice1'],
                key: 'salesPrice1',
                width: 100,
                render: (price, record, index) => (
                  <InputNumber
                    value={price}
                    min={0.01}
                    max={999999}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    onChange={(value) => updateScannedItemPrice(index, value as number)}
                  />
                )
              },
              {
                title: 'KDV (%)',
                dataIndex: ['variant', 'vatRate'],
                key: 'vatRate',
                width: 80,
                render: (vatRate) => `%${vatRate}`
              },
              {
                title: 'İşlem',
                key: 'action',
                width: 60,
                render: (_, record, index) => (
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => removeScannedItem(index)}
                  />
                )
              }
            ]}
          />
        </>
      )}



      {/* Envanter/Stok Bilgisi tablosu kaldırıldı - stok bilgileri artık Bulunan Ürünler tablosunda gösteriliyor */}
    </Modal>
  );
};

export default InvoiceForm;