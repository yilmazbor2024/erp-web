import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Typography, Space, Input, DatePicker, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import cashVoucherApi from '../../services/cashVoucherApi';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/tr_TR';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CashTransferListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Kasa virman fişlerini getir
  const fetchTransfers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      // Parametreleri hazırla
      const params: any = {
        page,
        pageSize
      };
      
      // Tarih aralığı filtresi
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYYMMDD');
        params.endDate = dateRange[1].format('YYYYMMDD');
      }
      
      // Arama metni filtresi
      if (searchText) {
        params.searchText = searchText;
      }
      
      const response = await cashVoucherApi.getCashTransferVouchers(params);
      
      console.log('Virman fişleri API yanıtı:', response);
      
      if (response.success) {
        const items = response.data.items || [];
        console.log('Virman fişleri:', items);
        
        // Veri alanı dönüşümü yapılıyor
        const formattedItems = items.map((item: any) => ({
          ...item,
          cashHeaderID: item.cashHeaderID,
          voucherNumber: item.voucherNumber || item.cashTransNumber,
          documentDate: item.documentDate,
          amount: item.amount || item.currAccAmount,
          currencyCode: item.currencyCode || item.docCurrencyCode,
          description: item.description || '',
          sourceCashAccountName: item.sourceCashAccountName || item.cashAccountName || '',
          targetCashAccountName: item.targetCashAccountName || ''
        }));
        
        setTransfers(formattedItems);
        setPagination({
          ...pagination,
          current: page,
          pageSize,
          total: response.data.total || 0
        });
      } else {
        message.error(response.error || 'Kasa virman fişleri yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kasa virman fişleri yükleme hatası:', error);
      message.error('Kasa virman fişleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve filtreler değiştiğinde verileri getir
  useEffect(() => {
    fetchTransfers(pagination.current, pagination.pageSize);
  }, []);

  // Tablo sütunları
  const columns = [
    {
      title: 'Detaylar',
      dataIndex: 'details',
      key: 'details',
      render: (_: any, record: any) => {
        const id = record.cashHeaderID || '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '2px solid #fa8c16', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: '#52c41a', flex: 1 }}>{record.voucherNumber || record.cashTransNumber || '-'}</div>
              <div style={{ color: '#1890ff', flex: 1, textAlign: 'center' }}>{record.documentDate ? dayjs(record.documentDate).format('DD.MM.YYYY') : '-'}</div>
              <div style={{ fontWeight: 'bold', flex: 1, textAlign: 'right' }}>{
                record.amount !== undefined && record.amount !== null
                  ? `${Number(record.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${record.currencyCode || ''}`
                  : record.currAccAmount !== undefined && record.currAccAmount !== null
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
                  onClick={() => navigate(`/cash/transfers/detail/${id}`)}
                >
                  Detay
                </Button>
              </div>
            </div>
          </div>
        );
      }
    }
  ];

  // Tablo sayfa değişimi
  const handleTableChange = (pagination: any) => {
    fetchTransfers(pagination.current, pagination.pageSize);
  };

  // Arama işlemi
  const handleSearch = () => {
    fetchTransfers(1, pagination.pageSize);
  };

  // Filtreleri temizle
  const handleReset = () => {
    setSearchText('');
    setDateRange(null);
    fetchTransfers(1, pagination.pageSize);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: '16px 24px', backgroundColor: '#fff' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>Kasalar Arası Virman Fişleri</Title>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/cash/transfers/new')}
            >
              Yeni Virman Fişi
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
          dataSource={transfers}
          rowKey="cashHeaderID"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered={false}
          size="middle"
          locale={{ emptyText: 'Virman fişi bulunamadı' }}
        />
      </Card>
    </div>
  );
};

export default CashTransferListPage;
