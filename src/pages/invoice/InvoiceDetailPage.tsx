import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Table, Descriptions, Button, Tag, Space, Divider, Spin, message } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceApi from '../../services/invoiceApi';

const { Title, Text } = Typography;

// Fatura tipi enum
enum InvoiceType {
  WHOLESALE_SALES = 'WS',
  WHOLESALE_PURCHASE = 'BP',
  EXPENSE_SALES = 'EXP',
  EXPENSE_PURCHASE = 'EP'
}

// Fatura tipi açıklamaları
const invoiceTypeDescriptions = {
  [InvoiceType.WHOLESALE_SALES]: 'Toptan Satış Faturası',
  [InvoiceType.WHOLESALE_PURCHASE]: 'Toptan Alış Faturası',
  [InvoiceType.EXPENSE_SALES]: 'Masraf Satış Faturası',
  [InvoiceType.EXPENSE_PURCHASE]: 'Masraf Alış Faturası'
};

// Fatura tipi renkleri
const invoiceTypeColors = {
  [InvoiceType.WHOLESALE_SALES]: 'green',
  [InvoiceType.WHOLESALE_PURCHASE]: 'blue',
  [InvoiceType.EXPENSE_SALES]: 'orange',
  [InvoiceType.EXPENSE_PURCHASE]: 'purple'
};

type InvoiceParams = {
  id?: string;
  type?: string;
};

