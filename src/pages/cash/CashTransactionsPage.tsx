import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Spin,
  message,
  Empty,
  Row,
  Col,
  Divider
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { cashApi } from '../../services/api';
import cashVoucherApi from '../../services/cashVoucherApi';
import { formatCurrency } from '../../utils/formatters';
import './CashTransactionsPage.css';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { Option } = Select;

interface CashAccount {
  cashAccountCode: string;
  cashAccountName: string;
  currencyCode: string;
  openingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  totalIncomingTransfers: number;
  totalOutgoingTransfers: number;
  closingBalance: number;
  transactions: CashTransaction[];
}

interface CashTransaction {
  // Backend modelinden gelen alanlar (CashTransactionSummary)
  documentDate: string;
  documentNumber: string;
  cashTransTypeCode: string;
  cashTransTypeDescription: string;
  cashTransNumber: string;
  currAccCode?: string;
  currAccDescription?: string;
  description: string;
  loc_CurrencyCode: string;
  loc_Debit: number;
  loc_Credit: number;
  loc_Balance: number;
  doc_CurrencyCode: string;
  doc_Debit: number;
  doc_Credit: number;
  doc_Balance: number;
  sourceCashAccountCode?: string;
  targetCashAccountCode?: string;
  
  // SQL sorgusundan gelen ek alanlar
  currAccTypeCode?: string;
  currAccTypeDescription?: string;
  lineDescription?: string;
  refNumber?: string;
  glTypeCode?: string;
  sumDescription?: string;
  applicationCode?: string;
  applicationDescription?: string;
  glAccCode?: string;
  glAccDescription?: string;
  chequeTransTypeDescription?: string;
  loc_ExchangeRate?: string;
  isTurnover?: boolean;
  isPostingJournal?: boolean;
  journalDate?: string;
  journalNumber?: string;
  importFileNumber?: string;
  exportFileNumber?: string;
  lastUpdatedUserName?: string;
  lastUpdatedDate?: string;
  linkedApplicationCode?: string;
  linkedApplicationID?: string;
  
  // Frontend'de eklenen alan
  cashAccountCode?: string;
}

// Tarih formatı yardımcı fonksiyonu
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  try {
    // Farklı tarih formatlarını kontrol et
    let date;
    
    // ISO formatı (2025-07-06T00:00:00)
    if (dateString.includes('T')) {
      date = dayjs(dateString);
    }
    // SQL Server formatı (2025-07-06 00:00:00.000)
    else if (dateString.includes('-')) {
      date = dayjs(dateString);
    }
    // Diğer format (örn: 20250706)
    else if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      date = dayjs(`${year}-${month}-${day}`);
    }
    // Varsayılan olarak doğrudan parse et
    else {
      date = dayjs(dateString);
    }
    
    // Geçerli bir tarih mi kontrol et
    if (date.isValid()) {
      return date.locale('tr').format('DD.MM.YYYY');
    } else {
      console.warn('Geçersiz tarih formatı:', dateString);
      return dateString;
    }
  } catch (error) {
    console.error('Tarih dönüştürme hatası:', error);
    return dateString;
  }
};

