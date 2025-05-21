import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { customerService } from '../../services/customerService';
import { Vendor, VendorAddress, VendorCommunication, VendorContact } from '../../types/vendor';
import { ApiResponse } from '../../types/api';

const { TabPane } = Tabs;

const VendorDetail: React.FC = () => {
  const { vendorCode } = useParams<{ vendorCode: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
  }, [vendorCode, navigate]);

  const handleBack = () => {
    navigate('/vendors');
  };

  const handleEdit = () => {
    if (vendorCode) {
      navigate(`/vendors/edit/${vendorCode}`);
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
        <Button type="primary" onClick={handleBack}>
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
          <h1 className="text-xl font-bold m-0">Tedarikçi Detayı</h1>
        </div>
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={handleEdit}
        >
          Düzenle
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold">Tedarikçi Kodu:</p>
            <p>{vendor.currAccCode}</p>
          </div>
          <div>
            <p className="font-bold">Tedarikçi Adı:</p>
            <p>{vendor.currAccDescription}</p>
          </div>
          <div>
            <p className="font-bold">Vergi Numarası:</p>
            <p>{vendor.taxNumber || '-'}</p>
          </div>
          <div>
            <p className="font-bold">Vergi Dairesi:</p>
            <p>{vendor.taxOffice || '-'}</p>
          </div>
          <div>
            <p className="font-bold">Ülke:</p>
            <p>{vendor.country || '-'}</p>
          </div>
          <div>
            <p className="font-bold">Şehir:</p>
            <p>{vendor.city || '-'}</p>
          </div>
          <div>
            <p className="font-bold">Telefon:</p>
            <p>{vendor.phoneNumber || '-'}</p>
          </div>
          <div>
            <p className="font-bold">E-posta:</p>
            <p>{vendor.email || '-'}</p>
          </div>
        </div>
      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Adresler" key="1">
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
                      <div>
                        <p className="font-bold">Posta Kodu:</p>
                        <p>{address.postalCode || '-'}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p>Kayıtlı adres bulunamadı.</p>
            )}
          </Card>
        </TabPane>
        <TabPane tab="İletişim Bilgileri" key="2">
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
                  </Card>
                ))}
              </div>
            ) : (
              <p>Kayıtlı iletişim bilgisi bulunamadı.</p>
            )}
          </Card>
        </TabPane>
        <TabPane tab="Kişiler" key="3">
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
                  </Card>
                ))}
              </div>
            ) : (
              <p>Kayıtlı kişi bulunamadı.</p>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default VendorDetail;
