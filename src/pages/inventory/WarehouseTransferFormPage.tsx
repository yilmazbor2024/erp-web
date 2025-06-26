import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, message, Spin } from 'antd';
import WarehouseTransferForm from '../../components/inventory/WarehouseTransferForm';
import warehouseTransferApi from '../../services/warehouseTransferApi';

const WarehouseTransferFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { transferNumber } = useParams<{ transferNumber: string }>();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [initialValues, setInitialValues] = useState<any>(null);

  // Sayfa yüklendiğinde depoları ve varsa mevcut sevk bilgilerini getir
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Depoları getir
        const warehousesData = await warehouseTransferApi.getWarehouses();
        console.log('Depolar:', warehousesData);
        
        // Her bir depoyu kontrol et
        if (warehousesData && warehousesData.length > 0) {
          warehousesData.forEach((warehouse, index) => {
            console.log(`Depo ${index + 1}:`, {
              kod: warehouse.warehouseCode,
              isim: warehouse.warehouseDescription,
              isimVar: !!warehouse.warehouseDescription
            });
          });
        } else {
          console.warn('Depo listesi boş veya tanımsız!');
        }
        
        setWarehouses(warehousesData);
        
        // Eğer transferNumber varsa, mevcut sevk bilgilerini getir (düzenleme modu)
        if (transferNumber) {
          const transferData = await warehouseTransferApi.getWarehouseTransferByNumber(transferNumber);
          if (transferData) {
            const transferItems = await warehouseTransferApi.getWarehouseTransferItems(transferNumber);
            
            setInitialValues({
              ...transferData,
              items: transferItems
            });
          } else {
            message.error('Sevk kaydı bulunamadı');
            navigate('/inventory/warehouse-transfers');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [transferNumber, navigate]);

  // Form kaydetme işlemi
  const handleSave = async (formData: any) => {
    setSaveLoading(true);
    try {
      let result;
      
      if (transferNumber) {
        message.warning('Güncelleme fonksiyonu henüz eklenmedi');
        result = null;
      } else {
        console.log('Form verileri:', formData);
        
        // API'nin beklediği veri yapısına uygun olarak düzenle
        const requestData = {
          sourceWarehouseCode: formData.sourceWarehouseCode,
          targetWarehouseCode: formData.targetWarehouseCode,
          description: formData.description || '',
          // Tarih formatını kontrol et (yyyy-MM-dd)
          operationDate: formData.operationDate ? 
            (typeof formData.operationDate === 'string' ? 
              formData.operationDate : 
              formData.operationDate.toISOString().split('T')[0]) : 
            new Date().toISOString().split('T')[0],
          // Sevkiyat yöntemi kodu - API tarafından zorunlu, her zaman "1" değerini gönderiyoruz
          shipmentMethodCode: "1",
          items: formData.items.map((item: any) => {
            console.log('İşlenen ürün satırı:', item);
            
            // Tüm gerekli alanların doğru formatta olduğundan emin ol
            const processedItem = {
              itemCode: item.itemCode,
              colorCode: item.colorCode || '',
              itemDim1Code: item.itemDim1Code || '',
              quantity: parseFloat(item.quantity), // Kesinlikle sayı olduğundan emin ol
              unitCode: item.unitCode || 'AD',
              lineDescription: item.lineDescription || '',
              // Barkod alanı - API tarafından zorunlu
              barcode: item.barcode || `${item.itemCode}${item.colorCode || ''}${item.itemDim1Code || ''}`
            };
            
            console.log('Düzenlenmiş ürün satırı:', processedItem);
            return processedItem;
          })
        };
        
        console.log('API isteği:', JSON.stringify(requestData, null, 2));
        console.log('API isteği tür kontrolü:', {
          sourceWarehouseCode: typeof requestData.sourceWarehouseCode,
          targetWarehouseCode: typeof requestData.targetWarehouseCode,
          description: typeof requestData.description,
          operationDate: typeof requestData.operationDate,
          items: Array.isArray(requestData.items) ? 'array' : typeof requestData.items,
          itemCount: requestData.items.length
        });

        result = await warehouseTransferApi.createWarehouseTransfer(requestData);
      }
      
      if (result) {
        message.success(`Sevk kaydı başarıyla ${transferNumber ? 'güncellendi' : 'oluşturuldu'}`);
        message.info(`Fiş Numarası: ${result}`);
        navigate(`/inventory/warehouse-transfers/${result}`);
      } else {
        message.error(`Sevk kaydı ${transferNumber ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu`);
      }
    } catch (error) {
      console.error('Error saving warehouse transfer:', error);
      message.error(`Sevk kaydı ${transferNumber ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu`);
    } finally {
      setSaveLoading(false);
    }
  };

  // İptal işlemi
  const handleCancel = () => {
    navigate('/inventory/warehouse-transfers');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Yükleniyor..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '5px' }}>
      <Card 
        title={transferNumber ? `Sevk Fişi Düzenle: ${transferNumber}` : 'Yeni Sevk Fişi Oluştur'} 
        bordered={false}
        styles={{ body: { padding: '5px' } }}
      >
        <WarehouseTransferForm
          warehouses={warehouses}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={saveLoading}
          initialValues={initialValues}
        />
      </Card>
    </div>
  );
};

export default WarehouseTransferFormPage;
