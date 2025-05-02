import React, { useState } from 'react';
import { Form, Input, Button, message, Alert, Space } from 'antd';
import { authApi } from '../../services/api';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';

const ChangePassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    // Hata ve başarı durumlarını sıfırla
    setError(null);
    setSuccess(false);
    
    // Şifrelerin eşleşip eşleşmediğini kontrol et
    if (values.newPassword !== values.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    // Mevcut şifre ile yeni şifrenin aynı olup olmadığını kontrol et
    if (values.currentPassword === values.newPassword) {
      setError('Yeni şifre mevcut şifre ile aynı olamaz');
      return;
    }

    try {
      setLoading(true);
      console.log('Şifre değiştirme işlemi başlatılıyor...');
      
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      console.log('Şifre değiştirme başarılı');
      message.success('Şifreniz başarıyla değiştirildi');
      setSuccess(true);
      form.resetFields();
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      
      // Hata mesajını göster
      if (error instanceof Error) {
        setError(error.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Şifre değiştirme işlemi başarısız oldu. Lütfen tekrar deneyin.');
      }
      
      message.error('Şifre değiştirme işlemi başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert
          message="Hata"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {success && (
        <Alert
          message="Başarılı"
          description="Şifreniz başarıyla değiştirildi."
          type="success"
          showIcon
          closable
          onClose={() => setSuccess(false)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form
        form={form}
        name="changePassword"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          label="Mevcut Şifre"
          name="currentPassword"
          rules={[{ required: true, message: 'Lütfen mevcut şifrenizi girin' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Mevcut şifrenizi girin" />
        </Form.Item>

        <Form.Item
          label="Yeni Şifre"
          name="newPassword"
          rules={[
            { required: true, message: 'Lütfen yeni şifrenizi girin' },
            { min: 6, message: 'Şifre en az 6 karakter olmalıdır' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifrenizi girin" />
        </Form.Item>

        <Form.Item
          label="Yeni Şifre (Tekrar)"
          name="confirmPassword"
          rules={[
            { required: true, message: 'Lütfen yeni şifrenizi tekrar girin' },
            { min: 6, message: 'Şifre en az 6 karakter olmalıdır' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Girdiğiniz şifreler eşleşmiyor!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifrenizi tekrar girin" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<CheckCircleOutlined />}
            block
          >
            Şifreyi Değiştir
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePassword;
