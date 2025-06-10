import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Row, Col, Typography, Button, Spin, message, InputNumber, Card, Table, Divider, Modal } from 'antd';
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
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;
const { Text, Title } = Typography;

interface CashPaymentFormProps {
  invoiceHeaderID: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currencyCode: string;
  currAccCode: string;
  currAccTypeCode: string;
  officeCode: string;
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
  currencyCode,
  currAccCode,
  currAccTypeCode,
  officeCode,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  // Token'ı birden fazla kaynaktan kontrol et
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
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
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0000);
  const [showAdvanceWarning, setShowAdvanceWarning] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>('TRY');

  useEffect(() => {
    // Fatura bilgilerini konsola yazdır (debug için)
    console.log('Nakit tahsilat formu açıldı, fatura bilgileri:', {
      invoiceHeaderID,
      invoiceNumber,
      invoiceAmount,
      currencyCode,
      currAccCode,
      currAccTypeCode
    });
    
    // Eğer fatura tutarı 0 veya geçersizse, konsola uyarı yazdır
    if (!invoiceAmount || invoiceAmount <= 0) {
      console.warn('Fatura tutarı geçersiz veya sıfır:', invoiceAmount);
    }
    
    // Form başlangıç değerlerini ayarla
    form.setFieldsValue({
      amount: invoiceAmount && invoiceAmount > 0 ? invoiceAmount : 0, // Fatura tutarını otomatik doldur
      description: `${invoiceNumber} nolu fatura için nakit tahsilat`,
      currencyCode: currencyCode || 'TRY',
      exchangeRate: 1
    });
    
    // Başlangıç para birimini ayarla
    setCurrentCurrencyCode(currencyCode || 'TRY');
    setRemainingAmount(invoiceAmount && invoiceAmount > 0 ? invoiceAmount : 0); // Kalan tutarı fatura tutarı olarak ayarla
    
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
      
      // Eğer TRY ise kur 1 olarak ayarla ve inputu devre dışı bırak
      if (currencyCode === 'TRY') {
        form.setFieldsValue({ exchangeRate: 1 });
        setCurrentExchangeRate(1);
        setExchangeRateDisabled(true);
        console.log('TRY para birimi seçildi, kur 1 olarak ayarlandı');
        return;
      }
      
      // TRY değilse input aktif olsun
      setExchangeRateDisabled(false);
      console.log('TRY dışında para birimi seçildi, kur manuel girilecek');
      
      // Varsayılan değer olarak 0 ayarla
      if (!form.getFieldValue('exchangeRate')) {
        form.setFieldsValue({ exchangeRate: 0 });
        setCurrentExchangeRate(0);
      }
    } catch (error) {
      console.error('Döviz kuru kontrolünde hata:', error);
    }
  };
  
  // Para birimi değiştiğinde döviz kuru kontrolünü yap
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
      if (Array.isArray(response.data)) {
        setCashAccounts(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setCashAccounts(response.data.data);
        console.log('Kasa hesapları data içinden alındı:', response.data.data);
      } else {
        console.error('Kasa hesapları verisi geçerli bir dizi değil:', response.data);
        message.error('Kasa hesapları verisi geçerli bir format değil');
        // Test verileri ekle
        const testAccounts = [
          { cashAccountCode: '101', cashAccountName: 'MERKEZ TL KASA', cashAccountDescription: 'Merkez ofis TL kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'M', officeDescription: 'Merkez Ofis' },
          { cashAccountCode: '102', cashAccountName: 'ŞUBE TL KASA', cashAccountDescription: 'Şube kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'S', officeDescription: 'Şube Ofis' },
          { cashAccountCode: '102USD', cashAccountName: 'USD KASA', cashAccountDescription: 'Dolar kasa', currencyCode: 'USD', currencyDescription: 'ABD Doları', officeCode: 'M', officeDescription: 'Merkez Ofis' }
        ];
        setCashAccounts(testAccounts);
      }
    } catch (error) {
      console.error('Kasa hesapları yüklenirken hata:', error);
      message.error('Kasa hesapları yüklenemedi');
      // API çağrısı başarısız olursa test verileri ekle
      const testAccounts = [
        { cashAccountCode: '101', cashAccountName: 'MERKEZ TL KASA', cashAccountDescription: 'Merkez ofis TL kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'M', officeDescription: 'Merkez Ofis' },
        { cashAccountCode: '102', cashAccountName: 'ŞUBE TL KASA', cashAccountDescription: 'Şube kasa', currencyCode: 'TRY', currencyDescription: 'Türk Lirası', officeCode: 'S', officeDescription: 'Şube Ofis' },
        { cashAccountCode: '102USD', cashAccountName: 'USD KASA', cashAccountDescription: 'Dolar kasa', currencyCode: 'USD', currencyDescription: 'ABD Doları', officeCode: 'M', officeDescription: 'Merkez Ofis' }
      ];
      setCashAccounts(testAccounts);
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
      const formDescription = values.description || `${invoiceNumber} nolu fatura için nakit tahsilat`;
      
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
      console.log('Fatura toplamı:', invoiceAmount);
      console.log('Mevcut ödenen toplam:', paidAmount);
      
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
      
      // Kalan tutarı hesapla
      const remaining = invoiceAmount - totalPaid;
      setRemainingAmount(remaining);
      console.log('Kalan tutar:', remaining);
      
      // Para üstü kontrolü
      if (totalPaid > invoiceAmount) {
        const advance = totalPaid - invoiceAmount;
        setAdvanceAmount(advance);
        setShowAdvanceWarning(true);
        console.log('Para üstü:', advance);
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
    
    setLoading(true);
    try {
      // Token kontrolü
      if (!token) {
        message.error('Oturum bilgileriniz bulunamadı. Lütfen yeniden giriş yapın.');
        return;
      }
      
      // Tüm ödeme satırlarını içeren payload hazırla - backend CashPaymentRequest modeline uygun
      const payload = {
        invoiceId: invoiceHeaderID, // InvoiceId olarak gönder
        currAccCode, // Müşteri kodu
        cashCurrAccCode: paymentRows.length > 0 ? paymentRows[0].cashAccountCode : '', // Kasa kodu
        documentDate: new Date().toISOString(), // Bugünün tarihi
        description: 'Nakit tahsilat', // Açıklama
        invoiceNumber: invoiceNumber, // Fatura numarası
        docCurrencyCode: currencyCode || 'TRY', // Para birimi
        paymentRows: paymentRows.map(row => ({
          amount: row.amount,
          currencyCode: row.currencyCode,
          exchangeRate: row.exchangeRate
        })),
        attributes: [] // Öznitelikler (şimdilik boş)
      };
      
      console.log('Gönderilen veri:', payload);
      
      // API çağrısı
      const response = await axios.post(`${API_BASE_URL}/api/v1/payment/cash-payment`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        // Nakit tahsilat başarı mesajı InvoiceForm'da gösterilecek
        message.success('Nakit tahsilat başarıyla kaydedildi.');
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        message.error(response.data?.message || 'Nakit tahsilat kaydedilirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Nakit tahsilat kaydedilirken hata oluştu:', error);
      
      // Hata tipine göre özel mesajlar
      if (error.response) {
        // Sunucu yanıtı ile gelen hata
        if (error.response.status === 401) {
          message.error('Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.');
          // Burada otomatik olarak login sayfasına yönlendirme yapılabilir
        } else {
          message.error(`Sunucu hatası: ${error.response.data?.message || error.response.statusText || 'Bilinmeyen hata'}`);
        }
      } else if (error.request) {
        // İstek yapıldı ancak yanıt alınamadı
        message.error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        // İstek oluşturulurken bir hata oluştu
        message.error(`İstek hatası: ${error.message}`);
      }
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
  const tableData = [
    {
      key: '1',
      label: 'Toplam',
      tryAmount: currencyCode === 'TRY' ? invoiceAmount : 0,
      foreignAmount: currencyCode !== 'TRY' ? invoiceAmount : 0
    },
    {
      key: '2',
      label: 'Ödenen Tutar',
      tryAmount: currencyCode === 'TRY' ? paidAmount : 0,
      foreignAmount: currencyCode !== 'TRY' ? paidAmount : 0
    },
    {
      key: '3',
      label: 'Para Üstü',
      tryAmount: currencyCode === 'TRY' ? (paidAmount > invoiceAmount ? paidAmount - invoiceAmount : 0) : 0,
      foreignAmount: currencyCode !== 'TRY' ? (paidAmount > invoiceAmount ? paidAmount - invoiceAmount : 0) : 0
    }
  ];

  return (
    <Card variant="borderless" style={{ padding: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Fatura Bilgileri Özet Bölümü */}
        <Card 
          title="Fatura Bilgileri" 
          style={{ marginBottom: 16, backgroundColor: '#f9f9f9' }}
          size="small"
        >
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text strong>Fatura No:</Text> <Text>{invoiceNumber}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Müşteri Kodu:</Text> <Text>{currAccCode}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Toplam Tutar:</Text> <Text>{invoiceAmount && invoiceAmount > 0 ? invoiceAmount.toFixed(2) : '0.00'} {currencyCode}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Ödeme Tipi:</Text> <Text>Peşin</Text>
            </Col>
          </Row>
        </Card>
        
        {/* Ödeme satırları tablosu */}
        <div style={{ marginBottom: '10px', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Ödeme Tipi</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Para Birimi</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Döviz Kuru</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Tutar</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Tutar (TRY)</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Ödeme Açıkl.</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontSize: '9.6px' }}>Kaldır</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', height: '50px' }}>
                    Ödeme satırı eklemek için aşağıdaki formu doldurup "Ekle" butonuna tıklayın.
                  </td>
                </tr>
              ) : (
                paymentRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center' }}>{row.paymentType}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center' }}>{row.currencyCode}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'right' }}>{typeof row.exchangeRate === 'number' ? row.exchangeRate.toFixed(4) : (row.exchangeRate || '0')}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'right' }}>{typeof row.amount === 'number' ? row.amount.toFixed(2) : (row.amount || '0')}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'right' }}>{typeof row.tryAmount === 'number' ? row.tryAmount.toFixed(2) : (row.tryAmount || '0')}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px' }}>{row.description}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center' }}>
                      <Button 
                        type="text" 
                        danger 
                        icon={<CloseOutlined />} 
                        onClick={() => removePaymentRow(row.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
            {/* Sol taraf - form alanları */}
            <div style={{ width: '60%', paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* 1. Satır - Kasa Hesabı */}
              <div style={{ display: 'flex', marginBottom: '6px' }}>
                <Form.Item name="cashAccountCode" style={{ width: '100%', marginBottom: '6px' }}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Kasa hesabı seçin"
                    showSearch
                    optionFilterProp="children"
                    onChange={handleCashAccountChange}
                    dropdownStyle={{ padding: '0px' }}
                    dropdownRender={(menu) => (
                      <>
                        <div style={{ padding: '0px', backgroundColor: '#f5f5f5', borderBottom: '2px solid #1890ff' }}>
                          <table style={{ width: '100%', fontSize: '9.6px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '15%', borderRight: '1px solid #e8e8e8' }}>Kod</th>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '30%', borderRight: '1px solid #e8e8e8' }}>Açıklama</th>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '25%', borderRight: '1px solid #e8e8e8' }}>Para Birimi</th>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '30%' }}>Ofis</th>
                              </tr>
                            </thead>
                          </table>
                        </div>
                        {menu}
                      </>
                    )}
                  >
                    {cashAccounts && cashAccounts.length > 0 ? (
                      cashAccounts.map(account => (
                        <Option 
                          key={account.cashAccountCode || account.code || account.id} 
                          value={account.cashAccountCode || account.code || account.id}
                        >
                          <div style={{ display: 'flex', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ width: '15%', borderRight: '1px solid #f0f0f0', padding: '4px', fontSize: '9.6px' }}>{account.cashAccountCode || account.code || account.id}</div>
                            <div style={{ width: '30%', borderRight: '1px solid #f0f0f0', padding: '4px', fontSize: '9.6px' }}>{account.cashAccountDescription || '-'}</div>
                            <div style={{ width: '25%', borderRight: '1px solid #f0f0f0', padding: '4px', fontSize: '9.6px' }}>{account.currencyCode} - {account.currencyDescription || '-'}</div>
                            <div style={{ width: '30%', padding: '4px', fontSize: '9.6px' }}>{account.officeCode} - {account.officeDescription || '-'}</div>
                          </div>
                        </Option>
                      ))
                    ) : (
                      <Option value="" disabled>Kasa hesabı bulunamadı</Option>
                    )}
                  </Select>
                </Form.Item>
              </div>
              
              {/* 2. Satır - Para Birimi ve Döviz Kuru */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <Form.Item name="currencyCode" style={{ width: '50%', marginBottom: '6px' }}>
                  <Select 
                    style={{ width: '100%' }}
                    loading={loadingCurrencies}
                    placeholder="Para birimi seçin"
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
                      // Yedek olarak sabit para birimleri listesi
                      <>
                        <Option value="TRY">TRY - Türk Lirası</Option>
                        <Option value="USD">USD - Amerikan Doları</Option>
                        <Option value="EUR">EUR - Euro</Option>
                        <Option value="GBP">GBP - İngiliz Sterlini</Option>
                      </>
                    )}
                  </Select>
                </Form.Item>

                <Form.Item name="exchangeRate" initialValue={1} style={{ width: '50%', marginBottom: '6px' }}>
                  <InputNumber 
                    style={{ width: '100%' }}
                    min={0}
                    precision={4}
                    step={0.1}
                    disabled={exchangeRateDisabled}
                    placeholder="Döviz kurunu manuel girin"
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
              
              {/* 3. Satır - Açıklama */}
              <div style={{ display: 'flex', marginBottom: '0px' }}>
                <Form.Item
                  name="description"
                  style={{ width: '100%', marginBottom: '0px' }}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
              </div>
            </div>
            
            {/* Sağ taraf - özet bilgiler */}
            <div style={{ width: '40%', border: '1px solid #f0f0f0', padding: '12px', backgroundColor: '#fafafa', borderRadius: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e8e8e8', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Fatura Toplamı:</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'red' }}>{currencyCode} {invoiceAmount?.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e8e8e8', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Ödenen Tutar:</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'green' }}>{currencyCode} {paidAmount.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: paidAmount > invoiceAmount ? '8px' : '0' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{paidAmount > invoiceAmount ? 'Para Üstü:' : 'Kalan Tutar:'}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: paidAmount > invoiceAmount ? 'blue' : 'orange' }}>
                  {currencyCode} {Math.abs(paidAmount - invoiceAmount).toFixed(2)}
                </span>
              </div>
              
              {paidAmount > invoiceAmount && (
                <div style={{ backgroundColor: '#e6f7ff', padding: '8px', borderRadius: '4px', marginTop: '8px', border: '1px solid #91d5ff' }}>
                  <InfoCircleOutlined style={{ color: '#1890ff', marginRight: '4px', fontSize: '12px' }} />
                  <span style={{ fontSize: '12px' }}>Fazla ödeme avans olarak kaydedilecektir.</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Tutar ve Ekle butonu */}
          <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ marginRight: '10px', fontWeight: 'bold' }}>Tutar:</div>
              <Form.Item
                name="amount"
                style={{ margin: 0 }}
                rules={[{ required: true, message: 'Lütfen tutar girin' }]}
              >
                <InputNumber
                  style={{ width: '150px' }}
                  min={0}
                  step={0.01}
                  precision={2}
                  onChange={handleAmountChange}
                  decimalSeparator=","
                  stringMode
                />
              </Form.Item>
              <div style={{ marginLeft: '10px', marginRight: '10px', fontWeight: 'bold' }}>{form.getFieldValue('currencyCode') || currencyCode}</div>
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={addPaymentRow}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              size="middle"
            />
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={onCancel} 
              icon={<CloseOutlined />}
              style={{ marginRight: '10px' }}
            >
              İptal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              disabled={paymentRows.length === 0}
            >
              Kaydet
            </Button>
          </div>
          
          {/* Para üstü uyarı modalı */}
          <Modal
            title="Para Üstü Uyarısı"
            open={showAdvanceWarning}
            onOk={acceptAdvancePayment}
            onCancel={() => setShowAdvanceWarning(false)}
            okText="Evet, Avans Olarak Kaydet"
            cancelText="Hayır, İptal"
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
