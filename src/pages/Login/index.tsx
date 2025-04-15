import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  Alert,
  Space,
} from 'antd';
import { UserOutlined, LockOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      console.log('Login attempt with:', values);
      await login(values.email, values.password);
      console.log('Login successful, navigating to /');
      navigate('/');
    } catch (err: any) {
      console.log('Login error:', err);
      
      // Check for specific error types
      if (err.response?.status === 400) {
        setError('Geçersiz kullanıcı adı veya şifre.');
      } else if (err.response?.status === 401) {
        setError('Giriş bilgileriniz yanlış. Lütfen tekrar deneyiniz.');
      } else if (err.response?.status === 500) {
        setError('Sunucu hatası. Lütfen daha sonra tekrar deneyiniz veya sistem yöneticisiyle iletişime geçiniz.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol ediniz.');
      } else {
        setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.');
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5' 
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '1rem' }}>
            <AppstoreOutlined />
          </div>
          <Title level={3}>ERP Sistemi Giriş</Title>
        </div>

        {error && (
          <Alert
            message="Giriş Hatası"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Lütfen e-posta adresinizi giriniz!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="E-posta" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Lütfen şifrenizi giriniz!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Şifre"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              size="large"
              loading={loading}
            >
              Giriş Yap
            </Button>
          </Form.Item>
          
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <a href="#/forgot-password">Şifremi Unuttum</a>
          </Space>
        </Form>

        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
              Geliştirme Modu: API bağlantısı olmadan test etmek için "Skip Login" butonu kullanabilirsiniz.
            </Typography.Text>
            <Button 
              type="link"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => {
                localStorage.setItem('accessToken', 'mock-token-for-development');
                navigate('/');
              }}
            >
              Login'i Atla (Geliştirme Modu)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login; 