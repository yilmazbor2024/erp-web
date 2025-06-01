import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Button, Space, Row, Col, Typography, Spin, message, Empty, Alert } from 'antd';
import { ReloadOutlined, LineChartOutlined, WarningOutlined } from '@ant-design/icons';
import { exchangeRateApi, ExchangeRateSource, ExchangeRate } from '../../services/exchangeRateApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

dayjs.locale('tr');

const HistoricalRatesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [historicalRates, setHistoricalRates] = useState<ExchangeRate[]>([]);
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [currency, setCurrency] = useState<string>('USD');
  const [relationCurrency, setRelationCurrency] = useState<string>('TRY');
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
    { code: 'CNY', name: 'Çin Yuanı' },
    { code: 'TRY', name: 'Türk Lirası' }
  ];

  const loadHistoricalRates = async () => {
    setLoading(true);
    setError(null);
    
    // API isteği detaylarını kaydet
    const requestUrl = `/api/exchange-rates/historical?currency=${currency}&relationCurrency=${relationCurrency}&startDate=${startDate}&endDate=${endDate}&source=${source}`;
    setRequestDetails(`GET ${requestUrl}`);
    
    try {
      console.log('API isteği gönderiliyor:', requestUrl);
      const data = await exchangeRateApi.getHistoricalRates(
        currency, 
        relationCurrency, 
        startDate, 
        endDate, 
        source
      );
      console.log('API yanıtı:', data);
      setHistoricalRates(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen hata';
      const statusCode = err.response?.status || 'Bilinmeyen durum kodu';
      
      const detailedError = `Hata Kodu: ${statusCode}, Mesaj: ${errorMessage}`;
      console.error('Tarihsel döviz kurları yüklenirken hata oluştu:', err);
      console.error(detailedError);
      
      setError(detailedError);
      message.error('Tarihsel döviz kurları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistoricalRates();
  }, []);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setStartDate(dates[0].format('YYYY-MM-DD'));
      setEndDate(dates[1].format('YYYY-MM-DD'));
    }
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
  };

  const handleRelationCurrencyChange = (value: string) => {
    setRelationCurrency(value);
  };

  const handleSourceChange = (value: ExchangeRateSource) => {
    setSource(value);
  };

  const handleSearch = () => {
    loadHistoricalRates();
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      render: (code: string, record: ExchangeRate) => `${code} - ${record.currencyDescription}`,
    },
    {
      title: 'Karşı Para Birimi',
      dataIndex: 'relationCurrencyCode',
      key: 'relationCurrencyCode',
      render: (code: string, record: ExchangeRate) => `${code} - ${record.relationCurrencyDescription || ''}`,
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
    }
  ];

  return (
    <Card title={<Title level={4}>Tarihsel Döviz Kurları</Title>} className="exchange-rates-card">
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
              <span>Para Birimi:</span>
              <Select 
                value={currency} 
                onChange={handleCurrencyChange}
                style={{ width: 150 }}
              >
                {currencies.filter(c => c.code !== relationCurrency).map(currency => (
                  <Option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} md={8}>
            <Space>
              <span>Karşı Para Birimi:</span>
              <Select 
                value={relationCurrency} 
                onChange={handleRelationCurrencyChange}
                style={{ width: 150 }}
              >
                {currencies.filter(c => c.code !== currency).map(currency => (
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
          
          <Col xs={24} md={16}>
            <Space>
              <span>Tarih Aralığı:</span>
              <RangePicker 
                value={[
                  startDate ? dayjs(startDate) : null,
                  endDate ? dayjs(endDate) : null
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

        {historicalRates.length > 0 ? (
          <Table
            columns={columns}
            dataSource={historicalRates}
            rowKey={(record) => `${record.date}-${record.currencyCode}-${record.relationCurrencyCode}`}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Toplam ${total} kayıt`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            loading={loading}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty 
            description={
              <span>
                Seçilen tarih aralığında ve para birimi için veri bulunamadı
              </span>
            }
          />
        )}
      </Space>
    </Card>
  );
};

export default HistoricalRatesPage;
