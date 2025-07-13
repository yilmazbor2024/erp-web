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
  Check as CheckIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import warehouseTransferApi, { 
  WarehouseTransferResponse, 
  WarehouseTransferFilterParams,
  WarehouseResponse
} from '../../services/warehouseTransferApi';
import { formatDate } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

const WarehouseTransferListPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State tanımlamaları
  const [transfers, setTransfers] = useState<WarehouseTransferResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'approve' | 'cancel' | 'lock' | 'unlock' | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);
  
  // Filtre state'leri
  const [filters, setFilters] = useState<WarehouseTransferFilterParams>({
    sourceWarehouseCode: '',
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
      const warehousesData = await warehouseTransferApi.getWarehouses();
      setWarehouses(warehousesData);
      
      // Depolar arası sevkleri getir
      const transfersData = await warehouseTransferApi.getWarehouseTransfers(filters);
      setTransfers(transfersData);
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
      sourceWarehouseCode: '',
      targetWarehouseCode: '',
      startDate: undefined,
      endDate: undefined
    });
  };
  
  // Filtre değişikliklerini izleme fonksiyonu
  const handleFilterChange = (field: keyof WarehouseTransferFilterParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Onaylama, iptal etme, kilitleme ve kilit açma işlemleri
  const handleAction = async () => {
    if (!selectedTransfer || !actionType) return;
    
    setLoading(true);
    try {
      let success = false;
      let message = '';
      
      switch (actionType) {
        case 'approve':
          success = await warehouseTransferApi.approveWarehouseTransfer(selectedTransfer);
          message = 'Sevk başarıyla onaylandı';
          break;
        case 'cancel':
          success = await warehouseTransferApi.cancelWarehouseTransfer(selectedTransfer);
          message = 'Sevk başarıyla iptal edildi';
          break;
        case 'lock':
          success = await warehouseTransferApi.lockWarehouseTransfer(selectedTransfer);
          message = 'Sevk başarıyla kilitlendi';
          break;
        case 'unlock':
          success = await warehouseTransferApi.unlockWarehouseTransfer(selectedTransfer);
          message = 'Sevk kilidi başarıyla açıldı';
          break;
      }
      
      if (success) {
        enqueueSnackbar(message, { variant: 'success' });
        fetchData(); // Verileri yenile
      } else {
        enqueueSnackbar('İşlem başarısız oldu', { variant: 'error' });
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
      enqueueSnackbar('İşlem sırasında bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
      setSelectedTransfer(null);
      setActionType(null);
    }
  };
  
  // İşlem onay dialogunu açma fonksiyonu
  const openConfirmDialog = (transferNumber: string, action: 'approve' | 'cancel' | 'lock' | 'unlock') => {
    setSelectedTransfer(transferNumber);
    setActionType(action);
    setConfirmDialogOpen(true);
  };
  
  // Depo adını kodu ile bulma fonksiyonu
  const getWarehouseName = (code: string): string => {
    const warehouse = warehouses.find(w => w.warehouseCode === code);
    return warehouse ? warehouse.warehouseDescription : code;
  };
  
  // Detay sayfasına yönlendirme fonksiyonu
  const handleViewDetails = (transferNumber: string) => {
    navigate(`/inventory/warehouse-transfers/${transferNumber}`);
  };
  
  // Yeni sevk oluşturma sayfasına yönlendirme fonksiyonu
  const handleCreateNew = () => {
    navigate('/inventory/warehouse-transfers/create');
  };
  
  // Onay dialogu içeriği
  const getDialogContent = () => {
    if (!actionType || !selectedTransfer) return '';
    
    switch (actionType) {
      case 'approve':
        return `${selectedTransfer} numaralı sevki onaylamak istediğinize emin misiniz? Bu işlem stok hareketleri oluşturacak ve geri alınamaz.`;
      case 'cancel':
        return `${selectedTransfer} numaralı sevki iptal etmek istediğinize emin misiniz?`;
      case 'lock':
        return `${selectedTransfer} numaralı sevki kilitlemek istediğinize emin misiniz? Kilitli sevk üzerinde sadece siz değişiklik yapabilirsiniz.`;
      case 'unlock':
        return `${selectedTransfer} numaralı sevkin kilidini açmak istediğinize emin misiniz?`;
      default:
        return '';
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ paddingLeft: '4px', paddingRight: '4px' }}>
      <Box sx={{ padding: '8px 4px' }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Depolar Arası Sevk
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
                // Basit arama - tüm transferleri filtrele
                if (searchText) {
                  const filtered = transfers.filter(t => 
                    t.transferNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                    t.sourceWarehouseName.toLowerCase().includes(searchText.toLowerCase()) ||
                    t.targetWarehouseName.toLowerCase().includes(searchText.toLowerCase())
                  );
                  setTransfers(filtered);
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
              onClick={() => navigate('/inventory/warehouse-transfers/new')}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Sevk Bilgileri</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Miktar / Durum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Kayıt bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer) => (
                    <TableRow key={transfer.transferNumber} 
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                      onClick={() => handleViewDetails(transfer.transferNumber)}
                    >
                      {/* 1. Kolon: Sevk No, Tarih, Kaynak ve Hedef Depo */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {transfer.transferNumber} - {formatDate(transfer.operationDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {transfer.sourceWarehouseCode} → {transfer.targetWarehouseCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {transfer.sourceWarehouseName.substring(0, 15)}{transfer.sourceWarehouseName.length > 15 ? '...' : ''} → {transfer.targetWarehouseName.substring(0, 15)}{transfer.targetWarehouseName.length > 15 ? '...' : ''}
                          </Typography>
                          
                          {/* Not alanı */}
                          {transfer.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                              <span style={{ fontWeight: 'bold' }}>Not:</span> {transfer.description.substring(0, 50)}{transfer.description.length > 50 ? '...' : ''}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      {/* 2. Kolon: Miktar ve Durum */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Miktar */}
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {transfer.totalQty} AD
                          </Typography>
                          
                          {/* Durum */}
                          {transfer.isCompleted ? (
                            <Chip label="Onaylandı" color="success" size="small" sx={{ maxWidth: '100%' }} />
                          ) : transfer.isLocked ? (
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
                            {!transfer.isCompleted && (
                              <>
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirmDialog(transfer.transferNumber, 'approve');
                                  }}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                                
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirmDialog(transfer.transferNumber, 'cancel');
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                                
                                {!transfer.isLocked ? (
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openConfirmDialog(transfer.transferNumber, 'lock');
                                    }}
                                  >
                                    <LockIcon fontSize="small" />
                                  </IconButton>
                                ) : (
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openConfirmDialog(transfer.transferNumber, 'unlock');
                                    }}
                                  >
                                    <LockOpenIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </>
                            )}
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
            Filtreleme Seçenekleri
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel id="source-warehouse-label">Kaynak Depo</InputLabel>
                <Select
                  labelId="source-warehouse-label"
                  value={filters.sourceWarehouseCode}
                  onChange={(e) => handleFilterChange('sourceWarehouseCode', e.target.value)}
                  label="Kaynak Depo"
                >
                  <MenuItem value="">
                    <em>Tümü</em>
                  </MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                      {warehouse.warehouseCode} - {warehouse.warehouseDescription}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <FormControl fullWidth>
                <InputLabel id="target-warehouse-label">Hedef Depo</InputLabel>
                <Select
                  labelId="target-warehouse-label"
                  value={filters.targetWarehouseCode}
                  onChange={(e) => handleFilterChange('targetWarehouseCode', e.target.value)}
                  label="Hedef Depo"
                >
                  <MenuItem value="">
                    <em>Tümü</em>
                  </MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                      {warehouse.warehouseCode} - {warehouse.warehouseDescription}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} localeText={{ start: 'Başlangıç', end: 'Bitiş' }}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} localeText={{ start: 'Başlangıç', end: 'Bitiş' }}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
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
          <Button onClick={handleFilter} variant="contained" color="primary" startIcon={<SearchIcon />}>
            Filtrele
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Onay Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          {actionType === 'approve' && 'Sevk Onaylama'}
          {actionType === 'cancel' && 'Sevk İptal Etme'}
          {actionType === 'lock' && 'Sevk Kilitleme'}
          {actionType === 'unlock' && 'Sevk Kilit Açma'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getDialogContent()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Vazgeç
          </Button>
          <Button 
            onClick={handleAction} 
            color={actionType === 'cancel' ? 'error' : 'primary'} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WarehouseTransferListPage;
