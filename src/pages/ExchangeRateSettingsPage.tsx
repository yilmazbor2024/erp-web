import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Switch, Select, message, Row, Col, Typography, Divider, InputNumber } from 'antd';
import { SaveOutlined, SyncOutlined } from '@ant-design/icons';
import { ExchangeRateSettings } from '../services/tcmbExchangeRateApi';
import tcmbExchangeRateApi from '../services/tcmbExchangeRateApi';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

const ExchangeRateSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await tcmbExchangeRateApi.getExchangeRateSettings();
      if (response.success) {
        form.setFieldsValue({
          enabled: response.data['ExchangeRateSync.Enabled'] === 'true',
          hour: parseInt(response.data['ExchangeRateSync.Hour']),
          minute: parseInt(response.data['ExchangeRateSync.Minute']),
          frequency: parseInt(response.data['ExchangeRateSync.Frequency'])
        });
      } else {
        message.error(response.message || 'Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata oluştu:', error);
      message.error('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const settings: Partial<ExchangeRateSettings> = {
        'ExchangeRateSync.Enabled': values.enabled ? 'true' : 'false',
        'ExchangeRateSync.Hour': values.hour.toString(),
        'ExchangeRateSync.Minute': values.minute.toString(),
        'ExchangeRateSync.Frequency': values.frequency.toString()
      };

      const response = await tcmbExchangeRateApi.updateExchangeRateSettings(settings);
      if (response.success) {
        message.success('Döviz kuru ayarları başarıyla güncellendi');
      } else {
        message.error(response.message || 'Ayarlar güncellenemedi');
      }
    } catch (error) {
      console.error('Ayarlar güncellenirken hata oluştu:', error);
      message.error('Ayarlar güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    try {
      const success = await tcmbExchangeRateApi.syncDailyExchangeRates();
      if (success) {
        message.success('Döviz kurları başarıyla senkronize edildi');
      } else {
        message.error('Döviz kurları senkronize edilirken bir sorun oluştu');
      }
    } catch (error) {
      console.error('Manuel senkronizasyon sırasında hata oluştu:', error);
      message.error('Senkronizasyon sırasında bir hata oluştu');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="exchange-rate-settings-page">
      <Card title="Döviz Kuru Senkronizasyon Ayarları" bordered={false}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text type="secondary">
              Bu sayfada döviz kuru otomatik senkronizasyon ayarlarını yapılandırabilirsiniz.
              Ayarlar kaydedildikten sonra bir sonraki senkronizasyon çalışmasında geçerli olacaktır.
            </Text>
          </Col>
        </Row>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            enabled: true,
            hour: 8,
            minute: 30,
            frequency: 1
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="enabled"
                label="Otomatik Senkronizasyon"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Aktif"
                  unCheckedChildren="Pasif"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="frequency"
                label="Günlük Senkronizasyon Sıklığı"
                rules={[{ required: true, message: 'Sıklık gereklidir' }]}
              >
                <Select>
                  <Option value={1}>Günde 1 kez</Option>
                  <Option value={2}>Günde 2 kez</Option>
                  <Option value={3}>Günde 3 kez</Option>
                  <Option value={4}>Günde 4 kez</Option>
                  <Option value={6}>Günde 6 kez (4 saatte bir)</Option>
                  <Option value={8}>Günde 8 kez (3 saatte bir)</Option>
                  <Option value={12}>Günde 12 kez (2 saatte bir)</Option>
                  <Option value={24}>Günde 24 kez (saatte bir)</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Item
                name="hour"
                label="İlk Çalışma Saati"
                rules={[{ required: true, message: 'Saat gereklidir' }]}
              >
                <InputNumber min={0} max={23} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Item
                name="minute"
                label="İlk Çalışma Dakikası"
                rules={[{ required: true, message: 'Dakika gereklidir' }]}
              >
                <InputNumber min={0} max={59} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  style={{ marginRight: 16 }}
                >
                  Ayarları Kaydet
                </Button>
                <Button
                  type="default"
                  icon={<SyncOutlined />}
                  onClick={handleManualSync}
                  loading={syncLoading}
                >
                  Manuel Senkronizasyon
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider />

        <Row>
          <Col span={24}>
            <Title level={5}>Bilgilendirme</Title>
            <ul>
              <li>
                <Text>
                  <strong>Otomatik Senkronizasyon:</strong> Döviz kurlarının belirtilen zamanlarda otomatik olarak TCMB'den çekilmesini sağlar.
                </Text>
              </li>
              <li>
                <Text>
                  <strong>İlk Çalışma Saati/Dakikası:</strong> İlk senkronizasyonun yapılacağı saati belirtir. Eğer günde birden fazla senkronizasyon yapılacaksa, diğer zamanlar bu ilk zamana göre eşit aralıklarla hesaplanır.
                </Text>
              </li>
              <li>
                <Text>
                  <strong>Sıklık:</strong> Günde kaç kez senkronizasyon yapılacağını belirler. Örneğin, günde 2 kez seçilirse ve ilk çalışma saati 08:30 olarak ayarlanırsa, ikinci çalışma 20:30'da gerçekleşir.
                </Text>
              </li>
              <li>
                <Text>
                  <strong>Manuel Senkronizasyon:</strong> Ayarlardan bağımsız olarak hemen bir senkronizasyon başlatır. Otomatik senkronizasyon devre dışı bırakılsa bile bu buton ile manuel senkronizasyon yapılabilir.
                </Text>
              </li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ExchangeRateSettingsPage;
