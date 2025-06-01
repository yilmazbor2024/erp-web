import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Button, Space, Row, Col, Typography, Spin, message, Alert } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { exchangeRateApi, ExchangeRateSource, CrossRate } from '../../services/exchangeRateApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

const { Title } = Typography;
const { Option } = Select;

dayjs.locale('tr');

const CrossRatesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [crossRates, setCrossRates] = useState<CrossRate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [source, setSource] = useState<ExchangeRateSource>(ExchangeRateSource.CENTRAL_BANK);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<string | null>(null);
  
  const currencies = [
    { code: 'USD', name: 'Amerikan Doları' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'İngiliz Sterlini' },
    { code: 'CHF', name: 'İsviçre Frangı' },
    { code: 'JPY', name: 'Japon Yeni' },
    { code: 'AUD', name: 'Avustralya Doları' },
    { code: 'CAD', name: 'Kanada Doları' },
    { code: 'RUB', name: 'Rus Rublesi' },
    { code: 'SAR', name: 'Suudi Arabistan Riyali' },
    { code: 'CNY', name: 'Çin Yuanı' }
  ];

  const loadCrossRates = async () => {
    setLoading(true);
    setError(null);
    
    // API isteği detaylarını kaydet
    const requestUrl = `/api/exchange-rates/cross-rates?baseCurrency=${baseCurrency}&date=${selectedDate}&source=${source}`;
    setRequestDetails(`GET ${requestUrl}`);
    
    try {
      console.log('API isteği gönderiliyor:', requestUrl);
      const data = await exchangeRateApi.getCrossRates(baseCurrency, selectedDate, source);
      console.log('API yanıtı:', data);
      setCrossRates(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen hata';
      const statusCode = err.response?.status || 'Bilinmeyen durum kodu';
      
      const detailedError = `Hata Kodu: ${statusCode}, Mesaj: ${errorMessage}`;
      console.error('Çapraz kurlar yüklenirken hata oluştu:', err);
      console.error(detailedError);
      
      setError(detailedError);
      message.error('Çapraz kurlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrossRates();
  }, [baseCurrency, source]);

  const handleDateChange = (date: any) => {
    if (date) {
      setSelectedDate(date.format('YYYY-MM-DD'));
    }
  };

  const handleBaseCurrencyChange = (value: string) => {
    setBaseCurrency(value);
  };

  const handleSourceChange = (value: ExchangeRateSource) => {
    setSource(value);
  };

  const handleSearch = () => {
    loadCrossRates();
  };

  const columns = [
    {
      title: 'Baz Para Birimi',
      dataIndex: 'fromCurrency',
      key: 'fromCurrency',
    },
    {
      title: 'Karşı Para Birimi',
      dataIndex: 'toCurrency',
      key: 'toCurrency',
    },
    {
      title: 'Para Birimi Adı',
      dataIndex: 'currencyDescription',
      key: 'currencyDescription',
    },
    {
      title: `1 ${baseCurrency} Karşılığı`,
      dataIndex: 'rate',
      key: 'rate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: `1 Birim Karşılığı ${baseCurrency}`,
      dataIndex: 'inverseRate',
      key: 'inverseRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    }
  ];

  return (
    <Card title={<Title level={4}>Çapraz Kurlar</Title>} className="cross-rates-card">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {error && (
          <Alert
            message="Hata"
            description={
              <div>
                <p style={{ color: 'red', margin: 0 }}>{error}</p>
                {requestDetails && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>İstek Detayları:</p>
                    <code>{requestDetails}</code>
                  </div>
                )}
                <p style={{ marginTop: '10px' }}>
                  <strong>Source Parametresi:</strong> Veri kaynağını belirtir. Örneğin CENTRAL_BANK (Merkez Bankası) veya diğer kaynaklar.
                </p>
              </div>
            }
            type="error"
            showIcon
            icon={<WarningOutlined />}
            style={{ backgroundColor: 'white', border: '1px solid #ff4d4f' }}
          />
        )}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space>
              <span>Baz Para Birimi:</span>
              <Select 
                value={baseCurrency} 
                onChange={handleBaseCurrencyChange}
                style={{ width: 150 }}
              >
                {currencies.map(currency => (
                  <Option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} md={8}>
            <Space>
              <span>Kaynak:</span>
              <Select 
                value={source} 
                onChange={handleSourceChange}
                style={{ width: 180 }}
              >
                <Option value={ExchangeRateSource.CENTRAL_BANK}>T.C. Merkez Bankası</Option>
                <Option value={ExchangeRateSource.FREE_MARKET}>Serbest Piyasa</Option>
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} md={8}>
            <Space>
              <span>Tarih:</span>
              <DatePicker 
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={handleDateChange}
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
          dataSource={crossRates}
          rowKey={(record) => `${record.fromCurrency}-${record.toCurrency}-${record.date}`}
          pagination={false}
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </Space>
    </Card>
  );
};

export default CrossRatesPage;
