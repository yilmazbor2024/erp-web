import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Button, Space, Row, Col, Typography, Radio, Spin, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { exchangeRateApi, ExchangeRate, ExchangeRateSource, ExchangeRateFilter } from '../../services/exchangeRateApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

dayjs.locale('tr');

const ExchangeRatesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [filter, setFilter] = useState<ExchangeRateFilter>({
    startDate: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    source: ExchangeRateSource.CENTRAL_BANK,
    page: 1,
    pageSize: 10
  });

  const loadExchangeRates = async () => {
    setLoading(true);
    try {
      const response = await exchangeRateApi.getExchangeRates(filter);
      setExchangeRates(response.items);
      setTotal(response.total);
      setPagination({
        current: response.page,
        pageSize: response.pageSize,
        total: response.total
      });
    } catch (error) {
      console.error('Döviz kurları yüklenirken hata oluştu:', error);
      message.error('Döviz kurları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchangeRates();
  }, [filter.page, filter.pageSize, filter.source]);

  const handleSearch = () => {
    setFilter(prev => ({
      ...prev,
      page: 1 // Arama yapıldığında ilk sayfaya dön
    }));
    loadExchangeRates();
  };

  const handleTableChange = (pagination: any) => {
    setFilter(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilter(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      }));
    }
  };

  const handleSourceChange = (e: any) => {
    setFilter(prev => ({
      ...prev,
      source: e.target.value,
      page: 1
    }));
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Döviz Kodu',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
    },
    {
      title: 'Döviz Adı',
      dataIndex: 'currencyDescription',
      key: 'currencyDescription',
    },
    {
      title: 'Karşılık Kodu',
      dataIndex: 'relationCurrencyCode',
      key: 'relationCurrencyCode',
    },
    {
      title: 'Serbest Piyasa Alış',
      dataIndex: 'freeMarketBuyingRate',
      key: 'freeMarketBuyingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Serbest Piyasa Satış',
      dataIndex: 'freeMarketSellingRate',
      key: 'freeMarketSellingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Efektif Alış',
      dataIndex: 'cashBuyingRate',
      key: 'cashBuyingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Efektif Satış',
      dataIndex: 'cashSellingRate',
      key: 'cashSellingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Banknot Alış',
      dataIndex: 'banknoteBuyingRate',
      key: 'banknoteBuyingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Banknot Satış',
      dataIndex: 'banknoteSellingRate',
      key: 'banknoteSellingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    }
  ];

  return (
    <Card className="exchange-rates-page">
      <Title level={4}>Döviz Kurları</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Radio.Group 
              value={filter.source} 
              onChange={handleSourceChange}
              optionType="button" 
              buttonStyle="solid"
            >
              <Radio.Button value={ExchangeRateSource.CENTRAL_BANK}>
                T.C. Merkez Bankası
              </Radio.Button>
              <Radio.Button value={ExchangeRateSource.FREE_MARKET}>
                Serbest Piyasa
              </Radio.Button>
            </Radio.Group>
          </Col>
          
          <Col xs={24} md={12}>
            <Space>
              <RangePicker 
                value={[
                  filter.startDate ? dayjs(filter.startDate) : null,
                  filter.endDate ? dayjs(filter.endDate) : null
                ]}
                onChange={handleDateRangeChange}
                format="DD.MM.YYYY"
              />
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleSearch}
                loading={loading}
              >
                Yenile
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={exchangeRates}
          rowKey={(record) => `${record.date}-${record.currencyCode}-${record.relationCurrencyCode}`}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Toplam ${total} kayıt`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </Space>
    </Card>
  );
};

export default ExchangeRatesPage;
