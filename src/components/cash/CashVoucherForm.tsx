import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Tabs, Card, Row, Col, Typography, Table, message, Spin } from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import cashVoucherApi from '../../services/cashVoucherApi';
import currencyApi from '../../services/currencyApi';
import { exchangeRateApi } from '../../services/exchangeRateApi';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

// Kasa Fiş Tipleri
export enum CashVoucherType {
  RECEIPT = 'RECEIPT', // Tahsilat
  PAYMENT = 'PAYMENT', // Tediye
  TRANSFER = 'TRANSFER' // Virman
}

// Kasa Fiş Tipi Adları
const voucherTypeNames = {
  [CashVoucherType.RECEIPT]: 'Tahsilat',
  [CashVoucherType.PAYMENT]: 'Tediye',
  [CashVoucherType.TRANSFER]: 'Virman'
};

// Kasa Hesabı Arayüzü
interface CashAccount {
  cashAccountCode: string;
  cashAccountName: string;
  currencyCode: string;
  officeCode: string;
  balance?: number;
  debit?: number;
  credit?: number;
}

// Para Birimi Arayüzü
interface Currency {
  code: string;
  name: string;
  description: string;
}

// Kasa Fiş Satırı Arayüzü
interface CashVoucherLine {
  id: string;
  description: string;
  amount: number;
  accountCode?: string; // Karşı hesap kodu (müşteri/tedarikçi)
  accountName?: string; // Karşı hesap adı
}

