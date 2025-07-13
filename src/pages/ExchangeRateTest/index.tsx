import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Typography } from 'antd';
import ExchangeRatesCard from '../../components/ExchangeRatesCard';
import tcmbExchangeRateApi from '../../services/tcmbExchangeRateApi';

const { Title } = Typography;

const ExchangeRateTest: React.FC = () => {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        const latestRates = await tcmbExchangeRateApi.getLatestRates();
        
        if (latestRates && latestRates.success && latestRates.data) {
          const rates: Record<string, number> = {};
          
          // Döviz kurlarını data dizisinden bul ve 10000'e bölerek düzelt
          latestRates.data.forEach(rate => {
            if (rate.currencyCode === 'USD') rates.USD = rate.forexSelling / 10000;
            if (rate.currencyCode === 'EUR') rates.EUR = rate.forexSelling / 10000;
            if (rate.currencyCode === 'GBP') rates.GBP = rate.forexSelling / 10000;
          });
          
          console.log('Düzeltilmiş kurlar:', rates);
          
          setExchangeRates(rates);
        }
        setError(null);
      } catch (err) {
        console.error('Döviz kurları alınırken hata oluştu:', err);
        setError('Döviz kurları alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Döviz Kurları Test Sayfası</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={24} md={12}>
          <Card title="TCMB Döviz Kurları" loading={loading}>
            {error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : (
              <pre>{JSON.stringify(exchangeRates, null, 2)}</pre>
            )}
          </Card>
        </Col>
        
        <Col span={24} md={12}>
          <ExchangeRatesCard exchangeRates={exchangeRates} />
        </Col>
      </Row>
    </div>
  );
};

export default ExchangeRateTest;
