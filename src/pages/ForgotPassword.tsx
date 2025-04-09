import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true);
      await authApi.forgotPassword({
        email: values.email,
        clientUrl: window.location.origin + '/reset-password'
      });
      message.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      navigate('/giris');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card title="Şifremi Unuttum" className="w-full max-w-md">
        <Form
          name="forgotPassword"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="E-posta"
            name="email"
            rules={[
              { required: true, message: 'Lütfen e-posta adresinizi girin' },
              { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-between">
              <Button type="primary" htmlType="submit" loading={loading}>
                Şifre Sıfırlama Bağlantısı Gönder
              </Button>
              <Button type="link" onClick={() => navigate('/giris')}>
                Giriş Yap
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
