import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Switch, message } from 'antd';
import { 
  UserDatabaseDto, 
  CreateUserDatabaseRequest, 
  UpdateUserDatabaseRequest, 
  createUserDatabase, 
  updateUserDatabase 
} from '../../services/userDatabaseService';
import { getDatabases, DatabaseDto } from '../../services/databaseService';
import axios from '../../config/axios';
// API_BASE_URL artık axios instance'ında tanımlandığı için import etmeye gerek yok

interface UserDatabaseFormProps {
  visible: boolean;
  userDatabase: UserDatabaseDto | null;
  onClose: (refresh?: boolean) => void;
}

interface UserOption {
  value: string;
  label: string;
}

const { Option } = Select;

const UserDatabaseForm: React.FC<UserDatabaseFormProps> = ({ visible, userDatabase, onClose }) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [databases, setDatabases] = useState<DatabaseDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  
  const isEditing = !!userDatabase;

  // Kullanıcıları yükle
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await axios.get(`/api/User`);
        const userOptions = response.data.map((user: any) => ({
          value: user.id,
          label: `${user.userName} (${user.firstName} ${user.lastName})`,
        }));
        setUsers(userOptions);
      } catch (error) {
        console.error('Kullanıcılar yüklenirken hata oluştu:', error);
        message.error('Kullanıcılar yüklenirken bir hata oluştu.');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  // Veritabanlarını yükle
  useEffect(() => {
    const fetchDatabases = async () => {
      setLoadingDatabases(true);
      try {
        const data = await getDatabases();
        setDatabases(data);
      } catch (error) {
        console.error('Veritabanları yüklenirken hata oluştu:', error);
        message.error('Veritabanları yüklenirken bir hata oluştu.');
      } finally {
        setLoadingDatabases(false);
      }
    };

    if (visible) {
      fetchDatabases();
    }
  }, [visible]);

  // Form değerlerini ayarla
  useEffect(() => {
    if (visible && userDatabase) {
      form.setFieldsValue({
        userId: userDatabase.userId,
        databaseId: userDatabase.databaseId,
        role: userDatabase.role,
        isActive: userDatabase.isActive,
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        role: 'user',
        isActive: true,
      });
    }
  }, [visible, userDatabase, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (isEditing && userDatabase) {
        const updateRequest: UpdateUserDatabaseRequest = {
          role: values.role,
          isActive: values.isActive,
        };
        
        await updateUserDatabase(userDatabase.id, updateRequest);
        message.success('Kullanıcı veritabanı yetkisi başarıyla güncellendi');
      } else {
        const createRequest: CreateUserDatabaseRequest = {
          userId: values.userId,
          databaseId: values.databaseId,
          role: values.role,
        };
        
        await createUserDatabase(createRequest);
        message.success('Kullanıcı veritabanı yetkisi başarıyla oluşturuldu');
      }
      
      onClose(true);
    } catch (error) {
      console.error('Form gönderilirken hata oluştu:', error);
      message.error('İşlem sırasında bir hata oluştu.');
    }
  };

  return (
    <Modal
      title={isEditing ? 'Kullanıcı Veritabanı Yetkisi Düzenle' : 'Yeni Kullanıcı Veritabanı Yetkisi Ekle'}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      okText={isEditing ? 'Güncelle' : 'Ekle'}
      cancelText="İptal"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="userId"
          label="Kullanıcı"
          rules={[{ required: true, message: 'Lütfen kullanıcı seçiniz' }]}
          hidden={isEditing}
        >
          <Select
            placeholder="Kullanıcı seçiniz"
            loading={loadingUsers}
            disabled={isEditing}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users}
          />
        </Form.Item>
        
        <Form.Item
          name="databaseId"
          label="Veritabanı"
          rules={[{ required: true, message: 'Lütfen veritabanı seçiniz' }]}
          hidden={isEditing}
        >
          <Select
            placeholder="Veritabanı seçiniz"
            loading={loadingDatabases}
            disabled={isEditing}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
            }
          >
            {databases.map(db => (
              <Option key={db.id} value={db.id}>
                {db.companyName} - {db.databaseName}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="role"
          label="Rol"
          rules={[{ required: true, message: 'Lütfen rol seçiniz' }]}
        >
          <Select placeholder="Rol seçiniz">
            <Option value="admin">Yönetici</Option>
            <Option value="user">Kullanıcı</Option>
          </Select>
        </Form.Item>
        
        {isEditing && (
          <Form.Item
            name="isActive"
            label="Aktif"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default UserDatabaseForm;
