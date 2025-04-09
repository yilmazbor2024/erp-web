import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Space,
  Tooltip
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { roleApi, Role } from '../../services/api';

const Roles: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: roleApi.getRoles
  });

  const createRoleMutation = useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Rol başarıyla oluşturuldu');
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Rol oluşturulurken bir hata oluştu');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: any }) =>
      roleApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Rol başarıyla güncellendi');
      setIsModalVisible(false);
      form.resetFields();
      setEditingRole(null);
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

  const handleSubmit = async (values: any) => {
    if (editingRole) {
      await updateRoleMutation.mutateAsync({
        id: editingRole.id,
        role: values
      });
    } else {
      await createRoleMutation.mutateAsync(values);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      isActive: role.isActive
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Rolü silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: () => deleteRoleMutation.mutate(id)
    });
  };

  const columns = [
    {
      title: 'Rol Adı',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description'
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
      render: (_: any, record: Role) => (
        <Space>
          <Tooltip title="Düzenle">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Rol Yönetimi</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRole(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Yeni Rol
        </Button>
      </div>

      <Table
        dataSource={roles}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingRole ? 'Rol Düzenle' : 'Yeni Rol'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRole(null);
          form.resetFields();
        }}
        onOk={form.submit}
        okText={editingRole ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Rol Adı"
            rules={[{ required: true, message: 'Lütfen rol adını girin' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Durum"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles; 