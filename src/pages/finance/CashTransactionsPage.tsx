import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Typography, Spin, message, DatePicker, Button, Select, Space, Statistic } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { CashTransaction, CashSummary, fetchCashTransactions, fetchCashSummary } from '../../services/cashTransactionService';
import { CashAccount, fetchCashAccounts } from '../../services/cashAccountService';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/tr_TR';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CashTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [summaries, setSummaries] = useState<CashSummary[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  
  // Filtreler
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs('2023-01-01'), // 2023 yılı başı (test için)
    dayjs('2023-12-31') // 2023 yılı sonu (test için)
  ]);
  const [selectedCashAccount, setSelectedCashAccount] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadCashAccounts();
    loadData();
  }, []);

  const loadCashAccounts = async () => {
    try {
      const accounts = await fetchCashAccounts();
      setCashAccounts(accounts);
    } catch (error) {
      message.error('Kasa hesapları yüklenirken bir hata oluştu.');
      console.error('Error loading cash accounts:', error);
    }
  };

  const loadData = async () => {
    await Promise.all([
      loadTransactions(),
      loadSummaries()
    ]);
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const data = await fetchCashTransactions(startDate, endDate, selectedCashAccount);
      setTransactions(data);
    } catch (error: any) {
      let errorMessage = 'Kasa hareketleri yüklenirken bir hata oluştu.';
      
      // Daha detaylı hata mesajları
      if (error?.response?.status === 500) {
        errorMessage = 'Sunucu hatası: Kasa hareketleri getirilemiyor. Lütfen sistem yöneticinizle iletişime geçin.';
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = 'Yetkilendirme hatası: Bu verileri görüntüleme yetkiniz bulunmamaktadır.';
      } else if (error?.message?.includes('Network Error')) {
        errorMessage = 'Ağ hatası: Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      }
      
      message.error(errorMessage);
      console.error('Error loading cash transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummaries = async () => {
    try {
      setSummaryLoading(true);
      const data = await fetchCashSummary();
      setSummaries(data);
    } catch (error: any) {
      let errorMessage = 'Kasa özet bilgileri yüklenirken bir hata oluştu.';
      
      // Daha detaylı hata mesajları
      if (error?.response?.status === 500) {
        errorMessage = 'Sunucu hatası: Kasa özet bilgileri getirilemiyor. Lütfen sistem yöneticinizle iletişime geçin.';
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = 'Yetkilendirme hatası: Bu verileri görüntüleme yetkiniz bulunmamaktadır.';
      } else if (error?.message?.includes('Network Error')) {
        errorMessage = 'Ağ hatası: Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      }
      
      message.error(errorMessage);
      console.error('Error loading cash summaries:', error);
      setSummaries([]);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSearch = () => {
    loadTransactions();
  };

  const handleReset = () => {
    setDateRange([dayjs('2025-01-01'), dayjs('2025-12-31')]);
    setSelectedCashAccount(undefined);
    loadData();
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currencyCode || 'TRY',
      minimumFractionDigits: 2
    }).format(value);
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'documentDate',
      key: 'documentDate',
      render: (text: string) => dayjs(text).format('DD.MM.YYYY'),
      sorter: (a: CashTransaction, b: CashTransaction) => dayjs(a.documentDate).unix() - dayjs(b.documentDate).unix(),
    },
    {
      title: 'Belge No',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
    },
    {
      title: 'İşlem Tipi',
      dataIndex: 'cashTransTypeDescription',
      key: 'cashTransTypeDescription',
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Cari Hesap',
      dataIndex: 'currAccDescription',
      key: 'currAccDescription',
      render: (text: string, record: CashTransaction) => (
        <span>{record.currAccCode} - {text}</span>
      ),
    },
    {
      title: 'Borç',
      dataIndex: 'loc_Debit',
      key: 'loc_Debit',
      align: 'right' as 'right',
      render: (value: number, record: CashTransaction) => formatCurrency(value, record.loc_CurrencyCode),
      sorter: (a: CashTransaction, b: CashTransaction) => a.loc_Debit - b.loc_Debit,
    },
    {
      title: 'Alacak',
      dataIndex: 'loc_Credit',
      key: 'loc_Credit',
      align: 'right' as 'right',
      render: (value: number, record: CashTransaction) => formatCurrency(value, record.loc_CurrencyCode),
      sorter: (a: CashTransaction, b: CashTransaction) => a.loc_Credit - b.loc_Credit,
    },
    {
      title: 'Bakiye',
      dataIndex: 'loc_Balance',
      key: 'loc_Balance',
      align: 'right' as 'right',
      render: (value: number, record: CashTransaction) => (
        <span style={{ color: value < 0 ? '#cf1322' : undefined }}>
          {formatCurrency(value, record.loc_CurrencyCode)}
        </span>
      ),
      sorter: (a: CashTransaction, b: CashTransaction) => a.loc_Balance - b.loc_Balance,
    },
  ];

  const getSummaryForCashAccount = (code: string | undefined) => {
    if (!code) return null;
    return summaries.find(s => s.cashAccountCode === code);
  };

  const selectedSummary = getSummaryForCashAccount(selectedCashAccount);

  return (
    <div className="cash-transactions-page">
      <div style={{ marginBottom: '16px' }}>
        <Title level={2}>Nakit Kasa Hareketleri</Title>
        <Text type="secondary">Kasa işlemleri ve bakiye bilgileri</Text>
      </div>

      {/* Filtreler */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={8} lg={8}>
            <div style={{ marginBottom: '8px' }}>Tarih Aralığı</div>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD.MM.YYYY"
              locale={locale}
              allowClear={false}
            />
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            <div style={{ marginBottom: '8px' }}>Kasa Hesabı</div>
            <Select
              style={{ width: '100%' }}
              placeholder="Tüm Kasalar"
              value={selectedCashAccount}
              onChange={(value) => setSelectedCashAccount(value)}
              allowClear
            >
              {cashAccounts.map(account => (
                <Option key={account.cashAccountCode} value={account.cashAccountCode}>
                  {account.cashAccountCode} - {account.cashAccountDescription} ({account.currencyCode})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
              >
                Ara
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                Sıfırla
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Özet Bilgiler */}
      {selectedCashAccount && (
        <Card style={{ marginBottom: '16px' }}>
          <Spin spinning={summaryLoading}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Toplam Borç"
                  value={selectedSummary?.totalDebit || 0}
                  precision={2}
                  formatter={(value) => formatCurrency(value as number, selectedSummary?.currencyCode || 'TRY')}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Toplam Alacak"
                  value={selectedSummary?.totalCredit || 0}
                  precision={2}
                  formatter={(value) => formatCurrency(value as number, selectedSummary?.currencyCode || 'TRY')}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Bakiye"
                  value={selectedSummary?.balance || 0}
                  precision={2}
                  valueStyle={{ color: (selectedSummary?.balance || 0) >= 0 ? '#3f8600' : '#cf1322' }}
                  formatter={(value) => formatCurrency(value as number, selectedSummary?.currencyCode || 'TRY')}
                />
              </Col>
            </Row>
          </Spin>
        </Card>
      )}

      {/* İşlem Listesi */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : transactions.length > 0 ? (
              <Table
                dataSource={transactions}
                columns={columns}
                rowKey={(record) => `${record.documentNumber}-${record.cashTransNumber}`}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total) => `Toplam ${total} kayıt`,
                }}
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>Seçilen tarih aralığında kasa hareketi bulunamadı.</p>
                <p>Lütfen farklı bir tarih aralığı seçin veya filtreleri değiştirin.</p>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CashTransactionsPage;
