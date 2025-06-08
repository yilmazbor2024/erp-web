import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Row, Col, Typography, Button, Spin, message, InputNumber, Card, Table, Divider, Modal } from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;
const { Text, Title } = Typography;

interface CashPaymentFormProps {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currencyCode: string;
  currAccCode: string;
  currAccTypeCode: string;
  officeCode: string;
  storeCode?: string;
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

interface CashAccount {
  cashAccountCode?: string;
  cashAccountName?: string;
  currencyCode?: string;
  code?: string;
  id?: string;
  name?: string;
}

interface PaymentRow {
  id: string;
  paymentType: string;
  currencyCode: string;
  exchangeRate: number;
  amount: number;
  tryAmount: number;
  description: string;
  cashAccountCode?: string;
}

const CashPaymentForm: React.FC<CashPaymentFormProps> = ({
  invoiceId,
  invoiceNumber,
  invoiceAmount,
  currencyCode,
  currAccCode,
  currAccTypeCode,
  officeCode,
  storeCode,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState<boolean>(false);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loadingCashAccounts, setLoadingCashAccounts] = useState<boolean>(false);

  // Toplam ve ödemen tutarlar
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(invoiceAmount);
  
  // Ödeme satırları
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0000);
  const [showAdvanceWarning, setShowAdvanceWarning] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);

  useEffect(() => {
    // Form başlangıç değerlerini ayarla
    form.setFieldsValue({
      amount: remainingAmount, // Kalan tutar default olarak gelsin
      description: `${invoiceNumber} nolu fatura için nakit tahsilat`,
      currencyCode: currencyCode || 'TRY',
      exchangeRate: 1
    });
    
    // Kasa hesaplarını yükle
    fetchCashAccounts();
    console.log('Kasa hesapları yükleniyor...');
  }, []);

  // Kasa hesaplarını getir
  const fetchCashAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/cashaccount/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Kasa hesapları:', response.data);
      if (Array.isArray(response.data)) {
        setCashAccounts(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setCashAccounts(response.data.data);
        console.log('Kasa hesapları data içinden alındı:', response.data.data);
      } else {
        console.error('Kasa hesapları verisi geçerli bir dizi değil:', response.data);
        message.error('Kasa hesapları verisi geçerli bir format değil');
      }
    } catch (error) {
      console.error('Kasa hesapları yüklenirken hata:', error);
      message.error('Kasa hesapları yüklenemedi');
    }
  };

  // Tutar değişikliğini işle
  const handleAmountChange = (value: number | null) => {
    const safeValue = value === null ? 0 : value;
    form.setFieldsValue({ amount: safeValue });
    console.log('Tutar değişti:', safeValue);
  };

  // Yeni ödeme satırı ekle
  const addPaymentRow = () => {
    try {
      const values = form.getFieldsValue();
      console.log('Form değerleri:', values);
      
      // Form değerlerini al
      const formCashAccountCode = values.cashAccountCode || '';
      const formCurrencyCode = values.currencyCode || 'TRY';
      const formExchangeRate = values.exchangeRate || 1;
      const formDescription = values.description || `${invoiceNumber} nolu fatura için nakit tahsilat`;
      
      // Kasa hesap kodu kontrolü
      if (!formCashAccountCode) {
        message.error('Lütfen bir kasa hesabı seçin');
        return;
      }
      
      // Manuel olarak tutar kontrolü yapıyoruz
      let formAmount = form.getFieldValue('amount');
      console.log('Girilen tutar (ham):', formAmount, 'Tipi:', typeof formAmount);
      
      // String ise sayıya çevir
      if (typeof formAmount === 'string') {
        formAmount = parseFloat(formAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
      }
      
      // Sayı değilse veya geçersizse hata ver
      if (isNaN(formAmount) || formAmount <= 0) {
        console.log('Geçersiz tutar:', formAmount);
        message.error('Lütfen geçerli bir tutar girin');
        return;
      }
      
      // TRY için kur her zaman 1
      const actualExchangeRate = formCurrencyCode === 'TRY' ? 1 : (formExchangeRate || 1);
      const tryAmount = formCurrencyCode === 'TRY' ? Number(formAmount) : Number(formAmount) * actualExchangeRate;
      
      console.log('Eklenen tutar:', Number(formAmount));
      console.log('TRY karşılığı:', tryAmount);
      console.log('Fatura toplamı:', invoiceAmount);
      console.log('Mevcut ödenen toplam:', paidAmount);
      
      // Yeni ödeme satırı oluştur
      const newRow: PaymentRow = {
        id: Date.now().toString(),
        paymentType: 'Nakit',
        currencyCode: formCurrencyCode,
        exchangeRate: actualExchangeRate,
        amount: Number(formAmount),
        tryAmount: tryAmount,
        description: formDescription,
        cashAccountCode: formCashAccountCode
      };
      
      // Ödeme satırlarını güncelle
      const updatedRows = [...paymentRows, newRow];
      setPaymentRows(updatedRows);
      
      // Toplam ödenen tutarı hesapla
      const totalPaid = updatedRows.reduce((sum, row) => sum + row.tryAmount, 0);
      setPaidAmount(totalPaid);
      console.log('Güncel ödenen toplam:', totalPaid);
      
      // Kalan tutarı hesapla
      const remaining = invoiceAmount - totalPaid;
      setRemainingAmount(remaining);
      console.log('Kalan tutar:', remaining);
      
      // Para üstü kontrolü
      if (totalPaid > invoiceAmount) {
        const advance = totalPaid - invoiceAmount;
        setAdvanceAmount(advance);
        setShowAdvanceWarning(true);
        console.log('Para üstü:', advance);
      } else {
        setShowAdvanceWarning(false);
        setAdvanceAmount(0);
        console.log('Para üstü yok');
      }
      
      console.log('Tüm ödeme satırları:', updatedRows);
      
      // Formu sıfırla - kalan tutarı otomatik doldurmak yerine sıfırlıyoruz
      form.setFieldsValue({
        amount: 0,
        description: `${invoiceNumber} nolu fatura için nakit tahsilat`
      });
      
    } catch (error) {
      console.error('addPaymentRow hatası:', error);
      message.error('Tutar eklenirken bir hata oluştu');
    }
  };
  
  // Ödeme satırını kaldır
  const removePaymentRow = (rowId: string) => {
    // Satırı kaldır
    const updatedRows = paymentRows.filter(row => row.id !== rowId);
    setPaymentRows(updatedRows);
    
    // Toplam ödenen tutarı güncelle
    const totalPaid = updatedRows.reduce((sum, row) => sum + row.tryAmount, 0);
    setPaidAmount(totalPaid);
    
    // Kalan tutarı güncelle
    const remaining = invoiceAmount - totalPaid;
    setRemainingAmount(remaining);
    
    // Para üstü kontrolü
    if (totalPaid > invoiceAmount) {
      setAdvanceAmount(totalPaid - invoiceAmount);
      setShowAdvanceWarning(true);
    } else {
      setShowAdvanceWarning(false);
      setAdvanceAmount(0);
    }
    
    // Form tutarını güncelle
    form.setFieldsValue({
      amount: remaining > 0 ? remaining : 0
    });
  };
  
  // Para üstü uyarısını kabul et ve avans olarak kaydet
  const acceptAdvancePayment = () => {
    setShowAdvanceWarning(false);
    message.success(`${advanceAmount.toFixed(2)} ${currencyCode} tutarında fazla ödeme avans olarak kaydedilecek`);
  };

  // Formu gönder
  const handleSubmit = async (values: any) => {
    // Ödeme satırı yoksa uyarı ver
    if (paymentRows.length === 0) {
      message.error('En az bir ödeme satırı eklemelisiniz');
      return;
    }
    
    setLoading(true);
    try {
      // Tüm ödeme satırlarını içeren payload hazırla
      const payload = {
        invoiceId,
        currAccCode,
        currAccTypeCode,
        officeCode,
        storeCode,
        totalAmount: paidAmount,
        payments: paymentRows.map(row => ({
          cashAccountCode: row.cashAccountCode,
          amount: row.amount,
          exchangeRate: row.exchangeRate,
          tryAmount: row.tryAmount,
          currencyCode: row.currencyCode,
          description: row.description
        })),
        advanceAmount: advanceAmount > 0 ? advanceAmount : 0
      };
      
      console.log('Gönderilen veri:', payload);
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/payment/cash-payment`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        message.success('Nakit tahsilat başarıyla kaydedildi');
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        message.error(response.data?.message || 'Nakit tahsilat kaydedilirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Nakit tahsilat kaydedilirken hata oluştu:', error);
      message.error(`Nakit tahsilat kaydedilirken bir hata oluştu: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toplam ve ödenen tutarları gösteren tablo sütunları
  const columns = [
    {
      title: '',
      dataIndex: 'label',
      key: 'label',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'TRY',
      dataIndex: 'tryAmount',
      key: 'tryAmount',
      align: 'right' as 'right',
      render: (amount: number) => <Text type={amount < 0 ? 'danger' : undefined}>{amount.toFixed(2)}</Text>
    },
    {
      title: currencyCode !== 'TRY' ? currencyCode : '',
      dataIndex: 'foreignAmount',
      key: 'foreignAmount',
      align: 'right' as 'right',
      render: (amount: number) => <Text type={amount < 0 ? 'danger' : undefined}>{amount.toFixed(2)}</Text>
    }
  ];

  // Tablo verileri
  const tableData = [
    {
      key: '1',
      label: 'Toplam',
      tryAmount: currencyCode === 'TRY' ? invoiceAmount : 0,
      foreignAmount: currencyCode !== 'TRY' ? invoiceAmount : 0
    },
    {
      key: '2',
      label: 'Ödenen Tutar',
      tryAmount: currencyCode === 'TRY' ? paidAmount : 0,
      foreignAmount: currencyCode !== 'TRY' ? paidAmount : 0
    },
    {
      key: '3',
      label: 'Para Üstü',
      tryAmount: currencyCode === 'TRY' ? (paidAmount > invoiceAmount ? paidAmount - invoiceAmount : 0) : 0,
      foreignAmount: currencyCode !== 'TRY' ? (paidAmount > invoiceAmount ? paidAmount - invoiceAmount : 0) : 0
    }
  ];

  return (
    <Card variant="borderless" style={{ padding: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Ödeme satırları tablosu */}
        <div style={{ marginBottom: '10px', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Ödeme Tipi</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Para Birimi</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Döviz Kuru</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Tutar</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Tutar (TRY)</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Ödeme Açıkl.</th>
                <th style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>Kaldır</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center', height: '50px' }}>
                    Ödeme satırı eklemek için aşağıdaki formu doldurup "Ekle" butonuna tıklayın.
                  </td>
                </tr>
              ) : (
                paymentRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center' }}>{row.paymentType}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center' }}>{row.currencyCode}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'right' }}>{row.exchangeRate.toFixed(4)}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'right' }}>{row.amount.toFixed(2)}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'right' }}>{row.tryAmount.toFixed(2)}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px' }}>{row.description}</td>
                    <td style={{ border: '1px solid #e8e8e8', padding: '8px', textAlign: 'center' }}>
                      <Button 
                        type="text" 
                        danger 
                        icon={<CloseOutlined />} 
                        onClick={() => removePaymentRow(row.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tutar ve Ekle butonu */}
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: '10px', fontWeight: 'bold' }}>Tutar:</div>
            <Form.Item
              name="amount"
              style={{ margin: 0 }}
              rules={[{ required: true, message: 'Lütfen tutar girin' }]}
            >
              <InputNumber
                style={{ width: '150px' }}
                min={0}
                step={0.01}
                precision={2}
                onChange={handleAmountChange}
                decimalSeparator=","
                stringMode
              />
            </Form.Item>
            <div style={{ marginLeft: '10px', marginRight: '10px', fontWeight: 'bold' }}>{form.getFieldValue('currencyCode') || currencyCode}</div>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addPaymentRow}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            size="middle"
          />
        </div>
        
        {/* Form alanı */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            currencyCode: currencyCode,
            amount: 0,
            description: `${invoiceNumber} nolu fatura için nakit tahsilat`
          }}
          style={{ marginTop: '10px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              {/* Sol taraf - form alanları */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <Form.Item name="cashAccountCode" label="Kasa Hesabı">
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Kasa hesabı seçin"
                    showSearch
                    optionFilterProp="children"
                  >
                    {cashAccounts && cashAccounts.length > 0 ? (
                      cashAccounts.map(account => (
                        <Option key={account.code || account.id} value={account.code || account.id}>
                          {account.name} ({account.code || account.id})
                        </Option>
                      ))
                    ) : (
                      <Option value="" disabled>Kasa hesabı bulunamadı</Option>
                    )}
                  </Select>
                </Form.Item>

                <Form.Item name="currencyCode" label="Para Birimi" initialValue="TRY">
                  <Select 
                    style={{ width: '100%' }}
                    onChange={(value) => {
                      // Para birimi değiştiğinde kur alanını güncelle
                      if (value === 'TRY') {
                        form.setFieldsValue({ exchangeRate: 1 });
                      }
                    }}
                  >
                    <Option value="TRY">TRY</Option>
                    <Option value="USD">USD</Option>
                    <Option value="EUR">EUR</Option>
                    <Option value="GBP">GBP</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="exchangeRate" label="Döviz Kuru" initialValue={1}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    step={0.01}
                    precision={4}
                    disabled={form.getFieldValue('currencyCode') === 'TRY'}
                    decimalSeparator=","
                    stringMode
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label="Satır Açıklaması"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </div>
          </div>
          
          {/* Özet bilgiler - alt kısım */}
          <div style={{ marginTop: '20px', border: '1px solid #f0f0f0', padding: '15px', backgroundColor: '#fafafa', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e8e8e8', paddingBottom: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Fatura Toplamı:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'red' }}>{currencyCode} {invoiceAmount?.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e8e8e8', paddingBottom: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Ödenen Tutar:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'green' }}>{currencyCode} {paidAmount.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: paidAmount > invoiceAmount ? '10px' : '0' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{paidAmount > invoiceAmount ? 'Para Üstü:' : 'Kalan Tutar:'}</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: paidAmount > invoiceAmount ? 'blue' : 'orange' }}>
                {currencyCode} {Math.abs(paidAmount - invoiceAmount).toFixed(2)}
              </span>
            </div>
            
            {paidAmount > invoiceAmount && (
              <div style={{ backgroundColor: '#e6f7ff', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #91d5ff' }}>
                <InfoCircleOutlined style={{ color: '#1890ff', marginRight: '5px' }} />
                <span>Fazla ödeme avans olarak kaydedilecektir.</span>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={onCancel} 
              icon={<CloseOutlined />}
              style={{ marginRight: '10px' }}
            >
              İptal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              disabled={paymentRows.length === 0}
            >
              Kaydet
            </Button>
          </div>
          
          {/* Para üstü uyarı modalı */}
          <Modal
            title="Para Üstü Uyarısı"
            open={showAdvanceWarning}
            onOk={acceptAdvancePayment}
            onCancel={() => setShowAdvanceWarning(false)}
            okText="Evet, Avans Olarak Kaydet"
            cancelText="Hayır, İptal"
          >
            <p>
              Ödenen tutar fatura tutarından <Text strong style={{ color: 'red' }}>{advanceAmount.toFixed(2)} {currencyCode}</Text> fazladır.
            </p>
            <p>Fazla ödemeyi avans olarak kaydetmek istiyor musunuz?</p>
          </Modal>
        </Form>
      </div>
    </Card>
  );
};

export default CashPaymentForm;
