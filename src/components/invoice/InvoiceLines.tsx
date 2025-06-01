import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Row, Col, InputNumber, Popconfirm, Select } from 'antd';
import { DeleteOutlined, BarcodeOutlined, SearchOutlined } from '@ant-design/icons';
import { ProductVariant } from '../../services/productApi';

const { Option } = Select;

interface InvoiceDetail {
  id: string;
  itemCode: string;
  quantity: number;
  unitOfMeasureCode: string;
  unitPrice: number;
  vatRate: number;
  description?: string;
  discountRate?: number;
  productDescription?: string;
  totalAmount?: number;
  discountAmount?: number;
  subtotalAmount?: number;
  vatAmount?: number;
  netAmount?: number;
  colorCode?: string;
  colorDescription?: string;
  itemDim1Code?: string;
}

interface InvoiceLinesProps {
  invoiceDetails: InvoiceDetail[];
  units: any[];
  products: any[];
  loadingProducts: boolean;
  showBarcodeModal: () => void;
  addInvoiceDetail: () => void;
  updateInvoiceDetail: (id: string, field: string, value: any) => void;
  removeInvoiceDetail: (id: string) => void;
  calculateLineAmounts: (detail: InvoiceDetail) => InvoiceDetail;
  isPriceIncludeVat: boolean;
  currencyCode?: string;
  form?: any;
}

