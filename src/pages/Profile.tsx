import React, { useEffect, useState } from 'react';
import { Avatar, Button, Card, Spin, Table, Tag, Result, Empty } from 'antd';
import { UserOutlined, LogoutOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import ChangePassword from '../components/Auth/ChangePassword';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Türkçe lokalizasyonu ayarla
dayjs.locale('tr');

// Giriş log tipi
interface LoginLog {
  id: string;
  loginDate: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason: string | null;
}

const Profile: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Giriş loglarını yükle
  useEffect(() => {
    const fetchLoginLogs = async () => {
      if (!user) {
        console.log('Profile: No user data available, skipping login logs fetch');
        return;
      }
      
      setLoadingLogs(true);
      setErrorMessage(null);
      
      try {
        console.log('Profile: Fetching login logs for user:', user.email);
        const response = await authApi.getUserLoginLogs();
        
        if (response && response.data) {
          console.log('Profile: Login logs fetched successfully:', response.data.length, 'records');
          setLoginLogs(response.data);
        } else {
          console.warn('Profile: Login logs response is empty or invalid');
          setErrorMessage('Giriş kayıtları alınamadı');
        }
      } catch (error) {
        console.error('Profile: Error fetching login logs:', error);
        setErrorMessage('Giriş kayıtları yüklenirken bir hata oluştu');
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLoginLogs();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'loginDate',
      key: 'loginDate',
      render: (date: string) => dayjs(date).format('DD MMMM YYYY HH:mm:ss'),
      sorter: (a: LoginLog, b: LoginLog) => new Date(b.loginDate).getTime() - new Date(a.loginDate).getTime(),
      defaultSortOrder: 'descend' as 'descend',
    },
    {
      title: 'IP Adresi',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Durum',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean, record: LoginLog) => (
        <Tag color={success ? 'success' : 'error'} icon={success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {success ? 'Başarılı' : 'Başarısız'}
        </Tag>
      ),
      filters: [
        { text: 'Başarılı', value: true },
        { text: 'Başarısız', value: false },
      ],
      onFilter: (value: any, record: LoginLog) => record.success === value,
    },
    {
      title: 'Hata Nedeni',
      dataIndex: 'failureReason',
      key: 'failureReason',
      render: (reason: string | null) => reason || '-',
    },
  ];

  // Kullanıcı yükleniyor durumu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
        <div className="ml-4 text-lg">Kullanıcı bilgileri yükleniyor...</div>
      </div>
    );
  }

  // Kullanıcı bilgisi yoksa
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Result
            status="warning"
            title="Kullanıcı bilgisi bulunamadı"
            subTitle="Oturumunuz sonlanmış olabilir veya giriş yapmamış olabilirsiniz."
            extra={
              <Button 
                type="primary" 
                onClick={() => navigate('/login')}
                icon={<LoginOutlined />}
              >
                Giriş Yap
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.userName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Hesap Bilgileri">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Kullanıcı Adı</label>
                  <p className="mt-1">{user.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">E-posta</label>
                  <p className="mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ad</label>
                  <p className="mt-1">{user.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Soyad</label>
                  <p className="mt-1">{user.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Roller</label>
                  <p className="mt-1">{user.roles?.join(', ') || 'Rol atanmamış'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <p className="mt-1">{user.isActive ? 'Aktif' : 'Pasif'}</p>
                </div>
              </div>
            </Card>

            <Card 
              title="Güvenlik" 
              extra={
                <Button 
                  type="link" 
                  onClick={() => setShowChangePassword(!showChangePassword)}
                >
                  {showChangePassword ? 'İptal' : 'Şifre Değiştir'}
                </Button>
              }
            >
              {showChangePassword ? (
                <ChangePassword />
              ) : (
                <div className="text-gray-500">
                  Şifrenizi değiştirmek için "Şifre Değiştir" butonuna tıklayın.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Giriş Çıkış Logları Bölümü */}
      <Card 
        title={
          <div className="flex items-center">
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            <div className="text-lg">Giriş Çıkış Logları</div>
          </div>
        }
        className="mb-8"
      >
        {errorMessage ? (
          <div className="text-red-500">{errorMessage}</div>
        ) : (
          <Table 
            dataSource={loginLogs} 
            columns={columns} 
            rowKey="id"
            loading={loadingLogs}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'Log kaydı bulunamadı' }}
          />
        )}
      </Card>

      <Card>
        <Button 
          danger 
          type="text" 
          block 
          onClick={handleLogout}
          icon={<LogoutOutlined />}
        >
          Çıkış Yap
        </Button>
      </Card>
    </div>
  );
};

export default Profile;
