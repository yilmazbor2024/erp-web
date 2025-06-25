import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Modal, Typography, message, Tooltip, Card, Breadcrumb, Tag, Popconfirm } from 'antd';
import { 
  DeleteOutlined, EditOutlined, PlusOutlined, 
  ExclamationCircleOutlined, SearchOutlined, EyeOutlined, HomeOutlined
} from '@ant-design/icons';
import { getDatabases, deleteDatabase, DatabaseDto } from '../../services/databaseService';
import DatabaseForm from './DatabaseForm';
import { Link } from 'react-router-dom';

const { Title } = Typography;
const { confirm } = Modal;

const DatabaseList: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentDatabase, setCurrentDatabase] = useState<DatabaseDto | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const data = await getDatabases();
      setDatabases(data);
    } catch (error) {
      console.error('Veritabanları yüklenirken hata oluştu:', error);
      message.error('Veritabanları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleAddDatabase = () => {
    setCurrentDatabase(null);
    setIsModalVisible(true);
  };

  const handleEditDatabase = (database: DatabaseDto) => {
    setCurrentDatabase(database);
    setIsModalVisible(true);
  };

  const handleViewDatabase = (database: DatabaseDto) => {
    Modal.info({
      title: `${database.companyName} - ${database.databaseName}`,
      width: 700,
      content: (
        <div>
          <p><strong>Veritabanı Adı:</strong> {database.databaseName}</p>
          <p><strong>Şirket Adı:</strong> {database.companyName}</p>
          <p><strong>Şirket Adresi:</strong> {database.companyAddress || '-'}</p>
          <p><strong>Telefon:</strong> {database.companyPhone || '-'}</p>
          <p><strong>E-posta:</strong> {database.companyEmail || '-'}</p>
          <p><strong>Vergi No:</strong> {database.companyTaxNumber || '-'}</p>
          <p><strong>Vergi Dairesi:</strong> {database.companyTaxOffice || '-'}</p>
          <p><strong>Sunucu Adı:</strong> {database.serverName || '-'}</p>
          <p><strong>Sunucu Port:</strong> {database.serverPort || '-'}</p>
          <p><strong>Durum:</strong> {database.isActive ? 'Aktif' : 'Pasif'}</p>
          <p><strong>Oluşturulma Tarihi:</strong> {new Date(database.createdAt).toLocaleString('tr-TR')}</p>
          <p><strong>Oluşturan:</strong> {database.createdBy}</p>
          {database.modifiedAt && (
            <>
              <p><strong>Güncellenme Tarihi:</strong> {new Date(database.modifiedAt).toLocaleString('tr-TR')}</p>
              <p><strong>Güncelleyen:</strong> {database.modifiedBy}</p>
            </>
          )}
        </div>
      ),
      onOk() {},
    });
  };

  const handleDeleteDatabase = (id: string) => {
    confirm({
      title: 'Bu veritabanını silmek istediğinizden emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz ve tüm kullanıcı ilişkileri de silinecektir.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      async onOk() {
        try {
          await deleteDatabase(id);
          message.success('Veritabanı başarıyla silindi');
          fetchDatabases();
        } catch (error) {
          console.error('Veritabanı silinirken hata oluştu:', error);
          message.error('Veritabanı silinirken bir hata oluştu.');
        }
      },
    });
  };

  const handleModalClose = (refresh: boolean = false) => {
    setIsModalVisible(false);
    if (refresh) {
      fetchDatabases();
    }
  };

  const filteredDatabases = databases.filter(
    (db) =>
      db.databaseName.toLowerCase().includes(searchText.toLowerCase()) ||
      db.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      db.serverName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Veritabanı Adı',
      dataIndex: 'databaseName',
      key: 'databaseName',
      sorter: (a: DatabaseDto, b: DatabaseDto) => a.databaseName.localeCompare(b.databaseName),
    },
    {
      title: 'Şirket Adı',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a: DatabaseDto, b: DatabaseDto) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Sunucu',
      dataIndex: 'serverName',
      key: 'serverName',
      render: (text: string) => text || '-',
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
      sorter: (a: DatabaseDto, b: DatabaseDto) => (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1),
    },
    {
      title: 'Oluşturulma Tarihi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleDateString('tr-TR'),
      sorter: (a: DatabaseDto, b: DatabaseDto) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: DatabaseDto) => (
        <Space size="middle">
          <Tooltip title="Görüntüle">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDatabase(record)} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditDatabase(record)} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Popconfirm
              title="Bu veritabanını silmek istediğinizden emin misiniz?"
              onConfirm={() => handleDeleteDatabase(record.id)}
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
          <Breadcrumb.Item>Veritabanı Yönetimi</Breadcrumb.Item>
        </Breadcrumb>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>Veritabanı Yönetimi</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddDatabase}
          >
            Yeni Veritabanı
          </Button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Veritabanı veya şirket adına göre ara"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredDatabases}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      <DatabaseForm
        visible={isModalVisible}
        database={currentDatabase}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default DatabaseList;