const CashTransactionsPage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedCashAccount, setSelectedCashAccount] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedVoucherType, setSelectedVoucherType] = useState<number>(0); // 0 = Tüm Fişler
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;
  
  // Sonsuz kaydırma için gözlemci referansı
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Daha fazla işlem yükleme fonksiyonu
  const loadMoreTransactions = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      
      // API parametrelerini hazırla
      const apiParams: any = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        page: nextPage,
        pageSize: pageSize,
        langCode: 'TR'
      };
      
      // Fiş tipi filtresini ekle (0 değilse - 0 = Tüm Fişler)
      if (selectedVoucherType !== 0) {
        apiParams.cashTransTypeCode = selectedVoucherType;
      }
      
      // Seçili kasa hesabı filtresini ekle (ALL değilse)
      if (selectedCashAccount !== 'ALL') {
        apiParams.cashAccountCode = selectedCashAccount;
      }
      
      // Arama metni filtrelerini ekle

      
      if (searchText) {
        apiParams.searchText = searchText;
      }
      
      const response = await cashVoucherApi.getCashBalances(apiParams);
      
      if (response.success && response.data) {
        // Tüm işlemleri birleştir
        let newTransactions: CashTransaction[] = [];
        response.data.forEach((account: CashAccount) => {
          if (account.transactions && account.transactions.length > 0) {
            // Her işleme kasa hesap kodunu ekle
            const accountTransactions = account.transactions.map(t => ({
              ...t,
              cashAccountCode: account.cashAccountCode
            }));
            newTransactions = [...newTransactions, ...accountTransactions];
          }
        });
        
        // Mevcut işlemlerle yeni işlemleri birleştir
        setTransactions(prevTransactions => [...prevTransactions, ...newTransactions]);
        setCurrentPage(nextPage);
        setHasMore(nextPage < response.totalPages);
        setTotalCount(response.totalCount);
        setTotalPages(response.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Daha fazla işlem yüklenirken hata oluştu:', error);
      message.error('Daha fazla işlem yüklenirken bir hata oluştu');
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, dateRange, selectedVoucherType, selectedCashAccount, searchText, hasMore, loadingMore]);
  
  const lastTransactionElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreTransactions();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMoreTransactions]);

  // Fiş tipleri - CashTransTypeCode değerlerine göre (1=Tahsilat, 2=Tediye, 3=Virman)
  const voucherTypes = [
    { value: 0, label: 'Tüm Fişler' },
    { value: 1, label: 'Tahsilat Fişleri' },
    { value: 2, label: 'Tediye Fişleri' },
    { value: 3, label: 'Virman Fişleri' },
  ];

  // Fetch cash accounts and transactions on component mount
  useEffect(() => {
    fetchCashBalances();
  }, []); // Component mount olduğunda sadece bir kere çağrılıyor

  // Fetch cash balances and transactions from API
  const fetchCashBalances = async () => {
    setLoading(true);
    setTransactions([]);
    setCurrentPage(1);
    setHasMore(true);
    
    try {
      // Tarih aralığını kontrol et ve doğru formatta gönder
      if (!dateRange || !dateRange[0] || !dateRange[1]) {
        // Eğer tarih aralığı yoksa, son 30 günü kullan
        const endDate = dayjs();
        const startDate = dayjs().subtract(30, 'day');
        setDateRange([startDate, endDate]);
        
        console.log('Varsayılan tarih aralığı kullanılıyor:', { 
          startDate: startDate.format('YYYY-MM-DD'), 
          endDate: endDate.format('YYYY-MM-DD') 
        });
        
        var apiStartDate = startDate.format('YYYY-MM-DD');
        var apiEndDate = endDate.format('YYYY-MM-DD');
      } else {
        // Tarih aralığını doğru formatta gönder
        var apiStartDate = dateRange[0].format('YYYY-MM-DD');
        var apiEndDate = dateRange[1].format('YYYY-MM-DD');
        
        console.log('Seçilen tarih aralığı:', { apiStartDate, apiEndDate });
      }
      
      // API parametrelerini hazırla
      const apiParams: any = {
        startDate: apiStartDate,
        endDate: apiEndDate,
        page: 1,
        pageSize: pageSize,
        langCode: 'TR'
      };
      
      // Fiş tipi filtresini ekle (0 değilse - 0 = Tüm Fişler)
      if (selectedVoucherType !== 0) {
        apiParams.cashTransTypeCode = selectedVoucherType;
      }
      
      // Seçili kasa hesabı filtresini ekle (ALL değilse)
      if (selectedCashAccount !== 'ALL') {
        apiParams.cashAccountCode = selectedCashAccount;
      }
      
      // Arama metni filtrelerini ekle

      
      if (searchText) {
        apiParams.searchText = searchText;
      }
      
      console.log('API parametreleri:', apiParams);
      
      // Tarih aralığına göre kasa bakiyelerini ve işlemleri getir
      const response = await cashVoucherApi.getCashBalances(apiParams);
      
      // API yanıtını kontrol et
      console.log('API yanıtı:', response);
      
      // Örnek bir işlem kaydını detaylı incele (varsa)
      if (response.success && response.data && response.data.length > 0) {
        const firstAccount = response.data[0];
        if (firstAccount.transactions && firstAccount.transactions.length > 0) {
          console.log('Örnek işlem kaydı:', firstAccount.transactions[0]);
        }
      }
      
      if (response.success && response.data) {
        // Kasa hesaplarını ayıkla
        const accounts = response.data || [];
        setCashAccounts(accounts);
        
        // Tüm işlemleri birleştir
        let allTransactions: CashTransaction[] = [];
        accounts.forEach((account: CashAccount) => {
          if (account.transactions && account.transactions.length > 0) {
            // Her işleme kasa hesap kodunu ekle
            const accountTransactions = account.transactions.map(t => ({
              ...t,
              cashAccountCode: account.cashAccountCode
            }));
            allTransactions = [...allTransactions, ...accountTransactions];
          }
        });
        
        // Tekrarlanan kayıtları sessizce filtreleme
        const uniqueTransactions: CashTransaction[] = [];
        const seenKeys = new Set<string>();
        
        allTransactions.forEach(transaction => {
          // Benzersiz anahtar oluştur (fiş no + tarih + tutar)
          const uniqueKey = `${transaction.documentNumber || transaction.cashTransNumber || ''}|${transaction.documentDate || ''}|${transaction.loc_Debit || 0}|${transaction.loc_Credit || 0}`;
          
          if (!seenKeys.has(uniqueKey)) {
            seenKeys.add(uniqueKey);
            uniqueTransactions.push(transaction);
          }
          // Tekrarlanan kayıtlar sessizce atlanıyor
        });
        
        // Tekrarsız kayıtları kullan
        allTransactions = uniqueTransactions;
        
        // İşlemleri tarihe göre sırala (en yeni en üstte)
        const sortedTransactions = allTransactions.sort((a, b) => {
          try {
            const dateA = dayjs(a.documentDate);
            const dateB = dayjs(b.documentDate);
            
            if (dateA.isValid() && dateB.isValid()) {
              return dateB.valueOf() - dateA.valueOf();
            }
            
            // Tarihlerden biri geçersizse, string olarak karşılaştır
            return String(b.documentDate).localeCompare(String(a.documentDate));
          } catch (error) {
            console.error('Tarih sıralama hatası:', error);
            return 0;
          }
        });
        
        setTransactions(sortedTransactions);
        setCurrentPage(1);
        setTotalCount(response.totalCount || sortedTransactions.length);
        setTotalPages(response.totalPages || Math.ceil(sortedTransactions.length / pageSize));
        setHasMore((response.totalPages || 1) > 1);
      } else {
        message.error('Kasa işlemleri yüklenemedi');
        setTransactions([]);
        setCashAccounts([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasMore(false);
      }
    } catch (error) {
      message.error('Kasa işlemleri yüklenirken hata oluştu');
      console.error('Error fetching cash balances:', error);
      setTransactions([]);
      setCashAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Arama filtresini uygulama
  const handleSearch = () => {
    fetchCashBalances();
  };
  


  // Load more transactions on scroll
  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    setCurrentPage((prev) => prev + 1);
    
    // Simulate loading delay
    setTimeout(() => {
      setLoadingMore(false);
    }, 500);
  };

  // Handle scroll event for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMore();
    }
  }, [hasMore, loadingMore]);

  // Handle refresh button click
  const handleRefresh = () => {
    // Tüm filtreleri sıfırla
    setSearchText('');
    setSelectedCashAccount('ALL');
    setSelectedVoucherType(0); // 0 = Tüm Fişler
    
    // Son 30 gün için tarih aralığını ayarla
    const endDate = dayjs();
    const startDate = dayjs().subtract(30, 'day');
    setDateRange([startDate, endDate]);
    
    // Verileri yenile
    fetchCashBalances();
  };

  // Date Range Filter
  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs]) => {
    if (dates && dates[0] && dates[1]) {
      // Önce tarih aralığını güncelle
      setDateRange([dates[0], dates[1]]);
      // Hemen yeni verileri getir
      fetchCashBalances();
    }
    setTimeout(() => fetchCashBalances(), 100);
  };

  // Render individual transaction card
  const renderTransactionCard = (transaction: CashTransaction, index: number) => {
    // SQL sorgusuna göre CashTransTypeCode değerlerine bakarak Tahsilat ve Tediye işlemlerini belirle
    // CashTransTypeCode 1 ise Tahsilat (Giriş), 2 ise Tediye (Çıkış)
    const isIncoming = transaction.cashTransTypeCode === '1' || 
                      transaction.cashTransTypeDescription?.toUpperCase().includes('TAHSILAT') || 
                      (!transaction.cashTransTypeCode && transaction.doc_Debit > 0);
    
    // Tutar hesaplama - daha kapsamlı kontrol
    let amount = 0;
    
    // Önce işlem tipine göre borç/alacak alanını belirle
    if (isIncoming) {
      // Tahsilat (giriş) işlemi
      if (transaction.doc_CurrencyCode === 'TRY') {
        // TRY için öncelikle loc_Debit kullan
        amount = transaction.loc_Debit || 0;
        // Eğer sıfırsa, diğer alanları kontrol et
        if (amount === 0) {
          amount = transaction.doc_Debit || transaction.loc_Debit || 0;
        }
      } else {
        // Döviz için doc_Debit
        amount = transaction.doc_Debit || 0;
        // Eğer sıfırsa, diğer alanları kontrol et
        if (amount === 0) {
          amount = transaction.loc_Debit || 0;
        }
      }
    } else {
      // Tediye (çıkış) işlemi
      if (transaction.doc_CurrencyCode === 'TRY') {
        // TRY için öncelikle loc_Credit kullan
        amount = transaction.loc_Credit || 0;
        // Eğer sıfırsa, diğer alanları kontrol et
        if (amount === 0) {
          amount = transaction.doc_Credit || transaction.loc_Credit || 0;
        }
      } else {
        // Döviz için doc_Credit
        amount = transaction.doc_Credit || 0;
        // Eğer sıfırsa, diğer alanları kontrol et
        if (amount === 0) {
          amount = transaction.loc_Credit || 0;
        }
      }
    }
    
    // Hala sıfırsa, bakiye değerlerini kontrol et
    if (amount === 0) {
      if (isIncoming) {
        amount = Math.abs(transaction.doc_Balance || transaction.loc_Balance || 0);
      } else {
        amount = Math.abs(transaction.doc_Balance || transaction.loc_Balance || 0);
      }
    }
    
    // Debug - tutar hesaplamasını konsola yazdır
    // if (amount === 0 && (transaction.documentNumber || transaction.cashTransNumber)) {
    //   console.log('Sıfır tutarlı işlem:', {
    //     fiş: transaction.documentNumber || transaction.cashTransNumber,
    //     tip: isIncoming ? 'Tahsilat' : 'Tediye',
    //     doc_Debit: transaction.doc_Debit,
    //     doc_Credit: transaction.doc_Credit,
    //     loc_Debit: transaction.loc_Debit,
    //     loc_Credit: transaction.loc_Credit,
    //     doc_Balance: transaction.doc_Balance,
    //     loc_Balance: transaction.loc_Balance,
    //     currencyCode: transaction.doc_CurrencyCode
    //   });
    // }
    
    // TRY yerine TL kullan
    const currencyCode = transaction.doc_CurrencyCode === 'TRY' ? 'TL' : transaction.doc_CurrencyCode || 'TL';
    
    // Fiş numarası için öncelik sırası: documentNumber > cashTransNumber
    const documentNo = transaction.documentNumber || transaction.cashTransNumber || 'N/A';

    return (
      <Card
        key={`${transaction.cashTransNumber || index}`}
        className={`transaction-card fade-in-up`}
        style={{
          marginBottom: 12,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          animationDelay: `${index * 0.1}s`
        }}
        styles={{ body: { padding: 12 } }}
      >
        {/* Üst satır: Fiş tipi (sol), Fiş no (orta), Tarih (sağ) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Tag color={isIncoming ? 'green' : 'red'} style={{ margin: 0, fontWeight: 'bold' }}>
            {isIncoming ? 'TAHSILAT' : 'TEDIYE'}
          </Tag>
          
          <Text strong style={{ fontSize: 15, color: '#1890ff', textAlign: 'center', flex: 1 }}>
            {documentNo}
          </Text>
          
          <Text type="secondary" style={{ fontSize: 13, textAlign: 'right' }}>
            {formatDate(transaction.documentDate)}
          </Text>
        </div>
        
        {/* Cari hesap ve tutar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, flex: 1 }}>
            {transaction.currAccDescription || ''}
          </Text>
          
          <div style={{ textAlign: 'right' }}>
            <Text 
              strong 
              style={{ 
                fontSize: 16, 
                color: isIncoming ? '#52c41a' : '#ff4d4f',
                fontWeight: 'bold',
                display: 'block'
              }}
            >
              {isIncoming ? '+' : '-'}{formatCurrency(amount, currencyCode)}
            </Text>
            {transaction.applicationDescription && (
              <Text style={{ fontSize: 10, color: '#888', display: 'block' }}>
                {transaction.applicationDescription}
              </Text>
            )}
          </div>
        </div>
        
        {/* Açıklama - italik ve %30 daha küçük font */}
        {(transaction.lineDescription || transaction.sumDescription || transaction.description) && (
          <Text style={{ 
            fontSize: 10, // %30 daha küçük font (13 * 0.7 ≈ 10)
            color: '#666', 
            display: 'block',
            fontStyle: 'italic',
            marginTop: 4,
            lineHeight: '1.3'
          }}>
            {transaction.lineDescription || transaction.sumDescription || transaction.description}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: '16px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 16, textAlign: 'center' }}>
          Kasa İşlemleri
        </Title>

        {/* Filters */}
        <Card style={{ marginBottom: 16, borderRadius: 8 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <div className="cash-transactions-filters">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Kasa Hesabı
                    </Text>
                    <Select
                      style={{ width: '100%' }}
                      value={selectedCashAccount}
                      onChange={(value) => setSelectedCashAccount(value)}
                    >
                      <Option value="ALL">Tüm Hesaplar</Option>
                      {cashAccounts.map((account) => (
                        <Option key={account.cashAccountCode} value={account.cashAccountCode}>
                          {account.cashAccountName} ({account.currencyCode})
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Fiş Tipi
                    </Text>
                    <Select
                      style={{ width: '100%' }}
                      value={selectedVoucherType}
                      onChange={(value) => setSelectedVoucherType(value)}
                    >
                      {voucherTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Tarih Aralığı
                    </Text>
                    <RangePicker
                      style={{ width: '100%' }}
                      value={dateRange}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          // Sadece tarih aralığını güncelle, otomatik filtreleme yapma
                          setDateRange([dates[0], dates[1]]);
                        }
                      }}
                      format="DD.MM.YYYY"
                    />
                  </Col>

                  {/* Tek Arama Alanı */}
                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Arama
                    </Text>
                    <Input
                      placeholder="Açıklama, fiş numarası, cari hesap kodu veya satır açıklamasında ara..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>

                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                      <Button 
                        type="primary" 
                        icon={<SearchOutlined />} 
                        onClick={() => fetchCashBalances()}
                        loading={loading}
                      >
                        Filtrele
                      </Button>
                      
                      <Button 
                        icon={<ReloadOutlined />} 
                        onClick={handleRefresh}
                      >
                        Sıfırla
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Space>
            </div>
          </Space>
        </Card>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>İşlemler yükleniyor...</Text>
            </div>
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <Empty
            description="Seçilen kriterlere uygun işlem bulunamadı"
            style={{ padding: 40 }}
          />
        )}

        {!loading && transactions.length > 0 && (
          <>
            {transactions.map((transaction: CashTransaction, index: number) => {
              // Son elemana geldiğimizde referans ekle
              if (index === transactions.length - 1) {
                return (
                  <div key={`${transaction.documentNumber}-${index}`} ref={lastTransactionElementRef}>
                    {renderTransactionCard(transaction, index)}
                  </div>
                );
              } else {
                return (
                  <div key={`${transaction.documentNumber}-${index}`}>
                    {renderTransactionCard(transaction, index)}
                  </div>
                );
              }
            })}

            {/* Load More Indicator */}
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Daha fazla yükleniyor...</Text>
                </div>
              </div>
            )}

            {/* All Loaded Message */}
            {!hasMore && !loadingMore && transactions.length > pageSize && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">Tüm işlemler yüklendi</Text>
              </div>
            )}
            
            {/* Toplam kayıt sayısı */}
            <div style={{ textAlign: 'center', padding: 10, marginTop: 10 }}>
              <Text type="secondary">
                Toplam {totalCount} kayıttan {transactions.length} tanesi görüntüleniyor
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CashTransactionsPage;
