import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
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
  ReloadOutlined
} from '@ant-design/icons';
import cashVoucherApi from '../../services/cashVoucherApi';
import { formatCurrency } from '../../utils/formatters';
import './CashTransactionsPage.css'; // Aynı stil dosyasını kullanabiliriz

const { Text, Title } = Typography;
const { Option } = Select;

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

const CashSummaryPage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedCashAccount, setSelectedCashAccount] = useState<string>('ALL');

  // Kasa hesaplarını ve özet bilgileri getir
  const fetchCashSummary = async () => {
    try {
      setLoading(true);
      
      // API parametrelerini hazırla
      const apiParams: any = {
        langCode: 'TR'
      };
      
      // Seçili kasa hesabı filtresini ekle (ALL değilse)
      if (selectedCashAccount !== 'ALL') {
        apiParams.cashAccountCode = selectedCashAccount;
      }
      
      // Kasa özet bilgilerini getir
      const response = await cashVoucherApi.getCashSummary(apiParams);
      
      if (response.success && response.data) {
        setCashAccounts(response.data);
      } else {
        message.error('Kasa özet bilgileri alınamadı: ' + (response.message || 'Bilinmeyen hata'));
        setCashAccounts([]);
      }
    } catch (error) {
      console.error('Kasa özet bilgileri alınamadı:', error);
      message.error('Kasa özet bilgileri alınamadı');
      setCashAccounts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde ve filtreler değiştiğinde verileri getir
  useEffect(() => {
    fetchCashSummary();
  }, []);
  
  // Filtreleri sıfırla
  const handleRefresh = () => {
    setSelectedCashAccount('ALL');
    // Filtreleri sıfırladıktan sonra verileri tekrar getir
    setTimeout(() => {
      fetchCashSummary();
    }, 100);
  };

  return (
    <div style={{ padding: '16px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 16, textAlign: 'center' }}>
          Kasa Özeti
        </Title>

        {/* Filters */}
        <Card style={{ marginBottom: 16, borderRadius: 8 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <div className="cash-transactions-filters">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
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
                          {account.cashAccountDescription} ({account.currencyCode})
                        </Option>
                      ))}
                    </Select>
                  </Col>



                  <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                      <Button 
                        type="primary" 
                        onClick={() => fetchCashSummary()}
                        loading={loading}
                      >
                        Yenile
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

        {/* Kasa Özet İçeriği */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Kasa hesapları yükleniyor...</Text>
            </div>
          </div>
        ) : cashAccounts.length === 0 ? (
          <Empty description="Kasa hesabı bulunamadı" style={{ padding: 40 }} />
        ) : (
          <div>
            {cashAccounts.map((account) => (
              <Card 
                key={account.cashAccountCode} 
                style={{ marginBottom: 16, borderRadius: 8 }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{account.cashAccountDescription}</span>
                    <Tag color="blue">{account.currencyCode}</Tag>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>Açılış Bakiyesi:</Text>
                    <div>
                      {account.currencyCode !== 'TRY' ? (
                        <>
                          {formatCurrency(account.documentOpeningBalance, account.currencyCode)}
                          <span style={{ marginLeft: 5, fontSize: '0.9em', color: '#666' }}>
                            ({formatCurrency(account.localOpeningBalance, 'TRY')})
                          </span>
                        </>
                      ) : (
                        formatCurrency(account.localOpeningBalance, account.currencyCode)
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Kapanış Bakiyesi:</Text>
                    <div style={{ fontWeight: 'bold' }}>
                      {account.currencyCode !== 'TRY' ? (
                        <>
                          <span style={{ color: account.documentClosingBalance >= 0 ? 'green' : 'red' }}>
                            {formatCurrency(account.documentClosingBalance, account.currencyCode)}
                          </span>
                          <span style={{ marginLeft: 5, fontSize: '0.9em', color: account.localClosingBalance >= 0 ? '#007700' : '#cc0000' }}>
                            ({formatCurrency(account.localClosingBalance, 'TRY')})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: account.localClosingBalance >= 0 ? 'green' : 'red' }}>
                          {formatCurrency(account.localClosingBalance, account.currencyCode)}
                        </span>
                      )}
                    </div>
                  </Col>
                </Row>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>Toplam Tahsilat:</Text>
                    <div>
                      {account.currencyCode !== 'TRY' ? (
                        <>
                          <span style={{ color: 'green' }}>{formatCurrency(account.documentTotalDebit, account.currencyCode)}</span>
                          <span style={{ marginLeft: 5, fontSize: '0.9em', color: '#007700' }}>
                            ({formatCurrency(account.totalReceipt, 'TRY')})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'green' }}>{formatCurrency(account.totalReceipt, account.currencyCode)}</span>
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Toplam Ödeme:</Text>
                    <div>
                      {account.currencyCode !== 'TRY' ? (
                        <>
                          <span style={{ color: 'red' }}>{formatCurrency(account.documentTotalCredit, account.currencyCode)}</span>
                          <span style={{ marginLeft: 5, fontSize: '0.9em', color: '#cc0000' }}>
                            ({formatCurrency(account.totalPayment, 'TRY')})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'red' }}>{formatCurrency(account.totalPayment, account.currencyCode)}</span>
                      )}
                    </div>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Text strong>Gelen Transfer:</Text>
                    <div>
                      {account.currencyCode !== 'TRY' ? (
                        <>
                          <span style={{ color: 'blue' }}>{formatCurrency(account.totalTransferIn, account.currencyCode)}</span>
                          <span style={{ marginLeft: 5, fontSize: '0.9em', color: '#0055aa' }}>
                            ({formatCurrency(account.totalTransferIn, 'TRY')})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'blue' }}>{formatCurrency(account.totalTransferIn, account.currencyCode)}</span>
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Giden Transfer:</Text>
                    <div>
                      {account.currencyCode !== 'TRY' ? (
                        <>
                          <span style={{ color: 'orange' }}>{formatCurrency(account.totalTransferOut, account.currencyCode)}</span>
                          <span style={{ marginLeft: 5, fontSize: '0.9em', color: '#cc7700' }}>
                            ({formatCurrency(account.totalTransferOut, 'TRY')})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'orange' }}>{formatCurrency(account.totalTransferOut, account.currencyCode)}</span>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashSummaryPage;
