import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, message, Spin } from 'antd';
import ProductionOrderForm from '../../components/inventory/ProductionOrderForm';
import productionOrderApi from '../../services/productionOrderApi';

const ProductionOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [initialValues, setInitialValues] = useState<any>(null);

  // Sayfa yüklendiğinde depoları ve varsa mevcut fiş bilgilerini getir
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Depoları getir
        const warehousesData = await productionOrderApi.getWarehouses();
        console.log('Depolar:', warehousesData);
        
        setWarehouses(warehousesData);
        
        // Eğer orderNumber varsa, mevcut fiş bilgilerini getir (düzenleme modu)
        if (orderNumber) {
          const orderData = await productionOrderApi.getProductionOrderByNumber(orderNumber);
          if (orderData) {
            const orderItems = await productionOrderApi.getProductionOrderItems(orderNumber);
            
            setInitialValues({
              ...orderData,
              items: orderItems
            });
          } else {
            message.error('İmalat fişi bulunamadı');
            navigate('/inventory/production-orders');
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
  }, [orderNumber, navigate]);

  // Form kaydetme işlemi
  const handleSave = async (formData: any) => {
    setSaveLoading(true);
    try {
      let result;
      
      if (orderNumber) {
        message.warning('Güncelleme fonksiyonu henüz eklenmedi');
        result = null;
      } else {
        console.log('Form verileri:', formData);
        
        // API'nin beklediği veri yapısına uygun olarak düzenle
        const requestData = {
          targetWarehouseCode: formData.targetWarehouseCode,
          description: formData.description || '',
          // Tarih formatını kontrol et (yyyy-MM-dd)
          operationDate: formData.operationDate ? 
            (typeof formData.operationDate === 'string' ? 
              formData.operationDate : 
              formData.operationDate.toISOString().split('T')[0]) : 
            new Date().toISOString().split('T')[0],
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
              barcode: item.barcode || ''
            };
            
            console.log('İşlenmiş ürün satırı:', processedItem);
            return processedItem;
          })
        };
        
        console.log('API isteği:', requestData);
        
        // Yeni imalat fişi oluştur
        result = await productionOrderApi.createProductionOrder(requestData);
      }
      
      if (result) {
        message.success('İmalat fişi başarıyla kaydedildi');
        navigate('/inventory/production-orders');
      }
    } catch (error) {
      console.error('Error saving production order:', error);
      message.error('İmalat fişi kaydedilirken bir hata oluştu');
    } finally {
      setSaveLoading(false);
    }
  };

  // İptal işlemi
  const handleCancel = () => {
    navigate('/inventory/production-orders');
  };

  if (loading && !warehouses.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Yükleniyor..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {orderNumber ? 'İmalat Fişi Düzenle' : 'Yeni İmalat Fişi'}
      </h2>
      
      <ProductionOrderForm
        warehouses={warehouses}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saveLoading}
        initialValues={initialValues}
      />
    </div>
  );
};

export default ProductionOrderFormPage;
