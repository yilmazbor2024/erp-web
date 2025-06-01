import React from 'react';
import { Form, Input, DatePicker, Select, Row, Col, Switch, Tooltip, Space, Radio } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RadioChangeEvent } from 'antd';

const { Option } = Select;

interface InvoiceHeaderProps {
  form: any;
  customers: any[];
  vendors: any[];
  offices: any[];
  warehouses: any[];
  currencies: any[];
  loadingCurrencies: boolean;
  currAccType: number;
  isReturn: boolean;
  setIsReturn: (value: boolean) => void;
  isEInvoice: boolean;
  setIsEInvoice: (value: boolean) => void;
  onCurrencyChange?: (currencyCode: string) => void;
  onExchangeRateChange?: (rate: number) => void;
  onExchangeRateSourceChange?: (e: RadioChangeEvent) => void;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  form,
  customers,
  vendors,
  offices,
  warehouses,
  currencies,
  loadingCurrencies,
  currAccType,
  isReturn,
  setIsReturn,
  isEInvoice,
  setIsEInvoice,
  onCurrencyChange,
  onExchangeRateChange,
  onExchangeRateSourceChange
}) => {
  const [exchangeRate, setExchangeRate] = React.useState<number>(1);
  const [exchangeRateSource, setExchangeRateSource] = React.useState<string>('TCMB');
  
  // Para birimi değiştiğinde döviz kurunu güncelleme
  const handleCurrencyChange = (value: string) => {
    if (onCurrencyChange && typeof value === 'string') {
      onCurrencyChange(value);
      
      // Para birimi boş veya null ise kur 0 olarak ayarlanır
      if (!value) {
        setExchangeRate(0);
        form.setFieldsValue({ exchangeRate: 0 });
        if (onExchangeRateChange) onExchangeRateChange(0);
        return;
      }
      
      // TRY seçilirse kur 1 olarak ayarlanır
      if (value === 'TRY') {
        setExchangeRate(1);
        form.setFieldsValue({ exchangeRate: 1 });
        if (onExchangeRateChange) onExchangeRateChange(1);
        return;
      }
      
      // Seçilen para birimi ve tarihe göre kur bilgisini API'den al
      const invoiceDate = form.getFieldValue('invoiceDate');
      if (invoiceDate) {
        const formattedDate = dayjs(invoiceDate).format('YYYY-MM-DD');
        fetchExchangeRate(value, formattedDate);
      } else {
        // Tarih yoksa kur 0 olarak ayarlanır
        setExchangeRate(0);
        form.setFieldsValue({ exchangeRate: 0 });
        if (onExchangeRateChange) onExchangeRateChange(0);
      }
    }
  };
  
  // Döviz kuru değiştiğinde
  const handleExchangeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    if (!isNaN(rate)) {
      setExchangeRate(rate);
      if (onExchangeRateChange) onExchangeRateChange(rate);
    }
  };
  
  // Döviz kuru kaynağı değiştiğinde
  const handleExchangeRateSourceChange = (e: RadioChangeEvent) => {
    if (!e || !e.target) return;
    
    const source = e.target.value;
    setExchangeRateSource(source);
    if (onExchangeRateSourceChange) onExchangeRateSourceChange(e);
  };
  
  // API'den döviz kuru bilgisini getirme
  const fetchExchangeRate = async (currencyCode: string, date: string) => {
    try {
      // API çağrısı yapılacak - kaynak parametresi eklendi
      const response = await fetch(`/api/exchange-rates/conversion?fromCurrency=${currencyCode}&toCurrency=TRY&date=${date}&source=${exchangeRateSource}`);
      const data = await response.json();
      
      if (data && data.rate !== undefined && data.rate !== null) {
        setExchangeRate(data.rate);
        form.setFieldsValue({ exchangeRate: data.rate });
        if (onExchangeRateChange) onExchangeRateChange(data.rate);
      } else {
        // API'den gelen kur değeri boş veya null ise 0 olarak ayarla
        setExchangeRate(0);
        form.setFieldsValue({ exchangeRate: 0 });
        if (onExchangeRateChange) onExchangeRateChange(0);
      }
    } catch (error) {
      console.error('Döviz kuru bilgisi alınamadı:', error);
      // Hata durumunda 0 olarak ayarla
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
    }
  };
  
  // Tarih değiştiğinde döviz kurunu güncelleme
  React.useEffect(() => {
    const currencyCode = form.getFieldValue('docCurrencyCode');
    const invoiceDate = form.getFieldValue('invoiceDate');
    
    // Tarih değiştiğinde para birimine bakılır
    // Para birimi boşsa kur 0 olarak ayarlanır
    if (!currencyCode) {
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
      return;
    }
    
    // TRY seçiliyse kur 1 olarak ayarlanır
    if (currencyCode === 'TRY') {
      setExchangeRate(1);
      form.setFieldsValue({ exchangeRate: 1 });
      if (onExchangeRateChange) onExchangeRateChange(1);
      return;
    }
    
    // Tarih yoksa kur 0 olarak ayarlanır
    if (!invoiceDate) {
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
      return;
    }
    
    // Tarih ve para birimi varsa, kur bilgisini al
    const formattedDate = dayjs(invoiceDate).format('YYYY-MM-DD');
    fetchExchangeRate(currencyCode, formattedDate);
  }, [form.getFieldValue('invoiceDate')]);
  
  // Para birimi değiştiğinde döviz kurunu güncelleme
  React.useEffect(() => {
    const currencyCode = form.getFieldValue('docCurrencyCode');
    const invoiceDate = form.getFieldValue('invoiceDate');
    
    // Para birimi boşsa kur 0 olarak ayarlanır
    if (!currencyCode) {
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
      return;
    }
    
    // TRY seçiliyse kur 1 olarak ayarlanır
    if (currencyCode === 'TRY') {
      setExchangeRate(1);
      form.setFieldsValue({ exchangeRate: 1 });
      if (onExchangeRateChange) onExchangeRateChange(1);
      return;
    }
    
    // Tarih yoksa kur 0 olarak ayarlanır
    if (!invoiceDate) {
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
      return;
    }
    
    // Tarih ve para birimi varsa, kur kaynağı ve tarih bakılarak API'den çekilir
    const formattedDate = dayjs(invoiceDate).format('YYYY-MM-DD');
    fetchExchangeRate(currencyCode, formattedDate);
  }, [form.getFieldValue('docCurrencyCode')]);
  
  // Kur kaynağı değiştiğinde döviz kurunu güncelleme
  React.useEffect(() => {
    const currencyCode = form.getFieldValue('docCurrencyCode');
    const invoiceDate = form.getFieldValue('invoiceDate');
    
    // Para birimi boşsa kur 0 olarak ayarlanır
    if (!currencyCode) {
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
      return;
    }
    
    // TRY seçiliyse kur 1 olarak ayarlanır
    if (currencyCode === 'TRY') {
      setExchangeRate(1);
      form.setFieldsValue({ exchangeRate: 1 });
      if (onExchangeRateChange) onExchangeRateChange(1);
      return;
    }
    
    // Tarih yoksa kur 0 olarak ayarlanır
    if (!invoiceDate) {
      setExchangeRate(0);
      form.setFieldsValue({ exchangeRate: 0 });
      if (onExchangeRateChange) onExchangeRateChange(0);
      return;
    }
    
    // Kur kaynağı değiştiğinde tarih ve para birimi varsa, kur bilgisini al
    const formattedDate = dayjs(invoiceDate).format('YYYY-MM-DD');
    fetchExchangeRate(currencyCode, formattedDate);
  }, [exchangeRateSource]);
  return (
    <div className="invoice-header">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="invoiceNumber"
            label="Fatura Numarası"
            tooltip="Fatura numarası backend tarafında otomatik oluşturulacak"
          >
            <Input placeholder="Otomatik oluşturulacak" disabled style={{ backgroundColor: '#f5f5f5' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="invoiceDate"
            label="Fatura Tarihi"
            rules={[{ required: true, message: 'Lütfen fatura tarihini seçiniz' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div style={{ border: '1px solid #f0f0f0', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={24} md={24}>
                <Form.Item
                  name="docCurrencyCode"
                  label="Para Birimi"
                  rules={[{ required: true, message: 'Para birimi seçiniz!' }]}
                  style={{ marginBottom: '8px' }}
                >
                  <Select
                    showSearch
                    placeholder="Para birimi seçiniz"
                    optionFilterProp="children"
                    loading={loadingCurrencies}
                    // defaultValue kaldırıldı - Form initialValues kullanılacak
                    onChange={handleCurrencyChange}
                    style={{ width: '100%' }}
                    filterOption={(input, option: any) => {
                      if (!input || !option || !option.children) return true;
                      
                      // Arama metni
                      const searchText = input.toLowerCase();
                      
                      // Option'ın text içeriğini al
                      let childText = '';
                      if (typeof option.children === 'string') {
                        childText = option.children.toLowerCase();
                      } else if (React.isValidElement(option.children)) {
                        const childrenText = (option.children as any).props.children;
                        childText = (childrenText?.toString() || '').toLowerCase();
                      }
                      
                      // Para birimi kodu
                      let code = '';
                      if (option.value && typeof option.value === 'string') {
                        code = option.value.toLowerCase();
                      }
                      
                      // Özel durumlar için kısayollar
                      if (code === 'try' && (searchText === 'try' || searchText === 'tl' || searchText.includes('lira'))) {
                        return true;
                      }
                      if (code === 'eur' && (searchText === 'eur' || searchText === 'euro' || searchText.includes('avro'))) {
                        return true;
                      }
                      if (code === 'usd' && (searchText === 'usd' || searchText === 'abd' || searchText.includes('dolar'))) {
                        return true;
                      }
                      
                      // Hem kod hem de açıklamada arama yap
                      return childText.toLowerCase().includes(searchText) || code.includes(searchText);
                    }}
                  >
                    {currencies.map((currency, index) => {
                      // TRY için varsayılan ve koyu stil
                      const isTRY = currency.code === 'TRY';
                      const style = isTRY ? { fontWeight: 'bold' } : {};
                      
                      return (
                        <Option 
                          key={currency.code || currency.id || `currency-${index}`} 
                          value={currency.code || ''}
                          style={style}
                        >
                          {currency.code} - {currency.name}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={12} md={12}>
                <Form.Item
                  name="exchangeRateSource"
                  label="Kur Kaynağı"
                  // initialValue kaldırıldı - Form initialValues kullanılacak
                  style={{ marginBottom: '8px' }}
                >
                  <Radio.Group 
                    onChange={handleExchangeRateSourceChange} 
                    // defaultValue kaldırıldı - Form initialValues kullanılacak
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                    style={{ textAlign: 'left' }}
                  >
                    <Radio.Button value="TCMB">TCMB</Radio.Button>
                    <Radio.Button value="SPYS">SPYS</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={12} md={12}>
                <Form.Item
                  name="exchangeRate"
                  label="TL Karşılığı"
                  tooltip="Seçilen para biriminin TL karşılığı. Otomatik hesaplanır, gerekirse düzenlenebilir."
                  style={{ marginBottom: '8px' }}
                >
                  <Input 
                    type="number" 
                    step="0.0001"
                    min="0.0001"
                    onChange={handleExchangeRateChange}
                    addonAfter="TL"
                    style={{ width: '100%', textAlign: 'left' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="currAccCode"
            label={currAccType === 1 ? "Tedarikçi" : "Müşteri"}
            rules={[{ required: true, message: `Lütfen ${currAccType === 1 ? "tedarikçi" : "müşteri"} seçiniz` }]}
          >
            <Select
              showSearch
              placeholder={`${currAccType === 1 ? "Tedarikçi" : "Müşteri"} seçiniz`}
              optionFilterProp="children"
              filterOption={(input, option) => {
                if (!input || input.length < 3 || !option || !option.children) return true; // 3 karakterden az ise tümünü göster
                
                // Option içeriğini string'e çevir
                let childText = '';
                if (typeof option.children === 'string') {
                  childText = option.children;
                } else if (React.isValidElement(option.children)) {
                  try {
                    childText = JSON.stringify(option.children);
                  } catch (e) {
                    childText = '';
                  }
                } else {
                  try {
                    childText = option.children.toString();
                  } catch (e) {
                    childText = '';
                  }
                }
                
                // Arama metni için hem kod hem de açıklama kontrol edilir
                const searchText = String(option.label || childText);
                return searchText.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {(currAccType === 1 ? vendors : customers).map((item, index) => {
                const code = item.customerCode || item.currAccCode || item.code || '';
                const name = item.customerName || item.currAccDescription || item.name || item.description || `Müşteri ${code}`;
                const displayText = `${code} - ${name}`;
                
                return (
                  <Option 
                    key={code || `item-${index}`} 
                    value={code || ''}
                    label={displayText}
                  >
                    {displayText}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="officeCode"
            label="Ofis"
            rules={[{ required: true, message: 'Lütfen ofis seçiniz' }]}
          >
            <Select
              showSearch
              placeholder="Ofis seçiniz"
              optionFilterProp="children"
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
              {offices.map((office, index) => (
                <Option key={office.officeCode || `office-${index}`} value={office.officeCode || ''}>{office.officeCode} - {office.officeName || office.officeDescription}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="warehouseCode"
            label="Depo"
            rules={[{ required: true, message: 'Lütfen depo seçiniz' }]}
          >
            <Select
              showSearch
              placeholder="Depo seçiniz"
              optionFilterProp="children"
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
              {warehouses.map((warehouse, index) => (
                <Option key={warehouse.warehouseCode || `warehouse-${index}`} value={warehouse.warehouseCode || ''}>{warehouse.warehouseCode} - {warehouse.warehouseName || warehouse.warehouseDescription}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Form.Item
          name="companyCode"
          hidden
          initialValue="1"
        >
          <Input />
        </Form.Item>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="isReturn"
            label="İade Faturası"
            valuePropName="checked"
          >
            <Switch
              checked={isReturn}
              onChange={setIsReturn}
              checkedChildren="Evet"
              unCheckedChildren="Hayır"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="isEInvoice"
            label={
              <span>
                E-Fatura
                <Tooltip title="E-Fatura olarak işaretlenirse GİB'e gönderilecektir">
                  <InfoCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </span>
            }
            valuePropName="checked"
          >
            <Switch
              checked={isEInvoice}
              onChange={setIsEInvoice}
              checkedChildren="Evet"
              unCheckedChildren="Hayır"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="notes"
            label="Notlar"
          >
            <Input.TextArea rows={3} placeholder="Fatura ile ilgili notlar..." />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default InvoiceHeader;
