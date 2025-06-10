import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Typography, Tag, Spin, message } from 'antd';
import { CashAccount, fetchCashAccounts } from '../../services/cashAccountService';

const { Title } = Typography;

const CashAccountsPage: React.FC = () => {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCashAccounts = async () => {
      try {
        setLoading(true);
        const data = await fetchCashAccounts();
        setCashAccounts(data);
      } catch (error) {
        message.error('Kasa hesapları yüklenirken bir hata oluştu.');
        console.error('Error loading cash accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCashAccounts();
  }, []);

  const columns = [
    {
      title: 'Kasa Kodu',
      dataIndex: 'cashAccountCode',
      key: 'cashAccountCode',
      sorter: (a: CashAccount, b: CashAccount) => a.cashAccountCode.localeCompare(b.cashAccountCode),
    },
    {
      title: 'Kasa Adı',
      dataIndex: 'cashAccountDescription',
      key: 'cashAccountDescription',
      sorter: (a: CashAccount, b: CashAccount) => a.cashAccountDescription.localeCompare(b.cashAccountDescription),
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      render: (text: string, record: CashAccount) => (
        <span>{text} - {record.currencyDescription}</span>
      ),
    },
    {
      title: 'Ofis',
      dataIndex: 'officeCode',
      key: 'officeCode',
      render: (text: string, record: CashAccount) => (
        <span>{text} - {record.officeDescription}</span>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      render: (isBlocked: boolean) => (
        <Tag color={isBlocked ? 'red' : 'green'}>
          {isBlocked ? 'Bloke' : 'Aktif'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="cash-accounts-page">
      <div style={{ marginBottom: '16px' }}>
        <Title level={2}>Nakit Kasa Hesapları</Title>
        <Typography.Text type="secondary">Tüm kasa hesapları listesi</Typography.Text>
      </div>
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <Table
                dataSource={cashAccounts}
                columns={columns}
                rowKey="cashAccountCode"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total) => `Toplam ${total} kayıt`,
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CashAccountsPage;
