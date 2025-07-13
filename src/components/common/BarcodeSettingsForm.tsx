import React, { useState } from 'react';
import { Form, Input, InputNumber, Switch, Select, Button, Card, Row, Col, Tabs, Alert, message } from 'antd';
import { SaveOutlined, ReloadOutlined, UndoOutlined } from '@ant-design/icons';
import { useBarcodeSettings } from '../../contexts/BarcodeSettingsContext';
import { BarcodeType, BarcodeSettings } from '../../config/barcodeSettings';

const { TabPane } = Tabs;
const { Option } = Select;

const BarcodeSettingsForm: React.FC = () => {
  const { 
    userSettings, 
    globalSettings, 
    activeSettings,
    updateUserSettings, 
    resetUserSettings,
    reloadSettings,
    loading
  } = useBarcodeSettings();
  
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Form değerlerini kaydet
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      // Değerleri doğru formata dönüştür
      // Tip uyumlu ayarlar oluştur
      const settings: Partial<BarcodeSettings> = {
        activeType: values.activeType,
        autoProcess: values.autoProcess,
        minLength: values.minLength,
        maxLength: values.maxLength,
        allowAlphanumeric: values.allowAlphanumeric,
        validateChecksum: values.validateChecksum,
        clearDelay: values.clearDelay,
        debounceTime: values.debounceTime,
        prefix: values.prefix || '',
        suffix: values.suffix || '',
        typeSettings: {
          [BarcodeType.EAN13]: {
            length: values.ean13Length as number,  // number tipine dönüştür
            validateChecksum: values.ean13ValidateChecksum
          },
          [BarcodeType.EAN8]: {
            length: values.ean8Length as number,  // number tipine dönüştür
            validateChecksum: values.ean8ValidateChecksum
          },
          [BarcodeType.CODE39]: {
            minLength: values.code39MinLength,
            maxLength: values.code39MaxLength,
            validateChecksum: values.code39ValidateChecksum
          },
          [BarcodeType.CODE128]: {
            minLength: values.code128MinLength,
            maxLength: values.code128MaxLength,
            validateChecksum: values.code128ValidateChecksum
          },
          [BarcodeType.QR]: {
            minLength: values.qrMinLength,
            maxLength: values.qrMaxLength
          },
          [BarcodeType.CUSTOM]: {
            pattern: values.customPattern || '.*',
            description: values.customDescription || 'Özel barkod formatı'
          }
        }
      };
      
      const success = await updateUserSettings(settings);
      if (success) {
        message.success('Barkod ayarları başarıyla kaydedildi');
      } else {
        message.error('Barkod ayarları kaydedilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      message.error('Barkod ayarları kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };
  
  // Ayarları sıfırla
  const handleReset = async () => {
    try {
      const success = await resetUserSettings();
      if (success) {
        message.success('Barkod ayarları varsayılan değerlere sıfırlandı');
        form.resetFields();
      } else {
        message.error('Barkod ayarları sıfırlanırken bir hata oluştu');
      }
    } catch (error) {
      console.error('Ayarlar sıfırlanırken hata:', error);
      message.error('Barkod ayarları sıfırlanırken bir hata oluştu');
    }
  };
  
  // Form başlangıç değerlerini ayarla
  React.useEffect(() => {
    if (!loading) {
      form.setFieldsValue({
        activeType: activeSettings.activeType,
        autoProcess: activeSettings.autoProcess,
        minLength: activeSettings.minLength,
        maxLength: activeSettings.maxLength,
        allowAlphanumeric: activeSettings.allowAlphanumeric,
        validateChecksum: activeSettings.validateChecksum,
        clearDelay: activeSettings.clearDelay,
        debounceTime: activeSettings.debounceTime,
        prefix: activeSettings.prefix,
        suffix: activeSettings.suffix,
        
        // Tip bazlı ayarlar
        ean13ValidateChecksum: activeSettings.typeSettings[BarcodeType.EAN13].validateChecksum,
        ean8ValidateChecksum: activeSettings.typeSettings[BarcodeType.EAN8].validateChecksum,
        
        code39MinLength: activeSettings.typeSettings[BarcodeType.CODE39].minLength,
        code39MaxLength: activeSettings.typeSettings[BarcodeType.CODE39].maxLength,
        code39ValidateChecksum: activeSettings.typeSettings[BarcodeType.CODE39].validateChecksum,
        
        code128MinLength: activeSettings.typeSettings[BarcodeType.CODE128].minLength,
        code128MaxLength: activeSettings.typeSettings[BarcodeType.CODE128].maxLength,
        code128ValidateChecksum: activeSettings.typeSettings[BarcodeType.CODE128].validateChecksum,
        
        qrMinLength: activeSettings.typeSettings[BarcodeType.QR].minLength,
        qrMaxLength: activeSettings.typeSettings[BarcodeType.QR].maxLength,
        
        customPattern: activeSettings.typeSettings[BarcodeType.CUSTOM].pattern,
        customDescription: activeSettings.typeSettings[BarcodeType.CUSTOM].description
      });
    }
  }, [form, activeSettings, loading]);
  
  if (loading) {
    return <div>Ayarlar yükleniyor...</div>;
  }
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      initialValues={{
        activeType: activeSettings.activeType,
        autoProcess: activeSettings.autoProcess,
        minLength: activeSettings.minLength,
        maxLength: activeSettings.maxLength,
        allowAlphanumeric: activeSettings.allowAlphanumeric,
        validateChecksum: activeSettings.validateChecksum,
        clearDelay: activeSettings.clearDelay,
        debounceTime: activeSettings.debounceTime,
        prefix: activeSettings.prefix,
        suffix: activeSettings.suffix
      }}
    >
      <Alert
        message="Barkod Ayarları"
        description="Bu ayarlar kullanıcıya özeldir ve veritabanında saklanır. Değişiklikler sadece sizin hesabınızı etkiler."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Genel Ayarlar" key="general">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Temel Ayarlar" size="small">
                <Form.Item
                  label="Aktif Barkod Tipi"
                  name="activeType"
                  rules={[{ required: true, message: 'Lütfen bir barkod tipi seçin' }]}
                >
                  <Select>
                    <Option value={BarcodeType.EAN13}>EAN-13</Option>
                    <Option value={BarcodeType.EAN8}>EAN-8</Option>
                    <Option value={BarcodeType.CODE39}>Code 39</Option>
                    <Option value={BarcodeType.CODE128}>Code 128</Option>
                    <Option value={BarcodeType.QR}>QR Kod</Option>
                    <Option value={BarcodeType.CUSTOM}>Özel Format</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  label="Otomatik İşleme"
                  name="autoProcess"
                  valuePropName="checked"
                  tooltip="Barkod girişi tamamlandığında otomatik olarak işlensin mi?"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  label="Alfanumerik Karakterlere İzin Ver"
                  name="allowAlphanumeric"
                  valuePropName="checked"
                  tooltip="Barkodlarda harf ve özel karakterlere izin verilsin mi?"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  label="Kontrol Basamağı Doğrulama"
                  name="validateChecksum"
                  valuePropName="checked"
                  tooltip="Barkod kontrol basamağı doğrulaması yapılsın mı?"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Gelişmiş Ayarlar" size="small">
                <Form.Item
                  label="Minimum Barkod Uzunluğu"
                  name="minLength"
                  rules={[{ required: true, message: 'Lütfen minimum uzunluk girin' }]}
                >
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Maksimum Barkod Uzunluğu (0 = sınırsız)"
                  name="maxLength"
                  rules={[{ required: true, message: 'Lütfen maksimum uzunluk girin' }]}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Temizleme Gecikmesi (ms)"
                  name="clearDelay"
                  tooltip="Barkod okunduktan sonra input alanının temizlenmesi için bekleme süresi"
                  rules={[{ required: true, message: 'Lütfen temizleme gecikmesi girin' }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Debounce Süresi (ms)"
                  name="debounceTime"
                  tooltip="Barkod girişi tamamlandıktan sonra işleme için bekleme süresi"
                  rules={[{ required: true, message: 'Lütfen debounce süresi girin' }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="Barkod Okuyucu Ayarları" size="small" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Barkod Öneki"
                      name="prefix"
                      tooltip="Bazı barkod okuyucular barkodun başına önek ekler"
                    >
                      <Input placeholder="Örn: %B" />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      label="Barkod Soneki"
                      name="suffix"
                      tooltip="Bazı barkod okuyucular barkodun sonuna sonek ekler"
                    >
                      <Input placeholder="Örn: Enter" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="EAN-13 / EAN-8" key="ean">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="EAN-13 Ayarları" size="small">
                <Form.Item
                  label="Kontrol Basamağı Doğrulama"
                  name="ean13ValidateChecksum"
                  valuePropName="checked"
                  tooltip="EAN-13 barkodlarında kontrol basamağı doğrulaması yapılsın mı?"
                >
                  <Switch />
                </Form.Item>
                
                <Alert
                  message="EAN-13 Bilgi"
                  description="EAN-13 barkodları tam olarak 13 haneden oluşur ve son hane kontrol basamağıdır."
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="EAN-8 Ayarları" size="small">
                <Form.Item
                  label="Kontrol Basamağı Doğrulama"
                  name="ean8ValidateChecksum"
                  valuePropName="checked"
                  tooltip="EAN-8 barkodlarında kontrol basamağı doğrulaması yapılsın mı?"
                >
                  <Switch />
                </Form.Item>
                
                <Alert
                  message="EAN-8 Bilgi"
                  description="EAN-8 barkodları tam olarak 8 haneden oluşur ve son hane kontrol basamağıdır."
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="Code 39 / 128" key="code">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Code 39 Ayarları" size="small">
                <Form.Item
                  label="Minimum Uzunluk"
                  name="code39MinLength"
                  rules={[{ required: true, message: 'Lütfen minimum uzunluk girin' }]}
                >
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Maksimum Uzunluk (0 = sınırsız)"
                  name="code39MaxLength"
                  rules={[{ required: true, message: 'Lütfen maksimum uzunluk girin' }]}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Kontrol Basamağı Doğrulama"
                  name="code39ValidateChecksum"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Code 128 Ayarları" size="small">
                <Form.Item
                  label="Minimum Uzunluk"
                  name="code128MinLength"
                  rules={[{ required: true, message: 'Lütfen minimum uzunluk girin' }]}
                >
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Maksimum Uzunluk (0 = sınırsız)"
                  name="code128MaxLength"
                  rules={[{ required: true, message: 'Lütfen maksimum uzunluk girin' }]}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Kontrol Basamağı Doğrulama"
                  name="code128ValidateChecksum"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="QR / Özel" key="custom">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="QR Kod Ayarları" size="small">
                <Form.Item
                  label="Minimum Uzunluk"
                  name="qrMinLength"
                  rules={[{ required: true, message: 'Lütfen minimum uzunluk girin' }]}
                >
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  label="Maksimum Uzunluk (0 = sınırsız)"
                  name="qrMaxLength"
                  rules={[{ required: true, message: 'Lütfen maksimum uzunluk girin' }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Özel Format Ayarları" size="small">
                <Form.Item
                  label="Regex Pattern"
                  name="customPattern"
                  tooltip="Özel barkod formatı için regex pattern"
                >
                  <Input placeholder="Örn: ^[A-Z]{3}\\d{5}$" />
                </Form.Item>
                
                <Form.Item
                  label="Format Açıklaması"
                  name="customDescription"
                >
                  <Input placeholder="Örn: 3 harf + 5 rakam" />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
      
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => reloadSettings()}
        >
          Yenile
        </Button>
        <Button 
          icon={<UndoOutlined />} 
          onClick={handleReset}
        >
          Sıfırla
        </Button>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          htmlType="submit"
          loading={saving}
        >
          Kaydet
        </Button>
      </div>
    </Form>
  );
};

export default BarcodeSettingsForm;
