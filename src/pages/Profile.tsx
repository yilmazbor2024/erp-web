import React from 'react';
import { Avatar, Button, Card, Spin } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import ChangePassword from '../components/Auth/ChangePassword';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
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
