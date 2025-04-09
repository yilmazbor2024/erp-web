import React from 'react';
import { Table, Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { UserGroup } from '../../services/userApi';

interface UserGroupListProps {
  userGroups: UserGroup[];
  onEdit: (userGroup: UserGroup) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const UserGroupList: React.FC<UserGroupListProps> = ({
  userGroups,
  onEdit,
  onDelete,
  isLoading
}) => {
  const columns = [
    {
      title: 'Grup Adı',
      dataIndex: 'name',
      key: 'name',
      width: '20%'
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      width: '30%'
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      width: '15%',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Aktif' : 'Pasif'}
        </Tag>
      )
    },
    {
      title: 'Yetkiler',
      dataIndex: 'permissions',
      key: 'permissions',
      width: '20%',
      render: (permissions: any[]) => (
        <Space size={[0, 4]} wrap>
          {permissions.filter(p => p.canRead || p.canCreate || p.canUpdate || p.canDelete)
            .map(p => (
              <Tag key={p.moduleName} color="blue">
                {p.moduleName}
              </Tag>
            ))}
        </Space>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: '15%',
      render: (_: any, record: UserGroup) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Bu grubu silmek istediğinize emin misiniz?"
            onConfirm={() => onDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Sil
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={userGroups}
      rowKey="id"
      loading={isLoading}
    />
  );
};

export default UserGroupList;
