import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Pagination,
  Box,
  Button,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Search as SearchIcon, 
  Visibility as VisibilityIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Add as AddIcon,
  SentimentVeryDissatisfied as SadIcon
} from '@mui/icons-material';
import { useVendorList } from '../../hooks/useVendorList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface VendorListProps {
  isMobile?: boolean;
}

// Tedarikçi tipi için interface tanımlayalım
// Tedarikçi tipi için interface tanımlayalım
interface Vendor {
  vendorCode: string;
  vendorName: string;
  vendorTypeDescription?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  isActive?: boolean;
  country?: string; // Ülke bilgisi
  city?: string;   // Şehir bilgisi
}

// API'den gelebilecek farklı alan adları için genişletilmiş tip
interface VendorApiResponse extends Vendor {
  // Müşteri/Tedarikçi ortak alan adları
  currAccCode?: string;        // cdCurrAcc tablosundaki kod alanı
  currAccDescription?: string; // cdCurrAcc tablosundaki açıklama alanı
  customerCode?: string;       // Frontend'de müşteri kodu
  customerName?: string;       // Frontend'de müşteri adı
  customerTypeDescription?: string; // Müşteri tipi açıklaması
  officeCountryCode?: string;  // Ülke kodu
  cityDescription?: string;    // Şehir açıklaması
}

// API yanıtı için interface tanımlayalım
interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data?: T[]; // API yanıtında data dizisi de olabilir
  totalRecords?: number; // Toplam kayıt sayısı
  totalCount?: number; // Toplam kayıt sayısı (alternatif alan adı)
}

interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message?: string;
}

