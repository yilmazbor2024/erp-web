import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  Select, 
  InputNumber, 
  Table, 
  Space, 
  Card, 
  Divider, 
  Row, 
  Col, 
  Typography, 
  message, 
  Spin 
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CashPaymentModal, { CashPaymentModalAPI } from '../../components/payment/CashPaymentModal';
import dayjs from 'dayjs';
import invoiceApi, { CreateWholesaleInvoiceRequest, CreateInvoiceDetailRequest } from '../../services/invoiceApi';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

interface InvoiceDetailItem {
  key: string;
  lineNumber: number;
  itemCode: string;
  itemDescription?: string;
  quantity: number;
  unitOfMeasureCode: string;
  unitPrice: number;
  discountRate: number;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

const CreateWholesaleInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [detailsForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<InvoiceDetailItem[]>([]);
  const [nextLineNumber, setNextLineNumber] = useState(1);

  // Nakit tahsilat modalı için state'ler
  const [showCashPaymentModal, setShowCashPaymentModal] = useState<boolean>(false);
  const [savedInvoiceData, setSavedInvoiceData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      message.error('Bu sayfayı görüntülemek için giriş yapmalısınız');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Toplam tutarları hesapla
  const calculateTotals = () => {
    const netTotal = details.reduce((sum, item) => sum + item.netAmount, 0);
    const vatTotal = details.reduce((sum, item) => sum + item.vatAmount, 0);
    const grandTotal = details.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return { netTotal, vatTotal, grandTotal };
  };

  // Detay satırı ekle
  const handleAddDetail = () => {
    const values = detailsForm.getFieldsValue();
    
    // Tutarları hesapla
    const quantity = values.quantity || 0;
    const unitPrice = values.unitPrice || 0;
    const discountRate = values.discountRate || 0;
    const vatRate = values.vatRate || 0;
    
    const netAmount = quantity * unitPrice * (1 - discountRate / 100);
    const vatAmount = netAmount * (vatRate / 100);
    const totalAmount = netAmount + vatAmount;
    
    const newItem: InvoiceDetailItem = {
      key: Date.now().toString(),
      lineNumber: nextLineNumber,
      itemCode: values.itemCode || '',
      itemDescription: values.itemDescription || '',
      quantity,
      unitOfMeasureCode: values.unitOfMeasureCode || 'AD',
      unitPrice,
      discountRate,
      vatRate,
      netAmount,
      vatAmount,
      totalAmount
    };
    
    setDetails([...details, newItem]);
    setNextLineNumber(nextLineNumber + 1);
    detailsForm.resetFields();
  };

  // Detay satırı sil
  const handleRemoveDetail = (key: string) => {
    setDetails(details.filter(item => item.key !== key));
  };

  // Fatura kaydet
  const handleSave = async () => {
    try {
      await form.validateFields();
      
      if (details.length === 0) {
        message.error('En az bir fatura satırı eklemelisiniz');
        return;
      }
      
      setSaving(true);
      
      const values = form.getFieldsValue();
      
      // API'nin beklediği formatta fatura detaylarını oluştur
      const invoiceDetails: CreateInvoiceDetailRequest[] = details.map(detail => ({
        lineNumber: detail.lineNumber,
        itemCode: detail.itemCode,
        itemTypeCode: "1", // Varsayılan ürün tipi
        unitOfMeasureCode: detail.unitOfMeasureCode,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        discountRate: detail.discountRate,
        vatRate: detail.vatRate,
        warehouseCode: values.warehouseCode || "001",
        locationCode: "001", // Varsayılan lokasyon kodu
        serialNumber: "001", // Varsayılan seri numarası
        batchCode: "001", // Varsayılan parti kodu
        currencyCode: values.docCurrencyCode || "TRY",
        salesPersonCode: "001", // Varsayılan satış temsilcisi kodu
        productTypeCode: "001", // Varsayılan ürün tipi kodu
        promotionCode: "001", // Varsayılan promosyon kodu
        notes: detail.itemDescription || ""
      }));
      
      // API'nin beklediği formatta fatura verilerini oluştur
      const invoiceData: CreateWholesaleInvoiceRequest = {
        invoiceNumber: values.invoiceNumber || "Otomatik oluşturulacak",
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        invoiceTypeCode: "WS", // Toptan Satış fatura tipi kodu
        currAccTypeCode: 3, // Müşteri cari hesap tipi kodu
        customerCode: values.customerCode, // Müşteri kodu
        currAccCode: values.customerCode, // Cari hesap kodu müşteri koduyla aynı
        docCurrencyCode: values.docCurrencyCode || "TRY",
        localCurrencyCode: "TRY", // Yerel para birimi her zaman TRY
        exchangeRate: values.exchangeRate || 1, // Form'dan döviz kuru değeri veya varsayılan 1
        companyCode: values.companyCode || 1,
        warehouseCode: values.warehouseCode || "001",
        officeCode: values.officeCode || "001",
        processCode: "WS", // Toptan Satış işlem kodu
        isReturn: false,
        isEInvoice: false,
        notes: values.notes || "Toptan satış faturası",
        details: invoiceDetails
      };
      
      console.log('Fatura verileri:', invoiceData);
      
      // API'ye istek gönder
      const response = await invoiceApi.createWholesaleInvoice(invoiceData);
      
      if (response && response.success) {
        // Ödeme tipini kontrol et
        const paymentType = form.getFieldValue('paymentType');
        const normalizedPaymentType = typeof paymentType === 'number' ? String(paymentType) : paymentType;
        
        // Peşin ödeme durumuna göre işlem yap
        if (normalizedPaymentType === 'Peşin' || normalizedPaymentType === '1' || normalizedPaymentType === 1) {
          // Sadece tek bir mesaj göster
          message.success('Fatura başarıyla oluşturuldu');
          
          // Nakit ödeme modalını açmak için gerekli verileri hazırla
          const paymentModalData = {
            id: response.data?.invoiceHeaderID || '',
            invoiceNumber: response.data?.invoiceNumber || '',
            amount: response.data?.netAmount || 0,
            currencyCode: form.getFieldValue('docCurrencyCode') || 'TRY',
            currAccCode: form.getFieldValue('customerCode') || '',
            currAccTypeCode: 3, // Müşteri cari hesap tipi kodu
            officeCode: form.getFieldValue('officeCode') || ''
          };
          
          console.log('Nakit ödeme modalı açılıyor...', paymentModalData);
          
          // State'i güncelleyelim (eski yöntem için)
          setSavedInvoiceData(paymentModalData);
          
          // Hem eski yöntem hem de yeni yöntem ile modalı aç
          setTimeout(() => {
            // Eski yöntem
            setShowCashPaymentModal(true);
            
            // CashPaymentModalAPI ile modalı aç
            CashPaymentModalAPI.open({
              ...paymentModalData,
              onSuccess: handleCashPaymentSuccess,
              onClose: handleCashPaymentModalClose
            });
            
            console.log('Modal açma isteği gönderildi:', paymentModalData);
          }, 300);
        } else {
          message.success('Fatura başarıyla oluşturuldu');
          navigate('/invoices/wholesale');
        }
      } else {
        message.error(`Fatura oluşturulurken bir hata oluştu: ${response?.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Fatura oluşturulurken hata:', error);
      message.error(`Fatura oluşturulurken bir hata oluştu: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Sıra',
      dataIndex: 'lineNumber',
      key: 'lineNumber',
      width: 80
    },
    {
      title: 'Ürün Kodu',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120
    },
    {
      title: 'Açıklama',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
      width: 200
    },
    {
      title: 'Miktar',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text: number) => text.toLocaleString('tr-TR')
    },
    {
      title: 'Birim',
      dataIndex: 'unitOfMeasureCode',
      key: 'unitOfMeasureCode',
      width: 80
    },
    {
      title: 'Birim Fiyat',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (text: number) => text.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      title: 'İndirim %',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 100,
      render: (text: number) => `%${text.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: 'KDV %',
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 80,
      render: (text: number) => `%${text.toLocaleString('tr-TR')}`
    },
    {
      title: 'Net Tutar',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      render: (text: number) => text.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      title: 'KDV Tutarı',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 120,
      render: (text: number) => text.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      title: 'Toplam',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (text: number) => text.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 100,
      render: (_: any, record: InvoiceDetailItem) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleRemoveDetail(record.key)} 
        />
      )
    }
  ];

  const { netTotal, vatTotal, grandTotal } = calculateTotals();

  // Nakit tahsilat modalı kapatıldığında
  const handleCashPaymentModalClose = () => {
    // Modalı kapat ve state'i temizle
    setShowCashPaymentModal(false);
    setSavedInvoiceData(null);
    
    // Modal kapatıldıktan sonra listeye yönlendir
    navigate('/invoices/wholesale');
  };

  // Nakit tahsilat başarılı olduğunda
  const handleCashPaymentSuccess = (response: any) => {
    console.log('Nakit tahsilat başarılı:', response);
    
    // Modalı kapat ve state'i temizle
    setShowCashPaymentModal(false);
    setSavedInvoiceData(null);
    
    // Sadece tek bir başarı mesajı göster
    message.success('Nakit tahsilat başarıyla kaydedildi');
    
    // Listeye yönlendir
    navigate('/invoices/wholesale');
  };

  return (
    <div style={{ padding: '20px' }}>
      <Spin spinning={loading || saving}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Title level={3}>Yeni Toptan Satış Faturası</Title>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/invoices/wholesale')}
              >
                Geri
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                loading={saving}
              >
                Kaydet
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              invoiceDate: dayjs(),
              invoiceTime: dayjs(),
              docCurrencyCode: 'TRY',
              companyCode: '001',
              warehouseCode: '001',
              officeCode: '001',
              series: 'TS'
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="invoiceNumber"
                  label="Fatura No"
                  rules={[{ required: true, message: 'Fatura numarası gerekli' }]}
                >
                  <Input placeholder="TS2025001" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="invoiceDate"
                  label="Fatura Tarihi"
                  rules={[{ required: true, message: 'Fatura tarihi gerekli' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="customerCode"
                  label="Müşteri Kodu"
                  rules={[{ required: true, message: 'Müşteri kodu gerekli' }]}
                >
                  <Input placeholder="C001" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="docCurrencyCode"
                  label="Para Birimi"
                  rules={[{ required: true, message: 'Para birimi gerekli' }]}
                >
                  <Select>
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
                  name="paymentType"
                  label="Ödeme Tipi"
                  initialValue="Peşin"
                  rules={[{ required: true, message: 'Ödeme tipi gerekli' }]}
                >
                  <Select>
                    <Option value="Peşin">Peşin</Option>
                    <Option value="Vadeli">Vadeli</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="exchangeRate"
                  label="Döviz Kuru"
                  initialValue={1}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    step={0.01}
                    precision={4}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="series"
                  label="Seri"
                >
                  <Input placeholder="TS" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="seriesNumber"
                  label="Seri No"
                >
                  <Input placeholder="001" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="warehouseCode"
                  label="Depo Kodu"
                >
                  <Input placeholder="001" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="notes"
                  label="Açıklama"
                >
                  <Input.TextArea rows={1} placeholder="Fatura açıklaması" />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider orientation="left">Fatura Detayları</Divider>

          <Form
            form={detailsForm}
            layout="vertical"
            initialValues={{
              quantity: 1,
              unitOfMeasureCode: 'ADET',
              vatRate: 18,
              discountRate: 0
            }}
          >
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item
                  name="itemCode"
                  label="Ürün Kodu"
                  rules={[{ required: true, message: 'Ürün kodu gerekli' }]}
                >
                  <Input placeholder="P001" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="itemDescription"
                  label="Açıklama"
                >
                  <Input placeholder="Ürün açıklaması" />
                </Form.Item>
              </Col>
              <Col span={2}>
                <Form.Item
                  name="quantity"
                  label="Miktar"
                  rules={[{ required: true, message: 'Miktar gerekli' }]}
                >
                  <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={2}>
                <Form.Item
                  name="unitOfMeasureCode"
                  label="Birim"
                  rules={[{ required: true, message: 'Birim gerekli' }]}
                >
                  <Select>
                    <Option value="ADET">ADET</Option>
                    <Option value="KG">KG</Option>
                    <Option value="LT">LT</Option>
                    <Option value="MT">MT</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item
                  name="unitPrice"
                  label="Birim Fiyat"
                  rules={[{ required: true, message: 'Birim fiyat gerekli' }]}
                >
                  <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={2}>
                <Form.Item
                  name="discountRate"
                  label="İndirim %"
                >
                  <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={2}>
                <Form.Item
                  name="vatRate"
                  label="KDV %"
                  rules={[{ required: true, message: 'KDV oranı gerekli' }]}
                >
                  <Select>
                    <Option value={0}>0</Option>
                    <Option value={1}>1</Option>
                    <Option value={8}>8</Option>
                    <Option value={18}>18</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label=" " style={{ marginTop: '29px' }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddDetail}
                    block
                  >
                    Ekle
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Table
            columns={columns}
            dataSource={details}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
            style={{ marginTop: '20px' }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={8} align="right">
                    <strong>Toplam:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{netTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>{vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      </Spin>

      {/* Nakit tahsilat modal artık CashPaymentModalAPI ile açılıyor, burada render etmeye gerek yok */}
    </div>
  );
};

export default CreateWholesaleInvoice;
