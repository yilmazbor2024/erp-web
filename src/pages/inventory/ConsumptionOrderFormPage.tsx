import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, message, Spin } from 'antd';
import ProductionOrderForm from '../../components/inventory/ProductionOrderForm'; // Aynı formu kullanıyoruz
import consumptionOrderApi from '../../services/consumptionOrderApi';

const ConsumptionOrderFormPage: React.FC = () => {
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
        const warehousesData = await consumptionOrderApi.getWarehouses();
        console.log('Depolar:', warehousesData);
        
        setWarehouses(warehousesData);
        
        // Eğer orderNumber varsa, mevcut fiş bilgilerini getir (düzenleme modu)
        if (orderNumber) {
          const orderData = await consumptionOrderApi.getConsumptionOrderByNumber(orderNumber);
          if (orderData) {
            const orderItems = await consumptionOrderApi.getConsumptionOrderItems(orderNumber);
            
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
  }, [orderNumber, navigate]);

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
          Quantity: item.quantity,
          unitCode: item.unitCode,
          lineDescription: item.lineDescription
        }))
      });
      
      if (result) {
        message.success('Sair Sarf Fişi başarıyla oluşturuldu');
        navigate(`/inventory/consumption-orders/${result}`);
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
      <Card title={orderNumber ? 'Sair Sarf Fişi Düzenle' : 'Yeni Sair Sarf Fişi'} bordered={false}>
        <ProductionOrderForm
          warehouses={warehouses}
          initialValues={initialValues}
          onSave={handleSubmit}
          onCancel={handleCancel}
          loading={saveLoading}
        />
      </Card>
    </Spin>
  );
};

export default ConsumptionOrderFormPage;
