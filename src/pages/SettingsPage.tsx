import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Form, Input, Button, Switch, Divider, message } from 'antd';
import { API_BASE_URL } from '../config/constants';
import DatabaseList from './settings/DatabaseList';
import UserDatabaseList from './settings/UserDatabaseList';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TabPane } = Tabs;

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('general');
  
  useEffect(() => {
    // URL'e göre aktif sekmeyi belirle
    if (location.pathname.includes('/settings/databases')) {
      setActiveTab('databases');
    } else if (location.pathname.includes('/settings/user-databases')) {
      setActiveTab('user-databases');
    } else {
      setActiveTab('general');
    }
  }, [location.pathname]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    // Tab değiştiğinde URL'i güncelle
    switch (key) {
      case 'databases':
        navigate('/settings/databases');
        break;
      case 'user-databases':
        navigate('/settings/user-databases');
        break;
      default:
        navigate('/settings');
        break;
    }
  };

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
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
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
                apiUrl: API_BASE_URL,
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
          
          <TabPane tab="Veritabanı Yönetimi" key="databases">
            <DatabaseList />
          </TabPane>
          
          <TabPane tab="Kullanıcı Veritabanı Yetkileri" key="user-databases">
            <UserDatabaseList />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage; 