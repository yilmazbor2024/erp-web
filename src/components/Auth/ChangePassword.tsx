import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { authApi } from '../../services/api';

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Yeni şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Şifreniz başarıyla değiştirildi');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Şifre Değiştir" className="mb-4">
      <Form
        form={form}
        name="changePassword"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          label="Mevcut Şifre"
          name="currentPassword"
          rules={[{ required: true, message: 'Lütfen mevcut şifrenizi girin' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Yeni Şifre"
          name="newPassword"
          rules={[
            { required: true, message: 'Lütfen yeni şifrenizi girin' },
            { min: 8, message: 'Şifre en az 8 karakter olmalıdır' }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Yeni Şifre (Tekrar)"
          name="confirmPassword"
          rules={[
            { required: true, message: 'Lütfen yeni şifrenizi tekrar girin' },
            { min: 8, message: 'Şifre en az 8 karakter olmalıdır' }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Şifreyi Değiştir
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ChangePassword;
