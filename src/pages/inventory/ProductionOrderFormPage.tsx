import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, message, Spin } from 'antd';
import ProductionOrderForm, { FormType } from '../../components/inventory/ProductionOrderForm';
import productionOrderApi from '../../services/productionOrderApi';

const ProductionOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { innerNumber } = useParams<{ innerNumber: string }>();
  
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
        
        // Eğer innerNumber varsa, mevcut fiş bilgilerini getir (düzenleme modu)
        if (innerNumber) {
          const orderData = await productionOrderApi.getProductionOrderByNumber(innerNumber);
          if (orderData) {
            const orderItems = await productionOrderApi.getProductionOrderItems(innerNumber);
            
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
  }, [innerNumber, navigate]);

  // Form kaydetme işlemi
  const handleSave = async (formData: any) => {
    setSaveLoading(true);
    try {
      let result;
      
      if (innerNumber) {
        message.warning('Güncelleme fonksiyonu henüz eklenmedi');
        result = null;
      } else {
        console.log('Form verileri:', formData);
        
        // API'nin beklediği veri yapısına uygun olarak düzenle
        const requestData = {
          // Üretim siparişleri için sadece hedef depo kullanılır
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
          innerProcessCode: "OP", // Üretim siparişi için OP (Operation) kodu
          items: formData.items.map((item: any) => {
            console.log('İşlenen ürün satırı:', item);
            
            // Tüm gerekli alanların doğru formatta olduğundan emin ol
            const processedItem = {
              itemCode: item.itemCode,
              colorCode: item.colorCode || '',
              itemDim1Code: item.itemDim1Code || '',
              itemDim2Code: item.itemDim2Code || '', // itemDim2Code eklendi
              itemDim3Code: item.itemDim3Code || '', // itemDim3Code eklendi
              itemTypeCode: item.itemTypeCode, // itemTypeCode eklendi - backend'den gelen gerçek değer kullanılıyor
              Quantity: parseFloat(item.Quantity || item.quantity), // Kesinlikle sayı olduğundan emin ol
              unitCode: item.unitCode || 'AD', // Birim kodu (varsayılan: AD)
              lineDescription: item.lineDescription || '',
              // Barkod alanı - API tarafından zorunlu
              barcode: item.barcode || `${item.itemCode}${item.colorCode || ''}${item.itemDim1Code || ''}`
            };
            
            console.log('İşlenmiş ürün satırı:', processedItem);
            return processedItem;
          })
        };
        
        console.log('API isteği:', JSON.stringify(requestData, null, 2));
        console.log('API isteği tür kontrolü:', {
          targetWarehouseCode: typeof requestData.targetWarehouseCode,
          description: typeof requestData.description,
          operationDate: typeof requestData.operationDate,
          items: Array.isArray(requestData.items) ? 'array' : typeof requestData.items,
          itemCount: requestData.items.length
        });

        result = await productionOrderApi.createProductionOrder(requestData);
      }
      
      // Detaylı log ekleyerek result değişkeninin tipini ve değerini kontrol ediyoruz
      console.log('Result değeri:', result);
      console.log('Result tipi:', typeof result);
      console.log('Result JSON:', JSON.stringify(result));
      
      if (result) {
        // result bir nesne olduğu için doğrudan transferNumber alanını kullan
        const resultInnerNumber = result.transferNumber || result.orderNumber;
        console.log('ResultInnerNumber değeri:', resultInnerNumber);
        console.log('ResultInnerNumber tipi:', typeof resultInnerNumber);
        
        message.success(`İmalat fişi başarıyla ${innerNumber ? 'güncellendi' : 'oluşturuldu'}`);
        message.info(`Fiş Numarası: ${resultInnerNumber}`);
        navigate(`/inventory/production-orders/${resultInnerNumber}`);
      } else {
        message.error(`İmalat fişi ${innerNumber ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu`);
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
        {innerNumber ? 'İmalat Fişi Düzenle' : 'Yeni İmalat Fişi'}
      </h2>
      
      <ProductionOrderForm
        warehouses={warehouses}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saveLoading}
        initialValues={initialValues}
        formType={FormType.PRODUCTION_ORDER} // İmalat fişi tipi
      />
    </div>
  );
};

export default ProductionOrderFormPage;
