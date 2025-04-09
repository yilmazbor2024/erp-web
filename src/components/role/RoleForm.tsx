import React from 'react';
import { Form, Input, Switch, Button } from 'antd';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../services/roleApi';

interface RoleFormProps {
  initialValues?: Role | null;
  onSubmit: (values: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  onCancel: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
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
        name: initialValues.name,
        description: initialValues.description,
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
        isActive: true
      }}
    >
      <Form.Item
        name="name"
        label="Rol Adı"
        rules={[{ required: true, message: 'Rol adı gerekli' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="description"
        label="Açıklama"
        rules={[{ required: true, message: 'Açıklama gerekli' }]}
      >
        <Input.TextArea rows={4} />
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
          {initialValues ? 'Güncelle' : 'Oluştur'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RoleForm;
