import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { tr as trLocale } from 'date-fns/locale';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import productionOrderApi, { 
  ProductionOrderResponse, 
  ProductionOrderFilterParams,
  WarehouseResponse
} from '../../services/productionOrderApi';
import { formatDate } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

const ProductionOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State tanımlamaları
  const [orders, setOrders] = useState<ProductionOrderResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  
  // Filtre state'leri
  const [filters, setFilters] = useState<ProductionOrderFilterParams>({
    orderNumber: '',
    targetWarehouseCode: '',
    startDate: undefined,
    endDate: undefined
  });
  
  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchData();
  }, []);
  
  // Verileri getiren fonksiyon
  const fetchData = async () => {
    setLoading(true);
    try {
      // Depoları getir
      const warehousesData = await productionOrderApi.getWarehouses();
      setWarehouses(warehousesData);
      
      // İmalat fişlerini getir
      const ordersData = await productionOrderApi.getProductionOrders(filters);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Veriler yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Filtreleme fonksiyonu
  const handleFilter = () => {
    fetchData();
    setFilterOpen(false);
  };
  
  // Filtreleri temizleme fonksiyonu
  const handleClearFilters = () => {
    setFilters({
      orderNumber: '',
      targetWarehouseCode: '',
      startDate: undefined,
      endDate: undefined
    });
  };
  
  // Filtre değişikliklerini izleme fonksiyonu
  const handleFilterChange = (field: keyof ProductionOrderFilterParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Depo adını kodu ile bulma fonksiyonu
  const getWarehouseName = (code: string): string => {
    const warehouse = warehouses.find(w => w.warehouseCode === code);
    return warehouse ? warehouse.warehouseName : code;
  };
  
  // Detay sayfasına yönlendirme fonksiyonu
  const handleViewDetails = (orderNumber: string) => {
    navigate(`/inventory/production-orders/${orderNumber}`);
  };
  
  // Yeni imalat fişi oluşturma sayfasına yönlendirme fonksiyonu
  const handleCreateNew = () => {
    navigate('/inventory/production-orders/new');
  };
  
  return (
    <Container maxWidth="xl" sx={{ paddingLeft: '4px', paddingRight: '4px' }}>
      <Box sx={{ padding: '8px 4px' }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            İmalat Fişi
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', flex: 1, mr: 1 }}>
            <TextField
              placeholder="Ara..."
              size="small"
              fullWidth
              onChange={(e) => {
                const searchText = e.target.value;
                // Basit arama - tüm fişleri filtrele
                if (searchText) {
                  const filtered = orders.filter(o => 
                    (o.orderNumber && o.orderNumber.toLowerCase().includes(searchText.toLowerCase())) ||
                    (o.targetWarehouseName && o.targetWarehouseName.toLowerCase().includes(searchText.toLowerCase()))
                  );
                  setOrders(filtered);
                } else {
                  // Arama boşsa tüm verileri yeniden yükle
                  fetchData();
                }
              }}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex' }}>
            <Button
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={() => setFilterOpen(true)}
              size="small"
              sx={{ mr: 1 }}
            >
              Filtrele
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              size="small"
              sx={{ mr: 1 }}
            >
              Yenile
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              size="small"
            >
              Yeni
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fiş Bilgileri</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Miktar / Durum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Kayıt bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, index) => (
                    <TableRow key={order.orderNumber || order.transferNumber || `order-${index}`} 
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                      onClick={() => order.orderNumber && handleViewDetails(order.orderNumber)}
                    >
                      {/* 1. Kolon: Fiş No, Tarih, Hedef Depo */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {order.orderNumber || '???'} - {formatDate(order.operationDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {order.targetWarehouseCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.targetWarehouseName.substring(0, 30)}{order.targetWarehouseName.length > 30 ? '...' : ''}
                          </Typography>
                          
                          {/* Açıklama alanı */}
                          {order.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                              <span style={{ fontWeight: 'bold' }}>Not:</span> {order.description.substring(0, 50)}{order.description.length > 50 ? '...' : ''}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      {/* 2. Kolon: Miktar ve Durum */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Miktar */}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {order.totalQuantity || order.totalQty || 0} AD
                          </Typography>
                          
                          {/* Durum */}
                          {order.isTransferApproved ? (
                            <Chip label="Onaylandı" color="success" size="small" sx={{ maxWidth: '100%' }} />
                          ) : order.isLocked ? (
                            <Chip 
                              label={`Kilitli`} 
                              color="warning" 
                              size="small" 
                              sx={{ maxWidth: '100%' }}
                            />
                          ) : (
                            <Chip label="Bekliyor" color="default" size="small" sx={{ maxWidth: '100%' }} />
                          )}
                          
                          {/* İşlemler */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (order.orderNumber) {
                                  handleViewDetails(order.orderNumber);
                                }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      
      {/* Filtreleme Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <FilterAltIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filtrele</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <Box>
              <TextField
                label="Fiş Numarası"
                fullWidth
                size="small"
                value={filters.orderNumber || ''}
                onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
              />
            </Box>
            
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Hedef Depo</InputLabel>
                <Select
                  value={filters.targetWarehouseCode || ''}
                  label="Hedef Depo"
                  onChange={(e) => handleFilterChange('targetWarehouseCode', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Seçiniz</em>
                  </MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                      {warehouse.warehouseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                  <DatePicker
                    label="Başlangıç Tarihi"
                    value={filters.startDate || null}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
              
              <Box sx={{ flex: '1 1 300px' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={filters.endDate || null}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClearFilters} 
            startIcon={<ClearIcon />}
          >
            Temizle
          </Button>
          <Button 
            onClick={handleFilter} 
            variant="contained" 
            color="primary"
            startIcon={<FilterAltIcon />}
          >
            Filtrele
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductionOrderListPage;
