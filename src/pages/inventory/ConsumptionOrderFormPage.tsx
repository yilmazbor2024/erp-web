import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, message, Spin } from 'antd';
import ProductionOrderForm, { FormType } from '../../components/inventory/ProductionOrderForm'; // Aynı formu kullanıyoruz
import consumptionOrderApi from '../../services/consumptionOrderApi';

const ConsumptionOrderFormPage: React.FC = () => {
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
        const warehousesData = await consumptionOrderApi.getWarehouses();
        console.log('Depolar:', warehousesData);
        
        setWarehouses(warehousesData);
        
        // Eğer innerNumber varsa, mevcut fiş bilgilerini getir (düzenleme modu)
        if (innerNumber) {
          const orderData = await consumptionOrderApi.getConsumptionOrderByNumber(innerNumber);
          if (orderData) {
            const orderItems = await consumptionOrderApi.getConsumptionOrderItems(innerNumber);
            
            setInitialValues({
              ...orderData,
              items: orderItems
            });
          } else {
            message.error('Sair Sarf Fişi bulunamadı');
            navigate('/inventory/consumption-orders');
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

  // Form gönderildiğinde
  const handleSubmit = async (values: any) => {
    console.log('Form değerleri:', values);
    setSaveLoading(true);
    
    try {
      // Yeni bir fiş oluştur
      const result = await consumptionOrderApi.createConsumptionOrder({
        targetWarehouseCode: values.targetWarehouseCode,
        operationDate: values.operationDate,
        description: values.description,
        items: values.items.map((item: any) => ({
          itemCode: item.itemCode,
          colorCode: item.colorCode,
          itemDim1Code: item.itemDim1Code,
          itemDim2Code: item.itemDim2Code,
          itemDim3Code: item.itemDim3Code,
          quantity: item.quantity, // Düzeltildi: Quantity -> quantity
          unitCode: item.unitCode,
          lineDescription: item.lineDescription,
          itemTypeCode: item.itemTypeCode || 1, // Varsayılan olarak Ürün
          currencyCode: item.currencyCode || 'TRY',
          costPrice: item.costPrice || 0,
          costAmount: item.costAmount || 0,
          costPriceWithInflation: item.costPriceWithInflation || 0,
          costAmountWithInflation: item.costAmountWithInflation || 0
        }))
      });
      
      // Detaylı log ekleyerek result değişkeninin tipini ve değerini kontrol ediyoruz
      console.log('Result değeri:', result);
      console.log('Result tipi:', typeof result);
      console.log('Result JSON:', JSON.stringify(result));
      
      if (result) {
        // result bir nesne olduğu için doğrudan transferNumber alanını kullan
        const resultOrderNumber = result.transferNumber || result.orderNumber;
        console.log('ResultOrderNumber değeri:', resultOrderNumber);
        console.log('ResultOrderNumber tipi:', typeof resultOrderNumber);
        
        message.success('Sair Sarf Fişi başarıyla oluşturuldu');
        message.info(`Fiş Numarası: ${resultOrderNumber}`);
        navigate(`/inventory/consumption-orders/${resultOrderNumber}`);
      } else {
        message.error('Sair Sarf Fişi oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error creating consumption order:', error);
      message.error('Sair Sarf Fişi oluşturulurken bir hata oluştu');
    } finally {
      setSaveLoading(false);
    }
  };

  // İptal edildiğinde
  const handleCancel = () => {
    navigate('/inventory/consumption-orders');
  };

  return (
    <Spin spinning={loading}>
      <Card title={innerNumber ? 'Sair Sarf Fişi Düzenle' : 'Yeni Sair Sarf Fişi'} bordered={false}>
        <ProductionOrderForm
          warehouses={warehouses}
          initialValues={initialValues}
          onSave={handleSubmit}
          onCancel={handleCancel}
          loading={saveLoading}
          formType={FormType.CONSUMPTION_ORDER} // Sarf fişi tipi
        />
      </Card>
    </Spin>
  );
};

export default ConsumptionOrderFormPage;