const InvoiceLines: React.FC<InvoiceLinesProps> = ({
  invoiceDetails,
  units,
  products,
  loadingProducts,
  showBarcodeModal,
  addInvoiceDetail,
  updateInvoiceDetail,
  removeInvoiceDetail,
  calculateLineAmounts,
  isPriceIncludeVat,
  currencyCode,
  form
}) => {
  // Para birimi kodu al, yoksa TRY kullan
  const currency = currencyCode || (form ? form.getFieldValue('docCurrencyCode') : null) || 'TRY';
  
  // Para birimi sembolünü belirle
  const getCurrencySymbol = (code: string) => {
    switch(code) {
      case 'TRY': return '₺';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code; // Bilinmeyen para birimleri için kodu göster
    }
  };
  
  const currencySymbol = getCurrencySymbol(currency);
  const [filterText, setFilterText] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Ekran boyutunu kontrol et
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // İlk yükleme kontrolü
    checkMobile();
    
    // Ekran boyutu değiştiğinde kontrol et
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Satırları filtrele
  const filteredDetails = filterText
    ? invoiceDetails.filter(detail => 
        detail.itemCode.toLowerCase().includes(filterText.toLowerCase()) ||
        (detail.productDescription && detail.productDescription.toLowerCase().includes(filterText.toLowerCase()))
      )
    : invoiceDetails;

  // Seçili satırları sil
  const removeSelectedDetails = () => {
    selectedRowKeys.forEach(id => removeInvoiceDetail(id));
    setSelectedRowKeys([]);
  };

  // Mobil için stil tanımları
  const mobileStyles = {
    button: {
      fontSize: isMobile ? '12px' : '14px',
      padding: isMobile ? '0 8px' : undefined,
      height: isMobile ? '32px' : undefined
    },
    buttonContainer: {
      display: 'flex' as const,
      gap: '8px',
      marginBottom: '8px',
      flexWrap: 'wrap' as const
    },
    tableContainer: {
      overflowX: 'auto' as const
    }
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Ürn',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 60,
      render: (text: string, record: InvoiceDetail) => (
        <Select
          showSearch
          value={text}
          placeholder="Ürün seçiniz"
          style={{ width: '100%' }}
          loading={loadingProducts}
          onChange={(value) => updateInvoiceDetail(record.id, 'itemCode', value)}
          filterOption={(input, option) => {
            if (!input || input.length < 3 || !option || !option.children) return true;
            
            let childText = '';
            if (typeof option.children === 'string') {
              childText = option.children;
            } else if (React.isValidElement(option.children)) {
              childText = (option.children as any).props.children?.toString() || '';
            }
            
            return childText.toLowerCase().includes(input.toLowerCase());
          }}
        >
          {products.map((product, index) => (
            <Option key={product.code || `product-${index}`} value={product.code || ''}>{product.code} - {product.description}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Açk',
      dataIndex: 'productDescription',
      key: 'productDescription',
      width: 60,
      render: (text: string, record: InvoiceDetail) => (
        <Input
          value={text}
          onChange={(e) => updateInvoiceDetail(record.id, 'productDescription', e.target.value)}
        />
      )
    },
    {
      title: 'Mik',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 50,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text}
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = {
                ...record,
                quantity: value
              };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'quantity', value);
            }
          }}
        />
      )
    },
    {
      title: 'Brm',
      dataIndex: 'unitOfMeasureCode',
      key: 'unitOfMeasureCode',
      width: 50,
      render: (text: string, record: InvoiceDetail) => (
        <Select
          value={text}
          style={{ width: '100%' }}
          onChange={(value) => updateInvoiceDetail(record.id, 'unitOfMeasureCode', value)}
        >
          {units.map(unit => <Option key={unit.code} value={unit.code}>{unit.code}</Option>)}
        </Select>
      )
    },
    {
      title: `Fiyat`,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 60,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text}
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => parseFloat(value!.replace(/\$\s?|(,*)/g, ''))}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = {
                ...record,
                unitPrice: value
              };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'unitPrice', value);
            }
          }}
        />
      )
    },
    {
      title: 'İsk',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 40,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text || 0}
          min={0}
          max={100}
          step={1}
          precision={0}
          style={{ width: '100%' }}
          formatter={value => `${value}%`}
          parser={(value) => parseFloat(value!.replace('%', ''))}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = {
                ...record,
                discountRate: value
              };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'discountRate', value);
            }
          }}
        />
      )
    },
    {
      title: 'KDV',
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 40,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text}
          min={0}
          max={100}
          step={1}
          precision={0}
          style={{ width: '100%' }}
          formatter={value => `${value}%`}
          parser={(value) => parseFloat(value!.replace('%', ''))}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = {
                ...record,
                vatRate: value
              };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'vatRate', value);
            }
          }}
        />
      )
    },
    {
      title: `Top`,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 60,
      render: (text: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {text?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: `Net`,
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 60,
      render: (text: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {text?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_: any, record: InvoiceDetail) => (
        <Popconfirm
          title="Bu satırı silmek istediğinize emin misiniz?"
          onConfirm={() => removeInvoiceDetail(record.id)}
          okText="Evet"
          cancelText="Hayır"
        >
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <div className="invoice-lines">
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col span={24}>
          <div style={mobileStyles.buttonContainer}>
            <Button 
              type="primary" 
              icon={<BarcodeOutlined />} 
              onClick={showBarcodeModal}
              style={mobileStyles.button}
            >
              Satır Ekle
            </Button>
            <Button 
              type="primary"
              style={{ 
                ...mobileStyles.button,
                backgroundColor: isPriceIncludeVat ? '#52c41a' : '#1890ff' 
              }}
              onClick={() => updateInvoiceDetail('', 'isPriceIncludeVat', !isPriceIncludeVat)}
            >
              {isPriceIncludeVat ? "KDV Dahil" : "KDV Hariç"}
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`${selectedRowKeys.length} satırı silmek istediğinize emin misiniz?`}
                onConfirm={removeSelectedDetails}
                okText="Evet"
                cancelText="Hayır"
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  style={mobileStyles.button}
                >
                  Seçilenleri Sil ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </div>
        </Col>
        <Col span={24}>
          <Input
            placeholder="Ürün kodu veya açıklaması ile filtrele"
            prefix={<SearchOutlined />}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <div style={mobileStyles.tableContainer}>
        <Table
          dataSource={filteredDetails}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: '100%', y: 300 }}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          summary={(pageData) => {
            let totalQuantity = 0;
            let totalAmount = 0;
            let totalNetAmount = 0;

            pageData.forEach(({ quantity, totalAmount: lineTotal, netAmount }) => {
              totalQuantity += quantity || 0;
              totalAmount += lineTotal || 0;
              totalNetAmount += netAmount || 0;
            });

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <strong>Toplam</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>{totalQuantity.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={4}></Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <strong>{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <strong>{totalNetAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </div>
    </div>
  );
};

export default InvoiceLines;
