import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const Siparisler: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Siparişler</h2>
          <Button type="primary" icon={<PlusOutlined />}>
            Yeni Sipariş
          </Button>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((order) => (
            <div key={order} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">Sipariş #{order}234</h3>
                  <p className="text-sm text-gray-500">Müşteri Adı {order}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Tamamlandı
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Toplam Tutar: ₺{order},450.00</p>
                <p className="text-xs text-gray-500 mt-1">2 saat önce</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Özeti</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Bugün</p>
              <p className="text-2xl font-bold text-blue-700">12</p>
              <p className="text-xs text-blue-500 mt-1">Toplam Sipariş</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Bu Ay</p>
              <p className="text-2xl font-bold text-green-700">156</p>
              <p className="text-xs text-green-500 mt-1">Toplam Sipariş</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Siparisler;