const VendorList: React.FC<VendorListProps> = ({ isMobile = false }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  
  // useVendorList hook'unu kullanarak tedarikçileri çekelim
  const { data, isLoading, error, refetch } = useVendorList({
    page,
    pageSize: 10,
    searchTerm: debouncedSearchTerm,
    vendorTypeCode: 1 // Tedarikçi tipi kodu
  });

  // Sayfa yüklendiğinde verileri yeniden çek - log'ları kaldırıyoruz
  // useEffect(() => {
  //   console.log('VendorList: Component mounted, fetching data...');
  //   // İlk yüklemede refetch'e gerek yok, useVendorList zaten veriyi çekiyor
  // }, []);

  // Arama terimini debounce et (en az 3 karakter ve 500ms bekleme süresi)
  useEffect(() => {
    if (inputValue.length >= 3) {
      const handler = setTimeout(() => {
        console.log('VendorList: Search term debounced:', inputValue);
        setDebouncedSearchTerm(inputValue);
      }, 500);
      
      return () => {
        clearTimeout(handler);
      };
    } else if (inputValue.length === 0 && searchTerm !== '') {
      // Arama kutusu temizlendiğinde tüm listeyi göster
      console.log('VendorList: Search term cleared');
      setDebouncedSearchTerm('');
      setSearchTerm('');
    }
  }, [inputValue, searchTerm]);

  // Sayfa yüklenirken konsola bilgi yazdır - log'ları kaldırıyoruz
  // useEffect(() => {
  //   if (data) {
  //     console.log('VendorList: API Response:', data);
  //     console.log('VendorList: Data state:', { 
  //       isLoading, 
  //       responseKeys: Object.keys(data),
  //       dataKeys: data.data ? Object.keys(data.data) : [],
  //       searchTerm: debouncedSearchTerm,
  //       page 
  //     });
  //   }
  // }, [data, isLoading]); // debouncedSearchTerm ve page'i çıkardık, bunlar zaten useVendorList'e parametre olarak geçiliyor

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(inputValue);
    setDebouncedSearchTerm(inputValue);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.length >= 3) {
      handleSearchSubmit();
    }
  };

  const handleViewVendor = (vendorCode: string) => {
    // App.tsx'te /vendors/:vendorCode route'u CustomerDetail bileşenine yönlendiriyor
    navigate(`/vendors/${vendorCode}`);
  };

  const handleEditVendor = (vendorCode: string) => {
    // App.tsx'te /vendors/edit/:vendorCode route'u CustomerEdit bileşenine yönlendiriyor
    navigate(`/vendors/edit/${vendorCode}`);
  };

  const handleAddVendor = () => {
    navigate('/vendors/create');
  };

  // API yanıtından tedarikçi listesini al
  let vendors: Vendor[] = [];
  let totalPages = 1;
  
  if (data) {
    try {
      // API yanıtının yapısını kontrol et - log'ları kaldırıyoruz
      // console.log('Raw API response structure:', data);
      
      // API yanıtının içeriğini daha detaylı görelim - log'ları kaldırıyoruz
      // if (data.data) {
      //   console.log('API response data structure:', JSON.stringify(data.data, null, 2));
      // }
      
      // data.data yapısı (en yaygın durum)
      if (data.data) {
        const responseData = data.data as any; // any tipine dönüştür
        
        // Müşteri API'sinin döndürdüğü yapıyı kontrol edelim
        if (responseData.data && Array.isArray(responseData.data)) {
          // Müşteri API'si data.data.data dizisi döndürüyor olabilir
          vendors = responseData.data;
          totalPages = responseData.totalPages || responseData.totalCount / 10 || 1;
          // console.log('Found vendors in responseData.data:', vendors.length);
        }
        // responseData.items yapısı
        else if (responseData.items && Array.isArray(responseData.items)) {
          vendors = responseData.items;
          // totalPages ve totalRecords özelliklerini any tipinde erişim
          totalPages = responseData.totalPages || responseData.totalRecords || 1;
          // console.log('Found vendors in responseData.items:', vendors.length);
        }
        // responseData kendisi bir dizi ise
        else if (Array.isArray(responseData)) {
          vendors = responseData;
          // console.log('Found vendors in responseData array:', vendors.length);
        }
      }
      // data kendisi bir dizi ise
      else if (Array.isArray(data)) {
        vendors = data;
        // console.log('Found vendors in data array:', vendors.length);
      }
      
      // Veri dönüşümü yap - VendorApiResponse tipini kullan
      vendors = vendors.map((item: any) => {
        // console.log('Processing vendor item:', item);
        return {
          vendorCode: item.vendorCode || item.currAccCode || item.customerCode || '',
          vendorName: item.vendorName || item.currAccDescription || item.customerName || '',
          vendorTypeDescription: item.vendorTypeDescription || item.customerTypeDescription || 'Tedarikçi',
          phone: item.phone || '-',
          email: item.email || '-',
          taxNumber: item.taxNumber || '-',
          isActive: item.isActive !== false,
          country: item.officeCountryCode || '-',
          city: item.cityDescription || '-'
        };
      });
      
    } catch (error) {
      console.error('Error processing vendor data:', error);
    }
  }
  
  // Log mesajlarını kaldırıyoruz, döngü sorununu çözmek için
  // console.log('Final processed vendors list:', vendors.length, 'items, totalPages:', totalPages);

  const renderMobileView = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder="Tedarikçi Ara..."
            value={inputValue}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              ),
              endAdornment: (
                <IconButton 
                  size="small" 
                  onClick={handleSearchSubmit}
                  disabled={inputValue.length < 3 && inputValue.length > 0}
                >
                  <SearchIcon />
                </IconButton>
              )
            }}
            sx={{ width: '100%' }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddVendor}
            size="small"
          >
            Yeni Tedarikçi
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
          {vendors.map((vendor) => (
            <Card key={vendor.vendorCode} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{vendor.vendorName}</Typography>
                  <Box>
                    <Tooltip title="Görüntüle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewVendor(vendor.vendorCode)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzenle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditVendor(vendor.vendorCode)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {vendor.vendorCode} - {vendor.vendorTypeDescription || 'Tedarikçi'}
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <PlaceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">{vendor.taxNumber || '-'}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">{vendor.phone || '-'}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">{vendor.email || '-'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      </Box>
    );
  };

  const renderDesktopView = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder="Tedarikçi Ara..."
            value={inputValue}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              ),
              endAdornment: (
                <IconButton 
                  size="small" 
                  onClick={handleSearchSubmit}
                  disabled={inputValue.length < 3 && inputValue.length > 0}
                >
                  <SearchIcon />
                </IconButton>
              )
            }}
            sx={{ width: '300px' }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddVendor}
          >
            Yeni Tedarikçi
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tedarikçi Kodu</TableCell>
                <TableCell>Tedarikçi Adı</TableCell>
                <TableCell>Ülke</TableCell>
                <TableCell>Şehir</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Tedarikçi Tipi</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.vendorCode}>
                  <TableCell>{vendor.vendorCode}</TableCell>
                  <TableCell>{vendor.vendorName}</TableCell>
                  <TableCell>{vendor.country}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell>{vendor.phone || '-'}</TableCell>
                  <TableCell>{vendor.email || '-'}</TableCell>
                  <TableCell>{vendor.vendorTypeDescription || 'Tedarikçi'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Görüntüle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewVendor(vendor.vendorCode)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzenle">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditVendor(vendor.vendorCode)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      </Box>
    );
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="warning">
          Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/login')}
        >
          Giriş Yap
        </Button>
      </Box>
    );
  }

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ ml: 2 }}>
        Tedarikçi listesi yükleniyor...
      </Typography>
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        <Typography variant="body1">Tedarikçi listesi yüklenirken bir hata oluştu:</Typography>
        <Typography variant="body2">{error instanceof Error ? error.message : 'Bilinmeyen hata'}</Typography>
      </Alert>
      <Button 
        variant="outlined" 
        color="primary" 
        sx={{ mt: 2 }}
        onClick={() => refetch()}
      >
        Yeniden Dene
      </Button>
    </Box>
  );

  // Veri yoksa veya boşsa özel mesaj göster
  // API yanıtı farklı formatlarda gelebileceği için tüm olası durumları kontrol ediyoruz
  if (!data || 
      (!data.data) || 
      (data.data && 'items' in data.data && (!data.data.items || data.data.items.length === 0) && 
       !((data.data as any).data && Array.isArray((data.data as any).data))) || 
      (vendors.length === 0 && !isLoading)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <SadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Tedarikçi bulunamadı
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {debouncedSearchTerm 
            ? `"${debouncedSearchTerm}" aramasına uygun tedarikçi bulunamadı.` 
            : 'Henüz tedarikçi kaydı bulunmuyor.'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddVendor}
          sx={{ mt: 2 }}
        >
          Yeni Tedarikçi Ekle
        </Button>
      </Box>
    );
  }

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default VendorList;