// Kasa Fiş Form Props
interface CashVoucherFormProps {
  voucherType: CashVoucherType;
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

const CashVoucherForm: React.FC<CashVoucherFormProps> = ({
  voucherType,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [voucherLines, setVoucherLines] = useState<CashVoucherLine[]>([]);
  const [activeTab, setActiveTab] = useState<string>('header');
  const [selectedCashAccount, setSelectedCashAccount] = useState<CashAccount | null>(null);
  const [accountBalance, setAccountBalance] = useState<{debit: number, credit: number, balance: number}>({
    debit: 0,
    credit: 0,
    balance: 0
  });
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Sayfa yüklendiğinde
  useEffect(() => {
    fetchCashAccounts();
    fetchCurrencies();
    
    // Form başlangıç değerlerini ayarla
    form.setFieldsValue({
      officeCode: 'M', // Ofis kodu otomatik M
      voucherDate: moment(), // Bugünün tarihi
      currencyCode: 'TRY', // Varsayılan para birimi TRY
      exchangeRate: 1 // Varsayılan kur 1
    });
  }, [form]);

  // Kasa hesaplarını getir
  const fetchCashAccounts = async () => {
    setLoading(true);
    try {
      const response = await cashVoucherApi.getCashAccounts('M'); // Ofis kodu M
      if (response.success) {
        setCashAccounts(response.data);
      } else {
        message.error('Kasa hesapları yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kasa hesapları getirme hatası:', error);
      message.error('Kasa hesapları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Para birimlerini getir
  const fetchCurrencies = async () => {
    try {
      const response = await currencyApi.getCurrencies();
      if (Array.isArray(response)) {
        // API doğrudan dizi döndürüyorsa
        setCurrencies(response as unknown as Currency[]);
      } else if (response && typeof response === 'object' && 'success' in response) {
        // API başarı durumu ve data içeren bir obje döndürüyorsa
        const responseObj = response as unknown as { success: boolean, data: Currency[] };
        if (responseObj.success && responseObj.data) {
          setCurrencies(responseObj.data);
        }
      } else {
        message.error('Para birimleri yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Para birimleri getirme hatası:', error);
      message.error('Para birimleri yüklenirken bir hata oluştu');
    }
  };

  // Kasa hesabı seçildiğinde
  const handleCashAccountChange = async (cashAccountCode: string) => {
    const selectedAccount = cashAccounts.find(account => account.cashAccountCode === cashAccountCode);
    if (selectedAccount) {
      setSelectedCashAccount(selectedAccount);
      
      // Kasa hesabının para birimini form'a set et
      form.setFieldsValue({ currencyCode: selectedAccount.currencyCode });
      
      // Kasa hesap detaylarını getir
      try {
        const response = await cashVoucherApi.getCashAccountDetails(cashAccountCode);
        if (response.success) {
          setAccountBalance({
            debit: response.data.debit || 0,
            credit: response.data.credit || 0,
            balance: response.data.balance || 0
          });
        }
      } catch (error) {
        console.error('Kasa hesap detayları getirme hatası:', error);
      }
    }
  };

  // Para birimi değiştiğinde
  const handleCurrencyChange = async (currencyCode: string) => {
    if (currencyCode === 'TRY') {
      setExchangeRate(1);
      form.setFieldsValue({ exchangeRate: 1 });
    } else {
      try {
        // ExchangeRateSource tipini kontrol et
        type ExchangeRateSourceType = Parameters<typeof exchangeRateApi.getLatestExchangeRates>[0];
        const source: ExchangeRateSourceType = 'CENTRAL_BANK' as ExchangeRateSourceType;
        
        const response = await exchangeRateApi.getLatestExchangeRates(source);
        
        // API yanıtının yapısını kontrol et
        if (Array.isArray(response)) {
          // Doğrudan dizi döndürüyorsa
          const rateData = response.find((rate: any) => rate.currencyCode === currencyCode) as any;
          if (rateData && rateData.rate) {
            setExchangeRate(rateData.rate || 1);
            form.setFieldsValue({ exchangeRate: rateData.rate || 1 });
          }
        } else if (response && typeof response === 'object' && 'success' in response) {
          // Başarı durumu ve data içeren bir obje döndürüyorsa
          const responseObj = response as unknown as { success: boolean, data: any[] };
          if (responseObj.success && responseObj.data) {
            const rateData = responseObj.data.find((rate: any) => rate.currencyCode === currencyCode);
            if (rateData && rateData.rate) {
              setExchangeRate(rateData.rate || 1);
              form.setFieldsValue({ exchangeRate: rateData.rate || 1 });
            }
          }
        }
      } catch (error) {
        console.error('Döviz kuru getirme hatası:', error);
      }
    }
  };

  // Yeni satır ekle
  const addVoucherLine = () => {
    const newLine: CashVoucherLine = {
      id: Date.now().toString(),
      description: '',
      amount: 0
    };
    setVoucherLines([...voucherLines, newLine]);
    calculateTotal([...voucherLines, newLine]);
  };

  // Satır sil
  const removeVoucherLine = (id: string) => {
    const updatedLines = voucherLines.filter(line => line.id !== id);
    setVoucherLines(updatedLines);
    calculateTotal(updatedLines);
  };

  // Satır değişikliği
  const handleLineChange = (id: string, field: string, value: any) => {
    const updatedLines = voucherLines.map(line => {
      if (line.id === id) {
        return { ...line, [field]: value };
      }
      return line;
    });
    setVoucherLines(updatedLines);
    
    if (field === 'amount') {
      calculateTotal(updatedLines);
    }
  };

  // Toplam tutarı hesapla
  const calculateTotal = (lines: CashVoucherLine[]) => {
    const total = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
    setTotalAmount(total);
  };

  // Formu gönder
  const handleSubmit = async (values: any) => {
    // Satır kontrolü
    if (voucherLines.length === 0) {
      message.error('En az bir işlem satırı eklemelisiniz');
      return;
    }

    // Kasa hesabı kontrolü
    if (!selectedCashAccount) {
      message.error('Lütfen bir kasa hesabı seçin');
      return;
    }

    setLoading(true);
    try {
      // API isteği için veri hazırla
      const requestData = {
        voucherType,
        cashAccountCode: selectedCashAccount.cashAccountCode,
        officeCode: values.officeCode || 'M',
        voucherDate: values.voucherDate.format('YYYY-MM-DD'),
        voucherNumber: values.voucherNumber || '',
        documentNumber: values.documentNumber || '',
        currencyCode: values.currencyCode,
        exchangeRate: values.exchangeRate,
        description: values.description || '',
        lines: voucherLines.map(line => ({
          description: line.description,
          amount: line.amount,
          accountCode: line.accountCode || '',
          accountName: line.accountName || ''
        }))
      };

      // API isteği gönder
      const response = await cashVoucherApi.createCashVoucher(requestData);
      if (response.success) {
        message.success(`${voucherTypeNames[voucherType]} işlemi başarıyla kaydedildi`);
        
        // Formu sıfırla
        form.resetFields();
        setVoucherLines([]);
        setTotalAmount(0);
        
        // Başarı callback'i
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        message.error(response.error || `${voucherTypeNames[voucherType]} işlemi kaydedilirken bir hata oluştu`);
      }
    } catch (error: any) {
      console.error(`${voucherTypeNames[voucherType]} işlemi hatası:`, error);
      message.error(error.message || `${voucherTypeNames[voucherType]} işlemi kaydedilirken bir hata oluştu`);
    } finally {
      setLoading(false);
    }
  };

  // Satırlar tablosu sütunları
  const columns = [
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: CashVoucherLine) => (
        <Input
          value={text}
          onChange={(e) => handleLineChange(record.id, 'description', e.target.value)}
          placeholder="Açıklama giriniz"
        />
      )
    },
    {
      title: 'Tutar',
      dataIndex: 'amount',
      key: 'amount',
      width: 200,
      render: (amount: number, record: CashVoucherLine) => (
        <InputNumber
          value={amount}
          onChange={(value) => handleLineChange(record.id, 'amount', value || 0)}
          style={{ width: '100%' }}
          min={0}
          precision={2}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value: string | undefined) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') || '0')}
        />
      )
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 100,
      render: (_: any, record: CashVoucherLine) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeVoucherLine(record.id)}
        />
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          officeCode: 'M',
          voucherDate: moment(),
          currencyCode: 'TRY',
          exchangeRate: 1
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Başlık" key="header">
            <Card>
              <Row gutter={16}>
                <Col span={12}>
                  <Title level={5}>Anahtar</Title>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Kasa Fiş Ref. Numarası"
                        name="voucherNumber"
                      >
                        <Input placeholder="Otomatik oluşturulacak" disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Kasa Fiş Tipi"
                        name="voucherType"
                        initialValue={voucherTypeNames[voucherType]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Belge Numarası"
                        name="documentNumber"
                      >
                        <Input placeholder="Belge numarası giriniz" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Belge Tarihi"
                        name="voucherDate"
                        rules={[{ required: true, message: 'Lütfen belge tarihi seçin' }]}
                      >
                        <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col span={12}>
                  <Title level={5}>Pozisyon</Title>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Ofis"
                        name="officeCode"
                        rules={[{ required: true, message: 'Lütfen ofis seçin' }]}
                      >
                        <Select disabled>
                          <Option value="M">Merkez Ofis</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Nakit Kasa Hesap Kodu"
                        name="cashAccountCode"
                        rules={[{ required: true, message: 'Lütfen kasa hesabı seçin' }]}
                      >
                        <Select
                          placeholder="Kasa hesabı seçin"
                          onChange={handleCashAccountChange}
                          showSearch
                          optionFilterProp="children"
                        >
                          {cashAccounts.map(account => (
                            <Option key={account.cashAccountCode} value={account.cashAccountCode}>
                              {account.cashAccountName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  {selectedCashAccount && (
                    <Card size="small" title="Hesap Bakiyesi">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Borç</Text>
                          <div>{accountBalance.debit.toFixed(2)}</div>
                        </Col>
                        <Col span={8}>
                          <Text>Alacak</Text>
                          <div>{accountBalance.credit.toFixed(2)}</div>
                        </Col>
                        <Col span={8}>
                          <Text>Bakiye</Text>
                          <div>{accountBalance.balance.toFixed(2)}</div>
                        </Col>
                      </Row>
                    </Card>
                  )}
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Title level={5}>Diğer</Title>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Açıklama"
                        name="description"
                      >
                        <TextArea rows={4} placeholder="Açıklama giriniz" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Title level={5}>Para Birimi</Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Yerel Para Birimi"
                        name="localCurrency"
                        initialValue="TRY"
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Doküman Para Birimi"
                        name="currencyCode"
                        rules={[{ required: true, message: 'Lütfen para birimi seçin' }]}
                      >
                        <Select
                          placeholder="Para birimi seçin"
                          onChange={handleCurrencyChange}
                        >
                          {currencies.map(currency => (
                            <Option key={currency.code} value={currency.code}>
                              {currency.code} - {currency.description}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Döviz Kuru"
                        name="exchangeRate"
                        rules={[{ required: true, message: 'Lütfen döviz kuru girin' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0.0001}
                          precision={4}
                          step={0.0001}
                          disabled={form.getFieldValue('currencyCode') === 'TRY'}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </TabPane>
          <TabPane tab="Satırlar" key="lines">
            <Card>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addVoucherLine}
                style={{ marginBottom: 16 }}
              >
                Yeni Satır Ekle
              </Button>
              <Table
                columns={columns}
                dataSource={voucherLines}
                rowKey="id"
                pagination={false}
                bordered
              />
            </Card>
          </TabPane>
          <TabPane tab="Toplam" key="total">
            <Card>
              <Row gutter={16}>
                <Col span={24}>
                  <Title level={4}>Toplam: {totalAmount.toFixed(2)} {form.getFieldValue('currencyCode')}</Title>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button onClick={onCancel} icon={<CloseOutlined />} style={{ marginRight: 8 }}>
            İptal
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            Kaydet
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default CashVoucherForm;
