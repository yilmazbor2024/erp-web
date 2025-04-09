import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { authApi } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (!token || !email) {
      message.error('Geçersiz şifre sıfırlama bağlantısı');
      return;
    }

    if (values.password !== values.confirmPassword) {
      message.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        token,
        email,
        newPassword: values.password
      });
      message.success('Şifreniz başarıyla sıfırlandı');
      navigate('/giris');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <p className="text-center text-red-500">Geçersiz şifre sıfırlama bağlantısı</p>
          <Button type="primary" block onClick={() => navigate('/giris')}>
            Giriş Sayfasına Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card title="Şifre Sıfırlama" className="w-full max-w-md">
        <Form
          name="resetPassword"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Yeni Şifre"
            name="password"
            rules={[
              { required: true, message: 'Lütfen yeni şifrenizi girin' },
              { min: 8, message: 'Şifre en az 8 karakter olmalıdır' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Yeni Şifre (Tekrar)"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Lütfen şifrenizi tekrar girin' },
              { min: 8, message: 'Şifre en az 8 karakter olmalıdır' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Şifreyi Sıfırla
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
