import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, message } from 'antd';
import { 
  DatabaseDto, 
  CreateDatabaseRequest, 
  UpdateDatabaseRequest, 
  createDatabase, 
  updateDatabase 
} from '../../services/databaseService';

interface DatabaseFormProps {
  visible: boolean;
  database: DatabaseDto | null;
  onClose: (refresh?: boolean) => void;
}

const DatabaseForm: React.FC<DatabaseFormProps> = ({ visible, database, onClose }) => {
  const [form] = Form.useForm();
  const isEditing = !!database;

  useEffect(() => {
    if (visible && database) {
      form.setFieldsValue({
        databaseName: database.databaseName,
        companyName: database.companyName,
        companyAddress: database.companyAddress,
        companyPhone: database.companyPhone,
        companyEmail: database.companyEmail,
        companyTaxNumber: database.companyTaxNumber,
        companyTaxOffice: database.companyTaxOffice,
        connectionString: '', // Güvenlik nedeniyle boş bırakılıyor
        serverName: database.serverName,
        serverPort: database.serverPort,
        isActive: database.isActive,
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
      });
    }
  }, [visible, database, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (isEditing && database) {
        const updateRequest: UpdateDatabaseRequest = {
          databaseName: values.databaseName,
          companyName: values.companyName,
          companyAddress: values.companyAddress,
          companyPhone: values.companyPhone,
          companyEmail: values.companyEmail,
          companyTaxNumber: values.companyTaxNumber,
          companyTaxOffice: values.companyTaxOffice,
          connectionString: values.connectionString,
          serverName: values.serverName,
          serverPort: values.serverPort,
          isActive: values.isActive,
        };
        
        await updateDatabase(database.id, updateRequest);
        message.success('Veritabanı başarıyla güncellendi');
      } else {
        const createRequest: CreateDatabaseRequest = {
          databaseName: values.databaseName,
          companyName: values.companyName,
          companyAddress: values.companyAddress,
          companyPhone: values.companyPhone,
          companyEmail: values.companyEmail,
          companyTaxNumber: values.companyTaxNumber,
          companyTaxOffice: values.companyTaxOffice,
          connectionString: values.connectionString,
          serverName: values.serverName,
          serverPort: values.serverPort,
        };
        
        await createDatabase(createRequest);
        message.success('Veritabanı başarıyla oluşturuldu');
      }
      
      onClose(true);
    } catch (error) {
      console.error('Form gönderilirken hata oluştu:', error);
      message.error('İşlem sırasında bir hata oluştu.');
    }
  };

  return (
    <Modal
      title={isEditing ? 'Veritabanı Düzenle' : 'Yeni Veritabanı Ekle'}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      width={700}
      okText={isEditing ? 'Güncelle' : 'Ekle'}
      cancelText="İptal"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="databaseName"
          label="Veritabanı Adı"
          rules={[{ required: true, message: 'Lütfen veritabanı adını giriniz' }]}
        >
          <Input placeholder="Veritabanı adını giriniz" />
        </Form.Item>
        
        <Form.Item
          name="companyName"
          label="Şirket Adı"
          rules={[{ required: true, message: 'Lütfen şirket adını giriniz' }]}
        >
          <Input placeholder="Şirket adını giriniz" />
        </Form.Item>
        
        <Form.Item
          name="companyAddress"
          label="Şirket Adresi"
        >
          <Input.TextArea rows={2} placeholder="Şirket adresini giriniz" />
        </Form.Item>
        
        <Form.Item
          name="companyPhone"
          label="Telefon"
        >
          <Input placeholder="Telefon numarasını giriniz" />
        </Form.Item>
        
        <Form.Item
          name="companyEmail"
          label="E-posta"
          rules={[{ type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }]}
        >
          <Input placeholder="E-posta adresini giriniz" />
        </Form.Item>
        
        <Form.Item
          name="companyTaxNumber"
          label="Vergi Numarası"
        >
          <Input placeholder="Vergi numarasını giriniz" />
        </Form.Item>
        
        <Form.Item
          name="companyTaxOffice"
          label="Vergi Dairesi"
        >
          <Input placeholder="Vergi dairesini giriniz" />
        </Form.Item>
        
        <Form.Item
          name="connectionString"
          label="Bağlantı Dizesi"
          rules={[{ required: true, message: 'Lütfen bağlantı dizesini giriniz' }]}
        >
          <Input.Password placeholder="Bağlantı dizesini giriniz" />
        </Form.Item>
        
        <Form.Item
          name="serverName"
          label="Sunucu Adı"
        >
          <Input placeholder="Sunucu adını giriniz" />
        </Form.Item>
        
        <Form.Item
          name="serverPort"
          label="Sunucu Port"
        >
          <Input placeholder="Sunucu portunu giriniz" />
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

export default DatabaseForm;
