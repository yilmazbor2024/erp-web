import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Empty, Typography, Tabs, DatePicker, Select, Space, Tag, Button, Avatar, Badge, List } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  BankOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  TeamOutlined,
  CarOutlined,
  InboxOutlined,
  DatabaseOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined, 
  ShopOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  EyeOutlined
} from '@ant-design/icons';
import ExchangeRatesCard from '../../components/ExchangeRatesCard';
import cashVoucherApi from '../../services/cashVoucherApi';
import invoiceApi from '../../services/invoiceApi';
import invoiceSummaryApi from '../../services/invoiceSummaryApi';
import { formatCurrency } from '../../utils/formatters';
import tcmbExchangeRateApi from '../../services/tcmbExchangeRateApi';

interface DashboardCard {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  link: string;
}

// Orijinal dashboard kartları kaldırıldı
const dashboardCards: DashboardCard[] = [];

// Fatura tipleri için renkler ve başlıklar
const invoiceTypeConfig = {
  WS: { title: 'Satış Faturaları', color: '#52c41a', icon: <ShoppingCartOutlined /> },
  BP: { title: 'Alış Faturaları', color: '#f5222d', icon: <ShoppingOutlined /> },
  EP: { title: 'Masraf Faturaları', color: '#faad14', icon: <DollarOutlined /> }
};

// Zaman periyotları için başlıklar
const periodTitles = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık'
};

interface CashAccount {
  cashAccountCode: string;
  cashAccountDescription: string;
  currencyCode: string;
  localOpeningBalance: number;
  documentOpeningBalance: number;
  localTotalDebit: number;
  localTotalCredit: number;
  documentTotalDebit: number;
  documentTotalCredit: number;
  totalReceipt: number;
  totalPayment: number;
  totalTransferIn: number;
  totalTransferOut: number;
  localClosingBalance: number;
  documentClosingBalance: number;
}

