import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Table, Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { userApi, UserGroup, CreateUserGroupRequest, UpdateUserGroupRequest } from '../../services/userApi';
import UserGroupForm from '../../components/user/UserGroupForm';

const UserGroups: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUserGroup, setSelectedUserGroup] = useState<UserGroup | undefined>(undefined);

  const { data: userGroups, isLoading } = useQuery({
    queryKey: ['userGroups'],
    queryFn: userApi.getUserGroups
  });

  const createUserGroupMutation = useMutation({
    mutationFn: userApi.createUserGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });
      message.success('Kullanıcı grubu başarıyla oluşturuldu');
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Kullanıcı grubu oluşturulurken bir hata oluştu');
    }
  });

  const updateUserGroupMutation = useMutation({
    mutationFn: ({ id, userGroup }: { id: string; userGroup: UpdateUserGroupRequest }) =>
      userApi.updateUserGroup(id, userGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });
      message.success('Kullanıcı grubu başarıyla güncellendi');
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Kullanıcı grubu güncellenirken bir hata oluştu');
    }
  });

  const deleteUserGroupMutation = useMutation({
    mutationFn: userApi.deleteUserGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });
      message.success('Kullanıcı grubu başarıyla silindi');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Kullanıcı grubu silinirken bir hata oluştu');
    }
  });

  const handleSubmit = async (values: CreateUserGroupRequest | UpdateUserGroupRequest) => {
    if (selectedUserGroup) {
      await updateUserGroupMutation.mutate({
        id: selectedUserGroup.id,
        userGroup: values as UpdateUserGroupRequest
      });
    } else {
      await createUserGroupMutation.mutate(values as CreateUserGroupRequest);
    }
  };

  const columns = [
    {
      title: 'Grup Adı',
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
      render: (isActive: boolean) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isActive ? 'Aktif' : 'Pasif'}
        </span>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: UserGroup) => (
        <>
          <Button
            type="link"
            onClick={() => {
              setSelectedUserGroup(record);
              setIsModalVisible(true);
            }}
          >
            Düzenle
          </Button>
          <Button
            type="link"
            danger
            onClick={() => deleteUserGroupMutation.mutate(record.id)}
          >
            Sil
          </Button>
        </>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Kullanıcı Grubu Yönetimi</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedUserGroup(undefined);
            setIsModalVisible(true);
          }}
        >
          Yeni Kullanıcı Grubu
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          dataSource={userGroups}
          rowKey="id"
          loading={isLoading}
        />
      </div>

      <Modal
        title={selectedUserGroup ? 'Kullanıcı Grubu Düzenle' : 'Yeni Kullanıcı Grubu'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedUserGroup(undefined);
        }}
        footer={null}
      >
        <UserGroupForm
          initialValues={selectedUserGroup}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedUserGroup(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

export default UserGroups;
