import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import EditableTable, { EditableTableColumn } from './EditableTable';
import productApi from '../../services/productApi';

// Fatura detayı arayüzü
interface InvoiceDetail {
  id: string;
  itemCode: string;
  productDescription?: string;
  colorDescription?: string;
  itemDim1Code?: string;
  quantity: number;
  unitOfMeasureCode: string;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  totalAmount?: number;
}

// Örnek birimler
const units = [
  { value: 'ADET', label: 'ADET' },
  { value: 'KG', label: 'KG' },
  { value: 'METRE', label: 'METRE' },
  { value: 'LITRE', label: 'LITRE' }
];

// KDV oranları
const vatRates = [
  { value: 0, label: '%0' },
  { value: 1, label: '%1' },
  { value: 8, label: '%8' },
  { value: 10, label: '%10' },
  { value: 18, label: '%18' },
  { value: 20, label: '%20' }
];

const InvoiceTableExample: React.FC = () => {
  // Fatura detayları için state
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Ürünleri yükle
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        // Örnek ürün listesi
        const mockProducts = [
          { code: 'P001', description: 'Ürün 1', price: 100 },
          { code: 'P002', description: 'Ürün 2', price: 200 },
          { code: 'P003', description: 'Ürün 3', price: 300 }
        ];
        setProducts(mockProducts);
      } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Toplam tutarı hesapla
  const calculateTotalAmount = (detail: InvoiceDetail): number => {
    const quantity = detail.quantity || 0;
    const unitPrice = detail.unitPrice || 0;
    const discountRate = detail.discountRate || 0;
    
    const amount = quantity * unitPrice;
    const discountAmount = amount * (discountRate / 100);
    
    return amount - discountAmount;
  };
  
  // Fatura detaylarını güncelle
  const updateInvoiceDetails = (details: InvoiceDetail[]) => {
    // Toplam tutarları hesapla
    const updatedDetails = details.map(detail => ({
      ...detail,
      totalAmount: calculateTotalAmount(detail)
    }));
    
    setInvoiceDetails(updatedDetails);
  };
  
  // Yeni satır ekle
  const handleAddRow = (): InvoiceDetail => {
    return {
      id: uuidv4(),
      itemCode: '',
      productDescription: '',
      colorDescription: '',
      itemDim1Code: '',
      quantity: 1,
      unitOfMeasureCode: 'ADET',
      unitPrice: 0,
      vatRate: 18,
      discountRate: 0,
      totalAmount: 0
    };
  };
  
  // Ürün koduna göre ürün bilgilerini getir
  const handleProductChange = async (value: string, record: InvoiceDetail, index: number) => {
    if (!value) return;
    
    const product = products.find(p => p.code === value);
    if (product) {
      const updatedDetails = [...invoiceDetails];
      updatedDetails[index] = {
        ...updatedDetails[index],
        productDescription: product.description,
        unitPrice: product.price
      };
      
      updateInvoiceDetails(updatedDetails);
    }
  };
  
  // Tablo sütunlarını tanımla
  const columns: EditableTableColumn[] = [
    {
      title: 'Ürün Kodu',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 'auto',
      inputType: 'select',
      options: products.map(p => ({ value: p.code, label: p.code })),
      onChange: handleProductChange
    },
    {
      title: 'Açıklama',
      dataIndex: 'productDescription',
      key: 'productDescription',
      width: 'auto',
      inputType: 'text'
    },
    {
      title: 'Renk',
      dataIndex: 'colorDescription',
      key: 'colorDescription',
      width: 'auto',
      inputType: 'text',
      disabled: true
    },
    {
      title: 'Beden',
      dataIndex: 'itemDim1Code',
      key: 'itemDim1Code',
      width: 'auto',
      inputType: 'text',
      disabled: true
    },
    {
      title: 'Miktar',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 150,
      inputType: 'number',
      min: 0.001,
      step: 0.001,
      onChange: (value, record, index) => {
        // Birim ADET ise ve küsurat girilmişse, tam sayıya yuvarla
        if (record.unitOfMeasureCode === 'ADET' && value && !Number.isInteger(value)) {
          const updatedDetails = [...invoiceDetails];
          updatedDetails[index].quantity = Math.round(value);
          updateInvoiceDetails(updatedDetails);
        }
      }
    },
    {
      title: 'Birim',
      dataIndex: 'unitOfMeasureCode',
      key: 'unitOfMeasureCode',
      width: 150,
      inputType: 'select',
      options: units,
      onChange: (value, record, index) => {
        // Birim değiştiğinde, miktarı da kontrol et ve gerekirse düzelt
        const isUnitAdet = value === 'ADET';
        if (isUnitAdet && record.quantity && !Number.isInteger(record.quantity)) {
          const updatedDetails = [...invoiceDetails];
          updatedDetails[index].quantity = Math.round(record.quantity);
          updateInvoiceDetails(updatedDetails);
        }
      }
    },
    {
      title: 'Birim Fiyat',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      inputType: 'number',
      min: 0,
      step: 0.01,
      formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      parser: (value) => value!.replace(/\$\s?|(,*)/g, '')
    },
    {
      title: 'KDV (%)',
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 100,
      inputType: 'select',
      options: vatRates
    },
    {
      title: 'İskonto (%)',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 100,
      inputType: 'number',
      min: 0,
      max: 100
    },
    {
      title: 'Toplam',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      editable: false,
      render: (value) => (
        <span>
          {(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </span>
      )
    }
  ];
  
  return (
    <Card title="Fatura Detayları">
      <EditableTable
        columns={columns}
        dataSource={invoiceDetails}
        onDataChange={updateInvoiceDetails}
        rowKey="id"
        addButtonText="Yeni Satır Ekle"
        onAddRow={handleAddRow}
        onDeleteRow={(record, index) => {
          if (invoiceDetails.length === 1) {
            message.warning('En az bir satır bulunmalıdır');
            return false;
          }
          return true;
        }}
        disableEnterSubmit={true}
        bordered
      />
    </Card>
  );
};

export default InvoiceTableExample;
