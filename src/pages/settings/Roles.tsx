import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Table, Modal, message, Form, Input, Switch, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { roleApi, Role, CreateRoleRequest, UpdateRoleRequest } from '../../services/roleApi';

const Roles: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<CreateRoleRequest>();

  const { data: roles, isLoading, error, refetch } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: roleApi.getRoles
  });

  useEffect(() => {
    if (error) {
      console.error('Roller getirilirken hata oluştu:', error);
      message.error('Roller yüklenirken bir hata oluştu');
    }
  }, [error]);

  const createRoleMutation = useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Rol başarıyla oluşturuldu');
      setIsModalOpen(false);
      form.resetFields();
      setSelectedRole(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Rol oluşturulurken bir hata oluştu');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UpdateRoleRequest }) =>
      roleApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Rol başarıyla güncellendi');
      setIsModalOpen(false);
      form.resetFields();
      setSelectedRole(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Rol güncellenirken bir hata oluştu');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Rol başarıyla silindi');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Rol silinirken bir hata oluştu');
    }
  });

  // Mutation durumlarını kontrol et
  const isSubmitting = createRoleMutation.status === 'pending' || updateRoleMutation.status === 'pending';

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      isActive: role.isActive
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Ad',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Sıra',
      dataIndex: 'order',
      key: 'order'
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
      render: (_: any, record: Role) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Düzenle
          </Button>
          <Button type="link" danger onClick={() => deleteRoleMutation.mutate(record.id)}>
            Sil
          </Button>
        </>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Rol Yönetimi</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setSelectedRole(null);
            setIsModalOpen(true);
          }}
        >
          Yeni Rol
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {error ? (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-2">Roller yüklenirken bir hata oluştu</p>
            <Button onClick={() => refetch()}>
              Yeniden Dene
            </Button>
          </div>
        ) : isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Yükleniyor...</span>
            </div>
          </div>
        ) : roles && Array.isArray(roles) && roles.length > 0 ? (
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={isLoading}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">Henüz hiç rol bulunmuyor</p>
            <Button 
              type="primary"
              onClick={() => {
                form.resetFields();
                setSelectedRole(null);
                setIsModalOpen(true);
              }}
            >
              İlk Rolü Oluştur
            </Button>
          </div>
        )}
      </div>

      <Modal
        title={selectedRole ? 'Rol Düzenle' : 'Yeni Rol'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedRole(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values: CreateRoleRequest) => {
            if (selectedRole) {
              updateRoleMutation.mutate({
                id: selectedRole.id,
                role: values
              });
            } else {
              createRoleMutation.mutate(values);
            }
          }}
          initialValues={{
            name: '',
            description: '',
            isActive: true
          }}
        >
          <Form.Item
            label="Ad"
            name="name"
            rules={[{ required: true, message: 'Ad gerekli' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Açıklama"
            name="description"
            rules={[{ required: true, message: 'Açıklama gerekli' }]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            label="Aktif"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" defaultChecked />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
                setSelectedRole(null);
              }}
            >
              İptal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={isSubmitting}
            >
              {selectedRole ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;
