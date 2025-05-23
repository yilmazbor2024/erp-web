import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Switch, Button, Card, message, Spin, Space, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import productApi, { CreateProductRequest, UpdateProductRequest } from '../../services/productApi';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;

const ProductForm: React.FC = () => {
  const { productCode } = useParams<{ productCode: string }>();
  const isEditMode = !!productCode;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Ürün detayını çek (düzenleme modu için)
  const { data: product, isLoading: isLoadingProduct } = useQuery(
    ['product', productCode],
    () => productApi.getProductDetail(productCode!),
    {
      enabled: isAuthenticated && isEditMode,
      onSuccess: (data) => {
        // Form alanlarını doldur
        form.setFieldsValue({
          productCode: data.productCode,
          productDescription: data.productDescription,
          productTypeCode: data.productTypeCode,
          itemDimTypeCode: data.itemDimTypeCode,
          unitOfMeasureCode1: data.unitOfMeasureCode1,
          unitOfMeasureCode2: data.unitOfMeasureCode2,
          companyBrandCode: data.companyBrandCode?.replace(/[{}]/g, ''),
          usePOS: data.usePOS,
          useStore: data.useStore,
          useRoll: data.useRoll,
          useBatch: data.useBatch,
          generateSerialNumber: data.generateSerialNumber,
          useSerialNumber: data.useSerialNumber,
          isUTSDeclaratedItem: data.isUTSDeclaratedItem,
          isBlocked: data.isBlocked
        });
      },
      onError: (err: any) => {
        message.error(`Ürün detayı yüklenirken hata oluştu: ${err.message}`);
      }
    }
  );

  // Ürün tiplerini çek
  const { data: productTypes, isLoading: isLoadingProductTypes } = useQuery(
    'productTypes',
    () => productApi.getProductTypes(),
    {
      enabled: isAuthenticated,
      onError: (err: any) => {
        message.error(`Ürün tipleri yüklenirken hata oluştu: ${err.message}`);
      }
    }
  );

  // Ölçü birimlerini çek
  const { data: unitOfMeasures, isLoading: isLoadingUnitOfMeasures } = useQuery(
    'unitOfMeasures',
    () => productApi.getUnitOfMeasures(),
    {
      enabled: isAuthenticated,
      onError: (err: any) => {
        message.error(`Ölçü birimleri yüklenirken hata oluştu: ${err.message}`);
      }
    }
  );

  // Ürün oluşturma mutation
  const createMutation = useMutation(
    (values: CreateProductRequest) => productApi.createProduct(values),
    {
      onSuccess: () => {
        message.success('Ürün başarıyla oluşturuldu');
        navigate('/products');
      },
      onError: (error: any) => {
        message.error(`Ürün oluşturulurken hata oluştu: ${error.message}`);
      }
    }
  );

  // Ürün güncelleme mutation
  const updateMutation = useMutation(
    ({ code, values }: { code: string; values: UpdateProductRequest }) => 
      productApi.updateProduct(code, values),
    {
      onSuccess: () => {
        message.success('Ürün başarıyla güncellendi');
        navigate(`/products/${productCode}`);
      },
      onError: (error: any) => {
        message.error(`Ürün güncellenirken hata oluştu: ${error.message}`);
      }
    }
  );

  // Form gönderimi
  const handleSubmit = (values: any) => {
    if (isEditMode) {
      // Düzenleme modu
      const updateData: UpdateProductRequest = {
        productDescription: values.productDescription,
        productTypeCode: values.productTypeCode,
        itemDimTypeCode: values.itemDimTypeCode,
        unitOfMeasureCode1: values.unitOfMeasureCode1,
        unitOfMeasureCode2: values.unitOfMeasureCode2 || undefined,
        companyBrandCode: values.companyBrandCode || undefined,
        usePOS: values.usePOS,
        useStore: values.useStore,
        useRoll: values.useRoll,
        useBatch: values.useBatch,
        generateSerialNumber: values.generateSerialNumber,
        useSerialNumber: values.useSerialNumber,
        isUTSDeclaratedItem: values.isUTSDeclaratedItem,
        isBlocked: values.isBlocked
      };
      updateMutation.mutate({ code: productCode!, values: updateData });
    } else {
      // Oluşturma modu
      const createData: CreateProductRequest = {
        productCode: values.productCode,
        productDescription: values.productDescription,
        productTypeCode: values.productTypeCode,
        itemDimTypeCode: values.itemDimTypeCode,
        unitOfMeasureCode1: values.unitOfMeasureCode1,
        unitOfMeasureCode2: values.unitOfMeasureCode2 || undefined,
        companyBrandCode: values.companyBrandCode || undefined,
        usePOS: values.usePOS,
        useStore: values.useStore,
        useRoll: values.useRoll,
        useBatch: values.useBatch,
        generateSerialNumber: values.generateSerialNumber,
        useSerialNumber: values.useSerialNumber,
        isUTSDeclaratedItem: values.isUTSDeclaratedItem,
        isBlocked: values.isBlocked
      };
      createMutation.mutate(createData);
    }
  };

  // Yükleme durumu
  const isPageLoading = isLoadingProduct || isLoadingProductTypes || isLoadingUnitOfMeasures;
  const isMutating = createMutation.isLoading || updateMutation.isLoading;

  if (isPageLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Ürün bilgileri yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(isEditMode ? `/products/${productCode}` : '/products')}
          className="mr-4"
        >
          Geri
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün'}
        </h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          usePOS: false,
          useStore: false,
          useRoll: false,
          useBatch: false,
          generateSerialNumber: false,
          useSerialNumber: false,
          isUTSDeclaratedItem: false,
          isBlocked: false
        }}
      >
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="productCode"
              label="Ürün Kodu"
              rules={[
                { required: true, message: 'Ürün kodu zorunludur' },
                { max: 30, message: 'Ürün kodu en fazla 30 karakter olabilir' }
              ]}
            >
              <Input disabled={isEditMode} />
            </Form.Item>

            <Form.Item
              name="productDescription"
              label="Ürün Adı"
              rules={[
                { required: true, message: 'Ürün adı zorunludur' },
                { max: 100, message: 'Ürün adı en fazla 100 karakter olabilir' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="productTypeCode"
              label="Ürün Tipi"
              rules={[{ required: true, message: 'Ürün tipi zorunludur' }]}
            >
              <Select
                placeholder="Ürün tipi seçin"
                loading={isLoadingProductTypes}
              >
                {productTypes?.map((type) => (
                  <Option key={type.code} value={type.code}>{type.description}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="itemDimTypeCode"
              label="Boyut Tipi"
              rules={[{ required: true, message: 'Boyut tipi zorunludur' }]}
            >
              <Select placeholder="Boyut tipi seçin">
                <Option value="1">Tek Boyut</Option>
                <Option value="2">İki Boyut</Option>
                <Option value="3">Üç Boyut</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="unitOfMeasureCode1"
              label="Ölçü Birimi 1"
              rules={[{ required: true, message: 'Ölçü birimi zorunludur' }]}
            >
              <Select
                placeholder="Ölçü birimi seçin"
                loading={isLoadingUnitOfMeasures}
              >
                {unitOfMeasures?.map((unit) => (
                  <Option key={unit.unitOfMeasureCode} value={unit.unitOfMeasureCode}>{unit.unitOfMeasureDescription}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="unitOfMeasureCode2"
              label="Ölçü Birimi 2"
            >
              <Select
                placeholder="Ölçü birimi seçin (opsiyonel)"
                allowClear
                loading={isLoadingUnitOfMeasures}
              >
                {unitOfMeasures?.map((unit) => (
                  <Option key={unit.unitOfMeasureCode} value={unit.unitOfMeasureCode}>{unit.unitOfMeasureDescription}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="companyBrandCode"
              label="Marka"
            >
              <Input placeholder="Marka kodu (opsiyonel)" />
            </Form.Item>

            <Form.Item
              name="isBlocked"
              label="Durum"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Pasif" 
                unCheckedChildren="Aktif" 
              />
            </Form.Item>
          </div>
        </Card>

        <Card title="Özellikler" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              name="usePOS"
              label="POS Kullanımı"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="useStore"
              label="Mağaza Kullanımı"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="useRoll"
              label="Rulo Kullanımı"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="useBatch"
              label="Parti Takibi"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="generateSerialNumber"
              label="Seri No Oluşturma"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="useSerialNumber"
              label="Seri No Kullanımı"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="isUTSDeclaratedItem"
              label="ÜTS Bildirimi"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
            loading={isMutating}
          >
            {isEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProductForm;
