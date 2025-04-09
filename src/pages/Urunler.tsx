import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const Urunler: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ürünler</h2>
          <Button type="primary" icon={<PlusOutlined />}>
            Yeni Ürün
          </Button>
        </div>
        
        {/* Ürün listesi buraya gelecek */}
        <div className="text-gray-500 text-center py-8">
          Henüz ürün bulunmamaktadır.
        </div>
      </div>
    </div>
  );
};

export default Urunler;
