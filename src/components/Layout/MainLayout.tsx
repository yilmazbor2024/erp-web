import React, { useEffect, useState } from 'react';
import { Layout, Typography } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomMenu from './MobileBottomMenu';

const { Content, Footer } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const [databaseInfo, setDatabaseInfo] = useState<{ name: string; company: string } | null>(null);

  useEffect(() => {
    // localStorage'dan seçilen veritabanı bilgisini al
    const dbName = localStorage.getItem('selectedDatabaseName');
    const companyName = localStorage.getItem('selectedCompanyName');
    
    if (dbName && companyName) {
      setDatabaseInfo({
        name: dbName,
        company: companyName
      });
    }
  }, []);

  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <Header title={title} />
        <Content className="p-6 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </Content>
        
        {/* Veritabanı bilgisini gösteren footer */}
        {databaseInfo && (
          <Footer className="py-2 px-4 bg-gray-100 border-t text-center">
            <Text type="secondary" className="text-xs">
              <strong>Veritabanı:</strong> {databaseInfo.name} | <strong>Şirket:</strong> {databaseInfo.company}
            </Text>
          </Footer>
        )}
        
        <MobileBottomMenu />
      </Layout>
    </Layout>
  );
};

export default MainLayout;
