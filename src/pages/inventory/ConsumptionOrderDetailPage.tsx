import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import consumptionOrderApi, { ConsumptionOrderResponse, ConsumptionOrderItemResponse } from '../../services/consumptionOrderApi';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

const ConsumptionOrderDetailPage: React.FC = () => {
  const { innerNumber } = useParams<{ innerNumber: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [order, setOrder] = useState<ConsumptionOrderResponse | null>(null);
  const [items, setItems] = useState<ConsumptionOrderItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (!innerNumber) {
      navigate('/inventory/consumption-orders');
      return;
    }
    
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const orderData = await consumptionOrderApi.getConsumptionOrderByNumber(innerNumber);
        if (orderData) {
          setOrder(orderData);
          
          const itemsData = await consumptionOrderApi.getConsumptionOrderItems(innerNumber);
          setItems(itemsData);
        } else {
          enqueueSnackbar('Sair Sarf Fişi bulunamadı', { variant: 'error' });
          navigate('/inventory/consumption-orders');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        enqueueSnackbar('Sair Sarf Fişi detayları yüklenirken bir hata oluştu', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [innerNumber, navigate, enqueueSnackbar]);
  
  const handleBack = () => {
    navigate('/inventory/consumption-orders');
  };
  
  const handleEdit = () => {
    navigate(`/inventory/consumption-orders/${innerNumber}/edit`);
  };
  
  const handlePrint = () => {
    // Yazdırma işlemi
    window.print();
  };
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h5" color="error">Sair Sarf Fişi bulunamadı</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Listeye Dön
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          {/* @ts-ignore */}
          <Grid item>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
              Listeye Dön
            </Button>
          </Grid>
          {/* @ts-ignore */}
          <Grid item sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1">
              Sair Sarf Fişi Detayı
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              Yazdır
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Düzenle
            </Button>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          {/* Fiş Bilgileri */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Fiş Bilgileri" />
              <CardContent>
                <Grid container spacing={2}>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fiş Numarası
                    </Typography>
                    <Typography variant="body1">{order.transferNumber}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      İşlem Tarihi
                    </Typography>
                    <Typography variant="body1">{formatDate(order.operationDate)}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Hedef Depo
                    </Typography>
                    <Typography variant="body1">{order.targetWarehouseName || order.targetWarehouseCode}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Toplam Miktar
                    </Typography>
                    <Typography variant="body1">{order.totalQty}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Açıklama
                    </Typography>
                    <Typography variant="body1">{order.description || '-'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Durum Bilgileri */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Durum Bilgileri" />
              <CardContent>
                <Grid container spacing={2}>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Durum
                    </Typography>
                    <Box>
                      {order.isCompleted ? (
                        <Chip label="Tamamlandı" color="success" size="small" />
                      ) : (
                        <Chip label="Bekliyor" color="warning" size="small" />
                      )}
                    </Box>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Kilitli
                    </Typography>
                    <Box>
                      {order.isLocked ? (
                        <Chip label="Evet" color="error" size="small" />
                      ) : (
                        <Chip label="Hayır" color="success" size="small" />
                      )}
                    </Box>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Oluşturan
                    </Typography>
                    <Typography variant="body1">{order.createdUserName || '-'}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Oluşturma Tarihi
                    </Typography>
                    <Typography variant="body1">{formatDateTime(order.createdDate) || '-'}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Son Güncelleyen
                    </Typography>
                    <Typography variant="body1">{order.lastUpdatedUserName || '-'}</Typography>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Son Güncelleme Tarihi
                    </Typography>
                    <Typography variant="body1">{formatDateTime(order.lastUpdatedDate) || '-'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Ürün Listesi */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ürün Listesi
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow key="header-row">
                  <TableCell>Sıra</TableCell>
                  <TableCell>Ürün Kodu</TableCell>
                  <TableCell>Ürün Adı</TableCell>
                  <TableCell>Renk</TableCell>
                  <TableCell>Beden</TableCell>
                  <TableCell>Miktar</TableCell>
                  <TableCell>Birim</TableCell>
                  <TableCell>Açıklama</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow key="empty-row">
                    <TableCell colSpan={8} align="center">
                      Ürün bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.innerLineId}>
                      <TableCell>{item.lineNumber}</TableCell>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.colorName || item.colorCode || '-'}</TableCell>
                      <TableCell>{item.itemDim1Name || item.itemDim1Code || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unitName || item.unitCode || '-'}</TableCell>
                      <TableCell>{item.lineDescription || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Container>
  );
};

export default ConsumptionOrderDetailPage;
