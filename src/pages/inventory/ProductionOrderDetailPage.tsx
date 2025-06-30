import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import productionOrderApi, { 
  ProductionOrderResponse,
  ProductionOrderItemResponse
} from '../../services/productionOrderApi';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

const ProductionOrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State tanımlamaları
  const [order, setOrder] = useState<ProductionOrderResponse | null>(null);
  const [orderItems, setOrderItems] = useState<ProductionOrderItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Sayfa yüklendiğinde veriyi getir
  useEffect(() => {
    if (orderNumber) {
      fetchOrderData();
    }
  }, [orderNumber]);
  
  // İmalat fişi detaylarını getiren fonksiyon
  const fetchOrderData = async () => {
    if (!orderNumber) return;
    
    setLoading(true);
    try {
      // Ana fiş bilgilerini getir
      const data = await productionOrderApi.getProductionOrderByNumber(orderNumber);
      if (data) {
        setOrder(data);
        
        // Fiş satır detaylarını getir
        const items = await productionOrderApi.getProductionOrderItems(orderNumber);
        setOrderItems(items);
      } else {
        enqueueSnackbar('İmalat fişi bulunamadı', { variant: 'error' });
        navigate('/inventory/production-orders');
      }
    } catch (error) {
      console.error('Error fetching production order data:', error);
      enqueueSnackbar('İmalat fişi detayları yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Listeye dön fonksiyonu
  const handleBack = () => {
    navigate('/inventory/production-orders');
  };
  
  // Yazdırma fonksiyonu
  const handlePrint = () => {
    window.print();
  };
  
  if (loading && !order) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3, mb: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            İmalat fişi bulunamadı
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Listeye Dön
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" className="print-container" sx={{ px: { xs: 1, sm: 2 } }}>
      {/* Başlık - En üstte */}
      <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton onClick={handleBack} className="no-print" size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ flex: 1, textAlign: 'center' }}>
            İmalat Fişi Detayları
          </Typography>
          <Tooltip title="Yazdır">
            <IconButton onClick={handlePrint} className="no-print" size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* İmalat Fişi Bilgileri - Mobil için optimize edilmiş */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
              İmalat Fişi Bilgileri
            </Typography>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 2
            }}>
              {/* 1. Kolon: Fiş No ve İşlem Tarihi */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Fiş Numarası
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {order.orderNumber}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    İşlem Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(order.operationDate)}
                  </Typography>
                </Box>
              </Box>

              {/* 2. Kolon: Hedef Depo */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Hedef Depo
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {order.targetWarehouseCode}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {order.targetWarehouseName}
                  </Typography>
                </Box>
              </Box>

              {/* 3. Kolon: Durum */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Durum
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {order.isApproved ? (
                      <Chip 
                        label="Onaylandı" 
                        color="success" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    ) : order.isLocked ? (
                      <Chip 
                        label="Kilitli" 
                        color="warning" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    ) : (
                      <Chip 
                        label="Bekliyor" 
                        color="default" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    )}
                  </Box>
                </Box>

                {order.isApproved && order.approvedDate && (
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                      Onay Tarihi
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(order.approvedDate)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Açıklama */}
            {order.description && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                  Açıklama
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {order.description}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Kalemler Tablosu */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
              İmalat Kalemleri
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sıra</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Stok Kodu</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Stok Adı</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Renk</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Boyut</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Miktar</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Birim</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Açıklama</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <TableRow key={item.innerLineId}>
                        <TableCell>{item.lineNumber}</TableCell>
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.colorName || '-'}</TableCell>
                        <TableCell>
                          {item.itemDim1Name ? item.itemDim1Name : '-'}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell>{item.unitName}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Kalem bulunamadı
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Oluşturma ve Güncelleme Bilgileri */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
              Sistem Bilgileri
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Oluşturan:</Typography>
                  <Typography variant="body2">{order.createdUserName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="textSecondary">Oluşturma Tarihi:</Typography>
                  <Typography variant="body2">{formatDateTime(order.createdDate)}</Typography>
                </Box>
              </Box>
              
              {order.lastUpdatedUserName && (
                <Box sx={{ flex: '1 1 300px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary">Son Güncelleyen:</Typography>
                    <Typography variant="body2">{order.lastUpdatedUserName}</Typography>
                  </Box>
                  {order.lastUpdatedDate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">Son Güncelleme:</Typography>
                      <Typography variant="body2">{formatDateTime(order.lastUpdatedDate)}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ProductionOrderDetailPage;
