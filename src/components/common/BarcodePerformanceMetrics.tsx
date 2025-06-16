import React from 'react';
import { Card, Statistic, Row, Col, Progress, Typography } from 'antd';
import { ScanOutlined, ClockCircleOutlined, DatabaseOutlined, RocketOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PerformanceMetricsProps {
  scanCount: number;
  averageScanTime: number;
  scansPerSecond: number;
  dbFetchTimes: number[];
  uiRenderTimes: number[];
}

const BarcodePerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  scanCount,
  averageScanTime,
  scansPerSecond,
  dbFetchTimes,
  uiRenderTimes,
}) => {
  // Ortalama veritabanı erişim süresi (ms)
  const avgDbTime = dbFetchTimes.length > 0
    ? dbFetchTimes.reduce((sum, time) => sum + time, 0) / dbFetchTimes.length
    : 0;

  // Ortalama UI render süresi (ms)
  const avgUiTime = uiRenderTimes.length > 0
    ? uiRenderTimes.reduce((sum, time) => sum + time, 0) / uiRenderTimes.length
    : 0;

  // Toplam işlem süresi
  const avgTotalTime = avgDbTime + avgUiTime;
  
  // Hedef: Saniyede 3-4 barkod
  const targetScansPerSecond = 3.5;
  const performancePercentage = Math.min(Math.round((scansPerSecond / targetScansPerSecond) * 100), 100);
  
  // Performans durumu
  const getPerformanceStatus = () => {
    if (scansPerSecond >= 3.5) return { color: 'green', text: 'Mükemmel' };
    if (scansPerSecond >= 2.5) return { color: 'blue', text: 'İyi' };
    if (scansPerSecond >= 1.5) return { color: 'orange', text: 'Orta' };
    return { color: 'red', text: 'Yavaş' };
  };
  
  const performanceStatus = getPerformanceStatus();

  return (
    <Card title="Barkod Okuma Performansı" size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Statistic 
            title="Toplam Tarama" 
            value={scanCount} 
            prefix={<ScanOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Saniyede Tarama" 
            value={scansPerSecond.toFixed(2)} 
            suffix="adet/sn" 
            precision={2}
            prefix={<RocketOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Veritabanı Erişimi" 
            value={avgDbTime.toFixed(0)} 
            suffix="ms" 
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Toplam İşlem Süresi" 
            value={avgTotalTime.toFixed(0)} 
            suffix="ms" 
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>
      
      <div style={{ marginTop: 16 }}>
        <Text>Performans Hedefi (3-4 barkod/sn)</Text>
        <Progress 
          percent={performancePercentage} 
          status={performancePercentage < 70 ? "exception" : "success"} 
          format={() => performanceStatus.text}
          strokeColor={performanceStatus.color}
        />
      </div>
      
      {avgTotalTime > 300 && (
        <div style={{ marginTop: 8 }}>
          <Text type="warning">
            İşlem süresi yüksek! Veritabanı sorguları optimize edilmeli.
          </Text>
        </div>
      )}
    </Card>
  );
};

export default BarcodePerformanceMetrics;
