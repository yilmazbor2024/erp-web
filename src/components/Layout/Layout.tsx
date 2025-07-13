import React, { useEffect, useState } from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomMenu from './MobileBottomMenu';
import { useAuth } from '../../contexts/AuthContext';
import auditLogService from '../../services/auditLogService';

const { Content } = AntLayout;

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Ekran boyutunu izle
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sayfa ziyaret zamanını ve önceki sayfayı izle
  const [pageVisitTime, setPageVisitTime] = useState<Date | null>(null);
  const [previousPath, setPreviousPath] = useState<string>('');
  
  // Sayfa değişikliklerini izle ve log kayıtları oluştur
  useEffect(() => {
    // Kullanıcı giriş yapmışsa ve yükleme tamamlanmışsa
    if (isAuthenticated && !isLoading && user) {
      const currentTime = new Date();
      
      // Eğer önceki sayfa ziyareti varsa, kalma süresini hesapla ve log oluştur
      if (pageVisitTime && previousPath) {
        const durationMs = currentTime.getTime() - pageVisitTime.getTime();
        const durationSeconds = Math.round(durationMs / 1000);
        
        // Sayfa modülünü belirle (önceki sayfa için)
        let previousModule = 'Other';
        if (previousPath.includes('/invoice')) previousModule = 'Invoice';
        else if (previousPath.includes('/customer')) previousModule = 'Customer';
        else if (previousPath.includes('/product')) previousModule = 'Product';
        else if (previousPath.includes('/cash')) previousModule = 'Cash';
        else if (previousPath.includes('/payment')) previousModule = 'Payment';
        else if (previousPath.includes('/admin')) previousModule = 'Admin';
        
        // Önceki sayfada kalma süresini ve çıkış zamanını logla
        auditLogService.logPageView({
          pageUrl: previousPath,
          module: previousModule,
          username: user.userName || user.email,
          duration: durationSeconds,
          visitTime: pageVisitTime.toISOString(),
          exitTime: currentTime.toISOString()
        }).catch(error => {
          console.error('Sayfa görüntüleme logu oluşturulurken hata:', error);
        });
      }
      
      // Yeni sayfa için ziyaret zamanını güncelle
      setPageVisitTime(currentTime);
      setPreviousPath(location.pathname);
      
      // Sayfa modülünü belirle (yeni sayfa için)
      let module = 'Other';
      if (location.pathname.includes('/invoice')) module = 'Invoice';
      else if (location.pathname.includes('/customer')) module = 'Customer';
      else if (location.pathname.includes('/product')) module = 'Product';
      else if (location.pathname.includes('/cash')) module = 'Cash';
      else if (location.pathname.includes('/payment')) module = 'Payment';
      else if (location.pathname.includes('/admin')) module = 'Admin';
      
      // Yeni sayfa ziyaretini logla (giriş zamanı ile)
      auditLogService.logPageView({
        pageUrl: location.pathname,
        module: module,
        username: user.userName || user.email,
        visitTime: currentTime.toISOString()
      }).catch(error => {
        console.error('Sayfa görüntüleme logu oluşturulurken hata:', error);
      });
    }
  }, [location.pathname, isAuthenticated, isLoading, user]);
  
  // Sayfa kapatıldığında veya kullanıcı çıkış yaptığında son sayfada kalma süresini logla
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && user && pageVisitTime && previousPath) {
        const currentTime = new Date();
        const durationMs = currentTime.getTime() - pageVisitTime.getTime();
        const durationSeconds = Math.round(durationMs / 1000);
        
        // Sayfa modülünü belirle
        let module = 'Other';
        if (previousPath.includes('/invoice')) module = 'Invoice';
        else if (previousPath.includes('/customer')) module = 'Customer';
        else if (previousPath.includes('/product')) module = 'Product';
        else if (previousPath.includes('/cash')) module = 'Cash';
        else if (previousPath.includes('/payment')) module = 'Payment';
        else if (previousPath.includes('/admin')) module = 'Admin';
        
        // Senkron olarak gönder (sayfa kapanmadan önce)
        navigator.sendBeacon(
          '/api/auditlog/log-page-exit',
          JSON.stringify({
            pageUrl: previousPath,
            module: module,
            username: user.userName || user.email,
            duration: durationSeconds,
            visitTime: pageVisitTime.toISOString(),
            exitTime: currentTime.toISOString()
          })
        );
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, user, pageVisitTime, previousPath]);

  // Dashboard sayfasında mıyız?
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  return (
    <AntLayout style={{ minHeight: '100vh', position: 'relative' }}>
      <Sidebar />
      <AntLayout>
        <Header />
        <Content 
          style={{
            margin: '24px 16px', 
            padding: 24, 
            background: '#fff', 
            marginBottom: isMobile ? '100px' : '24px',
            paddingBottom: isMobile ? '80px' : '24px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Outlet />
        </Content>
        <MobileBottomMenu />
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 