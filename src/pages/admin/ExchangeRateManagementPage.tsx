import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  DatePicker, 
  Space, 
  Table, 
  message, 
  Tabs, 
  Typography, 
  Form, 
  Input, 
  Select,
  Modal,
  Spin
} from 'antd';
import { 
  ReloadOutlined, 
  DownloadOutlined, 
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { exchangeRateApi, ExchangeRate, ExchangeRateSource } from '../../services/exchangeRateApi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import axios from 'axios';
import { api } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

dayjs.locale('tr');

interface CurrencyOption {
  code: string;
  description: string;
}

const currencyOptions: CurrencyOption[] = [
  { code: 'USD', description: 'Amerikan Doları' },
  { code: 'EUR', description: 'Euro' },
  { code: 'GBP', description: 'İngiliz Sterlini' },
  { code: 'CHF', description: 'İsviçre Frangı' },
  { code: 'JPY', description: 'Japon Yeni' },
  { code: 'CAD', description: 'Kanada Doları' },
  { code: 'AUD', description: 'Avustralya Doları' },
  { code: 'RUB', description: 'Rus Rublesi' },
  { code: 'CNY', description: 'Çin Yuanı' },
  { code: 'SAR', description: 'Suudi Arabistan Riyali' },
  { code: 'AED', description: 'Birleşik Arap Emirlikleri Dirhemi' }
];

const ExchangeRateManagementPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingCentralBank, setFetchingCentralBank] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedTabKey, setSelectedTabKey] = useState<string>('centralBank');
  const [form] = Form.useForm();
  const [manualRateModalVisible, setManualRateModalVisible] = useState<boolean>(false);

  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const source = selectedTabKey === 'centralBank' 
        ? ExchangeRateSource.CENTRAL_BANK 
        : ExchangeRateSource.FREE_MARKET;
      
      const response = await exchangeRateApi.getExchangeRatesByDate(
        selectedDate.format('YYYY-MM-DD'),
        source
      );
      setExchangeRates(response);
    } catch (error) {
      console.error('Döviz kurları yüklenirken hata oluştu:', error);
      message.error('Döviz kurları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, [selectedDate, selectedTabKey]);

  const fetchCentralBankRates = async () => {
    setFetchingCentralBank(true);
    try {
      const response = await api.post('/api/exchange-rate-fetch/fetch-central-bank', null, {
        params: { date: selectedDate.format('YYYY-MM-DD') }
      });
      
      if (response.data.success) {
        message.success('Merkez Bankası döviz kurları başarıyla çekildi.');
        fetchExchangeRates(); // Kurları yeniden yükle
      } else {
        message.error(response.data.message || 'Döviz kurları çekilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Merkez Bankası döviz kurları çekilirken hata:', error);
      message.error('Merkez Bankası döviz kurları çekilirken bir hata oluştu');
    } finally {
      setFetchingCentralBank(false);
    }
  };

  const handleAddManualRate = () => {
    form.resetFields();
    setManualRateModalVisible(true);
  };

  const handleSaveManualRate = async () => {
    try {
      const values = await form.validateFields();
      
      const rateData = {
        date: selectedDate.format('YYYY-MM-DD'),
        currencyCode: values.currencyCode,
        relationCurrencyCode: "TRY",
        rate: values.rate,
        source: "FreeMarket",
        type: values.type
      };
      
      const response = await api.post('/api/exchange-rate-fetch/save-free-market', [rateData]);
      
      if (response.data.success) {
        message.success('Döviz kuru başarıyla kaydedildi.');
        setManualRateModalVisible(false);
        fetchExchangeRates(); // Kurları yeniden yükle
      } else {
        message.error(response.data.message || 'Döviz kuru kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Form doğrulama hatası:', error);
      message.error('Lütfen tüm alanları doğru şekilde doldurun.');
    }
  };

  const centralBankColumns = [
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
      title: 'Döviz Alış',
      dataIndex: 'bankForInformationPurposes',
      key: 'bankForInformationPurposes',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Döviz Satış',
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

  const freeMarketColumns = [
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
      title: 'Alış',
      dataIndex: 'freeMarketBuyingRate',
      key: 'freeMarketBuyingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    },
    {
      title: 'Satış',
      dataIndex: 'freeMarketSellingRate',
      key: 'freeMarketSellingRate',
      render: (value: number) => value ? value.toFixed(4) : '-',
    }
  ];

  return (
    <Card className="exchange-rate-management-page">
      <Title level={4}>Döviz Kuru Yönetimi</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <DatePicker 
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            format="DD.MM.YYYY"
          />
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchExchangeRates}
            loading={loading}
          >
            Yenile
          </Button>
        </Space>

        <Tabs 
          activeKey={selectedTabKey} 
          onChange={setSelectedTabKey}
        >
          <TabPane tab="T.C. Merkez Bankası" key="centralBank">
            <Space style={{ marginBottom: 16 }}>
              <Button 
                type="primary"
                icon={<DownloadOutlined />}
                onClick={fetchCentralBankRates}
                loading={fetchingCentralBank}
              >
                TCMB Kurlarını Çek
              </Button>
            </Space>
            
            <Table
              columns={centralBankColumns}
              dataSource={exchangeRates}
              rowKey={(record) => `${record.date}-${record.currencyCode}-${record.relationCurrencyCode}`}
              pagination={false}
              loading={loading}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
          
          <TabPane tab="Serbest Piyasa" key="freeMarket">
            <Space style={{ marginBottom: 16 }}>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddManualRate}
              >
                Manuel Kur Ekle
              </Button>
            </Space>
            
            <Table
              columns={freeMarketColumns}
              dataSource={exchangeRates}
              rowKey={(record) => `${record.date}-${record.currencyCode}-${record.relationCurrencyCode}`}
              pagination={false}
              loading={loading}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>
        </Tabs>
      </Space>

      <Modal
        title="Manuel Döviz Kuru Ekle"
        visible={manualRateModalVisible}
        onCancel={() => setManualRateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setManualRateModalVisible(false)}>
            İptal
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSaveManualRate}
          >
            Kaydet
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="currencyCode"
            label="Döviz Kodu"
            rules={[{ required: true, message: 'Lütfen döviz kodunu seçin' }]}
          >
            <Select placeholder="Döviz kodu seçin">
              {currencyOptions.map(currency => (
                <Option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Kur Tipi"
            rules={[{ required: true, message: 'Lütfen kur tipini seçin' }]}
          >
            <Select placeholder="Kur tipi seçin">
              <Option value="Buying">Alış</Option>
              <Option value="Selling">Satış</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="rate"
            label="Kur Değeri"
            rules={[{ required: true, message: 'Lütfen kur değerini girin' }]}
          >
            <Input type="number" step="0.0001" min="0" placeholder="Örn: 28.5432" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ExchangeRateManagementPage;
