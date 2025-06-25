import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, message, Typography, Card, 
  Tooltip, Tag, Popconfirm, Input, Select, Breadcrumb 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ExclamationCircleOutlined, SearchOutlined, HomeOutlined 
} from '@ant-design/icons';
import { getUserDatabases, deleteUserDatabase, UserDatabaseDto } from '../../services/userDatabaseService';
// @ts-ignore - Modül çözümleme sorunu
import UserDatabaseForm from './UserDatabaseForm';
import { Link } from 'react-router-dom';

const { Title } = Typography;
const { confirm } = Modal;
const { Option } = Select;

const UserDatabaseList: React.FC = () => {
  const [userDatabases, setUserDatabases] = useState<UserDatabaseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentUserDatabase, setCurrentUserDatabase] = useState<UserDatabaseDto | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string | null>(null);

  const fetchUserDatabases = async () => {
    setLoading(true);
    try {
      const data = await getUserDatabases();
      setUserDatabases(data);
    } catch (error) {
      console.error('Kullanıcı veritabanları yüklenirken hata oluştu:', error);
      message.error('Kullanıcı veritabanları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDatabases();
  }, []);

  const handleAddUserDatabase = () => {
    setCurrentUserDatabase(null);
    setIsModalVisible(true);
  };

  const handleEditUserDatabase = (userDatabase: UserDatabaseDto) => {
    setCurrentUserDatabase(userDatabase);
    setIsModalVisible(true);
  };

  const handleDeleteUserDatabase = (id: string) => {
    confirm({
      title: 'Bu kullanıcı-veritabanı ilişkisini silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      async onOk() {
        try {
          await deleteUserDatabase(id);
          message.success('Kullanıcı-veritabanı ilişkisi başarıyla silindi');
          fetchUserDatabases();
        } catch (error) {
          console.error('Kullanıcı-veritabanı ilişkisi silinirken hata oluştu:', error);
          message.error('Kullanıcı-veritabanı ilişkisi silinirken bir hata oluştu.');
        }
      },
    });
  };

  const handleModalClose = (refresh: boolean = false) => {
    setIsModalVisible(false);
    if (refresh) {
      fetchUserDatabases();
    }
  };

  const filteredUserDatabases = userDatabases.filter(
    (udb) => {
      const matchesSearch = 
        udb.userName.toLowerCase().includes(searchText.toLowerCase()) ||
        udb.databaseName.toLowerCase().includes(searchText.toLowerCase()) ||
        udb.companyName.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesRole = filterRole ? udb.role === filterRole : true;
      
      return matchesSearch && matchesRole;
    }
  );

  const columns = [
    {
      title: 'Kullanıcı',
      dataIndex: 'userName',
      key: 'userName',
      sorter: (a: UserDatabaseDto, b: UserDatabaseDto) => a.userName.localeCompare(b.userName),
    },
    {
      title: 'Veritabanı',
      dataIndex: 'databaseName',
      key: 'databaseName',
      sorter: (a: UserDatabaseDto, b: UserDatabaseDto) => a.databaseName.localeCompare(b.databaseName),
    },
    {
      title: 'Şirket',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a: UserDatabaseDto, b: UserDatabaseDto) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
        </Tag>
      ),
      sorter: (a: UserDatabaseDto, b: UserDatabaseDto) => a.role.localeCompare(b.role),
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Aktif' : 'Pasif'}
        </Tag>
      ),
      sorter: (a: UserDatabaseDto, b: UserDatabaseDto) => (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1),
    },
    {
      title: 'Oluşturulma Tarihi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleDateString('tr-TR'),
      sorter: (a: UserDatabaseDto, b: UserDatabaseDto) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: UserDatabaseDto) => (
        <Space size="middle">
          <Tooltip title="Düzenle">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditUserDatabase(record)} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Popconfirm
              title="Bu kullanıcı-veritabanı ilişkisini silmek istediğinizden emin misiniz?"
              onConfirm={() => handleDeleteUserDatabase(record.id)}
              okText="Evet"
              cancelText="Hayır"
            >
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <Link to="/">
              <HomeOutlined /> Ana Sayfa
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/settings">
              Ayarlar
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Kullanıcı Veritabanı Yetkileri</Breadcrumb.Item>
        </Breadcrumb>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>Kullanıcı Veritabanı Yetkileri</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUserDatabase}
          >
            Yeni Yetki Ekle
          </Button>
        </div>
        
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input
            placeholder="Kullanıcı veya veritabanı adına göre ara"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          
          <Select
            placeholder="Rol filtresi"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilterRole(value)}
          >
            <Option value="admin">Yönetici</Option>
            <Option value="user">Kullanıcı</Option>
          </Select>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredUserDatabases}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      <UserDatabaseForm
        visible={isModalVisible}
        userDatabase={currentUserDatabase}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default UserDatabaseList;
