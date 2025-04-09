import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomMenu from './MobileBottomMenu';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
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
        <MobileBottomMenu />
      </Layout>
    </Layout>
  );
};

export default MainLayout;
