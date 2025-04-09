import React from 'react';
import { Form, Input, Select, Switch, Button } from 'antd';
import { User, CreateUserRequest, UpdateUserRequest } from '../../services/userApi';
import { Role } from '../../services/roleApi';

interface UserFormProps {
  initialValues?: User | null;
  roles: Role[];
  onSubmit: (values: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  onCancel: () => void;
  isEdit: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialValues,
  roles,
  onSubmit,
  onCancel,
  isEdit
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        userName: initialValues.userName,
        firstName: initialValues.firstName,
        lastName: initialValues.lastName,
        email: initialValues.email,
        roles: initialValues.roles,
        isActive: initialValues.isActive
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        isActive: true,
        roles: []
      }}
    >
      <Form.Item
        name="firstName"
        label="Ad"
        rules={[{ required: true, message: 'Ad alanı gerekli' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Soyad"
        rules={[{ required: true, message: 'Soyad alanı gerekli' }]}
      >
        <Input />
      </Form.Item>

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
          { required: true, message: 'E-posta adresi gerekli' },
          { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
        ]}
      >
        <Input />
      </Form.Item>

      {!isEdit && (
        <Form.Item
          name="password"
          label="Şifre"
          rules={[
            { required: !isEdit, message: 'Şifre gerekli' },
            { min: 6, message: 'Şifre en az 6 karakter olmalıdır' }
          ]}
        >
          <Input.Password />
        </Form.Item>
      )}

      <Form.Item
        name="roles"
        label="Roller"
        rules={[{ required: true, message: 'En az bir rol seçilmeli' }]}
      >
        <Select
          mode="multiple"
          placeholder="Roller seçin"
          options={roles.map(role => ({
            label: role.name,
            value: role.name
          }))}
        />
      </Form.Item>

      <Form.Item
        name="isActive"
        label="Durum"
        valuePropName="checked"
      >
        <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
      </Form.Item>

      <Form.Item className="mb-0 text-right">
        <Button className="mr-2" onClick={onCancel}>
          İptal
        </Button>
        <Button type="primary" onClick={handleSubmit}>
          {isEdit ? 'Güncelle' : 'Oluştur'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm;
