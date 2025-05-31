import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Paper, Box, TextField, Button,
  FormControlLabel, Checkbox, CircularProgress, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Alert, Snackbar, Radio, RadioGroup,
  FormControl, FormLabel, InputAdornment, Card, CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import productApi, { InventoryStock, InventoryStockParams } from '../../services/productApi';

// Arama tipi enum
enum SearchType {
  BARCODE = 'barcode',
  PRODUCT = 'product',
}

const InventoryStockPage: React.FC = () => {
  // Ref tanımlamaları
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State tanımlamaları
  const [loading, setLoading] = useState<boolean>(false);
  const [inventoryData, setInventoryData] = useState<InventoryStock[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<SearchType>(SearchType.BARCODE);
  const [searchInput, setSearchInput] = useState<string>('');
  
  // Form alanları için state'ler
  const [barcode, setBarcode] = useState<string>('');
  const [productCode, setProductCode] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [colorCode, setColorCode] = useState<string>('');
  const [itemDim1Code, setItemDim1Code] = useState<string>('');
  const [warehouseCode, setWarehouseCode] = useState<string>('');
  const [showOnlyPositiveStock, setShowOnlyPositiveStock] = useState<boolean>(true);

  // Sayfa yüklendiğinde sadece stoklu ürünleri getir
  useEffect(() => {
    fetchInitialInventoryData();
    // Sayfa yüklendiğinde input'a otomatik odaklan
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // İlk yüklemede sadece stoklu ürünleri getir
  const fetchInitialInventoryData = async () => {
    setLoading(true);
    try {
      const params: InventoryStockParams = {
        showOnlyPositiveStock: true
      };

      const data = await productApi.getInventoryStockMultiPurpose(params);
      setInventoryData(data);
      if (data.length === 0) {
        setError('Stokta ürün bulunamadı');
        setShowError(true);
      }
    } catch (error: any) {
      console.error('Envanter verileri alınırken hata oluştu:', error);
      
      // Daha detaylı hata mesajı göster
      let errorMessage = 'Envanter verileri alınırken bir hata oluştu';
      
      // Backend veritabanı hatası için özel mesaj
      if (error.message?.includes('404')) {
        errorMessage = 'Envanter verileri alınamadı. Sunucu yanıt vermiyor veya API endpoint bulunamadı. Lütfen sistem yöneticinize başvurun.';
      } else if (error.response?.data?.message?.includes('trInventoryItem')) {
        errorMessage = 'Veritabanı şemasında sorun var: "trInventoryItem" tablosu bulunamadı. Lütfen sistem yöneticinize başvurun ve SqlQueries/Envanter.sql dosyasını kullanmasını söyleyin.';
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Arama input'u değiştiğinde
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Arama tipine göre parametreleri ayarla
  const setSearchParams = () => {
    // Önceki arama parametrelerini temizle
    setBarcode('');
    setProductCode('');
    setProductDescription('');

    // Arama tipine göre ilgili parametreyi ayarla
    if (searchType === SearchType.BARCODE) {
      setBarcode(searchInput);
    } else if (searchType === SearchType.PRODUCT) {
      // Eğer sayısal bir değerse ürün kodu, değilse ürün açıklaması olarak ayarla
      if (/^\d+$/.test(searchInput)) {
        setProductCode(searchInput);
      } else {
        setProductDescription(searchInput);
      }
    }
  };

  // Envanter verilerini getir
  const fetchInventoryData = async () => {
    // Arama input'u boşsa ve diğer filtreler de yoksa uyarı göster
    if (!searchInput && !colorCode && !itemDim1Code && !warehouseCode) {
      setError('Lütfen en az bir arama kriteri belirtin');
      setShowError(true);
      return;
    }

    // Arama input'u dolu ama 3 karakterden azsa uyarı göster
    if (searchInput && searchInput.length < 3) {
      setError('Lütfen en az 3 karakter girin');
      setShowError(true);
      return;
    }

    // Arama parametrelerini ayarla
    setSearchParams();

    setLoading(true);
    try {
      const params: InventoryStockParams = {
        barcode: searchType === SearchType.BARCODE ? searchInput : undefined,
        productCode: searchType === SearchType.PRODUCT && /^\d+$/.test(searchInput) ? searchInput : undefined,
        productDescription: searchType === SearchType.PRODUCT && !/^\d+$/.test(searchInput) ? searchInput : undefined,
        colorCode: colorCode || undefined,
        itemDim1Code: itemDim1Code || undefined,
        warehouseCode: warehouseCode || undefined,
        showOnlyPositiveStock
      };

      const data = await productApi.getInventoryStockMultiPurpose(params);
      setInventoryData(data);
      if (data.length === 0) {
        setError('Arama kriterlerine uygun stok bulunamadı');
        setShowError(true);
      }
    } catch (error) {
      console.error('Envanter verileri alınırken hata oluştu:', error);
      setError('Envanter verileri alınırken bir hata oluştu');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Form temizleme
  const handleClearForm = () => {
    setSearchInput('');
    setColorCode('');
    setItemDim1Code('');
    setWarehouseCode('');
    setShowOnlyPositiveStock(true);
    
    // Arama input'una odaklan
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Stoklu ürünleri yeniden getir
    fetchInitialInventoryData();
  };

  // Sayfalama işlemleri
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Hata mesajını kapat
  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Envanter/Stok Durumu
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        {/* Arama tipi seçimi */}
        <Box sx={{ mb: 2 }}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              name="searchType"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
            >
              <FormControlLabel value={SearchType.BARCODE} control={<Radio />} label="Barkod" />
              <FormControlLabel value={SearchType.PRODUCT} control={<Radio />} label="Ürün Kodu/Açıklaması" />
            </RadioGroup>
          </FormControl>
        </Box>
        
        {/* Ana arama alanı */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            placeholder={searchType === SearchType.BARCODE ? "Barkod girin" : "Ürün kodu veya açıklaması girin"}
            variant="outlined"
            size="small"
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyPress={(e) => e.key === 'Enter' && fetchInventoryData()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <QrCodeScannerIcon color="action" />
                </InputAdornment>
              ),
            }}
            inputRef={searchInputRef}
            autoFocus
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={fetchInventoryData}
            disabled={loading}
          >
            Ara
          </Button>
        </Box>
        
        {/* Gelişmiş filtreler */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Gelişmiş Filtreler
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <TextField
                label="Renk Kodu"
                variant="outlined"
                size="small"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}
              />
              
              <TextField
                label="Beden Kodu"
                variant="outlined"
                size="small"
                value={itemDim1Code}
                onChange={(e) => setItemDim1Code(e.target.value)}
                sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}
              />
              
              <TextField
                label="Depo Kodu"
                variant="outlined"
                size="small"
                value={warehouseCode}
                onChange={(e) => setWarehouseCode(e.target.value)}
                sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyPositiveStock}
                  onChange={(e) => setShowOnlyPositiveStock(e.target.checked)}
                />
              }
              label="Sadece stok miktarı sıfırdan büyük olanları göster"
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleClearForm}
                disabled={loading}
                size="small"
              >
                Filtreleri Temizle
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Envanter/Stok Listesi
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="envanter stok tablosu">
                <TableHead>
                  <TableRow>
                    <TableCell>Ürün Kodu</TableCell>
                    <TableCell>Ürün Açıklaması</TableCell>
                    <TableCell>Barkod</TableCell>
                    <TableCell>Renk</TableCell>
                    <TableCell>Beden</TableCell>
                    <TableCell>Depo Kodu</TableCell>
                    <TableCell>Depo Adı</TableCell>
                    <TableCell align="right">Stok Miktarı</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <TableRow 
                        key={index}
                        sx={item.qty <= 0 ? { bgcolor: 'rgba(255, 0, 0, 0.1)' } : {}}
                      >
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell>{item.itemDescription}</TableCell>
                        <TableCell>{item.usedBarcode}</TableCell>
                        <TableCell>{item.colorDescription}</TableCell>
                        <TableCell>{item.itemDim1Code}</TableCell>
                        <TableCell>{item.warehouseCode}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell align="right">{item.qty.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  
                  {inventoryData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Veri bulunamadı. Lütfen arama kriterlerini değiştirin veya yeni bir arama yapın.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {inventoryData.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={inventoryData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Sayfa başına satır:"
              />
            )}
          </>
        )}
      </Paper>
      
      <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InventoryStockPage;
