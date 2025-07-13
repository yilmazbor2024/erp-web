import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  // Grid bileşeni yerine Box kullanıyoruz
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AlertColor } from '@mui/material/Alert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import RefreshIcon from '@mui/icons-material/Refresh';
import Chip from '@mui/material/Chip';
import InfoIcon from '@mui/icons-material/Info';
import { useAuth } from '../../../contexts/AuthContext';
import databaseBackupService, { DatabaseTable, QueryResult } from '../../../services/databaseBackupService';

// API'den gelen veritabanı tipi
interface Database {
  id: string;
  databaseName: string;
  companyName: string;
  serverName: string;
  serverPort: number;
  isActive: boolean;
}

// Database interface'i burada tanımlıyoruz, diğer tipler servisten import edildi

// Tab paneli için props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab paneli bileşeni
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sql-tabpanel-${index}`}
      aria-labelledby={`sql-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const SqlOperationsTab: React.FC = () => {
  const { apiUrl } = useAuth();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Veritabanlarını yükle
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const response = await databaseBackupService.listDatabases();
        
        if (response.success) {
          setDatabases(response.data);
          // İlk veritabanını otomatik seç
          if (response.data.length > 0 && !selectedDatabase) {
            setSelectedDatabase(response.data[0].id);
          }
        } else {
          setSnackbar({
            open: true,
            message: response.message || 'Veritabanları yüklenirken hata oluştu',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Veritabanları yüklenirken hata oluştu:', error);
        setSnackbar({
          open: true,
          message: 'Veritabanları yüklenirken hata oluştu',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, [apiUrl]);

  // Seçili veritabanı değiştiğinde tabloları yükle
  useEffect(() => {
    if (selectedDatabase) {
      fetchTables();
    }
  }, [selectedDatabase]);

  // Tabloları ve viewleri yükle
  const fetchTables = async () => {
    if (!selectedDatabase) return;

    try {
      setLoading(true);
      console.log('Tablolar ve viewler yükleniyor, databaseId:', selectedDatabase);
      
      // Yeni getTablesAndViews metodunu kullanalım
      const response = await databaseBackupService.getTablesAndViews(selectedDatabase);
      console.log('API yanıtı:', response);
      
      if (response.success) {
        console.log('Tablolar ve viewler başarıyla yüklendi:', response.data);
        setTables(response.data);
      } else {
        console.error('API hatası:', response.message);
        setSnackbar({
          open: true,
          message: response.message || 'Tablolar ve viewler yüklenirken hata oluştu',
          severity: 'error'
        });
      }
    } catch (error: any) {
      console.error('Tablolar ve viewler yüklenirken hata oluştu:', error);
      console.error('Hata detayları:', error?.response?.data || error?.message || 'Bilinmeyen hata');
      
      setSnackbar({
        open: true,
        message: `Tablolar ve viewler yüklenirken hata oluştu: ${error?.response?.data?.message || error?.message || 'Bilinmeyen hata'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Veritabanı değişikliği
  const handleDatabaseChange = (event: SelectChangeEvent) => {
    setSelectedDatabase(event.target.value);
    setQueryResult(null);
  };

  // Tab değişikliği
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // SQL sorgusu değişikliği
  const handleSqlQueryChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSqlQuery(event.target.value);
  };

  // SQL sorgusu çalıştırma
  const handleRunQuery = async () => {
    if (!selectedDatabase || !sqlQuery.trim()) return;

    try {
      setQueryLoading(true);
      const response = await databaseBackupService.executeQuery(selectedDatabase, sqlQuery);
      
      if (response.success) {
        setQueryResult(response.data);
        setSnackbar({
          open: true,
          message: `Sorgu başarıyla çalıştırıldı. ${response.data.rowCount} satır döndü.`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Sorgu çalıştırılırken hata oluştu',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Sorgu çalıştırılırken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Sorgu çalıştırılırken hata oluştu',
        severity: 'error'
      });
    } finally {
      setQueryLoading(false);
    }
  };

  // Tablo seçme ve sorguyu otomatik oluşturma
  const handleSelectTable = (tableName: string) => {
    setSqlQuery(`SELECT TOP 100 * FROM ${tableName}`);
    setTabValue(1); // SQL sorgu sekmesine geç
  };

  // Snackbar kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* Veritabanı seçimi */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '0 0 300px', width: '100%' }}>
            <FormControl fullWidth>
              <InputLabel id="database-select-label">Veritabanı</InputLabel>
              <Select
                labelId="database-select-label"
                id="database-select"
                value={selectedDatabase}
                label="Veritabanı"
                onChange={handleDatabaseChange}
                disabled={loading || queryLoading}
              >
                {databases.map((db) => (
                  <MenuItem key={db.id} value={db.id}>
                    {db.databaseName} ({db.companyName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchTables}
              disabled={!selectedDatabase || loading || queryLoading}
            >
              Tabloları ve View'leri Yükle
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Sekme paneli */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="sql operations tabs">
            <Tab icon={<TableChartIcon />} iconPosition="start" label="Tablolar ve View'ler" />
            <Tab icon={<CodeIcon />} iconPosition="start" label="SQL Sorgu" />
          </Tabs>
        </Box>

        {/* Tablolar sekmesi */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : tables.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedDatabase ? 'Bu veritabanında tablo veya view bulunamadı veya erişim izniniz bulunmuyor.' : 'Lütfen bir veritabanı seçin.'}
              </Typography>
              {selectedDatabase && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Olası çözümler:
                  </Typography>
                  <ul>
                    <li>
                      <Typography variant="body2">Başka bir veritabanı seçmeyi deneyin.</Typography>
                    </li>
                    <li>
                      <Typography variant="body2">Veritabanı bağlantı ayarlarınızı kontrol edin.</Typography>
                    </li>
                    <li>
                      <Typography variant="body2">Yeterli izinlere sahip olduğunuzdan emin olun.</Typography>
                    </li>
                  </ul>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={fetchTables} 
                    startIcon={<RefreshIcon />}
                    sx={{ mt: 1 }}
                  >
                    Yeniden Dene
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tip</TableCell>
                    <TableCell>Şema</TableCell>
                    <TableCell>Tablo/View Adı</TableCell>
                    <TableCell>Kolon Sayısı</TableCell>
                    <TableCell>Satır Sayısı</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tables.map((table, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {table.objectType === 'VIEW' ? (
                          <Chip size="small" label="View" color="secondary" />
                        ) : (
                          <Chip size="small" label="Tablo" color="primary" />
                        )}
                      </TableCell>
                      <TableCell>{table.schema}</TableCell>
                      <TableCell>{table.tableName}</TableCell>
                      <TableCell>{table.columnCount}</TableCell>
                      <TableCell>{table.rowCount}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSelectTable(`${table.schema}.${table.tableName}`)}
                        >
                          Sorgu Oluştur
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* SQL Sorgu sekmesi */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              SQL Sorgusu
              <Tooltip title="DROP DATABASE, ALTER DATABASE gibi tehlikeli komutlar güvenlik nedeniyle engellenmiştir.">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              value={sqlQuery}
              onChange={handleSqlQueryChange}
              placeholder="SELECT * FROM TableName"
              disabled={queryLoading || !selectedDatabase}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleRunQuery}
                disabled={queryLoading || !selectedDatabase || !sqlQuery.trim()}
              >
                Sorguyu Çalıştır
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Sorgu sonuçları */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Sorgu Sonuçları
            </Typography>
            
            {queryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : !queryResult ? (
              <Typography variant="body2" color="text.secondary">
                Henüz sorgu çalıştırılmadı.
              </Typography>
            ) : queryResult.rows.length === 0 ? (
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body2">
                  Sorgu başarıyla çalıştırıldı fakat sonuç döndürmedi.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Çalışma süresi: {queryResult.executionTime} ms
                </Typography>
              </Paper>
            ) : (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {queryResult.rowCount} satır döndü
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Çalışma süresi: {queryResult.executionTime} ms
                  </Typography>
                </Box>
                
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {queryResult.columns.map((column, index) => (
                          <TableCell key={index}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {queryResult.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {queryResult.columns.map((column, colIndex) => (
                            <TableCell key={`${rowIndex}-${colIndex}`}>
                              {row[column] !== null ? String(row[column]) : 'NULL'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Bildirim snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SqlOperationsTab;
