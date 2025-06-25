import React, { useState, useEffect } from 'react';
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
  Select,
  Spin,
  message
} from 'antd';
import { UserOutlined, LockOutlined, AppstoreOutlined, DatabaseOutlined } from '@ant-design/icons';
import { getCurrentUserDatabases } from '../../services/userDatabaseService';
import { DatabaseDto } from '../../services/databaseService';

const { Title } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

interface DatabaseSelectFormValues {
  databaseId: string;
}

const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'selectDatabase'>('login');
  const [userDatabases, setUserDatabases] = useState<any[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState<boolean>(false);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');

  // Kullanıcının yetkili olduğu veritabanlarını getir
  const fetchUserDatabases = async () => {
    setLoadingDatabases(true);
    setError(null);
    try {
      const databases = await getCurrentUserDatabases();
      if (databases && databases.length > 0) {
        setUserDatabases(databases);
        
        // Eğer sadece bir veritabanı varsa otomatik seç
        if (databases.length === 1) {
          setSelectedDatabaseId(databases[0].databaseId);
        }
      } else {
        setError('Erişim yetkiniz olan veritabanı bulunamadı.');
        // Token'ları temizle ve login sayfasına dön
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setStep('login');
      }
    } catch (err: any) {
      console.error('Veritabanları yüklenirken hata:', err);
      setError('Veritabanları yüklenirken bir hata oluştu.');
    } finally {
      setLoadingDatabases(false);
    }
  };

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null);
    
    // Giriş bilgilerini doğrula
    if (!values.email || !values.password) {
      setError('E-posta ve şifre alanları zorunludur.');
      return;
    }
    
    // E-posta formatını doğrula
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      setError('Geçerli bir e-posta adresi giriniz.');
      return;
    }
    
    // Şifre uzunluğunu kontrol et
    if (values.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    
    try {
      console.log('Login attempt with:', values.email);
      
      // Giriş işlemini gerçekleştir
      await login(values.email, values.password);
      
      // Giriş başarılıysa veritabanı seçim adımına geç
      console.log('Login successful, fetching user databases');
      setStep('selectDatabase');
      fetchUserDatabases();
    } catch (err: any) {
      console.log('Login error:', err);
      
      // Hata mesajını doğrudan göster
      if (err instanceof Error) {
        setError(err.message);
      } else if (err.response?.status === 400) {
        setError('Geçersiz kullanıcı adı veya şifre.');
      } else if (err.response?.status === 401) {
        setError('Giriş bilgileriniz yanlış. Lütfen tekrar deneyiniz.');
      } else if (err.response?.status === 404) {
        setError('API endpoint bulunamadı. Sistem yöneticisiyle iletişime geçiniz.');
      } else if (err.response?.status === 500) {
        setError('Sunucu hatası. Lütfen daha sonra tekrar deneyiniz veya sistem yöneticisiyle iletişime geçiniz.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol ediniz.');
      } else {
        setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.');
      }
    }
  };
  
  // Veritabanı seçimi işlemi
  const handleDatabaseSelect = async (databaseId: string) => {
    if (!databaseId) {
      message.error('Lütfen bir veritabanı seçiniz.');
      return;
    }
    
    try {
      // Seçilen veritabanı bilgisini localStorage'a kaydet
      localStorage.setItem('selectedDatabaseId', databaseId);
      
      // Seçilen veritabanının adını bul ve kaydet
      const selectedDb = userDatabases.find(db => db.databaseId === databaseId);
      if (selectedDb) {
        localStorage.setItem('selectedDatabaseName', selectedDb.databaseName);
        localStorage.setItem('selectedCompanyName', selectedDb.companyName);
      }
      
      // Giriş zamanını kaydet (milisaniye cinsinden timestamp)
      localStorage.setItem('loginTime', Date.now().toString());
      
      // Ana sayfaya yönlendir
      navigate('/');
    } catch (error) {
      console.error('Veritabanı seçimi sırasında hata:', error);
      message.error('Veritabanı seçimi sırasında bir hata oluştu.');
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
          <Title level={3}>
            {step === 'login' ? 'ERP Sistemi Giriş' : 'Veritabanı Seçimi'}
          </Title>
        </div>

        {error && (
          <Alert
            message={step === 'login' ? "Giriş Hatası" : "Veritabanı Hatası"}
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}

        {step === 'login' ? (
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
                autoComplete="email"
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
                autoComplete="current-password"
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
        ) : (
          <div>
            {loadingDatabases ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '10px' }}>Veritabanları yükleniyor...</p>
              </div>
            ) : (
              <Form
                name="databaseSelect"
                layout="vertical"
                onFinish={() => handleDatabaseSelect(selectedDatabaseId)}
              >
                <Form.Item
                  label="Veritabanı Seçiniz"
                  name="databaseId"
                  rules={[{ required: true, message: 'Lütfen bir veritabanı seçiniz!' }]}
                >
                  <Select
                    placeholder="Veritabanı seçiniz"
                    onChange={(value) => setSelectedDatabaseId(value)}
                    value={selectedDatabaseId}
                    size="large"
                    style={{ width: '100%' }}
                    optionLabelProp="label"
                  >
                    {userDatabases.map(db => (
                      <Select.Option 
                        key={db.databaseId} 
                        value={db.databaseId}
                        label={db.databaseName}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <DatabaseOutlined style={{ marginRight: 8 }} />
                          <span>{db.databaseName}</span>
                          <span style={{ color: '#8c8c8c', marginLeft: 8 }}>({db.companyName})</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    style={{ width: '100%' }}
                    size="large"
                    disabled={!selectedDatabaseId}
                  >
                    Devam Et
                  </Button>
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="link" 
                    style={{ width: '100%' }}
                    onClick={() => {
                      // Token'ları temizle ve login sayfasına dön
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('token');
                      sessionStorage.removeItem('token');
                      setStep('login');
                    }}
                  >
                    Farklı Hesap ile Giriş Yap
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login;