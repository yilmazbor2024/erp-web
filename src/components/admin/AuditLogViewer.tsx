import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  Pagination,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import auditLogService, { AuditLog, AuditLogFilter } from '../../services/auditLogService';
import { format } from 'date-fns';

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filter states
  const [filter, setFilter] = useState<AuditLogFilter>({
    module: '',
    action: '',
    username: '',
    startDate: undefined,
    endDate: undefined,
    page: 1,
    pageSize: 10
  });
  
  const modules = [
    { value: '', label: 'Tümü' },
    { value: 'Invoice', label: 'Fatura' },
    { value: 'Customer', label: 'Müşteri' },
    { value: 'Product', label: 'Ürün' },
    { value: 'Payment', label: 'Ödeme' },
    { value: 'Settings', label: 'Ayarlar' }
  ];
  
  const actions = [
    { value: '', label: 'Tümü' },
    { value: 'PAGE_VIEW', label: 'Sayfa Görüntüleme' },
    { value: 'FORM_SUBMIT', label: 'Form Gönderimi' },
    { value: 'RECORD_CREATE', label: 'Kayıt Oluşturma' },
    { value: 'RECORD_UPDATE', label: 'Kayıt Güncelleme' },
    { value: 'RECORD_DELETE', label: 'Kayıt Silme' },
    { value: 'API_GET', label: 'API GET' },
    { value: 'API_POST', label: 'API POST' },
    { value: 'API_PUT', label: 'API PUT' },
    { value: 'API_DELETE', label: 'API DELETE' }
  ];
  
  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);
  
  const fetchLogs = async () => {
    try {
      console.log('İşlem logları getiriliyor...');
      setLoading(true);
      
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn('Token bulunamadı, işlem logları alınamıyor');
        setLogs([]);
        setTotalCount(0);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      
      const currentFilter = {
        ...filter,
        page,
        pageSize
      };
      
      console.log('İşlem logları için filtre:', currentFilter);
      
      const response = await auditLogService.getAllLogs(currentFilter);
      console.log('İşlem logları yanıtı:', response);
      
      if (response && response.logs) {
        setLogs(response.logs);
        setTotalCount(response.totalCount);
        // totalPages değerini totalCount ve pageSize kullanarak hesapla
        const calculatedTotalPages = Math.ceil(response.totalCount / pageSize);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
        console.log(`${response.logs.length} adet log yüklendi, toplam: ${response.totalCount}, sayfa: ${calculatedTotalPages}`);
      } else {
        console.warn('İşlem logları yanıtı boş veya geçersiz format');
        setLogs([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('İşlem logları alınırken hata oluştu:', error);
      setLogs([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (field: keyof AuditLogFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const applyFilters = () => {
    console.log('Filtreler uygulanıyor:', filter);
    setPage(1); // Filtreleme yapıldığında ilk sayfaya dön
    
    // Token kontrolü
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      console.warn('Token bulunamadı, filtreler uygulanamıyor');
      return;
    }
    
    fetchLogs();
  };
  
  const handleResetFilters = () => {
    setFilter({
      module: '',
      action: '',
      username: '',
      startDate: undefined,
      endDate: undefined,
      page: 1,
      pageSize: 10
    });
    setPage(1);
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };
  
  const handleCloseDetails = () => {
    setSelectedLog(null);
  };
  
  const exportToCSV = () => {
    // CSV başlıkları
    const headers = [
      'ID',
      'Kullanıcı',
      'İşlem',
      'Modül',
      'Sayfa/Form',
      'Tarih',
      'IP Adresi'
    ];
    
    // Log verilerini CSV formatına dönüştür
    const csvData = logs.map(log => [
      log.id,
      log.username,
      log.action,
      log.module,
      log.pageUrl || log.formName || '',
      format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss'),
      log.ipAddress || ''
    ]);
    
    // CSV içeriğini oluştur
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // CSV dosyasını indir
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Kullanıcı İşlem Logları
        </Typography>
        <Box>
          <Tooltip title="Filtreleri Göster/Gizle">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Yenile">
            <IconButton onClick={fetchLogs}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="CSV Olarak İndir">
            <IconButton onClick={exportToCSV}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Modül</InputLabel>
                <Select
                  value={filter.module}
                  label="Modül"
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                >
                  {modules.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>İşlem</InputLabel>
                <Select
                  value={filter.action}
                  label="İşlem"
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  {actions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Kullanıcı"
                value={filter.username || ''}
                onChange={(e) => handleFilterChange('username', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={filter.startDate ? new Date(filter.startDate) : null}
                  onChange={(date) => handleFilterChange('startDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={filter.endDate ? new Date(filter.endDate) : null}
                  onChange={(date) => handleFilterChange('endDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={handleResetFilters} 
                sx={{ mr: 1 }}
              >
                Sıfırla
              </Button>
              <Button 
                variant="contained" 
                onClick={applyFilters}
              >
                Filtrele
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Kullanıcı</TableCell>
              <TableCell>İşlem</TableCell>
              <TableCell>Modül</TableCell>
              <TableCell>Sayfa/Form</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Yükleniyor...</TableCell>
              </TableRow>
            ) : !logs || logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Kayıt bulunamadı</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.username}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell>{log.pageUrl || log.formName || '-'}</TableCell>
                  <TableCell>{format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}</TableCell>
                  <TableCell>
                    <Tooltip title="Detayları Görüntüle">
                      <IconButton size="small" onClick={() => handleViewDetails(log)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2">
          Toplam {totalCount} kayıt
        </Typography>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange} 
          color="primary" 
        />
      </Box>
      
      {selectedLog && (
        <Paper sx={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '80%', 
          maxWidth: 600, 
          p: 4, 
          zIndex: 1000,
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Log Detayları
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2"><strong>ID:</strong> {selectedLog.id}</Typography>
            <Typography variant="body2"><strong>Kullanıcı ID:</strong> {selectedLog.userId}</Typography>
            <Typography variant="body2"><strong>Kullanıcı Adı:</strong> {selectedLog.username}</Typography>
            <Typography variant="body2"><strong>İşlem:</strong> {selectedLog.action}</Typography>
            <Typography variant="body2"><strong>Modül:</strong> {selectedLog.module}</Typography>
            {selectedLog.pageUrl && (
              <Typography variant="body2"><strong>Sayfa URL:</strong> {selectedLog.pageUrl}</Typography>
            )}
            {selectedLog.formName && (
              <Typography variant="body2"><strong>Form Adı:</strong> {selectedLog.formName}</Typography>
            )}
            <Typography variant="body2">
              <strong>Tarih:</strong> {format(new Date(selectedLog.timestamp), 'dd.MM.yyyy HH:mm:ss')}
            </Typography>
            {selectedLog.ipAddress && (
              <Typography variant="body2"><strong>IP Adresi:</strong> {selectedLog.ipAddress}</Typography>
            )}
            {selectedLog.userAgent && (
              <Typography variant="body2"><strong>Tarayıcı:</strong> {selectedLog.userAgent}</Typography>
            )}
          </Box>
          
          {selectedLog.details && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Detaylar:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" onClick={handleCloseDetails}>
              Kapat
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AuditLogViewer;
