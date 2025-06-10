import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Divider, Button, Space, InputNumber, Form, Input } from 'antd';
import { SaveOutlined, CheckOutlined } from '@ant-design/icons';

interface InvoiceSummaryProps {
  totalAmount: number;
  discountAmount: number;
  subtotalAmount: number;
  vatAmount: number;
  netAmount: number;
  onSubmit: () => void;
  loading: boolean;
  form: any;
  currencyCode?: string;
  openCashPaymentModal?: () => void;
  exchangeRate?: number; // TL karşılığı için kur değeri
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  totalAmount,
  discountAmount,
  subtotalAmount,
  vatAmount,
  netAmount,
  onSubmit,
  loading,
  form,
  currencyCode,
  openCashPaymentModal,
  exchangeRate = 1 // Varsayılan değer 1
}) => {
  // Para birimi state'i
  const [currency, setCurrency] = useState<string>(currencyCode || 'TRY');
  
  // Para birimi prop'u değiştiğinde state'i güncelle
  useEffect(() => {
    if (currencyCode && currencyCode !== currency) {
      setCurrency(currencyCode);
    }
  }, [currencyCode]);
  
  // Para birimi sembolünü belirle
  const getCurrencySymbol = (code: string) => {
    switch(code) {
      case 'TRY': return '₺';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code; // Bilinmeyen para birimleri için kodu göster
    }
  };
  
  const currencySymbol = getCurrencySymbol(currency);
  return (
    <div className="invoice-summary">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Fatura Notları" variant="borderless">
            {/* Form.Item yerine doğrudan Input.TextArea kullanıyoruz */}
            <Input.TextArea 
              rows={4} 
              placeholder="Fatura ile ilgili notlar..."
              style={{ width: '100%' }}
              value={form?.getFieldValue('notes') || ''}
              onChange={(e) => form?.setFieldsValue({ notes: e.target.value })}
            />
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Fatura Toplamları" variant="borderless">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Toplam Tutar" 
                  value={totalAmount} 
                  precision={2} 
                  suffix={currencySymbol}
                  valueStyle={{ color: '#1890ff' }}
                />
                {currency !== 'TRY' && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    TL: {(totalAmount * exchangeRate).toFixed(2)} ₺
                  </div>
                )}
              </Col>
              <Col span={12}>
                <Statistic 
                  title="İskonto Tutarı" 
                  value={discountAmount} 
                  precision={2} 
                  suffix={currencySymbol}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                {currency !== 'TRY' && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    TL: {(discountAmount * exchangeRate).toFixed(2)} ₺
                  </div>
                )}
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Ara Toplam" 
                  value={subtotalAmount} 
                  precision={2} 
                  suffix={currencySymbol}
                />
                {currency !== 'TRY' && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    TL: {(subtotalAmount * exchangeRate).toFixed(2)} ₺
                  </div>
                )}
              </Col>
              <Col span={12}>
                <Statistic 
                  title="KDV Tutarı" 
                  value={vatAmount} 
                  precision={2} 
                  suffix={currencySymbol}
                />
                {currency !== 'TRY' && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    TL: {(vatAmount * exchangeRate).toFixed(2)} ₺
                  </div>
                )}
              </Col>
              <Divider style={{ margin: '12px 0' }} />
              <Col span={24}>
                <Statistic 
                  title="Genel Toplam" 
                  value={netAmount} 
                  precision={2} 
                  suffix={currencySymbol}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '1.2em' }}
                />
                {currency !== 'TRY' && (
                  <div style={{ fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>
                    TL: {(netAmount * exchangeRate).toFixed(2)} ₺
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>
        
        {/* Kaydet butonu kaldırıldı - InvoiceForm.tsx içindeki buton kullanılacak */}
      </Row>
    </div>
  );
};

export default InvoiceSummary;
