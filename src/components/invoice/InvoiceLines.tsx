import React, { useState } from 'react';
import { Table, Button, Input, Space, Row, Col, InputNumber, Popconfirm, Select, Badge } from 'antd';
import { DeleteOutlined, BarcodeOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
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

  // Tablo sütunları
  const columns = [
    {
      title: 'Ürün',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 80,
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
      width: 80,
      render: (text: string, record: InvoiceDetail) => (
        <Input
          value={text}
          onChange={(e) => updateInvoiceDetail(record.id, 'productDescription', e.target.value)}
          placeholder="Ürün açıklaması"
        />
      )
    },
    {
      title: 'Mik',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text}
          min={0.01}
          step={1}
          precision={2}
          style={{ width: '100%' }}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = { ...record, quantity: value };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'quantity', value);
              updateInvoiceDetail(record.id, 'totalAmount', calculatedDetail.totalAmount);
              updateInvoiceDetail(record.id, 'discountAmount', calculatedDetail.discountAmount);
              updateInvoiceDetail(record.id, 'subtotalAmount', calculatedDetail.subtotalAmount);
              updateInvoiceDetail(record.id, 'vatAmount', calculatedDetail.vatAmount);
              updateInvoiceDetail(record.id, 'netAmount', calculatedDetail.netAmount);
            }
          }}
        />
      )
    },
    {
      title: 'Brm',
      dataIndex: 'unitOfMeasureCode',
      key: 'unitOfMeasureCode',
      width: 60,
      render: (text: string, record: InvoiceDetail) => (
        <Select
          value={text}
          style={{ width: '100%' }}
          onChange={(value) => updateInvoiceDetail(record.id, 'unitOfMeasureCode', value)}
        >
          {units.map((unit, index) => (
            <Option key={unit.code || `unit-${index}`} value={unit.code || ''}>{unit.code}</Option>
          ))}
        </Select>
      )
    },
    {
      title: `B.Fiyat`,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 80,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text}
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = { ...record, unitPrice: value };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'unitPrice', value);
              updateInvoiceDetail(record.id, 'totalAmount', calculatedDetail.totalAmount);
              updateInvoiceDetail(record.id, 'discountAmount', calculatedDetail.discountAmount);
              updateInvoiceDetail(record.id, 'subtotalAmount', calculatedDetail.subtotalAmount);
              updateInvoiceDetail(record.id, 'vatAmount', calculatedDetail.vatAmount);
              updateInvoiceDetail(record.id, 'netAmount', calculatedDetail.netAmount);
            }
          }}
        />
      )
    },
    {
      title: 'İsk%',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 60,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text || 0}
          min={0}
          max={100}
          step={1}
          precision={2}
          style={{ width: '100%' }}
          formatter={(value) => `${value}%`}
          parser={(value) => Number(value!.replace('%', ''))}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = { ...record, discountRate: value };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'discountRate', value);
              updateInvoiceDetail(record.id, 'discountAmount', calculatedDetail.discountAmount);
              updateInvoiceDetail(record.id, 'subtotalAmount', calculatedDetail.subtotalAmount);
              updateInvoiceDetail(record.id, 'vatAmount', calculatedDetail.vatAmount);
              updateInvoiceDetail(record.id, 'netAmount', calculatedDetail.netAmount);
            }
          }}
        />
      )
    },
    {
      title: 'KDV%',
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 60,
      render: (text: number, record: InvoiceDetail) => (
        <InputNumber
          value={text}
          min={0}
          max={100}
          step={1}
          precision={0}
          style={{ width: '100%' }}
          formatter={(value) => `${value}%`}
          parser={(value) => Number(value!.replace('%', ''))}
          onChange={(value) => {
            if (value !== null) {
              const updatedDetail = { ...record, vatRate: value };
              const calculatedDetail = calculateLineAmounts(updatedDetail);
              updateInvoiceDetail(record.id, 'vatRate', value);
              updateInvoiceDetail(record.id, 'vatAmount', calculatedDetail.vatAmount);
              updateInvoiceDetail(record.id, 'netAmount', calculatedDetail.netAmount);
            }
          }}
        />
      )
    },
    {
      title: `Toplam`,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 80,
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
      width: 80,
      render: (text: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {text?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 80,
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
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Space>
            <Button 
              type="primary" 
              icon={<BarcodeOutlined />} 
              onClick={showBarcodeModal}
            >
              Satır Ekle
            </Button>
            <Button 
              type="primary"
              style={{ backgroundColor: isPriceIncludeVat ? '#52c41a' : '#1890ff' }}
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
                >
                  Seçilenleri Sil ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Col>
        <Col xs={24} sm={12}>
          <Input
            placeholder="Ürün kodu veya açıklaması ile filtrele"
            prefix={<SearchOutlined />}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <div className="invoice-lines-table">
        <Table
          dataSource={filteredDetails}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 'max-content', y: 400 }}
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
