import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Space
} from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { userApi, CreateUserRequest, UpdateUserRequest } from '../../services/userApi';
import type { User } from '../../services/userApi';
import { roleApi, Role } from '../../services/roleApi';

const Users: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getUsers
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: roleApi.getRoles
  });

  const createUserMutation = useMutation({
    mutationFn: (values: CreateUserRequest) => userApi.createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Kullanıcı başarıyla oluşturuldu');
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, user }: { id: string; user: UpdateUserRequest }) =>
      userApi.updateUser(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Kullanıcı başarıyla güncellendi');
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Kullanıcı güncellenirken bir hata oluştu');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Kullanıcı başarıyla silindi');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu');
    }
  });

  const handleSubmit = async (values: any) => {
    if (editingUser) {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        user: values
      });
    } else {
      await createUserMutation.mutateAsync(values);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      isActive: user.isActive
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Kullanıcıyı silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: () => deleteUserMutation.mutate(id)
    });
  };

  const columns = [
    {
      title: 'Kullanıcı Adı',
      dataIndex: 'userName',
      key: 'userName'
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Ad',
      dataIndex: 'firstName',
      key: 'firstName'
    },
    {
      title: 'Soyad',
      dataIndex: 'lastName',
      key: 'lastName'
    },
    {
      title: 'Roller',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => roles.join(', ')
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (isActive ? 'Aktif' : 'Pasif')
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
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        onClick={() => {
          setEditingUser(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Yeni Kullanıcı
      </Button>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={form.submit}
        okText={editingUser ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="userName"
            label="Kullanıcı Adı"
            rules={[{ required: true, message: 'Kullanıcı adı gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: 'E-posta gerekli' },
              { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Şifre"
              rules={[
                { required: true, message: 'Şifre gerekli' },
                { min: 6, message: 'Şifre en az 6 karakter olmalı' }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="firstName"
            label="Ad"
            rules={[{ required: true, message: 'Ad gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Soyad"
            rules={[{ required: true, message: 'Soyad gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="roles" label="Roller">
            <Select mode="multiple" placeholder="Roller seçin">
              {roles?.map((role: Role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
