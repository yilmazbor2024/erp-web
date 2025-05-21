import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Spin, message, Tabs, Select, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { customerService } from '../../services/customerService';
import { Vendor, VendorAddress, VendorCommunication, VendorContact } from '../../types/vendor';

const { TabPane } = Tabs;
const { Option } = Select;

const VendorEdit: React.FC = () => {
  const { vendorCode } = useParams<{ vendorCode: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        if (!vendorCode) {
          message.error('Tedarikçi kodu bulunamadı');
          navigate('/vendors');
          return;
        }

        setLoading(true);
        const response = await customerService.getCustomerByCode(vendorCode);
        
        if (response && response.isSuccess && response.data) {
          setVendor(response.data);
          
          // Form alanlarını doldur
          form.setFieldsValue({
            currAccCode: response.data.currAccCode,
            currAccDescription: response.data.currAccDescription,
            taxNumber: response.data.taxNumber,
            taxOffice: response.data.taxOffice,
            country: response.data.country,
            city: response.data.city,
            phoneNumber: response.data.phoneNumber,
            email: response.data.email,
          });
        } else {
          message.error('Tedarikçi bilgileri alınamadı');
          console.error('API yanıtı:', response);
        }
      } catch (error) {
        console.error('Tedarikçi detayları alınırken hata oluştu:', error);
        message.error('Tedarikçi bilgileri alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [vendorCode, navigate, form]);

  const handleBack = () => {
    navigate(`/vendors/${vendorCode}`);
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);
      
      // Tedarikçi güncelleme API'si burada çağrılacak
      // Şu anda updateCustomer API'si olmadığı için sadece simüle ediyoruz
      // const response = await updateCustomer(vendorCode, values);
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Tedarikçi bilgileri başarıyla güncellendi');
      navigate(`/vendors/${vendorCode}`);
    } catch (error) {
      console.error('Tedarikçi güncellenirken hata oluştu:', error);
      message.error('Tedarikçi bilgileri güncellenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" tip="Tedarikçi bilgileri yükleniyor..." />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg mb-4">Tedarikçi bulunamadı</p>
        <Button type="primary" onClick={() => navigate('/vendors')}>
          Tedarikçi Listesine Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mr-4"
          >
            Geri
          </Button>
          <h1 className="text-xl font-bold m-0">Tedarikçi Düzenle</h1>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={() => form.submit()}
          loading={submitting}
        >
          Kaydet
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          currAccCode: vendor.currAccCode,
          currAccDescription: vendor.currAccDescription,
          taxNumber: vendor.taxNumber,
          taxOffice: vendor.taxOffice,
          country: vendor.country,
          city: vendor.city,
          phoneNumber: vendor.phoneNumber,
          email: vendor.email,
        }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Temel Bilgiler" key="1">
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="currAccCode"
                  label="Tedarikçi Kodu"
                  rules={[{ required: true, message: 'Tedarikçi kodu zorunludur' }]}
                >
                  <Input disabled />
                </Form.Item>
                
                <Form.Item
                  name="currAccDescription"
                  label="Tedarikçi Adı"
                  rules={[{ required: true, message: 'Tedarikçi adı zorunludur' }]}
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="taxNumber"
                  label="Vergi Numarası"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="taxOffice"
                  label="Vergi Dairesi"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="country"
                  label="Ülke"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="city"
                  label="Şehir"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="phoneNumber"
                  label="Telefon"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  label="E-posta"
                  rules={[{ type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }]}
                >
                  <Input />
                </Form.Item>
              </div>
            </Card>
          </TabPane>
          
          <TabPane tab="Adresler" key="2">
            <Card>
              {vendor.addresses && vendor.addresses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {vendor.addresses.map((address: VendorAddress, index: number) => (
                    <Card key={index} className="mb-2" size="small">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="font-bold">Adres Tipi:</p>
                          <p>{address.addressType || '-'}</p>
                        </div>
                        <div>
                          <p className="font-bold">Adres:</p>
                          <p>{address.address || '-'}</p>
                        </div>
                        <div>
                          <p className="font-bold">Ülke:</p>
                          <p>{address.country || '-'}</p>
                        </div>
                        <div>
                          <p className="font-bold">Şehir:</p>
                          <p>{address.city || '-'}</p>
                        </div>
                      </div>
                      <Divider />
                      <div className="flex justify-end">
                        <Button type="primary" size="small">
                          Düzenle
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>Kayıtlı adres bulunamadı.</p>
              )}
              <Divider />
              <div className="flex justify-end">
                <Button type="primary">
                  Yeni Adres Ekle
                </Button>
              </div>
            </Card>
          </TabPane>
          
          <TabPane tab="İletişim Bilgileri" key="3">
            <Card>
              {vendor.communications && vendor.communications.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {vendor.communications.map((comm: VendorCommunication, index: number) => (
                    <Card key={index} className="mb-2" size="small">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="font-bold">İletişim Tipi:</p>
                          <p>{comm.communicationType || '-'}</p>
                        </div>
                        <div>
                          <p className="font-bold">İletişim Bilgisi:</p>
                          <p>{comm.commAddress || '-'}</p>
                        </div>
                      </div>
                      <Divider />
                      <div className="flex justify-end">
                        <Button type="primary" size="small">
                          Düzenle
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>Kayıtlı iletişim bilgisi bulunamadı.</p>
              )}
              <Divider />
              <div className="flex justify-end">
                <Button type="primary">
                  Yeni İletişim Bilgisi Ekle
                </Button>
              </div>
            </Card>
          </TabPane>
          
          <TabPane tab="Kişiler" key="4">
            <Card>
              {vendor.contacts && vendor.contacts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {vendor.contacts.map((contact: VendorContact, index: number) => (
                    <Card key={index} className="mb-2" size="small">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="font-bold">Ad Soyad:</p>
                          <p>{`${contact.firstName || ''} ${contact.lastName || ''}`}</p>
                        </div>
                        <div>
                          <p className="font-bold">Pozisyon:</p>
                          <p>{contact.jobTitle || '-'}</p>
                        </div>
                        <div>
                          <p className="font-bold">Telefon:</p>
                          <p>{contact.phoneNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="font-bold">E-posta:</p>
                          <p>{contact.email || '-'}</p>
                        </div>
                      </div>
                      <Divider />
                      <div className="flex justify-end">
                        <Button type="primary" size="small">
                          Düzenle
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>Kayıtlı kişi bulunamadı.</p>
              )}
              <Divider />
              <div className="flex justify-end">
                <Button type="primary">
                  Yeni Kişi Ekle
                </Button>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Form>
    </div>
  );
};

export default VendorEdit;
