import React from 'react';
import { Card, Tabs, Typography, Form, Input, Button, Switch, Divider, message } from 'antd';

const { Title } = Typography;
const { TabPane } = Tabs;

const SettingsPage: React.FC = () => {
  const handleSaveGeneralSettings = (values: any) => {
    console.log('General settings saved:', values);
    message.success('Genel ayarlar kaydedildi');
  };

  const handleSaveNotificationSettings = (values: any) => {
    console.log('Notification settings saved:', values);
    message.success('Bildirim ayarları kaydedildi');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Ayarlar</Title>
      <Divider />
      
      <Card>
        <Tabs defaultActiveKey="general">
          <TabPane tab="Genel Ayarlar" key="general">
            <Form
              layout="vertical"
              onFinish={handleSaveGeneralSettings}
              initialValues={{
                companyName: 'ERP Entegrasyon',
                language: 'tr',
                timezone: 'Europe/Istanbul',
                dateFormat: 'DD/MM/YYYY'
              }}
            >
              <Form.Item
                label="Firma Adı"
                name="companyName"
                rules={[{ required: true, message: 'Lütfen firma adını giriniz' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Dil"
                name="language"
                rules={[{ required: true, message: 'Lütfen dil seçiniz' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Saat Dilimi"
                name="timezone"
                rules={[{ required: true, message: 'Lütfen saat dilimi seçiniz' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Tarih Formatı"
                name="dateFormat"
                rules={[{ required: true, message: 'Lütfen tarih formatı seçiniz' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Kaydet
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="Bildirim Ayarları" key="notifications">
            <Form
              layout="vertical"
              onFinish={handleSaveNotificationSettings}
              initialValues={{
                emailNotifications: true,
                pushNotifications: false,
                smsNotifications: false
              }}
            >
              <Form.Item
                label="E-posta Bildirimleri"
                name="emailNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                label="Push Bildirimleri"
                name="pushNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                label="SMS Bildirimleri"
                name="smsNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Kaydet
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="API Ayarları" key="api">
            <Form
              layout="vertical"
              initialValues={{
                apiUrl: 'http://localhost:5180',
                apiKey: '************************'
              }}
            >
              <Form.Item
                label="API URL"
                name="apiUrl"
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="API Key"
                name="apiKey"
              >
                <Input.Password />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary">
                  Kaydet
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage; 