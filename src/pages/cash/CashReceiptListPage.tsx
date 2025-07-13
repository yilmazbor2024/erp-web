import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Typography, Space, Input, DatePicker, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import cashVoucherApi from '../../services/cashVoucherApi';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/tr_TR';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CashReceiptListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [totalAmount, setTotalAmount] = useState<{[currency: string]: number}>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Kasa tahsilat fişlerini getir
  const fetchReceipts = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };

      // Arama filtresi ekle
      if (searchText) {
        params.search = searchText;
      }

      // Tarih aralığı filtresi ekle
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await cashVoucherApi.getCashReceiptVouchers(params);
      
      if (response.success) {
        console.log('API yanıtı:', response.data.items);
        console.log('API yanıtı detaylı:', JSON.stringify(response.data.items, null, 2));
        const items = response.data.items || [];
        setReceipts(items);
        setPagination({
          ...pagination,
          current: page,
          pageSize,
          total: response.data.total || 0
        });
        
        // Toplam tutarları hesapla
        const totals: {[currency: string]: number} = {};
        items.forEach((item: any) => {
          if (item && item.currencyCode) {
            const amount = item.amount !== undefined && item.amount !== null ? Number(item.amount) : 0;
            if (!isNaN(amount)) {
              if (!totals[item.currencyCode]) {
                totals[item.currencyCode] = 0;
              }
              totals[item.currencyCode] += amount;
            }
          }
        });
        setTotalAmount(totals);
      } else {
        message.error(response.error || 'Kasa tahsilat fişleri yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kasa tahsilat fişleri yükleme hatası:', error);
      message.error('Kasa tahsilat fişleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve filtreler değiştiğinde verileri getir
  useEffect(() => {
    fetchReceipts(pagination.current, pagination.pageSize);
  }, []);

  // Tablo sütunları
  const columns = [
    {
      title: 'Bilgiler',
      key: 'info',
      render: (_: any, record: any) => {
        const id = record.cashHeaderID || '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '2px solid #fa8c16', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: '#52c41a', flex: 1 }}>{record.cashTransNumber || '-'}</div>
              <div style={{ color: '#1890ff', flex: 1, textAlign: 'center' }}>{record.documentDate ? dayjs(record.documentDate).format('DD.MM.YYYY') : '-'}</div>
              <div style={{ fontWeight: 'bold', flex: 1, textAlign: 'right' }}>{
                record.currAccAmount !== undefined && record.currAccAmount !== null
                  ? `${Number(record.currAccAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${record.docCurrencyCode || ''}`
                  : '-'
              }</div>
            </div>
            {/* Açıklama - 3 satır ile sınırlandırılmış ve gri */}
            <div 
              style={{ 
                marginTop: '8px', 
                padding: '6px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                maxHeight: '4.5em',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid #e8e8e8',
                color: '#666',
                position: 'relative'
              }}
            >
              <div style={{ 
                flex: 1, 
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis',
              }}>
                {record.description || '-'}
              </div>
              <div style={{ marginLeft: '8px', alignSelf: 'center' }}>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => navigate(`/cash/receipt/detail/${id}`)}
                >
                  Detay
                </Button>
              </div>
            </div>
          </div>
        );
      },
      width: '100%'
    }
  ];

  // Tablo sayfa değişimi
  const handleTableChange = (pagination: any) => {
    fetchReceipts(pagination.current, pagination.pageSize);
  };

  // Arama işlemi
  const handleSearch = () => {
    fetchReceipts(1, pagination.pageSize);
  };

  // Filtreleri temizle
  const handleReset = () => {
    setSearchText('');
    setDateRange(null);
    fetchReceipts(1, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: '16px 24px', backgroundColor: '#fff' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>Kasa Tahsilat Fişleri</Title>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/cash/receipt')}
            >
              Yeni Tahsilat Fişi
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Fiş No, Açıklama veya Kasa Hesabı ara"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={8}>
              <RangePicker
                locale={locale}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={8}>
              <Space>
                <Button type="primary" onClick={handleSearch}>Ara</Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>Sıfırla</Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={receipts} 
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => {
              fetchReceipts(page, pageSize);
            }
          }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong>Toplam:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  {Object.entries(totalAmount).map(([currency, amount]) => (
                  <div key={currency}>
                    <strong>
                      {typeof amount === 'number' ? 
                        amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : 
                        '0.00'} {currency}
                    </strong>
                  </div>
                ))}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default CashReceiptListPage;
