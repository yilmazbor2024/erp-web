import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Row, Col, Typography, Button, Spin, message, InputNumber, Card, Table, Divider, Modal, Collapse } from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import currencyApi from '../../services/currencyApi';

interface Currency {
  code: string;
  name: string;
  description: string;
  currencyCode?: string;
  currencyDescription?: string;
  isBlocked?: boolean;
}
import { exchangeRateApi } from '../../services/exchangeRateApi';
// useAuth hook'unu kaldırdık

const { Option } = Select;
const { Text, Title } = Typography;

interface CashPaymentFormProps {
  invoiceHeaderID: string;     // Fatura başlık ID'si
  invoiceNumber: string;       // Fatura numarası
  invoiceAmount: number;       // Fatura toplam tutarı (Genel Toplam)
  invoiceAmountTRY?: number;   // TL Karşılığı
  exchangeRate?: number;       // Döviz Kuru
  currencyCode: string;        // Para birimi kodu (TRY, USD, EUR, GBP vb.)
  currAccCode: string;         // Müşteri kodu
  currAccTypeCode: string;     // Müşteri tipi kodu
  officeCode: string;          // Ofis kodu
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

interface CashAccount {
  cashAccountCode?: string;
  cashAccountName?: string;
  cashAccountDescription?: string;
  currencyCode?: string;
  currencyDescription?: string;
  officeCode?: string;
  officeDescription?: string;
  code?: string;
  id?: string;
  name?: string;
}

interface PaymentRow {
  id: string;
  paymentType: string;
  currencyCode: string;
  exchangeRate: number;
  amount: number;
  tryAmount: number;
  description: string;
  cashAccountCode?: string;
}

const CashPaymentForm: React.FC<CashPaymentFormProps> = ({
  invoiceHeaderID,
  invoiceNumber,
  invoiceAmount,
  invoiceAmountTRY,
  exchangeRate,
  currencyCode,
  currAccCode,
  currAccTypeCode,
  officeCode,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  // useAuth hook'unu kaldırdık ve doğrudan token kontrolü yapıyoruz
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
  const isAuthenticated = !!token; // Token varsa kimlik doğrulanmış kabul ediyoruz
  const [loading, setLoading] = useState<boolean>(false);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loadingCashAccounts, setLoadingCashAccounts] = useState<boolean>(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState<boolean>(false);
  const [exchangeRateDisabled, setExchangeRateDisabled] = useState<boolean>(true);
  
  // Döviz kuru işlemleri için state'ler
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [exchangeRateSource, setExchangeRateSource] = useState<string>('CENTRAL_BANK');

  // Toplam ve ödeme tutarları
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(invoiceAmount);
  
  // Ödeme satırları
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(exchangeRate || 1.0000);
  const [showAdvanceWarning, setShowAdvanceWarning] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>(currencyCode || 'TRY');
  
  // Seçilen kasa hesabı
  const [selectedCashAccount, setSelectedCashAccount] = useState<string>('');

  useEffect(() => {
    console.log('Nakit tahsilat formu açıldı, fatura bilgileri:', {
      invoiceHeaderID,
      invoiceNumber,
      invoiceAmount,
      currencyCode,
      currAccCode,
      currAccTypeCode,
      invoiceAmountTRY,
      exchangeRate
    });
    
    // Eğer fatura tutarı 0 veya geçersizse, konsola uyarı yazdır
    if (!invoiceAmount || invoiceAmount <= 0) {
      console.warn('Fatura tutarı geçersiz veya sıfır:', invoiceAmount);
    }
    
    // Fatura para birimini ayarla
    const faturaCurrencyCode = currencyCode || 'TRY';
    setCurrentCurrencyCode(faturaCurrencyCode);
    
    // Döviz kuru ayarla
    const faturaDovizKuru = exchangeRate && exchangeRate > 0 ? exchangeRate : 1.0000;
    setCurrentExchangeRate(faturaDovizKuru);
    
    // Form başlangıç değerlerini ayarla
    form.setFieldsValue({
      amount: invoiceAmount && invoiceAmount > 0 ? invoiceAmount : 0, // Fatura tutarını otomatik doldur
      description: `${invoiceNumber} nolu fatura için nakit tahsilat`,
      currencyCode: faturaCurrencyCode,
      exchangeRate: faturaDovizKuru
    });
    
    // Kalan tutarı fatura tutarı olarak ayarla
    setRemainingAmount(invoiceAmount && invoiceAmount > 0 ? invoiceAmount : 0);
    
    // Kasa hesaplarını ve para birimlerini yükle
    fetchCashAccounts();
    fetchCurrencies();
  }, [invoiceHeaderID, invoiceNumber, invoiceAmount, currencyCode, form]);
  
  // Müşteri kodu değiştiğinde çalışacak useEffect
  useEffect(() => {
    if (currAccCode) {
      console.log('Müşteri kodu:', currAccCode, 'Müşteri tipi:', currAccTypeCode);
      // Burada müşteri bilgilerine göre ek işlemler yapılabilir
    }
  }, [currAccCode, currAccTypeCode]);
  
  // Kasa hesabı seçildiğinde otomatik olarak para birimini seç
  const handleCashAccountChange = (value: string) => {
    console.log('Kasa hesabı seçildi:', value);
    
    // Seçilen kasa hesabını bul
    const selectedAccount = cashAccounts.find(account => 
      (account.cashAccountCode || account.code || account.id) === value
    );
    
    // Eğer kasa hesabı bulunduysa ve para birimi varsa
    if (selectedAccount && selectedAccount.currencyCode) {
      console.log(`Kasa hesabı para birimi: ${selectedAccount.currencyCode}`);
      
      // Para birimini otomatik olarak ayarla
      form.setFieldsValue({ currencyCode: selectedAccount.currencyCode });
      
      // Para birimi değişikliğini işle (döviz kuru vb. için)
      handleCurrencyChange(selectedAccount.currencyCode);
    }
  };

  // Form değişikliklerini dinle
  const handleFormChange = (changedValues: any, allValues: any) => {
    console.log('Form değişti:', changedValues);
    
    // Para birimi değiştiğinde döviz kurunu güncelle
    if (changedValues.currencyCode) {
      handleCurrencyChange(changedValues.currencyCode);
    }
    
    // Kasa hesabı değiştiğinde para birimini güncelle
    if (changedValues.cashAccountCode) {
      handleCashAccountChange(changedValues.cashAccountCode);
    }
  };
  
  // Döviz kuru kontrolü - Sadece TRY için 1 olarak ayarla
  const loadExchangeRates = () => {
    try {
      // Seçili para birimi
      const currencyCode = form.getFieldValue('currencyCode');
      console.log('Para birimi kontrol ediliyor:', currencyCode);
      console.log('Gelen fatura bilgileri:', {
        invoiceAmount,
        currencyCode,
        invoiceAmountTRY,
        exchangeRate
      });
      
      // Para birimi TRY ise kur 1 olarak ayarlanır
      if (currencyCode === 'TRY') {
        console.log('TRY para birimi seçildi, kur 1 olarak ayarlandı');
        setCurrentExchangeRate(1.0000);
        setCurrentCurrencyCode('TRY');
      } else {
        // Para birimi TRY değilse, gelen kur kullanılır veya API'den alınır
        if (exchangeRate) {
          console.log(`${currencyCode} para birimi seçildi, gelen kur kullanılıyor: ${exchangeRate}`);
          setCurrentExchangeRate(exchangeRate);
        } else {
          console.log(`${currencyCode} para birimi seçildi, kur API'den alınıyor...`);
          // API'den güncel kur alınır
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          exchangeRateApi.getExchangeRate(currencyCode, 'TRY', dateStr)
            .then(rate => {
              console.log(`${currencyCode} için kur alındı: ${rate}`);
              setCurrentExchangeRate(rate);
            })
            .catch(error => {
              console.error(`${currencyCode} için kur alınamadı:`, error);
              // Hata durumunda varsayılan olarak 1 kullanılır
              setCurrentExchangeRate(1.0000);
            });
        }
        setCurrentCurrencyCode(currencyCode);
      }
    } catch (error) {
      console.error('Döviz kuru kontrolünde hata:', error);
    }
  };
  
  // Para birimi değiştiğinde döviz kurunu güncelle
  useEffect(() => {
    if (currencies.length > 0) {
      loadExchangeRates();
    }
  }, [currencies]);

  // Para birimlerini getir
  const fetchCurrencies = async () => {
    // Eğer zaten para birimleri yüklendiye tekrar yükleme
    if (currencies.length > 0) {
      console.log('Para birimleri zaten yüklenmiş, tekrar yüklenmiyor');
      return;
    }
    
    try {
      setLoadingCurrencies(true);
      console.log('Para birimleri yükleniyor...');
      
      // API'den para birimlerini getir
      const currencyData = await currencyApi.getCurrencies();
      console.log('API yanıtı:', currencyData);
      
      if (currencyData && Array.isArray(currencyData) && currencyData.length > 0) {
        console.log('API\'den para birimleri alındı:', currencyData.length);
        
        // API'den gelen para birimlerini standart formata dönüştür
        const formattedCurrencies = currencyData.map((currency) => {
          return {
            code: currency.currencyCode,
            name: currency.currencyDescription,
            description: currency.currencyDescription,
            currencyCode: currency.currencyCode,
            currencyDescription: currency.currencyDescription,
            isBlocked: currency.isBlocked || false
          };
        });
        
        // TRY para birimi yoksa ekle
        const hasTRY = formattedCurrencies.some((c: Currency) => c.code === 'TRY' || c.currencyCode === 'TRY');
        if (!hasTRY) {
          console.log('TRY para birimi bulunamadı, ekleniyor...');
          formattedCurrencies.unshift({
            code: 'TRY',
            name: 'Türk Lirası',
            description: 'Türk Lirası',
            currencyCode: 'TRY',
            currencyDescription: 'Türk Lirası',
            isBlocked: false
          });
        }
        
        setCurrencies(formattedCurrencies);
        console.log('Para birimleri yüklendi:', formattedCurrencies.length);
      } else {
        console.warn('API yanıtı boş veya geçersiz format:', currencyData);
        message.warning('Para birimi listesi boş veya yüklenemedi.');
        
        // TRY para birimini ekleyelim en azından
        const defaultCurrencies = [
          {
            code: 'TRY',
            name: 'Türk Lirası',
            description: 'Türk Lirası',
            currencyCode: 'TRY',
            currencyDescription: 'Türk Lirası',
            isBlocked: false
          }
        ];
        setCurrencies(defaultCurrencies);
        console.log('Sadece TRY para birimi yüklendi');
      }
      
      // Döviz kurlarını yükle
      loadExchangeRates();
    } catch (error) {
      console.error('Para birimleri yüklenirken hata:', error);
      message.error('Para birimleri yüklenemedi.');
      
      // Hata durumunda en azından TRY para birimini ekle
      const fallbackCurrencies = [
        {
          code: 'TRY',
          name: 'Türk Lirası',
          description: 'Türk Lirası',
          currencyCode: 'TRY',
          currencyDescription: 'Türk Lirası',
          isBlocked: false
        }
      ];
      setCurrencies(fallbackCurrencies);
      console.log('Hata durumunda sadece TRY para birimi yüklendi');
    } finally {
      setLoadingCurrencies(false);
    }
  };

  // Kasa hesaplarını getir
  const fetchCashAccounts = async () => {
    try {
      setLoadingCashAccounts(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/CashAccount`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Kasa hesapları:', response.data);
      
      let accounts = [];
      if (Array.isArray(response.data)) {
        accounts = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        accounts = response.data.data;
        console.log('Kasa hesapları data içinden alındı:', accounts);
      } else {
        console.error('Kasa hesapları verisi geçerli bir dizi değil:', response.data);
        message.error('Kasa hesapları verisi geçerli bir format değil');
        // Test verileri ekle
        accounts = [
          { cashAccountCode: '101', cashAccountName: 'MERKEZ TL KASA', cashAccountDescription: 'Merkez ofis TL kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'M', officeDescription: 'Merkez Ofis' },
          { cashAccountCode: '102', cashAccountName: 'ŞUBE TL KASA', cashAccountDescription: 'Şube kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'S', officeDescription: 'Şube Ofis' },
          { cashAccountCode: '103', cashAccountName: 'USD KASA', cashAccountDescription: 'Dolar kasa', currencyCode: 'USD', currencyDescription: 'ABD Doları', officeCode: 'M', officeDescription: 'Merkez Ofis' },
          { cashAccountCode: '104', cashAccountName: 'EUR KASA', cashAccountDescription: 'Euro kasa', currencyCode: 'EUR', currencyDescription: 'Euro', officeCode: 'M', officeDescription: 'Merkez Ofis' },
          { cashAccountCode: '105', cashAccountName: 'GBP KASA', cashAccountDescription: 'Sterlin kasa', currencyCode: 'GBP', currencyDescription: 'Sterlin', officeCode: 'M', officeDescription: 'Merkez Ofis' }
        ];
      }
      
      setCashAccounts(accounts);
      
      // Fatura para birimine uygun kasa hesabını otomatik seç
      const matchingCashAccount = accounts.find((account: any) => account.currencyCode === currencyCode);
      if (matchingCashAccount) {
        console.log(`Fatura para birimine (${currencyCode}) uygun kasa bulundu:`, matchingCashAccount.cashAccountCode);
        setSelectedCashAccount(matchingCashAccount.cashAccountCode);
        form.setFieldsValue({ cashAccountCode: matchingCashAccount.cashAccountCode });
      } else {
        console.log(`Fatura para birimine (${currencyCode}) uygun kasa bulunamadı, varsayılan TL kasa seçiliyor`);
        // Eğer uygun kasa bulunamazsa, TL kasa seç
        const defaultCashAccount = accounts.find((account: any) => account.currencyCode === 'TRY');
        if (defaultCashAccount) {
          setSelectedCashAccount(defaultCashAccount.cashAccountCode);
          form.setFieldsValue({ cashAccountCode: defaultCashAccount.cashAccountCode });
        }
      }
      
    } catch (error) {
      console.error('Kasa hesapları yüklenirken hata:', error);
      message.error('Kasa hesapları yüklenemedi');
      // API çağrısı başarısız olursa test verileri ekle
      const testAccounts = [
        { cashAccountCode: '101', cashAccountName: 'MERKEZ TL KASA', cashAccountDescription: 'Merkez ofis TL kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'M', officeDescription: 'Merkez Ofis' },
        { cashAccountCode: '102', cashAccountName: 'ŞUBE TL KASA', cashAccountDescription: 'Şube kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'S', officeDescription: 'Şube Ofis' },
        { cashAccountCode: '103', cashAccountName: 'USD KASA', cashAccountDescription: 'Dolar kasa', currencyCode: 'USD', currencyDescription: 'ABD Doları', officeCode: 'M', officeDescription: 'Merkez Ofis' },
        { cashAccountCode: '104', cashAccountName: 'EUR KASA', cashAccountDescription: 'Euro kasa', currencyCode: 'EUR', currencyDescription: 'Euro', officeCode: 'M', officeDescription: 'Merkez Ofis' },
        { cashAccountCode: '105', cashAccountName: 'GBP KASA', cashAccountDescription: 'Sterlin kasa', currencyCode: 'GBP', currencyDescription: 'Sterlin', officeCode: 'M', officeDescription: 'Merkez Ofis' }
      ];
      setCashAccounts(testAccounts);
      
      // Test verileri için de otomatik kasa seçimi yap
      const matchingCashAccount = testAccounts.find((account: any) => account.currencyCode === currencyCode);
      if (matchingCashAccount) {
        setSelectedCashAccount(matchingCashAccount.cashAccountCode);
        form.setFieldsValue({ cashAccountCode: matchingCashAccount.cashAccountCode });
      }
    } finally {
      setLoadingCashAccounts(false);
    }
  };

  // Para birimi değiştiğinde döviz kurunu güncelle
  const handleCurrencyChange = (value: string) => {
    console.log('Para birimi değişti:', value);
    setCurrentCurrencyCode(value);
    
    // TRY seçilirse kur 1 olarak ayarla ve döviz kuru alanını devre dışı bırak
    if (value === 'TRY') {
      form.setFieldsValue({ exchangeRate: 1 });
      setCurrentExchangeRate(1);
      setExchangeRateDisabled(true);
      return;
    }
    
    // TRY değilse döviz kuru alanını aktif et
    setExchangeRateDisabled(false);
    
    // Mevcut döviz kurları yüklenmişse, seçilen para birimi için kuru ayarla
    if (Object.keys(exchangeRates).length > 0) {
      const rate = exchangeRates[value];
      if (rate) {
        const formattedRate = parseFloat(rate.toFixed(4));
        form.setFieldsValue({ exchangeRate: formattedRate });
        setCurrentExchangeRate(formattedRate);
        console.log(`${value} için kur ayarlandı: ${formattedRate}`);
      } else {
        console.warn(`${value} için kur bulunamadı`);
        form.setFieldsValue({ exchangeRate: 0 });
        setCurrentExchangeRate(0);
      }
    } else {
      // Döviz kurları yüklenmemişse yükle
      loadExchangeRates();
    }
  };
  
  // Tutar değişikliğini işle
  const handleAmountChange = (value: number | null) => {
    const safeValue = value === null ? 0 : value;
    form.setFieldsValue({ amount: safeValue });
    console.log('Tutar değişti:', safeValue);
  };

  // Yeni ödeme satırı ekle
  const addPaymentRow = () => {
    try {
      const values = form.getFieldsValue();
      console.log('Form değerleri:', values);
      
      // Form değerlerini al
      const formCashAccountCode = values.cashAccountCode || '';
      const formCurrencyCode = values.currencyCode || 'TRY';
      const formExchangeRate = values.exchangeRate || 1;
      // Açıklama alanı gizli olsa bile değerini al
      let formDescription = values.description;
      // Eğer açıklama boşsa veya undefined ise varsayılan değeri kullan
      if (!formDescription) {
        formDescription = `${invoiceNumber} nolu fatura için nakit tahsilat`;
        // Form nesnesinde açıklama alanını güncelle
        form.setFieldsValue({ description: formDescription });
      }
      
      // Kasa hesap kodu kontrolü
      if (!formCashAccountCode) {
        message.error('Lütfen bir kasa hesabı seçin');
        return;
      }
      
      // Manuel olarak tutar kontrolü yapıyoruz
      let formAmount = form.getFieldValue('amount');
      console.log('Girilen tutar (ham):', formAmount, 'Tipi:', typeof formAmount);
      
      // String ise sayıya çevir
      if (typeof formAmount === 'string') {
        formAmount = parseFloat(formAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
      }
      
      // Sayı değilse veya geçersizse hata ver
      if (isNaN(formAmount) || formAmount <= 0) {
        console.log('Geçersiz tutar:', formAmount);
        message.error('Lütfen geçerli bir tutar girin');
        return;
      }
      
      // TRY için kur her zaman 1
      const actualExchangeRate = formCurrencyCode === 'TRY' ? 1 : (formExchangeRate || 1);
      const tryAmount = formCurrencyCode === 'TRY' ? Number(formAmount) : Number(formAmount) * actualExchangeRate;
      
      console.log('Eklenen tutar:', Number(formAmount));
      console.log('TRY karşılığı:', tryAmount);
      
      // TRY cinsinden fatura tutarını hesapla (tüm fonksiyon için kullanılacak)
      const invoiceTotalTRY = invoiceAmountTRY !== undefined ? invoiceAmountTRY : (invoiceAmount * (exchangeRate !== undefined ? exchangeRate : currentExchangeRate));
      console.log('Fatura toplamı (TRY):', invoiceTotalTRY);
      console.log('Fatura toplamı (Orijinal):', invoiceAmount);
      console.log('Mevcut ödenen toplam (TRY):', paidAmount);
      
      // Eklenen tutarın TRY karşılığı + mevcut ödenen toplam, fatura tutarının TRY karşılığını aşıyorsa uyarı ver
      if (tryAmount + paidAmount > invoiceTotalTRY * 1.05) { // %5 tolerans ekledik
        // Mevcut ödeme tutarı ve yeni eklenen tutarı ayrı ayrı göster
        const confirmAdd = window.confirm(`Dikkat! Eklediğiniz tutar (${tryAmount.toFixed(2)} TRY) ile toplam ödeme tutarı (${(tryAmount + paidAmount).toFixed(2)} TRY), fatura tutarını (${invoiceTotalTRY.toFixed(2)} TRY) aşıyor. Yine de eklemek istiyor musunuz?`);
        if (!confirmAdd) {
          return;
        }
      }
      
      // Yeni ödeme satırı oluştur
      const newRow: PaymentRow = {
        id: Date.now().toString(),
        paymentType: 'Nakit',
        currencyCode: formCurrencyCode,
        exchangeRate: actualExchangeRate,
        amount: Number(formAmount),
        tryAmount: tryAmount,
        description: formDescription,
        cashAccountCode: formCashAccountCode
      };
      
      // Ödeme satırlarını güncelle
      const updatedRows = [...paymentRows, newRow];
      setPaymentRows(updatedRows);
      
      // Toplam ödenen tutarı hesapla
      const totalPaid = updatedRows.reduce((sum, row) => sum + row.tryAmount, 0);
      setPaidAmount(totalPaid);
      console.log('Güncel ödenen toplam:', totalPaid);
      
      // TRY cinsinden kalan tutarı hesapla
      const remainingTRY = invoiceTotalTRY - totalPaid;
      // Orijinal para birimindeki kalan tutarı hesapla (gösterim için)
      const remainingOriginal = currencyCode !== 'TRY' ? remainingTRY / (exchangeRate !== undefined ? exchangeRate : currentExchangeRate) : remainingTRY;
      setRemainingAmount(remainingOriginal);
      console.log('Kalan tutar (TRY):', remainingTRY);
      console.log('Kalan tutar (Orijinal):', remainingOriginal);
      
      // Para üstü kontrolü - TRY cinsinden yapılıyor
      // Küçük yuvarlamalar için 0.01 tolerans değeri ekliyoruz
      const TOLERANCE = 0.01;
      if (totalPaid > invoiceTotalTRY + TOLERANCE) {
        const advance = totalPaid - invoiceTotalTRY;
        // Avans miktarı çok küçükse (0.01'den küçük) gösterme
        if (advance > TOLERANCE) {
          setAdvanceAmount(advance);
          setShowAdvanceWarning(true);
          console.log('Para üstü (TRY):', advance);
        } else {
          setShowAdvanceWarning(false);
          setAdvanceAmount(0);
          console.log('Para üstü çok küçük, gösterilmiyor');
        }
      } else {
        setShowAdvanceWarning(false);
        setAdvanceAmount(0);
        console.log('Para üstü yok');
      }
      
      console.log('Tüm ödeme satırları:', updatedRows);
      
      // Formu sıfırla - kalan tutarı otomatik doldurmak yerine sıfırlıyoruz
      form.setFieldsValue({
        amount: 0,
        description: `${invoiceNumber} nolu fatura için nakit tahsilat`
      });
      
    } catch (error) {
      console.error('addPaymentRow hatası:', error);
      message.error('Tutar eklenirken bir hata oluştu');
    }
  };
  
  // Ödeme satırını kaldır
  const removePaymentRow = (rowId: string) => {
    // Satırı kaldır
    const updatedRows = paymentRows.filter(row => row.id !== rowId);
    setPaymentRows(updatedRows);
    
    // Toplam ödenen tutarı güncelle
    const totalPaid = updatedRows.reduce((sum, row) => sum + row.tryAmount, 0);
    setPaidAmount(totalPaid);
    
    // Kalan tutarı güncelle
    const remaining = invoiceAmount - totalPaid;
    setRemainingAmount(remaining);
    
    // Para üstü kontrolü
    if (totalPaid > invoiceAmount) {
      setAdvanceAmount(totalPaid - invoiceAmount);
      setShowAdvanceWarning(true);
    } else {
      setShowAdvanceWarning(false);
      setAdvanceAmount(0);
    }
    
    // Form tutarını güncelle
    form.setFieldsValue({
      amount: remaining > 0 ? remaining : 0
    });
  };
  
  // Para üstü uyarısını kabul et ve avans olarak kaydet
  const acceptAdvancePayment = () => {
    setShowAdvanceWarning(false);
    message.success(`${advanceAmount.toFixed(2)} ${currencyCode} tutarında fazla ödeme avans olarak kaydedilecek`);
  };

  // Formu gönder
  const handleSubmit = async (values: any) => {
    // Ödeme satırı yoksa uyarı ver
    if (paymentRows.length === 0) {
      message.error('En az bir ödeme satırı eklemelisiniz');
      return;
    }
    
    // Ödeme tutarlarının sıfır olup olmadığını kontrol et
    if (paymentRows.some(row => row.amount <= 0)) {
      message.error('Ödeme tutarları sıfırdan büyük olmalıdır');
      return;
    }
    
    setLoading(true);
    try {
      // Token kontrolü
      if (!token) {
        message.error('Oturum bilgileriniz bulunamadı. Lütfen yeniden giriş yapın.');
        return;
      }
      
      // API isteği için veri hazırla
      const requestData = {
        InvoiceHeaderID: invoiceHeaderID,
        InvoiceNumber: invoiceNumber,
        DocCurrencyCode: currencyCode,
        CurrAccCode: currAccCode,
        CurrAccTypeCode: currAccTypeCode,
        OfficeCode: officeCode,
        Description: values.description,
        // Geçerli tarih ekle (SQL Server tarihi için)
        DocumentDate: new Date().toISOString(),
        PaymentRows: paymentRows.map(row => ({
          CurrencyCode: row.currencyCode,
          ExchangeRate: row.exchangeRate,
          Amount: row.amount, // Payment yerine Amount kullanıyoruz (backend modeline uygun olarak)
          CashAccountCode: row.cashAccountCode,
          Description: row.description || `${invoiceNumber} nolu fatura için nakit tahsilat`
        }))
      };

      console.log('Nakit tahsilat isteği gönderiliyor:', requestData);

      // API isteği
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/payment/cash-payment`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Nakit tahsilat yanıtı:', response.data);

      // Başarılı işlem
      // Önce formu sıfırla
      form.resetFields();
      setPaymentRows([]);
      setPaidAmount(0);
      setRemainingAmount(invoiceAmount);
      
      // Başarı mesajını göster
      message.success('Nakit tahsilat başarıyla kaydedildi');
      
      // Bir sonraki tick'te onSuccess'i çağır (React state güncellemelerinin tamamlanmasını bekle)
      setTimeout(() => {
        console.log('CashPaymentForm: onSuccess callback çağrılıyor');
        if (onSuccess) {
          onSuccess(response.data);
        }
      }, 0);

    } catch (error: any) {
      console.error('Nakit tahsilat hatası:', error);
      
      // Hata mesajı göster
      message.error(
        error.response?.data?.message || 
        error.response?.data?.title || 
        error.message || 
        'Nakit tahsilat işlemi sırasında bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Toplam ve ödenen tutarları gösteren tablo sütunları
  const columns = [
    {
      title: '',
      dataIndex: 'label',
      key: 'label',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'TRY',
      dataIndex: 'tryAmount',
      key: 'tryAmount',
      align: 'right' as 'right',
      render: (amount: number) => <Text type={amount < 0 ? 'danger' : undefined}>{amount.toFixed(2)}</Text>
    },
    {
      title: currencyCode !== 'TRY' ? currencyCode : '',
      dataIndex: 'foreignAmount',
      key: 'foreignAmount',
      align: 'right' as 'right',
      render: (amount: number) => <Text type={amount < 0 ? 'danger' : undefined}>{amount.toFixed(2)}</Text>
    }
  ];

  // Tablo verileri
  // Fatura toplamının döviz kuru ile çarpımını hesapla
  const invoiceAmountWithExchangeRate = currencyCode !== 'TRY' ? invoiceAmount * currentExchangeRate : invoiceAmount;
  
  const tableData = [
    {
      key: '1',
      label: `Toplam (${currencyCode})`,
      tryAmount: currencyCode === 'TRY' ? invoiceAmount : invoiceAmountWithExchangeRate,
      foreignAmount: currencyCode !== 'TRY' ? invoiceAmount : 0
    },
    {
      key: '1b',
      label: `Toplam x Döviz Kuru (${currencyCode} x ${currentExchangeRate.toFixed(4)})`,
      tryAmount: invoiceAmountWithExchangeRate,
      foreignAmount: 0
    },
    {
      key: '2',
      label: 'Ödenen Tutar',
      tryAmount: currencyCode === 'TRY' ? paidAmount : paidAmount * currentExchangeRate,
      foreignAmount: currencyCode !== 'TRY' ? paidAmount : 0
    },
    {
      key: '3',
      label: 'Para Üstü',
      tryAmount: currencyCode === 'TRY' ? (paidAmount > invoiceAmount ? paidAmount - invoiceAmount : 0) : (paidAmount > invoiceAmount ? (paidAmount - invoiceAmount) * currentExchangeRate : 0),
      foreignAmount: currencyCode !== 'TRY' ? (paidAmount > invoiceAmount ? paidAmount - invoiceAmount : 0) : 0
    }
  ];

  return (
    <Card variant="borderless" style={{ padding: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '5px' }}>
          {/* Fatura Bilgileri Özet Bölümü - Collapse ile kapalı olarak başlıyor */}
          <Collapse defaultActiveKey={[]} style={{ marginBottom: 16 }}>
            <Collapse.Panel header="Fatura Bilgileri" key="1" style={{ backgroundColor: '#f9f9f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0' }}>Fatura Bilgisi</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0' }}>Değer</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                  <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Fatura No:</td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right' }}>{invoiceNumber}</td>
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Tutar:</td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}>{invoiceAmount} {currencyCode}</td>
                </tr>
                {currencyCode !== 'TRY' && (
                  <tr>
                    <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>TRY Tutarı:</td>
                    <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right', color: 'red', fontWeight: 'bold' }}>
                      {invoiceAmountTRY !== undefined ? invoiceAmountTRY.toFixed(2) : (invoiceAmount * (exchangeRate !== undefined ? exchangeRate : 1)).toFixed(2)} TRY
                    </td>
                  </tr>
                )}
                {currencyCode !== 'TRY' && (
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Döviz Kuru:</td>
                    <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right' }}>{exchangeRate !== undefined ? exchangeRate.toFixed(4) : currentExchangeRate.toFixed(4)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Müşteri Kodu:</td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right' }}>{currAccCode}</td>
                </tr>
              </tbody>
            </table>
          </Collapse.Panel>
        </Collapse>
        </div>
        
        {/* Ödeme Özeti - Yatay format - Sabit pozisyonda */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, marginTop: '10px', marginBottom: '15px', backgroundColor: '#fff', paddingLeft: '5px', paddingRight: '5px' }}>
          <div style={{ backgroundColor: '#fafafa', padding: '5px', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
              {/* Genel Toplam */}
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Genel Toplam</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'red' }}>
                  TRY {invoiceAmountTRY !== undefined ? invoiceAmountTRY.toFixed(2) : ((invoiceAmount || 0) * (exchangeRate !== undefined ? exchangeRate : currentExchangeRate)).toFixed(2)}
                </div>
                {currencyCode !== 'TRY' && (
                  <div style={{ fontSize: '9px', color: 'gray', fontStyle: 'italic' }}>
                    ({currencyCode} {(invoiceAmount || 0).toFixed(2)} x {exchangeRate !== undefined ? exchangeRate.toFixed(4) : currentExchangeRate.toFixed(4)})
                  </div>
                )}
              </div>
              
              {/* Ödenen */}
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Ödenen</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'green' }}>
                  TRY {(paidAmount || 0).toFixed(2)}
                </div>
              </div>
              
              {/* Kalan */}
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Kalan</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'orange' }}>
                  TRY {(invoiceAmountTRY !== undefined ? invoiceAmountTRY - (paidAmount || 0) : ((invoiceAmount || 0) * (exchangeRate !== undefined ? exchangeRate : currentExchangeRate)) - (paidAmount || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          
          {paidAmount > invoiceAmount && (
            <div style={{ backgroundColor: '#e6f7ff', padding: '6px', borderRadius: '4px', marginTop: '8px', border: '1px solid #91d5ff' }}>
              <InfoCircleOutlined style={{ color: '#1890ff', marginRight: '4px', fontSize: '11px' }} />
              <span style={{ fontSize: '11px' }}>Fazla ödeme avans olarak kaydedilecektir.</span>
            </div>
          )}
        </div>
        
        {/* Ödeme satırları tablosu - Mobil uyumlu */}
        <div style={{ marginBottom: '10px', flex: 1 }}>
          {paymentRows.length === 0 ? (
            <div style={{ padding: '15px', textAlign: 'center', border: '1px dashed #e8e8e8', borderRadius: '4px', backgroundColor: '#fafafa' }}>
              Ödeme satırı eklemek için aşağıdaki formu doldurup "Ekle" butonuna tıklayın.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paymentRows.map((row) => (
                <div key={row.id} style={{ border: '1px solid #e8e8e8', borderRadius: '4px', padding: '8px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Ödeme Tipi: {row.paymentType}</div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<CloseOutlined />} 
                      onClick={() => removePaymentRow(row.id)}
                      size="small"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', width: '50%' }}>Para Birimi: <span style={{ fontWeight: 'bold' }}>{row.currencyCode}</span></div>
                    <div style={{ fontSize: '12px', width: '50%', textAlign: 'right' }}>Döviz Kuru: <span style={{ fontWeight: 'bold' }}>{typeof row.exchangeRate === 'number' ? row.exchangeRate.toFixed(4) : (row.exchangeRate || '0')}</span></div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', width: '50%' }}>Tutar: <span style={{ fontWeight: 'bold' }}>{typeof row.amount === 'number' ? row.amount.toFixed(2) : (row.amount || '0')}</span></div>
                    <div style={{ fontSize: '12px', width: '50%', textAlign: 'right' }}>TRY: <span style={{ fontWeight: 'bold' }}>{typeof row.tryAmount === 'number' ? row.tryAmount.toFixed(2) : (row.tryAmount || '0')}</span></div>
                  </div>
                  
                  {/* Açıklama alanı küçük metin olarak gösteriliyor */}
                  {row.description && (
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {row.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        
        {/* Form alanı */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
          initialValues={{
            currencyCode: currencyCode,
            amount: 0,
            description: `${invoiceNumber} nolu fatura için nakit tahsilat`,
          }}
          style={{ marginTop: '10px' }}
        >
          {/* Mobil uyumlu form alanları */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Kasa Hesabı */}
            <Form.Item name="cashAccountCode" style={{ marginBottom: '8px' }}>
              <Select
                style={{ width: '100%' }}
                placeholder="Kasa hesabı seçin"
                showSearch
                optionFilterProp="children"
                onChange={handleCashAccountChange}
              >
                {cashAccounts && cashAccounts.length > 0 ? (
                  cashAccounts.map(account => (
                    <Option 
                      key={account.cashAccountCode || account.code || account.id} 
                      value={account.cashAccountCode || account.code || account.id}
                    >
                      {account.cashAccountCode || account.code || account.id} - {account.cashAccountDescription || '-'} ({account.currencyCode})
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>Kasa hesabı bulunamadı</Option>
                )}
              </Select>
            </Form.Item>
            
            {/* Para Birimi (%60) ve Döviz Kuru (%40) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Form.Item name="currencyCode" style={{ width: '60%', marginBottom: '8px' }}>
                <Select 
                  style={{ width: '100%' }}
                  loading={loadingCurrencies}
                  placeholder="Para birimi"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleCurrencyChange}
                >
                  {currencies && currencies.length > 0 ? (
                    currencies.map(currency => (
                      <Option key={currency.currencyCode} value={currency.currencyCode}>
                        {currency.currencyCode} - {currency.currencyDescription}
                      </Option>
                    ))
                  ) : (
                    <>
                      <Option value="TRY">TRY - Türk Lirası</Option>
                      <Option value="USD">USD - Amerikan Doları</Option>
                      <Option value="EUR">EUR - Euro</Option>
                      <Option value="GBP">GBP - İngiliz Sterlini</Option>
                    </>
                  )}
                </Select>
              </Form.Item>

              <Form.Item name="exchangeRate" initialValue={1} style={{ width: '40%', marginBottom: '8px' }}>
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  precision={4}
                  step={0.1}
                  disabled={exchangeRateDisabled}
                  placeholder="Döviz kuru"
                  formatter={(value) => {
                    if (value === null || value === undefined) return '0,0000';
                    return `${value}`.replace('.', ',');
                  }}
                  parser={(value: string | undefined): number => {
                    if (!value) return 0;
                    const parsedValue = parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
                    return isNaN(parsedValue) ? 0 : parsedValue;
                  }}
                />
              </Form.Item>
            </div>
            
            {/* Açıklama alanı */}
            <Form.Item
              name="description"
              label=""
              initialValue={`${invoiceNumber} nolu fatura için nakit tahsilat`}
              style={{ marginBottom: '8px' }}
            >
              <Input.TextArea 
                rows={2} 
                placeholder="Ödeme açıklaması girin"
                style={{ fontSize: '12px' }}
              />
            </Form.Item>
            
            {/* Tutar ve Ekle butonu */}
            {/* Tutar ve Ekle butonu - Mobil uyumlu */}
            <div style={{ marginTop: '10px', marginBottom: '15px', backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Tutar:</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>{form.getFieldValue('currencyCode') || currencyCode}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Form.Item
                  name="amount"
                  style={{ margin: 0, flex: 1 }}
                  rules={[{ required: true, message: 'Lütfen tutar girin' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    precision={2}
                    onChange={handleAmountChange}
                    decimalSeparator=","
                    stringMode
                    placeholder="Ödeme tutarını girin"
                  />
                </Form.Item>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={addPaymentRow}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  size="middle"
                />
              </div>
            </div>
            
            {/* Mobil uyumlu butonlar */}
            <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
              <Button 
                onClick={onCancel} 
                icon={<CloseOutlined />}
                style={{ flex: 1 }}
                danger
                size="large"
              >
                İptal
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                disabled={paymentRows.length === 0}
                style={{ flex: 1 }}
                size="large"
              >
                Kaydet
              </Button>
            </div>
          </div>
          
          {/* Para üstü uyarı modalı */}
          <Modal
            title="Para Üstü Uyarısı"
            open={showAdvanceWarning}
            onOk={acceptAdvancePayment}
            onCancel={() => setShowAdvanceWarning(false)}
            okText="Evet, Avans Olarak Kaydet"
            cancelText="Hayır, İptal"
            styles={{ body: { padding: '20px 5px' } }}
          >
            <p>
              Ödenen tutar fatura tutarından <Text strong style={{ color: 'red' }}>{advanceAmount.toFixed(2)} {currencyCode}</Text> fazladır.
            </p>
            <p>Fazla ödemeyi avans olarak kaydetmek istiyor musunuz?</p>
          </Modal>
        </Form>
      </div>
    </Card>
  );
};

export default CashPaymentForm;
