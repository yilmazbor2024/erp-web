import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Form, Input, Select, DatePicker, InputNumber, Space, Divider, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceApi from '../../services/invoiceApi';

const { Title } = Typography;
const { Option } = Select;

// Fatura tipi enum
enum InvoiceType {
  WHOLESALE_SALES = 'WS',
  WHOLESALE_PURCHASE = 'BP',
  EXPENSE_SALES = 'EXP',
  EXPENSE_PURCHASE = 'EP'

}

type InvoiceParams = {
  id?: string;
};

const InvoiceEditPage: React.FC = () => {
  const { id } = useParams<InvoiceParams>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type') || 'wholesale';
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any[]>([]);

  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        let response;

        // Fatura tipine göre API çağrısı yap
        if (type === 'wholesale') {
          response = await invoiceApi.getWholesaleInvoiceById(id);
        } else if (type === 'purchase') {
          response = await invoiceApi.getWholesalePurchaseInvoiceById(id);
        } else if (type === 'expense') {
          response = await invoiceApi.getExpenseInvoiceById(id);
        } else {
          throw new Error('Geçersiz fatura tipi');
        }

        if (response.success) {
          setInvoice(response.data);
          
          // Form alanlarını doldur
          form.setFieldsValue({
            invoiceNumber: response.data.invoiceNumber,
            invoiceDate: dayjs(response.data.invoiceDate),
            invoiceTypeCode: response.data.invoiceTypeCode,
            currAccCode: response.data.customerCode || response.data.vendorCode,
            currAccDescription: response.data.customerDescription || response.data.vendorDescription,
            companyCode: response.data.companyCode,
            warehouseCode: response.data.warehouseCode,
            docCurrencyCode: response.data.docCurrencyCode,
            notes: response.data.notes,
            isEInvoice: response.data.isEInvoice,
            isReturn: response.data.isReturn
          });
          
          // Fatura detaylarını yükle
          const detailsResponse = await invoiceApi.getInvoiceDetails(id);
          if (detailsResponse.success) {
            setInvoiceDetails(detailsResponse.data || []);
            
            // Detay satırlarını form alanlarına ekle
            const details = detailsResponse.data.map((detail: any, index: number) => ({
              key: index,
              itemCode: detail.productCode || detail.itemCode,
              itemDescription: detail.productDescription || detail.itemDescription,
              quantity: detail.qty || detail.quantity,
              unitCode: detail.unitCode,
              unitPrice: detail.unitPrice || detail.price,
              vatRate: detail.vatRate,
              discountRate: detail.discountRate,
              lineDescription: detail.description
            }));
            
            form.setFieldsValue({ details });
          }
        } else {
          message.error(`Fatura bilgileri yüklenirken bir hata oluştu: ${response.message}`);
        }
      } catch (error: any) {
        console.error('Fatura detay yükleme hatası:', error);
        message.error(`Fatura detayları yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceData();
  }, [id, type, form]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      
      // Fatura verilerini hazırla
      const invoiceData = {
        invoiceHeaderID: id,
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        invoiceTypeCode: values.invoiceTypeCode,
        currAccCode: values.currAccCode,
        // Fatura tipine göre currAccTypeCode belirle
        currAccTypeCode: type === 'wholesale' ? 3 : 1, // 3: Müşteri, 1: Tedarikçi
        companyCode: values.companyCode,
        warehouseCode: values.warehouseCode,
        docCurrencyCode: values.docCurrencyCode,
        // Zorunlu para birimi alanları
        localCurrencyCode: 'TRY', // Yerel para birimi her zaman TRY
        exchangeRate: values.exchangeRate || 1, // Form'dan döviz kuru değeri veya varsayılan 1
        notes: values.notes,
        isEInvoice: values.isEInvoice,
        isReturn: values.isReturn,
        details: values.details.map((detail: any) => ({
          itemCode: detail.itemCode,
          quantity: detail.quantity,
          unitOfMeasureCode: detail.unitCode,
          unitPrice: detail.unitPrice,
          vatRate: detail.vatRate,
          discountRate: detail.discountRate,
          description: detail.lineDescription
        }))
      };
      
      // Fatura tipine göre API çağrısı yap
      let response;
      if (type === 'wholesale') {
        response = await invoiceApi.updateWholesaleInvoice(invoiceData);
      } else if (type === 'purchase') {
        response = await invoiceApi.updateWholesalePurchaseInvoice(invoiceData);
      } else if (type === 'expense') {
        response = await invoiceApi.updateExpenseInvoice(invoiceData);
      } else {
        throw new Error('Geçersiz fatura tipi');
      }
      
      if (response && response.success) {
        message.success('Fatura başarıyla güncellendi');
        navigate(`/invoice/${id}?type=${type}`);
      } else {
        message.error(`Fatura güncellenirken bir hata oluştu: ${response?.message || 'Bilinmeyen hata'}`);
      }
    } catch (error: any) {
      console.error('Fatura güncelleme hatası:', error);
      message.error(`Fatura güncellenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    navigate(`/invoice/${id}?type=${type}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Fatura bilgileri yükleniyor..." />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                Geri Dön
              </Button>
              <Title level={4}>Fatura Düzenle</Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => form.submit()}
              >
                Kaydet
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => message.info('Silme özelliği yakında eklenecek.')}
              >
                Sil
              </Button>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            invoiceTypeCode: type === 'wholesale' ? InvoiceType.WHOLESALE_SALES : 
                            type === 'purchase' ? InvoiceType.WHOLESALE_PURCHASE : 
                            InvoiceType.EXPENSE_PURCHASE,
            docCurrencyCode: 'TRY',
            isEInvoice: false,
            isReturn: false,
            details: []
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="invoiceNumber"
                label="Fatura No"
                rules={[{ required: true, message: 'Fatura numarası zorunludur' }]}
              >
                <Input disabled={invoice?.isCompleted} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="invoiceDate"
                label="Fatura Tarihi"
                rules={[{ required: true, message: 'Fatura tarihi zorunludur' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" disabled={invoice?.isCompleted} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="invoiceTypeCode"
                label="Fatura Tipi"
                rules={[{ required: true, message: 'Fatura tipi zorunludur' }]}
              >
                <Select disabled={true}>
                  <Option value={InvoiceType.WHOLESALE_SALES}>Toptan Satış Faturası</Option>
                  <Option value={InvoiceType.WHOLESALE_PURCHASE}>Toptan Alış Faturası</Option>
                  <Option value={InvoiceType.EXPENSE_SALES}>Masraf Satış Faturası</Option>
                  <Option value={InvoiceType.EXPENSE_PURCHASE}>Masraf Alış Faturası</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="docCurrencyCode"
                label="Para Birimi"
                rules={[{ required: true, message: 'Para birimi zorunludur' }]}
              >
                <Select disabled={invoice?.isCompleted}>
                  <Option value="TRY">TRY</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="currAccCode"
                label="Müşteri/Tedarikçi Kodu"
                rules={[{ required: true, message: 'Müşteri/Tedarikçi kodu zorunludur' }]}
              >
                <Input disabled={invoice?.isCompleted} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="currAccDescription"
                label="Müşteri/Tedarikçi Adı"
              >
                <Input disabled={true} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="companyCode"
                label="Şirket Kodu"
                rules={[{ required: true, message: 'Şirket kodu zorunludur' }]}
              >
                <Input disabled={invoice?.isCompleted} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="warehouseCode"
                label="Depo Kodu"
                rules={[{ required: true, message: 'Depo kodu zorunludur' }]}
              >
                <Input disabled={invoice?.isCompleted} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="notes"
                label="Notlar"
              >
                <Input.TextArea rows={4} disabled={invoice?.isCompleted} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="isEInvoice"
                    label="E-Fatura"
                    valuePropName="checked"
                  >
                    <Select disabled={invoice?.isCompleted}>
                      <Option value={true}>Evet</Option>
                      <Option value={false}>Hayır</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="isReturn"
                    label="İade Faturası"
                    valuePropName="checked"
                  >
                    <Select disabled={invoice?.isCompleted}>
                      <Option value={true}>Evet</Option>
                      <Option value={false}>Hayır</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider>Fatura Detayları</Divider>

          <Form.List name="details">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'itemCode']}
                        rules={[{ required: true, message: 'Ürün kodu zorunludur' }]}
                      >
                        <Input placeholder="Ürün Kodu" disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'itemDescription']}
                      >
                        <Input placeholder="Ürün Adı" disabled={true} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Miktar zorunludur' }]}
                      >
                        <InputNumber placeholder="Miktar" style={{ width: '100%' }} disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unitCode']}
                        rules={[{ required: true, message: 'Birim zorunludur' }]}
                      >
                        <Input placeholder="Birim" disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unitPrice']}
                        rules={[{ required: true, message: 'Birim fiyat zorunludur' }]}
                      >
                        <InputNumber placeholder="Birim Fiyat" style={{ width: '100%' }} disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item
                        {...restField}
                        name={[name, 'vatRate']}
                        rules={[{ required: true, message: 'KDV oranı zorunludur' }]}
                      >
                        <InputNumber placeholder="KDV %" style={{ width: '100%' }} disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item
                        {...restField}
                        name={[name, 'discountRate']}
                      >
                        <InputNumber placeholder="İndirim %" style={{ width: '100%' }} disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'lineDescription']}
                      >
                        <Input placeholder="Açıklama" disabled={invoice?.isCompleted} />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      {!invoice?.isCompleted && (
                        <Button danger onClick={() => remove(name)} disabled={invoice?.isCompleted}>
                          X
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
                {!invoice?.isCompleted && (
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block>
                      Satır Ekle
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        </Form>
      </Card>
    </div>
  );
};

export default InvoiceEditPage;