interface CashTransaction {
  // Backend modelinden gelen alanlar
  documentDate: string;
  documentTime?: string;
  documentNumber?: string;
  cashTransTypeCode: string;
  cashTransTypeDescription: string;
  cashTransNumber?: string;
  currAccCode?: string;
  currAccDescription?: string;
  description: string;
  lineDescription?: string;
  loc_CurrencyCode: string;
  loc_Debit: number;
  loc_Credit: number;
  loc_Balance?: number;
  doc_CurrencyCode?: string;
  doc_Debit?: number;
  doc_Credit?: number;
  doc_Balance?: number;
  cashAccountCode?: string;
  cashAccountDescription?: string;
  applicationCode?: string;
  applicationDescription?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [invoiceSummaryLoading, setInvoiceSummaryLoading] = useState<boolean>(true);
  const [todayInvoicesLoading, setTodayInvoicesLoading] = useState<boolean>(true);
  const [cashSummary, setCashSummary] = useState<any>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null);
  const [todayInvoices, setTodayInvoices] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [todayCashTransactions, setTodayCashTransactions] = useState<any[]>([]);
  const [todayCashTransactionsLoading, setTodayCashTransactionsLoading] = useState(true);

  // TCMB'den bugünkü kurları al
  useEffect(() => {
    const fetchTcmbExchangeRates = async () => {
      try {
        // TCMB'den tüm kurları al
        const rates = await tcmbExchangeRateApi.getAllExchangeRates();
        
        setExchangeRates(rates);
        // console.log('TCMB güncel kurlar alındı:', rates);
      } catch (error) {
        console.error('TCMB kur bilgileri alınamadı:', error);
        
       
        
       
      }
    };
    
    fetchTcmbExchangeRates();
  }, []);

  // Fatura özet kartını oluştur
  const renderInvoiceSummaryCard = (title: string, icon: React.ReactNode, color: string, dailyData?: any, weeklyData?: any, monthlyData?: any) => {
    // Verileri doğrudan parametrelerden alıyoruz

    return (
      <Card 
        style={{ 
          borderRadius: 8, 
          overflow: 'hidden', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #eaeaea',
          background: 'white',
          height: '100%'
        }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Kart başlığı */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #f0f0f0', 
          display: 'flex', 
          alignItems: 'center',
          background: 'white'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: 24, 
            height: 24, 
            borderRadius: '50%', 
            backgroundColor: color, 
            color: 'white',
            marginRight: 8
          }}>
            {icon}
          </div>
          <span style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#444'
          }}>{title}</span>
        </div>

        {invoiceSummaryLoading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Spin size="small" />
          </div>
        ) : (
          <div style={{ height: '100%' }}>
            {/* Günlük satır */}
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #f0f0f0',
              background: 'white'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <div style={{ 
                  fontSize: 12, 
                  color: '#555', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  width: '33%'
                }}>
                  <span style={{ marginRight: '6px', fontSize: 14 }}>•</span>
                  Günlük
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#666', 
                  background: '#f5f5f5', 
                  padding: '4px 12px', 
                  borderRadius: '16px',
                  fontWeight: 500,
                  border: '1px solid #f0f0f0',
                  minWidth: '80px',
                  textAlign: 'center',
                  width: '33%'
                }}>
                  {dailyData?.count || 0} adet
                </div>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 'bold', 
                  color, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  width: '33%',
                  justifyContent: 'flex-end'
                }}>
                  {formatCurrency(dailyData?.total || 0)}
                </div>
              </div>
            </div>
            
            {/* Günlük para birimi detayları */}
            {dailyData?.byCurrency && Object.keys(dailyData?.byCurrency).length > 0 && (
              <div style={{ 
                padding: '8px 16px', 
                background: 'white',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {Object.entries(dailyData?.byCurrency).map(([currency, amount]) => (
                  <div 
                    key={`daily-${currency}`}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '2px 8px',
                      width: '45%',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ 
                      fontSize: 10, 
                      color: '#666',
                      fontWeight: 500 
                    }}>
                      {currency}
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: '#666',
                      fontWeight: 500
                    }}>
                      {Number(amount).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Haftalık satır */}
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #f0f0f0',
              background: '#f9f9f9'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <div style={{ 
                  fontSize: 12, 
                  color: '#555', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  width: '33%'
                }}>
                  <span style={{ marginRight: '6px', fontSize: 14 }}>•</span>
                  Haftalık
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#666', 
                  background: '#f5f5f5', 
                  padding: '4px 12px', 
                  borderRadius: '16px',
                  fontWeight: 500,
                  border: '1px solid #f0f0f0',
                  minWidth: '80px',
                  textAlign: 'center',
                  width: '33%'
                }}>
                  {weeklyData?.count || 0} adet
                </div>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 'bold', 
                  color, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  width: '33%',
                  justifyContent: 'flex-end'
                }}>
                  {formatCurrency(weeklyData?.total || 0)}
                </div>
              </div>
            </div>
            
            {/* Haftalık para birimi detayları */}
            {weeklyData?.byCurrency && Object.keys(weeklyData?.byCurrency).length > 0 && (
              <div style={{ 
                padding: '8px 16px', 
                background: '#f9f9f9',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {Object.entries(weeklyData?.byCurrency).map(([currency, amount]) => (
                  <div 
                    key={`weekly-${currency}`}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '2px 8px',
                      width: '45%',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ 
                      fontSize: 10, 
                      color: '#666',
                      fontWeight: 500 
                    }}>
                      {currency}
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: '#666',
                      fontWeight: 500
                    }}>
                      {Number(amount).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Aylık satır */}
            <div style={{ 
              padding: '12px 16px',
              background: '#f9f9f9',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <div style={{ 
                  fontSize: 12, 
                  color: '#555', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  width: '33%'
                }}>
                  <span style={{ marginRight: '6px', fontSize: 14 }}>•</span>
                  Aylık
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#666', 
                  background: '#f5f5f5', 
                  padding: '4px 12px', 
                  borderRadius: '16px',
                  fontWeight: 500,
                  border: '1px solid #f0f0f0',
                  minWidth: '80px',
                  textAlign: 'center',
                  width: '33%'
                }}>
                  {monthlyData?.count || 0} adet
                </div>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 'bold', 
                  color, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  width: '33%',
                  justifyContent: 'flex-end'
                }}>
                  {formatCurrency(monthlyData?.total || 0)}
                 
                </div>
              </div>
            </div>

            {/* Para birimi bazında tutarlar */}
            {monthlyData?.byCurrency && Object.keys(monthlyData?.byCurrency).length > 0 && (
              <div style={{ 
                padding: '12px 16px', 
                background: '#f9f9f9',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {Object.entries(monthlyData?.byCurrency).map(([currency, amount]) => (
                  <div 
                    key={currency}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 8px',
                      width: '45%',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{ 
                      fontSize: 11, 
                      color: '#666',
                      fontWeight: 500 
                    }}>
                      {currency}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#666',
                      fontWeight: 500
                    }}>
                      {Number(amount).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  // Para birimi için renk belirle
  const getCurrencyColor = (currencyCode: string) => {
    switch(currencyCode) {
      case 'USD': return '#2b908f';
      case 'EUR': return '#3366cc';
      case 'TRY': return '#e15f41';
      default: return '#718093';
    }
  };

  // Kasa özet bilgilerini getir
  const fetchCashSummary = async () => {
    setLoading(true);
    try {
      const response = await cashVoucherApi.getCashSummary();
      if (response.data && response.success) {
        setCashAccounts(response.data);
      }
    } catch (error) {
      console.error('Kasa özet bilgileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Günlük kasa hareketlerini getir
  const fetchCashTransactions = async () => {
    setTransactionsLoading(true);
    try {
      // Bugünün tarihini al
      const today = dayjs();
      
      // API parametrelerini hazırla
      const apiParams: any = {
        startDate: today.format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
        page: 1,
        pageSize: 10,
        langCode: 'TR'
      };
      
      // console.log('Günlük kasa hareketleri için parametreler:', apiParams);
      
      const response = await cashVoucherApi.getCashBalances(apiParams);
      // console.log('Günlük kasa hareketleri yanıtı:', response);
      
      if (response.success && response.data) {
        // Tüm işlemleri birleştir
        let allTransactions: CashTransaction[] = [];
        response.data.forEach((account: any) => {
          if (account.transactions && account.transactions.length > 0) {
            // Her işleme kasa hesap kodunu ekle
            const accountTransactions = account.transactions.map((t: any) => ({
              ...t,
              cashAccountCode: account.cashAccountCode
            }));
            allTransactions = [...allTransactions, ...accountTransactions];
          }
        });
        
        setCashTransactions(allTransactions);
      }
    } catch (error) {
      console.error('Günlük kasa hareketleri alınamadı:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Fatura özetlerini getir
  const fetchInvoiceSummary = async () => {
    setInvoiceSummaryLoading(true);
    try {
      // Token kontrolü yap
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        // Token yoksa boş veri göster
        setInvoiceSummary(getDefaultInvoiceSummary());
        setInvoiceSummaryLoading(false);
        return;
      }

      // Önce invoiceSummaryApi'yi deneyelim (daha optimize)
      try {
        const response = await invoiceSummaryApi.getInvoiceSummary({});
        if (response?.success && response?.data) {
          setInvoiceSummary(response.data);
          setInvoiceSummaryLoading(false);
          return;
        }
      } catch (summaryError) {
        // API hatası durumunda alternatif yönteme geç (sessizce)
      }
      
      // API çalışmıyorsa manuel hesaplama yapalım
      const today = dayjs();
      const startOfWeek = today.startOf('week');
      const startOfMonth = today.startOf('month');
      
      try {
        // Günlük, haftalık ve aylık veriler için API çağrıları
        const [dailySales, dailyPurchase, dailyExpense, weeklySales, weeklyPurchase, weeklyExpense, monthlySales, monthlyPurchase, monthlyExpense] = await Promise.all([
          // Günlük faturalar
          invoiceApi.getAllInvoices({
            startDate: today.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'WS',
            pageSize: 500 // Daha az veri getir (performans için)
          }),
          invoiceApi.getAllInvoices({
            startDate: today.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'BP',
            pageSize: 500
          }),
          invoiceApi.getAllInvoices({
            startDate: today.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'EP',
            pageSize: 500
          }),
          
          // Haftalık faturalar
          invoiceApi.getAllInvoices({
            startDate: startOfWeek.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'WS',
            pageSize: 500
          }),
          invoiceApi.getAllInvoices({
            startDate: startOfWeek.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'BP',
            pageSize: 500
          }),
          invoiceApi.getAllInvoices({
            startDate: startOfWeek.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'EP',
            pageSize: 500
          }),
          
          // Aylık faturalar
          invoiceApi.getAllInvoices({
            startDate: startOfMonth.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'WS',
            pageSize: 500
          }),
          invoiceApi.getAllInvoices({
            startDate: startOfMonth.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'BP',
            pageSize: 500
          }),
          invoiceApi.getAllInvoices({
            startDate: startOfMonth.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD'),
            processCode: 'EP',
            pageSize: 500
          })
        ]);
        
        // Toplamları hesapla
        const calculateTotal = (data: any) => {
          if (!data || !data.success || !data.data || !data.data.items) {
            return { count: 0, total: 0, byCurrency: {} };
          }
          
          const items = data.data.items;
          const count = items.length;
          
          // Para birimine göre gruplandırma - orijinal para birimlerinde
          const byCurrency: Record<string, number> = {};
          let totalInTRY = 0;
          
          items.forEach((item: any) => {
            const currency = item.docCurrencyCode || 'TRY';
            const amount = item.netAmount || 0;
            
            // Orijinal para biriminde toplam
            if (!byCurrency[currency]) {
              byCurrency[currency] = 0;
            }
            byCurrency[currency] += amount;
            
            // TL karşılığını hesapla
            let amountInTRY = amount;
            if (currency !== 'TRY') {
              // Önce faturadaki kuru dene, yoksa bugünkü kuru kullan, o da yoksa 1 kullan
              const exchangeRate = item.exchangeRate || exchangeRates[currency] || 1;
              amountInTRY = amount * exchangeRate;
            }
            
            totalInTRY += amountInTRY;
          });
          
          return { count, total: totalInTRY, byCurrency };
        };
        
        // Sonuçları birleştir
        const summaryData = {
          daily: {
            WS: calculateTotal(dailySales),
            BP: calculateTotal(dailyPurchase),
            EP: calculateTotal(dailyExpense)
          },
          weekly: {
            WS: calculateTotal(weeklySales),
            BP: calculateTotal(weeklyPurchase),
            EP: calculateTotal(weeklyExpense)
          },
          monthly: {
            WS: calculateTotal(monthlySales),
            BP: calculateTotal(monthlyPurchase),
            EP: calculateTotal(monthlyExpense)
          }
        };
        
        setInvoiceSummary(summaryData);
      } catch (apiError: any) {
        // API hatası durumunda varsayılan değerleri göster
        setInvoiceSummary(getDefaultInvoiceSummary());
      }
    } catch (error: any) {
      // Sadece beklenmeyen hatalar için log göster
      if (error?.response?.status !== 400 && error?.response?.status !== 401 && error?.response?.status !== 404) {
        console.error('Fatura özetleri alınırken beklenmeyen hata:', error?.message || 'Bilinmeyen hata');
      }
      // Hata durumunda varsayılan değerleri göster
      setInvoiceSummary(getDefaultInvoiceSummary());
    } finally {
      setInvoiceSummaryLoading(false);
    }
  };
  
  // Varsayılan fatura özeti için yardımcı fonksiyon
  const getDefaultInvoiceSummary = () => {
    return {
      daily: {
        WS: { count: 0, total: 0, byCurrency: {} },
        BP: { count: 0, total: 0, byCurrency: {} },
        EP: { count: 0, total: 0, byCurrency: {} }
      },
      weekly: {
        WS: { count: 0, total: 0, byCurrency: {} },
        BP: { count: 0, total: 0, byCurrency: {} },
        EP: { count: 0, total: 0, byCurrency: {} }
      },
      monthly: {
        WS: { count: 0, total: 0, byCurrency: {} },
        BP: { count: 0, total: 0, byCurrency: {} },
        EP: { count: 0, total: 0, byCurrency: {} }
      }
    };
  };
  
  // Bugün kesilen faturaları getir
  const fetchTodayInvoices = async () => {
    setTodayInvoicesLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const params = {
        startDate: today,
        endDate: today,
        pageSize: 100 // Bugünkü tüm faturaları almak için yüksek bir değer
      };
      
      // Tüm fatura tiplerini paralel olarak getir
      const [salesResponse, purchaseResponse, expenseResponse] = await Promise.all([
        invoiceApi.getAllInvoices({ ...params, processCode: 'WS' }),
        invoiceApi.getAllInvoices({ ...params, processCode: 'BP' }),
        invoiceApi.getAllInvoices({ ...params, processCode: 'EP' })
      ]);
      
      // Faturaları birleştir ve tipe göre işaretle
      const salesInvoices = salesResponse?.data?.items?.map((item: any) => ({ ...item, type: 'WS' })) || [];
      const purchaseInvoices = purchaseResponse?.data?.items?.map((item: any) => ({ ...item, type: 'BP' })) || [];
      const expenseInvoices = expenseResponse?.data?.items?.map((item: any) => ({ ...item, type: 'EP' })) || [];
      
      // Tüm faturaları birleştir ve tarihe göre sırala
      const allInvoices = [...salesInvoices, ...purchaseInvoices, ...expenseInvoices].sort((a, b) => {
        return dayjs(b.invoiceDate + ' ' + (b.invoiceTime || '00:00')).valueOf() - 
               dayjs(a.invoiceDate + ' ' + (a.invoiceTime || '00:00')).valueOf();
      });
      
      // Debug: API'den gelen fatura verilerini konsola yazdır
      // console.log('API den gelen fatura verileri:', allInvoices);
      
      // Fatura verilerini düzenleme
      const processedInvoices = allInvoices.map(invoice => {
        // Cari hesap adı için tüm olası alanları kontrol et
        const currAccName = invoice.currAccDescription || invoice.currAccName || 
                           invoice.customerDescription || invoice.vendorDescription || 
                           invoice.customerName || invoice.vendorName || '-';
        
        // Para birimi için tüm olası alanları kontrol et
        const currencyCode = invoice.docCurrencyCode || invoice.DocCurrencyCode || 
                            invoice.currencyCode || invoice.CurrencyCode || 'TRY';
        
        return {
          ...invoice,
          currAccName: currAccName,
          currencyCode: currencyCode
        };
      });
      
      setTodayInvoices(processedInvoices);
    } catch (error) {
      console.error('Bugünkü faturalar alınamadı:', error);
      // Hata durumunda boş dizi göster
      setTodayInvoices([]);
    } finally {
      setTodayInvoicesLoading(false);
    }
  };

  // Bugün yapılan kasa hareketlerini getir (Tahsilat, Tediye, Virman)
  const fetchTodayCashTransactions = async () => {
    setTodayCashTransactionsLoading(true);
    try {
      // Token kontrolü yap
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setTodayCashTransactions([]);
        setTodayCashTransactionsLoading(false);
        return;
      }
      
      // Tarih formatını backend'in beklediği şekilde ayarla
      const today = dayjs().format('YYYY-MM-DD');
      
      // API çağrısı için parametreler
      const params = {
        startDate: today,
        endDate: today,
        pageSize: 5, // Daha az veri getir (performans için)
        pageNumber: 1
      };
      
      try {
        // Kasa hareketleri raporunu getir
        const response = await cashVoucherApi.getCashTransactionReport(params);
        
        if (response?.success && response?.data?.items && Array.isArray(response.data.items)) {
          // Kasa hareketlerini işle ve state'e kaydet
          const processedTransactions = response.data.items.map((item: any) => {
            return {
              ...item,
              // createDate alanını createdDate olarak aktar
              createdDate: item.createDate || item.documentDate
            };
          });
          
          setTodayCashTransactions(processedTransactions);
        } else {
          // Veri yoksa veya beklenen formatta değilse boş dizi göster
          setTodayCashTransactions([]);
        }
      } catch (innerError: any) {
        // Backend API hatası (400, 404 gibi) - sessizce boş dizi göster
        setTodayCashTransactions([]);
      }
    } catch (error: any) {
      // Sadece beklenmeyen hatalar için log göster
      if (error?.response?.status !== 400 && error?.response?.status !== 401 && error?.response?.status !== 404) {
        console.error('Bugünkü kasa hareketleri alınamadı:', error?.message || 'Bilinmeyen hata');
      }
      // Hata durumunda boş dizi göster
      setTodayCashTransactions([]);
    } finally {
      setTodayCashTransactionsLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchCashSummary();
    fetchCashTransactions();
    fetchInvoiceSummary();
    fetchTodayInvoices();
    fetchTodayCashTransactions();
  }, []);
  
  // Fatura tipi için etiket rengi ve metni
  const getInvoiceTypeTag = (type: string) => {
    switch (type) {
      case 'WS':
        return <Tag color={invoiceTypeConfig.WS.color}>Satış Faturası</Tag>;
      case 'BP':
        return <Tag color={invoiceTypeConfig.BP.color}>Alış Faturası</Tag>;
      case 'EP':
        return <Tag color={invoiceTypeConfig.EP.color}>Masraf Faturası</Tag>;
      default:
        return <Tag>Bilinmiyor</Tag>;
    }
  };
  
  // Fatura tablosu sütunları
  const invoiceColumns = [
    {
      title: 'Fatura Tipi',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getInvoiceTypeTag(type)
    },
    {
      title: 'Fatura No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Saat',
      dataIndex: 'invoiceTime',
      key: 'invoiceTime',
      render: (text: string) => text || '-'
    },
    {
      title: 'Cari Hesap',
      dataIndex: 'currAccDescription',
      key: 'currAccDescription',
      ellipsis: true,
      render: (text: string, record: any) => {
        // Cari hesap adı için öncelikle currAccDescription, yoksa currAccName, ikisi de yoksa boş string göster
        return text || record.currAccName || '-';
      }
    },
    {
      title: 'Tutar',
      dataIndex: 'netAmount',
      key: 'netAmount',
      align: 'right' as 'right',
      render: (amount: number, record: any) => formatCurrency(record.grossAmount || record.netAmount || 0, record.currencyCode || 'TRY')
    }
  ];



  // Mobil görünüm için stil tanımlamaları
  
  // Pencere boyutu değiştiğinde mobil durumunu güncelle
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Mobil alt menü için CSS stil
  const mobileSubmenuStyle = {
    display: { xs: 'block', md: 'none' }
  };
  
  // Mobil cihazlar için font boyutları ve padding değerleri
  const mobileStyles = {
    container: {
      padding: isMobile ? '8px' : '16px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: isMobile ? 12 : 20,
      fontSize: isMobile ? 13 : 18,  // Mobil için %30 küçültüldü
      color: '#1890ff',
      borderBottom: '1px solid #f0f0f0',
      paddingBottom: isMobile ? 8 : 12
    },
    cardTitle: {
      fontSize: isMobile ? 11 : 16,  // Mobil için %30 küçültüldü
      fontWeight: 'bold' as 'bold'
    },
    cardSubtitle: {
      fontSize: isMobile ? 9 : 13,  // Mobil için %30 küçültüldü
      opacity: 0.8
    },
    balanceLabel: {
      fontSize: isMobile ? 9 : 13,  // Mobil için %30 küçültüldü
      color: '#666',
      marginBottom: isMobile ? 4 : 6,
      fontWeight: 500 as 500
    },
    balanceValue: {
      fontSize: isMobile ? 14 : 22,  // Mobil için %30 küçültüldü
      fontWeight: 'bold' as 'bold'
    },
    balanceSecondary: {
      fontSize: isMobile ? 9 : 13,  // Mobil için %30 küçültüldü
      color: '#666',
      marginTop: isMobile ? 4 : 6,
      padding: isMobile ? '2px 6px' : '4px 8px',
      background: '#f0f0f0',
      borderRadius: 4,
      display: 'inline-block'
    },
    periodTitle: {
      fontSize: isMobile ? 11 : 16,  // Mobil için %30 küçültüldü
      fontWeight: 'bold' as 'bold',
      textAlign: 'center' as 'center',
      marginBottom: isMobile ? 6 : 10
    },
    periodValue: {
      fontSize: isMobile ? 13 : 20,  // Mobil için %30 küçültüldü
      fontWeight: 'bold' as 'bold',
      textAlign: 'center' as 'center',
      color: '#389e0d'
    },
    periodCount: {
      fontSize: isMobile ? 8 : 12,  // Mobil için %30 küçültüldü
      color: '#666',
      textAlign: 'center' as 'center',
      marginTop: isMobile ? 4 : 6
    }
  };
  
  return (
    <div className="dashboard-container" style={mobileStyles.container}>
      
      {/* Fatura Özeti Bölümü */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={mobileStyles.sectionTitle}>
          <FileOutlined style={{ marginRight: 8 }} /> Fatura Özetleri
        </h3>
        
        {invoiceSummaryLoading ? (
          <div style={{ textAlign: 'center', padding: 24, background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Spin size="default" />
          </div>
        ) : (
          <div>
            <Row gutter={[16, 24]} style={{ width: '100%' }}>
              {/* Satış Faturaları */}
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                {renderInvoiceSummaryCard(
                  invoiceTypeConfig.WS.title,
                  invoiceTypeConfig.WS.icon,
                  invoiceTypeConfig.WS.color,
                  invoiceSummary?.daily?.WS,
                  invoiceSummary?.weekly?.WS,
                  invoiceSummary?.monthly?.WS
                )}
              </Col>
            
              {/* Alış Faturaları */}
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                {renderInvoiceSummaryCard(
                  invoiceTypeConfig.BP.title,
                  invoiceTypeConfig.BP.icon,
                  invoiceTypeConfig.BP.color,
                  invoiceSummary?.daily?.BP,
                  invoiceSummary?.weekly?.BP,
                  invoiceSummary?.monthly?.BP
                )}
              </Col>
              
              {/* Masraf Faturaları */}
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                {renderInvoiceSummaryCard(
                  invoiceTypeConfig.EP.title,
                  invoiceTypeConfig.EP.icon,
                  invoiceTypeConfig.EP.color,
                  invoiceSummary?.daily?.EP,
                  invoiceSummary?.weekly?.EP,
                  invoiceSummary?.monthly?.EP
                )}
              </Col>
            </Row>
          </div>
        )}
      </div>
      
      {/* Bugünkü Faturalar Bölümü - Sadece fatura varsa göster */}
      {!todayInvoicesLoading && todayInvoices && todayInvoices.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: 16, fontSize: 18 }}>
            <FileOutlined style={{ marginRight: 8 }} /> Bugün Kesilen Faturalar
          </h3>
          
          <div style={{ background: '#fff', padding: 16, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {isMobile ? (
              <div style={{ padding: '0px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ backgroundColor: '#1890ff', color: 'white', padding: '8px', fontSize: '1em', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px', borderRadius: '4px 4px 0 0' }}>
                  Bugün Kesilen Faturalar
                </div>
                {todayInvoices.map((invoice: any) => (
                  <div 
                    key={invoice.invoiceHeaderID || invoice.invoiceHeaderId} 
                    style={{ 
                      padding: '8px 12px', 
                      marginBottom: '8px', 
                      backgroundColor: 'white', 
                      borderRadius: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/invoice/${invoice.invoiceHeaderID || invoice.invoiceHeaderId}`)}
                  >
                    {/* Üst satır: Fatura Tipi, Fatura No ve Saat */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Tag color={invoice.type === 'WS' ? '#52c41a' : invoice.type === 'BP' ? '#faad14' : '#f5222d'} style={{ marginRight: '8px' }}>
                          {invoice.type === 'WS' ? 'Satış' : invoice.type === 'BP' ? 'Alış' : 'Masraf'}
                        </Tag>
                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{invoice.invoiceNumber}</span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{invoice.invoiceTime || '-'}</span>
                    </div>
                    
                    {/* Alt satır: Cari hesap adı ve toplam tutar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invoice.currAccDescription || invoice.currAccName || '-'}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#1890ff', flex: 1, textAlign: 'right' }}>
                        {formatCurrency(invoice.grossAmount || invoice.netAmount || 0, invoice.currencyCode || 'TRY')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table 
                dataSource={todayInvoices}
                columns={invoiceColumns}
                rowKey="invoiceHeaderID"
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                size="small"
                scroll={{ x: 'max-content' }}
                style={{ marginBottom: 16 }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Bugünkü Faturalar Yüklenirken */}
      {todayInvoicesLoading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: 16, fontSize: 18 }}>
            <FileOutlined style={{ marginRight: 8 }} /> Bugün Kesilen Faturalar
          </h3>
          <div style={{ textAlign: 'center', padding: 24, background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Spin size="default" />
          </div>
        </div>
      )}
      
      {/* Bugün Yapılan Kasa Hareketleri Bölümü */}
      {!todayCashTransactionsLoading && todayCashTransactions && todayCashTransactions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: 16, fontSize: 18 }}>
            <WalletOutlined style={{ marginRight: 8 }} /> Bugün Yapılan Kasa Hareketleri
          </h3>
          
          <div style={{ background: '#fff', padding: 16, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {isMobile ? (
              <div style={{ padding: '0px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ backgroundColor: '#1890ff', color: 'white', padding: '8px', fontSize: '1em', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px', borderRadius: '4px 4px 0 0' }}>
                  Bugün Yapılan Kasa Hareketleri
                </div>
                {todayCashTransactions.map((transaction: any) => (
                  <div 
                    key={transaction.transactionNumber} 
                    style={{ 
                      padding: '8px 12px', 
                      marginBottom: '8px', 
                      backgroundColor: 'white', 
                      borderRadius: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Üst satır: İşlem Tipi, İşlem No ve Saat */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Tag color={transaction.transactionType === 'Tahsilat' ? '#52c41a' : transaction.transactionType === 'Tediye' ? '#f5222d' : '#faad14'} style={{ marginRight: '8px' }}>
                          {transaction.transactionType}
                        </Tag>
                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{transaction.transactionNumber}</span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                        {dayjs(transaction.createDate || transaction.documentDate).format('HH:mm')}
                      </span>
                    </div>
                    
                    {/* Alt satır: Cari hesap adı ve tutar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transaction.currAccDesc || transaction.cashAccountName || '-'}
                      </span>
                      <span style={{ fontWeight: 'bold', color: transaction.transactionType === 'Tahsilat' ? '#52c41a' : '#f5222d', flex: 1, textAlign: 'right' }}>
                        {transaction.amount?.toLocaleString('tr-TR') || '0'} {transaction.currencyCode}
                        {transaction.currencyCode !== 'TRY' && (
                          <div style={{ fontSize: '11px', color: '#888', fontWeight: 'normal' }}>
                            {(transaction.amount * (transaction.exchangeRate || 1))?.toLocaleString('tr-TR')} TRY
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table 
                dataSource={todayCashTransactions}
                columns={[
                  {
                    title: 'İşlem Tipi',
                    dataIndex: 'transactionType',
                    key: 'transactionType',
                    render: (text: string) => (
                      <Tag color={text === 'Tahsilat' ? '#52c41a' : text === 'Tediye' ? '#f5222d' : '#faad14'}>
                        {text}
                      </Tag>
                    )
                  },
                  {
                    title: 'İşlem No',
                    dataIndex: 'transactionNumber',
                    key: 'transactionNumber'
                  },
                  {
                    title: 'Saat',
                    dataIndex: 'createDate',
                    key: 'createDate',
                    render: (text: string, record: any) => {
                      // console.log('Saat için kullanılan değer:', text, typeof text);
                      return dayjs(text || record.documentDate).format('HH:mm');
                    }
                  },
                  {
                    title: 'Cari Hesap',
                    dataIndex: 'currAccDesc',
                    key: 'currAccDesc',
                    render: (text: string, record: any) => text || record.cashAccountName || '-'
                  },
                  {
                    title: 'Tutar',
                    dataIndex: 'amount',
                    key: 'amount',
                    align: 'right' as 'right',
                    render: (text: number, record: any) => (
                      <div>
                        <div>{(text || 0).toLocaleString('tr-TR')} {record.currencyCode}</div>
                        {record.currencyCode !== 'TRY' && (
                          <div style={{ fontSize: '11px', color: '#888' }}>
                            {(text * (record.exchangeRate || 1))?.toLocaleString('tr-TR')} TRY
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
                rowKey="transactionNumber"
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                size="small"
                scroll={{ x: 'max-content' }}
                style={{ marginBottom: 16 }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Bugünkü Kasa Hareketleri Yüklenirken */}
      {todayCashTransactionsLoading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: 16, fontSize: 18 }}>
            <WalletOutlined style={{ marginRight: 8 }} /> Bugün Yapılan Kasa Hareketleri
          </h3>
          <div style={{ textAlign: 'center', padding: 24, background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Spin size="default" />
          </div>
        </div>
      )}
      
      {/* Kasa Özeti Bölümü */}
      <div style={{ marginBottom: isMobile ? 12 : 16 }}>
        <h3 style={mobileStyles.sectionTitle}>
          <WalletOutlined style={{ marginRight: 8 }} /> Kasa Özeti
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Spin size="default" />
          </div>
        ) : cashAccounts.length === 0 ? (
          <Empty description="Kasa hesabı bulunamadı" style={{ padding: 24, background: '#fff', borderRadius: 4 }} />
        ) : (
          <Row gutter={[24, 24]}>
            {cashAccounts.map((account) => (
              <Col xs={24} sm={12} md={8} lg={8} key={account.cashAccountCode}>
                <Card 
                  style={{ 
                    borderRadius: 8, 
                    overflow: 'hidden',
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  styles={{ body: { padding: 0 } }}
                  hoverable
                  onClick={() => navigate('/cash/summary')}
                >
                  <div style={{ 
                    padding: '16px 20px', 
                    background: getCurrencyColor(account.currencyCode),
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={mobileStyles.cardTitle}>{account.cashAccountDescription}</div>
                      <div style={{...mobileStyles.cardSubtitle, marginTop: 4 }}>{account.cashAccountCode}</div>
                    </div>
                    <Avatar 
                      style={{ 
                        background: '#fff', 
                        color: getCurrencyColor(account.currencyCode),
                        fontWeight: 'bold',
                        fontSize: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} 
                      size="large"
                    >
                      {account.currencyCode}
                    </Avatar>
                  </div>
                  
                  {/* Bakiye */}
                  <div style={{ padding: isMobile ? '16px' : '20px', background: '#fafafa' }}>
                    <div style={mobileStyles.balanceLabel}>Bakiye</div>
                    <div style={{ 
                      ...mobileStyles.balanceValue,
                      color: account.currencyCode !== 'TRY' 
                        ? (account.documentClosingBalance >= 0 ? '#389e0d' : '#cf1322')
                        : (account.localClosingBalance >= 0 ? '#389e0d' : '#cf1322')
                    }}>
                      {account.currencyCode !== 'TRY' 
                        ? formatCurrency(account.documentClosingBalance, account.currencyCode)
                        : formatCurrency(account.localClosingBalance, account.currencyCode)
                      }
                    </div>
                    {account.currencyCode !== 'TRY' && (
                      <div style={mobileStyles.balanceSecondary}>
                        {formatCurrency(account.localClosingBalance, 'TRY')}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
      
      {/* Günlük Kasa Hareketleri */}
      <div style={{ marginBottom: isMobile ? 100 : 150 }}>
        <h3 style={mobileStyles.sectionTitle}>
          <BankOutlined style={{ marginRight: 8 }} /> Günlük Kasa Hareketleri
        </h3>
        
        {transactionsLoading ? (
          <div style={{ textAlign: 'center', padding: 16, background: '#fff', borderRadius: 4 }}>
            <Spin size="small" />
          </div>
        ) : cashTransactions.length === 0 ? (
          <div style={{ padding: 16, background: '#fff', borderRadius: 4, textAlign: 'center', color: '#999' }}>
            0 hareket
          </div>
        ) : (
          <List
            size="small"
            bordered
            style={{ marginBottom: 150 }}
            dataSource={cashTransactions}
            renderItem={item => (
              <List.Item>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Badge color={item.cashTransTypeCode === '1' ? 'green' : item.cashTransTypeCode === '2' ? 'red' : 'blue'} />
                      <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                        {item.cashTransTypeCode === '1' ? 'Tahsilat Yapıldı' : 
                         item.cashTransTypeCode === '2' ? 'Ödeme Yapıldı' : 
                         item.cashTransTypeCode === '3' ? 'Kasalar arasında virman yapıldı' : 
                         item.cashTransTypeDescription || 'İşlem'}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: 13, color: '#1890ff', fontWeight: 'normal' }}>
                        {item.documentTime ? item.documentTime.substring(0, 5) : '00:00'}
                      </span>
                    </div>
                    <div>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: item.loc_Debit > 0 ? 'green' : 'red'
                      }}>
                        {formatCurrency(item.loc_Debit > 0 ? item.loc_Debit : item.loc_Credit, item.loc_CurrencyCode || 'TRY')}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#666', marginTop: 4, marginLeft: 24 }}>
                    {item.description && (
                      <div>{item.description}</div>
                    )}
                    {item.lineDescription && item.lineDescription !== item.description && (
                      <div>{item.lineDescription}</div>
                    )}
                    {item.currAccDescription && (
                      <div>
                        <span style={{ color: '#888' }}>Cari: </span>
                        {item.currAccDescription}
                      </div>
                    )}
                    {item.applicationDescription && (
                      <div>
                        <span style={{ color: '#888' }}>Uygulama: </span>
                        {item.applicationDescription}
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
