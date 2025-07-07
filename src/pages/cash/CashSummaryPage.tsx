import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Typography,
  Spin,
  message,
  Empty,
  Row,
  Col,
  Divider,
  Badge,
  Avatar
} from 'antd';
import {
  ReloadOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined
} from '@ant-design/icons';
import cashVoucherApi from '../../services/cashVoucherApi';
import { formatCurrency } from '../../utils/formatters';
import './CashTransactionsPage.css';

const { Text, Title } = Typography;

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

  // Kasa hesaplarını ve özet bilgileri getir
  const fetchCashSummary = async () => {
    try {
      setLoading(true);
      
      // API parametrelerini hazırla
      // Kasa özet bilgilerini getir
      const response = await cashVoucherApi.getCashSummary();

      if (response.data && response.success) {
        setCashAccounts(response.data);
      } else {
        message.error('Kasa özet bilgileri alınamadı: ' + response.message);
      }
    } catch (error) {
      console.error('Kasa özet bilgileri alınamadı:', error);
      message.error('Kasa özet bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde veri getir
  useEffect(() => {
    fetchCashSummary();
  }, []);

  // Para birimi için renk belirle
  const getCurrencyColor = (currencyCode: string) => {
    switch(currencyCode) {
      case 'USD': return '#2b908f';
      case 'EUR': return '#3366cc';
      case 'TRY': return '#e15f41';
      default: return '#718093';
    }
  };

  return (
    <div className="cash-transactions-container" style={{ background: '#f5f6fa', minHeight: '100vh', padding: '20px' }}>
      <div className="cash-transactions-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            <WalletOutlined style={{ marginRight: 12 }} /> Kasa Özeti
          </Title>
          
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={fetchCashSummary}
            loading={loading}
          >
            Yenile
          </Button>
        </div>

        {/* Kasa Özet İçeriği */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Kasa hesapları yükleniyor...</Text>
            </div>
          </div>
        ) : cashAccounts.length === 0 ? (
          <Empty description="Kasa hesabı bulunamadı" style={{ padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
        ) : (
          <Row gutter={[16, 16]}>
            {cashAccounts.map((account) => (
              <Col xs={24} sm={24} md={12} lg={8} xl={8} key={account.cashAccountCode}>
                <Card 
                  style={{ 
                    borderRadius: 12, 
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <div style={{ 
                    padding: '16px 24px', 
                    background: getCurrencyColor(account.currencyCode),
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 'bold' }}>{account.cashAccountDescription}</div>
                      <div style={{ opacity: 0.8 }}>{account.cashAccountCode}</div>
                    </div>
                    <Avatar 
                      style={{ 
                        background: '#fff', 
                        color: getCurrencyColor(account.currencyCode),
                        fontWeight: 'bold',
                        fontSize: 16
                      }} 
                      size="large"
                    >
                      {account.currencyCode}
                    </Avatar>
                  </div>
                  
                  {/* Bakiye */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Bakiye</div>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 'bold',
                      color: account.currencyCode !== 'TRY' 
                        ? (account.documentClosingBalance >= 0 ? 'green' : 'red')
                        : (account.localClosingBalance >= 0 ? 'green' : 'red')
                    }}>
                      {account.currencyCode !== 'TRY' 
                        ? formatCurrency(account.documentClosingBalance, account.currencyCode)
                        : formatCurrency(account.localClosingBalance, account.currencyCode)
                      }
                    </div>
                    {account.currencyCode !== 'TRY' && (
                      <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                        {formatCurrency(account.localClosingBalance, 'TRY')}
                      </div>
                    )}
                  </div>
                  
                  {/* İşlem Özeti */}
                  <div style={{ padding: '16px 24px' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Badge color="green" />
                          <ArrowUpOutlined style={{ color: 'green', marginRight: 8 }} />
                          <span>Tahsilat</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                          {account.currencyCode !== 'TRY' 
                            ? formatCurrency(account.documentTotalDebit, account.currencyCode)
                            : formatCurrency(account.localTotalDebit, account.currencyCode)
                          }
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Badge color="red" />
                          <ArrowDownOutlined style={{ color: 'red', marginRight: 8 }} />
                          <span>Ödeme</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                          {account.currencyCode !== 'TRY' 
                            ? formatCurrency(account.documentTotalCredit, account.currencyCode)
                            : formatCurrency(account.localTotalCredit, account.currencyCode)
                          }
                        </div>
                      </Col>
                    </Row>
                    
                    <Divider style={{ margin: '12px 0' }} />
                    
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Badge color="blue" />
                          <SwapOutlined style={{ color: 'blue', marginRight: 8 }} />
                          <span>Virman Giriş</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                          {formatCurrency(account.totalTransferIn, account.currencyCode)}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Badge color="orange" />
                          <SwapOutlined style={{ color: 'orange', marginRight: 8 }} />
                          <span>Virman Çıkış</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                          {formatCurrency(account.totalTransferOut, account.currencyCode)}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default CashSummaryPage;
