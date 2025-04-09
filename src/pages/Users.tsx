import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import useUserStore from '../stores/userStore';
import { User, CreateUserRequest, UpdateUserRequest } from '../services/api';

const { Option } = Select;

const Users: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { users, isLoading, error, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('Kullanıcı başarıyla silindi');
    } catch (error) {
      message.error('Kullanıcı silinirken bir hata oluştu');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await updateUser(editingUser.id, values as UpdateUserRequest);
        message.success('Kullanıcı başarıyla güncellendi');
      } else {
        await createUser(values as CreateUserRequest);
        message.success('Kullanıcı başarıyla oluşturuldu');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('İşlem sırasında bir hata oluştu');
    }
  };

  const columns = [
    {
      title: 'Kullanıcı Adı',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Ad',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Soyad',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Düzenle
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Sil
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Yeni Kullanıcı
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          {!editingUser && (
            <>
              <Form.Item
                name="userName"
                label="Kullanıcı Adı"
                rules={[{ required: true, message: 'Lütfen kullanıcı adını girin' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="Şifre"
                rules={[{ required: true, message: 'Lütfen şifreyi girin' }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="firstName"
            label="Ad"
            rules={[{ required: true, message: 'Lütfen adı girin' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Soyad"
            rules={[{ required: true, message: 'Lütfen soyadı girin' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: 'Lütfen e-posta adresini girin' },
              { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="roles"
            label="Roller"
            rules={[{ required: true, message: 'Lütfen en az bir rol seçin' }]}
          >
            <Select mode="multiple">
              <Option value="Admin">Admin</Option>
              <Option value="User">Kullanıcı</Option>
              <Option value="Manager">Yönetici</Option>
            </Select>
          </Form.Item>
          {editingUser && (
            <Form.Item
              name="isActive"
              label="Durum"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Users; 