import React from 'react';
import { Card, Spin, Tooltip, Divider } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

interface ExchangeRatesCardProps {
  exchangeRates: Record<string, number>;
}

/**
 * Güncel döviz kurlarını gösteren kart bileşeni
 */
const ExchangeRatesCard: React.FC<ExchangeRatesCardProps> = ({ exchangeRates }) => {
  const currencies = ['USD', 'EUR', 'GBP'];
  const today = new Date().toLocaleDateString('tr-TR');
  
  return (
    <Card 
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', color: '#1890ff', fontSize: 16, fontWeight: 500 }}>
          <DollarOutlined style={{ fontSize: 18 }} />
          <span style={{ marginLeft: 10 }}>Güncel Kurlar</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#666', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>{today}</span>
        </div>
      }
      bordered={true}
      style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '8px' }}
      styles={{ body: { padding: '12px 16px', background: '#fafafa' } }}
    >
      {Object.keys(exchangeRates).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '12px' }}>
          <Spin size="small" />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          {currencies.map((currency, index) => {
            const rate = exchangeRates[currency] || 0;
            return (
              <React.Fragment key={currency}>
                {index > 0 && <Divider type="vertical" style={{ height: 24, margin: '0 4px', backgroundColor: '#e8e8e8' }} />}
                <Tooltip title={`1 ${currency} = ${rate.toFixed(4)} TL`} color="#1890ff">
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontWeight: 'bold', color: '#1890ff', marginRight: 8, fontSize: 16 }}>{currency}</span>
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {rate.toFixed(2)} ₺
                    </span>
                  </div>
                </Tooltip>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ExchangeRatesCard;