const InvoiceDetailPage: React.FC = () => {
  const { id, type } = useParams<InvoiceParams>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any[]>([]);

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setLoading(true);
        let response;

        // Fatura tipine göre API çağrısı yap
        if (type === 'wholesale') {
          response = await invoiceApi.getWholesaleInvoiceById(id!);
        } else if (type === 'purchase') {
          response = await invoiceApi.getWholesalePurchaseInvoiceById(id!);
        } else if (type === 'expense') {
          response = await invoiceApi.getExpenseInvoiceById(id!);
        } else {
          throw new Error('Geçersiz fatura tipi');
        }

        if (response.success) {
          setInvoice(response.data);
          
          // Fatura detaylarını yükle
          const detailsResponse = await invoiceApi.getInvoiceDetails(id!);
          if (detailsResponse.success) {
            setInvoiceDetails(detailsResponse.data || []);
          }
          
          // Fatura ödeme detaylarını yükle
          const paymentResponse = await invoiceApi.getInvoicePaymentDetails(response.data.invoiceHeaderID);
          if (paymentResponse.success) {
            setPaymentDetails(paymentResponse.data || []);
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

    if (id) {
      loadInvoiceData();
    }
  }, [id, type]);

  // Listeye geri dön
  const goBackToList = () => {
    navigate('/invoices');
  };
  
  // Faturayı düzenleme sayfasına git
  const goToEdit = () => {
    navigate(`/invoice/edit/${id}?type=${type}`);
  };

  // Fatura detay tablosu sütunları
  const detailColumns = [
    {
      title: 'Sıra No',
      key: 'lineNumber',
      render: (_: any, __: any, index: number) => index + 1,
      width: 80
    },
    {
      title: 'Ürün Kodu',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: 'Ürün Adı',
      dataIndex: 'productDescription',
      key: 'productDescription',
    },
    {
      title: 'Miktar',
      dataIndex: 'qty',
      key: 'qty',
      render: (text: number) => text?.toFixed(2),
      align: 'right' as 'right',
    },
    {
      title: 'Birim',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Birim Fiyat',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (text: number, record: any) => (
        <span>{text?.toFixed(2)}</span>
      ),
      align: 'right' as 'right',
    },
    {
      title: 'KDV (%)',
      dataIndex: 'vatRate',
      key: 'vatRate',
      render: (text: number) => `%${text}`,
      align: 'right' as 'right',
    },
    {
      title: 'Net Tutar',
      dataIndex: 'netAmount',
      key: 'netAmount',
      render: (text: number) => text?.toFixed(2),
      align: 'right' as 'right',
    },
    {
      title: 'KDV Tutarı',
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      render: (text: number) => text?.toFixed(2),
      align: 'right' as 'right',
    },
    {
      title: 'Toplam',
      dataIndex: 'grossAmount',
      key: 'grossAmount',
      render: (text: number) => text?.toFixed(2),
      align: 'right' as 'right',
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Fatura bulunamadı</Title>
          <Button type="primary" onClick={goBackToList}>Fatura Listesine Dön</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Button icon={<ArrowLeftOutlined />} onClick={goBackToList}>
              Listeye Dön
            </Button>
          </Col>
          <Col>
            <Space>
              <Button icon={<EditOutlined />} onClick={goToEdit}>
                Düzenle
              </Button>
              <Button icon={<PrinterOutlined />} onClick={() => message.info('Yazdırma özelliği yakında eklenecek.')}>
                Yazdır
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Title level={4}>
              <Tag color={invoiceTypeColors[invoice.invoiceTypeCode as InvoiceType] || 'default'}>
                {invoiceTypeDescriptions[invoice.invoiceTypeCode as InvoiceType] || invoice.invoiceTypeCode}
              </Tag>
              {invoice.invoiceNumber}
            </Title>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Descriptions title="Fatura Bilgileri" bordered column={1} size="small">
              <Descriptions.Item label="Fatura No">{invoice.invoiceNumber}</Descriptions.Item>
              <Descriptions.Item label="Fatura Tarihi">
                {dayjs(invoice.invoiceDate).format('DD.MM.YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Fatura Tipi">
                {invoiceTypeDescriptions[invoice.invoiceTypeCode as InvoiceType] || invoice.invoiceTypeCode}
              </Descriptions.Item>
              <Descriptions.Item label="Para Birimi">{invoice.docCurrencyCode}</Descriptions.Item>
              <Descriptions.Item label="Şirket Kodu">{invoice.companyCode}</Descriptions.Item>
              <Descriptions.Item label="Depo Kodu">{invoice.warehouseCode}</Descriptions.Item>
              <Descriptions.Item label="Ofis Kodu">{invoice.officeCode}</Descriptions.Item>
              {invoice.expenseTypeCode && (
                <Descriptions.Item label="Masraf Tipi Kodu">{invoice.expenseTypeCode}</Descriptions.Item>
              )}
              <Descriptions.Item label="İade Faturası">{invoice.isReturn ? 'Evet' : 'Hayır'}</Descriptions.Item>
              <Descriptions.Item label="E-Fatura">{invoice.isEInvoice ? 'Evet' : 'Hayır'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions title="Müşteri/Tedarikçi Bilgileri" bordered column={1} size="small">
              <Descriptions.Item label="Müşteri/Tedarikçi Kodu">
                {invoice.customerCode || invoice.vendorCode}
              </Descriptions.Item>
              <Descriptions.Item label="Müşteri/Tedarikçi Adı">
                {invoice.currAccDescription}
              </Descriptions.Item>
              <Descriptions.Item label="Vergi Dairesi">{invoice.taxOffice}</Descriptions.Item>
              <Descriptions.Item label="Vergi Numarası">{invoice.taxNumber}</Descriptions.Item>
              <Descriptions.Item label="Adres">{invoice.address}</Descriptions.Item>
              <Descriptions.Item label="Telefon">{invoice.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="E-posta">{invoice.email}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider>Fatura Detayları</Divider>

        <Table
          columns={detailColumns}
          dataSource={invoiceDetails}
          rowKey="invoiceDetailId"
          pagination={false}
          scroll={{ x: 1200 }}
          summary={(pageData) => {
            let totalNetAmount = 0;
            let totalVatAmount = 0;
            let totalGrossAmount = 0;

            pageData.forEach(({ netAmount, vatAmount, grossAmount }) => {
              totalNetAmount += netAmount || 0;
              totalVatAmount += vatAmount || 0;
              totalGrossAmount += grossAmount || 0;
            });

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={7}>
                    <Text strong>Toplam</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{totalNetAmount.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{totalVatAmount.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>{totalGrossAmount.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />

        {paymentDetails.length > 0 && (
          <>
            <Divider>Fatura Ödeme Detayları</Divider>
            <Table
              columns={[
                {
                  title: 'Para Birimi',
                  dataIndex: 'currencyCode',
                  key: 'currencyCode',
                },
                {
                  title: 'Döviz Kuru',
                  dataIndex: 'exchangeRate',
                  key: 'exchangeRate',
                  render: (text: number) => text?.toFixed(4),
                  align: 'right' as 'right',
                },
                {
                  title: 'İlişkili Para Birimi',
                  dataIndex: 'relationCurrencyCode',
                  key: 'relationCurrencyCode',
                },
                {
                  title: 'Borç',
                  dataIndex: 'debit',
                  key: 'debit',
                  render: (text: number) => text?.toFixed(2),
                  align: 'right' as 'right',
                },
                {
                  title: 'Alacak',
                  dataIndex: 'credit',
                  key: 'credit',
                  render: (text: number) => text?.toFixed(2),
                  align: 'right' as 'right',
                },
              ]}
              dataSource={paymentDetails}
              rowKey="debitLineID"
              pagination={false}
              summary={(pageData) => {
                let totalDebit = 0;
                let totalCredit = 0;

                pageData.forEach(({ debit, credit }) => {
                  totalDebit += debit || 0;
                  totalCredit += credit || 0;
                });

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Toplam</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{totalDebit.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>{totalCredit.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </>
        )}

        {invoice.notes && (
          <>
            <Divider>Notlar</Divider>
            <Card type="inner" size="small">
              <p>{invoice.notes}</p>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default InvoiceDetailPage;
