import React, { useState, useEffect, useCallback } from 'react';
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
  Col
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
  const [displayedTransactions, setDisplayedTransactions] = useState<CashTransaction[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedCashAccount, setSelectedCashAccount] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 10;

  // Fetch cash accounts and transactions on component mount
  useEffect(() => {
    fetchCashBalances();
  }, []); // Component mount olduğunda sadece bir kere çağrılıyor

  // Apply search and account filters when transactions or filters change
  useEffect(() => {
    applyFilters();
  }, [transactions, searchText, selectedCashAccount]);

  // Fetch cash balances and transactions from API
  const fetchCashBalances = async () => {
    setLoading(true);
    try {
      // Tarih aralığını doğru formatta gönder
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      console.log('Tarih aralığı:', { startDate, endDate });
      
      // Tarih aralığına göre kasa bakiyelerini ve işlemleri getir
      const response = await cashVoucherApi.getCashBalances({
        startDate,
        endDate,
        langCode: 'TR'
      });
      
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
            const accountTransactions = account.transactions.map((t: CashTransaction) => ({
              ...t,
              cashAccountCode: account.cashAccountCode
            }));
            allTransactions = [...allTransactions, ...accountTransactions];
          }
        });
        
        // Sort transactions by date (most recent first)
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
      } else {
        message.error('Kasa işlemleri yüklenemedi');
        setTransactions([]);
        setCashAccounts([]);
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

  // Apply filters to transactions
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Apply cash account filter
    if (selectedCashAccount !== 'ALL') {
      filtered = filtered.filter(
        (t) => t.cashAccountCode === selectedCashAccount
      );
    }
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description?.toLowerCase().includes(searchLower) ||
          t.documentNumber?.toLowerCase().includes(searchLower) ||
          t.currAccDescription?.toLowerCase().includes(searchLower) ||
          t.cashTransNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const start = 0;
    const end = currentPage * itemsPerPage;
    const paginatedTransactions = filtered.slice(start, end);
    
    setDisplayedTransactions(paginatedTransactions);
    setHasMore(end < filtered.length);
  };

  // Load more transactions on scroll
  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    setCurrentPage((prev) => prev + 1);
    
    // Simulate loading delay
    setTimeout(() => {
      applyFilters();
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
    // Filtreleri sıfırla
    setSearchText('');
    setSelectedCashAccount('ALL');
    // Son 30 günü varsayılan olarak ayarla
    setDateRange([
      dayjs().subtract(30, 'day'),
      dayjs()
    ]);
    // Verileri yenile
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
    if (amount === 0 && (transaction.documentNumber || transaction.cashTransNumber)) {
      console.log('Sıfır tutarlı işlem:', {
        fiş: transaction.documentNumber || transaction.cashTransNumber,
        tip: isIncoming ? 'Tahsilat' : 'Tediye',
        doc_Debit: transaction.doc_Debit,
        doc_Credit: transaction.doc_Credit,
        loc_Debit: transaction.loc_Debit,
        loc_Credit: transaction.loc_Credit,
        doc_Balance: transaction.doc_Balance,
        loc_Balance: transaction.loc_Balance,
        currencyCode: transaction.doc_CurrencyCode
      });
    }
    
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
        bodyStyle={{ padding: 12 }}
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
          
          <Text 
            strong 
            style={{ 
              fontSize: 16, 
              color: isIncoming ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold'
            }}
          >
            {isIncoming ? '+' : '-'}{formatCurrency(amount, currencyCode)}
          </Text>
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
                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Kasa Hesabı Seçin"
                      onChange={(value) => setSelectedCashAccount(value)}
                      value={selectedCashAccount}
                    >
                      <Option value="ALL">Tüm Kasa Hesapları</Option>
                      {cashAccounts.map((account) => (
                        <Option key={account.cashAccountCode} value={account.cashAccountCode}>
                          {account.cashAccountName} ({account.cashAccountCode}) - {account.currencyCode}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  {/* Date Range Filter */}
                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Tarih Aralığı
                    </Text>
                    <RangePicker
                      style={{ width: '100%' }}
                      value={dateRange}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setDateRange([dates[0], dates[1]]);
                          // Tarih değiştiğinde yeni verileri getir
                          setTimeout(() => fetchCashBalances(), 100);
                        }
                      }}
                      format="DD.MM.YYYY"
                    />
                  </Col>

                  {/* Search Filter */}
                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Arama
                    </Text>
                    <Input
                      placeholder="Açıklama, fiş numarası veya hesap adında ara..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>

                  <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />} 
                      onClick={handleRefresh}
                      loading={loading}
                    >
                      Yenile
                    </Button>
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

        {!loading && displayedTransactions.length === 0 && (
          <Empty
            description="Seçilen kriterlere uygun işlem bulunamadı"
            style={{ padding: 40 }}
          />
        )}

        {!loading && displayedTransactions.length > 0 && (
          <>
            {displayedTransactions.slice(0, currentPage * itemsPerPage).map((transaction, index) =>
              renderTransactionCard(transaction, index)
            )}

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
            {!hasMore && !loadingMore && displayedTransactions.length > itemsPerPage && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">Tüm işlemler yüklendi</Text>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CashTransactionsPage;
