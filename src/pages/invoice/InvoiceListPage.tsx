import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Space, Tag, Tooltip, Input, DatePicker, Select, Row, Col, Typography, Modal, message, Grid } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import invoiceApi from '../../services/invoiceApi';
import InvoiceForm from '../../components/invoice/InvoiceForm';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

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

// URL'deki type parametresini doğru fatura tipi koduna dönüştür
const mapTypeToInvoiceTypeCode = (type: string | null): string => {
  if (!type) return '';
  
  switch(type) {
    case 'wholesale':
      return 'WS'; // Toptan Satış
    case 'wholesale-purchase':
      return 'BP'; // Toptan Alış
    case 'expense-purchase':
      return 'EP'; // Masraf Alış Faturası
    case 'expense-sales':
      return 'EXP'; // Masraf Satış Faturası
    default:
      return '';
  }
};

const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');
  const mappedTypeCode = mapTypeToInvoiceTypeCode(typeParam);
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint'ten küçük ekranlar mobil olarak kabul edilir
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    invoiceNumber: '',
    invoiceTypeCode: mappedTypeCode,
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    currAccCode: ''
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>(InvoiceType.WHOLESALE_SALES);

  // Faturaları yükle
  const loadInvoices = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      // API isteği parametrelerini hazırla
      const requestParams: any = {
        pageNumber: page,
        pageSize,
        invoiceNumber: filters.invoiceNumber,
        startDate: filters.dateRange ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: filters.dateRange ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
        currAccCode: filters.currAccCode
        // Tüm fatura listelerinde sadece sayfalama ve ProcessCode gönderilmeli
        // CompanyCode,  WarehouseCode backend tarafında varsayılan değerlerle doldurulacak
      };
      
      // Fatura tipi için ProcessCode ayarla
      requestParams.processCode = mapTypeToInvoiceTypeCode(typeParam);
      
      console.log('API request params:', requestParams);
      
      const response = await invoiceApi.getAllInvoices(requestParams);

      if (response.success) {
        console.log('API response data:', response.data.items);
        setInvoices(response.data.items || []);
        setPagination({
          current: page,
          pageSize,
          total: response.data.totalCount || 0
        });
      } else {
        message.error(`Faturalar yüklenirken bir hata oluştu: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Fatura yükleme hatası:', error);
      message.error(`Faturalar yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [typeParam]);
  
  // URL'deki tip değiştiğinde filtreleri güncelle
  useEffect(() => {
    if (typeParam) {
      setFilters(prev => ({
        ...prev,
        invoiceTypeCode: mappedTypeCode
      }));
    }
  }, [typeParam, mappedTypeCode]);

  // Filtreleri uygula
  const applyFilters = () => {
    loadInvoices(1, pagination.pageSize);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      invoiceNumber: '',
      invoiceTypeCode: '',
      dateRange: null,
      currAccCode: ''
    });
    loadInvoices(1, pagination.pageSize);
  };

  // Sayfa değişikliği
  const handleTableChange = (pagination: any) => {
    loadInvoices(pagination.current, pagination.pageSize);
  };

  // Fatura detayını görüntüle
  const viewInvoiceDetails = (invoiceId: string, invoiceType: string) => {
    let type = 'wholesale';
    
    if (invoiceType === InvoiceType.WHOLESALE_PURCHASE) {
      type = 'purchase';
    } else if (invoiceType === InvoiceType.EXPENSE_SALES || invoiceType === InvoiceType.EXPENSE_PURCHASE) {
      type = 'expense';
    }
    
    navigate(`/invoice/${invoiceId}?type=${type}`);
  };
  
  // Fatura düzenleme sayfasına yönlendir
  const editInvoice = (invoiceId: string, invoiceType: string) => {
    let type = 'wholesale';
    
    if (invoiceType === InvoiceType.WHOLESALE_PURCHASE) {
      type = 'purchase';
    } else if (invoiceType === InvoiceType.EXPENSE_SALES || invoiceType === InvoiceType.EXPENSE_PURCHASE) {
      type = 'expense';
    }
    
    navigate(`/invoice/edit/${invoiceId}?type=${type}`);
  };

  // Yeni fatura oluştur
  const handleCreateInvoice = (type?: string) => {
    if (type) {
      navigate(`/invoice/create?type=${type}`);
    } else {
      navigate('/invoice/create');
    }
  };

  // Fatura oluşturma başarılı
  const handleCreateSuccess = (data: any) => {
    setCreateModalVisible(false);
    loadInvoices();
    message.success('Fatura başarıyla oluşturuldu.');
  };

  // Tablo sütunları - Mobil ve masaüstü için farklı sütunlar
  const getColumns = useCallback((): any[] => {
    // Mobil için özel tablo düzeni - her satırda bilgiler alt alta
    if (isMobile) {
      return [
        {
          title: <div style={{ textAlign: 'center' }}>Fatura Listesi</div>,
          key: 'invoiceInfo',
          render: (_: React.ReactNode, record: any) => (
            <div style={{ padding: '8px 0' }}>
              {/* Fatura No ve Tarih aynı satırda */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>{record.invoiceNumber}</span>
                <span>{dayjs(record.invoiceDate).format('DD.MM.YYYY')}</span>
              </div>
              
              {/* Müşteri açıklaması 2. satırda */}
              <div style={{ marginBottom: '8px', borderBottom: '1px dashed #e8e8e8', paddingBottom: '4px' }}>
                <span style={{ fontWeight: '500' }}>
                  {record.currAccTypeCode === 3 
                    ? record.customerDescription || '-'
                    : record.vendorDescription || '-'}
                </span>
              </div>
              

              
              {/* Fatura toplamları alt satırda */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingTop: '4px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>KDV Hariç</div>
                  <div>{record.totalNetAmount !== undefined && record.totalNetAmount !== null ? `${Number(record.totalNetAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0,00 TL'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>KDV</div>
                  <div>{record.totalVatAmount !== undefined && record.totalVatAmount !== null ? `${Number(record.totalVatAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0,00 TL'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Toplam</div>
                  <div style={{ fontWeight: 'bold' }}>{record.totalGrossAmount !== undefined && record.totalGrossAmount !== null ? `${Number(record.totalGrossAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0,00 TL'}</div>
                </div>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/invoice/${record.invoiceHeaderID || record.invoiceHeaderId}`)}
                >
                  Görüntüle
                </Button>
              </div>
              
              {/* Fatura kartları arasında ayırıcı çizgi */}
              <div style={{ borderTop: '3px solid #1890ff', marginTop: '4px', marginBottom: '-3px' }}></div>
            </div>
          )
        }
      ];
    }
    
    // Masaüstü için tüm sütunları göster
    return [
      {
        title: 'Fatura No / Tarih',
        key: 'invoiceNumber',
        render: (_: any, record: any) => (
          <div>
            <div><span style={{ fontWeight: 'bold' }}>{record.invoiceNumber}</span></div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{dayjs(record.invoiceDate).format('DD.MM.YYYY')}</div>
          </div>
        )
      },

    {
      title: 'KDV Hariç',
      dataIndex: 'totalNetAmount',
      key: 'totalNetAmount',
      render: (text: number | undefined) => text ? `${text.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0,00 TL'
    },
    {
      title: 'KDV',
      dataIndex: 'totalVatAmount',
      key: 'totalVatAmount',
      render: (text: number | undefined) => text ? `${text.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0,00 TL'
    },
    {
      title: 'Toplam',
      dataIndex: 'totalGrossAmount',
      key: 'totalGrossAmount',
      render: (text: number | undefined) => <span style={{ fontWeight: 'bold' }}>{text !== undefined && text !== null ? `${Number(text).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0,00 TL'}</span>
    },
    {
      title: 'Müşteri/Tedarikçi',
      key: 'currAccCode',
      render: (_: any, record: any) => {
        // CurrAccTypeCode'a göre müşteri veya tedarikçi bilgisini göster
        if (record.currAccTypeCode === 3) { // Müşteri
          return (
            <Tooltip title={record.customerCode}>
              {record.customerDescription || '-'}
            </Tooltip>
          );
        } else if (record.currAccTypeCode === 1) { // Tedarikçi
          return (
            <Tooltip title={record.vendorCode}>
              {record.vendorDescription || '-'}
            </Tooltip>
          );
        } else {
          return record.currAccCode || '-';
        }
      }
    },
    {
      title: 'Iade',
      dataIndex: 'isReturn',
      key: 'isReturn',
      render: (isReturn: boolean, record: any) => (
        isReturn ? 
          <Tag key={`return-yes-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="orange">Evet</Tag> : 
          <Tag key={`return-no-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="default">Hayır</Tag>
      )
    },
    {
      title: 'e-Fatura',
      dataIndex: 'isEInvoice',
      key: 'isEInvoice',
      render: (isEInvoice: boolean, record: any) => (
        isEInvoice ? 
          <Tag key={`einvoice-yes-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="purple">Evet</Tag> : 
          <Tag key={`einvoice-no-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="default">Hayır</Tag>
      )
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (text: string, record: any) => {
        // Her bir Tag için benzersiz key prop'u ekliyoruz
        const statusTags = [];
        
        if (record.isCompleted) {
          statusTags.push(<Tag key={`completed-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="green">Tamamlandı</Tag>);
        }
        
        if (record.isSuspended) {
          statusTags.push(<Tag key={`suspended-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="red">Askıda</Tag>);
        }
        
        if (!record.isCompleted && !record.isSuspended) {
          statusTags.push(<Tag key={`waiting-${record.invoiceHeaderID || record.invoiceHeaderId}`} color="blue">Bekliyor</Tag>);
        }
        
        return <Space>{statusTags}</Space>;
      }
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Görüntüle">
            <Button
              key={`view-${record.invoiceHeaderID || record.invoiceHeaderId}`}
              type="text"
              icon={<EyeOutlined />}
              onClick={() => viewInvoiceDetails(record.invoiceHeaderID || record.invoiceHeaderId, record.invoiceTypeCode)}
            />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button
              key={`edit-${record.invoiceHeaderID || record.invoiceHeaderId}`}
              type="text"
              icon={<EditOutlined />}
              onClick={() => editInvoice(record.invoiceHeaderID || record.invoiceHeaderId, record.invoiceTypeCode)}
            />
          </Tooltip>
          <Tooltip title="Yazdır">
            <Button
              key={`print-${record.invoiceHeaderID || record.invoiceHeaderId}`}
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => message.info('Yazdırma özelliği yakında eklenecek.')}
            />
          </Tooltip>
        </Space>
      )
    }
  ];
  }, [isMobile, navigate]);
  
  return (
    <div>
      <Card>
        {isMobile ? (
          // Mobil görünümde başlık üstte, buton altta
          <div style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={4}>Faturalar</Title>
            </div>
            <div>
              {typeParam === 'wholesale' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateInvoice('wholesale')}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Satış Faturası Ekle
                </Button>
              )}
              {typeParam === 'wholesale-purchase' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateInvoice('wholesale-purchase')}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Alış Faturası Ekle
                </Button>
              )}
              {typeParam === 'expense-purchase' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateInvoice('expense-purchase')}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Masraf Alış Faturası Ekle
                </Button>
              )}
              {typeParam === 'expense-sales' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateInvoice('expense-sales')}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Masraf Satış Faturası Ekle
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Masaüstü görünümde yan yana
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4}>Faturalar</Title>
            </Col>
            <Col>
              <Space>
                {typeParam === 'wholesale' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreateInvoice('wholesale')}
                  >
                    Satış Faturası Ekle
                  </Button>
                )}
                {typeParam === 'wholesale-purchase' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreateInvoice('wholesale-purchase')}
                  >
                    Alış Faturası Ekle
                  </Button>
                )}
                {typeParam === 'expense-purchase' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreateInvoice('expense-purchase')}
                  >
                    Masraf Alış Faturası Ekle
                  </Button>
                )}
                {typeParam === 'expense-sales' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreateInvoice('expense-sales')}
                  >
                    Masraf Satış Faturası Ekle
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        )}

        {/* Mobil ve masaüstü için farklı filtre düzenleri */}
        {isMobile ? (
          // Mobil için alt alta düzen
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Input
                placeholder="Fatura No"
                value={filters.invoiceNumber}
                onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
                allowClear
                style={{ width: '100%', marginBottom: 12 }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <RangePicker
                style={{ width: '100%', marginBottom: 12 }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] })}
                format="DD.MM.YYYY"
                allowClear
              />
            </div>
            
            <div>
              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={applyFilters}
                >
                  Ara
                </Button>
                <Button 
                  onClick={clearFilters}
                >
                  Temizle
                </Button>
              </Space>
            </div>
          </div>
        ) : (
          // Masaüstü için yan yana düzen
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Input
                placeholder="Fatura No"
                value={filters.invoiceNumber}
                onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
                allowClear
                style={{ marginBottom: 12 }}
              />
            </Col>
            <Col span={12}>
              <RangePicker
                style={{ width: '100%', marginBottom: 12 }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] })}
                format="DD.MM.YYYY"
                allowClear
              />
            </Col>
            <Col span={24} style={{ textAlign: 'center' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={applyFilters}
                >
                  Ara
                </Button>
                <Button onClick={clearFilters}>Temizle</Button>
              </Space>
            </Col>
          </Row>
        )}

        {/* Arama kısmı ile fatura listesi arasına ayıraç */}
        <div style={{ margin: '20px 0', padding: '10px 0', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}></div>

        <Table
          columns={getColumns()}
          dataSource={invoices}
          rowKey={(record) => record.invoiceHeaderID || record.invoiceHeaderId || Math.random().toString()}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: isMobile ? undefined : 1200 }}
          size={isMobile ? "small" : "middle"}
        />
      </Card>

      {/* Modal kaldırıldı, yerine sayfa yönlendirmesi kullanılıyor */}
    </div>
  );
};

export default InvoiceListPage;
