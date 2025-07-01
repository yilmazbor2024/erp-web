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
import consumptionOrderApi, { 
  ConsumptionOrderResponse, 
  WarehouseResponse
} from '../../services/consumptionOrderApi';
import { formatDate } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

// Filtre parametreleri için interface
interface ConsumptionOrderFilterParams {
  orderNumber?: string;
  targetWarehouseCode?: string;
  startDate?: Date;
  endDate?: Date;
}

const ConsumptionOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State tanımlamaları
  const [orders, setOrders] = useState<ConsumptionOrderResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  
  // Filtre state'leri
  const [filters, setFilters] = useState<ConsumptionOrderFilterParams>({
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
      const warehousesData = await consumptionOrderApi.getWarehouses();
      setWarehouses(warehousesData);
      
      // Sair Sarf Fişlerini getir
      const ordersData = await consumptionOrderApi.getConsumptionOrders();
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
  
  // Yeni Sair Sarf Fişi oluşturma sayfasına yönlendirme
  const handleCreateNew = () => {
    navigate('/inventory/consumption-orders/new');
  };
  
  // Detay sayfasına yönlendirme
  const handleViewDetails = (orderNumber: string) => {
    navigate(`/inventory/consumption-orders/${orderNumber}`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sair Sarf Fişleri
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={() => setFilterOpen(true)}
              sx={{ mr: 1 }}
            >
              Filtrele
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              sx={{ mr: 1 }}
            >
              Yenile
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
            >
              Yeni Sair Sarf Fişi
            </Button>
          </Grid>
        </Grid>

        {/* Veri tablosu */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell>Fiş No</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Hedef Depo</TableCell>
                  <TableCell>Toplam Miktar</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="center">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Kayıt bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.transferNumber} hover>
                      <TableCell>{order.transferNumber}</TableCell>
                      <TableCell>{formatDate(order.operationDate)}</TableCell>
                      <TableCell>{order.targetWarehouseName || order.targetWarehouseCode}</TableCell>
                      <TableCell>{order.totalQty}</TableCell>
                      <TableCell>
                        {order.isCompleted ? (
                          <Chip label="Tamamlandı" color="success" size="small" />
                        ) : (
                          <Chip label="Bekliyor" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Detayları Görüntüle">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewDetails(order.transferNumber)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Filtre Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
        <DialogTitle>Filtreleme Seçenekleri</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Sair Sarf Fişlerini filtrelemek için aşağıdaki alanları kullanabilirsiniz.
          </DialogContentText>
          <Grid container spacing={2}>
            {/* @ts-ignore */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fiş No"
                variant="outlined"
                value={filters.orderNumber || ''}
                onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
              />
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="warehouse-select-label">Hedef Depo</InputLabel>
                <Select
                  labelId="warehouse-select-label"
                  value={filters.targetWarehouseCode || ''}
                  onChange={(e) => setFilters({ ...filters, targetWarehouseCode: e.target.value })}
                  label="Hedef Depo"
                >
                  <MenuItem value=""><em>Seçiniz</em></MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                      {warehouse.warehouseDescription}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date || undefined })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date || undefined })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters} startIcon={<ClearIcon />}>
            Temizle
          </Button>
          <Button onClick={() => setFilterOpen(false)} color="inherit">
            İptal
          </Button>
          <Button onClick={handleFilter} color="primary" startIcon={<SearchIcon />}>
            Filtrele
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConsumptionOrderListPage;
