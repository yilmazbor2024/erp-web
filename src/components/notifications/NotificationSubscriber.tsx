import React, { useEffect, useState } from 'react';
import { Button, Card, Alert, Spin, Typography, Space, Switch } from 'antd';
import { BellOutlined, BellFilled, InfoCircleOutlined } from '@ant-design/icons';
import notificationService from '../../services/notificationService';

const { Title, Text, Paragraph } = Typography;

/**
 * Bildirim aboneliği bileşeni
 * Kullanıcıların push notification'lara abone olmalarını sağlar
 */
const NotificationSubscriber: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Bileşen yüklendiğinde abonelik durumunu kontrol et
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Abonelik durumunu kontrol et
  const checkSubscriptionStatus = async () => {
    setIsLoading(true);
    try {
      // Tarayıcı desteğini kontrol et
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      // Push Manager'ı başlat
      await notificationService.initializePushManager();
      
      // Abonelik durumunu kontrol et
      const subscribed = await notificationService.checkSubscriptionStatus();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Abonelik durumu kontrol edilirken hata oluştu:', error);
      setMessage('Abonelik durumu kontrol edilirken hata oluştu.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bildirimlere abone ol
  const handleSubscribe = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await notificationService.subscribeToPushNotifications();
      if (result) {
        setIsSubscribed(true);
        setMessage('Bildirimlere başarıyla abone oldunuz.');
        setMessageType('success');
      } else {
        setMessage('Bildirimlere abone olunamadı. Lütfen tarayıcı izinlerini kontrol edin.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Abone olunurken hata oluştu:', error);
      setMessage('Abone olunurken hata oluştu.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bildirim aboneliğini iptal et
  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await notificationService.unsubscribeFromPushNotifications();
      if (result) {
        setIsSubscribed(false);
        setMessage('Bildirim aboneliğiniz iptal edildi.');
        setMessageType('info');
      } else {
        setMessage('Bildirim aboneliği iptal edilemedi.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Abonelik iptal edilirken hata oluştu:', error);
      setMessage('Abonelik iptal edilirken hata oluştu.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Test bildirimi gönder (sadece admin kullanıcıları için)
  const handleSendTestNotification = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await notificationService.sendTestNotification();
      if (response.success) {
        setMessage('Test bildirimi gönderildi.');
        setMessageType('success');
      } else {
        setMessage(`Test bildirimi gönderilemedi: ${response.message}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Test bildirimi gönderilirken hata oluştu:', error);
      setMessage('Test bildirimi gönderilirken hata oluştu.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bildirim durumunu değiştir (switch ile)
  const handleToggleSubscription = async (checked: boolean) => {
    if (checked) {
      await handleSubscribe();
    } else {
      await handleUnsubscribe();
    }
  };

  // Tarayıcı desteği yoksa
  if (!isSupported) {
    return (
      <Card title="Bildirim Ayarları" bordered={false}>
        <Alert
          message="Tarayıcı Desteği Yok"
          description="Tarayıcınız push bildirimlerini desteklemiyor. Lütfen Chrome, Firefox, Edge veya Safari gibi modern bir tarayıcı kullanın."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title="Bildirim Ayarları" bordered={false}>
      <Spin spinning={isLoading}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {message && <Alert message={message} type={messageType} showIcon closable />}
          
          <div style={{ marginBottom: 16 }}>
            <Paragraph>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Veritabanı yedekleme işlemleri tamamlandığında bildirim almak için push bildirimlerini etkinleştirin.
            </Paragraph>
            <Paragraph>
              <Text strong>Not:</Text> Bildirimleri alabilmek için tarayıcınızın bildirim izinlerini kabul etmeniz gerekir.
              Bildirimleri, tarayıcınız kapalı olduğunda bile alabilirsiniz.
            </Paragraph>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Text strong style={{ marginRight: 16 }}>Bildirimler:</Text>
            <Switch
              checked={isSubscribed}
              onChange={handleToggleSubscription}
              loading={isLoading}
              checkedChildren={<BellFilled />}
              unCheckedChildren={<BellOutlined />}
            />
            <Text style={{ marginLeft: 8 }}>{isSubscribed ? 'Açık' : 'Kapalı'}</Text>
          </div>
          
          {isSubscribed && (
            <Button 
              type="default" 
              onClick={handleSendTestNotification} 
              disabled={isLoading}
            >
              Test Bildirimi Gönder
            </Button>
          )}
        </Space>
      </Spin>
    </Card>
  );
};

export default NotificationSubscriber;
