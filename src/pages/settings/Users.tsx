import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Table, Modal, message, Form, Input, Switch, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { userApi, User, CreateUserRequest, UpdateUserRequest } from '../../services/userApi';
import { roleApi, Role } from '../../services/roleApi';

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<CreateUserRequest>();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userApi.getUsers
  });

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: roleApi.getRoles
  });

  const createUserMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Kullanıcı başarıyla oluşturuldu');
      setIsModalOpen(false);
      form.resetFields();
      setSelectedUser(null);
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
      setIsModalOpen(false);
      form.resetFields();
      setSelectedUser(null);
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

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    form.setFieldsValue({
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Kullanıcı Adı',
      dataIndex: 'userName',
      key: 'userName'
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
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Roller',
      dataIndex: 'roles',
      key: 'roles',
      render: (roleIds: string[]) => {
        const userRoles = roles?.filter(role => roleIds.includes(role.id)) || [];
        return userRoles.map(role => role.name).join(', ');
      }
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Aktif' : 'Pasif'}
        </span>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: User) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Düzenle
          </Button>
          <Button type="link" danger onClick={() => deleteUserMutation.mutate(record.id)}>
            Sil
          </Button>
        </>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setSelectedUser(null);
            setIsModalOpen(true);
          }}
        >
          Yeni Kullanıcı
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={usersLoading}
        />
      </div>

      <Modal
        title={selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedUser(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values: CreateUserRequest) => {
            if (selectedUser) {
              const { password, ...updateData } = values;
              updateUserMutation.mutate({
                id: selectedUser.id,
                user: updateData
              });
            } else {
              createUserMutation.mutate(values);
            }
          }}
          initialValues={{
            userName: '',
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            roles: [],
            isActive: true
          }}
        >
          <Form.Item
            label="Kullanıcı Adı"
            name="userName"
            rules={[{ required: true, message: 'Kullanıcı adı gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Ad"
            name="firstName"
            rules={[{ required: true, message: 'Ad gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Soyad"
            name="lastName"
            rules={[{ required: true, message: 'Soyad gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="E-posta"
            name="email"
            rules={[
              { required: true, message: 'E-posta gerekli' },
              { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
            ]}
          >
            <Input />
          </Form.Item>

          {!selectedUser && (
            <Form.Item
              label="Şifre"
              name="password"
              rules={[{ required: true, message: 'Şifre gerekli' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            label="Roller"
            name="roles"
            rules={[{ required: true, message: 'En az bir rol seçin' }]}
          >
            <Select
              mode="multiple"
              loading={rolesLoading}
              placeholder="Roller seçin"
              options={roles?.map(role => ({
                label: role.name,
                value: role.id
              }))}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button className="mr-2" onClick={() => {
              setIsModalOpen(false);
              form.resetFields();
              setSelectedUser(null);
            }}>
              İptal
            </Button>
            <Button type="primary" htmlType="submit">
              {selectedUser ? 'Güncelle' : 'Oluştur'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
